const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    requirements: { type: String, default: '' },
    skills_required: { type: [String], default: [] },
    location: { type: String, trim: true, default: '' },
    job_type: {
      type: String,
      // FIX 7 — removed empty string; use null for "not specified"
      enum: ['full-time', 'part-time', 'contract', 'internship', null],
      default: null,
    },
    salary: { type: String, default: '' },
    experience_level: {
      type: String,
      // FIX 7 — removed empty string; use null for "not specified"
      enum: ['entry', 'mid', 'senior', 'lead', null],
      default: null,
    },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    flagged: { type: Boolean, default: false },
    flag_reason: { type: String, default: '' },
    // FIX 2 — applicant_count removed; always derive from Application collection
  },
  { timestamps: true }
);

// Text index for search
jobSchema.index({ title: 'text', description: 'text', skills_required: 'text' });

// FIX 20 — indexes for common query patterns
jobSchema.index({ employerId: 1 });         // getMyJobs, getDashboardStats
jobSchema.index({ status: 1, flagged: 1 }); // getJobs public filter

module.exports = mongoose.model('Job', jobSchema);
