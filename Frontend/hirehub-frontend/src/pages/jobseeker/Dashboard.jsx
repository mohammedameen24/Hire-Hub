import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';
import { useAuthStore } from '../../store/authStore';

// ── Status badge helper ──────────────────────────────────────
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
  shortlisted: 'Shortlisted ⭐',
  interview: 'Interview 📅',
  rejected: 'Rejected',
  accepted: 'Selected 🎉',
  withdrawn: 'Withdrawn',
};

export default function JSDashboard() {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentApps, setRecentApps] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore((s) => s.user);
  const [searchParams] = useSearchParams();

  const isWelcome = searchParams.get('welcome') === '1';

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, recsRes, appsRes] = await Promise.allSettled([
          axiosInstance.get('/jobseeker/dashboard/stats'),
          axiosInstance.get('/jobseeker/recommendations', { params: { limit: 3 } }),
          axiosInstance.get('/jobseeker/applications'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (recsRes.status === 'fulfilled') setRecentJobs(recsRes.value.data?.recommendations || []);
        if (appsRes.status === 'fulfilled') {
          const apps = appsRes.value.data?.applications || [];
          setAllApps(apps);
          setRecentApps(apps.slice(0, 4));
        }
      } catch {
        // silently fail — will show empty states
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    {
      label: 'Applications',
      value: stats?.total_applications ?? '—',
      change: stats?.total_applications > 0 ? 'Total submitted' : 'No applications yet',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'bg-accent-50 text-accent-600',
      bgGradient: 'from-accent-50/50 to-transparent',
      link: '/jobseeker/applications',
    },
    {
      label: 'Interviews',
      value: stats?.interviews ?? '—',
      change: stats?.interviews > 0 ? 'Scheduled interviews' : 'No interviews yet',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600',
      bgGradient: 'from-blue-50/50 to-transparent',
      link: '/jobseeker/applications',
    },
    {
      label: 'Profile Score',
      value: stats?.profile_completeness ? `${stats.profile_completeness}%` : '—',
      change: stats?.profile_completeness >= 80 ? 'Great profile!' : 'Complete your profile',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600',
      bgGradient: 'from-emerald-50/50 to-transparent',
      link: '/jobseeker/profile',
    },
    {
      label: 'AI Matches',
      value: stats?.recommendations_count ?? '—',
      change: stats?.recommendations_count > 0 ? 'Jobs matched for you' : 'Upload resume for matches',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'bg-violet-50 text-violet-600',
      bgGradient: 'from-violet-50/50 to-transparent',
      link: '/jobseeker/recommendations',
    },
  ];

  const quickActions = [
    {
      to: '/jobseeker/jobs',
      label: 'Search Jobs',
      desc: 'Browse all open positions',
      color: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      to: '/jobseeker/applications',
      label: 'My Applications',
      desc: 'Track your application status',
      color: 'bg-accent-100 text-accent-600 group-hover:bg-accent-200',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      to: '/jobseeker/recommendations',
      label: 'AI Recommendations',
      desc: 'Jobs matched to your profile',
      color: 'bg-violet-100 text-violet-600 group-hover:bg-violet-200',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Profile completeness tip
  const profileTip = () => {
    const pct = stats?.profile_completeness || 0;
    if (pct < 50) return { msg: 'Your profile is incomplete — fill in your skills and experience to get better matches.', link: '/jobseeker/profile', cta: 'Complete profile →' };
    if (pct < 80) return { msg: 'Almost there! Upload your resume to boost your profile score and unlock AI matches.', link: '/jobseeker/resume', cta: 'Upload resume →' };
    return null;
  };
  const tip = profileTip();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Onboarding Welcome Banner */}
      {isWelcome && (
        <div className="bg-emerald-500 text-white rounded-2xl p-5 sm:p-6 shadow-lg animate-fade-in flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl flex-shrink-0">🎉</div>
          <div>
            <h2 className="text-base sm:text-lg font-bold">Account Setup Complete!</h2>
            <p className="text-xs sm:text-sm text-emerald-100 mt-0.5">
              Welcome to HireHub! Your profile is ready. Start exploring AI-matched job opportunities below.
            </p>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-accent-600 to-accent-800 rounded-2xl p-6 md:p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-accent-200 text-sm font-medium">{getGreeting()}</p>
            <h1 className="text-2xl md:text-3xl font-bold mt-1">{user?.name || 'Welcome'}!</h1>
            <p className="text-accent-100 mt-2 max-w-lg text-sm">
              Here&apos;s your job search overview. Keep going — your next opportunity is closer than you think.
            </p>
          </div>
          <Link
            to="/jobseeker/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-accent-700 font-semibold text-sm rounded-xl hover:bg-accent-50 transition-colors shadow-sm flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Find Jobs
          </Link>
        </div>
      </div>

      {/* Upcoming Scheduled Interviews for Jobseeker */}
      {!loading && allApps.filter((a) => a.status === 'interview').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Upcoming Scheduled Interviews 📅</span>
              <Badge variant="accent" size="sm">
                {allApps.filter((a) => a.status === 'interview').length}
              </Badge>
            </h2>
            <Link to="/jobseeker/applications" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
              View All Applications →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {allApps
              .filter((a) => a.status === 'interview')
              .map((app) => {
                const formattedDate = app.interview_date
                  ? new Date(app.interview_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  : 'Time to be confirmed';
                const isUrl =
                  app.interview_location &&
                  (app.interview_location.startsWith('http://') || app.interview_location.startsWith('https://'));

                return (
                  <Card key={app._id || app.id} padding="md" className="border-l-4 border-l-blue-500 bg-blue-50/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-slate-800 text-base">{app.job_title || app.job?.title}</h3>
                          <p className="text-xs font-semibold text-blue-700">{app.company}</p>
                        </div>
                        <Badge variant="accent" size="sm" className="capitalize flex-shrink-0">
                          {app.interview_type === 'video'
                            ? '📹 Video Call'
                            : app.interview_type === 'phone'
                              ? '📞 Phone Call'
                              : '🏢 In-Person'}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-xl border border-blue-100 shadow-sm mt-3">
                        <div className="flex items-center gap-2 font-bold text-slate-800">
                          <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{formattedDate} {app.interview_time ? `at ${app.interview_time}` : ''}</span>
                        </div>

                        {app.interview_location && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {isUrl ? (
                              <a
                                href={app.interview_location}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 underline truncate"
                              >
                                Join Meeting Link ↗
                              </a>
                            ) : (
                              <span className="truncate font-medium">{app.interview_location}</span>
                            )}
                          </div>
                        )}

                        {app.interview_notes && (
                          <div className="text-[11px] text-slate-600 italic bg-blue-50/50 p-2 rounded-lg border border-blue-100 mt-1">
                            📝 &quot;{app.interview_notes}&quot;
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Profile completeness tip */}
      {!loading && tip && (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-amber-800">{tip.msg}</p>
          </div>
          <Link to={tip.link} className="text-sm font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap">
            {tip.cta}
          </Link>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
          : statCards.map((s) => (
            <Link key={s.label} to={s.link}>
              <Card padding="none" hover className="overflow-hidden h-full">
                <div className={`h-1.5 bg-gradient-to-r ${s.bgGradient}`} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-500">{s.label}</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{s.value}</p>
                      <p className="text-xs text-slate-400 mt-1">{s.change}</p>
                    </div>
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${s.color}`}>
                      {s.icon}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
      </div>

      {/* Quick Actions — 5 cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
<div className="grid sm:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to} className="group">
              <Card hover padding="md" className="flex flex-col items-center text-center gap-3 h-full py-5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group-hover:scale-105 ${action.color}`}>
                  {action.icon}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-tight">{action.desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity + Top Recommendations — side by side on large screens */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Applications</h2>
            <Link to="/jobseeker/applications" className="text-sm font-medium text-accent-600 hover:text-accent-700">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : recentApps.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No applications yet</p>
              <p className="text-xs text-slate-400 mb-3">Start applying to track your progress here.</p>
              <Link to="/jobseeker/jobs" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                Browse Jobs →
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentApps.map((app) => (
                <Link key={app._id || app.id} to="/jobseeker/applications">
                  <Card hover padding="md">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate text-sm">
                          {app.job_title || app.job?.title || 'Job'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{app.company}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {app.match_score !== null && app.match_score !== undefined && (
                          <span className="text-xs font-semibold text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full">
                            {Math.round(app.match_score)}%
                          </span>
                        )}
                        <Badge variant={statusVariant[app.status] || 'neutral'} size="sm">
                          {statusLabel[app.status] || app.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Recommended Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Top AI Matches</h2>
            <Link to="/jobseeker/recommendations" className="text-sm font-medium text-accent-600 hover:text-accent-700">
              View all →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          ) : recentJobs.length === 0 ? (
            <Card padding="lg" className="text-center">
              <div className="w-14 h-14 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-700 mb-1">No matches yet</p>
              <p className="text-xs text-slate-400 mb-3">Complete your profile to get AI-powered job matches.</p>
              <Link to="/jobseeker/profile" className="text-sm font-semibold text-accent-600 hover:text-accent-700">
                Complete profile →
              </Link>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentJobs.map((job) => (
                <Link key={job._id || job.id} to={`/jobseeker/jobs/${job.job_id || job._id || job.id}`}>
                  <Card hover padding="md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate text-sm">{job.title || job.job_title}</p>
                        <p className="text-xs text-slate-500 truncate">{job.company}</p>
                        {job.location && (
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {job.job_type && (
                          <span className="text-xs text-slate-400">{job.job_type}</span>
                        )}
                      </div>
                    </div>
                    {job.matched_skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {job.matched_skills.slice(0, 3).map((skill) => (
                          <span key={skill} className="text-xs px-1.5 py-0.5 bg-success-50 text-success-700 rounded-full">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
