const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    jobSeekerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'reviewing', 'shortlisted', 'rejected', 'interview', 'accepted', 'withdrawn'],
      default: 'pending',
    },
    match_score: { type: Number, default: null },
    matched_skills: { type: [String], default: [] },
    missing_skills: { type: [String], default: [] },
    // FIX 8 — applied_at removed; use createdAt from timestamps: true instead
    // Interview scheduling details (set when employer schedules)
    interview_date: { type: Date, default: null },
    interview_time: { type: String, default: '' },
    interview_type: {
      type: String,
      // Bug #44 fixed — removed '' from enum; empty string is not a meaningful
      // interview type. Use null as the default so unscheduled interviews have
      // no type set, and the frontend can check for null/falsy cleanly.
      enum: ['in-person', 'video', 'phone', null],
      default: null,
    },
    interview_location: { type: String, default: '' },
    interview_notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// A jobseeker can only apply once per job
applicationSchema.index({ jobId: 1, jobSeekerId: 1 }, { unique: true });

// FIX 20 — indexes for common query patterns
applicationSchema.index({ jobSeekerId: 1 });        // getApplications, withdrawApplication, dashboard
applicationSchema.index({ jobId: 1 });              // getJobApplicants, deleteJob cascade
applicationSchema.index({ jobId: 1, status: 1 });   // getDashboardStats status counts

module.exports = mongoose.model('Application', applicationSchema);
