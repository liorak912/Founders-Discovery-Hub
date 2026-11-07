import type { ChatMsg, Draft, Project, SectionKey, Step } from './store';

export const LIMITS = { context: 45000, chatContext: 60000, historyItems: 20, historyChars: 12000, notes: 40000, message: 4000 };

export const STEPS: { n: Step; label: string; short: string; blurb: string }[] = [
  { n: 1, label: 'Frame the market', short: 'Frame', blurb: 'Name the industry. Your idea is optional.' },
  { n: 2, label: 'Industry brief', short: 'Brief', blurb: 'How the market works and what might hurt.' },
  { n: 3, label: 'Who to talk to', short: 'People', blurb: 'Segments, roles, and where they gather.' },
  { n: 4, label: 'Interview kit', short: 'Kit', blurb: 'A non-leading script and your outreach note.' },
  { n: 5, label: 'Synthesize', short: 'Synthesize', blurb: 'Paste real notes. See what held up.' },
];

export const SECTION_FOR_STEP: Record<number, SectionKey | undefined> = { 2: 'brief', 3: 'people', 4: 'kit', 5: 'synthesis' };

export function clip(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 40)) + '\n\n[...truncated for length]';
}

const TITLES: Record<SectionKey, string> = {
  brief: 'INDUSTRY BRIEF',
  people: 'WHO TO TALK TO',
  kit: 'INTERVIEW KIT',
  synthesis: 'SYNTHESIS',
};

/** Builds bounded continuity context from prior sections for generation. */
export function buildGenContext(p: Project, section: SectionKey): string | undefined {
  const order: SectionKey[] = ['brief', 'people', 'kit'];
  const prior = section === 'brief' ? [] : section === 'people' ? ['brief'] : section === 'kit' ? ['brief', 'people'] : order;
  const parts: string[] = [];
  for (const k of prior as SectionKey[]) {
    let body = p.sections[k];
    if (!body) continue;
    if (k === 'kit' && p.outreach) body = splitKit(body).script + '\n\n## Outreach message (user-edited)\n' + p.outreach;
    parts.push(`### ${TITLES[k]}\n${body}`);
  }
  if (!parts.length) return undefined;
  const budget = Math.floor(LIMITS.context / parts.length) - 100;
  const out = parts.map((x) => clip(x, budget)).join('\n\n');
  return clip(out, LIMITS.context);
}

export function buildChatContext(opts: { project: Project | null; draft: Draft; step: Step }): string {
  const { project, draft, step } = opts;
  const head: string[] = [];
  const src = project ?? { industry: draft.industry, idea: draft.idea, customer: draft.customer };
  head.push(project ? `Project: ${project.name}${project.sample ? ' (built-in illustrative sample)' : ''}` : 'No project created yet; the founder is still filling in step 1.');
  head.push(`Current step: ${step} - ${STEPS[step - 1].label}`);
  head.push(`Industry: ${src.industry || '(not entered yet)'}`);
  if (src.idea) head.push(`Rough idea: ${src.idea}`);
  if (src.customer) head.push(`Possible customer: ${src.customer}`);
  const header = head.join('\n');
  if (!project) return clip(header, LIMITS.chatContext);
  const parts: string[] = [];
  (['brief', 'people', 'kit', 'synthesis'] as SectionKey[]).forEach((k) => {
    if (project.sections[k]) parts.push(`### ${TITLES[k]}\n${project.sections[k]}`);
  });
  if (project.outreach) parts.push(`### OUTREACH TEMPLATE (user-edited)\n${project.outreach}`);
  if (project.notes) parts.push(`### FOUNDER INTERVIEW NOTES\n${project.notes}`);
  const remaining = LIMITS.chatContext - header.length - 200;
  const per = parts.length ? Math.floor(remaining / parts.length) : remaining;
  return clip([header, ...parts.map((x) => clip(x, per))].join('\n\n'), LIMITS.chatContext);
}

export function buildHistory(chat: ChatMsg[]) {
  return chat.slice(-LIMITS.historyItems).map((m) => ({ role: m.role, content: clip(m.content, LIMITS.historyChars) }));
}

/** Splits kit markdown at the final "## Outreach message" heading. */
export function splitKit(md: string): { script: string; outreach: string } {
  const re = /^#{1,3}\s*Outreach message\s*:?\s*$/gim;
  let last: RegExpExecArray | null = null;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) last = m;
  if (!last) return { script: md.trim(), outreach: '' };
  return { script: md.slice(0, last.index).trim(), outreach: md.slice(last.index + last[0].length).trim().replace(/^```\w*\n?|\n?```$/g, '').trim() };
}

export function errorMessage(e: unknown): string {
  if (!e) return 'Something went wrong.';
  const anyE = e as { data?: { error?: string; message?: string }; message?: string; status?: number };
  const msg = anyE.data?.error || anyE.data?.message || anyE.message;
  if (anyE.status === 429) return 'The AI is rate-limited right now. Wait a moment and retry.';
  return msg ? String(msg).slice(0, 240) : 'The request failed. Check your connection and retry.';
}
