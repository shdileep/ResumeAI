import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Configure pdfjs worker for Vite/modern bundlers
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('PDF worker configuration warning:', e);
}

export interface ParsedDocument {
  text: string;
  filename: string;
  fileSize: number;
  format: string;
}

/**
 * Strips basic RTF formatting tags to extract plain text
 */
function stripRTF(rtf: string): string {
  return rtf
    .replace(/\\par[d]?/g, '\n')
    .replace(/\{\\*?\\[^{}]+;\}?/g, '')
    .replace(/\\([a-z]{1,32})(-?[0-9]+)? ?/gi, '')
    .replace(/[\{\}]/g, '')
    .replace(/\\[\'\\]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extracts plain text from an uploaded resume or JD file.
 * Supports: .pdf, .docx, .doc, .txt, .rtf, .odt
 */
export async function extractTextFromFile(file: File): Promise<ParsedDocument> {
  if (!file) {
    throw new Error('No file provided.');
  }

  // Max 10MB limit
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum allowed size is 10MB.`);
  }

  if (file.size === 0) {
    throw new Error('The uploaded file is empty (0 bytes).');
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  let extractedText = '';

  try {
    if (ext === 'pdf') {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useSystemFonts: true,
        disableFontFace: true,
      });
      const pdf = await loadingTask.promise;
      const textParts: string[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let lastY: number | null = null;
        let pageStr = '';

        for (const item of textContent.items as any[]) {
          if ('str' in item) {
            // Detect newlines from vertical coordinate shifts
            if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
              pageStr += '\n';
            } else if (pageStr.length > 0 && !pageStr.endsWith(' ') && !pageStr.endsWith('\n')) {
              pageStr += ' ';
            }
            pageStr += item.str;
            lastY = item.transform[5];
          }
        }
        textParts.push(pageStr.trim());
      }
      extractedText = textParts.join('\n\n').trim();

    } else if (ext === 'docx') {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value.trim();

    } else if (ext === 'txt') {
      extractedText = (await file.text()).trim();

    } else if (ext === 'rtf') {
      const rawRtf = await file.text();
      extractedText = stripRTF(rawRtf);

    } else if (ext === 'odt' || ext === 'doc') {
      // Binary / text stream fallback extraction
      const arrayBuffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawStr = decoder.decode(arrayBuffer);
      // Clean visible ASCII and printable Unicode strings
      const cleaned = rawStr
        .replace(/<[^>]+>/g, ' ') // Strip XML/HTML tags if present (ODT content.xml)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      extractedText = cleaned;

    } else {
      // Generic text fallback
      extractedText = (await file.text()).trim();
    }
  } catch (err: any) {
    console.error('File extraction error:', err);
    throw new Error(`Failed to read ${file.name}: ${err.message || 'File corrupted or unreadable'}`);
  }

  if (!extractedText || extractedText.length < 20) {
    throw new Error(`Could not extract readable text from "${file.name}". Please ensure it contains selectable text, or try pasting the content directly.`);
  }

  return {
    text: extractedText,
    filename: file.name,
    fileSize: file.size,
    format: ext.toUpperCase() || 'FILE',
  };
}
