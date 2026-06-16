import type { PostEngagementStats } from '@mr-brij/shared';
import { api } from './api-client';

const BATCH_DELAY_MS = 16;
const MAX_BATCH_SIZE = 50;

const emptyStats = (): PostEngagementStats => ({
  like: 0,
  thumbs_up: 0,
  thumbs_down: 0,
  comments: 0,
});

type Resolver = (stats: PostEngagementStats) => void;

let pendingSlugs = new Set<string>();
let resolvers = new Map<string, Resolver[]>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;
let inflight: Promise<void> | null = null;

async function flushBatch(): Promise<void> {
  if (pendingSlugs.size === 0) return;

  const slugs = [...pendingSlugs].slice(0, MAX_BATCH_SIZE);
  const waiters = new Map(resolvers);
  pendingSlugs.clear();
  resolvers = new Map();
  batchTimer = null;

  try {
    const data = await api.getEngagementStats(slugs);
    for (const slug of slugs) {
      const stats = data[slug] ?? emptyStats();
      for (const resolve of waiters.get(slug) ?? []) resolve(stats);
    }
  } catch {
    for (const slug of slugs) {
      for (const resolve of waiters.get(slug) ?? []) resolve(emptyStats());
    }
  }
}

function scheduleBatch(): void {
  if (batchTimer) return;
  batchTimer = setTimeout(() => {
    inflight = flushBatch().finally(() => {
      inflight = null;
      if (pendingSlugs.size > 0) scheduleBatch();
    });
  }, BATCH_DELAY_MS);
}

export function fetchEngagementStats(slug: string): Promise<PostEngagementStats> {
  const normalized = slug.trim();
  if (!normalized) return Promise.resolve(emptyStats());

  return new Promise((resolve) => {
    pendingSlugs.add(normalized);
    const list = resolvers.get(normalized) ?? [];
    list.push(resolve);
    resolvers.set(normalized, list);
    scheduleBatch();
  });
}
