const { generateStructuredJSON } = require('./geminiService');
const { getJobRecommendationsOffline } = require('./aiFallbackEngine');

async function getJobRecommendations(candidateProfile, availableJobs, limit = 5) {
  if (!availableJobs || availableJobs.length === 0) {
    return [];
  }

  const jobsSummary = availableJobs.map((j) => ({
    id: j._id.toString(),
    title: j.title,
    location: j.location,
    company: j.employerId?.company_name || 'Employer',
    skills: j.skills_required,
    description: j.description?.slice(0, 200),
  }));

  const candidateSkills = Array.isArray(candidateProfile?.skills)
    ? candidateProfile.skills.join(', ')
    : candidateProfile?.skills || '';

  const hasCandidateData = Boolean(
    (candidateProfile?.skills && candidateProfile.skills.length > 0) ||
    (candidateProfile?.resume_text && candidateProfile.resume_text.trim()) ||
    (candidateProfile?.experience && candidateProfile.experience.trim())
  );

  if (!hasCandidateData) {
    return [];
  }

  const prompt = `
You are a career recommendation assistant. Match the candidate's skills and profile with the list of jobs provided.

Candidate Skills: ${candidateSkills}
Candidate Location: ${candidateProfile?.location || 'Any'}
Candidate Experience: ${candidateProfile?.experience || 'Not specified'}

Available Jobs:
${JSON.stringify(jobsSummary, null, 2)}

Return ONLY a JSON array of up to ${limit} objects sorted by best match score descending:
[
  {
    "job_id": "id string",
    "score": 90,
    "matched_skills": ["skill1"]
  }
]
`;

  try {
    const recommendations = await generateStructuredJSON(prompt);
    if (!Array.isArray(recommendations)) return [];

    // Map recommendation scores back to full job documents
    const recMap = new Map(recommendations.map((r) => [r.job_id || r.id, r]));

    const result = [];
    for (const job of availableJobs) {
      const rec = recMap.get(job._id.toString());
      if (rec) {
        const rawScore = rec.score || rec.match_score || 75;
        const finalScore = typeof rawScore === 'number' ? Math.min(100, Math.max(0, Math.round(rawScore))) : 75;
        result.push({
          _id: job._id,
          job_id: job._id,
          title: job.title,
          company: job.employerId?.company_name || 'Company',
          location: job.location,
          salary: job.salary,
          job_type: job.job_type,
          score: finalScore,
          match_score: finalScore,
          matched_skills: rec.matched_skills || job.skills_required || [],
        });
      }
    }

    result.sort((a, b) => b.score - a.score);
    return result.slice(0, limit);
  } catch (err) {
    console.log('[Recommendations] Using offline algorithmic backup engine for job recommendations.');
    return getJobRecommendationsOffline(candidateProfile, availableJobs, limit);
  }
}

module.exports = { getJobRecommendations };

