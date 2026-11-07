import { ArrowLeft, ArrowRight, Compass, Layers, Microscope, Sparkles } from 'lucide-react';
import type { StartupDirection } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { SectionShell, GenError, GenSkeleton } from '@/components/section-view';
import { useStore, type FounderProfile, type IdeaSet } from '@/lib/store';
import { FOUNDER_MAX, profileEmpty, type useDirectionsGen } from '@/lib/use-idea-gen';
import { cn } from '@/lib/utils';

const FIELDS: { k: keyof FounderProfile; label: string; ph: string }[] = [
  { k: 'skills', label: 'Skills', ph: 'e.g. Ops spreadsheets, B2B sales, some Python' },
  { k: 'interests', label: 'Interests', ph: 'e.g. Logistics, food safety, small manufacturers' },
  { k: 'experience', label: 'Industries you know or can reach', ph: 'e.g. Six years at a freight brokerage; my uncle runs a machine shop' },
  { k: 'problems', label: 'Problems you have noticed', ph: 'e.g. Dispatchers re-typing the same load info into three systems' },
];

function setLabel(set: IdeaSet) {
  return set.seed ? `Variations of "${set.seed.title}"` : 'Original directions';
}

function DirectionCard({ d, i, onResearch, onMore, more }: {
  d: StartupDirection; i: number; onResearch: () => void; onMore: () => void; more: { pending?: boolean; error?: string };
}) {
  return (
    <article className="rise rounded-2xl border bg-card p-5" style={{ animationDelay: `${i * 60}ms` }} data-testid={`card-direction-${i}`}>
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs text-[hsl(var(--chart-2))]">0{i + 1}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-snug">{d.title}</h3>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{d.industry}</p>
        </div>
      </div>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div className="sm:col-span-2 rounded-lg bg-secondary/60 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Problem</dt>
          <dd className="mt-1">{d.problem}</dd>
        </div>
        <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Customer</dt><dd className="mt-1">{d.customer}</dd></div>
        <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Why you</dt><dd className="mt-1">{d.founderFit}</dd></div>
        <div className="sm:col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Possible solution (a hypothesis)</dt><dd className="mt-1 text-muted-foreground">{d.solution}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
        <Button size="sm" onClick={onResearch} data-testid={`button-research-${i}`}><Microscope /> Research this</Button>
        <Button size="sm" variant="outline" onClick={onMore} disabled={more.pending} data-testid={`button-more-like-${i}`}>
          <Layers /> {more.pending ? 'Finding variations...' : 'More like this'}
        </Button>
      </div>
      {more.error && !more.pending && <p className="mt-2 text-xs text-destructive" role="alert">Variations failed: {more.error}</p>}
    </article>
  );
}

