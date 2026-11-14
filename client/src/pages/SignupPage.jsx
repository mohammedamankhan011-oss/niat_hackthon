import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldLogo } from '../components/ShieldLogo';
import { LanguagePicker } from '../components/LanguagePicker';
import { ErrorBox } from '../components/ErrorBox';
import { UserPlus, ArrowRight } from 'lucide-react';

export function SignupPage() {
  const { signup, language } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLang, setSelectedLang] = useState(language || 'en');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signup(name, email, password, selectedLang);
      navigate('/dashboard', { replace: true });
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
        <h1 className="text-3xl font-black text-navy-950">Protect Your Family</h1>
        <p className="text-base text-slate-700 font-medium">
          Create an account to safeguard yourself and your elderly parents
        </p>
      </div>

      {/* Language Picker */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <LanguagePicker onChange={(l) => setSelectedLang(l)} />
      </div>

      {/* Signup Form */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border-2 border-slate-200 shadow-sm space-y-6">
        <ErrorBox error={error} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="name-input"
              className="block text-base font-bold text-slate-900"
            >
              Full Name / पूरा नाम / ಪೂರ್ಣ ಹೆಸರು
            </label>
            <input
              id="name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Patel"
              className="w-full min-h-[50px] px-4 py-3 rounded-xl border-2 border-slate-300 text-lg focus:border-navy-900 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="email-input-signup"
              className="block text-base font-bold text-slate-900"
            >
              Email Address
            </label>
            <input
              id="email-input-signup"
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
              htmlFor="password-input-signup"
              className="block text-base font-bold text-slate-900"
            >
              Create Password (min. 6 characters)
            </label>
            <input
              id="password-input-signup"
              type="password"
              required
              minLength={6}
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
              <span>Creating account...</span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>Create Safe Account</span>
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-slate-200 text-center">
          <p className="text-base text-slate-700">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-navy-900 hover:underline inline-flex items-center gap-1"
            >
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
