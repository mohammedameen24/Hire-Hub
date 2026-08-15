import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const [jobRes, matchRes, appsRes] = await Promise.allSettled([
          axiosInstance.get(`/jobs/${id}`),
          axiosInstance.get(`/jobs/${id}/match-score`),
          axiosInstance.get('/jobseeker/applications'),
        ]);
        if (jobRes.status === 'fulfilled') setJob(jobRes.value.data);
        if (matchRes.status === 'fulfilled') setMatchData(matchRes.value.data);
        if (appsRes.status === 'fulfilled') {
          const userApps = appsRes.value.data?.applications || appsRes.value.data || [];
          const hasApplied = userApps.some(
            (app) =>
              String(app.job_id || app.job?._id || app.job || '') === String(id) ||
              String(app.jobId?._id || app.jobId || '') === String(id)
          );
          setApplied(hasApplied);
        }
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleApply = async () => {
    setApplying(true);
    setApplyError('');
    try {
      await axiosInstance.post(`/jobs/${id}/apply`);
      setApplied(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.detail || 'Failed to submit application.';
      setApplyError(msg);
      if (err.response?.status === 409) {
        setApplied(true);
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-64" />
        <div className="skeleton h-[500px] rounded-xl" />
      </div>
    );
  }

  if (!job) {
    return (
      <Card padding="lg" className="text-center">
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Job not found</h2>
        <p className="text-slate-500 mb-4">This job may have been removed or doesn&apos;t exist.</p>
        <Button variant="secondary" onClick={() => navigate('/jobseeker/jobs')}>
          Back to Search
        </Button>
      </Card>
    );
  }

  const matchScore = matchData?.match_score ?? matchData?.score;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {applyError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 animate-fade-in flex items-center justify-between">
          <span>{applyError}</span>
          <button onClick={() => setApplyError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{job.title}</h1>
                <p className="text-lg text-slate-500 mt-1">{job.company}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-slate-500">
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {job.location}
                    </span>
                  )}
                  {job.job_type && <Badge variant="neutral">{job.job_type}</Badge>}
                  {job.salary && <span className="font-semibold text-slate-700">{job.salary}</span>}
                </div>
              </div>

              <div className="flex gap-3">
                {applied ? (
                  <Badge variant="success" size="md">
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Applied
                  </Badge>
                ) : (
                  <Button onClick={handleApply} loading={applying}>
                    Apply Now
                  </Button>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">Job Description</h2>
              <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </div>

            {job.requirements && (
              <div className="border-t border-slate-100 pt-6 mt-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Requirements</h2>
                <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {job.requirements}
                </div>
              </div>
            )}

            {job.skills_required?.length > 0 && (
              <div className="border-t border-slate-100 pt-6 mt-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-3">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills_required.map((skill) => (
                    <Badge key={skill} variant="neutral">{skill}</Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar — match score */}
        <div className="space-y-6">
          {matchScore !== undefined && (
            <Card className="text-center">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Your Match Score</h3>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="7" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={matchScore >= 70 ? 'var(--color-accent-500)' : matchScore >= 40 ? 'var(--color-warn-500)' : 'var(--color-danger-500)'}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={283 - (283 * matchScore) / 100}
                    className="animate-score-ring"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-slate-800">
                  {Math.round(matchScore)}%
                </span>
              </div>
            </Card>
          )}

          {/* Matched skills */}
          {matchData?.matched_skills?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success-500" />
                Matched Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchData.matched_skills.map((skill) => (
                  <Badge key={skill} variant="success" size="sm">{skill}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Missing skills */}
          {matchData?.missing_skills?.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-warn-500" />
                Missing Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {matchData.missing_skills.map((skill) => (
                  <Badge key={skill} variant="warning" size="sm">{skill}</Badge>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
