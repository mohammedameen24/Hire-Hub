const mongoose = require('mongoose');

const jobSeekerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    full_name: { type: String, trim: true },
    phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Phone number must be exactly 10 digits'],
  },
    location: { type: String, trim: true },
    // Skills stored as array; also accept comma-string from frontend and convert
    skills: { type: [String], default: [] },
    experience: { type: String, default: '' },
    education: { type: String, default: '' },
    resume_url: { type: String, default: '' },
    // FIX 9 — resume_text is excluded from default queries; select explicitly when needed
    resume_text: { type: String, default: '', select: false },
    parsed_resume_data: { type: mongoose.Schema.Types.Mixed, default: null },
    // Certifications — each has a document-like card with file upload support
    certifications: {
      type: [
        {
          title: { type: String, trim: true, default: '' },
          issuer: { type: String, trim: true, default: '' },
          year: { type: String, trim: true, default: '' },
          credential_id: { type: String, trim: true, default: '' },
          description: { type: String, trim: true, default: '' },
          cert_url: { type: String, default: '' }, // uploaded certificate file path
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// FIX 20 — index userId for all profile lookups (unique: true already creates this index)

module.exports = mongoose.model('JobSeekerProfile', jobSeekerProfileSchema);
