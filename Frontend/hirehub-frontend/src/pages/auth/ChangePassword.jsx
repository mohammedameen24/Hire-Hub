import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, homePath } from '../../store/authStore';
import axiosInstance from '../../api/axiosInstance';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

export default function ChangePassword() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const role = useAuthStore((s) => s.role);

  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const newPassword = watch('new_password');

  const passwordRequirements = [
    { label: 'At least 8 characters', valid: newPassword && newPassword.length >= 8 },
    { label: 'One uppercase letter', valid: newPassword && /[A-Z]/.test(newPassword) },
    { label: 'One lowercase letter', valid: newPassword && /[a-z]/.test(newPassword) },
    { label: 'One digit', valid: newPassword && /[0-9]/.test(newPassword) },
    { label: 'One special character (!@#$%^&*)', valid: newPassword && /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
  ];

  const onSubmit = async (data) => {
    setApiError('');
    setSuccess('');

    if (data.new_password !== data.confirm_password) {
      setApiError('Passwords do not match. Please verify your new password entries.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        current_password: data.current_password,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      setSuccess('Password changed successfully. Redirecting to login...');
      setTimeout(() => {
        logout();
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      if (err.response?.status === 401) {
        setApiError('Invalid current password. Please check your current password and try again.');
      } else {
        setApiError(
          err.response?.data?.detail ||
            err.response?.data?.message ||
            'Failed to change password. Please try again.'
        );
      }
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
            <h1 className="text-2xl font-bold text-slate-800">Change Password</h1>
            <p className="text-slate-500 mt-2">Update your password to keep your account secure</p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-start gap-2 animate-fade-in">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-semibold text-danger-800">Error</p>
                <p className="text-xs text-danger-700 mt-0.5">{apiError}</p>
              </div>
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
            {/* Current Password */}
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Current password
              </label>
              <div className="relative">
                <input
                  id="current_password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your current password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.current_password || (apiError && apiError.includes('current password')) ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                  }`}
                  {...register('current_password', { required: 'Current password is required' })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
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
              {errors.current_password && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium">{errors.current_password.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium text-slate-700 mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter a new password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.new_password ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                  }`}
                  {...register('new_password', {
                    required: 'New password is required',
                    minLength: { value: 8, message: 'Password must be at least 8 characters' },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
                      message: 'Password does not meet requirements',
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-1"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
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
              {errors.new_password && (
                <p className="mt-1.5 text-xs text-danger-600 font-medium">{errors.new_password.message}</p>
              )}
              {newPassword && (
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

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                    errors.confirm_password ? 'border-danger-400 ring-1 ring-danger-400' : 'border-slate-300'
                  }`}
                  {...register('confirm_password', {
                    required: 'Please confirm your new password',
                    validate: (value) => value === newPassword || 'Passwords do not match',
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

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Update Password
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => navigate(homePath(role))}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
