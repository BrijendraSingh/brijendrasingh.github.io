import { useEffect, useState } from 'react';
import type { Post, PostWithAuthor } from '@mr-brij/shared';
import { POST_STATUS_LABELS } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';

interface Props {
  postId?: number;
  isAdmin?: boolean;
}

export default function PostEditor({ postId, isAdmin = false }: Props) {
  const [user, setUser] = useState<{ role: string } | null | undefined>(undefined);
  const [post, setPost] = useState<Partial<PostWithAuthor>>({
    title: '',
    description: '',
    body_md: '',
    tag_names: [] as unknown as PostWithAuthor['tags'],
  });
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!postId) return;
    api.authorPosts().then((posts) => {
      const found = posts.find((p) => p.id === postId);
      if (found) {
        setPost(found);
        setTagsInput('');
      }
    });
  }, [postId]);

  if (user === undefined) return <p className="text-sm text-slate-500">Loading…</p>;
  if (!user) {
    return (
      <div className="p-6">
        <p className="mb-4 text-slate-600">Sign in to write articles.</p>
        <OAuthLogin returnTo={window.location.pathname} />
      </div>
    );
  }

  // Any signed-in user may write; readers are promoted to author on first save (server-side).

  const save = async () => {
    setSaving(true);
    setMessage('');
    try {
      const tag_names = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const payload = {
        title: post.title,
        description: post.description,
        body_md: post.body_md,
        tag_names,
      };
      const saved = postId
        ? await api.updatePost(postId, payload)
        : await api.createPost(payload);
      setPost(saved);
      setMessage('Saved.');
      if (!postId) window.location.href = `/write/edit/${saved.id}/`;
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const submitForReview = async () => {
    if (!post.id) return;
    setSaving(true);
    try {
      await api.submitPost(post.id);
      setMessage('Submitted for review.');
      const posts = await api.authorPosts();
      const updated = posts.find((p) => p.id === post.id);
      if (updated) setPost(updated);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Submit failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          {postId ? 'Edit article' : 'New article'}
        </h1>
        {post.status && (
          <span className={`badge badge--${post.status}`}>
            {POST_STATUS_LABELS[post.status] ?? post.status}
          </span>
        )}
      </div>
      {post.review_note && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Review note: {post.review_note}
        </div>
      )}
      <div className="space-y-4">
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-lg font-medium"
          placeholder="Title"
          value={post.title ?? ''}
          onChange={(e) => setPost({ ...post, title: e.target.value })}
        />
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder="Short description"
          value={post.description ?? ''}
          onChange={(e) => setPost({ ...post, description: e.target.value })}
        />
        <input
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
          placeholder="Tags (comma-separated)"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
        <textarea
          className="min-h-[320px] w-full rounded-md border border-slate-200 p-3 font-mono text-sm"
          placeholder="Write in Markdown…"
          value={post.body_md ?? ''}
          onChange={(e) => setPost({ ...post, body_md: e.target.value })}
        />
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save draft'}
        </button>
        {post.id && !isAdmin && ['draft', 'rejected'].includes(post.status ?? '') && (
          <button type="button" className="btn btn-ghost" onClick={submitForReview} disabled={saving}>
            Submit for review
          </button>
        )}
      </div>
      {message && <p className="mt-3 text-sm text-slate-600">{message}</p>}
    </div>
  );
}
