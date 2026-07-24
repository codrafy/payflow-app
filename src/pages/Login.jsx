import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        await base44.auth.signInWithPassword(email, password);
      } else {
        await base44.auth.signUpWithPassword(email, password);
        setSignupSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await base44.auth.signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-white to-slate-50 px-4">
      <div className="max-w-sm w-full p-8 bg-white rounded-lg shadow-lg border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">
          {mode === 'signin' ? 'Log in' : 'Create account'}
        </h1>

        {signupSuccess ? (
          <p className="text-slate-600 text-center">
            Check your email to confirm your account, then log in.
          </p>
        ) : (
          <>
            <button
              onClick={handleGoogle}
              className="w-full h-11 mb-4 rounded-xl border border-slate-200 flex items-center justify-center gap-2 font-medium hover:bg-slate-50"
            >
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">OR</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-200"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl border border-slate-200"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-slate-900 text-white font-medium disabled:opacity-50"
              >
                {loading ? '...' : mode === 'signin' ? 'Log in' : 'Sign up'}
              </button>
            </form>

            <p className="text-sm text-slate-500 text-center mt-4">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-slate-900 font-medium underline"
              >
                {mode === 'signin' ? 'Sign up' : 'Log in'}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
