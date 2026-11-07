import { useEffect, useRef, useState } from 'react';
import { useGenerateDiscovery } from '@workspace/api-client-react';
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, Copy, FlaskConical, HardDrive, MessageSquare, Plus, RotateCcw, Sparkles, Trash2, TriangleAlert, Undo2, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { ChatPanel } from '@/components/chat-panel';
import { Markdown } from '@/components/markdown';
import { GeneratedSection, SectionShell, GenError, GenSkeleton } from '@/components/section-view';
import { useStore, type Project, type SectionKey, type Step } from '@/lib/store';
import { buildGenContext, clip, errorMessage, LIMITS, splitKit, STEPS, stepInfo } from '@/lib/discovery';
import { FindIdeaStep } from '@/components/find-idea-step';
import { InterviewIdeasStep } from '@/components/interview-ideas-step';
import { useDirectionsGen, useInterviewIdeasGen } from '@/lib/use-idea-gen';
import { cn } from '@/lib/utils';

type GenState = Record<string, { pending?: boolean; error?: string }>;

function useGenerator() {
  const gen = useGenerateDiscovery();
  const { updateProject } = useStore();
  const [state, setState] = useState<GenState>({});
  const mutate = useRef(gen.mutateAsync);
  mutate.current = gen.mutateAsync;

  async function run(p: Project, section: SectionKey) {
    const key = `${p.id}:${section}`;
    setState((s) => ({ ...s, [key]: { pending: true } }));
    try {
      const res = await mutate.current({
        data: {
          industry: clip(p.industry, 300),
          idea: p.idea ? clip(p.idea, 3000) : undefined,
          customer: p.customer ? clip(p.customer, 1000) : undefined,
          section,
          context: buildGenContext(p, section),
          notes: section === 'synthesis' ? p.notes.slice(0, LIMITS.notes) : undefined,
        },
      });
      if (!res?.content?.trim()) throw new Error('The AI returned an empty response.');
      const now = Date.now();
      updateProject(p.id, (cur) => ({
        sections: { ...cur.sections, [section]: res.content },
        sectionUpdatedAt: { ...cur.sectionUpdatedAt, [section]: now },
        ...(section === 'kit' ? { outreach: splitKit(res.content).outreach } : {}),
      }));
      setState((s) => ({ ...s, [key]: {} }));
    } catch (e) {
      setState((s) => ({ ...s, [key]: { error: errorMessage(e) } }));
    }
  }
  const get = (p: Project | null, section: SectionKey) => (p ? state[`${p.id}:${section}`] ?? {} : {});
  return { run, get };
}

function SaveStatus() {
  const { saveError, lastSavedAt, retrySave } = useStore();
  if (saveError)
    return (
      <button onClick={retrySave} className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive" data-testid="status-save-error">
        <TriangleAlert className="h-3.5 w-3.5" /> Not saved · retry
      </button>
    );
  return (
    <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex" data-testid="status-saved" title="Everything lives in this browser's local storage. Nothing is sent to an account.">
      <HardDrive className="h-3.5 w-3.5" />
      Saved on this browser{lastSavedAt ? ` · ${format(lastSavedAt, 'h:mm a')}` : ''}
    </div>
  );
}

