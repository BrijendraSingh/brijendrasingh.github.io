import { useCallback, useEffect, useState } from 'react';
import type { PostWithAuthor } from '@mr-brij/shared';
import { api } from '../../lib/api-client';

interface Props {
  initialQuery?: string;
}

export default function SearchBar({ initialQuery = '' }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(Boolean(initialQuery));

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.search(q.trim());
      setResults(data.posts);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    if (initialQuery) search(initialQuery);
  }, [initialQuery, search]);

  return (
    <div className="search-bar relative w-full max-w-md">
      <input
        type="search"
        className="search-input"
        placeholder="Search articles…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        aria-label="Search articles"
      />
      {open && query.trim() && (
        <div className="card absolute top-full z-50 mt-2 max-h-80 w-full overflow-y-auto p-2">
          {loading && <p className="px-3 py-2 text-sm text-slate-500">Searching…</p>}
          {!loading && results.length === 0 && (
            <p className="px-3 py-2 text-sm text-slate-500">No articles found.</p>
          )}
          {results.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}/`}
              className="block rounded-md px-3 py-2 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              <span className="block text-sm font-medium text-slate-900">{post.title}</span>
              <span className="block text-xs text-slate-500 line-clamp-1">{post.description}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
