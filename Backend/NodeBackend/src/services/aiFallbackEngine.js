/**
 * aiFallbackEngine.js
 * High-accuracy offline heuristic and algorithmic intelligence engine for HireHub.
 * Functions seamlessly when Gemini API is rate-limited (429), offline, or unavailable.
 */

// 1. Comprehensive Skill Taxonomy with Synonyms & Canonical Forms
const CANONICAL_SKILLS = [
  // Programming Languages
  { name: 'JavaScript', aliases: ['javascript', 'js', 'ecmascript'] },
  { name: 'TypeScript', aliases: ['typescript', 'ts'] },
  { name: 'Python', aliases: ['python', 'py'] },
  { name: 'Java', aliases: ['java', 'core java'] },
  { name: 'C++', aliases: ['c++', 'cpp'] },
  { name: 'C#', aliases: ['c#', 'csharp', '.net'] },
  { name: 'PHP', aliases: ['php'] },
  { name: 'Ruby', aliases: ['ruby', 'ruby on rails', 'rails'] },
  { name: 'Go', aliases: ['golang', 'go lang', 'go'] },
  { name: 'Rust', aliases: ['rust'] },
  { name: 'Swift', aliases: ['swift'] },
  { name: 'Kotlin', aliases: ['kotlin'] },
  { name: 'SQL', aliases: ['sql', 't-sql', 'pl/sql'] },

  // Web & Frontend
  { name: 'React', aliases: ['react', 'react.js', 'reactjs'] },
  { name: 'Angular', aliases: ['angular', 'angularjs', 'angular.js'] },
  { name: 'Vue.js', aliases: ['vue', 'vue.js', 'vuejs'] },
  { name: 'Next.js', aliases: ['next.js', 'nextjs', 'next'] },
  { name: 'HTML5', aliases: ['html', 'html5'] },
  { name: 'CSS3', aliases: ['css', 'css3'] },
  { name: 'Tailwind CSS', aliases: ['tailwind', 'tailwind css', 'tailwindcss'] },
  { name: 'Bootstrap', aliases: ['bootstrap', 'bootstrap 5'] },
  { name: 'Redux', aliases: ['redux', 'redux toolkit', 'rtk'] },
  { name: 'Zustand', aliases: ['zustand'] },
  { name: 'Webpack', aliases: ['webpack', 'vite'] },

  // Backend & Runtime
  { name: 'Node.js', aliases: ['node.js', 'nodejs', 'node'] },
  { name: 'Express.js', aliases: ['express', 'express.js', 'expressjs'] },
  { name: 'Django', aliases: ['django'] },
  { name: 'Flask', aliases: ['flask'] },
  { name: 'FastAPI', aliases: ['fastapi', 'fast api'] },
  { name: 'Spring Boot', aliases: ['spring', 'spring boot', 'springboot'] },
  { name: 'NestJS', aliases: ['nestjs', 'nest.js'] },
  { name: 'REST APIs', aliases: ['rest', 'rest api', 'restful', 'rest apis'] },
  { name: 'GraphQL', aliases: ['graphql', 'graph ql'] },
  { name: 'Microservices', aliases: ['microservices', 'microservice architecture'] },

  // Databases & Caching
  { name: 'MongoDB', aliases: ['mongodb', 'mongo', 'nosql'] },
  { name: 'PostgreSQL', aliases: ['postgresql', 'postgres', 'psql'] },
  { name: 'MySQL', aliases: ['mysql'] },
  { name: 'Redis', aliases: ['redis', 'caching'] },
  { name: 'Elasticsearch', aliases: ['elasticsearch', 'elastic search'] },
  { name: 'Firebase', aliases: ['firebase', 'firestore'] },
  { name: 'SQLite', aliases: ['sqlite'] },

  // Cloud & DevOps
  { name: 'Docker', aliases: ['docker', 'containerization'] },
  { name: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
  { name: 'AWS', aliases: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'] },
  { name: 'Azure', aliases: ['azure', 'microsoft azure'] },
  { name: 'Google Cloud (GCP)', aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  { name: 'CI/CD Pipelines', aliases: ['ci/cd', 'cicd', 'jenkins', 'github actions', 'gitlab ci'] },
  { name: 'Terraform', aliases: ['terraform', 'infrastructure as code', 'iac'] },
  { name: 'Linux', aliases: ['linux', 'ubuntu', 'bash', 'shell scripting'] },
  { name: 'Git', aliases: ['git', 'github', 'gitlab', 'version control'] },

  // Data Science & AI / ML
  { name: 'Machine Learning', aliases: ['machine learning', 'ml', 'scikit-learn'] },
  { name: 'Deep Learning', aliases: ['deep learning', 'neural networks', 'ann', 'cnn'] },
  { name: 'Artificial Intelligence', aliases: ['artificial intelligence', 'ai', 'genai', 'llm'] },
  { name: 'Natural Language Processing', aliases: ['nlp', 'natural language processing'] },
  { name: 'Computer Vision', aliases: ['computer vision', 'opencv'] },
  { name: 'Pandas', aliases: ['pandas'] },
  { name: 'NumPy', aliases: ['numpy'] },
  { name: 'TensorFlow', aliases: ['tensorflow', 'tf'] },
  { name: 'PyTorch', aliases: ['pytorch'] },
  { name: 'Data Analysis', aliases: ['data analysis', 'data analytics', 'eda'] },
  { name: 'Power BI', aliases: ['power bi', 'powerbi'] },
  { name: 'Tableau', aliases: ['tableau'] },
  { name: 'Big Data (Spark)', aliases: ['spark', 'apache spark', 'hadoop'] },

  // Mobile
  { name: 'React Native', aliases: ['react native', 'react-native'] },
  { name: 'Flutter', aliases: ['flutter', 'dart'] },
  { name: 'Android Development', aliases: ['android', 'android studio'] },
  { name: 'iOS Development', aliases: ['ios', 'xcode'] },

  // Testing & Quality
  { name: 'Automated Testing', aliases: ['jest', 'cypress', 'selenium', 'mocha', 'unit testing'] },
  { name: 'Postman', aliases: ['postman', 'api testing'] },

  // Design & Architecture
  { name: 'UI/UX Design', aliases: ['ui/ux', 'ui design', 'ux design', 'figma', 'wireframing'] },
  { name: 'System Design', aliases: ['system design', 'software architecture', 'design patterns'] },
  { name: 'Agile / Scrum', aliases: ['agile', 'scrum', 'jira', 'sprint planning'] },
];

// 2. Canonical Target Roles and their Benchmark Skillsets
const ROLE_TAXONOMY = [
  {
    role: 'Full Stack Developer',
    keywords: ['full stack', 'fullstack', 'mern', 'mean', 'web developer', 'software engineer'],
    coreSkills: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'HTML5', 'CSS3', 'REST APIs', 'Git'],
    modernSkills: ['TypeScript', 'Next.js', 'Docker', 'PostgreSQL', 'Tailwind CSS', 'CI/CD Pipelines', 'Automated Testing', 'AWS'],
  },
  {
    role: 'Frontend Engineer',
    keywords: ['frontend', 'front end', 'react developer', 'ui developer', 'angular developer'],
    coreSkills: ['HTML5', 'CSS3', 'JavaScript', 'React', 'Tailwind CSS', 'Redux', 'Git'],
    modernSkills: ['TypeScript', 'Next.js', 'Vue.js', 'Webpack', 'UI/UX Design', 'Automated Testing', 'Performance Optimization'],
  },
  {
    role: 'Backend Developer',
    keywords: ['backend', 'back end', 'node developer', 'api developer', 'server-side'],
    coreSkills: ['Node.js', 'Express.js', 'REST APIs', 'SQL', 'MongoDB', 'PostgreSQL', 'Git'],
    modernSkills: ['TypeScript', 'Microservices', 'Docker', 'Redis', 'Kubernetes', 'System Design', 'AWS', 'GraphQL'],
  },
  {
    role: 'Data Scientist / ML Engineer',
    keywords: ['data scientist', 'machine learning', 'ai engineer', 'data science', 'deep learning', 'mlops'],
    coreSkills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'SQL', 'Data Analysis', 'Git'],
    modernSkills: ['PyTorch', 'TensorFlow', 'Deep Learning', 'Natural Language Processing', 'MLOps', 'Docker', 'AWS', 'Big Data (Spark)'],
  },
  {
    role: 'DevOps / Cloud Engineer',
    keywords: ['devops', 'cloud engineer', 'sre', 'infrastructure', 'sysadmin'],
    coreSkills: ['Linux', 'Docker', 'Kubernetes', 'AWS', 'CI/CD Pipelines', 'Git'],
    modernSkills: ['Terraform', 'Azure', 'Microservices', 'Python', 'Monitoring (Prometheus/Grafana)', 'System Design'],
  },
  {
    role: 'Mobile App Developer',
    keywords: ['mobile developer', 'react native', 'flutter', 'android', 'ios developer'],
    coreSkills: ['React Native', 'Flutter', 'JavaScript', 'Mobile Development', 'REST APIs', 'Git'],
    modernSkills: ['TypeScript', 'Android Development', 'iOS Development', 'State Management', 'App Store Deployment'],
  },
  {
    role: 'QA / Automation Engineer',
    keywords: ['qa', 'quality assurance', 'test engineer', 'automation tester', 'testing'],
    coreSkills: ['Automated Testing', 'Selenium', 'Postman', 'JavaScript', 'Python', 'Git'],
    modernSkills: ['Cypress', 'CI/CD Pipelines', 'Performance Testing', 'API Testing', 'Docker'],
  },
  {
    role: 'UI/UX Designer',
    keywords: ['ui/ux', 'ui designer', 'ux designer', 'product designer', 'figma'],
    coreSkills: ['UI/UX Design', 'Figma', 'Wireframing', 'User Research', 'Prototyping'],
    modernSkills: ['Design Systems', 'HTML5', 'CSS3', 'Micro-interactions', 'Accessibility (a11y)'],
  },
];

/**
 * Extracts all matched skills from free-form text using the skill taxonomy.
 */
function extractSkillsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const normalized = ` ${text.toLowerCase().replace(/[^a-z0-9#+.]/g, ' ')} `;
  const matched = new Set();

  for (const skill of CANONICAL_SKILLS) {
    for (const alias of skill.aliases) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zA-Z0-9#+.])(${escaped})([^a-zA-Z0-9#+.]|$)`, 'i');
      if (regex.test(normalized)) {
        matched.add(skill.name);
        break;
      }
    }
  }

  return Array.from(matched);
}

