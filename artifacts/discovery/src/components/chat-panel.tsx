import { useEffect, useRef, useState } from 'react';
import { useChatDiscovery } from '@workspace/api-client-react';
import { ArrowUp, RotateCcw, Trash2, AlertTriangle, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Markdown } from '@/components/markdown';
import { useStore, type ChatMsg, type Step } from '@/lib/store';
import { buildChatContext, buildHistory, errorMessage, LIMITS, STEPS } from '@/lib/discovery';
import { cn } from '@/lib/utils';

const SUGGESTIONS: Record<number, string[]> = {
  1: ['How narrow should my industry be?', 'I have no idea yet. Is that okay?', 'What makes a good first market?'],
  2: ['Which pain point should I test first?', 'Explain the money flow simply', 'What would disprove these hypotheses?'],
  3: ['Which segment is easiest to reach?', 'How do I ask for an intro?', 'How many people should I talk to?'],
  4: ['Make my outreach warmer', 'How do I avoid leading questions?', 'What if they ask about my idea?'],
  5: ['How do I spot a false positive?', 'What should I do next?', 'How do I tag my notes?'],
};

export function ChatPanel({ step, className }: { step: Step; className?: string }) {
  const { active, draft, draftChat, setDraftChat, updateProject } = useStore();
  const chat = useChatDiscovery();
  const messages = active ? active.chat : draftChat;
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const projectId = active?.id ?? null;

  const setMessages = (fn: (c: ChatMsg[]) => ChatMsg[]) => {
    if (projectId) updateProject(projectId, (p) => ({ chat: fn(p.chat) }));
    else setDraftChat(fn);
  };

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, chat.isPending, error]);

  useEffect(() => { setError(null); }, [projectId]);

  async function request(message: string, prior: ChatMsg[]) {
    setError(null);
    const targetId = projectId;
    try {
      const res = await chat.mutateAsync({
        data: {
          message,
          context: buildChatContext({ project: active, draft, step }),
          history: buildHistory(prior),
        },
      });
      const reply: ChatMsg = { role: 'assistant', content: res.content, at: Date.now() };
      if (targetId) updateProject(targetId, (p) => ({ chat: [...p.chat, reply] }));
      else setDraftChat((c) => [...c, reply]);
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  function send(text?: string) {
    const msg = (text ?? input).trim().slice(0, LIMITS.message);
    if (!msg || chat.isPending) return;
    const prior = messages;
    setMessages((c) => [...c, { role: 'user', content: msg, at: Date.now() }]);
    setInput('');
    void request(msg, prior);
  }

  function retry() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUser) return;
    const idx = messages.lastIndexOf(lastUser);
    void request(lastUser.content, messages.slice(0, idx));
  }

  const lastIsUser = messages.length > 0 && messages[messages.length - 1].role === 'user';

  return (
    <div className={cn('flex h-full min-h-0 flex-col', className)} data-testid="panel-chat">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <div className="font-display text-[15px] font-semibold">Ask your guide</div>
          <div className="text-xs text-muted-foreground">
            {active ? `Knows your ${active.sample ? 'sample ' : ''}project` : 'Knows what you have typed so far'} · Step {step}
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground"
            onClick={() => { setMessages(() => []); setError(null); }}
            aria-label="Clear chat"
            data-testid="button-clear-chat"
          >
            <Trash2 />
          </Button>
        )}
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="rise rounded-xl border border-dashed bg-secondary/50 p-4">
            <MessageCircleQuestion className="mb-2 h-5 w-5 text-[hsl(var(--chart-2))]" />
            <p className="text-sm font-medium">Stuck, unsure, or second-guessing?</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask anything about {STEPS[step - 1].label.toLowerCase()}. I'll answer using what's on your screen.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('rise flex', m.role === 'user' ? 'justify-end' : 'justify-start')} data-testid={`chat-message-${i}`}>
            {m.role === 'user' ? (
              <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                {m.content}
              </div>
            ) : (
              <div className="max-w-[95%] rounded-2xl rounded-bl-md border bg-card px-3.5 py-2.5">
                <Markdown content={m.content} compact />
              </div>
            )}
          </div>
        ))}
        {chat.isPending && (
          <div className="flex items-center gap-1.5 px-1 text-muted-foreground" data-testid="status-chat-pending">
            <span className="dot h-1.5 w-1.5 rounded-full bg-current" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:.15s]" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:.3s]" />
            <span className="ml-1.5 text-xs">Thinking it through</span>
          </div>
        )}
        {error && (
          <div className="rise rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm" data-testid="status-chat-error">
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
            {lastIsUser && (
              <Button size="sm" variant="outline" className="mt-2" onClick={retry} data-testid="button-retry-chat">
                <RotateCcw /> Retry
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="border-t p-3">
        {messages.length < 2 && !chat.isPending && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {SUGGESTIONS[step].map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:-translate-y-px hover:border-primary/40 hover:text-foreground"
                data-testid={`button-suggestion-${s.slice(0, 12).replace(/\W+/g, '-')}`}
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="flex items-end gap-2 rounded-xl border bg-card p-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, LIMITS.message))}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Ask a question..."
            className="max-h-32 min-h-[36px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
            data-testid="input-chat"
          />
          <Button type="submit" size="icon" className="h-9 w-9 shrink-0 rounded-lg" disabled={!input.trim() || chat.isPending} aria-label="Send" data-testid="button-send-chat">
            <ArrowUp />
          </Button>
        </form>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">Chat history is saved on this browser.</p>
      </div>
    </div>
  );
}
