import { useEffect, useState } from 'react';
import type { AdminUserRow, SafeUser, UserRole } from '@mr-brij/shared';
import { ROLE_LABELS, USER_ROLES, canManageUsers } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';
import AdminNav from './AdminNav';

export default function UserManagement() {
  const [user, setUser] = useState<SafeUser | null | undefined>(undefined);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setError(null);
    let me: SafeUser | null;
    try {
      me = await api.me();
    } catch {
      setUser(null);
      return;
    }
    setUser(me);
    if (!me || !canManageUsers(me.role)) return;
    try {
      const data = await api.adminUsers(query, roleFilter || undefined);
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users.');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    await load();
  };

  const updateUser = async (id: number, patch: { role?: UserRole; is_active?: boolean }) => {
    setBusyId(id);
    setError(null);
    try {
      await api.updateAdminUser(id, patch);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed.');
    } finally {
      setBusyId(null);
    }
  };

  const resetSessions = async (id: number) => {
    setBusyId(id);
    try {
      await api.resetUserSessions(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setBusyId(null);
    }
  };

  if (user === undefined) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4 text-slate-600">Admin sign-in required.</p>
        <OAuthLogin returnTo="/admin/users" />
      </div>
    );
  }
  if (!canManageUsers(user.role)) {
    return <p className="p-6 text-slate-600">User management requires admin access.</p>;
  }

  return (
    <div className="w-full">
      <AdminNav user={user} active="users" />
      <h1 className="mb-4 text-2xl font-semibold text-slate-900">User management</h1>
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <form onSubmit={search} className="mb-6 flex flex-wrap gap-2">
        <input
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          placeholder="Search name or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded border border-slate-300 px-3 py-2 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="">All roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary text-sm">
          Search
        </button>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id} className="border-t border-slate-100">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-200" />
                    )}
                    <div>
                      <div className="font-medium text-slate-900">{row.display_name}</div>
                      <div className="text-xs text-slate-500">{row.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3">
                  <select
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                    value={row.role}
                    disabled={busyId === row.id || row.id === user.id}
                    onChange={(e) => updateUser(row.id, { role: e.target.value as UserRole })}
                  >
                    {USER_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-3">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(row.is_active)}
                      disabled={busyId === row.id || row.id === user.id}
                      onChange={(e) => updateUser(row.id, { is_active: e.target.checked })}
                    />
                    <span className="text-xs text-slate-600">{row.is_active ? 'Active' : 'Inactive'}</span>
                  </label>
                </td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    className="text-xs text-slate-600 underline"
                    disabled={busyId === row.id}
                    onClick={() => resetSessions(row.id)}
                  >
                    Force logout
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="p-4 text-sm text-slate-500">No users found.</p>}
      </div>
    </div>
  );
}