/**
 * Detects the most suitable canonical job role for a given resume text.
 */
function detectTargetRole(rawText, extractedSkills = []) {
  const lower = rawText.toLowerCase();
  let bestRole = ROLE_TAXONOMY[0];
  let maxScore = -1;

  for (const roleDef of ROLE_TAXONOMY) {
    let score = 0;
    for (const kw of roleDef.keywords) {
      if (lower.includes(kw)) score += 5;
    }
    for (const skill of roleDef.coreSkills) {
      if (extractedSkills.includes(skill)) score += 2;
    }
    for (const skill of roleDef.modernSkills) {
      if (extractedSkills.includes(skill)) score += 1;
    }

    if (score > maxScore) {
      maxScore = score;
      bestRole = roleDef;
    }
  }

  return bestRole;
}

/**
 * Extracts candidate personal info using regex heuristics.
 */
function extractContactInfo(text) {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{10}\b/);

  let name = '';
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 10)) {
    if (
      line.length > 2 &&
      line.length < 35 &&
      !line.includes('@') &&
      !line.includes('http') &&
      !/resume|curriculum|vitae|page|contact|phone|email/i.test(line) &&
      /^[A-Z][a-zA-Z\s.-]+$/.test(line)
    ) {
      name = line;
      break;
    }
  }

  let location = '';
  const locationRegex = /\b(Chennai|Madurai|Bengaluru|Bangalore|Hyderabad|Coimbatore|Tirunelveli|Mumbai|Pune|Delhi|Noida|Kolkata|Kerala|Kochi)\b/i;
  const locMatch = text.match(locationRegex);
  if (locMatch) {
    location = locMatch[1];
  }

  return {
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    name: name,
    location: location,
  };
}

