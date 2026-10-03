// Pick a player by name (accents optional): type two letters, then choose from the matches, each with
// his age and where he is now. Used by God Mode's family editor.
import { useState } from 'react';
import type { Game } from '../engine/Game';
import { nowLabel } from '../engine/godMove';

const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function PlayerPicker({ gm, onPick, exclude = [], placeholder = 'Type a name…', width = 230 }: { gm: Game; onPick: (pid: number) => void; exclude?: number[]; placeholder?: string; width?: number }) {
  const [q, setQ] = useState(''), s = gm.state, f = fold(q.trim());
  const hits = f.length < 2 ? [] : (Object.values(gm.db.P) as any[]).filter(p => !p.gone && p.r && !exclude.includes(p.id) && fold(p.name + ' ' + (p.native || '')).includes(f))
    .sort((a, b) => (a.retired ? 1 : 0) - (b.retired ? 1 : 0) || b.ovr - a.ovr).slice(0, 8);
  return (
    <span style={{ position: 'relative', display: 'inline-block', width }}>
      <input className="input" value={q} onChange={e => setQ(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setQ(''); if (e.key === 'Enter' && hits[0]) { onPick(hits[0].id); setQ(''); } }} placeholder={placeholder} style={{ width: '100%', fontSize: '12.5px' }} autoFocus />
      {hits.length > 0 && (
        <div style={{ position: 'absolute', zIndex: 40, top: 32, left: 0, minWidth: '100%', width: 300, background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', padding: '4px 0' }}>
          {hits.map(p => (
            <button key={p.id} className="hv3" onClick={() => { onPick(p.id); setQ(''); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', gap: 8, width: '100%', boxSizing: 'border-box', padding: '5px 10px', fontSize: '12.5px' }}>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ color: 'var(--color-neutral-700)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>{p.age} · {nowLabel(gm, s, p).label}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
