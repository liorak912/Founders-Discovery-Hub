import { useState } from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, FileQuestion, History, Quote, Sparkles, TriangleAlert, Users } from 'lucide-react';
import type { InterviewIdea } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { SectionShell, GenError, GenSkeleton } from '@/components/section-view';
import type { Project } from '@/lib/store';
import { LIMITS } from '@/lib/discovery';
import { cn } from '@/lib/utils';

const NE = 'Not established';
const txt = (v: string | null | undefined) => (v && v.trim() ? v : NE);
const total = (d: InterviewIdea) => d.painSeverity + d.frequency + d.evidenceStrength;

function Score({ label, v }: { label: string; v: number }) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between text-[11px] text-muted-foreground"><span>{label}</span><span className="font-mono text-foreground">{v}/5</span></div>
      <div className="mt-1 flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => <span key={n} className={cn('h-1.5 flex-1 rounded-full', n <= v ? 'bg-[hsl(var(--chart-2))]' : 'bg-muted')} />)}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function IdeaCard({ d, i }: { d: InterviewIdea; i: number }) {
  return (
    <article className="rise rounded-2xl border bg-card p-5 sm:p-6" style={{ animationDelay: `${i * 60}ms` }} data-testid={`card-interview-idea-${i}`}>
      <div className="flex flex-wrap items-start gap-3">
        <h3 className="min-w-0 flex-1 font-display text-lg font-semibold leading-snug">{txt(d.title)}</h3>
        <div className="rounded-lg border px-2.5 py-1 text-right" data-testid={`text-score-total-${i}`}>
          <div className="font-mono text-lg font-semibold leading-none">{total(d)}<span className="text-xs text-muted-foreground">/15</span></div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">AI score</div>
        </div>
      </div>

      <blockquote className="mt-4 rounded-lg border-l-4 border-[hsl(var(--chart-2))] bg-secondary/60 p-3 text-sm">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">The problem, in their words</div>
        {d.problem?.trim() ? <span className="whitespace-pre-wrap">{d.problem}</span> : <span className="italic text-muted-foreground">Verbatim problem statement unavailable in the notes.</span>}
      </blockquote>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium" data-testid={`text-participants-${i}`}>
            <Users className="h-4 w-4 text-muted-foreground" />
            {d.participantCount === null || d.participantCount === undefined ? 'Interviewees: Unknown' : `Interviewees: ${d.participantCount}`}
          </div>
          {d.participants.length ? (
            <ul className="space-y-1.5 text-xs">
              {d.participants.map((p, k) => (
                <li key={k} className="rounded-md bg-secondary/50 px-2 py-1.5"><span className="font-semibold">{p.label}:</span> <span className="text-muted-foreground">{p.excerpt}</span></li>
              ))}
            </ul>
          ) : <p className="text-xs text-muted-foreground">Participant attribution: {NE}.</p>}
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium"><Quote className="h-4 w-4 text-muted-foreground" /> Direct quotes</div>
          {d.quotes.length ? d.quotes.slice(0, 2).map((q, k) => (
            <figure key={k} className="text-sm">
              <blockquote className="italic">"{q.text}"</blockquote>
              <figcaption className="text-xs text-muted-foreground">{q.participant ? `- ${q.participant}` : '- participant not identified'}</figcaption>
            </figure>
          )) : <p className="text-xs text-muted-foreground" data-testid={`text-no-quotes-${i}`}>No verbatim quotes in the notes for this problem.</p>}
        </div>
      </div>
      {d.evidenceCaveat?.trim() && <p className="mt-3 flex gap-1.5 text-xs text-[hsl(38_70%_35%)]"><TriangleAlert className="mt-px h-3.5 w-3.5 shrink-0" /> {d.evidenceCaveat}</p>}

      <dl className="mt-5 grid gap-4 border-t pt-4 sm:grid-cols-2">
        <Field label="Target segment">{txt(d.targetSegment)}</Field>
        <Field label="How strongly it's felt">{txt(d.painIntensity)}</Field>
        <div className="sm:col-span-2"><Field label="Possible solution">{txt(d.solution)}</Field></div>
        <Field label="Workarounds and competitors mentioned">{txt(d.workarounds)}</Field>
        <Field label="Past money or time spent">{txt(d.willingnessToPay)}</Field>
        <Field label="Riskiest assumption">{txt(d.riskiestAssumption)}</Field>
        <Field label="Cheapest test">{txt(d.cheapestTest)}</Field>
      </dl>

      <div className="mt-5 rounded-xl border bg-background/60 p-4">
        <div className="grid grid-cols-3 gap-3">
          <Score label="Pain severity" v={d.painSeverity} />
          <Score label="Frequency" v={d.frequency} />
          <Score label="Evidence" v={d.evidenceStrength} />
        </div>
        <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Why these scores:</span> {txt(d.scoreRationale)}</p>
      </div>
    </article>
  );
}

