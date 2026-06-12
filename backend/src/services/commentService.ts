import type { CommentWithMeta, ReactionCounts, ReactionType } from '@mr-brij/shared';
import { dbAll } from '../config/database.api.js';

export interface CommentRow {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  updated_at: string | null;
  is_deleted: number;
  is_hidden: number;
  user_name: string;
  user_avatar: string | null;
}

function emptyReactionCounts(): ReactionCounts {
  return { like: 0, thumbs_up: 0, thumbs_down: 0, user_reaction: null };
}

export async function loadReactionsForComments(
  commentIds: number[],
  userId?: number
): Promise<Map<number, ReactionCounts>> {
  const map = new Map<number, ReactionCounts>();
  if (commentIds.length === 0) return map;

  for (const id of commentIds) {
    map.set(id, emptyReactionCounts());
  }

  const placeholders = commentIds.map(() => '?').join(',');
  const rows = await dbAll<{ comment_id: number; type: ReactionType; count: number }>(
    `SELECT comment_id, type, COUNT(*) AS count
     FROM comment_reactions WHERE comment_id IN (${placeholders})
     GROUP BY comment_id, type`,
    commentIds
  );
  for (const row of rows) {
    const counts = map.get(row.comment_id);
    if (counts) counts[row.type] = row.count;
  }

  if (userId) {
    const userRows = await dbAll<{ comment_id: number; type: ReactionType }>(
      `SELECT comment_id, type FROM comment_reactions
       WHERE comment_id IN (${placeholders}) AND user_id = ?`,
      [...commentIds, userId]
    );
    for (const row of userRows) {
      const counts = map.get(row.comment_id);
      if (counts) counts.user_reaction = row.type;
    }
  }

  return map;
}

export function buildCommentTree(
  flat: CommentRow[],
  reactions: Map<number, ReactionCounts>
): CommentWithMeta[] {
  const byId = new Map<number, CommentWithMeta>();
  const roots: CommentWithMeta[] = [];

  for (const row of flat) {
    byId.set(row.id, {
      ...row,
      reactions: reactions.get(row.id) ?? emptyReactionCounts(),
      replies: [],
    });
  }

  for (const comment of byId.values()) {
    if (comment.parent_id != null && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)!.replies!.push(comment);
    } else {
      roots.push(comment);
    }
  }

  return roots;
}

export function countComments(comments: CommentWithMeta[]): number {
  return comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0);
}
