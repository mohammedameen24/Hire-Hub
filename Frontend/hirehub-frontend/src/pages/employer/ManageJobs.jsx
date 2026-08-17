import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CardSkeleton } from '../../components/ui/Spinner';

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await axiosInstance.get('/employer/jobs');
      setJobs(res.data.jobs || res.data || []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const [deleteError, setDeleteError] = useState('');

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await axiosInstance.delete(`/employer/jobs/${deleteModal._id || deleteModal.id}`);
      setJobs((prev) => prev.filter((j) => (j._id || j.id) !== (deleteModal._id || deleteModal.id)));
      setDeleteModal(null);
    } catch (err) {
      setDeleteError(err.response?.data?.message || 'Failed to delete job. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Manage Jobs</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 sm:mt-1">View, edit, and manage all your job postings.</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card padding="lg" className="text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.193 23.193 0 0112 15c-3.183 0-6.22-.64-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">No jobs yet</h3>
          <p className="text-sm text-slate-500">Create your first job listing to start finding candidates.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Card key={job._id || job.id} padding="none" hover className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm sm:text-base truncate">{job.title}</h3>
                    <Badge
                      variant={(job.status === 'open' || job.status === 'active') ? 'success' : job.status === 'closed' ? 'neutral' : 'warning'}
                      size="sm"
                    >
                      {job.status === 'open' ? 'Active' : job.status || 'Active'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-slate-500">
                    {job.location && <span>{job.location}</span>}
                    {job.job_type && <span>{job.job_type}</span>}
                    <span>{job.applicant_count ?? 0} applicants</span>
                    {job.createdAt && (
                      <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 pt-2.5 sm:pt-0 border-t border-slate-100 sm:border-0 justify-end">
                  <Link to={`/employer/jobs/${job._id || job.id}/applicants`}>
                    <Button variant="secondary" size="sm">
                      Applicants
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                    onClick={() => setDeleteModal(job)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Job Posting"
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <strong>{deleteModal?.title}</strong>? This action cannot be undone and all associated applications will be removed.
        </p>
        {deleteError && (
          <p className="text-sm text-danger-600 bg-danger-50 p-3 rounded-lg mb-4">{deleteError}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteModal(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting}>
            Delete Job
          </Button>
        </div>
      </Modal>
    </div>
  );
}
