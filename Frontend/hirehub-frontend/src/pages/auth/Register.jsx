import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, homePath } from '../../store/authStore';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { role: 'jobseeker' } });

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const selectedRole = watch('role');
  const password = watch('password');

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: password && password.length >= 8 },
    { label: 'One uppercase letter', valid: password && /[A-Z]/.test(password) },
    { label: 'One lowercase letter', valid: password && /[a-z]/.test(password) },
    { label: 'One digit', valid: password && /[0-9]/.test(password) },
    { label: 'One special character (!@#$%^&*)', valid: password && /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const onSubmit = async (data) => {
    setApiError('');

    // Client-side validation
    if (!data.full_name || !data.email || !data.password || !data.confirm_password) {
      setApiError('Please fill in all required fields.');
      return;
    }

    if (data.password !== data.confirm_password) {
      setApiError('Passwords do not match. Please ensure both password fields match.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      setApiError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register', {
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      const token = res.data.access_token || res.data.token;
      if (token) {
        login(token, res.data);
        const role = useAuthStore.getState().role || data.role;
        if (role === 'jobseeker') {
          navigate('/jobseeker/profile?onboarding=1', { replace: true });
        } else if (role === 'employer') {
          navigate('/employer/company?onboarding=1', { replace: true });
        } else {
          navigate(homePath(role), { replace: true });
        }
      } else {
        navigate('/login', { state: { registered: true } });
      }
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent-950 relative overflow-hidden items-center justify-center">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent-800/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-accent-700/20 rounded-full blur-3xl" />

        <div className="relative z-10 px-16 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Hire<span className="text-accent-400">Hub</span>
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            Start Your
            <br />
            Hiring Journey
            <br />
            <span className="text-accent-400">Today</span>
          </h1>
          <p className="text-accent-200 text-lg leading-relaxed">
            Whether you&apos;re looking for your next opportunity or
            searching for the perfect candidate — HireHub&apos;s AI
            makes it effortless.
          </p>
        </div>
      </div>

      {/* Right panel — register form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-10 h-10 bg-accent-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-slate-800">
              Hire<span className="text-accent-600">Hub</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Create an account</h2>
          <p className="text-slate-500 mb-8">Join HireHub and start connecting today</p>

          {apiError && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'jobseeker', label: 'Job Seeker', desc: 'Looking for work' },
                  { value: 'employer', label: 'Employer', desc: 'Hiring talent' },
                ].map((opt) => (
                  <label
                    key={opt.value}
                    className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                      selectedRole === opt.value
                        ? 'border-accent-500 bg-accent-50 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      className="sr-only"
                      {...register('role', { required: true })}
                    />
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        selectedRole === opt.value
                          ? 'bg-accent-100 text-accent-600'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {opt.value === 'jobseeker' ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{opt.label}</span>
                    <span className="text-xs text-slate-500">{opt.desc}</span>
                    {selectedRole === opt.value && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-accent-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                id="full_name"
                type="text"
                autoComplete="name"
                placeholder="John Doe"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                  errors.full_name ? 'border-danger-400' : 'border-slate-300'
                }`}
                {...register('full_name', { required: 'Full name is required' })}
              />
              {errors.full_name && (
                <p className="mt-1.5 text-sm text-danger-600">{errors.full_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                  errors.email ? 'border-danger-400' : 'border-slate-300'
                }`}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a strong password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.password ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                  }`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 8,
                      message: 'Password must be at least 8 characters',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                      message: 'Password does not meet requirements',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.88 9.88a3 3 0 104.24 4.24m-4.24-4.24L3 3m18 18l-4.13-4.13" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium">{errors.password.message}</p>
              )}
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req) => (
                    <p key={req.label} className={`text-xs flex items-center gap-1.5 ${req.valid ? 'text-success-600' : 'text-slate-400'}`}>
                      <svg className={`w-3 h-3 ${req.valid ? 'text-success-500' : 'text-slate-300'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d={req.valid ? "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} clipRule="evenodd" />
                      </svg>
                      {req.label}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.confirm_password ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                  }`}
                  {...register('confirm_password', {
                    required: 'Please confirm your password',
                    validate: (val) => val === password || 'Passwords do not match',
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.88 9.88a3 3 0 104.24 4.24m-4.24-4.24L3 3m18 18l-4.13-4.13" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium">{errors.confirm_password.message}</p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Create Account
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-accent-600 hover:text-accent-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
