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
  },
  { timestamps: true }
);

// Pre-save hook to normalize empty/whitespace-only strings to null
jobSchema.pre('save', function (next) {
  const stringFields = ['requirements', 'salary', 'location', 'flag_reason'];
  stringFields.forEach((field) => {
    if (this[field] && this[field].trim() === '') {
      this[field] = null;
    }
  });
  // Normalize skills_required: empty string becomes empty array
  if (this.skills_required && this.skills_required === '') {
    this.skills_required = [];
  } else if (Array.isArray(this.skills_required) && this.skills_required.length === 0) {
    this.skills_required = [];
  }
  next();
});

// FIX 2 — applicant_count removed; always derive from Application collection

// Text index for search
jobSchema.index({ title: 'text', description: 'text', skills_required: 'text' });

// FIX 20 — indexes for common query patterns
jobSchema.index({ employerId: 1 });         // getMyJobs, getDashboardStats
jobSchema.index({ status: 1, flagged: 1 }); // getJobs public filter

module.exports = mongoose.model('Job', jobSchema);