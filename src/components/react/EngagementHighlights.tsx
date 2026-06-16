import { useEffect, useState } from 'react';
import type { PostEngagementStats } from '@mr-brij/shared';
import { fetchEngagementStats } from '../../lib/engagement-batch';
import { ENGAGEMENT_METRICS } from './engagement-metrics';

interface Props {
  slug: string;
}

export default function EngagementHighlights({ slug }: Props) {
  const [stats, setStats] = useState<PostEngagementStats | null>(null);

  useEffect(() => {
    let active = true;
    fetchEngagementStats(slug).then((data) => {
      if (active) setStats(data);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  const summary =
    stats &&
    ENGAGEMENT_METRICS.map(({ key, label }) => `${stats[key]} ${label.toLowerCase()}`).join(', ');

  return (
    <aside className="engagement-sidebar" aria-labelledby="engagement-sidebar-heading">
      <h2 id="engagement-sidebar-heading" className="engagement-sidebar-title">
        Reader engagement
      </h2>

      {!stats ? (
        <div className="engagement-sidebar-loading" aria-hidden>
          <span className="engagement-sidebar-skeleton" />
        </div>
      ) : (
        <div
          className="engagement-sidebar-stats"
          role="list"
          aria-label={summary ? `Reader engagement: ${summary}` : undefined}
        >
          {ENGAGEMENT_METRICS.map(({ key, label, Icon, hash }) => {
            const count = stats[key];
            const href = hash ?? '#engagement';
            return (
              <a
                key={key}
                href={href}
                className={`engagement-sidebar-stat${count > 0 ? ' engagement-sidebar-stat--active' : ''}`}
                role="listitem"
                aria-label={`${count} ${label.toLowerCase()}`}
                title={`${count} ${label.toLowerCase()}`}
              >
                <Icon />
                <span>{count}</span>
              </a>
            );
          })}
        </div>
      )}
    </aside>
  );
}
