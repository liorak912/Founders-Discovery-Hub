import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { InterviewIdeasOutput, StartupDirection } from '@workspace/api-client-react';
import { createSampleProject } from './seed';

export type SectionKey = 'brief' | 'people' | 'kit' | 'synthesis';
export type ChatMsg = { role: 'user' | 'assistant'; content: string; at: number };
export type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface FounderProfile { skills: string; interests: string; experience: string; problems: string }
export interface IdeaSet {
  id: string;
  createdAt: number;
  profile: FounderProfile;
  /** Set this variation set was derived from; undefined for an original set. */
  parentId?: string;
  seed?: StartupDirection;
  ideas: StartupDirection[];
}
export interface InterviewIdeasResult extends InterviewIdeasOutput {
  sourceNotes: string;
  generatedAt: number;
  sample?: boolean;
}

export interface Project {
  id: string;
  name: string;
  industry: string;
  idea: string;
  customer: string;
  createdAt: number;
  updatedAt: number;
  step: Step;
  sections: Partial<Record<SectionKey, string>>;
  sectionUpdatedAt: Partial<Record<SectionKey, number>>;
  outreach: string;
  notes: string;
  chat: ChatMsg[];
  sample?: boolean;
  interviewIdeas?: InterviewIdeasResult;
}

export interface Draft { industry: string; idea: string; customer: string }

interface PersistShape {
  version: 1;
  projects: Project[];
  activeId: string | null;
  draft: Draft;
  draftChat: ChatMsg[];
  draftStep: Step;
  founder?: FounderProfile;
  ideaSets?: IdeaSet[];
  ideaView?: string | null;
}

const KEY = 'discovery.workspace.v1';
const emptyDraft: Draft = { industry: '', idea: '', customer: '' };
export const emptyFounder: FounderProfile = { skills: '', interests: '', experience: '', problems: '' };

type LoadResult = { state: PersistShape; problem: string | null };

function load(): LoadResult {
  const fresh = (): PersistShape => {
    const sample = createSampleProject();
    return { version: 1, projects: [sample], activeId: sample.id, draft: emptyDraft, draftChat: [], draftStep: 1 };
  };
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return { state: fresh(), problem: 'This browser is blocking local storage, so nothing you do here will be saved.' };
  }
  if (!raw) return { state: fresh(), problem: null };
  try {
    const parsed = JSON.parse(raw) as PersistShape;
    if (!parsed || !Array.isArray(parsed.projects)) throw new Error('bad shape');
    return {
      state: {
        version: 1,
        projects: parsed.projects,
        activeId: parsed.activeId ?? null,
        draft: parsed.draft ?? emptyDraft,
        draftChat: parsed.draftChat ?? [],
        draftStep: parsed.draftStep ?? 1,
        founder: { ...emptyFounder, ...(parsed.founder ?? {}) },
        ideaSets: Array.isArray(parsed.ideaSets) ? parsed.ideaSets : [],
        ideaView: parsed.ideaView ?? null,
      },
      problem: null,
    };
  } catch {
    try { window.localStorage.setItem(KEY + '.unreadable-backup', raw); } catch { /* ignore */ }
    return { state: fresh(), problem: 'Your saved workspace could not be read, so we started fresh. A backup copy of the unreadable data was kept in this browser.' };
  }
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

interface StoreValue {
  projects: Project[];
  active: Project | null;
  draft: Draft;
  draftChat: ChatMsg[];
  draftStep: Step;
  saveError: string | null;
  loadProblem: string | null;
  lastSavedAt: number | null;
  dismissLoadProblem: () => void;
  retrySave: () => void;
  setActive: (id: string | null) => void;
  setDraft: (patch: Partial<Draft>) => void;
  setDraftStep: (s: Step) => void;
  setDraftChat: (fn: (c: ChatMsg[]) => ChatMsg[]) => void;
  createProject: (d: Draft) => Project;
  updateProject: (id: string, fn: (p: Project) => Partial<Project>) => void;
  deleteProject: (id: string) => void;
  restoreSample: () => void;
  founder: FounderProfile;
  ideaSets: IdeaSet[];
  ideaView: string | null;
  setFounder: (patch: Partial<FounderProfile>) => void;
  setIdeaView: (id: string | null) => void;
  /** Adds a set. Switches view to it only if the view is still `expectView` (so a later navigation isn't stomped). */
  addIdeaSet: (set: IdeaSet, expectView: string | null) => void;
  researchDirection: (d: StartupDirection) => void;
}

