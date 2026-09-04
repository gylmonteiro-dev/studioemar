'use client';

import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';

type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
};

export function BottomSheet({
  open,
  title,
  onClose,
  children,
  className,
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-surface-dark/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className={cn(
          'relative z-10 w-full rounded-t-xl border border-border bg-surface p-6 shadow-lg sm:max-w-md sm:rounded-xl',
          className,
        )}
      >
        <div className="mb-4 flex justify-center sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-border" />
        </div>
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="sheet-title" className="text-xl font-semibold text-foreground">
            {title}
          </h2>
          <Button
            variant="ghost"
            aria-label="Fechar"
            className="h-10 w-10 px-0 py-0"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}
