import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { CardSkeleton } from '../../components/ui/Spinner';

export default function JobSearch() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState(''); // Bug #24 fixed

  const fetchJobs = async (p = 1) => {
    // Bug #26 fixed — guard prevents firing a new request while one is in flight
    if (loading && p !== 1) return;
    setLoading(true);
    setFetchError('');
    try {
      const res = await axiosInstance.get('/jobs', {
        params: {
          q: search || undefined,
          location: location || undefined,
          job_type: jobType || undefined,
          page: p,
          limit: 12,
        },
      });
      setJobs(res.data.jobs || res.data || []);
      setTotalPages(res.data.total_pages || 1);
      setPage(p);
    } catch (err) {
      // Bug #24 fixed — show a real error instead of the "No jobs found" empty state
      setFetchError(
        err.response?.data?.message ||
        'Failed to load jobs. Please check your connection and try again.'
      );
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs(1);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Search Jobs</h1>
        <p className="text-slate-500 mt-1">Find your next opportunity from thousands of open positions.</p>
      </div>

      {/* Search filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Job title, skills, or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div className="sm:w-48">
            <input
              type="text"
              placeholder="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div className="sm:w-40">
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 cursor-pointer"
            >
              <option value="">All Types</option>
              <option value="full-time">Full Time</option>
              <option value="part-time">Part Time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <Button type="submit">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </Button>
        </form>
      </Card>

      {/* Error banner */}
      {fetchError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={() => setFetchError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Job listings */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No jobs found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search terms or filters.</p>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {jobs.map((job) => (
              <Link key={job._id || job.id} to={`/jobseeker/jobs/${job._id || job.id}`}>
                <Card hover padding="md" className="h-full flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-slate-800 leading-tight">{job.title}</h3>
                    {job.match_score !== undefined && (
                      <Badge variant="accent" size="sm" className="ml-2 flex-shrink-0">
                        {Math.round(job.match_score)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mb-1">{job.company}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-3">
                    {job.location && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {job.location}
                      </span>
                    )}
                    {job.job_type && <Badge variant="neutral" size="sm">{job.job_type}</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2 flex-1">
                    {job.description?.slice(0, 120)}...
                  </p>
                  {job.salary && (
                    <p className="text-sm font-semibold text-slate-700 mt-3">{job.salary}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => fetchJobs(page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-500 px-3">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => fetchJobs(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
