import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldLogo } from '../components/ShieldLogo';
import { LanguagePicker } from '../components/LanguagePicker';
import { ErrorBox } from '../components/ErrorBox';
import { LogIn, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('aarav.patel@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex justify-center p-3 bg-navy-50 rounded-2xl">
          <ShieldLogo className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-navy-950">Welcome Back</h1>
        <p className="text-base text-slate-700 font-medium">
          Sign in to access your family's safety alerts and scans
        </p>
      </div>

      {/* Language Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <LanguagePicker />
      </div>

      {/* Login Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">
        <ErrorBox error={error} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="email-input"
              className="block text-base font-bold text-slate-900"
            >
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full min-h-[50px] px-4 py-3 rounded-xl border-2 border-slate-300 text-lg focus:border-navy-900 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password-input"
              className="block text-base font-bold text-slate-900"
            >
              Password
            </label>
            <input
              id="password-input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full min-h-[50px] px-4 py-3 rounded-xl border-2 border-slate-300 text-lg focus:border-navy-900 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[52px] py-3.5 px-6 bg-navy-900 hover:bg-navy-800 disabled:bg-slate-400 text-white rounded-xl text-lg font-bold shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Sign In to ScamShield</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-base text-slate-700">
            Don't have an account yet?{' '}
            <Link
              to="/signup"
              className="font-bold text-navy-900 hover:underline inline-flex items-center gap-1"
            >
              Create Account <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
