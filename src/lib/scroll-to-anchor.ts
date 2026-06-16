const SCROLL_OFFSET_PX = 24;
const DEFAULT_ATTEMPTS = 30;
const RETRY_MS = 100;

export function getScrollContainer(): HTMLElement | null {
  return document.querySelector('.site-main');
}

export function scrollToAnchor(
  hash: string,
  options?: { behavior?: ScrollBehavior; attempts?: number }
): void {
  const id = hash.replace(/^#/, '');
  if (!id) return;

  const behavior = options?.behavior ?? 'smooth';
  const maxAttempts = options?.attempts ?? DEFAULT_ATTEMPTS;
  let attempt = 0;

  const tryScroll = () => {
    const target = document.getElementById(id);
    const container = getScrollContainer();

    if (target && container) {
      const targetRect = target.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = targetRect.top - containerRect.top + container.scrollTop - SCROLL_OFFSET_PX;
      container.scrollTo({ top: Math.max(0, top), behavior });
      return;
    }

    attempt += 1;
    if (attempt < maxAttempts) {
      window.setTimeout(tryScroll, RETRY_MS);
    }
  };

  tryScroll();
}

export function isSamePageHashLink(href: string): string | null {
  try {
    const url = new URL(href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) return null;
    return url.hash;
  } catch {
    return null;
  }
}
