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

function LogoImage({
  asset,
  className,
  priority,
}: {
  asset: (typeof assets)[keyof typeof assets];
  className?: string;
  priority: boolean;
}) {
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

export function BrandLogo({
  variant,
  className,
  priority = false,
}: BrandLogoProps) {
  if (variant) {
    return (
      <LogoImage asset={assets[variant]} className={className} priority={priority} />
    );
  }

  return (
    <>
      <LogoImage
        asset={assets.wordmark}
        className={cn('hidden dark:block', className)}
        priority={priority}
      />
      <LogoImage
        asset={assets.mark}
        className={cn('dark:hidden', className)}
        priority={priority}
      />
    </>
  );
}
