import '@studioemar/shared';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background p-8">
      <h1 className="font-sans text-3xl font-bold text-foreground">
        Studio EMAR
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Primary
        </span>
        <span className="rounded-lg bg-cta px-4 py-2 text-primary-foreground">
          CTA
        </span>
      </div>
    </main>
  );
}
