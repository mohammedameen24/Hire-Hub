const pdfParse = require('pdf-parse');
const { generateStructuredJSON } = require('./geminiService');
const { parseResumeOffline } = require('./aiFallbackEngine');

/**
 * Parses a PDF from a Buffer, then calls Gemini for structured analysis.
 * Retries once on transient Gemini failures before falling back.
 *
 * @param {Buffer} buffer - PDF file buffer
 */
async function parseResume(buffer) {
  const pdfData = await pdfParse(buffer);
  const rawText = pdfData.text?.trim() || '';

  if (!rawText) {
    console.warn('[ResumeParser] PDF produced no extractable text — possibly scanned/image-only PDF.');
    return {
      rawText: '',
      parsedData: {
        target_role: 'Software Professional',
        skills: [],
        education: '',
        experience: '',
        matched_skills: [],
        missing_skills: [],
        lacking_skills: [],
        suggestions: [],
        match_score: 50,
        ai_analysis_failed: true,
        ai_failure_reason: 'no_text',
      },
    };
  }

  const prompt = `
You are an expert HR recruiter and career mentor.
Analyze the following resume text extracted from a candidate's PDF.

Goals:
1. Detect the specific TARGET JOB ROLE or career position the employee is seeking (from their objective, summary, headline, or career history, e.g. "Full Stack Developer", "Frontend Engineer", "Data Scientist", "DevOps Engineer", "UI/UX Designer", "Product Manager", etc.).
2. Extract all technical and professional skills present in the resume.
3. Critically analyze what essential skills, tools, or industry competencies the employee LACKS for that specific target job role in the modern hiring market.
4. Provide actionable suggestions on how they can bridge their skill gap to become more competitive for that role.

Resume Text:
"""
${rawText.slice(0, 8000)}
"""

Return ONLY a valid JSON object matching this schema (no markdown, no extra text):
{
  "full_name": "extracted name or empty string",
  "phone": "extracted phone number or empty string",
  "location": "extracted location/city or empty string",
  "target_role": "specific job role or title the employee is seeking",
  "skills": ["skill1", "skill2"],
  "education": "summary of education",
  "experience": "summary of work experience",
  "matched_skills": ["key skills found in the resume that align with the target role"],
  "lacking_skills": ["important skills the employee lacks for the target role that employers look for"],
  "missing_skills": ["important skills the employee lacks for the target role"],
  "suggestions": ["actionable advice to bridge the skill gap and improve resume for the target role"],
  "match_score": 85
}
`;

  // Attempt Gemini call with one retry on failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const parsedData = await generateStructuredJSON(prompt);
      // Ensure target_role and lacking_skills are present and normalized
      const targetRole = parsedData.target_role || 'Software Professional';
      const lacking = Array.isArray(parsedData.lacking_skills) && parsedData.lacking_skills.length > 0
        ? parsedData.lacking_skills
        : (Array.isArray(parsedData.missing_skills) ? parsedData.missing_skills : []);

      return {
        rawText,
        parsedData: {
          ...parsedData,
          target_role: targetRole,
          lacking_skills: lacking,
          missing_skills: lacking,
          matched_skills: Array.isArray(parsedData.matched_skills) ? parsedData.matched_skills : (parsedData.skills || []),
          suggestions: Array.isArray(parsedData.suggestions) ? parsedData.suggestions : [],
          match_score: typeof parsedData.match_score === 'number' ? Math.min(100, Math.max(0, Math.round(parsedData.match_score))) : 75,
        },
      };
    } catch (err) {
      console.error(`[ResumeParser] Gemini attempt ${attempt}/2 failed:`, {
        message: err.message,
        status: err.status,
        code: err.code,
        timestamp: new Date().toISOString(),
      });
      // If error is network-related, timeout, or rate-limited, skip retry and fall back immediately
      const isFatalOrNetwork = err.message?.includes('fetch failed') ||
        err.message?.includes('ENOTFOUND') ||
        err.message?.includes('timed out') ||
        err.message?.includes('429');
      if (isFatalOrNetwork) {
        break;
      }
      if (attempt < 2) {
        // Brief pause before retry
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Fallback to high-accuracy offline algorithmic NLP engine when AI is unavailable
  console.log('[ResumeParser] Using offline algorithmic backup engine for resume analysis.');
  return parseResumeOffline(rawText);
}

module.exports = { parseResume };

