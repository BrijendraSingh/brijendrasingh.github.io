import { useEffect, useState } from 'react';
import type { Post, SafeUser } from '@mr-brij/shared';
import { POST_STATUS_LABELS } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';

export default function AuthorDashboard() {
  const [user, setUser] = useState<SafeUser | null | undefined>(undefined);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoadError(null);
    let me: SafeUser;
    try {
      me = await api.me();
    } catch {
      setUser(null);
      return;
    }
    setUser(me);
    try {
      setPosts(await api.authorPosts());
    } catch {
      setPosts([]);
      setLoadError('Could not load your articles. Try refreshing the page.');
    }
  };

  useEffect(() => {
    load().catch(() => setUser(null));
  }, []);

  if (user === undefined) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4 text-slate-600">Sign in to manage your articles.</p>
        <OAuthLogin returnTo="/write/" />
      </div>
    );
  }

  const submit = async (id: number) => {
    setBusyId(id);
    try {
      await api.submitPost(id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const unpublish = async (post: Post) => {
    const ok = window.confirm(
      `Unpublish “${post.title}”?\n\nIt will be removed from the public blog and moved back to draft.`
    );
    if (!ok) return;
    setBusyId(post.id);
    try {
      await api.unpublishPost(post.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (post: Post) => {
    const message =
      post.status === 'published'
        ? `Delete “${post.title}” permanently?\n\nThis removes the live article, comments, and reactions. This cannot be undone.`
        : `Delete “${post.title}” permanently?`;
    if (!window.confirm(message)) return;
    setBusyId(post.id);
    try {
      await api.deletePost(post.id);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const canSubmit = (status: Post['status']) => status === 'draft' || status === 'rejected';

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">My articles</h1>
          <p className="mt-1 text-sm text-slate-600">
            Edit, unpublish, or delete articles you have written.
          </p>
        </div>
        <a href="/write/new/" className="btn btn-primary text-sm">
          New article
        </a>
      </div>

      {loadError && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </p>
      )}

      {posts.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-4 text-slate-600">You have not written any articles yet.</p>
          <a href="/write/new/" className="btn btn-primary text-sm">
            Write your first article
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="card p-4">
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-medium text-slate-900">{post.title || 'Untitled'}</h2>
                  <p className="text-xs text-slate-500">
                    Updated{' '}
                    {post.updated_date
                      ? new Date(post.updated_date).toLocaleString()
                      : post.created_at
                        ? new Date(post.created_at).toLocaleString()
                        : '—'}
                    {post.submitted_at && post.status === 'pending_review' && (
                      <> · Submitted {new Date(post.submitted_at).toLocaleString()}</>
                    )}
                    {post.published_at && post.status === 'published' && (
                      <> · Published {new Date(post.published_at).toLocaleString()}</>
                    )}
                  </p>
                </div>
                <span className={`badge badge--${post.status}`}>
                  {POST_STATUS_LABELS[post.status] ?? post.status}
                </span>
              </div>
              {post.review_note && post.status === 'rejected' && (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  Review note: {post.review_note}
                </p>
              )}
              {post.description && (
                <p className="mb-3 text-sm text-slate-600 line-clamp-2">{post.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {post.status === 'published' && post.slug && (
                  <a href={`/blog/${post.slug}/`} className="btn btn-ghost text-sm">
                    View
                  </a>
                )}
                <a href={`/write/edit/${post.id}/`} className="btn btn-ghost text-sm">
                  Edit
                </a>
                {canSubmit(post.status) && (
                  <button
                    type="button"
                    className="btn btn-primary text-sm"
                    disabled={busyId === post.id}
                    onClick={() => submit(post.id)}
                  >
                    {busyId === post.id ? 'Submitting…' : 'Submit for review'}
                  </button>
                )}
                {post.status === 'published' && (
                  <button
                    type="button"
                    className="btn btn-ghost text-sm"
                    disabled={busyId === post.id}
                    onClick={() => unpublish(post)}
                  >
                    {busyId === post.id ? 'Working…' : 'Unpublish'}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-ghost text-sm text-red-700 hover:bg-red-50 hover:text-red-800"
                  disabled={busyId === post.id}
                  onClick={() => remove(post)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
