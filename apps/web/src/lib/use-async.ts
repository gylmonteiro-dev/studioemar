'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const key = `${JSON.stringify(deps)}:${tick}`;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loaderRef.current()
      .then((value) => {
        if (!cancelled) {
          setData(value);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error ? caught.message : 'Não foi possível carregar',
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  const reload = useCallback(() => {
    setTick((value) => value + 1);
  }, []);

  return { data, error, loading, reload };
}
