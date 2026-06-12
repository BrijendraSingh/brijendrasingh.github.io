import { useState, type ReactNode } from 'react';
import type { CommentWithMeta, ReactionType, SafeUser } from '@mr-brij/shared';
import { api } from '../../lib/api-client';

const REACTIONS: { type: ReactionType; label: string; icon: string }[] = [
  { type: 'like', label: 'Love', icon: '♥' },
  { type: 'thumbs_up', label: 'Thumbs up', icon: '👍' },
  { type: 'thumbs_down', label: 'Thumbs down', icon: '👎' },
];

function ActionIcon({ children }: { children: ReactNode }) {
  return <span className="comment-action-icon" aria-hidden>{children}</span>;
}

function IconReply() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 8.5V4.5a1 1 0 0 1 1-1h7.5l-2-2M13.5 7.5 11 10l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconEdit() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10.5 2.5 13.5 5.5 5 14H2v-3L10.5 2.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconDelete() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h10M6 4.5V3.5h4v1M5.5 4.5v8h5v-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconHide() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z" strokeLinejoin="round" />
      <path d="M3 3 13 13" strokeLinecap="round" />
    </svg>
  );
}

function IconUnhide() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4Z" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.75" />
    </svg>
  );
}

interface Props {
  comment: CommentWithMeta;
  slug: string;
  user: SafeUser | null;
  depth?: number;
  onChange: () => Promise<void>;
  onNeedLogin: () => void;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function CommentItem({
  comment,
  slug,
  user,
  depth = 0,
  onChange,
  onNeedLogin,
}: Props) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [editBody, setEditBody] = useState(comment.body);
  const [busy, setBusy] = useState(false);
  const [reactions, setReactions] = useState(comment.reactions);

  const isOwner = user?.id === comment.user_id;
  const isAdmin = user?.role === 'admin';
  const isHidden = Boolean(comment.is_hidden);
  const edited =
    comment.updated_at && new Date(comment.updated_at).getTime() > new Date(comment.created_at).getTime();

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyBody.trim()) return;
    setBusy(true);
    try {
      await api.postComment(slug, replyBody.trim(), comment.id);
      setReplyBody('');
      setReplying(false);
      await onChange();
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editBody.trim()) return;
    setBusy(true);
    try {
      await api.updateComment(comment.id, editBody.trim());
      setEditing(false);
      await onChange();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this comment?')) return;
    setBusy(true);
    try {
      await api.deleteComment(comment.id);
      await onChange();
    } finally {
      setBusy(false);
    }
  };

  const setHidden = async (hidden: boolean) => {
    setBusy(true);
    try {
      await api.moderateComment(comment.id, hidden);
      await onChange();
    } finally {
      setBusy(false);
    }
  };

  const react = async (type: ReactionType) => {
    if (!user) {
      onNeedLogin();
      return;
    }
    try {
      const next = reactions.user_reaction === type ? null : type;
      const updated = await api.setCommentReaction(comment.id, next);
      setReactions(updated);
    } catch {
      onNeedLogin();
    }
  };

  return (
    <li
      className="comment-item"
      style={{ marginLeft: depth > 0 ? `${Math.min(depth, 4) * 0.75}rem` : undefined }}
    >
      <div className={`comment-card${isHidden ? ' comment-card--hidden' : ''}`}>
        <div className="comment-meta">
          <span className="font-medium text-slate-800">{comment.user_name}</span>
          {isHidden && isAdmin && (
            <span className="comment-hidden-badge">Hidden</span>
          )}
          <time className="text-slate-400" dateTime={comment.created_at}>
            {formatWhen(comment.created_at)}
          </time>
          {edited && <span className="text-[0.65rem] text-slate-400">edited</span>}
        </div>

        {editing ? (
          <form onSubmit={saveEdit} className="comment-inline-form" style={{ marginTop: 0, paddingTop: 0, border: 0 }}>
            <textarea rows={2} value={editBody} onChange={(e) => setEditBody(e.target.value)} required />
            <div className="comment-form-actions">
              <button type="submit" className="comment-action comment-action--save" disabled={busy}>
                Save
              </button>
              <button
                type="button"
                className="comment-action comment-action--cancel"
                onClick={() => {
                  setEditing(false);
                  setEditBody(comment.body);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="comment-body">{comment.body}</p>
        )}

        {!editing && (
          <div className="comment-toolbar">
            {REACTIONS.map(({ type, label, icon }) => (
              <button
                key={type}
                type="button"
                className={`comment-react ${reactions.user_reaction === type ? 'is-active' : ''}`}
                onClick={() => react(type)}
                aria-pressed={reactions.user_reaction === type}
                disabled={busy}
              >
                <span aria-hidden>{icon}</span>
                {reactions[type] > 0 && <span>{reactions[type]}</span>}
                <span className="sr-only">{label}</span>
              </button>
            ))}

            {user && (
              <span className="comment-actions">
                {user && (
                  <button
                    type="button"
                    className="comment-action comment-action--icon comment-action--reply"
                    onClick={() => setReplying((v) => !v)}
                    disabled={busy}
                    aria-label="Reply"
                    title="Reply"
                  >
                    <ActionIcon>
                      <IconReply />
                    </ActionIcon>
                  </button>
                )}
                {isOwner && (
                  <button
                    type="button"
                    className="comment-action comment-action--icon comment-action--edit"
                    onClick={() => setEditing(true)}
                    disabled={busy}
                    aria-label="Edit"
                    title="Edit"
                  >
                    <ActionIcon>
                      <IconEdit />
                    </ActionIcon>
                  </button>
                )}
                {(isOwner || isAdmin) && (
                  <button
                    type="button"
                    className="comment-action comment-action--icon comment-action--delete"
                    onClick={remove}
                    disabled={busy}
                    aria-label="Delete"
                    title="Delete"
                  >
                    <ActionIcon>
                      <IconDelete />
                    </ActionIcon>
                  </button>
                )}
                {isAdmin && isHidden && (
                  <button
                    type="button"
                    className="comment-action comment-action--icon comment-action--unhide"
                    onClick={() => setHidden(false)}
                    disabled={busy}
                    aria-label="Unhide"
                    title="Unhide"
                  >
                    <ActionIcon>
                      <IconUnhide />
                    </ActionIcon>
                  </button>
                )}
                {isAdmin && !isOwner && !isHidden && (
                  <button
                    type="button"
                    className="comment-action comment-action--icon comment-action--hide"
                    onClick={() => setHidden(true)}
                    disabled={busy}
                    aria-label="Hide"
                    title="Hide"
                  >
                    <ActionIcon>
                      <IconHide />
                    </ActionIcon>
                  </button>
                )}
              </span>
            )}
          </div>
        )}

        {replying && user && (
          <form onSubmit={submitReply} className="comment-inline-form">
            <textarea
              rows={2}
              placeholder={`Reply to ${comment.user_name}…`}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              required
            />
            <div className="comment-form-actions">
              <button type="submit" className="comment-action comment-action--save" disabled={busy}>
                {busy ? '…' : 'Reply'}
              </button>
              <button
                type="button"
                className="comment-action comment-action--cancel"
                onClick={() => setReplying(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <ul className="mt-1.5 space-y-1.5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              slug={slug}
              user={user}
              depth={depth + 1}
              onChange={onChange}
              onNeedLogin={onNeedLogin}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
