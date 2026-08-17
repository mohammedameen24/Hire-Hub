import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { CardSkeleton } from '../../components/ui/Spinner';

export default function EMDashboard() {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [statsRes, jobsRes, interviewsRes] = await Promise.allSettled([
          axiosInstance.get('/employer/dashboard/stats'),
          axiosInstance.get('/employer/jobs', { params: { limit: 5 } }),
          axiosInstance.get('/employer/interviews'),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        if (jobsRes.status === 'fulfilled') setRecentJobs(jobsRes.value.data?.jobs || jobsRes.value.data || []);
        if (interviewsRes.status === 'fulfilled') setInterviews(interviewsRes.value.data?.interviews || []);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const statCards = [
    {
      label: 'Active Jobs',
      value: stats?.active_jobs ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-accent-50 text-accent-600',
    },
    {
      label: 'Total Applicants',
      value: stats?.total_applicants ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Shortlisted',
      value: stats?.shortlisted ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Interviews',
      value: stats?.interviews ?? '—',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'bg-violet-50 text-violet-600',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Employer Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">Manage your jobs and review candidates.</p>
        </div>
        <Link
          to="/employer/post-job"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-accent-600 rounded-xl hover:bg-accent-700 transition-colors shadow-sm w-full sm:w-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-24 sm:h-28 rounded-xl" />)
          : statCards.map((s) => (
              <Card key={s.label} padding="none" hover className="p-3.5 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-slate-500 truncate">{s.label}</p>
                    <p className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5 sm:mt-1">{s.value}</p>
                  </div>
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${s.color}`}>
                    {s.icon}
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {/* Scheduled Interviews section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <span>Scheduled Interviews 📅</span>
            <Badge variant="accent" size="sm">{interviews.length}</Badge>
          </h2>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : interviews.length === 0 ? (
          <Card padding="md" className="text-center py-6 bg-slate-50/50">
            <p className="text-sm text-slate-500">No interviews scheduled yet. Schedule interviews directly from your Job Applicants lists.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {interviews.map((item) => {
              const formattedDate = item.interview_date
                ? new Date(item.interview_date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Date pending';
              const isUrl = item.interview_location && (item.interview_location.startsWith('http://') || item.interview_location.startsWith('https://'));

              return (
                <Card key={item._id} padding="md" hover className="border-l-4 border-l-accent-500 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <Link
                          to={`/employer/candidates/${item.candidate_id}`}
                          className="font-bold text-slate-800 hover:text-accent-600 text-base truncate block"
                        >
                          {item.candidate_name}
                        </Link>
                        <p className="text-xs text-slate-500 font-medium truncate">{item.job_title}</p>
                      </div>
                      <Badge variant="accent" size="sm" className="capitalize flex-shrink-0">
                        {item.interview_type === 'video' ? '📹 Video' : item.interview_type === 'phone' ? '📞 Phone' : '🏢 In-Person'}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <svg className="w-3.5 h-3.5 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formattedDate} {item.interview_time ? `at ${item.interview_time}` : ''}
                      </div>

                      {item.interview_location && (
                        <div className="flex items-center gap-1.5 truncate">
                          <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          {isUrl ? (
                            <a href={item.interview_location} target="_blank" rel="noopener noreferrer" className="text-accent-600 underline font-medium truncate hover:text-accent-700">
                              {item.interview_location} ↗
                            </a>
                          ) : (
                            <span className="truncate">{item.interview_location}</span>
                          )}
                        </div>
                      )}

                      {item.interview_notes && (
                        <p className="text-[11px] text-slate-500 italic border-t border-slate-200/60 pt-1 mt-1 truncate">
                          &quot;{item.interview_notes}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 text-right">
                    <Link
                      to={`/employer/jobs/${item.job_id}/applicants`}
                      className="text-xs font-semibold text-accent-600 hover:text-accent-700 inline-flex items-center gap-1"
                    >
                      View in Applicants →
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent job postings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent Job Postings</h2>
          <Link to="/employer/jobs" className="text-sm font-medium text-accent-600 hover:text-accent-700">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : recentJobs.length === 0 ? (
          <Card padding="lg" className="text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-700 mb-1">No jobs posted yet</h3>
            <p className="text-sm text-slate-500 mb-4">Start posting jobs to find the best candidates.</p>
            <Link
              to="/employer/post-job"
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent-600 hover:text-accent-700"
            >
              Post your first job →
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentJobs.slice(0, 5).map((job) => (
              <Card key={job._id || job.id} hover padding="md">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate">{job.title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                      {job.location && <span>{job.location}</span>}
                      {job.job_type && <Badge variant="neutral" size="sm">{job.job_type}</Badge>}
                      <span>{job.applicant_count ?? 0} applicants</span>
                    </div>
                  </div>
                  <Link
                    to={`/employer/jobs/${job._id || job.id}/applicants`}
                    className="text-sm font-medium text-accent-600 hover:text-accent-700 flex-shrink-0"
                  >
                    View Applicants →
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
