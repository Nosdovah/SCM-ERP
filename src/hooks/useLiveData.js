import { useEffect, useRef } from 'react';

// Re-runs `onChange` whenever a live collection change arrives from the server
// (SSE). `collections` optionally limits which collections trigger the callback;
// pass null/undefined to react to every change.
export function useLiveData(onChange, collections = null) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const deps = Array.isArray(collections) ? collections.join(',') : (collections ?? '');

  useEffect(() => {
    const handler = (e) => {
      const c = e.detail?.collection;
      if (!collections) { cbRef.current(c); return; }
      const wanted = Array.isArray(collections)
        ? collections.includes(c) || collections.includes('*')
        : collections === c;
      if (wanted) cbRef.current(c);
    };
    window.addEventListener('moai:live-change', handler);
    return () => window.removeEventListener('moai:live-change', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps]);

  return null;
}