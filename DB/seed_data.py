"""
Seed script for HireHub MongoDB database.
Run: python DB/seed_data.py
"""

import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "hirehub"


async def seed():
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]

    await db.users.delete_many({})
    await db.jobseeker_profiles.delete_many({})
    await db.companies.delete_many({})
    await db.jobs.delete_many({})
    await db.applications.delete_many({})
    await db.recommendations.delete_many({})

    # --- Users ---
    admin_id = await db.users.insert_one({
        "full_name": "Admin User",
        "email": "admin@gmail.com",
        "password_hash": pwd_context.hash("Admin@1234"),
        "role": "admin",
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.utcnow(),
    })

    employer1_id = await db.users.insert_one({
        "full_name": "TechCorp HR",
        "email": "techcorp.hr@gmail.com",
        "password_hash": pwd_context.hash("Employer@123"),
        "role": "employer",
        "is_verified": True,
        "is_active": True,
        "created_at": datetime.utcnow(),
    })

    employer2_id = await db.users.insert_one({
        "full_name": "DataSoft Recruitment",
        "email": "datasoft.recruit@gmail.com",
        "password_hash": pwd_context.hash("Employer@123"),
        "role": "employer",
        "is_verified": False,
        "is_active": True,
        "created_at": datetime.utcnow(),
    })

    seeker1_id = await db.users.insert_one({
        "full_name": "Alice Johnson",
        "email": "alice.johnson@gmail.com",
        "password_hash": pwd_context.hash("Jobseeker@123"),
        "role": "jobseeker",
        "is_verified": False,
        "is_active": True,
        "created_at": datetime.utcnow(),
    })

    seeker2_id = await db.users.insert_one({
        "full_name": "Bob Smith",
        "email": "bob.smith@gmail.com",
        "password_hash": pwd_context.hash("Jobseeker@123"),
        "role": "jobseeker",
        "is_verified": False,
        "is_active": True,
        "created_at": datetime.utcnow(),
    })

    # --- Company Profiles ---
    await db.companies.insert_one({
        "user_id": str(employer1_id.inserted_id),
        "company_name": "TechCorp Solutions",
        "industry": "Technology",
        "location": "San Francisco, CA",
        "website": "https://techcorp.com",
        "company_size": "201-500",
        "description": "Leading technology company specializing in cloud solutions and AI.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    await db.companies.insert_one({
        "user_id": str(employer2_id.inserted_id),
        "company_name": "DataSoft Inc",
        "industry": "Data Analytics",
        "location": "New York, NY",
        "website": "https://datasoft.com",
        "company_size": "51-200",
        "description": "Data analytics and machine learning company.",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    # --- Job Seeker Profiles ---
    await db.jobseeker_profiles.insert_one({
        "user_id": str(seeker1_id.inserted_id),
        "phone": "+1 (555) 123-4567",
        "location": "San Francisco, CA",
        "skills": ["Python", "React", "Machine Learning", "SQL", "Docker"],
        "experience": "5 years of experience in full-stack development with focus on Python and React.",
        "education": "B.S. Computer Science, Stanford University",
        "resume_url": None,
        "resume_data": {
            "skills": ["Python", "React", "Machine Learning", "SQL", "Docker"],
            "education": ["B.S. Computer Science, Stanford University"],
            "experience": "5 years of experience in full-stack development.",
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    await db.jobseeker_profiles.insert_one({
        "user_id": str(seeker2_id.inserted_id),
        "phone": "+1 (555) 987-6543",
        "location": "New York, NY",
        "skills": ["JavaScript", "Node.js", "MongoDB", "AWS", "TypeScript"],
        "experience": "3 years of experience in backend development with Node.js and cloud services.",
        "education": "M.S. Software Engineering, NYU",
        "resume_url": None,
        "resume_data": {
            "skills": ["JavaScript", "Node.js", "MongoDB", "AWS", "TypeScript"],
            "education": ["M.S. Software Engineering, NYU"],
            "experience": "3 years of experience in backend development.",
        },
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    # --- Jobs ---
    job1_id = await db.jobs.insert_one({
        "employer_id": str(employer1_id.inserted_id),
        "title": "Senior Python Developer",
        "description": "We are looking for an experienced Python developer to join our backend team. You will work on scalable microservices and AI-powered features.",
        "requirements": "5+ years Python experience, knowledge of FastAPI or Django, experience with cloud platforms.",
        "location": "San Francisco, CA",
        "job_type": "full-time",
        "salary": "$130,000 - $180,000",
        "experience_level": "senior",
        "skills_required": ["Python", "FastAPI", "Docker", "AWS", "PostgreSQL"],
        "status": "active",
        "flagged": False,
        "applicant_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    job2_id = await db.jobs.insert_one({
        "employer_id": str(employer1_id.inserted_id),
        "title": "Frontend React Engineer",
        "description": "Join our frontend team to build beautiful, responsive user interfaces using React and modern web technologies.",
        "requirements": "3+ years React experience, strong CSS skills, experience with state management.",
        "location": "Remote",
        "job_type": "full-time",
        "salary": "$110,000 - $150,000",
        "experience_level": "mid",
        "skills_required": ["React", "TypeScript", "CSS", "Redux", "Next.js"],
        "status": "active",
        "flagged": False,
        "applicant_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    job3_id = await db.jobs.insert_one({
        "employer_id": str(employer2_id.inserted_id),
        "title": "Data Scientist",
        "description": "We need a data scientist to build ML models and analyze large datasets for our analytics platform.",
        "requirements": "Strong background in statistics, machine learning, and data visualization.",
        "location": "New York, NY",
        "job_type": "full-time",
        "salary": "$120,000 - $160,000",
        "experience_level": "mid",
        "skills_required": ["Python", "Machine Learning", "Pandas", "SQL", "TensorFlow"],
        "status": "active",
        "flagged": False,
        "applicant_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    job4_id = await db.jobs.insert_one({
        "employer_id": str(employer2_id.inserted_id),
        "title": "DevOps Engineer",
        "description": "Looking for a DevOps engineer to manage our CI/CD pipelines and cloud infrastructure.",
        "requirements": "Experience with Kubernetes, Docker, and cloud platforms. Knowledge of IaC tools.",
        "location": "Remote",
        "job_type": "contract",
        "salary": "$90 - $120/hour",
        "experience_level": "senior",
        "skills_required": ["Kubernetes", "Docker", "AWS", "Terraform", "CI/CD"],
        "status": "active",
        "flagged": True,
        "flag_reason": "Suspicious salary range and requirements mismatch",
        "applicant_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    # --- Applications ---
    await db.applications.insert_one({
        "job_id": str(job1_id.inserted_id),
        "jobseeker_id": str(seeker1_id.inserted_id),
        "status": "pending",
        "match_score": 85.0,
        "applied_at": datetime.utcnow(),
    })

    await db.applications.insert_one({
        "job_id": str(job3_id.inserted_id),
        "jobseeker_id": str(seeker1_id.inserted_id),
        "status": "interview",
        "match_score": 78.0,
        "applied_at": datetime.utcnow() - timedelta(days=2),
    })

    await db.applications.insert_one({
        "job_id": str(job2_id.inserted_id),
        "jobseeker_id": str(seeker2_id.inserted_id),
        "status": "shortlisted",
        "match_score": 72.0,
        "applied_at": datetime.utcnow() - timedelta(days=1),
    })

    await db.jobs.update_one(
        {"_id": job1_id.inserted_id},
        {"$set": {"applicant_count": 1}},
    )
    await db.jobs.update_one(
        {"_id": job3_id.inserted_id},
        {"$set": {"applicant_count": 1}},
    )
    await db.jobs.update_one(
        {"_id": job2_id.inserted_id},
        {"$set": {"applicant_count": 1}},
    )

    print("Database seeded successfully!")
    print("\nTest Accounts (all Gmail):")
    print("  Admin:    admin@gmail.com / Admin@1234")
    print("  Employer: techcorp.hr@gmail.com / Employer@123")
    print("  Employer: datasoft.recruit@gmail.com / Employer@123 (unverified)")
    print("  Jobseeker: alice.johnson@gmail.com / Jobseeker@123")
    print("  Jobseeker: bob.smith@gmail.com / Jobseeker@123")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())
