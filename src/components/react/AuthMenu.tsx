import { useEffect, useState } from 'react';
import type { SafeUser } from '@mr-brij/shared';
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

  return (
    <div className="flex items-center gap-2">
      <a href="/write/" className="btn btn-primary min-h-[36px] px-3 py-1 text-xs sm:text-sm">
        Write
      </a>
      {user.role === 'admin' && (
        <a href="/admin/" className="btn btn-ghost min-h-[36px] px-3 py-1 text-xs sm:text-sm">
          Admin
        </a>
      )}
      <span className="hidden text-xs text-slate-600 sm:inline">{user.display_name}</span>
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
