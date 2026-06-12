import { canManageUsers, canModeratePosts } from '@mr-brij/shared';
import type { SafeUser } from '@mr-brij/shared';

interface Props {
  user: SafeUser;
  active: 'queue' | 'users';
}

function tabClass(isActive: boolean) {
  return [
    'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium leading-none',
    isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100',
  ].join(' ');
}

export default function AdminNav({ user, active }: Props) {
  return (
    <nav className="mb-6 flex items-center border-b border-slate-200 pb-4">
      <div className="flex items-center gap-1">
        {canModeratePosts(user.role) && (
          <a href="/admin/" className={tabClass(active === 'queue')}>
            Moderation queue
          </a>
        )}
        {canManageUsers(user.role) && (
          <a href="/admin/users" className={tabClass(active === 'users')}>
            Users
          </a>
        )}
      </div>
      <a
        href="/profile/"
        className="ml-auto inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium leading-none text-slate-600 hover:bg-slate-100"
      >
        Profile
      </a>
    </nav>
  );
}
