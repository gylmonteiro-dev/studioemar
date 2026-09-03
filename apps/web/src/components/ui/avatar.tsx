'use client';

import { User } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/cn';

type AvatarProps = {
  src?: string;
  alt: string;
  fallback?: string;
  className?: string;
};

export function Avatar({ src, alt, fallback, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;

  return (
    <div
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground',
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => {
            setFailed(true);
          }}
        />
      ) : fallback ? (
        <span className="font-mono text-xs font-semibold uppercase">
          {fallback}
        </span>
      ) : (
        <User aria-hidden className="h-5 w-5" />
      )}
    </div>
  );
}
