import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

function inline(text: string, keyBase = 'i'): ReactNode[] {
  const re = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*\s][^*]*\*|_[^_\s][^_]*_|\[[^\]]+\]\([^)\s]+\))/g;
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${keyBase}-${i++}`;
    if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('**') || t.startsWith('__')) out.push(<strong key={k}>{inline(t.slice(2, -2), k)}</strong>);
    else if (t.startsWith('[')) {
      const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t);
      const href = mm?.[2] ?? '#';
      const safe = /^https?:\/\//i.test(href) || href.startsWith('mailto:');
      out.push(
        safe ? (
          <a key={k} href={href} target="_blank" rel="noreferrer noopener">{mm?.[1]}</a>
        ) : (
          <span key={k}>{mm?.[1]}</span>
        ),
      );
    } else out.push(<em key={k}>{inline(t.slice(1, -1), k)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

type Item = { text: string; children: { ordered: boolean; items: string[] } | null };

function cells(line: string) {
  return line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
}

export function Markdown({ content, compact, className }: { content: string; compact?: boolean; className?: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^```/.test(line.trim())) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i].trim())) buf.push(lines[i++]);
      i++;
      blocks.push(<pre key={key++} className="my-3 overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs whitespace-pre-wrap">{buf.join('\n')}</pre>);
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = Math.min(h[1].length, 4);
      const Tag = (`h${lvl}`) as 'h1' | 'h2' | 'h3' | 'h4';
      blocks.push(<Tag key={key++}>{inline(h[2].replace(/#+\s*$/, ''))}</Tag>);
      i++;
      continue;
    }
    if (/^\s*(-\s*){3,}$|^\s*(\*\s*){3,}$|^\s*(_\s*){3,}$/.test(line)) { blocks.push(<hr key={key++} />); i++; continue; }
    if (/^\s*>/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) buf.push(lines[i++].replace(/^\s*>\s?/, ''));
      blocks.push(<blockquote key={key++}><Markdown content={buf.join('\n')} compact className="!text-[inherit]" /></blockquote>);
      continue;
    }
    if (line.trim().startsWith('|') && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
      const head = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(cells(lines[i++]));
      blocks.push(
        <div key={key++} className="overflow-x-auto">
          <table>
            <thead><tr>{head.map((c, j) => <th key={j}>{inline(c)}</th>)}</tr></thead>
            <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    }
    const li = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(line);
    if (li) {
      const ordered = /\d/.test(li[2]);
      const items: Item[] = [];
      while (i < lines.length) {
        const m = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(lines[i]);
        if (m) {
          if (m[1].length >= 2 && items.length) {
            const parent = items[items.length - 1];
            if (!parent.children) parent.children = { ordered: /\d/.test(m[2]), items: [] };
            parent.children.items.push(m[3]);
          } else items.push({ text: m[3], children: null });
          i++;
        } else if (lines[i].trim() && /^\s{2,}/.test(lines[i]) && items.length) {
          items[items.length - 1].text += ' ' + lines[i].trim();
          i++;
        } else break;
      }
      const L = ordered ? 'ol' : 'ul';
      blocks.push(
        <L key={key++}>
          {items.map((it, j) => {
            const C = it.children?.ordered ? 'ol' : 'ul';
            return (
              <li key={j}>
                {inline(it.text)}
                {it.children && <C>{it.children.items.map((c, ci) => <li key={ci}>{inline(c)}</li>)}</C>}
              </li>
            );
          })}
        </L>,
      );
      continue;
    }
    const buf: string[] = [];
    while (
      i < lines.length && lines[i].trim() &&
      !/^(#{1,6})\s/.test(lines[i]) && !/^\s*>/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) && !/^```/.test(lines[i].trim())
    ) buf.push(lines[i++]);
    blocks.push(
      <p key={key++}>
        {buf.map((b, j) => <Fragment key={j}>{j > 0 && <br />}{inline(b, `p${j}`)}</Fragment>)}
      </p>,
    );
  }
  return <div className={cn('md', compact && 'md-compact', className)}>{blocks}</div>;
}
