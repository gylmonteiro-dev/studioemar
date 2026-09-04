import type { ReactNode } from 'react';
import { PageCanvas } from '@/components/layout/page-canvas';

export function LoadState({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}) {
  if (loading) {
    return <p className="text-muted-foreground">Carregando…</p>;
  }
  if (error) {
    return <p className="text-danger">{error}</p>;
  }
  return children;
}

export function PageLoadState({
  loading,
  error,
  children,
}: {
  loading: boolean;
  error: string | null;
  children: ReactNode;
}) {
  if (loading || error) {
    return (
      <PageCanvas>
        <LoadState loading={loading} error={error}>
          {null}
        </LoadState>
      </PageCanvas>
    );
  }
  return children;
}
