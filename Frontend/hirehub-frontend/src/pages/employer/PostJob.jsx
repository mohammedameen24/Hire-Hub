import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

export default function PostJob() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setApiError('');
    setLoading(true);
    try {
      // Convert comma-separated skills to array
      const payload = {
        ...data,
        skills_required: data.skills_required
          ? data.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await axiosInstance.post('/employer/jobs', payload);
      navigate('/employer/jobs');
    } catch (err) {
      setApiError(err.response?.data?.message || err.response?.data?.detail || 'Failed to create job posting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Post a Job</h1>
        <p className="text-slate-500 mt-1">Create a new job listing to find the perfect candidates.</p>
      </div>

      {apiError && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 animate-fade-in">
          {apiError}
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
                Job Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Senior Frontend Developer"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                  errors.title ? 'border-danger-400' : 'border-slate-300'
                }`}
                {...register('title', { required: 'Job title is required' })}
              />
              {errors.title && <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1.5">
                Location
              </label>
              <input
                id="location"
                type="text"
                placeholder="City, State or Remote"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
                  errors.location ? 'border-danger-400' : 'border-slate-300'
                }`}
                {...register('location', { required: 'Location is required' })}
              />
              {errors.location && <p className="mt-1 text-sm text-danger-600">{errors.location.message}</p>}
            </div>

            <div>
              <label htmlFor="job_type" className="block text-sm font-medium text-slate-700 mb-1.5">
                Job Type
              </label>
              <select
                id="job_type"
                className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 cursor-pointer ${
                  errors.job_type ? 'border-danger-400' : 'border-slate-300'
                }`}
                {...register('job_type', { required: 'Select a job type' })}
              >
                <option value="">Select type</option>
                <option value="full-time">Full Time</option>
                <option value="part-time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
              {errors.job_type && <p className="mt-1 text-sm text-danger-600">{errors.job_type.message}</p>}
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-slate-700 mb-1.5">
                Salary Range <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="salary"
                type="text"
                placeholder="e.g. $80,000 - $120,000"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                {...register('salary')}
              />
            </div>

            <div>
              <label htmlFor="experience_level" className="block text-sm font-medium text-slate-700 mb-1.5">
                Experience Level
              </label>
              <select
                id="experience_level"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 cursor-pointer"
                {...register('experience_level')}
              >
                <option value="">Select level</option>
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead / Manager</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
              Job Description
            </label>
            <textarea
              id="description"
              rows={6}
              placeholder="Describe the role, responsibilities, and what a typical day looks like..."
              className={`w-full px-4 py-2.5 rounded-lg border bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none ${
                errors.description ? 'border-danger-400' : 'border-slate-300'
              }`}
              {...register('description', { required: 'Description is required' })}
            />
            {errors.description && <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>}
          </div>

          <div>
            <label htmlFor="requirements" className="block text-sm font-medium text-slate-700 mb-1.5">
              Requirements
            </label>
            <textarea
              id="requirements"
              rows={4}
              placeholder="List the qualifications, experience, and education needed..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 resize-none"
              {...register('requirements')}
            />
          </div>

          <div>
            <label htmlFor="skills_required" className="block text-sm font-medium text-slate-700 mb-1.5">
              Required Skills <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              id="skills_required"
              type="text"
              placeholder="React, Node.js, PostgreSQL, ..."
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              {...register('skills_required')}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading} size="lg">
              Publish Job
            </Button>
            <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/employer/jobs')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
