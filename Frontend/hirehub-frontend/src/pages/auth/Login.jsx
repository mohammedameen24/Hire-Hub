import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, homePath } from '../../store/authStore';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import { jwtDecode } from 'jwt-decode';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const login = useAuthStore((s) => s.login);
  const token = useAuthStore((s) => s.token);
  const role = useAuthStore((s) => s.role);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const from = location.state?.from?.pathname;

  // Only redirect if token is valid and role exists
  if (token && isTokenValid(token) && role) {
    navigate(homePath(role), { replace: true });
    return null;
  }

  // Clear any invalid/stale token
  if (token && !isTokenValid(token)) {
    logout();
  }

  const onSubmit = async (data) => {
    setApiError('');

    // Client-side validation
    if (!data.email || !data.password) {
      setApiError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
      setApiError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', data);
      const token = res.data.access_token || res.data.token;
      if (!token) {
        throw new Error('No authentication token received from server.');
      }
      login(token, res.data);
      const state = useAuthStore.getState();
      navigate(from || homePath(state.role), { replace: true });
    } catch (err) {
      if (!err.response) {
        setApiError('Unable to connect to the server. Please check your connection and try again.');
      } else if (err.response.status === 401) {
        setApiError(err.response.data?.detail || err.response.data?.message || 'Invalid email or password. Please check your credentials and try again.');
      } else if (err.response.status === 403) {
        setApiError(err.response.data?.detail || err.response.data?.message || 'Account is inactive. Please contact support.');
      } else {
        setApiError(
          err.response.data?.detail ||
          err.response.data?.message ||
          'An unexpected authentication error occurred. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-accent-950 relative overflow-hidden items-center justify-center">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-accent-800/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-accent-700/20 rounded-full blur-3xl" />

        <div className="relative z-10 px-16 max-w-lg">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 bg-accent-500 rounded-xl flex items-center justify-center shadow-lg shadow-accent-500/30">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Hire<span className="text-accent-400">Hub</span>
            </span>
          </div>

          <h1 className="text-4xl font-extrabold text-white leading-tight mb-4">
            AI-Powered
            <br />
            Recruitment
            <br />
            <span className="text-accent-400">Made Simple</span>
          </h1>
          <p className="text-accent-200 text-lg leading-relaxed">
            Connect with top local talent through intelligent matching,
            AI-driven resume analysis, and automated candidate shortlisting.
          </p>

          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold text-white">10K+</p>
              <p className="text-sm text-accent-300">Active Jobs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-sm text-accent-300">Job Seekers</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">95%</p>
              <p className="text-sm text-accent-300">Match Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
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

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Welcome back</h2>
          <p className="text-slate-500 mb-6">Sign in to your account to continue</p>

          {/* Exception / API Error Callout */}
          {apiError && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-xl text-sm text-danger-700 flex items-start gap-3 animate-fade-in shadow-sm">
              <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0 text-danger-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-danger-800 mb-0.5">Invalid Credentials</p>
                <p className="text-xs leading-relaxed text-danger-700">{apiError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                  errors.email || apiError ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                }`}
                {...register('email', {
                  required: 'Email address is required.',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Please enter a valid email address.',
                  },
                })}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.password || apiError ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                  }`}
                  {...register('password', {
                    required: 'Password is required.',
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
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-medium text-accent-600 hover:text-accent-700">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-accent-600 hover:text-accent-700">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
