import { APP_CONFIG } from '../constants/index.js';

export class TextUtils {
  static wordCount(text: string | null | undefined): number {
    if (!text || text.trim().length === 0) return 0;
    return text.trim().split(/\s+/).length;
  }

  static readingTime(text: string | null | undefined): number {
    const words = TextUtils.wordCount(text);
    if (words === 0) return 0;
    return Math.ceil(words / APP_CONFIG.READING_SPEED_WPM);
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static stripMarkdown(text: string): string {
    return text
      .replace(/#{1,6}\s/g, '')
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .trim();
  }
}