function ProjectSwitcher() {
  const { projects, active, setActive, deleteProject, restoreSample } = useStore();
  const [confirm, setConfirm] = useState<Project | null>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group flex min-w-0 items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-left transition hover:border-primary/40" data-testid="button-project-switcher">
            <span className="min-w-0">
              <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Project</span>
              <span className="block max-w-[160px] truncate text-sm font-medium sm:max-w-[260px]">{active ? active.name : 'New project'}</span>
            </span>
            {active?.sample && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">Sample</span>}
            <ChevronDown className="h-4 w-4 text-muted-foreground transition group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <DropdownMenuItem onClick={() => setActive(null)} data-testid="button-new-project">
            <Plus className="h-4 w-4" /> New project
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground">Saved on this browser</DropdownMenuLabel>
          {projects.length === 0 && <div className="px-2 py-2 text-xs text-muted-foreground">No projects yet.</div>}
          {projects.map((p) => (
            <DropdownMenuItem key={p.id} onClick={() => setActive(p.id)} className="group/item flex items-center gap-2" data-testid={`button-project-${p.id}`}>
              <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', p.id === active?.id ? 'bg-[hsl(var(--chart-2))]' : 'bg-transparent')} />
              <span className="min-w-0 flex-1">
                <span className="block truncate">{p.name}</span>
                <span className="block text-[11px] text-muted-foreground">{p.sample ? 'Illustrative sample' : `Step ${p.step} · ${format(p.updatedAt, 'MMM d')}`}</span>
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label={`Delete ${p.name}`}
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); setConfirm(p); }}
                className="rounded p-1 text-muted-foreground opacity-60 hover:bg-destructive/10 hover:text-destructive group-hover/item:opacity-100"
                data-testid={`button-delete-project-${p.id}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </span>
            </DropdownMenuItem>
          ))}
          {!projects.some((p) => p.sample) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={restoreSample} data-testid="button-restore-sample">
                <FlaskConical className="h-4 w-4" /> Restore the sample project
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{confirm?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the project, its notes, outreach edits, and chat from this browser. There is no other copy.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => { if (confirm) deleteProject(confirm.id); setConfirm(null); }}
              data-testid="button-confirm-delete"
            >
              Delete project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Stepper({ step, project, onGo, hasDirections }: { step: Step; project: Project | null; onGo: (s: Step) => void; hasDirections: boolean }) {
  const done = (n: Step) =>
    n === 0 ? hasDirections : n === 1 ? !!project : n === 6 ? !!project?.interviewIdeas : !!project?.sections[(['brief', 'people', 'kit', 'synthesis'] as SectionKey[])[n - 2]];
  return (
    <nav aria-label="Progress" className="border-b bg-background/80 backdrop-blur">
      <ol className="mx-auto flex max-w-[1500px] items-stretch px-2 sm:px-6">
        {STEPS.map((s, i) => {
          const isActive = s.n === step;
          const isDone = done(s.n);
          const locked = s.n > 1 && !project;
          return (
            <li key={s.n} className="relative min-w-0 flex-1">
              <button
                onClick={() => !locked && onGo(s.n)}
                disabled={locked}
                aria-current={isActive ? 'step' : undefined}
                className={cn(
                  'group flex w-full items-center justify-center gap-2 px-0.5 py-3 text-left transition sm:px-2 lg:justify-start lg:gap-2.5 lg:px-3',
                  locked ? 'cursor-not-allowed opacity-45' : 'hover:bg-secondary/60',
                )}
                data-testid={`button-step-${s.n}`}
              >
                <span
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border font-mono text-xs transition-all duration-300',
                    isActive && 'scale-110 border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_hsl(var(--primary)/0.12)]',
                    !isActive && isDone && 'border-[hsl(var(--chart-4))] bg-[hsl(var(--chart-4)/0.12)] text-[hsl(var(--chart-4))]',
                    !isActive && !isDone && 'bg-card text-muted-foreground',
                  )}
                >
                  {isDone && !isActive ? <Check className="h-3.5 w-3.5" /> : s.n}
                  <span className="sr-only">{` ${s.label}${s.optional ? ' (optional)' : ''}${isDone ? ', done' : ''}${locked ? ', needs a project' : ''}`}</span>
                </span>
                <span className="hidden min-w-0 lg:block" aria-hidden>
                  <span className={cn('block truncate text-sm font-medium', !isActive && 'text-muted-foreground group-hover:text-foreground')}>{s.label}</span>
                  <span className="hidden truncate text-[11px] text-muted-foreground xl:block">{s.blurb}</span>
                </span>
                <span className={cn('hidden text-xs font-medium lg:hidden', isActive && 'sm:block')}>{s.short}</span>
              </button>
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-border" />
              <span
                className={cn(
                  'absolute inset-x-0 bottom-0 h-[3px] origin-left transition-transform duration-500',
                  isActive ? 'scale-x-100 bg-primary' : isDone ? 'scale-x-100 bg-[hsl(var(--chart-4))]' : 'scale-x-0 bg-primary',
                )}
              />
              {i < STEPS.length - 1 && <span className="absolute right-0 top-1/2 hidden h-4 w-px -translate-y-1/2 bg-border md:block" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function SampleBanner() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--chart-3)/0.45)] bg-[hsl(var(--chart-3)/0.1)] px-4 py-3 text-sm" data-testid="banner-sample">
      <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(38_70%_35%)]" />
      <p>
        <span className="font-semibold">Illustrative sample.</span> This project is example content to explore. Nothing here comes from real interviews,
        and no real people are named. Regenerating any section replaces the sample text with live AI output.
      </p>
    </div>
  );
}

function FrameStep({ project, onCreate, onContinue, onFindIdea }: { project: Project | null; onCreate: () => void; onContinue: () => void; onFindIdea?: () => void }) {
  const { draft, setDraft, updateProject } = useStore();
  const values = project ?? draft;
  const [touched, setTouched] = useState(false);
  const set = (k: 'industry' | 'idea' | 'customer', v: string) => {
    if (project) updateProject(project.id, (p) => ({ [k]: v, ...(k === 'industry' && p.name === p.industry ? { name: v } : {}) }));
    else setDraft({ [k]: v });
  };
  const missing = !values.industry.trim();
  const submit = () => {
    setTouched(true);
    if (missing) return;
    if (project) onContinue();
    else onCreate();
  };
  return (
    <SectionShell
      eyebrow="Step 01 · Frame"
      title={project ? 'Your starting point' : 'Start with a market, not a product.'}
      intro={
        project
          ? 'Edit these anytime. Regenerate later steps afterwards to pick up the changes.'
          : 'Most first-time founders start with a solution and go looking for proof. Here you start with an industry and go looking for problems. An idea is welcome, but optional.'
      }
    >
      <form
        onSubmit={(e) => { e.preventDefault(); submit(); }}
        className="grid gap-6 rounded-2xl border bg-card p-5 sm:p-8 lg:grid-cols-[1fr_260px]"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="industry" className="flex items-center gap-2 text-sm font-semibold">
              Industry <span className="rounded bg-accent px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">Required</span>
            </Label>
            <Input
              id="industry"
              value={values.industry}
              maxLength={300}
              onChange={(e) => set('industry', e.target.value)}
              placeholder="e.g. Independent dental labs, commercial roofing contractors"
              className={cn('h-12 text-base', touched && missing && 'border-destructive')}
              aria-invalid={touched && missing}
              data-testid="input-industry"
            />
            {touched && missing && <p className="text-xs text-destructive" data-testid="error-industry">Name an industry to continue. Be as specific as you can.</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="idea" className="text-sm font-semibold">Rough idea <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Textarea
              id="idea"
              value={values.idea}
              maxLength={3000}
              onChange={(e) => set('idea', e.target.value)}
              placeholder="Half-formed is fine. We'll treat it as a hypothesis, not a plan."
              className="min-h-[110px]"
              data-testid="input-idea"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer" className="text-sm font-semibold">Who you think the customer is <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input
              id="customer"
              value={values.customer}
              maxLength={1000}
              onChange={(e) => set('customer', e.target.value)}
              placeholder="e.g. Office managers at 5-20 person firms"
              data-testid="input-customer"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button type="submit" size="lg" className="px-6" data-testid="button-submit-frame">
              {project ? (<>Continue to brief <ArrowRight /></>) : (<><Sparkles /> Create project and draft brief</>)}
            </Button>
            {!project && <span className="text-xs text-muted-foreground">Your draft is saved on this browser as you type.</span>}
          </div>
        </div>
        <aside className="space-y-3 rounded-xl bg-secondary/60 p-4 text-sm">
          <div className="font-display font-semibold">What happens next</div>
          <ol className="space-y-2.5 text-muted-foreground">
            {STEPS.filter((s) => s.n >= 2).map((s) => (
              <li key={s.n} className="flex gap-2.5">
                <span className="font-mono text-xs text-[hsl(var(--chart-2))]">0{s.n}</span>
                <span><span className="font-medium text-foreground">{s.label}.</span> {s.blurb}</span>
              </li>
            ))}
          </ol>
          <p className="border-t pt-3 text-xs text-muted-foreground">
            The goal is not a better pitch. It's ten honest conversations with people who live the problem.
          </p>
          {onFindIdea && (
            <button type="button" onClick={onFindIdea} className="text-left text-xs font-medium text-[hsl(var(--chart-2))] underline-offset-2 hover:underline" data-testid="link-find-idea">
              No idea yet? Try step 0, Find an idea.
            </button>
          )}
        </aside>
      </form>
    </SectionShell>
  );
}

function KitStep({ project, g, onGen }: { project: Project; g: { pending?: boolean; error?: string }; onGen: () => void }) {
  const { updateProject } = useStore();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const kit = project.sections.kit;
  const { script, outreach: generatedOutreach } = kit ? splitKit(kit) : { script: '', outreach: '' };
  const edited = !!kit && project.outreach !== generatedOutreach;
  const needsPeople = !project.sections.brief ? 'Generate the industry brief first.' : undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(project.outreach);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast({ title: 'Could not copy', description: 'Your browser blocked clipboard access. Select the text and copy it manually.', variant: 'destructive' });
    }
  }

  return (
    <SectionShell
      eyebrow="Step 04 · Kit"
      title="Interview kit"
      intro="A script built on past behavior, not hypotheticals. Plus a short outreach note you can edit, copy, and send yourself. Discovery never sends anything for you."
    >
      {!kit ? (
        <GeneratedSection
          pending={!!g.pending}
          error={g.error}
          onGenerate={onGen}
          emptyTitle="No kit yet"
          emptyBody="We'll write a Mom Test style script using your brief and segments, and a short outreach template."
          generateLabel="Generate interview kit"
          pendingLabel="Writing non-leading questions and your outreach note."
          disabledReason={needsPeople}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0">
            <GeneratedSection
              content={script}
              updatedAt={project.sectionUpdatedAt.kit}
              pending={!!g.pending}
              error={g.error}
              onGenerate={onGen}
              emptyTitle=""
              emptyBody=""
              generateLabel=""
              pendingLabel="Rewriting the script. Your current kit stays until the new one arrives."
              sample={project.sample && project.sectionUpdatedAt.kit === project.createdAt}
            />
            {edited && (
              <p className="mt-2 text-xs text-muted-foreground">Note: regenerating the kit replaces your edited outreach template with the new one.</p>
            )}
          </div>
          <div className="xl:sticky xl:top-4 xl:self-start">
            <div className="rounded-2xl border bg-card p-5">
              <div className="mb-1 flex items-center justify-between">
                <h3 className="font-display text-lg font-semibold">Outreach message</h3>
                {edited && <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Edited</span>}
              </div>
              <p className="mb-3 text-xs text-muted-foreground">Replace the brackets, keep it short, send it from your own email or LinkedIn.</p>
              <Textarea
                value={project.outreach}
                onChange={(e) => updateProject(project.id, () => ({ outreach: e.target.value }))}
                className="min-h-[280px] font-mono text-[13px] leading-relaxed"
                placeholder="The generated kit had no outreach section. Write your own here."
                data-testid="input-outreach"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button onClick={copy} disabled={!project.outreach.trim()} data-testid="button-copy-outreach">
                  {copied ? <><Check /> Copied</> : <><Copy /> Copy message</>}
                </Button>
                {edited && generatedOutreach && (
                  <Button variant="ghost" size="sm" onClick={() => updateProject(project.id, () => ({ outreach: generatedOutreach }))} data-testid="button-reset-outreach">
                    <Undo2 /> Reset
                  </Button>
                )}
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{project.outreach.trim().split(/\s+/).filter(Boolean).length} words</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function SynthesisStep({ project, g, onGen, onIdeas }: { project: Project; g: { pending?: boolean; error?: string }; onGen: () => void; onIdeas: () => void }) {
  const { updateProject } = useStore();
  const notesEmpty = !project.notes.trim();
  const over = project.notes.length > LIMITS.notes;
  return (
    <SectionShell
      eyebrow="Step 05 · Synthesize"
      title="What did you actually hear?"
      intro="Paste your raw interview notes. Synthesis compares them against your hypotheses and flags what held up, what didn't, and what surprised you. It only works on your notes."
    >
      <div className="grid gap-5 xl:grid-cols-[400px_minmax(0,1fr)]">
        <div className="space-y-3 xl:sticky xl:top-4 xl:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <Label htmlFor="notes" className="font-display text-lg font-semibold">Interview notes</Label>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              {project.sample ? 'These sample notes are fictional and labeled as such.' : 'One interview per block works best. Quotes beat summaries.'}
            </p>
            <Textarea
              id="notes"
              value={project.notes}
              onChange={(e) => updateProject(project.id, () => ({ notes: e.target.value }))}
              className="min-h-[340px] text-[13px] leading-relaxed"
              placeholder={'Interview 1 - Practice manager, 3 locations\n- "We lose about two hours a day to..."\n- Tried X last year, stopped because...'}
              data-testid="input-notes"
            />
            <div className="mt-2 flex items-center justify-between">
              <span className={cn('font-mono text-[11px]', over ? 'text-destructive' : 'text-muted-foreground')} data-testid="text-notes-count">
                {project.notes.length.toLocaleString()} / {LIMITS.notes.toLocaleString()}
              </span>
              <Button onClick={onGen} disabled={notesEmpty || over || g.pending} data-testid="button-synthesize">
                <Sparkles /> {project.sections.synthesis ? 'Re-synthesize' : 'Synthesize notes'}
              </Button>
            </div>
            {notesEmpty && <p className="mt-2 text-xs text-muted-foreground">Synthesis needs your real notes. Paste at least one conversation.</p>}
            {over && <p className="mt-2 text-xs text-destructive">Notes are over the limit. Trim them or synthesize in batches.</p>}
          </div>
          <button
            type="button"
            onClick={onIdeas}
            className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition hover:border-primary/40"
            data-testid="link-step6"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border font-mono text-xs">6</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Ideas from your interviews</span>
              <span className="block text-xs text-muted-foreground">Scored problems, quotes, and follow-up questions from these notes.</span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="min-w-0 space-y-4">
          {g.error && !g.pending && <GenError message={g.error} onRetry={onGen} keptExisting={!!project.sections.synthesis} />}
          {g.pending && <GenSkeleton label="Reading your notes against your hypotheses." />}
          {project.sections.synthesis ? (
            <div className={cn('rounded-2xl border bg-card px-5 py-6 sm:px-8', g.pending && 'opacity-50')}>
              <Markdown content={project.sections.synthesis} />
            </div>
          ) : (
            !g.pending && (
              <div className="rounded-2xl border border-dashed p-10 text-center" data-testid="empty-synthesis">
                <div className="mx-auto mb-4 flex w-max gap-1">
                  {[0, 1, 2].map((i) => <span key={i} className="h-10 w-2 rounded-full bg-muted" style={{ transform: `scaleY(${0.5 + i * 0.25})` }} />)}
                </div>
                <h3 className="font-display text-xl font-semibold">Nothing to synthesize yet</h3>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                  Go have a few conversations with your kit. Come back with notes, even messy ones.
                </p>
              </div>
            )
          )}
        </div>
      </div>
    </SectionShell>
  );
}

export default function Workspace() {
  const store = useStore();
  const { active, draft, draftStep, setDraftStep, updateProject, createProject, saveError, retrySave, loadProblem, dismissLoadProblem } = store;
  const { run, get } = useGenerator();
  const dirGen = useDirectionsGen();
  const ideasGen = useInterviewIdeasGen();
  const [chatOpen, setChatOpen] = useState(false);
  const step: Step = active ? active.step : draftStep;
  const mainRef = useRef<HTMLDivElement>(null);

  const go = (s: Step) => {
    if (active) updateProject(active.id, () => ({ step: s }));
    else setDraftStep(s);
  };

  useEffect(() => { mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' }); }, [step, active?.id]);

  const onCreate = () => {
    const p = createProject(draft);
    void run(p, 'brief');
  };
  const onContinue = () => {
    if (!active) return;
    go(2);
    if (!active.sections.brief && !get(active, 'brief').pending) void run(active, 'brief');
  };

  const gen = (section: SectionKey) => active && void run(active, section);

  return (
    <div className="flex h-[100dvh] flex-col">
      <header className="flex items-center gap-3 border-b bg-card/70 px-3 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="relative grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-display text-lg font-bold leading-none">d</span>
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-[hsl(var(--chart-2))]" />
          </div>
          <span className="hidden font-display text-lg font-semibold sm:block">Discovery</span>
        </div>
        <span className="hidden h-6 w-px bg-border sm:block" />
        <ProjectSwitcher />
        <div className="ml-auto flex items-center gap-2">
          <SaveStatus />
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setChatOpen(true)} data-testid="button-open-chat">
            <MessageSquare /> Ask
          </Button>
        </div>
      </header>

      <Stepper step={step} project={active} onGo={go} hasDirections={store.ideaSets.length > 0} />

      {(saveError || loadProblem) && (
        <div className="space-y-px">
          {saveError && (
            <div className="flex items-center gap-3 bg-destructive px-4 py-2 text-sm text-destructive-foreground sm:px-6" role="alert" data-testid="banner-save-error">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span className="flex-1">{saveError}</span>
              <Button size="sm" variant="secondary" onClick={retrySave} data-testid="button-retry-save"><RotateCcw /> Retry save</Button>
            </div>
          )}
          {loadProblem && (
            <div className="flex items-center gap-3 bg-[hsl(var(--chart-3)/0.18)] px-4 py-2 text-sm sm:px-6" role="status" data-testid="banner-load-problem">
              <TriangleAlert className="h-4 w-4 shrink-0" />
              <span className="flex-1">{loadProblem}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={dismissLoadProblem} aria-label="Dismiss"><X /></Button>
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <main ref={mainRef} className="min-w-0 flex-1 overflow-y-auto">
          <div key={`${active?.id ?? 'draft'}-${step}`} className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
            {active?.sample && <SampleBanner />}

            {step === 0 && <FindIdeaStep gen={dirGen} onSkip={() => go(1)} onResearched={() => undefined} />}
            {step === 1 && <FrameStep project={active} onCreate={onCreate} onContinue={onContinue} onFindIdea={() => go(0)} />}

            {step === 2 && active && (
              <SectionShell
                eyebrow="Step 02 · Brief"
                title={`How ${active.industry} works`}
                intro="The landscape, who holds the money, and pain points framed as hypotheses you still need to test."
              >
                <GeneratedSection
                  content={active.sections.brief}
                  updatedAt={active.sectionUpdatedAt.brief}
                  pending={!!get(active, 'brief').pending}
                  error={get(active, 'brief').error}
                  onGenerate={() => gen('brief')}
                  emptyTitle="No brief yet"
                  emptyBody="An overview of the industry, key players, how money flows, and 5-8 pain points to test."
                  generateLabel="Generate industry brief"
                  pendingLabel="Mapping the industry and drafting hypotheses."
                  sample={active.sample && active.sectionUpdatedAt.brief === active.createdAt}
                />
              </SectionShell>
            )}

            {step === 3 && active && (
              <SectionShell
                eyebrow="Step 03 · People"
                title="Who to talk to"
                intro="Segments and roles worth interviewing, and the public places they gather. Discovery suggests channels, never private individuals."
              >
                <GeneratedSection
                  content={active.sections.people}
                  updatedAt={active.sectionUpdatedAt.people}
                  pending={!!get(active, 'people').pending}
                  error={get(active, 'people').error}
                  onGenerate={() => gen('people')}
                  emptyTitle="No segments yet"
                  emptyBody="Roles to interview, plus conferences, associations, communities, and LinkedIn search strategies for each segment."
                  generateLabel="Find who to talk to"
                  pendingLabel="Working out segments and where they gather."
                  disabledReason={!active.sections.brief ? 'Generate the industry brief first so segments build on it.' : undefined}
                  sample={active.sample && active.sectionUpdatedAt.people === active.createdAt}
                />
              </SectionShell>
            )}

            {step === 4 && active && <KitStep project={active} g={get(active, 'kit')} onGen={() => gen('kit')} />}
            {step === 5 && active && <SynthesisStep project={active} g={get(active, 'synthesis')} onGen={() => gen('synthesis')} onIdeas={() => go(6)} />}
            {step === 6 && active && <InterviewIdeasStep project={active} g={ideasGen.get(active)} onGen={() => void ideasGen.run(active)} onGoNotes={() => go(5)} />}

            {step > 1 && !active && (
              <div className="rounded-2xl border border-dashed p-10 text-center">
                <h3 className="font-display text-xl font-semibold">Create a project first</h3>
                <Button className="mt-4" onClick={() => go(1)}>Go to step 1</Button>
              </div>
            )}

            {active && (
              <div className="flex items-center justify-between border-t pt-6">
                <Button variant="ghost" onClick={() => go((step - 1) as Step)} disabled={step === 0} data-testid="button-prev-step">
                  <ArrowLeft /> {step > 0 ? stepInfo((step - 1) as Step).label : 'Back'}
                </Button>
                {step < 6 && step !== 1 && (
                  <Button variant="outline" onClick={() => go((step + 1) as Step)} data-testid="button-next-step">
                    {stepInfo((step + 1) as Step).label} <ArrowRight />
                  </Button>
                )}
              </div>
            )}
          </div>
        </main>

        <aside className="hidden w-[380px] shrink-0 border-l bg-[hsl(var(--sidebar))] lg:flex">
          <ChatPanel step={step} className="w-full" />
        </aside>
      </div>

      <Sheet open={chatOpen} onOpenChange={setChatOpen}>
        <SheetContent side="right" className="flex w-full flex-col p-0 sm:max-w-md">
          <SheetTitle className="sr-only">Ask your guide</SheetTitle>
          <ChatPanel step={step} className="pt-6" />
        </SheetContent>
      </Sheet>

      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-5 right-5 z-40 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.6)] transition hover:-translate-y-0.5 lg:hidden"
          aria-label="Open chat"
          data-testid="button-chat-fab"
        >
          <MessageSquare className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
