import { GoogleGenAI, Type } from "@google/genai";
import { ATSAnalysis, InterviewInsight, ZeroAIScore } from "../types";

// Initialize the client
// NOTE: In a production app, never expose keys on the client side.
// This is for demonstration purposes within the constraints.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const MODEL_NAME = "gemini-2.5-flash";

export const generateProfessionalSummary = async (role: string, keywords: string): Promise<string> => {
  if (!process.env.API_KEY) return "AI Summary unavailable: No API Key provided.";
  
  try {
    const prompt = `Write a professional, ATS-friendly resume summary (approx 50-70 words) for a fresher applying for the role of "${role}". 
    Focus on these skills/keywords: ${keywords}. 
    Tone: Professional, ambitious, and precise.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating summary. Please try again.";
  }
};

export const polishSentence = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) return text;
  if (!text || text.length < 5) return text;

  try {
    const prompt = `Rewrite the following sentence to be a professional, impactful resume bullet point. Use strong action verbs and quantitative metrics if possible. Keep it concise.
    Original: "${text}"`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text?.trim() || text;
  } catch (error) {
    console.error("Gemini Polish Error:", error);
    return text;
  }
};

export const getChatResponse = async (history: {role: string, parts: {text: string}[]}[], newMessage: string): Promise<string> => {
  if (!process.env.API_KEY) return "I'm sorry, I can't connect to the server right now.";

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: "You are SH Dileep, a friendly and expert AI Resume Assistant for the ResumeAI platform. Your goal is to help users (mostly freshers) build high-quality, ATS-compliant resumes. You are encouraging, professional, and concise. You can suggest improvements, explain resume sections, and provide career advice. Always answer in a helpful, conversational tone.",
      },
      history: history
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I didn't catch that. Could you rephrase?";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "I'm having trouble thinking right now. Please try again later.";
  }
};

export const enhanceResumeText = async (currentText: string, jobDescription: string): Promise<string> => {
  if (!process.env.API_KEY) return currentText;

  try {
    const prompt = `You are an expert resume writer. Rewrite the following resume content to better align with the provided Job Description.
    
    Job Description:
    ${jobDescription}

    Current Content:
    ${currentText}

    Rules:
    1. Improve grammar and clarity.
    2. Incorporate relevant keywords from the JD naturally.
    3. Use active voice and action verbs.
    4. Return ONLY the enhanced text, no conversational filler.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || currentText;
  } catch (error) {
    console.error("Gemini Error:", error);
    return currentText;
  }
};

export const analyzeResumeATS = async (resumeText: string): Promise<ATSAnalysis | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const prompt = `Analyze the following resume text for ATS (Applicant Tracking System) compliance. 
    Resume Text: "${resumeText.substring(0, 5000)}" 
    
    Return the response in strictly valid JSON format matching this schema:
    {
      "score": number (0-100),
      "missingKeywords": string[] (list of 3-5 important missing generic tech keywords),
      "suggestions": string[] (3 actionable improvements),
      "sectionAnalysis": [
        { "section": "Summary", "status": "Good" | "Needs Improvement", "feedback": "string" },
        { "section": "Experience", "status": "Good" | "Needs Improvement", "feedback": "string" }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            missingKeywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            suggestions: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            sectionAnalysis: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  status: { type: Type.STRING },
                  feedback: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as ATSAnalysis;

  } catch (error) {
    console.error("Gemini ATS Error:", error);
    return null;
  }
};

export const generateInterviewInsights = async (
  company: string,
  role: string,
  location: string,
  jobDesc: string
): Promise<InterviewInsight | null> => {
  if (!process.env.API_KEY) return null;

  try {
    const prompt = `Provide detailed interview insights for the company "${company}" for the role of "${role}" in location "${location}".
    Job Description context: "${jobDesc}".

    Please provide:
    1. Estimated Employee Count & Global Branches (approximate market data).
    2. Estimated Starting Salary Package & Hike Trends for this role.
    3. Growth Prospects & Review Summary (culture).
    4. 5-7 likely Interview Questions (mix of technical and HR based on the JD/Role).
    5. 3 Preparation Tips.

    Return STRICT JSON matching this schema:
    {
      "companyInfo": {
        "employeeCount": "string",
        "branches": "string",
        "salaryPackage": "string",
        "hikeTrends": "string",
        "growthProspects": "string"
      },
      "questions": ["string", "string"],
      "tips": ["string"]
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            companyInfo: {
              type: Type.OBJECT,
              properties: {
                employeeCount: { type: Type.STRING },
                branches: { type: Type.STRING },
                salaryPackage: { type: Type.STRING },
                hikeTrends: { type: Type.STRING },
                growthProspects: { type: Type.STRING }
              }
            },
            questions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            tips: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as InterviewInsight;
  } catch (error) {
    console.error("Gemini Interview AI Error:", error);
    return null;
  }
};

export const detectAIProbability = async (text: string): Promise<ZeroAIScore> => {
  if (!process.env.API_KEY) return { aiPercentage: 0, reasoning: "API unavailable", verdict: "Human-Written" };

  try {
    const prompt = `Analyze the following text for signs of AI generation (repetitive structure, lack of burstiness, generic phrasing, perfect grammar but low nuance). 
    Text: "${text.substring(0, 3000)}"
    
    Return a strict JSON:
    {
      "aiPercentage": number (0-100 estimate),
      "reasoning": "string (brief explanation)",
      "verdict": "string ('Human-Written' | 'Likely AI-Generated' | 'Mixed/Edited')"
    }`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aiPercentage: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            verdict: { type: Type.STRING }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return result as ZeroAIScore;
  } catch (error) {
    console.error("ZeroAI Detect Error:", error);
    return { aiPercentage: 0, reasoning: "Error analyzing content", verdict: "Human-Written" };
  }
};

export const humanizeContent = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) return text;
  
  try {
    const prompt = `Rewrite the following text to make it sound more human, authentic, and natural. 
    Increase sentence variety (burstiness), use more conversational but professional transitions, and remove robotic phrasing. 
    It should NOT look like it was written by an AI.
    
    Original Text:
    ${text}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || text;
  } catch (error) {
    console.error("ZeroAI Humanize Error:", error);
    return text;
  }
};