const Ctx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef<LoadResult | null>(null);
  if (!initial.current) initial.current = load();
  const [state, setState] = useState<PersistShape>(initial.current.state);
  const [loadProblem, setLoadProblem] = useState<string | null>(initial.current.problem);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [saveTick, setSaveTick] = useState(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
      setSaveError(null);
      setLastSavedAt(Date.now());
    } catch (e) {
      const quota = e instanceof DOMException && (e.name === 'QuotaExceededError' || e.code === 22);
      setSaveError(
        quota
          ? 'Browser storage is full. Recent changes are not saved. Delete an old project or shorten notes, then retry.'
          : 'This browser refused to save. Recent changes will be lost if you close the tab.',
      );
    }
  }, [state, saveTick]);

  const active = useMemo(() => state.projects.find((p) => p.id === state.activeId) ?? null, [state]);

  const setActive = useCallback((id: string | null) => setState((s) => ({ ...s, activeId: id })), []);
  const setDraft = useCallback((patch: Partial<Draft>) => setState((s) => ({ ...s, draft: { ...s.draft, ...patch } })), []);
  const setDraftStep = useCallback((st: Step) => setState((s) => ({ ...s, draftStep: st })), []);
  const setDraftChat = useCallback((fn: (c: ChatMsg[]) => ChatMsg[]) => setState((s) => ({ ...s, draftChat: fn(s.draftChat) })), []);

  const createProject = useCallback((d: Draft) => {
    const now = Date.now();
    const id = uid();
    const created: Project = {
      id,
      name: d.industry.trim(),
      industry: d.industry.trim(),
      idea: d.idea.trim(),
      customer: d.customer.trim(),
      createdAt: now,
      updatedAt: now,
      step: 2,
      sections: {},
      sectionUpdatedAt: {},
      outreach: '',
      notes: '',
      chat: [],
    };
    setState((s) => {
      const withChat: Project = { ...created, chat: s.draftChat };
      return { ...s, projects: [withChat, ...s.projects], activeId: id, draft: emptyDraft, draftChat: [], draftStep: 1 };
    });
    return created;
  }, []);

  const updateProject = useCallback((id: string, fn: (p: Project) => Partial<Project>) => {
    setState((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...fn(p), updatedAt: Date.now() } : p)),
    }));
  }, []);

  const deleteProject = useCallback((id: string) => {
    setState((s) => ({ ...s, projects: s.projects.filter((p) => p.id !== id), activeId: s.activeId === id ? null : s.activeId }));
  }, []);

  const restoreSample = useCallback(() => {
    setState((s) => {
      const existing = s.projects.find((p) => p.sample);
      if (existing) return { ...s, activeId: existing.id };
      const sample = createSampleProject();
      return { ...s, projects: [...s.projects, sample], activeId: sample.id };
    });
  }, []);

  const setFounder = useCallback((patch: Partial<FounderProfile>) => setState((s) => ({ ...s, founder: { ...emptyFounder, ...s.founder, ...patch } })), []);
  const setIdeaView = useCallback((id: string | null) => setState((s) => ({ ...s, ideaView: id })), []);
  const addIdeaSet = useCallback((set: IdeaSet, expectView: string | null) => setState((s) => ({
    ...s,
    ideaSets: [...(s.ideaSets ?? []), set],
    ideaView: (s.ideaView ?? null) === expectView ? set.id : s.ideaView,
  })), []);
  const researchDirection = useCallback((d: StartupDirection) => setState((s) => ({
    ...s,
    activeId: null,
    draft: { industry: d.industry.slice(0, 300), idea: `${d.title}\n\nProblem: ${d.problem}\n\nPossible solution: ${d.solution}`.slice(0, 3000), customer: d.customer.slice(0, 1000) },
    draftStep: 1,
  })), []);

  const value: StoreValue = {
    founder: state.founder ?? emptyFounder,
    ideaSets: state.ideaSets ?? [],
    ideaView: state.ideaView ?? null,
    setFounder,
    setIdeaView,
    addIdeaSet,
    researchDirection,
    projects: state.projects,
    active,
    draft: state.draft,
    draftChat: state.draftChat,
    draftStep: state.draftStep,
    saveError,
    loadProblem,
    lastSavedAt,
    dismissLoadProblem: () => setLoadProblem(null),
    retrySave: () => setSaveTick((t) => t + 1),
    setActive,
    setDraft,
    setDraftStep,
    setDraftChat,
    createProject,
    updateProject,
    deleteProject,
    restoreSample,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
