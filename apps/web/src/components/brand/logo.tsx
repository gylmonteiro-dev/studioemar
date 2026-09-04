import { cn } from '@/lib/cn';
import Image from 'next/image';

const assets = {
  wordmark: {
    src: '/brand/logo-wordmark.svg',
    width: 160,
    height: 160,
  },
  mark: {
    src: '/brand/logo-mark.svg',
    width: 120,
    height: 130,
  },
} as const;

type BrandLogoProps = {
  variant?: keyof typeof assets;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = 'wordmark',
  className,
  priority = false,
}: BrandLogoProps) {
  const asset = assets[variant];

  return (
    <Image
      src={asset.src}
      alt="Studio EMAR"
      width={asset.width}
      height={asset.height}
      priority={priority}
      unoptimized
      className={cn('h-10 w-auto object-contain', className)}
    />
  );
}
