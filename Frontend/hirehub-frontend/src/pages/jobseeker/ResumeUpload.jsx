import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OnboardingStepper from '../../components/ui/OnboardingStepper';
import { getStorageUrl, openFileSecurely } from '../../utils/url';

const JOBSEEKER_STEPS = [
  { label: 'Create Account' },
  { label: 'Edit Profile' },
  { label: 'Upload Resume' },
  { label: 'Dashboard' },
];

export default function ResumeUpload() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isOnboarding = searchParams.get('onboarding') === '1';

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [resumeUrl, setResumeUrl] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  // Fetch existing resume and analysis on load
  useEffect(() => {
    const fetchExistingResume = async () => {
      try {
        const res = await axiosInstance.get('/jobseeker/profile');
        if (res.data?.resume_url) {
          setResumeUrl(res.data.resume_url);
        }
        if (res.data?.parsed_resume_data) {
          setAnalysisData(res.data.parsed_resume_data);
        }
      } catch (err) {
        console.error('Failed to fetch existing profile:', err);
      }
    };
    fetchExistingResume();
  }, []);

  const validateFile = (f) => {
    if (!f) return 'Please select a file';
    if (f.type !== 'application/pdf') return 'Only PDF files are supported';
    if (f.size > 10 * 1024 * 1024) return 'File must be under 10 MB';
    return null;
  };

  const handleFile = useCallback((f) => {
    setError('');
    const err = validateFile(f);
    if (err) {
      setError(err);
      return;
    }
    setFile(f);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadProgress(0);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axiosInstance.post('/jobseeker/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60s max for upload + AI parsing
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(pct);
          }
        },
      });
      setResumeUrl(res.data.resume_url);
      if (res.data?.parsed_resume_data) {
        setAnalysisData(res.data.parsed_resume_data);
      }
      setFile(null);
      setUploadProgress(0);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')
          ? 'Upload request timed out. Please check your connection and try again.'
          : err.message) ||
        'Upload failed. Please check your file and try again.';
      setError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Onboarding Stepper */}
      {isOnboarding && <OnboardingStepper steps={JOBSEEKER_STEPS} currentStep={3} />}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Resume</h1>
        <p className="text-slate-500 mt-1">Upload your resume to complete your profile.</p>
      </div>

      {/* Upload Section */}
      {!resumeUrl && (
        <Card>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
              dragOver
                ? 'border-accent-400 bg-accent-50'
                : file
                  ? 'border-accent-300 bg-accent-50/50'
                  : 'border-slate-300 hover:border-slate-400'
            }`}
          >
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-accent-100 text-accent-600 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{file.name}</p>
                  <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setError('');
                  }}
                  className="text-sm text-slate-500 hover:text-danger-600 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Drop your resume here or browse</p>
                  <p className="text-sm text-slate-500">PDF only, up to 10 MB</p>
                </div>
                <label className="mt-2">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent-600 bg-white border border-accent-300 rounded-lg hover:bg-accent-50 transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Browse Files
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-slate-600 font-medium">Uploading...</span>
                <span className="text-accent-600 font-semibold">{uploadProgress}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {error}
            </div>
          )}

          {/* Upload Button */}
          {file && !uploading && (
            <div className="mt-6 flex items-center gap-3 justify-end">
              <Button onClick={handleUpload}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Resume
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Resume Uploaded Success & Skill Gap Analysis */}
      {resumeUrl && (
        <div className="space-y-6">
          <Card className="bg-success-50 border border-success-200">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success-100 text-success-600 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-success-800">Resume Uploaded & Analyzed</p>
                  <p className="text-sm text-success-700">Your resume is active and evaluated by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openFileSecurely(resumeUrl)}
                  className="font-semibold text-success-700 hover:text-success-800 text-sm px-4 py-2 bg-white rounded border border-success-300 hover:bg-success-50 transition-colors whitespace-nowrap cursor-pointer"
                >
                  View PDF 📄
                </button>
                <Button variant="secondary" size="sm" onClick={() => setResumeUrl(null)}>
                  Upload New
                </Button>
              </div>
            </div>
          </Card>

          {/* AI Resume & Skill Gap Analysis */}
          {analysisData && (
            <Card className="border border-slate-200 overflow-hidden shadow-sm p-0">
              {/* Header with Target Role & Readiness */}
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                      <span>✨ AI Career & Skill Analysis</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      Target Role: <span className="text-accent-300">{analysisData.target_role || 'Software Professional'}</span>
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm">
                      Career position identified from your resume objective, headline, and trajectory.
                    </p>
                  </div>
                  {analysisData.match_score !== undefined && (
                    <div className="flex sm:flex-col items-center justify-center bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-center flex-shrink-0">
                      <span className="text-2xl font-black text-white">{Math.round(analysisData.match_score)}%</span>
                      <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Role Readiness</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 1. Skills Employee Lacks (Feature 1 Highlight) */}
                <div className="p-5 rounded-xl bg-rose-50/70 border border-rose-200">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-rose-900 text-base">Skills You Lack for This Role</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-200 text-rose-800">
                          {((analysisData.lacking_skills || analysisData.missing_skills || []).length)} skills missing
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-rose-700 mt-1 mb-3">
                        Based on the target job of <strong>"{analysisData.target_role || 'your target career'}"</strong> identified in your resume, employers look for these key competencies:
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {(analysisData.lacking_skills || analysisData.missing_skills || []).length > 0 ? (
                          (analysisData.lacking_skills || analysisData.missing_skills).map((skill, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-rose-800 border border-rose-300 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              {skill}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-rose-600 italic">No critical skill gaps detected for this role.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Skills Found in Resume */}
                {((analysisData.matched_skills || analysisData.skills || []).length > 0) && (
                  <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-emerald-900 text-base">Skills Found in Your Resume</h3>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800">
                            {(analysisData.matched_skills || analysisData.skills).length} verified
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-emerald-700 mt-1 mb-3">
                          These existing skills in your resume align strongly with the target role:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(analysisData.matched_skills || analysisData.skills).map((skill, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-emerald-800 border border-emerald-300 shadow-sm"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Actionable AI Recommendations */}
                {analysisData.suggestions && analysisData.suggestions.length > 0 && (
                  <div className="p-5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-indigo-900 text-base mb-2">AI Recommendations to Bridge Your Skill Gap</h3>
                        <ul className="space-y-1.5">
                          {analysisData.suggestions.map((sug, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-indigo-950">
                              <span className="text-indigo-500 font-bold mt-0.5">•</span>
                              <span>{sug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Link to AI Recommendations Page */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">Ready to explore matched jobs?</h4>
                    <p className="text-xs text-slate-500">See all active openings ranked by your resume compatibility score.</p>
                  </div>
                  <Link
                    to="/jobseeker/recommendations"
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors whitespace-nowrap shadow-sm"
                  >
                    View AI Job Recommendations →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          <div className="flex gap-3">
            {isOnboarding && (
              <Button onClick={() => navigate('/jobseeker/dashboard?welcome=1')} className="ml-auto">
                Continue to Dashboard →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
