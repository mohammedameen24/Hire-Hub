import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OnboardingStepper from '../../components/ui/OnboardingStepper';
import { getStorageUrl } from '../../utils/url';

const JOBSEEKER_STEPS = [
  { label: 'Create Account' },
  { label: 'Edit Profile' },
  { label: 'Upload Resume' },
  { label: 'Dashboard' },
];

export default function ProfileEdit() {
  const { user, updateUser } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isOnboarding = searchParams.get('onboarding') === '1';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState('');
  const [certifications, setCertifications] = useState([]);
  const [certUploading, setCertUploading] = useState({}); // { [idx]: true/false }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosInstance.get('/jobseeker/profile');
        const profileData = res.data || {};
        reset({
          ...profileData,
          skills: Array.isArray(profileData.skills)
            ? profileData.skills.join(', ')
            : profileData.skills || '',
        });
        setCertifications(
          Array.isArray(profileData.certifications) && profileData.certifications.length > 0
            ? profileData.certifications
            : []
        );
      } catch {
        // If no profile yet, just use defaults
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [reset]);

  const addCertification = () => {
    setCertifications((prev) => [
      ...prev,
      { title: '', issuer: '', year: '', credential_id: '', description: '', cert_url: '' },
    ]);
  };

  const removeCertification = (idx) => {
    setCertifications((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCertField = (idx, field, value) => {
    setCertifications((prev) =>
      prev.map((cert, i) => (i === idx ? { ...cert, [field]: value } : cert))
    );
  };

  // Upload a certificate file for a specific certification card
  const handleCertFileUpload = async (idx, file) => {
    if (!file) return;
    setCertUploading((prev) => ({ ...prev, [idx]: true }));
    try {
      // First save the profile so the cert entry exists in the DB at this index
      await axiosInstance.put('/jobseeker/profile', {
        certifications,
      });

      const formData = new FormData();
      formData.append('file', file);
      const res = await axiosInstance.post(
        `/jobseeker/certifications/${idx}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Update the local cert with the returned URL
      updateCertField(idx, 'cert_url', res.data.cert_url);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Failed to upload certificate file.'
      );
    } finally {
      setCertUploading((prev) => ({ ...prev, [idx]: false }));
    }
  };

  const onSubmit = async (data) => {
    setSaving(true);
    setSaved(false);
    setApiError('');
    try {
      await axiosInstance.put('/jobseeker/profile', {
        ...data,
        certifications,
      });
      updateUser({ name: data.full_name || data.name });
      setSaved(true);
      if (isOnboarding) {
        // Step 2 completed -> proceed to Step 3 (Resume Upload)
        navigate('/jobseeker/resume?onboarding=1');
        return;
      }

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Failed to save profile. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="skeleton h-[400px] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Onboarding Stepper Header */}
      {isOnboarding && <OnboardingStepper steps={JOBSEEKER_STEPS} currentStep={2} />}

      {/* Onboarding Guidance Callout */}
      {isOnboarding && (
        <div className="bg-gradient-to-r from-accent-600 to-accent-800 text-white rounded-2xl p-5 sm:p-6 shadow-md animate-fade-in flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-xl font-bold">
            👋
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Step 2: Complete Your Profile</h2>
            <p className="text-sm text-accent-100 mt-1 leading-relaxed">
              Tell us about your experience and skills. This information powers AI job recommendations and candidate matching for local employers.
            </p>
          </div>
        </div>
      )}

      {!isOnboarding && (
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Edit Profile</h1>
          <p className="text-slate-500 mt-1">
            Keep your profile up to date to improve AI matching accuracy.
          </p>
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 animate-fade-in flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Info */}
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              Personal Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="full_name"
                  type="text"
                  className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.full_name ? 'border-danger-400' : 'border-slate-300'
                  }`}
                  {...register('full_name', { required: 'Name is required' })}
                />
                {errors.full_name && (
                  <p className="mt-1 text-sm text-danger-600">{errors.full_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  {...register('phone')}
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  placeholder="City, State"
                  className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                  {...register('location')}
                />
              </div>
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              Skills
            </h2>
            <div>
              <label htmlFor="skills" className="block text-sm font-medium text-slate-700 mb-1.5">
                Skills <span className="text-slate-400 font-normal">(comma or space separated)</span>
              </label>
              <input
                id="skills"
                type="text"
                placeholder="React, Python, Machine Learning, CSS, JS ..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                {...register('skills')}
              />
              <p className="mt-1 text-xs text-slate-400">You can separate skills with commas <em>or</em> spaces — both work.</p>
            </div>
          </div>

          {/* Experience */}
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              Experience
            </h2>
            <textarea
              id="experience"
              rows={4}
              placeholder="Brief summary of your work experience..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
              {...register('experience')}
            />
          </div>

          {/* Education */}
          <div>
            <h2 className="text-base font-semibold text-slate-700 mb-4 pb-2 border-b border-slate-100">
              Education
            </h2>
            <textarea
              id="education"
              rows={3}
              placeholder="Degree, Institution, Year..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
              {...register('education')}
            />
          </div>

          {/* Certifications */}
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-700">Certifications</h2>
                <p className="text-xs text-slate-400 mt-0.5">Add your professional certificates — upload the document or image for each one</p>
              </div>
              <button
                type="button"
                id="add-certification-btn"
                onClick={addCertification}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-600 hover:text-accent-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-accent-50 border border-accent-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Certificate
              </button>
            </div>

            {certifications.length === 0 ? (
              <button
                type="button"
                onClick={addCertification}
                className="w-full text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl hover:border-accent-300 hover:bg-accent-50/30 transition-all group"
              >
                <div className="w-14 h-14 bg-slate-100 group-hover:bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <svg className="w-7 h-7 text-slate-400 group-hover:text-accent-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-600 group-hover:text-accent-700">Add your first certificate</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, or PNG — up to 5 MB each</p>
              </button>
            ) : (
              <div className="space-y-4">
                {certifications.map((cert, idx) => (
                  <div
                    key={idx}
                    className="relative bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
                  >
                    {/* Card header stripe */}
                    <div className="h-1.5 bg-gradient-to-r from-accent-500 to-accent-700" />

                    <div className="p-5">
                      {/* Top row: icon + title + delete */}
                      <div className="flex items-start gap-4 mb-4">
                        {/* Certificate icon / preview */}
                        <div className="flex-shrink-0">
                          {cert.cert_url ? (
                            <a
                              href={getStorageUrl(cert.cert_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-14 h-14 rounded-xl overflow-hidden border border-slate-200 hover:ring-2 hover:ring-accent-400 transition-all"
                              title="View certificate"
                            >
                              {/\.(jpg|jpeg|png|webp)/i.test(cert.cert_url) ? (
                                <img
                                  src={getStorageUrl(cert.cert_url)}
                                  alt="Certificate"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-red-50 flex items-center justify-center">
                                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                              )}
                            </a>
                          ) : (
                            <div className="w-14 h-14 bg-accent-50 border-2 border-dashed border-accent-200 rounded-xl flex items-center justify-center">
                              <svg className="w-6 h-6 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                            </div>
                          )}
                        </div>

                        {/* Title + issuer */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            placeholder="Certificate Title (e.g. AWS Solutions Architect)"
                            value={cert.title}
                            onChange={(e) => updateCertField(idx, 'title', e.target.value)}
                            className="w-full text-sm font-semibold text-slate-800 bg-transparent border-0 border-b border-slate-200 focus:border-accent-500 focus:outline-none pb-1 placeholder:text-slate-400 placeholder:font-normal"
                          />
                          <input
                            type="text"
                            placeholder="Issuing Organization (e.g. Amazon Web Services)"
                            value={cert.issuer}
                            onChange={(e) => updateCertField(idx, 'issuer', e.target.value)}
                            className="w-full text-xs text-slate-500 bg-transparent border-0 focus:outline-none mt-1.5 placeholder:text-slate-300"
                          />
                        </div>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => removeCertification(idx)}
                          className="p-1.5 text-slate-300 hover:text-danger-500 hover:bg-danger-50 rounded-lg transition-colors flex-shrink-0"
                          title="Remove"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Meta row: year + credential ID */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Year Issued</label>
                          <input
                            type="text"
                            placeholder="2024"
                            value={cert.year}
                            onChange={(e) => updateCertField(idx, 'year', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Credential ID <span className="text-slate-300 font-normal">(optional)</span></label>
                          <input
                            type="text"
                            placeholder="e.g. ABC-12345"
                            value={cert.credential_id}
                            onChange={(e) => updateCertField(idx, 'credential_id', e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Description <span className="text-slate-300 font-normal">(optional)</span></label>
                        <textarea
                          rows={2}
                          placeholder="Briefly describe what this certification covers..."
                          value={cert.description}
                          onChange={(e) => updateCertField(idx, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400 resize-none"
                        />
                      </div>

                      {/* File upload zone */}
                      <div className="border-t border-slate-100 pt-3">
                        {cert.cert_url ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-success-600">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Certificate document uploaded
                            </div>
                            <div className="flex items-center gap-2">
                              <a
                                href={getStorageUrl(cert.cert_url)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-medium text-accent-600 hover:underline"
                              >
                                View →
                              </a>
                              <label className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer">
                                Replace
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                                  className="sr-only"
                                  onChange={(e) => handleCertFileUpload(idx, e.target.files?.[0])}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-dashed border-slate-200 hover:border-accent-300 hover:bg-accent-50/40 transition-all cursor-pointer ${certUploading[idx] ? 'opacity-60 pointer-events-none' : ''}`}>
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              className="sr-only"
                              disabled={certUploading[idx]}
                              onChange={(e) => handleCertFileUpload(idx, e.target.files?.[0])}
                            />
                            {certUploading[idx] ? (
                              <>
                                <svg className="w-4 h-4 text-accent-500 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                <span className="text-xs text-accent-600 font-medium">Uploading...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="text-xs text-slate-500">Upload certificate document</span>
                                <span className="text-xs text-slate-300">PDF, JPG, PNG — max 5 MB</span>
                              </>
                            )}
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add another */}
                <button
                  type="button"
                  onClick={addCertification}
                  className="w-full py-3 border border-dashed border-slate-200 rounded-xl text-sm text-slate-400 hover:text-accent-600 hover:border-accent-300 hover:bg-accent-50/30 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add another certificate
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button type="submit" id="save-profile-btn" loading={saving} disabled={saving} size={isOnboarding ? "lg" : "md"}>
                {isOnboarding ? 'Save & Continue to Resume Upload →' : 'Save Changes'}
              </Button>
              {saved && !isOnboarding && (
                <span className="text-sm text-success-600 font-medium flex items-center gap-1 animate-fade-in">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Profile saved
                </span>
              )}
            </div>

            {isOnboarding && (
              <button
                type="button"
                onClick={() => navigate('/jobseeker/resume?onboarding=1')}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              >
                Skip to Resume Upload →
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
