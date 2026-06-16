import type { PostEngagementStats } from '@mr-brij/shared';

export function CommentIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-3.5 2.5V5.5Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function HeartIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M10 16.5s-5.5-3.4-5.5-7.2a3.1 3.1 0 0 1 5.5-1.9 3.1 3.1 0 0 1 5.5 1.9c0 3.8-5.5 7.2-5.5 7.2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ThumbsUpIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M6.5 9.5V16h8.1c.8 0 1.5-.6 1.6-1.4l.8-5.2a1.6 1.6 0 0 0-1.6-1.8H11l.6-3.1a1.6 1.6 0 0 0-3.1-.5L6.5 9.5Z"
        strokeLinejoin="round"
      />
      <path d="M4.5 9.5H3a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h1.5V9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export function ThumbsDownIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path
        d="M13.5 10.5V4h-8.1c-.8 0-1.5.6-1.6 1.4l-.8 5.2a1.6 1.6 0 0 0 1.6 1.8H9l-.6 3.1a1.6 1.6 0 0 0 3.1.5l2.1-4.1h2.9a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-1.5v6.5Z"
        strokeLinejoin="round"
      />
      <path d="M15.5 10.5H17a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1h-1.5v7.5Z" strokeLinejoin="round" />
    </svg>
  );
}

export const ENGAGEMENT_METRICS: {
  key: keyof PostEngagementStats;
  label: string;
  Icon: () => JSX.Element;
  hash?: string;
}[] = [
  { key: 'comments', label: 'Comments', Icon: CommentIcon, hash: '#comments' },
  { key: 'like', label: 'Likes', Icon: HeartIcon, hash: '#engagement' },
  { key: 'thumbs_up', label: 'Thumbs up', Icon: ThumbsUpIcon, hash: '#engagement' },
  { key: 'thumbs_down', label: 'Thumbs down', Icon: ThumbsDownIcon, hash: '#engagement' },
];
