import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import OnboardingStepper from '../../components/ui/OnboardingStepper';

const EMPLOYER_STEPS = [
  { label: 'Create Account' },
  { label: 'Company Profile' },
  { label: 'Dashboard' },
];

export default function CompanyProfile() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const isOnboarding = searchParams.get('onboarding') === '1';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await axiosInstance.get('/employer/company');
        reset(res.data);
      } catch {
        //
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [reset]);

  const onSubmit = async (data) => {
    setSaving(true);
    setSaved(false);
    setApiError('');
    try {
      await axiosInstance.put('/employer/company', data);
      setSaved(true);

      if (isOnboarding) {
        navigate('/employer/dashboard?welcome=1');
        return;
      }

      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          'Failed to save company profile. Please try again.'
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
      {isOnboarding && <OnboardingStepper steps={EMPLOYER_STEPS} currentStep={2} />}

      {/* Onboarding Guidance Callout */}
      {isOnboarding && (
        <div className="bg-gradient-to-r from-accent-600 to-accent-800 text-white rounded-2xl p-5 sm:p-6 shadow-md animate-fade-in flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0 text-xl font-bold">
            🏢
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold">Step 2: Setup Your Company Profile</h2>
            <p className="text-sm text-accent-100 mt-1 leading-relaxed">
              Add your company details to build trust with applicants and showcase open positions to qualified job seekers.
            </p>
          </div>
        </div>
      )}

      {!isOnboarding && (
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Company Profile</h1>
          <p className="text-slate-500 mt-1">Build your company presence to attract the best candidates.</p>
        </div>
      )}

      {apiError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 animate-fade-in flex items-center justify-between">
          <span>{apiError}</span>
          <button onClick={() => setApiError('')} className="text-xs font-bold text-danger-800 hover:underline">Dismiss</button>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Company Name
              </label>
              <input
                id="company_name"
                type="text"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                  errors.company_name ? 'border-danger-400' : 'border-slate-300'
                }`}
                {...register('company_name', { required: 'Company name is required' })}
              />
              {errors.company_name && <p className="mt-1 text-sm text-danger-600">{errors.company_name.message}</p>}
            </div>

            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-slate-700 mb-1.5">
                Industry
              </label>
              <input
                id="industry"
                type="text"
                placeholder="e.g. Technology, Healthcare..."
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                {...register('industry')}
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

            <div>
              <label htmlFor="website" className="block text-sm font-medium text-slate-700 mb-1.5">
                Website
              </label>
              <input
                id="website"
                type="url"
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                {...register('website')}
              />
            </div>

            <div>
              <label htmlFor="company_size" className="block text-sm font-medium text-slate-700 mb-1.5">
                Company Size
              </label>
              <select
                id="company_size"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 cursor-pointer"
                {...register('company_size')}
              >
                <option value="">Select size</option>
                <option value="1-10">1–10 employees</option>
                <option value="11-50">11–50 employees</option>
                <option value="51-200">51–200 employees</option>
                <option value="201-500">201–500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Company Description
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Tell candidates about your company, culture, and mission..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
              {...register('description')}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100">
            <Button type="submit" loading={saving} disabled={saving} size={isOnboarding ? "lg" : "md"}>
              {isOnboarding ? 'Save & Go to Dashboard →' : 'Save Changes'}
            </Button>
            {saved && !isOnboarding && (
              <span className="text-sm text-success-600 font-medium flex items-center gap-1 animate-fade-in">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Profile saved
              </span>
            )}
            {isOnboarding && (
              <button
                type="button"
                onClick={() => navigate('/employer/dashboard?welcome=1')}
                className="text-sm text-slate-500 hover:text-slate-700 font-medium"
              >
                Skip for now →
              </button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
