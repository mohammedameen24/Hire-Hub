import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import { CardSkeleton } from '../../components/ui/Spinner';

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get('/jobseeker/recommendations');
        const data = res.data.recommendations || res.data || [];
        // Sort descending by recommendation score
        data.sort((a, b) => (b.score || b.recommendation_score || 0) - (a.score || a.recommendation_score || 0));
        setRecommendations(data);
      } catch {
        setRecommendations([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">AI Recommendations</h1>
        <p className="text-slate-500 mt-1">Jobs matched to your profile by our AI — ranked by relevance.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No recommendations yet</h3>
          <p className="text-slate-500 max-w-md mx-auto mb-6">
            Our AI needs more information to match you with the right jobs.
            Complete your profile and upload your resume to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/jobseeker/profile"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent-600 rounded-lg hover:bg-accent-700 transition-colors"
            >
              Complete Profile
            </Link>
            <Link
              to="/jobseeker/resume"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-accent-600 bg-white border border-accent-300 rounded-lg hover:bg-accent-50 transition-colors"
            >
              Upload Resume
            </Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, idx) => {
            const score = rec.score || rec.recommendation_score || 0;
            return (
              <Link key={rec._id || rec.id || idx} to={`/jobseeker/jobs/${rec.job_id || rec._id || rec.id}`}>
                <Card hover padding="md" className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Rank */}
                  <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-500 font-bold text-sm flex-shrink-0">
                    #{idx + 1}
                  </div>

                  {/* Job info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-800 truncate">{rec.title || rec.job_title}</h3>
                    </div>
                    <p className="text-sm text-slate-500">{rec.company}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {rec.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {rec.location}
                        </span>
                      )}
                      {/* Why recommended tags */}
                      {rec.matched_skills?.slice(0, 4).map((skill) => (
                        <span key={skill} className="text-xs px-2 py-0.5 bg-success-50 text-success-700 rounded-full">
                          {skill}
                        </span>
                      ))}
                      {rec.reasons?.map((reason, ri) => (
                        <span key={ri} className="text-xs px-2 py-0.5 bg-accent-50 text-accent-700 rounded-full">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Job type */}
                  <div className="sm:w-24 flex-shrink-0 text-right">
                    {rec.job_type && (
                      <span className="text-xs text-slate-400">{rec.job_type}</span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
