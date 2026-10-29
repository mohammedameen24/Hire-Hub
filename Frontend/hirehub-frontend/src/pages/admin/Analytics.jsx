import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get('/admin/analytics');
        setData(res.data);
      } catch (err) {
        setFetchError(err.response?.data?.message || 'Failed to load analytics. Please refresh.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const metrics = [
    {
      label: 'Total Job Seekers',
      value: data?.total_jobseekers ?? '—',
      change: data?.jobseeker_growth,
      color: 'text-accent-600',
    },
    {
      label: 'Total Employers',
      value: data?.total_employers ?? '—',
      change: data?.employer_growth,
      color: 'text-blue-600',
    },
    {
      label: 'Jobs Posted (30d)',
      value: data?.jobs_posted_30d ?? '—',
      change: data?.jobs_growth,
      color: 'text-emerald-600',
    },
    {
      label: 'Applications (30d)',
      value: data?.applications_30d ?? '—',
      change: data?.applications_growth,
      color: 'text-violet-600',
    },
    {
      label: 'Avg Match Score',
      value: data?.avg_match_score ? `${Math.round(data.avg_match_score)}%` : '—',
      color: 'text-accent-600',
    },
    // Bug #9 fixed — recommendations_sent was permanently '—' because the backend
    // never returns that field. Replaced with a real metric that the backend does return.
    {
      label: 'Flagged Job Postings',
      value: data?.flagged_jobs ?? '—',
      color: 'text-amber-600',
    },
  ];

  const topSkills = data?.top_skills || [];
  const topLocations = data?.top_locations || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Platform Analytics</h1>
        <p className="text-slate-500 mt-1">Key metrics and trends across HireHub.</p>
      </div>

      {fetchError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-center justify-between">
          <span>{fetchError}</span>
          <button onClick={() => setFetchError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)
          : metrics.map((m) => (
              <Card key={m.label} padding="md">
                <p className="text-sm font-medium text-slate-500 mb-1">{m.label}</p>
                <p className={`text-3xl font-bold ${m.color}`}>{m.value}</p>
                {m.change !== undefined && m.change !== null && (
                  <p className={`text-sm font-medium mt-1 ${m.change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {m.change >= 0 ? '↑' : '↓'} {Math.abs(m.change)}% from last month
                  </p>
                )}
              </Card>
            ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Skills */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Skills in Demand</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}
            </div>
          ) : topSkills.length === 0 ? (
            <p className="text-sm text-slate-400">No data available yet</p>
          ) : (
            <div className="space-y-3">
              {topSkills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700 w-32 truncate">{skill.name || skill}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(skill.count || skill.value || 1) / (topSkills[0]?.count || topSkills[0]?.value || 1) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-12 text-right">{skill.count || skill.value || ''}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top Locations */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Top Locations</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-8 rounded" />)}
            </div>
          ) : topLocations.length === 0 ? (
            <p className="text-sm text-slate-400">No data available yet</p>
          ) : (
            <div className="space-y-3">
              {topLocations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700 w-32 truncate">{loc.name || loc}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${(loc.count || loc.value || 1) / (topLocations[0]?.count || topLocations[0]?.value || 1) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-500 w-12 text-right">{loc.count || loc.value || ''}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
