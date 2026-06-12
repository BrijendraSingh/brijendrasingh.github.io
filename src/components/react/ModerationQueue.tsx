import { useEffect, useState } from 'react';
import type { Post, SafeUser } from '@mr-brij/shared';
import { POST_STATUS_LABELS, canModeratePosts } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';
import AdminNav from './AdminNav';

type AdminPost = Post & { author_name?: string };
type HiddenComment = {
  id: number;
  body: string;
  user_name: string;
  created_at: string;
  post_slug: string;
  post_title: string;
};

export default function ModerationQueue() {
  const [user, setUser] = useState<SafeUser | null | undefined>(undefined);
  const [queue, setQueue] = useState<Post[]>([]);
  const [published, setPublished] = useState<AdminPost[]>([]);
  const [hiddenComments, setHiddenComments] = useState<HiddenComment[]>([]);
  const [note, setNote] = useState<Record<number, string>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoadError(null);
    let me;
    try {
      me = await api.me();
    } catch {
      setUser(null);
      return;
    }
    setUser(me);
    if (!me || !canModeratePosts(me.role)) return;

    const [pending, live, hidden] = await Promise.allSettled([
      api.adminQueue(),
      api.adminPosts('published'),
      api.adminHiddenComments(),
    ]);

    setQueue(pending.status === 'fulfilled' ? pending.value : []);
    setPublished(live.status === 'fulfilled' ? live.value : []);
    setHiddenComments(hidden.status === 'fulfilled' ? hidden.value : []);

    if ([pending, live, hidden].some((r) => r.status === 'rejected')) {
      setLoadError('Some admin data could not be loaded. Try refreshing the page.');
    }
  };

  useEffect(() => {
    load().catch(() => setUser(null));
  }, []);

  if (user === undefined) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4 text-slate-600">Admin sign-in required.</p>
        <OAuthLogin returnTo="/admin/" />
      </div>
    );
  }
  if (!canModeratePosts(user.role)) {
    return <p className="p-6 text-slate-600">Moderator or admin access required.</p>;
  }

  const publish = async (id: number) => {
    await api.publishPost(id);
    await load();
  };

  const reject = async (id: number) => {
    await api.rejectPost(id, note[id] || 'Changes requested.');
    await load();
  };

  const deletePublished = async (post: AdminPost) => {
    const ok = window.confirm(
      `Delete “${post.title}” permanently?\n\nThis removes the post, comments, and reactions. This cannot be undone.`
    );
    if (!ok) return;
    setDeletingId(post.id);
    try {
      await api.deleteAdminPost(post.id);
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full">
      <AdminNav user={user} active="queue" />
      {loadError && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      )}

      <h2 className="mb-2 text-lg font-semibold text-slate-900">Moderation queue</h2>
      <p className="mb-4 text-sm text-slate-600">Review and publish guest submissions.</p>
      {queue.length === 0 ? (
        <p className="text-sm text-slate-500">No posts pending review.</p>
      ) : (
        <div className="space-y-4">
          {queue.map((post) => (
            <div key={post.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-slate-900">{post.title}</h2>
                  <p className="text-xs text-slate-500">
                    Submitted {post.submitted_at ? new Date(post.submitted_at).toLocaleString() : '—'}
                  </p>
                </div>
                <span className="badge badge--pending_review">
                  {POST_STATUS_LABELS.pending_review}
                </span>
              </div>
              <p className="mb-3 text-sm text-slate-600 line-clamp-2">{post.description}</p>
              <textarea
                className="mb-3 w-full rounded-md border border-slate-200 p-2 text-sm"
                placeholder="Review note (for reject)"
                rows={2}
                value={note[post.id] ?? ''}
                onChange={(e) => setNote({ ...note, [post.id]: e.target.value })}
              />
              <div className="flex gap-2">
                <button type="button" className="btn btn-primary text-sm" onClick={() => publish(post.id)}>
                  Approve & publish
                </button>
                <a href={`/admin/edit/${post.id}/`} className="btn btn-ghost text-sm">
                  Edit
                </a>
                <button type="button" className="btn btn-ghost text-sm" onClick={() => reject(post.id)}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-10 text-lg font-semibold text-slate-900">Published posts</h2>
      <p className="mb-4 text-sm text-slate-600">Permanently remove live articles from the blog.</p>
      {published.length === 0 ? (
        <p className="text-sm text-slate-500">No published posts.</p>
      ) : (
        <div className="space-y-4">
          {published.map((post) => (
            <div key={post.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-slate-900">{post.title}</h3>
                  <p className="text-xs text-slate-500">
                    {post.author_name ? `${post.author_name} · ` : ''}
                    Published{' '}
                    {post.published_at ? new Date(post.published_at).toLocaleString() : '—'}
                  </p>
                </div>
                <span className="badge badge--published">{POST_STATUS_LABELS.published}</span>
              </div>
              <p className="mb-3 text-sm text-slate-600 line-clamp-2">{post.description}</p>
              <div className="flex flex-wrap gap-2">
                <a href={`/blog/${post.slug}/`} className="btn btn-ghost text-sm">
                  View
                </a>
                <a href={`/admin/edit/${post.id}/`} className="btn btn-ghost text-sm">
                  Edit
                </a>
                <button
                  type="button"
                  className="btn btn-ghost text-sm text-red-700 hover:bg-red-50 hover:text-red-800"
                  disabled={deletingId === post.id}
                  onClick={() => deletePublished(post)}
                >
                  {deletingId === post.id ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="mb-2 mt-10 text-lg font-semibold text-slate-900">Hidden comments</h2>
      <p className="mb-4 text-sm text-slate-600">Restore comments hidden from public view.</p>
      {hiddenComments.length === 0 ? (
        <p className="text-sm text-slate-500">No hidden comments.</p>
      ) : (
        <div className="space-y-3">
          {hiddenComments.map((c) => (
            <div key={c.id} className="card p-4">
              <p className="mb-1 text-xs text-slate-500">
                {c.user_name} on{' '}
                <a href={`/blog/${c.post_slug}/`} className="text-blue-700 hover:underline">
                  {c.post_title}
                </a>
              </p>
              <p className="mb-3 text-sm text-slate-700 line-clamp-3">{c.body}</p>
              <button
                type="button"
                className="btn btn-ghost text-sm text-emerald-700 hover:bg-emerald-50"
                onClick={async () => {
                  await api.moderateComment(c.id, false);
                  await load();
                }}
              >
                Unhide
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
