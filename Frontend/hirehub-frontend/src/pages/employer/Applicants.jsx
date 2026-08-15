import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';
import { getStorageUrl } from '../../utils/url';

/* ──────────────────────────────────────────────────────────
   Schedule Interview Modal
────────────────────────────────────────────────────────── */
function ScheduleInterviewModal({ applicant, jobId, onClose, onScheduled }) {
  const [form, setForm] = useState({
    interview_date: applicant?.interview_date ? new Date(applicant.interview_date).toISOString().split('T')[0] : '',
    interview_time: applicant?.interview_time || '',
    interview_type: applicant?.interview_type || 'video',
    interview_location: applicant?.interview_location || '',
    interview_notes: applicant?.interview_notes || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.interview_date) {
      setError('Interview date is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Use the application _id for the interview scheduling endpoint
      const appId = applicant._id || applicant.id || applicant.application_id;
      await axiosInstance.put(`/employer/applications/${appId}/interview`, form);
      onScheduled(appId, form);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to schedule interview. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = [
    {
      value: 'video',
      label: 'Video Call',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
        </svg>
      ),
    },
    {
      value: 'phone',
      label: 'Phone Call',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      value: 'in-person',
      label: 'In-Person',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h4m-4 0V11m0 0h4m-4 0H9" />
        </svg>
      ),
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      id="interview-modal-backdrop"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto max-h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Bar */}
        <div className="h-1.5 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-700 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 text-accent-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
              📅
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Schedule Interview</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Candidate: <span className="font-semibold text-slate-700">{applicant.name || applicant.full_name || 'Candidate'}</span>
              </p>
            </div>
          </div>
          <button
            id="close-interview-modal"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1.5 rounded-xl hover:bg-slate-200/60 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Interview Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Interview Format
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  id={`interview-type-${opt.value}`}
                  onClick={() => setForm((p) => ({ ...p, interview_type: opt.value }))}
                  className={`flex flex-col items-center justify-center py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all cursor-pointer gap-1.5 ${
                    form.interview_type === opt.value
                      ? 'border-accent-500 bg-accent-50/80 text-accent-700 shadow-sm ring-1 ring-accent-400/30'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="interview_date" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Date <span className="text-danger-500">*</span>
              </label>
              <input
                id="interview_date"
                name="interview_date"
                type="date"
                value={form.interview_date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm"
              />
            </div>
            <div>
              <label htmlFor="interview_time" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Time
              </label>
              <input
                id="interview_time"
                name="interview_time"
                type="time"
                value={form.interview_time}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm"
              />
            </div>
          </div>

          {/* Location / Link */}
          <div>
            <label htmlFor="interview_location" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              {form.interview_type === 'video'
                ? 'Meeting Link'
                : form.interview_type === 'phone'
                ? 'Phone Number'
                : 'Location / Office Address'}
            </label>
            <input
              id="interview_location"
              name="interview_location"
              type="text"
              value={form.interview_location}
              onChange={handleChange}
              placeholder={
                form.interview_type === 'video'
                  ? 'https://meet.google.com/abc-defg-hij'
                  : form.interview_type === 'phone'
                  ? '+1 (555) 000-0000'
                  : '123 Tech Park, Suite 400'
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 shadow-sm"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="interview_notes" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Notes / Instructions <span className="text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              id="interview_notes"
              name="interview_notes"
              rows={3}
              value={form.interview_notes}
              onChange={handleChange}
              placeholder="Add any instructions, agenda, or preparations for the candidate..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none shadow-sm"
            />
          </div>

          {error && (
            <div className="p-3 bg-danger-50 border border-danger-200 rounded-xl text-xs text-danger-700 font-medium">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" id="confirm-schedule-interview" loading={saving} className="flex-1">
              Schedule Interview
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

/* ──────────────────────────────────────────────────────────
   Applicant Interview Details Banner (Employer View)
────────────────────────────────────────────────────────── */
function ApplicantInterviewBanner({ applicant, onEdit }) {
  if (applicant.status !== 'interview' && !applicant.interview_date) return null;
  const isUrl =
    applicant.interview_location &&
    (applicant.interview_location.startsWith('http://') || applicant.interview_location.startsWith('https://'));

  const formattedDate = applicant.interview_date
    ? new Date(applicant.interview_date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <div className="w-full mt-3 bg-accent-50/80 border border-accent-200 rounded-xl p-3 sm:p-3.5 text-xs text-accent-950 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-accent-100 text-accent-700 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
          📅
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 font-bold text-accent-900 flex-wrap">
            <span>Interview Scheduled</span>
            {applicant.interview_type && (
              <span className="capitalize px-2 py-0.5 rounded-full bg-accent-100 text-accent-800 text-[11px]">
                {applicant.interview_type === 'video'
                  ? '📹 Video Call'
                  : applicant.interview_type === 'phone'
                  ? '📞 Phone Call'
                  : '🏢 In-Person'}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-700 font-medium">
            {formattedDate && (
              <span className="flex items-center gap-1">
                <span>📆</span> {formattedDate}
              </span>
            )}
            {applicant.interview_time && (
              <span className="flex items-center gap-1">
                <span>⏰</span> {applicant.interview_time}
              </span>
            )}
            {applicant.interview_location && (
              <span className="flex items-center gap-1 truncate max-w-xs">
                <span>📍</span>
                {isUrl ? (
                  <a
                    href={applicant.interview_location}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent-700 underline font-semibold hover:text-accent-900 truncate"
                  >
                    {applicant.interview_location} ↗
                  </a>
                ) : (
                  <span className="truncate">{applicant.interview_location}</span>
                )}
              </span>
            )}
          </div>
          {applicant.interview_notes && (
            <p className="text-slate-600 italic bg-white/70 px-2 py-1 rounded border border-accent-100 mt-1">
              &quot;{applicant.interview_notes}&quot;
            </p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        className="self-start sm:self-center px-3 py-1.5 bg-white hover:bg-accent-100 text-accent-800 font-semibold border border-accent-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-xs shadow-sm flex-shrink-0"
      >
        Edit Schedule ✏️
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Score ring component
────────────────────────────────────────────────────────── */
function ScoreRing({ score, size = 56 }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = ((score || 0) / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="flex-shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={6} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        fontSize={size * 0.22}
        fontWeight="700"
        fill={color}
      >
        {Math.round(score || 0)}%
      </text>
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────
   Score bar (for ranking view)
────────────────────────────────────────────────────────── */
function ScoreBar({ score }) {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-accent-500' : 'bg-amber-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${Math.min(100, score || 0)}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-600 w-8 text-right">
        {Math.round(score || 0)}%
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   Main component
────────────────────────────────────────────────────────── */
export default function Applicants() {
  const { id: jobId } = useParams();
  const [applicants, setApplicants] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'table' | 'ranking'
  const [interviewTarget, setInterviewTarget] = useState(null); // applicant to schedule interview for

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const res = await axiosInstance.get(`/employer/jobs/${jobId}/applicants`);
        const data = res.data.applicants || res.data || [];
        data.sort((a, b) => (b.match_score || b.score || 0) - (a.match_score || a.score || 0));
        setApplicants(data);
        setJobTitle(res.data.job_title || '');
      } catch {
        setApplicants([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplicants();
  }, [jobId]);

  const [actionError, setActionError] = useState('');

  const handleAction = async (applicantId, action) => {
    setActionError('');
    try {
      await axiosInstance.post(`/employer/jobs/${jobId}/applicants/${applicantId}/${action}`);
      setApplicants((prev) =>
        prev.map((a) =>
          (a._id || a.id) === applicantId ? { ...a, status: action } : a
        )
      );
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update candidate status. Please try again.');
    }
  };

  const handleInterviewScheduled = (appId, interviewData) => {
    setApplicants((prev) =>
      prev.map((a) =>
        (a._id || a.id) === appId
          ? { ...a, status: 'interview', ...interviewData }
          : a
      )
    );
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'success';
    if (score >= 50) return 'accent';
    return 'warning';
  };

  const rankMedal = (idx) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `#${idx + 1}`;
  };

  const viewModes = [
    { key: 'card', label: 'Cards' },
    { key: 'table', label: 'Table' },
    { key: 'ranking', label: '🏆 Ranking' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/employer/jobs"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Jobs
          </Link>
          <h1 className="text-2xl font-bold text-slate-800">
            Applicants{jobTitle ? ` — ${jobTitle}` : ''}
          </h1>
          <p className="text-slate-500 mt-1">
            AI-ranked candidates for this position.{' '}
            <span className="font-medium text-slate-700">{applicants.length}</span> applicant{applicants.length !== 1 ? 's' : ''}.
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          {viewModes.map((vm) => (
            <button
              key={vm.key}
              id={`view-mode-${vm.key}`}
              onClick={() => setViewMode(vm.key)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === vm.key
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {vm.label}
            </button>
          ))}
        </div>
      </div>

      {actionError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-center justify-between animate-fade-in">
          <span>{actionError}</span>
          <button onClick={() => setActionError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : applicants.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No applicants yet</h3>
          <p className="text-sm text-slate-500">
            Candidates will appear here once they apply for this position.
          </p>
        </Card>

      /* ── Card View ──────────────────────────────────────── */
      ) : viewMode === 'card' ? (
        <div className="space-y-3">
          {applicants.map((a, idx) => {
            const score = a.match_score || a.score || 0;
            const appId = a._id || a.id;
            const candidateId = a.jobSeekerId?._id || a.jobSeekerId || a.user_id || appId;
            return (
              <Card key={appId || idx} padding="md" hover>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Rank badge */}
                  <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex-shrink-0">
                    #{idx + 1}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {(a.name || a.full_name || '?').charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Link
                        to={`/employer/candidates/${candidateId}`}
                        className="font-semibold text-slate-800 hover:text-accent-600 transition-colors"
                      >
                        {a.name || a.full_name || 'Candidate'}
                      </Link>
                      <Badge variant={scoreColor(score)} size="sm">
                        {Math.round(score)}% match
                      </Badge>
                      {a.status && a.status !== 'pending' && (
                        <Badge
                          variant={
                            a.status === 'shortlisted'
                              ? 'success'
                              : a.status === 'rejected'
                              ? 'danger'
                              : a.status === 'interview'
                              ? 'accent'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {a.status === 'interview' ? 'Interview Scheduled' : a.status}
                        </Badge>
                      )}
                    </div>
                    {a.matched_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {a.matched_skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 bg-success-50 text-success-700 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {a.resume_url && (
                      <a
                        href={getStorageUrl(a.resume_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-accent-600 hover:text-accent-700 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-accent-50 transition-colors"
                      >
                        📄 Resume
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      id={`shortlist-${appId}`}
                      onClick={() => handleAction(appId, 'shortlist')}
                      disabled={a.status === 'shortlisted'}
                    >
                      Shortlist
                    </Button>
                    <Button
                      size="sm"
                      id={`schedule-interview-${appId}`}
                      onClick={() => setInterviewTarget(a)}
                    >
                      {a.status === 'interview' ? '📅 Edit Schedule' : 'Schedule Interview'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      id={`reject-${appId}`}
                      className="text-danger-600 hover:bg-danger-50"
                      onClick={() => handleAction(appId, 'rejected')}
                      disabled={a.status === 'rejected'}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                {/* Interview Scheduled Banner */}
                <ApplicantInterviewBanner applicant={a} onEdit={() => setInterviewTarget(a)} />
              </Card>
            );
          })}
        </div>

      /* ── Ranking View ───────────────────────────────────── */
      ) : viewMode === 'ranking' ? (
        <div className="space-y-3">
          {/* Podium for top 3 */}
          {applicants.length >= 3 && (
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[applicants[1], applicants[0], applicants[2]].map((a, podiumIdx) => {
                if (!a) return null;
                const realIdx = podiumIdx === 0 ? 1 : podiumIdx === 1 ? 0 : 2;
                const score = a.match_score || a.score || 0;
                const heights = ['h-28', 'h-36', 'h-24'];
                const bgColors = ['bg-slate-100', 'bg-amber-50 border border-amber-200', 'bg-orange-50 border border-orange-200'];
                return (
                  <div
                    key={a._id || a.id || realIdx}
                    className={`${heights[podiumIdx]} ${bgColors[podiumIdx]} rounded-2xl flex flex-col items-center justify-center gap-1 relative overflow-hidden`}
                  >
                    <span className="text-2xl">{podiumIdx === 0 ? '🥈' : podiumIdx === 1 ? '🥇' : '🥉'}</span>
                    <div className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center text-sm font-bold shadow-sm">
                      {(a.name || a.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-semibold text-slate-700 text-center px-2 leading-tight truncate w-full text-center">
                      {a.name || a.full_name || 'Candidate'}
                    </p>
                    <p className="text-xs font-bold" style={{ color: score >= 80 ? '#10b981' : score >= 50 ? '#6366f1' : '#f59e0b' }}>
                      {Math.round(score)}%
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full ranked list */}
          {applicants.map((a, idx) => {
            const score = a.match_score || a.score || 0;
            const appId = a._id || a.id;
            const candidateId = a.jobSeekerId?._id || a.jobSeekerId || a.user_id || appId;
            return (
              <Card key={appId || idx} padding="md" hover className="overflow-hidden">
                <div className="flex items-center gap-4">
                  {/* Medal / rank */}
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xl font-bold flex-shrink-0">
                    {idx < 3 ? rankMedal(idx) : (
                      <span className="text-sm text-slate-500">#{idx + 1}</span>
                    )}
                  </div>

                  {/* Score ring */}
                  <ScoreRing score={score} size={52} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        to={`/employer/candidates/${candidateId}`}
                        className="font-semibold text-slate-800 hover:text-accent-600 transition-colors truncate"
                      >
                        {a.name || a.full_name || 'Candidate'}
                      </Link>
                      {a.status && a.status !== 'pending' && (
                        <Badge
                          variant={a.status === 'shortlisted' ? 'success' : a.status === 'rejected' ? 'danger' : a.status === 'interview' ? 'accent' : 'neutral'}
                          size="sm"
                        >
                          {a.status === 'interview' ? 'Interview' : a.status}
                        </Badge>
                      )}
                    </div>

                    {/* Score bar */}
                    <ScoreBar score={score} />

                    {/* Skills split */}
                    <div className="flex gap-3 mt-2">
                      {a.matched_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {a.matched_skills.slice(0, 4).map((s) => (
                            <span key={s} className="text-xs px-1.5 py-0.5 bg-success-50 text-success-700 rounded">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )}
                      {a.missing_skills?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {a.missing_skills.slice(0, 2).map((s) => (
                            <span key={s} className="text-xs px-1.5 py-0.5 bg-red-50 text-red-600 rounded">
                              ✗ {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.resume_url && (
                      <a
                        href={getStorageUrl(a.resume_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent-600 hover:text-accent-700 font-semibold px-2 py-1 rounded hover:bg-accent-50 transition-colors"
                      >
                        📄 Resume
                      </a>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      id={`rank-shortlist-${appId}`}
                      onClick={() => handleAction(appId, 'shortlist')}
                      disabled={a.status === 'shortlisted'}
                    >
                      Shortlist
                    </Button>
                    <Button
                      size="sm"
                      id={`rank-interview-${appId}`}
                      onClick={() => setInterviewTarget(a)}
                    >
                      {a.status === 'interview' ? '📅 Edit Schedule' : 'Interview'}
                    </Button>
                  </div>
                </div>
                {/* Interview Scheduled Banner */}
                <ApplicantInterviewBanner applicant={a} onEdit={() => setInterviewTarget(a)} />
              </Card>
            );
          })}
        </div>

      /* ── Table View ─────────────────────────────────────── */
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">#</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Candidate</th>
                  <th className="text-[#475569] text-left py-3 px-4 font-semibold">Match Score</th>
                  <th className="text-[#475569] text-left py-3 px-4 font-semibold">Top Skills</th>
                  <th className="text-[#475569] text-left py-3 px-4 font-semibold">Resume</th>
                  <th className="text-[#475569] text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((a, idx) => {
                  const score = a.match_score || a.score || 0;
                  const appId = a._id || a.id;
                  const candidateId = a.jobSeekerId?._id || a.jobSeekerId || a.user_id || appId;
                  return (
                    <tr key={appId || idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-medium">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <Link
                          to={`/employer/candidates/${candidateId}`}
                          className="font-medium text-slate-800 hover:text-accent-600"
                        >
                          {a.name || a.full_name || 'Candidate'}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={scoreColor(score)} size="sm">
                          {Math.round(score)}%
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {a.matched_skills?.slice(0, 3).map((s) => (
                            <span key={s} className="text-xs px-1.5 py-0.5 bg-success-50 text-success-700 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {a.resume_url ? (
                          <a href={getStorageUrl(a.resume_url)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold hover:underline">
                            📄 View
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={a.status === 'shortlisted' ? 'success' : a.status === 'rejected' ? 'danger' : a.status === 'interview' ? 'accent' : 'neutral'}
                          size="sm"
                        >
                          {a.status === 'interview' ? 'Interview Scheduled' : a.status || 'Pending'}
                        </Badge>
                        {a.status === 'interview' && a.interview_date && (
                          <p className="text-[11px] text-slate-600 font-medium mt-1">
                            📆 {new Date(a.interview_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {a.interview_time ? `· ${a.interview_time}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button size="sm" variant="secondary" id={`tbl-shortlist-${appId}`} onClick={() => handleAction(appId, 'shortlist')} disabled={a.status === 'shortlisted'}>
                            Shortlist
                          </Button>
                          <Button size="sm" id={`tbl-interview-${appId}`} onClick={() => setInterviewTarget(a)}>
                            {a.status === 'interview' ? '📅 Edit' : 'Interview'}
                          </Button>
                          <Button size="sm" variant="ghost" id={`tbl-reject-${appId}`} className="text-danger-600" onClick={() => handleAction(appId, 'rejected')} disabled={a.status === 'rejected'}>
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Schedule Interview Modal */}
      {interviewTarget && (
        <ScheduleInterviewModal
          applicant={interviewTarget}
          jobId={jobId}
          onClose={() => setInterviewTarget(null)}
          onScheduled={handleInterviewScheduled}
        />
      )}
    </div>
  );
}
