import { useEffect } from 'react';
import { isSamePageHashLink, scrollToAnchor } from '../../lib/scroll-to-anchor';

export default function HashScrollManager() {
  useEffect(() => {
    const scrollFromLocation = (behavior: ScrollBehavior = 'smooth') => {
      if (window.location.hash) {
        scrollToAnchor(window.location.hash, { behavior, attempts: 30 });
      }
    };

    const onHashChange = () => scrollFromLocation();

    const onPopState = () => scrollFromLocation();

    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href) return;

      const hash = isSamePageHashLink(href);
      if (!hash) return;

      event.preventDefault();

      if (window.location.hash !== hash) {
        window.history.pushState(null, '', hash);
      }

      scrollToAnchor(hash, { behavior: 'smooth', attempts: 30 });
    };

    const container = document.querySelector('.site-main');
    scrollFromLocation('auto');
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onPopState);
    container?.addEventListener('click', onClick);

    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onPopState);
      container?.removeEventListener('click', onClick);
    };
  }, []);

  return null;
}
