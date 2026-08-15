const { generateStructuredJSON } = require('./geminiService');

async function rankApplicants(job, applicationsWithProfiles) {
  if (!applicationsWithProfiles || applicationsWithProfiles.length === 0) {
    return [];
  }

  const applicantsData = applicationsWithProfiles.map((app) => ({
    applicationId: app._id.toString(),
    applicantId: app.jobSeekerId?._id ? app.jobSeekerId._id.toString() : app._id.toString(),
    name: app.profile?.full_name || app.jobSeekerId?.full_name || 'Candidate',
    skills: app.profile?.skills || [],
    experience: app.profile?.experience || '',
    resumeText: (app.profile?.resume_text || '').slice(0, 1000),
    existingScore: app.match_score,
  }));

  const prompt = `
You are an expert HR applicant ranking algorithm. Rank the candidates for the job post below.

Job Details:
- Title: ${job.title}
- Description: ${job.description}
- Required Skills: ${JSON.stringify(job.skills_required)}

Applicants:
${JSON.stringify(applicantsData, null, 2)}

Return ONLY a JSON array of candidates sorted from highest rank to lowest rank:
[
  {
    "applicationId": "id string",
    "score": 92,
    "matched_skills": ["skill1", "skill2"]
  }
]
`;

  try {
    const rankings = await generateStructuredJSON(prompt);
    const rankMap = new Map(
      rankings.map((r) => [String(r.applicationId || r.id || ''), r])
    );

    const result = applicationsWithProfiles.map((app) => {
      const rankInfo = rankMap.get(String(app._id));
      const score = rankInfo?.score ?? app.match_score ?? 70;
      const matched_skills = rankInfo?.matched_skills ?? app.matched_skills ?? app.profile?.skills ?? [];

      return {
        _id: app._id,
        id: app._id,
        user_id: app.jobSeekerId?._id || app._id,
        name: app.profile?.full_name || app.jobSeekerId?.full_name || 'Candidate',
        full_name: app.profile?.full_name || app.jobSeekerId?.full_name || 'Candidate',
        email: app.jobSeekerId?.email || '',
        match_score: score,
        score: score,
        matched_skills: matched_skills,
        status: app.status,
        resume_url: app.profile?.resume_url || '',
        applied_at: app.createdAt,
      };
    });

    result.sort((a, b) => b.match_score - a.match_score);
    return result;
  } catch (err) {
    console.error('Applicant ranking fallback:', err.message);
    // Fallback sorting by existing match_score or index
    return applicationsWithProfiles.map((app) => ({
      _id: app._id,
      id: app._id,
      user_id: app.jobSeekerId?._id || app._id,
      name: app.profile?.full_name || app.jobSeekerId?.full_name || 'Candidate',
      full_name: app.profile?.full_name || app.jobSeekerId?.full_name || 'Candidate',
      email: app.jobSeekerId?.email || '',
      match_score: app.match_score || 70,
      score: app.match_score || 70,
      matched_skills: app.matched_skills || app.profile?.skills || [],
      status: app.status,
      resume_url: app.profile?.resume_url || '',
      applied_at: app.createdAt,
    }));
  }
}

module.exports = { rankApplicants };
