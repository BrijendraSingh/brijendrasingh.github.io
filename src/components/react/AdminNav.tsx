import { canManageUsers, canModeratePosts } from '@mr-brij/shared';
import type { SafeUser } from '@mr-brij/shared';

interface Props {
  user: SafeUser;
  active: 'queue' | 'users';
}

export default function AdminNav({ user, active }: Props) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
      {canModeratePosts(user.role) && (
        <a
          href="/admin/"
          className={`rounded-md px-3 py-1.5 text-sm ${active === 'queue' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Moderation queue
        </a>
      )}
      {canManageUsers(user.role) && (
        <a
          href="/admin/users"
          className={`rounded-md px-3 py-1.5 text-sm ${active === 'users' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Users
        </a>
      )}
      <a href="/profile/" className="ml-auto rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
        Profile
      </a>
    </nav>
  );
}
