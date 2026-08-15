const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

// Import env.js to run JWT_SECRET validation
require('./config/env');

const User = require('./models/User');
const JobSeekerProfile = require('./models/JobSeekerProfile');
const EmployerProfile = require('./models/EmployerProfile');
const Job = require('./models/Job');
const Application = require('./models/Application');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hirehub';

const seed = async () => {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected!');

    // Drop database to clear legacy indexes
    await mongoose.connection.db.dropDatabase();
    console.log('Database dropped and fresh collections initialized.');

    // 1. Create Users
    const admin = await User.create({
      full_name: 'Admin User',
      email: 'admin@gmail.com',
      password: 'Admin@1234',
      role: 'admin',
      is_verified: true,
      is_active: true,
    });

    const employer1 = await User.create({
      full_name: 'TechCorp HR',
      email: 'techcorp.hr@gmail.com',
      password: 'Employer@123',
      role: 'employer',
      is_verified: true,
      is_active: true,
    });

    const employer2 = await User.create({
      full_name: 'DataSoft Recruitment',
      email: 'datasoft.recruit@gmail.com',
      password: 'Employer@123',
      role: 'employer',
      is_verified: false,
      is_active: true,
    });

    const seeker1 = await User.create({
      full_name: 'Alice Johnson',
      email: 'alice.johnson@gmail.com',
      password: 'Jobseeker@123',
      role: 'jobseeker',
      is_verified: false,
      is_active: true,
    });

    const seeker2 = await User.create({
      full_name: 'Bob Smith',
      email: 'bob.smith@gmail.com',
      password: 'Jobseeker@123',
      role: 'jobseeker',
      is_verified: false,
      is_active: true,
    });

    const seeker3 = await User.create({
      full_name: 'New Candidate',
      email: 'new.candidate@gmail.com',
      password: 'Jobseeker@123',
      role: 'jobseeker',
      is_verified: false,
      is_active: true,
    });

    console.log('Users created.');

    // 2. Create Employer Profiles / Companies
    await EmployerProfile.create({
      userId: employer1._id,
      company_name: 'TechCorp Solutions',
      industry: 'Technology',
      location: 'San Francisco, CA',
      website: 'https://techcorp.com',
      company_size: '201-500',
      description: 'Leading technology company specializing in cloud solutions and AI.',
      verified: true,
    });

    await EmployerProfile.create({
      userId: employer2._id,
      company_name: 'DataSoft Inc',
      industry: 'Data Analytics',
      location: 'New York, NY',
      website: 'https://datasoft.com',
      company_size: '51-200',
      description: 'Data analytics and machine learning company.',
      verified: false,
    });

    console.log('Employer profiles created.');

    // 3. Create Job Seeker Profiles
    await JobSeekerProfile.create({
      userId: seeker1._id,
      full_name: seeker1.full_name,
      phone: '+1 (555) 123-4567',
      location: 'San Francisco, CA',
      skills: ['Python', 'React', 'Machine Learning', 'SQL', 'Docker'],
      experience: '5 years of experience in full-stack development with focus on Python and React.',
      education: 'B.S. Computer Science, Stanford University',
      parsed_resume_data: {
        skills: ['Python', 'React', 'Machine Learning', 'SQL', 'Docker'],
        education: 'B.S. Computer Science, Stanford University',
        experience: '5 years of experience in full-stack development.',
      },
    });

    await JobSeekerProfile.create({
      userId: seeker2._id,
      full_name: seeker2.full_name,
      phone: '+1 (555) 987-6543',
      location: 'New York, NY',
      skills: ['JavaScript', 'Node.js', 'MongoDB', 'AWS', 'TypeScript'],
      experience: '3 years of experience in backend development with Node.js and cloud services.',
      education: 'M.S. Software Engineering, NYU',
      parsed_resume_data: {
        skills: ['JavaScript', 'Node.js', 'MongoDB', 'AWS', 'TypeScript'],
        education: 'M.S. Software Engineering, NYU',
        experience: '3 years of experience in backend development.',
      },
    });

    console.log('JobSeeker profiles created.');

    // 4. Create Jobs
    const job1 = await Job.create({
      employerId: employer1._id,
      title: 'Senior Full Stack Developer',
      description: 'We are looking for an experienced developer to join our engineering team. You will work on scalable web applications and AI-powered features.',
      requirements: '5+ years experience with Node.js and React, knowledge of MongoDB, cloud platforms.',
      location: 'San Francisco, CA',
      job_type: 'full-time',
      salary: '$130,000 - $180,000',
      experience_level: 'senior',
      skills_required: ['Node.js', 'React', 'Docker', 'AWS', 'MongoDB'],
      status: 'open',
      flagged: false,
    });

    const job2 = await Job.create({
      employerId: employer1._id,
      title: 'Frontend React Engineer',
      description: 'Join our frontend team to build beautiful, responsive user interfaces using React and modern web technologies.',
      requirements: '3+ years React experience, strong CSS skills, experience with state management.',
      location: 'Remote',
      job_type: 'full-time',
      salary: '$110,000 - $150,000',
      experience_level: 'mid',
      skills_required: ['React', 'TypeScript', 'CSS', 'Redux', 'Next.js'],
      status: 'open',
      flagged: false,
    });

    const job3 = await Job.create({
      employerId: employer2._id,
      title: 'Data Scientist',
      description: 'We need a data scientist to build ML models and analyze large datasets for our analytics platform.',
      requirements: 'Strong background in statistics, machine learning, and data visualization.',
      location: 'New York, NY',
      job_type: 'full-time',
      salary: '$120,000 - $160,000',
      experience_level: 'mid',
      skills_required: ['Python', 'Machine Learning', 'Pandas', 'SQL', 'TensorFlow'],
      status: 'open',
      flagged: false,
    });

    const job4 = await Job.create({
      employerId: employer2._id,
      title: 'DevOps Engineer',
      description: 'Looking for a DevOps engineer to manage our CI/CD pipelines and cloud infrastructure.',
      requirements: 'Experience with Kubernetes, Docker, and cloud platforms.',
      location: 'Remote',
      job_type: 'contract',
      salary: '$90 - $120/hour',
      experience_level: 'senior',
      skills_required: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD'],
      status: 'open',
      flagged: true,
      flag_reason: 'Suspicious salary range and requirements mismatch',
    });

    console.log('Jobs created.');

    // 5. Create Applications
    await Application.create({
      jobId: job1._id,
      jobSeekerId: seeker1._id,
      status: 'pending',
      match_score: 85,
      matched_skills: ['Python', 'React', 'Docker'],
      missing_skills: ['AWS', 'MongoDB'],
    });

    await Application.create({
      jobId: job3._id,
      jobSeekerId: seeker1._id,
      status: 'interview',
      match_score: 78,
      matched_skills: ['Python', 'Machine Learning', 'SQL'],
      missing_skills: ['Pandas', 'TensorFlow'],
    });

    await Application.create({
      jobId: job2._id,
      jobSeekerId: seeker2._id,
      status: 'shortlisted',
      match_score: 72,
      matched_skills: ['React', 'TypeScript'],
      missing_skills: ['CSS', 'Redux', 'Next.js'],
    });

    console.log('Applications created.');
    console.log('\n✅ Database seeded successfully!');
    console.log('\n🔑 Test Accounts (All Gmail):');
    console.log('   Admin:     admin@gmail.com           / Admin@1234');
    console.log('   Employer:  techcorp.hr@gmail.com     / Employer@123');
    console.log('   Employer:  datasoft.recruit@gmail.com / Employer@123');
    console.log('   Jobseeker (Full):       alice.johnson@gmail.com   / Jobseeker@123');
    console.log('   Jobseeker (Full):       bob.smith@gmail.com       / Jobseeker@123');
    console.log('   Jobseeker (Incomplete): new.candidate@gmail.com   / Jobseeker@123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seed();
