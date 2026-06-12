import { useEffect, useState } from 'react';
import type { SafeUser } from '@mr-brij/shared';
import { canManageUsers, canModeratePosts } from '@mr-brij/shared';
import { api } from '../../lib/api-client';

export default function AuthMenu() {
  const [user, setUser] = useState<SafeUser | null | undefined>(undefined);

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <a href="/auth/signin" className="btn btn-ghost min-h-[36px] px-3 py-1 text-xs sm:text-sm">
        Sign in
      </a>
    );
  }

  const showAdmin = canModeratePosts(user.role) || canManageUsers(user.role);
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const onAdmin = pathname.startsWith('/admin');

  return (
    <div className="flex items-center gap-2">
      <a
        href="/write/"
        className={`btn min-h-[36px] px-3 py-1 text-xs sm:text-sm ${onAdmin ? 'btn-ghost' : 'btn-primary'}`}
      >
        Write
      </a>
      {showAdmin && (
        <a
          href="/admin/"
          className={`btn min-h-[36px] px-3 py-1 text-xs sm:text-sm ${onAdmin ? 'btn-primary' : 'btn-ghost'}`}
        >
          Admin
        </a>
      )}
      <a
        href="/profile/"
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 sm:text-sm"
        title="Profile"
      >
        {user.avatar_url ? (
          <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] text-slate-600">
            {user.display_name.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden sm:inline">{user.display_name}</span>
      </a>
      <button
        type="button"
        className="btn btn-ghost min-h-[36px] px-2 py-1 text-xs"
        onClick={async () => {
          await api.logout();
          window.location.reload();
        }}
      >
        Out
      </button>
    </div>
  );
}
