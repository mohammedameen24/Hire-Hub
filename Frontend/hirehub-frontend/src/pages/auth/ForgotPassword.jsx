import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');

  const onSubmit = async (data) => {
    setApiError('');
    setSuccess('');

    if (!data.email) {
      setApiError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/forgot-password', {
        email: data.email,
      });
      setSuccess(res.data.message || 'Password reset link has been sent to your email.');
    } catch (err) {
      setApiError(
        err.response?.data?.detail ||
          'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <Card>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Forgot Password?</h1>
            <p className="text-slate-500 mt-2">Enter your email and we&apos;ll send you a reset link</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              {apiError}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg text-sm text-success-700 flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                  errors.email ? 'border-danger-400' : 'border-slate-300'
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
                <p className="mt-1.5 text-sm text-danger-600">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg" disabled={loading}>
              Send Reset Link
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Remember your password?{' '}
            <Link to="/login" className="font-semibold text-accent-600 hover:text-accent-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
