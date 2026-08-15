import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import DashboardLayout from '../components/layout/DashboardLayout';

// Auth pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ChangePassword from '../pages/auth/ChangePassword';
import ForgotPassword from '../pages/auth/ForgotPassword';

// Job Seeker pages
import JSDashboard from '../pages/jobseeker/Dashboard';
import JSProfileEdit from '../pages/jobseeker/ProfileEdit';
import JSResumeUpload from '../pages/jobseeker/ResumeUpload';
import JSJobSearch from '../pages/jobseeker/JobSearch';
import JSJobDetails from '../pages/jobseeker/JobDetails';
import JSMyApplications from '../pages/jobseeker/MyApplications';
import JSRecommendations from '../pages/jobseeker/Recommendations';

// Employer pages
import EMDashboard from '../pages/employer/Dashboard';
import EMCompanyProfile from '../pages/employer/CompanyProfile';
import EMPostJob from '../pages/employer/PostJob';
import EMManageJobs from '../pages/employer/ManageJobs';
import EMApplicants from '../pages/employer/Applicants';
import EMCandidateProfile from '../pages/employer/CandidateProfile';

// Admin pages
import ADDashboard from '../pages/admin/Dashboard';
import ADUserManagement from '../pages/admin/UserManagement';
import ADFlaggedPostings from '../pages/admin/FlaggedPostings';
import ADAnalytics from '../pages/admin/Analytics';
import NotFound from '../pages/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Public ─────────────────────────────────────────── */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* ── Auth (mixed — some need login) ────────────────── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowedRoles={['jobseeker', 'employer', 'admin']}>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      {/* ── Job Seeker ─────────────────────────────────────── */}
      <Route
        path="/jobseeker"
        element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<JSDashboard />} />
        <Route path="profile" element={<JSProfileEdit />} />
        <Route path="resume" element={<JSResumeUpload />} />
        <Route path="jobs" element={<JSJobSearch />} />
        <Route path="jobs/:id" element={<JSJobDetails />} />
        <Route path="applications" element={<JSMyApplications />} />
        <Route path="recommendations" element={<JSRecommendations />} />
      </Route>

      {/* ── Employer ───────────────────────────────────────── */}
      <Route
        path="/employer"
        element={
          <ProtectedRoute allowedRoles={['employer']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<EMDashboard />} />
        <Route path="company" element={<EMCompanyProfile />} />
        <Route path="post-job" element={<EMPostJob />} />
        <Route path="jobs" element={<EMManageJobs />} />
        <Route path="jobs/:id/applicants" element={<EMApplicants />} />
        <Route path="candidates/:id" element={<EMCandidateProfile />} />
      </Route>

      {/* ── Admin ──────────────────────────────────────────── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<ADDashboard />} />
        <Route path="users" element={<ADUserManagement />} />
        <Route path="flagged" element={<ADFlaggedPostings />} />
        <Route path="analytics" element={<ADAnalytics />} />
      </Route>

      {/* ── Fallback ───────────────────────────────────────── */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
