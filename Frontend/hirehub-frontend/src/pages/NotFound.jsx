import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-fade-in relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-32 -left-32 w-[450px] h-[450px] bg-accent-200/40 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-blue-200/40 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-md w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
        {/* Animated 404 Badge */}
        <div className="w-20 h-20 bg-accent-50 rounded-2xl flex items-center justify-center mb-6 text-accent-600 shadow-inner">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-6xl font-black text-slate-800 tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-bold text-slate-700 mb-2">Page Not Found</h2>
        <p className="text-slate-500 text-sm leading-relaxed mb-8">
          The page you are looking for doesn&apos;t exist or may have been moved. Check the URL or navigate back home.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button variant="secondary" className="w-full" onClick={() => navigate(-1)}>
            ← Go Back
          </Button>
          <Link to="/login" className="w-full">
            <Button className="w-full">Back to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
