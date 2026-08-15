import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { getStorageUrl } from '../../utils/url';

// ── Document preview card (resume or certificate) ────────────
function DocumentCard({ url, title, subtitle, meta }) {
  const isImage = url && /\.(jpg|jpeg|png|webp)/i.test(url);
  const isPdf = url && url.toLowerCase().endsWith('.pdf');
  const fullUrl = getStorageUrl(url);

  return (
    <a
      href={fullUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:border-accent-300 hover:bg-accent-50 transition-all"
    >
      {/* Thumbnail / icon */}
      <div className="w-12 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white flex-shrink-0 flex items-center justify-center">
        {isImage ? (
          <img src={fullUrl} alt={title} className="w-full h-full object-cover" />
        ) : isPdf ? (
          <div className="w-full h-full bg-red-50 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 group-hover:text-accent-700 truncate">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
        {meta && <p className="text-xs text-slate-400 mt-0.5">{meta}</p>}
        <span className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-accent-600 group-hover:underline">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Open document
        </span>
      </div>
    </a>
  );
}

export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axiosInstance.get(`/employer/candidates/${id}`);
        setCandidate(res.data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-[400px] rounded-xl" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <Card padding="lg" className="text-center">
        <h2 className="text-lg font-semibold text-slate-700 mb-2">Candidate not found</h2>
        <Button variant="secondary" onClick={() => navigate(-1)}>Go Back</Button>
      </Card>
    );
  }

  const score = candidate.match_score || candidate.score || 0;
  const certs = Array.isArray(candidate.certifications) ? candidate.certifications.filter((c) => c.title) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── Main column ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <Card>
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {candidate.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{candidate.name || candidate.full_name}</h1>
                {candidate.email && <p className="text-slate-500">{candidate.email}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {candidate.location && (
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {candidate.location}
                    </span>
                  )}
                  {candidate.phone && (
                    <span className="flex items-center gap-1 text-sm text-slate-500">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {candidate.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {candidate.experience && (
              <div className="border-t border-slate-100 pt-5">
                <h2 className="text-base font-semibold text-slate-800 mb-2">Experience</h2>
                <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">{candidate.experience}</p>
              </div>
            )}

            {candidate.education && (
              <div className="border-t border-slate-100 pt-5 mt-5">
                <h2 className="text-base font-semibold text-slate-800 mb-2">Education</h2>
                <p className="text-sm text-slate-600 whitespace-pre-line">{candidate.education}</p>
              </div>
            )}
          </Card>

          {/* ── Certifications ──────────────────────────────── */}
          {certs.length > 0 && (
            <Card>
              <h2 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Certifications
                <span className="ml-auto text-xs font-normal text-slate-400">{certs.length} certificate{certs.length !== 1 ? 's' : ''}</span>
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {certs.map((cert, idx) => (
                  <div key={idx} className="relative bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {/* Top stripe */}
                    <div className="h-1 bg-gradient-to-r from-accent-400 to-accent-600" />
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {/* Doc icon / thumbnail */}
                        {cert.cert_url ? (
                          <a
                            href={getStorageUrl(cert.cert_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-10 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 hover:ring-2 hover:ring-accent-400 transition-all"
                          >
                            {/\.(jpg|jpeg|png|webp)/i.test(cert.cert_url) ? (
                              <img src={getStorageUrl(cert.cert_url)} alt={cert.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-red-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            )}
                          </a>
                        ) : (
                          <div className="w-10 h-12 rounded-lg bg-accent-50 border border-accent-100 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 leading-tight">{cert.title}</p>
                          {cert.issuer && <p className="text-xs text-slate-500 mt-0.5">{cert.issuer}</p>}
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="flex flex-wrap items-center gap-2">
                        {cert.year && (
                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{cert.year}</span>
                        )}
                        {cert.credential_id && (
                          <span className="text-xs text-slate-400 font-mono">ID: {cert.credential_id}</span>
                        )}
                      </div>

                      {cert.description && (
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">{cert.description}</p>
                      )}

                      {/* View doc button */}
                      {cert.cert_url && (
                        <a
                          href={getStorageUrl(cert.cert_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 hover:underline"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View certificate document
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* Match score */}
          <Card className="text-center">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Match Score</h3>
            <div className="relative w-28 h-28 mx-auto mb-3">
              <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke={score >= 70 ? 'var(--color-accent-500)' : score >= 40 ? 'var(--color-warn-500)' : 'var(--color-danger-500)'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray="283"
                  strokeDashoffset={283 - (283 * score) / 100}
                  className="animate-score-ring"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800">
                {Math.round(score)}%
              </span>
            </div>
          </Card>

          {/* Skills */}
          {candidate.skills && candidate.skills.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(candidate.skills) ? candidate.skills : candidate.skills.split(',')).map((skill) => (
                  <Badge key={skill} variant="accent" size="sm">{typeof skill === 'string' ? skill.trim() : skill}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Documents section — resume + certs with cert_url */}
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Documents
            </h3>
            <div className="space-y-2">
              {/* Resume */}
              {candidate.resume_url ? (
                <DocumentCard
                  url={candidate.resume_url}
                  title="Resume / CV"
                  subtitle={candidate.name || candidate.full_name}
                  meta="PDF document"
                />
              ) : (
                <p className="text-xs text-slate-400 py-2">No resume uploaded</p>
              )}

              {/* Certificate files */}
              {certs
                .filter((c) => c.cert_url)
                .map((cert, idx) => (
                  <DocumentCard
                    key={idx}
                    url={cert.cert_url}
                    title={cert.title}
                    subtitle={cert.issuer}
                    meta={cert.year ? `Issued ${cert.year}${cert.credential_id ? ` · ID: ${cert.credential_id}` : ''}` : cert.credential_id}
                  />
                ))}

              {!candidate.resume_url && certs.filter((c) => c.cert_url).length === 0 && (
                <p className="text-xs text-slate-400">No documents uploaded yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
