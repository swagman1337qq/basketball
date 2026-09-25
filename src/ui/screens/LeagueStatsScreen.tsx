// League stats: every team's per-game and Four Factors numbers, the league average,
// and the 2026 baselines the engine is anchored to (the 50th-percentile means).
import { useState } from 'react';
import type { VM } from '../vm';
import { BASE } from '../../engine/sim';
import { Link, muted, Seg, td, th } from '../kit';

type Col = [string, (t: any, g: any) => number, number | null, number, boolean?];

export function LeagueStatsScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam } = vm.ctx;
  const [view, setView] = useState<'basic' | 'adv'>('basic');
  const [sort, setSort] = useState<number>(1);
  const pg = k => (t: any) => t[k] / t.gp;
  const poss = (t: any) => gm.possOf(t) / t.gp;
  const BASIC: Col[] = [
    ['Pace', t => poss(t) * 48 / (t.min ? t.min / t.gp / 5 : 48), BASE.pace, 1], ['PTS', pg('pts'), BASE.pts, 1], ['FG%', t => (100 * t.fgm) / t.fga, BASE.fg * 100, 1], ['3P%', t => (100 * t.tpm) / t.tpa, BASE.tp * 100, 1], ['3PA', pg('tpa'), BASE.tpa, 1], ['FT%', t => (100 * t.ftm) / t.fta, BASE.ft * 100, 1],
    ['TRB', t => (t.orb + t.drb) / t.gp, BASE.trb, 1], ['ORB', pg('orb'), BASE.orb, 1], ['DRB', pg('drb'), BASE.drb, 1], ['AST', pg('ast'), BASE.ast, 1], ['STL', pg('stl'), BASE.stl, 1], ['BLK', pg('blk'), BASE.blk, 1], ['TOV', pg('tov'), BASE.tov, 1, true],
  ];
  const ADV: Col[] = [
    ['ORtg', t => (100 * t.pts) / gm.possOf(t), BASE.ortg, 1], ['DRtg', t => (100 * t.oPts) / gm.possOf(t), BASE.ortg, 1, true], ['Net', t => (100 * (t.pts - t.oPts)) / gm.possOf(t), 0, 1],
    ['TS%', t => (100 * t.pts) / (2 * (t.fga + 0.44 * t.fta)), BASE.ts * 100, 1], ['eFG%', t => (100 * (t.fgm + 0.5 * t.tpm)) / t.fga, BASE.efg * 100, 1], ['TOV%', t => (100 * t.tov) / (t.fga + 0.44 * t.fta + t.tov), BASE.tovPct * 100, 1, true],
    ['ORB%', t => (100 * t.orb) / (t.orb + t.oDrb), BASE.orbPct * 100, 1], ['FT/FGA', t => t.ftm / t.fga, BASE.ftr, 3], ['Rim%', t => (100 * (t.rm || 0)) / (t.ra || 1), BASE.rimPct * 100, 1], ['C3%', t => (100 * (t.cm || 0)) / (t.ca || 1), BASE.c3Pct * 100, 1],
    ['Dist', t => ((t.ra || 0) * BASE.zone.rim.dist + (t.ma || 0) * BASE.zone.mid.dist + (t.ca || 0) * BASE.zone.c3.dist + (t.ba || 0) * (BASE.zone as any).atb.dist) / t.fga, BASE.dist, 1],
  ];
  const cols = view === 'basic' ? BASIC : ADV;
  const rows = T.filter(t => s.tstats?.[t.tid]?.gp).map(t => ({ t, st: s.tstats[t.tid] }));
  if (!rows.length) return <p style={{ ...muted, fontStyle: 'italic' }}>No games played yet this season. The 2026 baselines the engine targets: {BASE.pace} pace, {BASE.pts} points, {(BASE.fg * 100).toFixed(1)}% FG, {(BASE.tp * 100).toFixed(1)}% from three on {BASE.tpa} attempts.</p>;
  const lg: any = { gp: 0 }; rows.forEach(({ st }) => Object.keys(st).forEach(k => (lg[k] = (lg[k] || 0) + st[k])));
  const sc = cols[Math.min(sort, cols.length) - 1] || cols[0];
  rows.sort((a, b) => sc[1](b.st, null) - sc[1](a.st, null));
  const fmt = (v: number, d: number) => (isFinite(v) ? v.toFixed(d) : '—');
  const devC = (c: Col, v: number) => { if (c[2] == null || !c[2] || ['Pace', '3PA', 'Dist'].includes(c[0])) return undefined; const r = (v - c[2]) / c[2], good = c[4] ? r < 0 : r > 0; return Math.abs(r) < 0.03 ? undefined : good ? 'var(--gm-good)' : 'var(--gm-bad)'; };
  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
        <Seg<'basic' | 'adv'> value={view} options={[['basic', 'Per game'], ['adv', 'Four Factors & advanced']]} onChange={v => { setView(v); setSort(1); }} />
        <span style={{ ...muted, fontSize: '12px' }}>Click a column to sort. Green/red marks teams 3%+ better/worse than the baseline.</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: '12.5px' }}>
          <thead><tr><th style={th()}>Team</th>{cols.map((c, i) => <th key={c[0]} style={{ ...th('right'), cursor: 'pointer', color: sort === i + 1 ? 'var(--color-accent-700)' : undefined }} onClick={() => setSort(i + 1)}>{c[0]}</th>)}</tr></thead>
          <tbody>
            <tr style={{ background: 'color-mix(in srgb, var(--gm-elite) 10%, transparent)' }}><td style={td('left', { fontWeight: 600 })}>2026 baseline</td>{cols.map(c => <td key={c[0]} style={td('right', { fontWeight: 600 })}>{c[2] == null ? '' : fmt(c[2], c[3])}</td>)}</tr>
            <tr><td style={td('left', { fontWeight: 600 })}>League average</td>{cols.map(c => <td key={c[0]} style={td('right', { fontWeight: 600 })}>{fmt(c[1](lg, null), c[3])}</td>)}</tr>
            {rows.map(({ t, st }) => (
              <tr key={t.tid} style={{ background: gm.isUser(s, t.tid) ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : undefined }}>
                <td style={td()}><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>{logo(t.tid, 16)}<Link onClick={() => openTeam(t.tid)}>{t.abbr}</Link><span style={muted}>{t.w}–{t.l}</span></span></td>
                {cols.map(c => { const v = c[1](st, null); return <td key={c[0]} style={td('right', { color: devC(c, v) })}>{fmt(v, c[3])}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
