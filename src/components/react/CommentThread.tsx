import { useCallback, useEffect, useState } from 'react';
import type { CommentWithMeta, SafeUser } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';
import CommentItem from './CommentItem';

interface Props {
  slug: string;
}

export default function CommentThread({ slug }: Props) {
  const [comments, setComments] = useState<CommentWithMeta[]>([]);
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState<SafeUser | null | undefined>(undefined);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    try {
      const [data, me] = await Promise.all([api.getComments(slug), api.me()]);
      setComments(data.comments);
      setTotal(data.total);
      setUser(me);
    } catch {
      /* ignore */
    }
  }, [slug]);

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, [load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      await api.postComment(slug, body.trim());
      setBody('');
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="comment-thread border-t border-slate-200 py-5" id="comments" aria-label="Comments">
      <h2 className="mb-3 text-base font-semibold text-slate-900">
        Comments {total > 0 && <span className="font-normal text-slate-500">({total})</span>}
      </h2>

      <ul className="mb-4 space-y-2">
        {comments.length === 0 && (
          <li className="text-xs text-slate-500">No comments yet — start the conversation below.</li>
        )}
        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            slug={slug}
            user={user ?? null}
            onChange={load}
            onNeedLogin={() => setShowLogin(true)}
          />
        ))}
      </ul>

      {user ? (
        <form onSubmit={submit} className="comment-inline-form" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.75rem' }}>
          <textarea
            id={`comment-${slug}`}
            rows={2}
            placeholder="Write a comment…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div className="comment-form-actions">
            <button type="submit" className="comment-action comment-action--save" disabled={submitting}>
              {submitting ? '…' : 'Post'}
            </button>
          </div>
        </form>
      ) : (
        <div className="comment-card">
          <p className="mb-2 text-xs text-slate-600">Sign in to comment, reply, or react.</p>
          <OAuthLogin returnTo={`/blog/${slug}/`} compact />
        </div>
      )}

      {showLogin && !user && (
        <div className="comment-card mt-2">
          <p className="mb-2 text-xs text-slate-600">Sign in to reply or react.</p>
          <OAuthLogin returnTo={`/blog/${slug}/`} compact />
        </div>
      )}
    </section>
  );
}
