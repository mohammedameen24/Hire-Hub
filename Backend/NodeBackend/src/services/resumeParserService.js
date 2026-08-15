const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const https = require('https');
const http = require('http');
const { generateStructuredJSON } = require('./geminiService');

/**
 * Fetches a PDF from a URL and returns it as a Buffer.
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Extracts raw text from a PDF (local path or remote URL),
 * then calls Gemini to analyze and extract structured JSON resume data.
 * Retries once on transient failures before falling back.
 *
 * @param {string} filePathOrUrl - Local file path or Cloudinary/remote URL
 * @param {boolean} isRemote     - True when filePathOrUrl is a remote URL
 */
async function parseResume(filePathOrUrl, isRemote = false) {
  let fileBuffer;
  if (isRemote) {
    fileBuffer = await fetchUrl(filePathOrUrl);
  } else {
    fileBuffer = await fs.readFile(filePathOrUrl);
  }

  const pdfData = await pdfParse(fileBuffer);
  const rawText = pdfData.text?.trim() || '';

  if (!rawText) {
    console.warn('[ResumeParser] PDF produced no extractable text — possibly scanned/image-only PDF.');
    return {
      rawText: '',
      parsedData: {
        skills: [],
        education: '',
        experience: '',
        matched_skills: [],
        missing_skills: [],
        suggestions: [],
        match_score: 50,
        ai_analysis_failed: true,
        ai_failure_reason: 'no_text',
      },
    };
  }

  const prompt = `
You are an expert HR resume analyzer. Analyze the following raw text extracted from a candidate's resume and extract structured information.

Resume Text:
"""
${rawText.slice(0, 8000)}
"""

Return ONLY a valid JSON object with the following structure (no markdown, no extra text):
{
  "full_name": "extracted name or empty string",
  "phone": "extracted phone number or empty string",
  "location": "extracted location/city or empty string",
  "skills": ["skill1", "skill2"],
  "education": "summary of education",
  "experience": "summary of work experience",
  "matched_skills": ["top key professional skills found"],
  "missing_skills": ["suggested industry skills to consider adding"],
  "suggestions": ["actionable feedback to improve resume impact"],
  "match_score": 85
}
`;

  // Attempt Gemini call with one retry on failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const parsedData = await generateStructuredJSON(prompt);
      return { rawText, parsedData };
    } catch (err) {
      console.error(`[ResumeParser] Gemini attempt ${attempt} failed:`, err.message);
      if (attempt < 2) {
        // Brief pause before retry
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }

  // Both attempts failed — return a clean fallback (no misleading suggestion text)
  console.error('[ResumeParser] All Gemini attempts failed. Returning fallback data.');
  return {
    rawText,
    parsedData: {
      skills: [],
      education: '',
      experience: '',
      matched_skills: [],
      missing_skills: [],
      suggestions: [],
      match_score: 50,
      ai_analysis_failed: true,
      ai_failure_reason: 'gemini_error',
    },
  };
}

module.exports = { parseResume };
