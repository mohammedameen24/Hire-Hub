const pdfParse = require('pdf-parse');
const fs = require('fs').promises;
const { generateStructuredJSON } = require('./geminiService');

/**
 * Extracts raw text from a PDF file using pdf-parse,
 * then calls Gemini to analyze and extract structured JSON resume data.
 */
async function parseResume(filePath) {
  const fileBuffer = await fs.readFile(filePath);
  const pdfData = await pdfParse(fileBuffer);
  const rawText = pdfData.text || '';

  const prompt = `
You are an expert HR resume analyzer. Analyze the following raw text extracted from a candidate's resume and extract structured information.

Resume Text:
"""
${rawText.slice(0, 8000)}
"""

Return ONLY a JSON object with the following structure:
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

  try {
    const parsedData = await generateStructuredJSON(prompt);
    return {
      rawText,
      parsedData,
    };
  } catch (err) {
    console.error('Gemini resume parsing fallback due to:', err.message);
    // Fallback if AI call fails
    return {
      rawText,
      parsedData: {
        skills: [],
        education: '',
        experience: '',
        matched_skills: [],
        missing_skills: [],
        suggestions: ['Could not run full AI analysis on resume.'],
        match_score: 50,
      },
    };
  }
}

module.exports = { parseResume };
