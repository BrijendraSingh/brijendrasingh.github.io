import { useEffect, useState } from 'react';
import type { PostEngagementStats } from '@mr-brij/shared';
import { fetchEngagementStats } from '../../lib/engagement-batch';
import { ENGAGEMENT_METRICS } from './engagement-metrics';

interface Props {
  slug: string;
  href: string;
}

export default function EngagementStats({ slug, href }: Props) {
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

  if (!stats) {
    return (
      <div className="blog-list-item-engagement" aria-hidden>
        <span className="blog-list-item-engagement-skeleton" />
      </div>
    );
  }

  const hasActivity = ENGAGEMENT_METRICS.some(({ key }) => stats[key] > 0);
  const summary = ENGAGEMENT_METRICS.map(({ key, label }) => `${stats[key]} ${label.toLowerCase()}`).join(
    ', '
  );

  return (
    <div
      className={`blog-list-item-engagement${hasActivity ? ' blog-list-item-engagement--active' : ''}`}
      aria-label={`Reader engagement: ${summary}`}
    >
      {ENGAGEMENT_METRICS.map(({ key, label, Icon, hash }) => {
        const count = stats[key];
        const target = hash ? `${href}${hash}` : href;
        return (
          <a
            key={key}
            href={target}
            className={`blog-list-item-engagement-stat${count > 0 ? ' blog-list-item-engagement-stat--has-count' : ''}`}
            aria-label={`${count} ${label.toLowerCase()}`}
            title={`${count} ${label.toLowerCase()}`}
          >
            <Icon />
            <span>{count}</span>
          </a>
        );
      })}
    </div>
  );
}
