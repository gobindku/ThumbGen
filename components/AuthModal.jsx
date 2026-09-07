// File: components/AuthModal.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'login' | 'signup' | 'forgot'

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setActiveTab(initialTab);
    setErrorMsg('');
    setSuccessMsg('');
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isConfigured) {
      setErrorMsg('Supabase environment variables are missing. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env file.');
      return;
    }

    setLoading(true);

    try {
      if (activeTab === 'login') {
        if (!email || !password) {
          throw new Error('Please enter both email and password.');
        }
        await signIn({ email, password });
        setSuccessMsg('Successfully logged in!');
        setTimeout(() => {
          resetForm();
          onClose();
        }, 1200);
      } else if (activeTab === 'signup') {
        if (!email || !password) {
          throw new Error('Email and password are required.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match.');
        }
        const data = await signUp({ email, password, fullName });
        if (data?.user && data?.session === null) {
          setSuccessMsg('Account created! Please check your email inbox to confirm your registration.');
        } else {
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            resetForm();
            onClose();
          }, 1500);
        }
      } else if (activeTab === 'forgot') {
        if (!email) {
          throw new Error('Please enter your email address.');
        }
        await resetPassword(email);
        setSuccessMsg('Password reset link sent! Check your email inbox.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-10"
          aria-label="Close auth modal"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Modal Header */}
        <div className="pt-8 px-8 pb-4 text-center bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 text-red-600 rounded-xl mb-3 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {activeTab === 'login' && 'Welcome Back'}
            {activeTab === 'signup' && 'Create an Account'}
            {activeTab === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {activeTab === 'login' && 'Sign in to access your saved thumbnails and short clips.'}
            {activeTab === 'signup' && 'Join ThumbGen today to create AI-powered video content.'}
            {activeTab === 'forgot' && 'Enter your email to receive a password reset link.'}
          </p>

          {/* Navigation Tabs */}
          {activeTab !== 'forgot' && (
            <div className="flex border-b border-gray-200 mt-6">
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'login'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('signup')}
                className={`flex-1 pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'signup'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-8">
          {/* Unconfigured Warning Alert */}
          {!isConfigured && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <span className="font-semibold block mb-0.5">Supabase Setup Required</span>
                Set <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">NEXT_PUBLIC_SUPABASE_URL</code> and <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded text-amber-900">.env</code> to activate live Supabase Auth.
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
              />
            </div>

            {/* Password Field (Login & Signup) */}
            {activeTab !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-gray-700">Password</label>
                  {activeTab === 'login' && (
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('forgot')}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            )}

            {/* Confirm Password (Sign Up only) */}
            {activeTab === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                />
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium text-sm rounded-xl shadow-lg shadow-red-500/20 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {activeTab === 'login' && 'Sign In'}
                  {activeTab === 'signup' && 'Create Account'}
                  {activeTab === 'forgot' && 'Send Reset Link'}
                </>
              )}
            </button>
          </form>

          {/* Bottom Switch Links */}
          {activeTab === 'forgot' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className="text-xs font-semibold text-gray-600 hover:text-red-600 transition-colors"
              >
                ← Back to Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
