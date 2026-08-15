const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const { generateStructuredJSON } = require('./geminiService');

/**
 * Extracts raw text from a PDF file using pdf-parse,
 * then calls Gemini to analyze and extract structured JSON resume data.
 * Retries once on transient failures before falling back.
 */
async function parseResume(filePath) {
  const fileBuffer = await fs.readFile(filePath);
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