export function InterviewIdeasStep({ project, g, onGen, onGoNotes }: {
  project: Project; g: { pending?: boolean; error?: string }; onGen: () => void; onGoNotes: () => void;
}) {
  const [desc, setDesc] = useState(true);
  const r = project.interviewIdeas;
  const notesEmpty = !project.notes.trim();
  const over = project.notes.length > LIMITS.notes;
  const outdated = !!r && r.sourceNotes !== project.notes;
  const ideas = r ? [...r.ideas].sort((a, b) => (desc ? total(b) - total(a) : total(a) - total(b))) : [];

  return (
    <SectionShell
      eyebrow="Step 06 · Ideas"
      title="Ideas from your interviews"
      intro="Problems your notes actually support, with who said what. Scores are AI judgment about your notes, not market statistics and not validation."
    >
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium">Source: this project's interview notes</div>
          <div className={cn('font-mono text-[11px]', over ? 'text-destructive' : 'text-muted-foreground')} data-testid="text-ideas-notes-count">
            {project.notes.length.toLocaleString()} / {LIMITS.notes.toLocaleString()} characters
          </div>
          {notesEmpty && <p className="mt-1 text-xs text-muted-foreground">Add interview notes in step 5 first.</p>}
          {over && <p className="mt-1 text-xs text-destructive">Notes are over the limit. Trim them in step 5.</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={onGoNotes} data-testid="button-edit-notes">Edit notes</Button>
        <Button onClick={onGen} disabled={notesEmpty || over || g.pending} data-testid="button-generate-interview-ideas">
          <Sparkles /> {g.pending ? 'Reading notes...' : r ? 'Regenerate' : 'Find ideas in my notes'}
        </Button>
      </div>

      {(project.sample || r?.sample) && (
        <p className="mt-3 text-xs text-muted-foreground">Sample project: these notes are fictional, so any ideas here are illustrative only.</p>
      )}
      {outdated && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[hsl(var(--chart-3)/0.45)] bg-[hsl(var(--chart-3)/0.1)] px-4 py-2.5 text-sm" role="status" data-testid="banner-ideas-outdated">
          <History className="h-4 w-4 shrink-0" /> Your notes changed since these ideas were generated. Regenerate to include the changes.
        </div>
      )}

      <div className="mt-4 space-y-4">
        {g.error && !g.pending && <GenError message={g.error} onRetry={onGen} keptExisting={!!r} />}
        {g.pending && <GenSkeleton label="Pulling problems, quotes, and evidence out of your notes." />}

        {r ? (
          <div className={cn('space-y-4', g.pending && 'opacity-50')}>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span>Generated {format(r.generatedAt, 'MMM d, h:mm a')} · {r.ideas.length} idea{r.ideas.length === 1 ? '' : 's'}</span>
              {r.ideas.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setDesc((v) => !v)} aria-label={`Sort by total score, currently ${desc ? 'high to low' : 'low to high'}`} data-testid="button-sort-score">
                  {desc ? <ArrowDownWideNarrow /> : <ArrowUpNarrowWide />} Score: {desc ? 'high to low' : 'low to high'}
                </Button>
              )}
            </div>
            {ideas.length ? ideas.map((d, i) => <IdeaCard key={`${d.title}-${i}`} d={d} i={i} />) : (
              <div className="rounded-2xl border border-dashed p-8 text-center" data-testid="empty-interview-ideas">
                <h3 className="font-display text-lg font-semibold">No grounded ideas yet</h3>
                <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Your notes don't yet show a problem with enough evidence behind it. That's a real result. Use the gaps and questions below for your next conversations.</p>
              </div>
            )}

            <section className="rounded-2xl border bg-card p-5" data-testid="section-gaps">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold"><FileQuestion className="h-5 w-5 text-[hsl(var(--chart-2))]" /> Gaps in the evidence</h3>
              {r.gaps.length ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{r.gaps.map((x, k) => <li key={k}>{x}</li>)}</ul>
              ) : <p className="mt-2 text-sm text-muted-foreground">No gaps were identified.</p>}
              <h4 className="mt-4 text-sm font-semibold">Ask in your next interviews</h4>
              {r.followUpQuestions.length ? (
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{r.followUpQuestions.map((x, k) => <li key={k}>{x}</li>)}</ol>
              ) : <p className="mt-2 text-sm text-muted-foreground">{NE}.</p>}
            </section>
          </div>
        ) : (
          !g.pending && (
            <div className="rounded-2xl border border-dashed p-10 text-center" data-testid="empty-ideas-step">
              <h3 className="font-display text-xl font-semibold">No ideas generated yet</h3>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                {notesEmpty ? 'Ideas come only from your real notes. Interview a few people, paste notes in step 5, then come back.' : 'Your notes are ready. Run it to see which problems they support.'}
              </p>
            </div>
          )
        )}
      </div>
    </SectionShell>
  );
}
