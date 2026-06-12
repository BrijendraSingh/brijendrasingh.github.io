import { useState } from 'react';
import { api } from '../../lib/api-client';

interface Props {
  returnTo?: string;
  compact?: boolean;
}

export default function OAuthLogin({ returnTo = '/', compact = false }: Props) {
  const q = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : '';
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        await api.signup(email.trim(), password, displayName.trim() || undefined);
      } else {
        await api.login(email.trim(), password);
      }
      window.location.href = returnTo;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <div className={compact ? 'flex gap-2' : 'flex flex-col gap-3 sm:flex-row'}>
        <a href={`/auth/google${q}`} className="btn btn-ghost flex-1 text-sm">
          Sign in with Google
        </a>
        <a href={`/auth/github${q}`} className="btn btn-ghost flex-1 text-sm">
          Sign in with GitHub
        </a>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or use email</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="flex gap-2 text-xs">
        <button
          type="button"
          className={`rounded px-2 py-1 ${mode === 'signin' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          onClick={() => {
            setMode('signin');
            setError('');
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`rounded px-2 py-1 ${mode === 'signup' ? 'bg-slate-900 text-white' : 'text-slate-600'}`}
          onClick={() => {
            setMode('signup');
            setError('');
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={submitEmail} className="space-y-2">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Display name (optional)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            autoComplete="name"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          autoComplete="email"
          required
        />
        <input
          type="password"
          placeholder={mode === 'signup' ? 'Password (min 8 characters)' : 'Password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          minLength={mode === 'signup' ? 8 : 1}
          required
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button type="submit" className="btn btn-primary w-full text-sm" disabled={loading}>
          {loading ? '…' : mode === 'signup' ? 'Create account' : 'Sign in with email'}
        </button>
      </form>
    </div>
  );
}
