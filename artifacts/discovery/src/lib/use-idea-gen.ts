import { useRef, useState } from 'react';
import { useGenerateDirections, useGenerateInterviewIdeas, type StartupDirection } from '@workspace/api-client-react';
import { useStore, uid, type FounderProfile, type IdeaSet, type Project } from './store';
import { clip, errorMessage, LIMITS } from './discovery';

export const FOUNDER_MAX = 3000;

export function profileEmpty(f: FounderProfile) {
  return !f.skills.trim() && !f.interests.trim() && !f.experience.trim() && !f.problems.trim();
}

/** Directions generator. Pending/error keyed by request kind ("root" or the seeded set+index). */
export function useDirectionsGen() {
  const gen = useGenerateDirections();
  const fn = useRef(gen.mutateAsync);
  fn.current = gen.mutateAsync;
  const { addIdeaSet, ideaView } = useStore();
  const viewRef = useRef(ideaView);
  viewRef.current = ideaView;
  const [state, setState] = useState<Record<string, { pending?: boolean; error?: string }>>({});

  async function run(key: string, profile: FounderProfile, seed?: { set: IdeaSet; idea: StartupDirection }) {
    const expectView = viewRef.current;
    const snap: FounderProfile = { ...profile };
    setState((s) => ({ ...s, [key]: { pending: true } }));
    try {
      const opt = (v: string) => (v.trim() ? v.trim().slice(0, FOUNDER_MAX) : undefined);
      const res = await fn.current({
        data: {
          skills: opt(snap.skills),
          interests: opt(snap.interests),
          experience: opt(snap.experience),
          problems: opt(snap.problems),
          seedDirection: seed ? clip(JSON.stringify(seed.idea), 6000) : undefined,
        },
      });
      const ideas = res?.ideas ?? [];
      if (ideas.length !== 5) throw new Error(`Expected 5 directions but received ${ideas.length}. Try again.`);
      addIdeaSet({ id: uid(), createdAt: Date.now(), profile: snap, parentId: seed?.set.id, seed: seed?.idea, ideas }, expectView);
      setState((s) => ({ ...s, [key]: {} }));
    } catch (e) {
      setState((s) => ({ ...s, [key]: { error: errorMessage(e) } }));
    }
  }
  const anyPending = Object.values(state).some((x) => x.pending);
  return { run, get: (k: string) => state[k] ?? {}, anyPending };
}

/** Interview-ideas generator. Results always go to the project captured at submit. */
export function useInterviewIdeasGen() {
  const gen = useGenerateInterviewIdeas();
  const fn = useRef(gen.mutateAsync);
  fn.current = gen.mutateAsync;
  const { updateProject } = useStore();
  const [state, setState] = useState<Record<string, { pending?: boolean; error?: string }>>({});

  async function run(p: Project) {
    const id = p.id;
    const notes = p.notes;
    if (!notes.trim() || notes.length > LIMITS.notes) return;
    setState((s) => ({ ...s, [id]: { pending: true } }));
    try {
      const res = await fn.current({
        data: { notes, industry: p.industry ? clip(p.industry, 300) : undefined, sample: p.sample ? true : undefined },
      });
      if (!res || !Array.isArray(res.ideas)) throw new Error('The AI returned an unreadable response.');
      updateProject(id, () => ({
        interviewIdeas: {
          ideas: res.ideas,
          gaps: res.gaps ?? [],
          followUpQuestions: res.followUpQuestions ?? [],
          sourceNotes: notes,
          generatedAt: Date.now(),
          sample: !!p.sample,
        },
      }));
      setState((s) => ({ ...s, [id]: {} }));
    } catch (e) {
      setState((s) => ({ ...s, [id]: { error: errorMessage(e) } }));
    }
  }
  return { run, get: (p: Project | null) => (p ? state[p.id] ?? {} : {}) };
}
