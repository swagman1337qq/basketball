// Mock drafts: who each media outlet has every team taking in the first round, with their
// reasoning, and (once the picks are in) whether they got it right.
import { useMemo, useState } from 'react';
import type { VM } from '../vm';
import { Link, muted } from '../kit';
import { mockDraft, PANEL } from '../../engine/media';

export function MockDrafts({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P;
  const [k, setK] = useState<string>('all');
  const mocks = useMemo(() => Object.fromEntries(PANEL.map(o => [o.k, mockDraft(gm, s, o.k)])), [gm, s]);
  const actual: Record<number, number> = {}; if (gm.Y === s.dClass) (s.picks || []).forEach((x: any) => x.pid && (actual[x.n] = x.pid));
  const drafted = Object.keys(actual).length > 0;
  const hits = (ok: string) => mocks[ok].filter(m => actual[m.n] === m.pid).length;
  const last = (pid: number) => { const n = String(P[pid]?.name || '').split(' '); return n.length > 1 ? n.slice(1).join(' ') : n[0]; };
  const first = mocks[PANEL[0].k] || [];
  const phase = s.phase === 'draft' ? 'Final mocks, published on draft day.' : 'Mocks update as the standings and the lottery set the order.';
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
        {[['all', 'All outlets'] as [string, string], ...PANEL.map(o => [o.k, o.name] as [string, string])].map(([x, n]) => <button key={x} className={'btn ' + (k === x ? 'btn-primary' : 'btn-ghost')} onClick={() => setK(x)} style={{ fontSize: '12px', padding: '3px 10px' }}>{n}</button>)}
      </div>
      <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 8px' }}>{k === 'all' ? phase + ' Each outlet has its own scouting and biases; click a name for his profile.' : PANEL.find(o => o.k === k)!.draftAnalyst + ', ' + PANEL.find(o => o.k === k)!.name + ' · ' + PANEL.find(o => o.k === k)!.style}{drafted ? ' Green: called it.' : ''}</p>
      {k === 'all' ? (
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '12.5px' }}>
            <thead><tr><th style={{ padding: '5px 6px' }}>#</th><th style={{ padding: '5px 6px' }}>Team</th>{PANEL.map(o => <th key={o.k} style={{ padding: '5px 6px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: o.color, marginRight: 5 }} />{o.name}{drafted ? ' (' + hits(o.k) + ')' : ''}</th>)}{drafted && <th style={{ padding: '5px 6px' }}>Actual</th>}</tr></thead>
            <tbody>{first.map((m, i) => (
              <tr key={m.n}>
                <td style={{ padding: '4px 6px', ...muted }}>{m.n}</td>
                <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>{logo(m.owner, 16)}<Link onClick={() => openTeam(m.owner)}>{T[m.owner].abbr}</Link></span></td>
                {PANEL.map(o => { const x = mocks[o.k][i]; if (!x) return <td key={o.k} />; const hit = actual[x.n] === x.pid; return <td key={o.k} title={P[x.pid]?.name + ' · ' + x.why} style={{ padding: '4px 6px', whiteSpace: 'nowrap', background: hit ? 'color-mix(in srgb, var(--gm-good) 18%, transparent)' : undefined }}><Link onClick={() => open(x.pid)}>{last(x.pid)}</Link></td>; })}
                {drafted && <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', fontWeight: 600 }}>{actual[m.n] ? <Link onClick={() => open(actual[m.n])}>{last(actual[m.n])}</Link> : ''}</td>}
              </tr>))}</tbody>
          </table>
        </div>
      ) : (
        <table className="table" style={{ fontSize: '13px' }}>
          <thead><tr><th style={{ padding: '5px 8px' }}>#</th><th style={{ padding: '5px 8px' }}>Team</th><th style={{ padding: '5px 8px' }}>Pick</th><th style={{ padding: '5px 8px' }}>Why</th>{drafted && <th style={{ padding: '5px 8px' }}>Actual</th>}</tr></thead>
          <tbody>{mocks[k].map(m => { const p = P[m.pid], hit = actual[m.n] === m.pid; return (
            <tr key={m.n} style={{ background: hit ? 'color-mix(in srgb, var(--gm-good) 14%, transparent)' : undefined }}>
              <td style={{ padding: '5px 8px', ...muted }}>{m.n}</td>
              <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>{logo(m.owner, 18)}<Link onClick={() => openTeam(m.owner)}>{T[m.owner].region} {T[m.owner].name}</Link>{m.owner !== m.orig && <span style={{ ...muted, fontSize: '11px' }}>via {T[m.orig].abbr}</span>}</span></td>
              <td style={{ padding: '5px 8px' }}><Link onClick={() => open(m.pid)}>{p.name}</Link> <span style={{ ...muted, fontSize: '11.5px' }}>{p.pos} · {p.age} · {p.from?.team}</span></td>
              <td style={{ padding: '5px 8px', fontSize: '12.5px', fontStyle: 'italic' }}>{m.why}</td>
              {drafted && <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{actual[m.n] ? <>{hit ? '✓ ' : ''}<Link onClick={() => open(actual[m.n])}>{P[actual[m.n]].name}</Link></> : ''}</td>}
            </tr>); })}</tbody>
        </table>
      )}
    </div>
  );
}