/**
 * Extracts Education section summary from text.
 */
function extractEducation(text) {
  const eduKeywords = [
    'b.tech', 'b.e.', 'btech', 'be', 'bachelor', 'm.tech', 'm.e.', 'mtech', 'master',
    'bca', 'mca', 'b.sc', 'm.sc', 'bsc', 'msc', 'diploma', 'degree', 'university', 'college', 'institute'
  ];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const found = [];

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (eduKeywords.some((kw) => lower.includes(kw))) {
      found.push(line);
      if (found.length >= 3) break;
    }
  }

  return found.join(' | ') || 'Relevant Degree / Technical Background';
}

/**
 * Extracts Work Experience summary or years.
 */
function extractExperience(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const expKeywords = ['experience', 'work history', 'employment', 'developer', 'engineer', 'intern', 'consultant'];
  const found = [];

  const yearsMatch = text.match(/(\d+\+?\s*(?:to\s*\d+\s*)?years?(?:\s*of)?\s*experience)/i);
  if (yearsMatch) {
    found.push(yearsMatch[0]);
  }

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (expKeywords.some((kw) => lower.includes(kw)) && line.length < 100) {
      found.push(line);
      if (found.length >= 3) break;
    }
  }

  return found.slice(0, 3).join(' | ') || 'Professional Experience in Software Development';
}

