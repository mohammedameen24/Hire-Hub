const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GEMINI_API_KEY } = require('../config/env');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Calls Gemini with a prompt and parses the response as strict JSON.
 * Strips markdown fences if present (```json ... ```).
 * Retries once on parse failure.
 */
async function generateStructuredJSON(prompt) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  let text = result.response.text().trim();

  // Strip markdown code fences
  text = text.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  // Also strip plain ``` fences
  text = text.replace(/^```\s*/i, '').replace(/\s*```$/, '').trim();

  try {
    return JSON.parse(text);
  } catch {
    // Try to extract JSON object/array from the text
    const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error('Failed to parse Gemini response as JSON');
      }
    }
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

module.exports = { generateStructuredJSON };
