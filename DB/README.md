# HireHub Database

MongoDB database setup and seed scripts.

## Collections

- **users** - All user accounts (jobseekers, employers, admins)
- **jobseeker_profiles** - Extended profile data for job seekers
- **companies** - Company profiles for employers
- **jobs** - Job postings
- **applications** - Job applications
- **recommendations** - AI-generated job recommendations

## Setup

1. Install MongoDB Community Edition or use MongoDB Atlas
2. Run the seed script to populate with test data:
   ```bash
   python DB/seed_data.py
   ```

## Indexes

Created automatically on startup:
- `users.email` (unique)
- `jobs.employer_id`
- `jobs.status`
- `applications.job_id + jobseeker_id` (unique)
- `applications.jobseeker_id`
- `companies.user_id` (unique)
- `jobseeker_profiles.user_id` (unique)
