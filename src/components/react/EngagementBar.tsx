import { useCallback, useEffect, useState } from 'react';
import type { ReactionCounts, ReactionType, SafeUser } from '@mr-brij/shared';
import { api } from '../../lib/api-client';
import OAuthLogin from './OAuthLogin';

interface Props {
  slug: string;
}

const REACTIONS: { type: ReactionType; label: string; icon: string }[] = [
  { type: 'like', label: 'Like', icon: '♥' },
  { type: 'thumbs_up', label: 'Helpful', icon: '👍' },
  { type: 'thumbs_down', label: 'Not helpful', icon: '👎' },
];

export default function EngagementBar({ slug }: Props) {
  const [counts, setCounts] = useState<ReactionCounts | null>(null);
  const [user, setUser] = useState<SafeUser | null | undefined>(undefined);
  const [showLogin, setShowLogin] = useState(false);

  const load = useCallback(async () => {
    try {
      const [reactions, me] = await Promise.all([api.getReactions(slug), api.me()]);
      setCounts(reactions);
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

  const handleReaction = async (type: ReactionType) => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    try {
      const next = counts?.user_reaction === type ? null : type;
      const updated = await api.setReaction(slug, next);
      setCounts(updated);
    } catch {
      setShowLogin(true);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    try {
      await api.subscribe('post', undefined);
      alert('Subscribed to updates!');
    } catch {
      setShowLogin(true);
    }
  };

  if (!counts) {
    return (
      <div id="engagement" className="engagement-bar border-t border-slate-200 py-4 text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div id="engagement" className="engagement-bar border-t border-slate-200 py-6">
      <div className="flex flex-wrap items-center gap-3">
        {REACTIONS.map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            className={`btn btn-ghost min-h-[44px] text-sm ${counts.user_reaction === type ? 'border-blue-600 text-blue-700' : ''}`}
            onClick={() => handleReaction(type)}
            aria-pressed={counts.user_reaction === type}
          >
            <span aria-hidden>{icon}</span>
            <span>{counts[type]}</span>
            <span className="sr-only">{label}</span>
          </button>
        ))}
        <button type="button" className="btn btn-ghost text-sm" onClick={handleSubscribe}>
          Subscribe
        </button>
      </div>
      {showLogin && !user && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-sm text-slate-600">Sign in to react or subscribe.</p>
          <OAuthLogin returnTo={`/blog/${slug}/`} compact />
        </div>
      )}
    </div>
  );
}
