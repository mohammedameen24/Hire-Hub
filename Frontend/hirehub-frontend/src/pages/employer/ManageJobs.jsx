import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [editModal, setEditModal] = useState(null); // Bug #45 — edit job state
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

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

  const openEditModal = (job) => {
    setEditForm({
      title: job.title || '',
      location: job.location || '',
      job_type: job.job_type || '',
      salary: job.salary || '',
      experience_level: job.experience_level || '',
      description: job.description || '',
      requirements: job.requirements || '',
      skills_required: Array.isArray(job.skills_required)
        ? job.skills_required.join(', ')
        : job.skills_required || '',
      status: job.status || 'open',
    });
    setEditError('');
    setEditModal(job);
  };

  const handleEditSave = async () => {
    if (!editModal) return;
    setSaving(true);
    setEditError('');
    try {
      const payload = {
        ...editForm,
        skills_required: editForm.skills_required
          ? editForm.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      const res = await axiosInstance.put(`/employer/jobs/${editModal._id || editModal.id}`, payload);
      const updated = res.data?.data || res.data;
      setJobs((prev) =>
        prev.map((j) => (j._id || j.id) === (editModal._id || editModal.id) ? { ...j, ...updated } : j)
      );
      setEditModal(null);
    } catch (err) {
      setEditError(err.response?.data?.message || err.response?.data?.detail || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

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
                  {/* Bug #45 fixed — Edit button wired to PUT /api/employer/jobs/:id */}
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(job)}
                  >
                    Edit
                  </Button>
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

      {/* Edit job modal — Bug #45 fix */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title="Edit Job Posting"
        size="lg"
      >
        {editModal && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Type</label>
                <select
                  value={editForm.job_type}
                  onChange={(e) => setEditForm((p) => ({ ...p, job_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Select type</option>
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Salary Range</label>
                <input
                  type="text"
                  value={editForm.salary}
                  onChange={(e) => setEditForm((p) => ({ ...p, salary: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Experience Level</label>
                <select
                  value={editForm.experience_level}
                  onChange={(e) => setEditForm((p) => ({ ...p, experience_level: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Select level</option>
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Manager</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Required Skills <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input
                  type="text"
                  value={editForm.skills_required}
                  onChange={(e) => setEditForm((p) => ({ ...p, skills_required: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={editForm.description}
                  onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Requirements</label>
                <textarea
                  rows={3}
                  value={editForm.requirements}
                  onChange={(e) => setEditForm((p) => ({ ...p, requirements: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>
            </div>
            {editError && (
              <p className="text-sm text-danger-600 bg-danger-50 border border-danger-200 rounded-lg p-3">{editError}</p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
              <Button onClick={handleEditSave} loading={saving}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
