// What's new: the changelog (CHANGELOG.md at the repo root, bundled as text), newest first.
import type { ReactNode } from 'react';
import md from '../../../CHANGELOG.md?raw';
import { Kicker, muted } from '../kit';

// Just enough Markdown for the changelog: ## dates, ### sections, - bullets, **bold**.
const inline = (t: string): ReactNode[] => t.split(/(\*\*[^*]+\*\*)/).map((x, i) => (x.startsWith('**') ? <b key={i}>{x.slice(2, -2)}</b> : x));
const TONE: Record<string, string> = { Added: 'var(--gm-good)', Changed: '#4a9fd8', Fixed: 'var(--gm-elite)' };

export function ChangelogScreen() {
  const blocks: { date: string; secs: { name: string; items: string[]; subs: string[][] }[] }[] = [];
  let intro = '';
  md.split('\n').forEach(line => {
    if (line.startsWith('## ')) blocks.push({ date: line.slice(3).trim(), secs: [] });
    else if (line.startsWith('### ')) blocks[blocks.length - 1]?.secs.push({ name: line.slice(4).trim(), items: [], subs: [] });
    else if (line.startsWith('- ')) { const b = blocks[blocks.length - 1], sec = b?.secs[b.secs.length - 1]; if (sec) { sec.items.push(line.slice(2)); sec.subs.push([]); } }
    else if (/^\s+- /.test(line)) { const b = blocks[blocks.length - 1], sec = b?.secs[b.secs.length - 1]; if (sec?.subs.length) sec.subs[sec.subs.length - 1].push(line.trim().slice(2)); } // indented sub-bullet
    else if (!blocks.length && line.trim() && !line.startsWith('#')) intro = line.trim();
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900 }}>
      {intro && <p style={{ ...muted, margin: 0, fontSize: '13px' }}>{inline(intro.replace(" The game shows this page under **What's new**.", ''))}</p>}
      {blocks.map((b, i) => (
        <section key={i}>
          <h3 style={{ margin: '0 0 8px', fontSize: '19px', borderBottom: '1px solid var(--color-divider)', paddingBottom: 4 }}>{b.date}</h3>
          {b.secs.map((sec, j) => (
            <div key={j} style={{ marginBottom: 10 }}>
              <Kicker><span style={{ color: TONE[sec.name] }}>{sec.name}</span></Kicker>
              <ul style={{ margin: '4px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 5, fontSize: '13.5px', lineHeight: 1.5 }}>
                {sec.items.map((it, k) => <li key={k}>{inline(it)}{sec.subs[k]?.length > 0 && <ul style={{ margin: '3px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 2 }}>{sec.subs[k].map((x, m) => <li key={m}>{inline(x)}</li>)}</ul>}</li>)}
              </ul>
            </div>))}
        </section>))}
    </div>
  );
}
