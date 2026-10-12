export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const { prompt, systemPrompt, jsonMode, maxTokens } = req.body || {};

    const responseText = await executeAIWithFallback({
      prompt,
      systemPrompt,
      jsonMode: Boolean(jsonMode),
      maxTokens: maxTokens || 2048,
      env: process.env
    });

    res.status(200).json({ text: responseText });
  } catch (err: any) {
    console.error('[Vercel AI Completion Error]:', err.message || err);
    res.status(500).json({ error: err.message || 'AI generation failed' });
  }
}

interface AIRequestParams {
  prompt: string;
  systemPrompt?: string;
  jsonMode?: boolean;
  maxTokens?: number;
  env: Record<string, string | undefined>;
}

async function executeAIWithFallback(params: AIRequestParams): Promise<string> {
  const { prompt, systemPrompt, jsonMode, maxTokens, env } = params;
  const errors: string[] = [];

  // Order of providers: Groq -> OpenAI -> Anthropic Claude
  // 1. Groq
  const groqKey = env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const text = await callGroq({ groqKey, prompt, systemPrompt, jsonMode, maxTokens });
      if (text) return text;
    } catch (e: any) {
      errors.push(`Groq: ${e.message}`);
    }
  }

  // 2. OpenAI
  const openaiKey = env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const text = await callOpenAI({ openaiKey, prompt, systemPrompt, jsonMode, maxTokens });
      if (text) return text;
    } catch (e: any) {
      errors.push(`OpenAI: ${e.message}`);
    }
  }

  // 3. Anthropic Claude
  const anthropicKey = env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const text = await callAnthropic({ anthropicKey, prompt, systemPrompt, maxTokens });
      if (text) return text;
    } catch (e: any) {
      errors.push(`Claude: ${e.message}`);
    }
  }

  throw new Error(`All configured AI providers failed. Details: ${errors.join(' | ')}`);
}

async function callGroq(args: { groqKey: string; prompt: string; systemPrompt?: string; jsonMode?: boolean; maxTokens?: number }) {
  const messages: any[] = [];
  if (args.systemPrompt) {
    messages.push({ role: 'system', content: args.systemPrompt });
  }
  messages.push({ role: 'user', content: args.prompt });

  const models = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'];
  let lastErr = '';

  for (const model of models) {
    try {
      const payload: any = {
        model,
        messages,
        max_tokens: Math.min(args.maxTokens || 1024, 1500)
      };
      if (args.jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${args.groqKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || `HTTP ${res.status}`);
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) return content;
    } catch (err: any) {
      lastErr = err.message;
    }
  }

  throw new Error(lastErr || 'Groq models failed');
}

async function callOpenAI(args: { openaiKey: string; prompt: string; systemPrompt?: string; jsonMode?: boolean; maxTokens?: number }) {
  const messages: any[] = [];
  if (args.systemPrompt) {
    messages.push({ role: 'system', content: args.systemPrompt });
  }
  messages.push({ role: 'user', content: args.prompt });

  const payload: any = {
    model: 'gpt-4o-mini',
    messages,
    max_tokens: args.maxTokens || 1500
  };
  if (args.jsonMode) {
    payload.response_format = { type: 'json_object' };
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${args.openaiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error('No content returned from OpenAI');
  return content;
}

async function callAnthropic(args: { anthropicKey: string; prompt: string; systemPrompt?: string; maxTokens?: number }) {
  const payload: any = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: args.maxTokens || 1500,
    messages: [{ role: 'user', content: args.prompt }]
  };
  if (args.systemPrompt) {
    payload.system = args.systemPrompt;
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': args.anthropicKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `HTTP ${res.status}`);
  }

  const content = data.content?.[0]?.text?.trim();
  if (!content) throw new Error('No content returned from Anthropic');
  return content;
}
