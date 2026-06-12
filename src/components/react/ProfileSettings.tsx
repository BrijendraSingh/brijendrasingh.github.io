import { useEffect, useRef, useState } from 'react';
import type { ProfileUser } from '@mr-brij/shared';
import { ROLE_LABELS } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';

function providerLabel(provider: string): string {
  if (provider === 'google') return 'Google';
  if (provider === 'github') return 'GitHub';
  if (provider === 'email') return 'Email';
  return provider;
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<ProfileUser | null | undefined>(undefined);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setError(null);
    try {
      const data = await api.getProfile();
      setProfile(data);
      setDisplayName(data.display_name);
      setBio(data.bio || '');
      setAvatarUrl(data.avatar_url || '');
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (profile === undefined) {
    return <p className="p-6 text-sm text-slate-500">Loading profile…</p>;
  }

  if (!profile) {
    return (
      <div className="p-6">
        <p className="mb-4 text-slate-600">Sign in to manage your profile.</p>
        <OAuthLogin returnTo="/profile/" />
      </div>
    );
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await api.updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        avatar_source: avatarUrl.trim() ? 'url' : undefined,
      });
      setProfile(updated);
      setMessage('Profile saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const revertOAuthAvatar = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateProfile({ avatar_source: 'oauth' });
      setProfile(updated);
      setAvatarUrl(updated.avatar_url || '');
      setMessage('Reverted to provider avatar.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revert avatar.');
    } finally {
      setBusy(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use JPEG, PNG, or WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2 MB or smaller.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = String(reader.result || '');
          resolve(result.split(',')[1] || '');
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const updated = await api.uploadAvatar(base64, file.type as 'image/jpeg' | 'image/png' | 'image/webp');
      setProfile(updated);
      setAvatarUrl(updated.avatar_url || '');
      setMessage('Avatar uploaded.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.changePassword(newPassword, profile.has_password ? currentPassword : undefined);
      setCurrentPassword('');
      setNewPassword('');
      setMessage(profile.has_password ? 'Password updated.' : 'Password set.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password change failed.');
    } finally {
      setBusy(false);
    }
  };

  const requestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api.requestEmailChange(newEmail.trim(), profile.has_password ? emailPassword : undefined);
      setMessage('Confirmation email sent to the new address.');
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Email change failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          {profile.email} · {providerLabel(profile.oauth_provider)} · {ROLE_LABELS[profile.role]}
        </p>
      </div>

      {message && <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{message}</p>}
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <section className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h2 className="font-medium text-slate-900">Avatar</h2>
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-slate-500">
              ?
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
            >
              Upload image
            </button>
            {profile.oauth_provider !== 'email' && (
              <button type="button" className="btn btn-ghost text-xs" onClick={revertOAuthAvatar} disabled={busy}>
                Use {providerLabel(profile.oauth_provider)} avatar
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadAvatar(file);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <form onSubmit={saveProfile} className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h2 className="font-medium text-slate-900">Details</h2>
        <label className="block text-sm">
          Display name
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            maxLength={100}
          />
        </label>
        <label className="block text-sm">
          Bio
          <textarea
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
          />
        </label>
        <label className="block text-sm">
          Avatar URL
          <input
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://…"
            type="url"
          />
        </label>
        <button type="submit" className="btn btn-primary text-sm" disabled={busy}>
          Save profile
        </button>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h2 className="font-medium text-slate-900">Security</h2>
        {profile.has_password && (
          <label className="block text-sm">
            Current password
            <input
              type="password"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
        )}
        <label className="block text-sm">
          {profile.has_password ? 'New password' : 'Set a password'}
          <input
            type="password"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
            autoComplete="new-password"
          />
        </label>
        <button type="submit" className="btn btn-primary text-sm" disabled={busy}>
          {profile.has_password ? 'Change password' : 'Set password'}
        </button>
        <p className="text-xs text-slate-500">
          <a href="/auth/forgot-password" className="underline">
            Forgot password?
          </a>
        </p>
      </form>

      <form onSubmit={requestEmailChange} className="space-y-4 rounded-lg border border-slate-200 p-4">
        <h2 className="font-medium text-slate-900">Email</h2>
        <p className="text-sm text-slate-600">Current: {profile.email}</p>
        <label className="block text-sm">
          New email
          <input
            type="email"
            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
          />
        </label>
        {profile.has_password && (
          <label className="block text-sm">
            Current password
            <input
              type="password"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm"
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
          </label>
        )}
        <button type="submit" className="btn btn-primary text-sm" disabled={busy}>
          Send confirmation email
        </button>
      </form>
    </div>
  );
}
