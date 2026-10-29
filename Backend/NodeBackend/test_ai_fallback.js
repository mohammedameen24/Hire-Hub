const {
  parseResumeOffline,
  calculateMatchScoreOffline,
  getJobRecommendationsOffline,
  rankApplicantsOffline,
} = require('./src/services/aiFallbackEngine');

console.log('🧪 Starting AI Fallback Engine Verification...\n');

// 1. Test Resume Parser Offline
const sampleResumeText = `
Arun Kumar
Email: arun.kumar@gmail.com | Phone: 9876543210 | Location: Madurai
Professional Summary:
Passionate Full Stack Developer with 3+ years of experience building modern scalable web applications.
Experienced in JavaScript, React, Node.js, Express.js, MongoDB, HTML5, CSS3, Tailwind CSS, and Git.

Experience:
Full Stack Developer | TechSolutions (2022 - Present)
- Developed and maintained responsive MERN stack web applications.
- Integrated RESTful APIs with MongoDB database.

Education:
B.Tech in Computer Science and Engineering | Mepco Schlenk Engineering College (2018 - 2022)
`;

console.log('--- 1. Testing parseResumeOffline ---');
const parsed = parseResumeOffline(sampleResumeText);
console.log('Target Role:', parsed.parsedData.target_role);
console.log('Extracted Skills:', parsed.parsedData.skills);
console.log('Matched Skills:', parsed.parsedData.matched_skills);
console.log('Lacking Skills:', parsed.parsedData.lacking_skills);
console.log('Match Score:', parsed.parsedData.match_score);
console.log('Suggestions:', parsed.parsedData.suggestions.length);

if (
  parsed.parsedData.skills.length >= 5 &&
  parsed.parsedData.lacking_skills.length > 0 &&
  parsed.parsedData.match_score > 0
) {
  console.log('✅ parseResumeOffline PASSED\n');
} else {
  console.error('❌ parseResumeOffline FAILED\n');
  process.exit(1);
}

// 2. Test Match Score Offline
console.log('--- 2. Testing calculateMatchScoreOffline ---');
const candidateProfile = {
  skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'],
  experience: '3 years of web development',
  resume_text: sampleResumeText,
};
const job = {
  title: 'Full Stack MERN Developer',
  description: 'Looking for a developer with React, Node.js, Express, and Docker.',
  skills_required: ['React', 'Node.js', 'Docker', 'AWS'],
};
const matchResult = calculateMatchScoreOffline(candidateProfile, job);
console.log('Match Result:', matchResult);

if (
  matchResult.match_score > 0 &&
  matchResult.matched_skills.includes('React') &&
  matchResult.missing_skills.includes('AWS')
) {
  console.log('✅ calculateMatchScoreOffline PASSED\n');
} else {
  console.error('❌ calculateMatchScoreOffline FAILED\n');
  process.exit(1);
}

// 3. Test Job Recommendations Offline
console.log('--- 3. Testing getJobRecommendationsOffline ---');
const availableJobs = [
  {
    _id: 'job1',
    title: 'Python Data Analyst',
    location: 'Madurai',
    skills_required: ['Python', 'Pandas', 'SQL'],
    employerId: { company_name: 'DataCorp' },
  },
  {
    _id: 'job2',
    title: 'Frontend React Developer',
    location: 'Madurai',
    skills_required: ['React', 'JavaScript', 'Tailwind CSS'],
    employerId: { company_name: 'WebStudio' },
  },
  {
    _id: 'job3',
    title: 'Senior MERN Stack Engineer',
    location: 'Madurai',
    skills_required: ['React', 'Node.js', 'MongoDB', 'Express.js'],
    employerId: { company_name: 'CloudApps' },
  },
];

const recs = getJobRecommendationsOffline(candidateProfile, availableJobs, 2);
console.log('Top Recommendations:');
recs.forEach((r, idx) => {
  console.log(`  #${idx + 1}: ${r.title} | Score: ${r.score}% | Matched: ${r.matched_skills.join(', ')}`);
});

if (recs.length === 2 && recs[0].score >= recs[1].score && recs[0].title.includes('MERN')) {
  console.log('✅ getJobRecommendationsOffline PASSED\n');
} else {
  console.error('❌ getJobRecommendationsOffline FAILED\n');
  process.exit(1);
}

// 4. Test Candidate Ranking Offline
console.log('--- 4. Testing rankApplicantsOffline ---');
const targetJob = {
  title: 'React Frontend Developer',
  skills_required: ['React', 'JavaScript', 'CSS3'],
};
const applications = [
  {
    _id: 'app1',
    jobSeekerId: { _id: 'u1', full_name: 'Candidate A (Beginner)' },
    profile: { skills: ['HTML5'] },
    createdAt: new Date('2026-10-01'),
  },
  {
    _id: 'app2',
    jobSeekerId: { _id: 'u2', full_name: 'Candidate B (Perfect Match)' },
    profile: { skills: ['React', 'JavaScript', 'CSS3'] },
    createdAt: new Date('2026-10-02'),
  },
  {
    _id: 'app3',
    jobSeekerId: { _id: 'u3', full_name: 'Candidate C (Partial Match)' },
    profile: { skills: ['React'] },
    createdAt: new Date('2026-10-03'),
  },
];

const ranked = rankApplicantsOffline(targetJob, applications);
console.log('Ranked Applicants:');
ranked.forEach((cand, idx) => {
  console.log(`  Rank #${idx + 1}: ${cand.name} | Score: ${cand.match_score}%`);
});

if (
  ranked[0].name.includes('Candidate B') &&
  ranked[1].name.includes('Candidate C') &&
  ranked[2].name.includes('Candidate A')
) {
  console.log('✅ rankApplicantsOffline PASSED\n');
} else {
  console.error('❌ rankApplicantsOffline FAILED\n');
  process.exit(1);
}

console.log('🎉 ALL AI FALLBACK ENGINE CHECKS PASSED SUCCESSFULLY!');
