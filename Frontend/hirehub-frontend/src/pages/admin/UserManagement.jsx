import { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { CardSkeleton } from '../../components/ui/Spinner';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [actionModal, setActionModal] = useState(null); // { user, action }
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users', {
        params: {
          q: search || undefined,
          role: roleFilter || undefined,
        },
      });
      setUsers(res.data.users || res.data || []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleAction = async () => {
    if (!actionModal) return;
    setProcessing(true);
    const { user, action } = actionModal;
    try {
      await axiosInstance.post(`/admin/users/${user._id || user.id}/${action}`);
      setUsers((prev) =>
        prev.map((u) =>
          (u._id || u.id) === (user._id || user.id)
            ? {
                ...u,
                is_verified: action === 'verify' ? true : u.is_verified,
                is_active: action === 'deactivate' ? false : action === 'activate' ? true : u.is_active,
              }
            : u
        )
      );
      setActionModal(null);
    } catch {
      //
    } finally {
      setProcessing(false);
    }
  };

  const roleLabel = {
    jobseeker: 'Job Seeker',
    employer: 'Employer',
    admin: 'Admin',
  };

  const roleVariant = {
    jobseeker: 'accent',
    employer: 'success',
    admin: 'warning',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
        <p className="text-slate-500 mt-1">Manage accounts, verify employers, and control access.</p>
      </div>

      {/* Search & filters */}
      <Card>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div className="sm:w-40">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 cursor-pointer"
            >
              <option value="">All Roles</option>
              <option value="jobseeker">Job Seekers</option>
              <option value="employer">Employers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
          <Button type="submit">Search</Button>
        </form>
      </Card>

      {/* Users table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : users.length === 0 ? (
        <Card padding="lg" className="text-center">
          <h3 className="font-semibold text-slate-700 mb-1">No users found</h3>
          <p className="text-sm text-slate-500">Try adjusting your search filters.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Joined</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || u.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="font-medium text-slate-800">{u.name || u.full_name || 'User'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={roleVariant[u.role] || 'neutral'} size="sm">
                        {roleLabel[u.role] || u.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {u.is_verified !== false ? (
                          <Badge variant="success" size="sm">Verified</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Unverified</Badge>
                        )}
                        {u.is_active === false && (
                          <Badge variant="danger" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.role === 'employer' && u.is_verified === false && (
                          <Button
                            size="sm"
                            onClick={() => setActionModal({ user: u, action: 'verify' })}
                          >
                            Verify
                          </Button>
                        )}
                        {u.is_active !== false ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-danger-600 hover:bg-danger-50"
                            onClick={() => setActionModal({ user: u, action: 'deactivate' })}
                          >
                            Deactivate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setActionModal({ user: u, action: 'activate' })}
                          >
                            Activate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Action confirmation modal */}
      <Modal
        open={!!actionModal}
        onClose={() => setActionModal(null)}
        title={`${actionModal?.action === 'verify' ? 'Verify' : actionModal?.action === 'deactivate' ? 'Deactivate' : 'Activate'} User`}
        size="sm"
      >
        <p className="text-sm text-slate-600 mb-6">
          {actionModal?.action === 'verify' && (
            <>Are you sure you want to verify <strong>{actionModal?.user?.name || actionModal?.user?.full_name}</strong>&apos;s employer account?</>
          )}
          {actionModal?.action === 'deactivate' && (
            <>Are you sure you want to deactivate <strong>{actionModal?.user?.name || actionModal?.user?.full_name}</strong>&apos;s account? They will no longer be able to sign in.</>
          )}
          {actionModal?.action === 'activate' && (
            <>Reactivate <strong>{actionModal?.user?.name || actionModal?.user?.full_name}</strong>&apos;s account?</>
          )}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setActionModal(null)}>Cancel</Button>
          <Button
            variant={actionModal?.action === 'deactivate' ? 'danger' : 'primary'}
            onClick={handleAction}
            loading={processing}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </div>
  );
}