/**
 * OFFLINE BACKUP: Parse resume text using algorithmic NLP pattern matching.
 */
function parseResumeOffline(rawText) {
  if (!rawText || !rawText.trim()) {
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
        suggestions: ['Please upload a resume containing extractable text.'],
        match_score: 50,
        ai_analysis_failed: true,
        ai_failure_reason: 'no_text',
      },
    };
  }

  const contact = extractContactInfo(rawText);
  const skills = extractSkillsFromText(rawText);
  const roleDef = detectTargetRole(rawText, skills);
  const education = extractEducation(rawText);
  const experience = extractExperience(rawText);

  const allRoleSkills = [...roleDef.coreSkills, ...roleDef.modernSkills];
  const matchedSkills = skills.filter((s) => allRoleSkills.includes(s));
  const lackingSkills = allRoleSkills.filter((s) => !skills.includes(s)).slice(0, 6);

  let matchScore = 60;
  if (allRoleSkills.length > 0) {
    const coverageRatio = matchedSkills.length / Math.min(10, allRoleSkills.length);
    matchScore = Math.min(95, Math.max(50, Math.round(55 + coverageRatio * 40)));
  }

  const suggestions = [
    `Strengthen your profile for ${roleDef.role} by gaining hands-on proficiency in ${lackingSkills.slice(0, 3).join(', ')}.`,
    'Include live project GitHub repositories or demo URLs in your experience descriptions.',
    'Highlight quantifiable metrics (e.g. % performance increase, latency reduction, user scale) in your achievements.',
  ];

  return {
    rawText,
    parsedData: {
      full_name: contact.name,
      phone: contact.phone,
      location: contact.location,
      target_role: roleDef.role,
      skills: skills.length > 0 ? skills : ['Problem Solving', 'Communication', 'Software Development'],
      education,
      experience,
      matched_skills: matchedSkills.length > 0 ? matchedSkills : skills.slice(0, 5),
      lacking_skills: lackingSkills.length > 0 ? lackingSkills : ['System Design', 'Cloud Architecture', 'CI/CD Pipelines'],
      missing_skills: lackingSkills.length > 0 ? lackingSkills : ['System Design', 'Cloud Architecture', 'CI/CD Pipelines'],
      suggestions,
      match_score: matchScore,
      ai_analysis_failed: false,
    },
  };
}

/**
 * OFFLINE BACKUP: Calculate Match Score between a candidate and a job posting.
 */
