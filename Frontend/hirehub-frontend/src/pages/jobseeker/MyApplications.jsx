import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';

const statusVariant = {
  pending: 'neutral',
  reviewing: 'accent',
  shortlisted: 'success',
  interview: 'accent',
  rejected: 'danger',
  accepted: 'success',
  withdrawn: 'neutral',
};

const statusLabel = {
  pending: 'Pending',
  reviewing: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interview Scheduled',
  rejected: 'Rejected',
  accepted: 'Selected',
  withdrawn: 'Withdrawn',
};

const interviewTypeIcon = {
  video: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
    </svg>
  ),
  phone: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  'in-person': (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

function InterviewBanner({ app }) {
  const hasDate = app.interview_date;
  const hasTime = app.interview_time;
  const hasLocation = app.interview_location;
  const typeIcon = interviewTypeIcon[app.interview_type] || interviewTypeIcon['in-person'];

  return (
    <div className="mt-3 bg-blue-50 border border-blue-200 rounded-xl p-4 animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800 mb-1">Interview Scheduled</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-blue-700">
            {hasDate && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(app.interview_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {hasTime && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {app.interview_time}
              </span>
            )}
            {app.interview_type && (
              <span className="flex items-center gap-1 capitalize">
                {typeIcon}
                {app.interview_type.replace('-', ' ')}
              </span>
            )}
            {hasLocation && (
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {app.interview_location.startsWith('http://') || app.interview_location.startsWith('https://') ? (
                  <a
                    href={app.interview_location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold underline text-blue-800 hover:text-blue-900"
                  >
                    Join Meeting Link ↗
                  </a>
                ) : (
                  <span>{app.interview_location}</span>
                )}
              </span>
            )}
          </div>
          {app.interview_notes && (
            <p className="mt-1.5 text-xs text-blue-600 bg-blue-100 px-2.5 py-1.5 rounded-lg">
              📝 {app.interview_notes}
            </p>
          )}
          {!hasDate && !hasTime && !hasLocation && (
            <p className="text-xs text-blue-600 mt-1">
              The employer will share interview details soon.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function AcceptedBanner() {
  return (
    <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-800">🎉 Congratulations! You've been selected!</p>
          <p className="text-xs text-emerald-600 mt-0.5">The employer will reach out to you with next steps.</p>
        </div>
      </div>
    </div>
  );
}

function RejectedBanner() {
  return (
    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3.5 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-red-100 text-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-red-700">Not selected for this role</p>
          <p className="text-xs text-red-500 mt-0.5">Keep going — the right opportunity is out there.</p>
        </div>
      </div>
    </div>
  );
}

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await axiosInstance.get('/jobseeker/applications');
        setApplications(res.data.applications || res.data || []);
      } catch {
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApps();
  }, []);

  const handleWithdraw = async (appId) => {
    if (!window.confirm('Are you sure you want to withdraw this application?')) return;
    setWithdrawingId(appId);
    try {
      await axiosInstance.delete(`/jobseeker/applications/${appId}`);
      setApplications((prev) =>
        prev.map((a) =>
          (a._id || a.id) === appId ? { ...a, status: 'withdrawn' } : a
        )
      );
    } catch (err) {
      const msg = err?.response?.data?.message || 'Could not withdraw application.';
      alert(msg);
    } finally {
      setWithdrawingId(null);
    }
  };

  const canWithdraw = (status) => ['pending', 'reviewing'].includes(status);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Applications</h1>
        <p className="text-slate-500 mt-1">Track the status of your job applications.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : applications.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No applications yet</h3>
          <p className="text-sm text-slate-500 mb-4">Start applying to jobs and track your progress here.</p>
          <Link
            to="/jobseeker/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-accent-600 hover:text-accent-700"
          >
            Browse Jobs →
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Card key={app._id || app.id} padding="md"
              className={`transition-all ${app.status === 'interview' ? 'ring-1 ring-blue-200' : ''} ${app.status === 'accepted' ? 'ring-1 ring-emerald-200' : ''}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <Link
                      to={`/jobseeker/jobs/${app.job_id || app.job?._id}`}
                      className="font-semibold text-slate-800 hover:text-accent-600 transition-colors truncate"
                    >
                      {app.job_title || app.job?.title || 'Job'}
                    </Link>
                    <Badge
                      variant={statusVariant[app.status] || 'neutral'}
                      size="sm"
                    >
                      {statusLabel[app.status] || app.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">{app.company || app.job?.company}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : '—'}
                  </p>

                  {/* Status-specific banners */}
                  {app.status === 'interview' && <InterviewBanner app={app} />}
                  {app.status === 'accepted' && <AcceptedBanner />}
                  {app.status === 'rejected' && <RejectedBanner />}
                </div>

                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  {/* Match score */}
                  {app.match_score !== undefined && (
                    <div className="text-center">
                      <p className="text-2xl font-bold text-accent-600">{Math.round(app.match_score)}%</p>
                      <p className="text-xs text-slate-400">Match</p>
                    </div>
                  )}

                  {/* Withdraw button */}
                  {canWithdraw(app.status) && (
                    <button
                      id={`withdraw-app-${app._id || app.id}`}
                      onClick={() => handleWithdraw(app._id || app.id)}
                      disabled={withdrawingId === (app._id || app.id)}
                      className="text-xs text-slate-400 hover:text-danger-600 hover:underline transition-colors disabled:opacity-50"
                    >
                      {withdrawingId === (app._id || app.id) ? 'Withdrawing…' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
