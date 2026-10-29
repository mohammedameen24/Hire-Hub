const { generateStructuredJSON } = require('./geminiService');
const { calculateMatchScoreOffline } = require('./aiFallbackEngine');

async function calculateMatchScore(candidateProfile, job) {
  const candidateSkills = Array.isArray(candidateProfile?.skills)
    ? candidateProfile.skills.join(', ')
    : candidateProfile?.skills || '';
  const candidateExperience = candidateProfile?.experience || '';
  const resumeText = candidateProfile?.resume_text || '';

  const jobTitle = job.title || '';
  const jobDescription = job.description || '';
  const jobRequirements = job.requirements || '';
  const requiredSkills = Array.isArray(job.skills_required)
    ? job.skills_required.join(', ')
    : job.skills_required || '';

  const prompt = `
You are an expert HR AI match engine. Compare the candidate's profile/resume with the job requirements.

Candidate Info:
- Skills: ${candidateSkills}
- Experience: ${candidateExperience}
- Resume Snippet: ${resumeText.slice(0, 3000)}

Job Info:
- Title: ${jobTitle}
- Description: ${jobDescription}
- Requirements: ${jobRequirements}
- Required Skills: ${requiredSkills}

Return ONLY a JSON object:
{
  "match_score": 82,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill3"]
}
Note: match_score must be an integer between 0 and 100.
`;

  try {
    const result = await generateStructuredJSON(prompt);
    return {
      match_score: typeof result.match_score === 'number' ? Math.min(100, Math.max(0, Math.round(result.match_score))) : 60,
      matched_skills: Array.isArray(result.matched_skills) ? result.matched_skills : [],
      missing_skills: Array.isArray(result.missing_skills) ? result.missing_skills : [],
    };
  } catch (err) {
    console.log('[MatchScore] Using offline algorithmic backup engine for match score calculation.');
    return calculateMatchScoreOffline(candidateProfile, job);
  }
}

module.exports = { calculateMatchScore };