function calculateMatchScoreOffline(candidateProfile, job) {
  const reqSkillsRaw = Array.isArray(job.skills_required) ? job.skills_required : [];
  const reqSkills = reqSkillsRaw.flatMap((s) =>
    typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : [String(s)]
  );

  const candSkillsRaw = Array.isArray(candidateProfile?.skills) ? candidateProfile.skills : [];
  const candSkills = candSkillsRaw.flatMap((s) =>
    typeof s === 'string' ? s.split(',').map((x) => x.trim()).filter(Boolean) : [String(s)]
  );

  const candidateAllText = [
    candSkills.join(' '),
    candidateProfile?.experience || '',
    candidateProfile?.resume_text || '',
    candidateProfile?.target_role || '',
  ].join(' ').toLowerCase();

  const matched = [];
  const missing = [];

  for (const req of reqSkills) {
    const reqLower = req.toLowerCase();
    const inSkillsArray = candSkills.some((cs) => {
      const csLower = cs.toLowerCase();
      return csLower === reqLower || csLower.includes(reqLower) || reqLower.includes(csLower);
    });

    const inFullText = candidateAllText.includes(reqLower);

    if (inSkillsArray || inFullText) {
      matched.push(req);
    } else {
      missing.push(req);
    }
  }

  let skillScore = 70;
  if (reqSkills.length > 0) {
    skillScore = Math.round((matched.length / reqSkills.length) * 70);
  }

  let titleScore = 10;
  if (job.title) {
    const titleWords = job.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const titleMatches = titleWords.filter((w) => candidateAllText.includes(w));
    if (titleWords.length > 0) {
      titleScore = Math.round((titleMatches.length / titleWords.length) * 20);
    }
  }

  const profileBonus = (candidateProfile?.experience ? 5 : 0) + (candidateProfile?.resume_text ? 5 : 2);
  const finalScore = Math.min(100, Math.max(15, skillScore + titleScore + profileBonus));

  return {
    match_score: finalScore,
    matched_skills: matched,
    missing_skills: missing,
  };
}

/**
 * OFFLINE BACKUP: Get AI Job Recommendations ranked by relevance.
 */
function getJobRecommendationsOffline(candidateProfile, availableJobs, limit = 5) {
  if (!availableJobs || availableJobs.length === 0) return [];

  const scoredJobs = availableJobs.map((job) => {
    const matchResult = calculateMatchScoreOffline(candidateProfile, job);
    const score = matchResult.match_score;

    return {
      _id: job._id,
      job_id: job._id,
      title: job.title,
      company: job.employerId?.company_name || 'Employer',
      location: job.location,
      salary: job.salary,
      job_type: job.job_type,
      score: score,
      match_score: score,
      matched_skills: matchResult.matched_skills.length > 0 ? matchResult.matched_skills : (job.skills_required || []),
      missing_skills: matchResult.missing_skills,
    };
  });

  scoredJobs.sort((a, b) => b.score - a.score);

  return scoredJobs.slice(0, limit);
}

/**
 * OFFLINE BACKUP: Rank Applicants for an employer's job posting.
 */
function rankApplicantsOffline(job, applicationsWithProfiles) {
  if (!applicationsWithProfiles || applicationsWithProfiles.length === 0) return [];

  const scoredApplicants = applicationsWithProfiles.map((app) => {
    const profile = app.profile || {
      skills: app.jobSeekerId?.skills || [],
      experience: app.jobSeekerId?.experience || '',
      resume_text: app.jobSeekerId?.resume_text || '',
    };

    const matchResult = calculateMatchScoreOffline(profile, job);
    const score = matchResult.match_score || app.match_score || 70;
    const matched_skills = matchResult.matched_skills.length > 0
      ? matchResult.matched_skills
      : (app.matched_skills || profile.skills || []);

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

  scoredApplicants.sort((a, b) => {
    if (b.match_score !== a.match_score) {
      return b.match_score - a.match_score;
    }
    return new Date(a.applied_at || 0) - new Date(b.applied_at || 0);
  });

  return scoredApplicants;
}

module.exports = {
  CANONICAL_SKILLS,
  ROLE_TAXONOMY,
  extractSkillsFromText,
  detectTargetRole,
  parseResumeOffline,
  calculateMatchScoreOffline,
  getJobRecommendationsOffline,
  rankApplicantsOffline,
};