export function FindIdeaStep({ gen, onSkip, onResearched }: { gen: ReturnType<typeof useDirectionsGen>; onSkip: () => void; onResearched: () => void }) {
  const { founder, setFounder, ideaSets, ideaView, setIdeaView, researchDirection } = useStore();
  const current = ideaSets.find((s) => s.id === ideaView) ?? ideaSets[ideaSets.length - 1] ?? null;
  const parent = current?.parentId ? ideaSets.find((s) => s.id === current.parentId) ?? null : null;
  const root = gen.get('root');
  const empty = profileEmpty(founder);
  const over = Object.values(founder).some((v) => v.length > FOUNDER_MAX);

  // Original founder profile = the profile of the root set in this chain.
  const rootProfile = (set: IdeaSet): FounderProfile => {
    let s = set;
    for (let n = 0; n < 50 && s.parentId; n++) {
      const up = ideaSets.find((x) => x.id === s.parentId);
      if (!up) break;
      s = up;
    }
    return s.profile;
  };

  return (
    <SectionShell
      eyebrow="Step 00 · Optional"
      title="No idea yet? Start from problems you can reach."
      intro="Tell us what you know and what you have noticed. You'll get five problem-first directions, each a starting point to research, not a business plan. Skip this if you already have a market in mind."
    >
      <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form
          onSubmit={(e) => { e.preventDefault(); if (!empty && !over) void gen.run('root', founder); }}
          className="space-y-4 rounded-2xl border bg-card p-5 xl:sticky xl:top-4 xl:self-start"
        >
          <div className="flex items-center gap-2 font-display text-lg font-semibold"><Compass className="h-5 w-5 text-[hsl(var(--chart-2))]" /> Your founder profile</div>
          {FIELDS.map((f) => (
            <div key={f.k} className="space-y-1.5">
              <Label htmlFor={`founder-${f.k}`} className="text-sm font-semibold">{f.label}</Label>
              <Textarea
                id={`founder-${f.k}`}
                value={founder[f.k]}
                maxLength={FOUNDER_MAX}
                onChange={(e) => setFounder({ [f.k]: e.target.value })}
                placeholder={f.ph}
                className="min-h-[72px] text-[13px]"
                data-testid={`input-founder-${f.k}`}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground">All fields optional, but fill at least one. Saved on this browser.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={empty || over || root.pending} data-testid="button-generate-directions">
              <Sparkles /> {root.pending ? 'Generating...' : ideaSets.length ? 'New set of 5' : 'Find 5 directions'}
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip} data-testid="button-skip-step0">Skip to step 1 <ArrowRight /></Button>
          </div>
        </form>

        <div className="min-w-0 space-y-4">
          {root.error && !root.pending && <GenError message={root.error} onRetry={() => void gen.run('root', founder)} keptExisting={!!current} />}
          {root.pending && <GenSkeleton label="Looking for problems you are positioned to see." />}

          {current ? (
            <>
              <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-secondary/50 px-3 py-2 text-sm" data-testid="nav-idea-sets">
                {parent && (
                  <Button size="sm" variant="ghost" onClick={() => setIdeaView(parent.id)} data-testid="button-back-idea-set">
                    <ArrowLeft /> Back to {setLabel(parent).toLowerCase()}
                  </Button>
                )}
                <span className="min-w-0 flex-1 truncate font-medium" data-testid="text-idea-set">{setLabel(current)}</span>
                {ideaSets.length > 1 && (
                  <select
                    aria-label="Saved direction sets"
                    value={current.id}
                    onChange={(e) => setIdeaView(e.target.value)}
                    className="max-w-[220px] rounded-md border bg-card px-2 py-1 text-xs"
                    data-testid="select-idea-set"
                  >
                    {[...ideaSets].reverse().map((s) => (
                      <option key={s.id} value={s.id}>{setLabel(s)} · {format(s.createdAt, 'MMM d, h:mm a')}</option>
                    ))}
                  </select>
                )}
              </div>
              <p className="text-xs text-muted-foreground">AI suggestions based on your profile. None of these has been validated. Research this copies a direction into a new project draft; existing projects are untouched.</p>
              <div className={cn('space-y-4', root.pending && 'opacity-60')}>
                {current.ideas.map((d, i) => {
                  const key = `${current.id}:${i}`;
                  return (
                    <DirectionCard
                      key={key}
                      d={d}
                      i={i}
                      more={gen.get(key)}
                      onResearch={() => { researchDirection(d); onResearched(); }}
                      onMore={() => void gen.run(key, rootProfile(current), { set: current, idea: d })}
                    />
                  );
                })}
              </div>
            </>
          ) : (
            !root.pending && (
              <div className="rounded-2xl border border-dashed p-10 text-center" data-testid="empty-directions">
                <Compass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <h3 className="font-display text-xl font-semibold">No directions yet</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">Fill in anything you can on the left. Specific beats impressive: the problems you've seen up close are the best leads.</p>
              </div>
            )
          )}
        </div>
      </div>
    </SectionShell>
  );
}
