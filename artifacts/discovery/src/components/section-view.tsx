import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown';

export function GenSkeleton({ label }: { label: string }) {
  return (
    <div className="rise space-y-5 rounded-2xl border bg-card p-6" data-testid="status-generating">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[hsl(var(--chart-2))] opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[hsl(var(--chart-2))]" />
        </span>
        {label} This usually takes 15-40 seconds.
      </div>
      {[0.55, 0.92, 0.8, 0.87, 0.4, 0.95, 0.7].map((w, i) => (
        <div key={i} className="shimmer h-3.5 rounded bg-muted" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  );
}

export function GenError({ message, onRetry, keptExisting }: { message: string; onRetry: () => void; keptExisting: boolean }) {
  return (
    <div className="rise flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center" data-testid="status-generation-error">
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
      <div className="flex-1 text-sm">
        <div className="font-medium text-destructive">Generation failed</div>
        <div className="text-muted-foreground">
          {message} {keptExisting && 'Your previous version is untouched below.'}
        </div>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry} data-testid="button-retry-generation">
        <RotateCcw /> Retry
      </Button>
    </div>
  );
}

export function SectionShell({
  eyebrow, title, intro, actions, children,
}: { eyebrow: string; title: string; intro: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <section className="rise space-y-5">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[hsl(var(--chart-2))]">{eyebrow}</div>
          <h1 className="font-display text-3xl font-semibold leading-tight sm:text-[2.1rem]">{title}</h1>
          <div className="mt-2 text-[15px] text-muted-foreground">{intro}</div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

export function GeneratedSection({
  content, updatedAt, pending, error, onGenerate, emptyTitle, emptyBody, generateLabel, pendingLabel, disabledReason, sample,
}: {
  content?: string;
  updatedAt?: number;
  pending: boolean;
  error?: string;
  onGenerate: () => void;
  emptyTitle: string;
  emptyBody: string;
  generateLabel: string;
  pendingLabel: string;
  disabledReason?: string;
  sample?: boolean;
}) {
  return (
    <div className="space-y-4">
      {error && !pending && <GenError message={error} onRetry={onGenerate} keptExisting={!!content} />}
      {pending && <GenSkeleton label={pendingLabel} />}
      {content ? (
        <article className={pending ? 'opacity-50 transition-opacity' : 'transition-opacity'}>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span data-testid="text-section-updated">
              {sample ? 'Illustrative sample content' : updatedAt ? `Generated ${formatDistanceToNow(updatedAt, { addSuffix: true })}` : 'Generated'}
            </span>
            <Button size="sm" variant="ghost" onClick={onGenerate} disabled={pending || !!disabledReason} data-testid="button-regenerate">
              <RefreshCw className={pending ? 'animate-spin' : ''} /> Regenerate
            </Button>
          </div>
          <div className="rounded-2xl border bg-card px-5 py-6 shadow-[0_1px_0_hsl(var(--border)),0_12px_32px_-20px_hsl(var(--primary)/0.25)] sm:px-8">
            <Markdown content={content} />
          </div>
        </article>
      ) : (
        !pending && (
          <div className="rise relative overflow-hidden rounded-2xl border border-dashed bg-card/60 p-8 text-center sm:p-12" data-testid="empty-section">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="font-display text-xl font-semibold">{emptyTitle}</h3>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">{emptyBody}</p>
            <Button className="mt-5" onClick={onGenerate} disabled={!!disabledReason} data-testid="button-generate">
              <Sparkles /> {generateLabel}
            </Button>
            {disabledReason && <p className="mt-2 text-xs text-muted-foreground">{disabledReason}</p>}
          </div>
        )
      )}
    </div>
  );
}
