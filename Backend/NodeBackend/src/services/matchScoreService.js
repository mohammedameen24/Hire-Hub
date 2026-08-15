const { generateStructuredJSON } = require('./geminiService');

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
    console.error('Match score calculation fallback:', err.message);
    // Simple programmatic fallback if AI fails
    const reqSkillsArr = (Array.isArray(job.skills_required) ? job.skills_required : [])
      .flatMap((s) => String(s).split(/[\s,]+/))
      .map((s) => s.toLowerCase())
      .filter(Boolean);

    // Expand candidate skills — split on spaces/commas in case any are multi-word entries
    const candSkillsArr = (Array.isArray(candidateProfile?.skills) ? candidateProfile.skills : [])
      .flatMap((s) => String(s).split(/[\s,]+/))
      .map((s) => s.toLowerCase())
      .filter(Boolean);

    const matched = reqSkillsArr.filter((s) => candSkillsArr.some((cs) => cs.includes(s) || s.includes(cs)));
    const missing = reqSkillsArr.filter((s) => !matched.includes(s));
    const score = reqSkillsArr.length > 0 ? Math.round((matched.length / reqSkillsArr.length) * 100) : 70;

    return {
      match_score: score,
      matched_skills: matched,
      missing_skills: missing,
    };
  }
}

module.exports = { calculateMatchScore };
