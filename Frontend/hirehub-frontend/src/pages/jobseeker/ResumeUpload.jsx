import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import OnboardingStepper from '../../components/ui/OnboardingStepper';
import { getStorageUrl } from '../../utils/url';

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
  const [analysis, setAnalysis] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const fetchExistingResume = async () => {
      try {
        const res = await axiosInstance.get('/jobseeker/profile');
        const profile = res.data;
        if (profile && profile.resume_url) {
          const parsed = profile.parsed_resume_data || {};
          setAnalysis({
            resume_url: profile.resume_url,
            match_score: parsed.match_score || 80,
            score: parsed.match_score || 80,
            matched_skills: parsed.matched_skills || profile.skills || [],
            missing_skills: parsed.missing_skills || [],
            suggestions: parsed.suggestions || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch existing profile resume:', err);
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
    setAnalysis(null);
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
        onUploadProgress: (e) => {
          if (e.total) {
            const pct = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(pct);
          }
        },
      });
      setAnalysis(res.data);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Upload failed. Please check your file and try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const matchScore = analysis?.match_score ?? analysis?.score;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Onboarding Stepper Header */}
      {isOnboarding && <OnboardingStepper steps={JOBSEEKER_STEPS} currentStep={3} />}

      {/* Onboarding Guidance Callout */}
      {isOnboarding && (
        <div className="bg-gradient-to-r from-accent-600 to-accent-800 text-white rounded-2xl p-5 sm:p-6 shadow-md animate-fade-in flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-xl font-bold">
              📄
            </div>
            <div>
              <h2 className="text-lg font-bold">Step 3: Upload Your Resume</h2>
              <p className="text-sm text-accent-100 mt-1 leading-relaxed">
                Upload your PDF resume for instant AI analysis and automatic skill extraction.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="hidden sm:inline-flex bg-white/10 text-white hover:bg-white/20 border-white/20 whitespace-nowrap"
            onClick={() => navigate('/jobseeker/dashboard?welcome=1')}
          >
            Skip to Dashboard →
          </Button>
        </div>
      )}

      {!isOnboarding && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Resume</h1>
            <p className="text-slate-500 mt-1">Upload your resume for AI-powered analysis and job matching.</p>
          </div>
          {/* Persistent view button when resume already saved */}
          {analysis?.resume_url && (
            <a
              href={getStorageUrl(analysis.resume_url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-accent-600 bg-accent-50 border border-accent-200 rounded-lg hover:bg-accent-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              View Saved Resume 📄
            </a>
          )}
        </div>
      )}

      {/* Upload zone */}
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
                  setAnalysis(null);
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

        {/* Upload progress */}
        {uploading && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-600 font-medium">Uploading & analyzing...</span>
              <span className="text-accent-600 font-semibold">{uploadProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-500 rounded-full transition-all duration-300 animate-progress-fill"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-start gap-2 animate-fade-in">
            <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* Upload button */}
        {file && !uploading && !analysis && (
          <div className="mt-6 flex items-center justify-between">
            {isOnboarding && (
              <button
                type="button"
                onClick={() => navigate('/jobseeker/dashboard?welcome=1')}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Skip for now →
              </button>
            )}
            <Button onClick={handleUpload} className="ml-auto">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload & Analyze
            </Button>
          </div>
        )}

        {isOnboarding && !file && (
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={() => navigate('/jobseeker/dashboard?welcome=1')}>
              Skip & Go to Dashboard →
            </Button>
          </div>
        )}
      </Card>

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-6 animate-fade-in">
          <div className="p-4 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Resume uploaded and saved successfully! Your profile has been updated.</span>
            </div>
            {analysis.resume_url && (
              <a
                href={getStorageUrl(analysis.resume_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent-700 underline hover:text-accent-800 text-xs px-2.5 py-1 bg-white rounded border border-success-300 shadow-sm"
              >
                View PDF 📄
              </a>
            )}
          </div>

          <h2 className="text-lg font-semibold text-slate-800">AI Analysis Results</h2>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Match score */}
            {matchScore !== undefined && (
              <Card className="flex flex-col items-center justify-center py-8">
                <div className="relative w-28 h-28 mb-4">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="var(--color-accent-500)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * matchScore) / 100}
                      className="animate-score-ring"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800">
                    {Math.round(matchScore)}%
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600">Match Score</p>
              </Card>
            )}

            {/* Matched skills */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success-500" />
                Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {(analysis.matched_skills || []).length > 0 ? (
                  analysis.matched_skills.map((skill) => (
                    <Badge key={skill} variant="success" size="sm">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No matched skills found</p>
                )}
              </div>
            </Card>

            {/* Missing skills */}
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warn-500" />
                Skills to Improve
              </h3>
              <div className="flex flex-wrap gap-2">
                {(analysis.missing_skills || []).length > 0 ? (
                  analysis.missing_skills.map((skill) => (
                    <Badge key={skill} variant="warning" size="sm">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No gaps identified</p>
                )}
              </div>
            </Card>
          </div>

          {/* Improvement suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Improvement Suggestions</h3>
              <ul className="space-y-2">
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <svg className="w-4 h-4 mt-0.5 text-accent-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Finish Onboarding Button */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button
              variant="secondary"
              onClick={() => {
                setFile(null);
                setAnalysis(null);
                setUploadProgress(0);
              }}
            >
              Upload Another Resume
            </Button>
            {isOnboarding && (
              <Button onClick={() => navigate('/jobseeker/dashboard?welcome=1')} size="lg">
                Complete Setup & Go to Dashboard →
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
