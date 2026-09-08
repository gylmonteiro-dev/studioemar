'use client';

import { X } from 'lucide-react';
import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';
import { Button } from './button';

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  nested?: boolean;
};

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
  nested = false,
}: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        if (nested) {
          event.stopImmediatePropagation();
        }
        onClose();
      }
    }

    document.addEventListener('keydown', onKeyDown, nested);
    return () => {
      document.removeEventListener('keydown', onKeyDown, nested);
    };
  }, [open, onClose, nested]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex items-center justify-center p-4',
        nested ? 'z-[60]' : 'z-50',
      )}
    >
      <button
        type="button"
        aria-label="Fechar"
        className="absolute inset-0 bg-surface-dark/40"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative z-10 w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg',
          className,
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold text-foreground">
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
    </div>,
    document.body,
  );
}
