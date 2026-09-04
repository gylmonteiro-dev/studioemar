import { BrandLogo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import type { ReactNode } from 'react';

type AuthPanelProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AuthPanel({ title, description, children }: AuthPanelProps) {
  return (
    <div className="flex min-h-screen bg-surface-dark text-surface-dark-foreground">
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle className="h-10 w-10 border-white/20 px-0 py-0 text-surface-dark-foreground hover:bg-white/10" />
      </div>
      <div className="relative hidden overflow-hidden md:flex md:w-1/2">
        <div className="absolute inset-0 bg-cta opacity-20" />
        <div className="relative z-10 flex h-full w-full flex-col justify-end gap-6 p-12">
          <BrandLogo variant="wordmark" priority className="h-24 w-auto" />
          <p className="max-w-md text-lg text-white/70">
            Precisão. Performance. Potência.
          </p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-[400px] flex-col gap-8">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <div className="mb-2 flex justify-center md:hidden">
              <BrandLogo variant="mark" priority className="h-16" />
            </div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-white/60">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
