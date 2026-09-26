// Hand-written sections of the player profile: form, morale, home/road splits and the
// five-zone shooting chart (Overview); bonus checklist and trade value (Contract);
// the Development and Comparison tabs; and the overseas arc (History).
import { useState, type ReactNode } from 'react';
import type { VM } from '../vm';
import { incentiveProgress } from '../../engine/frontOffice';
import { intelF, leagueStr } from '../../engine/overseas';
import { Bar, Kicker, Link, muted, pctS, ruleH4, td, th } from '../kit';

const LB: Record<string, string> = { hgt: 'Height', stre: 'Strength', spd: 'Speed', jmp: 'Jumping', endu: 'Endurance', ins: 'Inside', dnk: 'Dunks & layups', ft: 'Free throws', fg: 'Mid-range', tp: 'Three-pointers', oiq: 'Offensive IQ', diq: 'Defensive IQ', drb: 'Dribbling', pss: 'Passing', reb: 'Rebounding' };
// Attribute thresholds that unlock each on-court role (mirrors roleDefs in data/world).
const ROLE_REQ: [string, Record<string, number>, string?][] = [
  ['Primary creator', { drb: 62, pss: 60 }], ['Floor spacer', { tp: 60 }], ['3-and-D wing', { tp: 54, diq: 54 }, 'Guards and wings'], ['Point-of-attack defender', { diq: 58, spd: 60 }, 'Guards and wings'],
  ['Slasher', { 'spd+jmp+dnk': 60 }], ['Rim protector', { hgt: 62, diq: 52 }, 'Bigs'], ['Stretch big', { tp: 48 }, 'Bigs'], ['Rebounder', { reb: 62 }], ['Connector', { pss: 52, oiq: 55, diq: 50 }],
];
const val = (p, k) => (k.includes('+') ? k.split('+').reduce((a, x) => a + p.r[x], 0) / k.split('+').length : p.r[k]);
const good = 'var(--gm-good)', bad = 'var(--gm-bad)', gold = 'var(--gm-elite)';

function useP(vm: VM) { const { gm, s } = vm.ctx; const p = gm.db.P[s.pid]; let tid = -1; Object.keys(s.rosters).forEach(k => { if (s.rosters[k].includes(s.pid)) tid = +k; }); return { p, tid }; }
const Row = ({ k, v, c }: { k: ReactNode; v: ReactNode; c?: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr)', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--color-divider)' }}><span style={muted}>{k}</span><span style={{ color: c }}>{v}</span></div>
);

// Five display zones from the engine's four shot tiers: the rim tier splits into the
// restricted area and the rest of the paint by typical NBA shares.
export function fiveZones(t: any) {
  const ra = Math.round((t.ra || 0) * 0.74), rm = Math.min(ra, Math.round((t.rm || 0) * 0.84));
  return [['Restricted area', rm, ra], ['In the paint (non-RA)', (t.rm || 0) - rm, (t.ra || 0) - ra], ['Mid-range', t.mm || 0, t.ma || 0], ['Corner 3', t.cm || 0, t.ca || 0], ['Above the break 3', t.bm || 0, t.ba || 0]] as [string, number, number][];
}
const LEAGUE_ZONE = [0.696, 0.44, 0.415, 0.388, 0.352];

export function OverviewExtras({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx, { p, tid } = useP(vm);
  if (!p) return null;
  const t = gm.seasonTotals(p, gm.Y), rows = (p.stats || []).filter(r => r.season === gm.Y && !r.po);
  const H: any = {}, A: any = {}; rows.forEach(r => { Object.entries(r.h || {}).forEach(([k, v]) => (H[k] = (H[k] || 0) + (v as number))); Object.entries(r.a || {}).forEach(([k, v]) => (A[k] = (A[k] || 0) + (v as number))); });
  const pg = (o, k) => (o.gp ? (k === 'reb' ? (o.orb + o.drb) / o.gp : o[k] / o.gp).toFixed(1) : '—');
  const mood = tid >= 0 && gm.isUser(s, tid) ? gm.moodOf(p, s.rosters[tid].indexOf(p.id), s, tid) : null;
  const l5 = p.last5 || [], avgG = l5.length ? l5.reduce((a, x) => a + x.gmsc, 0) / l5.length : 0, seasonG = t && t.gp ? (t.pts + 0.4 * t.fgm - 0.7 * t.fga - 0.4 * (t.fta - t.ftm) + 0.7 * t.orb + 0.3 * t.drb + t.stl + 0.7 * t.ast + 0.7 * t.blk - 0.4 * (t.pf || 0) - t.tov) / t.gp : 0;
  const form = !l5.length ? 'No games yet' : avgG >= seasonG + 3 ? 'Hot' : avgG <= seasonG - 3 ? 'Cold' : 'Steady';
  const zones = t ? fiveZones(t) : [];
  const role = p.pers.crowd || (t && gm.usgOf(t) < 20) ? 'Role player: expect a road drop-off' : 'Star-level usage: venue barely matters';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '28px', marginTop: '26px' }}>
      <section>
        <h4 style={ruleH4}>Morale & form</h4>
        {mood ? <Row k="Morale" v={mood.hap + ' · ' + mood.hapLabel} c={mood.hapColor} /> : <Row k="Mood" v={p.mood || 'Neutral'} />}
        <Row k="Form (last 5)" v={form + (l5.length ? ' · Game Score ' + avgG.toFixed(1) + ' vs ' + seasonG.toFixed(1) + ' season' : '')} c={form === 'Hot' ? good : form === 'Cold' ? bad : undefined} />
        <div style={{ display: 'flex', gap: '4px', marginTop: '6px', alignItems: 'flex-end', height: '42px' }}>
          {l5.slice().reverse().map((g, i) => <div key={i} title={g.pts + ' pts · ' + g.reb + ' reb · ' + g.ast + ' ast · ' + g.min + ' min' + (g.home ? ' (home)' : ' (road)')} style={{ flex: 1, height: Math.max(3, Math.min(42, g.gmsc * 1.6 + 6)) + 'px', background: g.gmsc >= seasonG ? good : bad, opacity: 0.8 }} />)}
        </div>
        {p.adjust > 0 && <Row k="League adjustment" v={Math.ceil(p.adjust) + ' games left'} c={bad} />}
      </section>
      <section>
        <h4 style={ruleH4}>Home / road</h4>
        <table className="table" style={{ fontSize: '12.5px' }}>
          <thead><tr><th style={th()}></th><th style={th('right')}>GP</th><th style={th('right')}>PTS</th><th style={th('right')}>REB</th><th style={th('right')}>AST</th><th style={th('right')}>FG%</th><th style={th('right')}>3P%</th><th style={th('right')}>TOV</th></tr></thead>
          <tbody>{[['Home', H], ['Road', A]].map(([n, o]: any) => <tr key={n}><td style={td()}>{n}</td><td style={td('right')}>{o.gp || 0}</td><td style={td('right')}>{pg(o, 'pts')}</td><td style={td('right')}>{pg(o, 'reb')}</td><td style={td('right')}>{pg(o, 'ast')}</td><td style={td('right')}>{pctS(o.fgm, o.fga)}</td><td style={td('right')}>{pctS(o.tpm, o.tpa)}</td><td style={td('right')}>{pg(o, 'tov')}</td></tr>)}</tbody>
        </table>
        <p style={{ ...muted, fontSize: '12px', margin: '6px 0 0' }}>{role}{p.pers.crowd ? ' (crowd-reliant)' : ''}.</p>
      </section>
      <section>
        <h4 style={ruleH4}>Shooting by zone</h4>
        {!zones.length || !t.fga ? <p style={{ ...muted, fontStyle: 'italic' }}>No shots this season.</p> : zones.map(([n, m, a], i) => (
          <div key={n} style={{ padding: '3px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px' }}><span>{n}</span><span><b style={{ color: a >= 10 ? (m / a >= LEAGUE_ZONE[i] + 0.03 ? good : m / a <= LEAGUE_ZONE[i] - 0.05 ? bad : undefined) : undefined }}>{pctS(m, a)}</b> <span style={muted}>{m}/{a} · {Math.round((a / t.fga) * 100)}% of shots</span></span></div>
            <Bar value={a ? (m / a) * 100 : 0} max={80} color={i >= 3 ? gold : 'var(--color-accent)'} />
          </div>
        ))}
        {t && t.fga > 0 && <p style={{ ...muted, fontSize: '11.5px', margin: '6px 0 0' }}>League: rim 69.6% · corner 3 38.8% · all threes 36.0%. Avg shot distance {((((t.ra || 0) * 3 + (t.ma || 0) * 15 + (t.ca || 0) * 22.5 + (t.ba || 0) * 25.5)) / t.fga).toFixed(1)} ft (league 14.5).</p>}
      </section>
    </div>
  );
}

export function ContractExtras({ vm }: { vm: VM }) {
  const { gm, s, money } = vm.ctx, { p, tid } = useP(vm);
  if (!p || tid < 0) return null;
  const inc = p.inc || [], hit = gm.capHit(p);
  const tv = (st: string) => Math.round(gm.pVal(p, st));
  const idx = Math.max(0, Math.min(100, Math.round(100 * (1 - Math.exp(-Math.max(0, tv('middle')) / 45)))));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '36px', marginTop: '26px' }}>
      <section>
        <h4 style={ruleH4}>Bonus checklist</h4>
        <Row k="Base salary" v={money(p.amt)} />
        <Row k="Cap hit" v={money(hit) + (hit > p.amt ? ' (incl. likely bonuses)' : '')} />
        {inc.length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>No incentives in this contract. Add them when you sign or re-sign a player.</p> : inc.map((x, i) => { const pr = incentiveProgress(gm, s, p, tid, x), done = pr.frac >= 1; return (
          <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: done ? good : 'var(--color-neutral-600)' }}>{done ? '☑' : '☐'}</span>
              <span style={{ flex: 1 }}>{x.label}</span><span>{money(x.amt)}</span>
              <span style={{ fontSize: '11px', color: x.likely ? 'var(--color-accent-700)' : 'var(--color-neutral-600)', width: '56px', textAlign: 'right' }}>{x.likely ? 'Likely' : 'Unlikely'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11.5px', ...muted }}><span style={{ width: '110px' }}>{pr.now}</span><div style={{ flex: 1 }}><Bar value={Math.min(1, pr.frac) * 100} color={done ? good : 'var(--color-accent)'} /></div></div>
          </div>
        ); })}
        <p style={{ ...muted, fontSize: '11.5px' }}>Likely incentives (met last season) count against the cap; unlikely ones are paid as a bonus if earned and then become likely.</p>
      </section>
      <section>
        <h4 style={ruleH4}>Trade value</h4>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}><span style={{ fontFamily: 'var(--font-heading)', fontSize: '40px', color: idx >= 70 ? gold : undefined }}>{idx}</span><span style={muted}>of 100 · league-wide index</span></div>
        <Bar value={idx} color={idx >= 70 ? gold : 'var(--color-accent)'} height={5} />
        <Row k="To a contender" v={tv('contend') >= tv('rebuild') ? 'Values him more (proven production)' : 'Values him less'} />
        <Row k="To a rebuilder" v={tv('rebuild') > tv('contend') ? 'Values him more (youth, upside)' : 'Values him less'} />
        <Row k="Contract" v={p.amt > gm.fair(p.ovr) * 1.15 ? 'Overpaid: a negative in trades' : p.amt < gm.fair(p.ovr) * 0.8 ? 'Bargain: a plus in trades' : 'Fair value'} c={p.amt > gm.fair(p.ovr) * 1.15 ? bad : p.amt < gm.fair(p.ovr) * 0.8 ? good : undefined} />
      </section>
    </div>
  );
}

export function DevelopmentTab({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, { p, tid } = useP(vm);
  if (!p) return null;
  const mine = tid >= 0 && gm.isUser(s, tid);
  const scoutF = 1 - Math.min(0.6, ((s.budget?.Scouting ?? 4) - 4) / 20);
  const margin = mine ? 0 : Math.round(3 * gm.regFactor(p, s) * scoutF / intelF(s, p.id) + (tid < 0 && p.cls ? Math.max(0, p.cls - gm.Y) * 4 : 0));
  const roles = gm.rolesOf(p), feed = p.feed || [];
  const next = ROLE_REQ.filter(([n]) => !roles.includes(n)).map(([n, req, only]) => { const gaps = Object.entries(req).map(([k, v]) => [k, v - val(p, k)] as [string, number]).filter(([, g]) => g > 0); return { n, only, gaps, tot: gaps.reduce((a, [, g]) => a + g, 0) }; }).filter(x => x.tot <= 12).sort((a, b) => a.tot - b.tot).slice(0, 4);
  const conf = p.conf ?? 50;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '36px', alignItems: 'start' }}>
      <section>
        <h4 style={ruleH4}>Ratings & scouting confidence</h4>
        <Row k="Overall" v={mine ? p.ovr + ' (exact: your own player)' : (p.ovr - margin) + '–' + (p.ovr + margin) + ' · ±' + margin} />
        <Row k="Potential" v={mine ? p.pot : Math.max(p.ovr, p.pot - margin * 2) + '–' + (p.pot + margin * 2)} />
        <Row k="Confidence" v={mine ? (conf >= 70 ? 'Brimming' : conf >= 55 ? 'Assured' : conf >= 40 ? 'Steady' : conf >= 25 ? 'Shaken' : 'Fragile') : 'Hidden'} c={mine ? (conf >= 55 ? good : conf < 40 ? bad : undefined) : undefined} />
        {mine && <Row k="Training focus" v={(s.train?.[p.id] || 'Balanced') + (p.dev ? ' · in the dev league' : '')} />}
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Hidden decimals</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '2px 16px', fontSize: '12px' }}>
          {Object.keys(p.r).map(k => { const x = (p.rx || {})[k] || 0; return <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px solid var(--color-divider)' }}><span style={muted}>{LB[k]}</span><span>{mine ? (p.r[k] + x).toFixed(2) : p.r[k]}</span></div>; })}
        </div>
        {!mine && <p style={{ ...muted, fontSize: '11.5px' }}>Decimal progress is only visible for players you run.</p>}
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Traits</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>{roles.length ? roles.map(r => <span key={r} className="badge" style={{ padding: '2px 8px', border: '1px solid ' + gold, color: gold, borderRadius: 'var(--radius-sm)', fontSize: '12px' }}>{r}</span>) : <span style={muted}>No roles unlocked yet</span>}</div>
        {next.length > 0 && <div style={{ marginTop: '8px', fontSize: '12px' }}>{next.map(x => <div key={x.n} style={{ padding: '2px 0' }}><b>{x.n}</b>{x.only ? <span style={muted}> ({x.only})</span> : null}: needs {x.gaps.map(([k, g]) => '+' + Math.ceil(g) + ' ' + (k.includes('+') ? 'athleticism' : LB[k].toLowerCase())).join(', ')}</div>)}</div>}
      </section>
      <section>
        <h4 style={ruleH4}>Monthly growth feed</h4>
        {feed.length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>Growth is calculated at the start of each month in season.</p> : (
          <table className="table" style={{ fontSize: '12px' }}>
            <thead><tr><th style={th()}>Month</th><th style={th('right')}>Overall</th><th style={th()}>Biggest moves</th></tr></thead>
            <tbody>{feed.map((f, i) => <tr key={i}><td style={td()}>{f.m}{f.dev ? <span style={{ color: good }}> · dev</span> : null}</td><td style={td('right', { color: f.o >= 0 ? good : bad, fontWeight: 600 })}>{f.o >= 0 ? '+' : ''}{f.o.toFixed(2)}</td><td style={td()}>{Object.entries(f.r).map(([k, v]: any) => LB[k] + ' ' + (v >= 0 ? '+' : '') + v.toFixed(2)).join(' · ')}</td></tr>)}</tbody>
          </table>
        )}
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Injury history</h4>
        {(p.injHist || []).length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>No injuries on record.</p> : (p.injHist || []).slice().reverse().map((x, i) => <Row key={i} k={x.season} v={x.name + ' · ' + x.games + ' games' + (x.lost || '')} c={x.lost ? bad : undefined} />)}
        {p.age < 24 && (p.minorCount || 0) >= 2 && <p style={{ color: bad, fontSize: '12px' }}>{p.minorCount} minor injuries this season: his growth is being stunted{p.minorCount >= 3 ? ' and his ceiling may drop' : ''}.</p>}
      </section>
    </div>
  );
}

export function HistoryExtras({ vm }: { vm: VM }) {
  const { gm, money } = vm.ctx, { p } = useP(vm);
  if (!p) return null;
  const arc = p.overseasArc, a = p.abroad, L = p.legacy;
  if (L) return (
    <section style={{ marginTop: '22px' }}>
      <h4 style={ruleH4}>Career before the league’s records</h4>
      <Row k="Seasons" v={L.seasons + ' (retired ' + p.retired.season + ')'} />
      <Row k="Per game" v={L.pts + ' pts · ' + L.reb + ' reb · ' + L.ast + ' ast'} />
      {L.allStar > 0 && <Row k="All-Star" v={L.allStar + (L.allStar === 1 ? ' selection' : ' selections')} c={gold} />}
    </section>
  );
  if (!arc && !a && !(p.adjust > 0)) return null;
  return (
    <section style={{ marginTop: '22px' }}>
      <h4 style={ruleH4}>Overseas arc</h4>
      {arc?.from && <Row k="Left the league" v={arc.left + ' · from ' + arc.from + ' at ' + arc.ovr + ' overall'} />}
      {a && <Row k="Now playing" v={a.club + ' (' + a.lg + ', strength ×' + leagueStr(a.lg).toFixed(2) + ') · ' + a.pts + ' pts · ' + a.reb + ' reb · ' + a.ast + ' ast'} />}
      {a && <Row k="Contract abroad" v={a.clause + ' · ' + money(a.fee)} />}
      {arc?.back && <Row k="Returned" v={arc.back + ' from ' + arc.club + ' (' + arc.line + ')' + (arc.from ? ' · ' + (p.ovr - arc.ovr >= 0 ? '+' : '') + (p.ovr - arc.ovr) + ' overall since leaving' : '')} c={arc.from && p.ovr > arc.ovr ? good : undefined} />}
      <Row k="Adjustment status" v={p.adjust > 0 ? Math.ceil(p.adjust) + ' games of adjustment left (efficiency and decisions are down)' : arc?.back ? 'Fully adjusted' : 'Not applicable'} c={p.adjust > 0 ? bad : good} />
    </section>
  );
}

// ── Comparison ───────────────────────────────────────────────────────────────────
const AX: [string, string[]][] = [['Inside', ['ins', 'dnk']], ['Mid-range', ['fg']], ['Three', ['tp']], ['Playmaking', ['drb', 'pss']], ['IQ', ['oiq']], ['Defense', ['diq']], ['Rebounding', ['reb']], ['Athleticism', ['spd', 'jmp', 'stre']]];
function Radar({ a, b }: { a: any; b: any }) {
  const R = 110, c = 140, n = AX.length, pt = (v, i) => { const ang = -Math.PI / 2 + (i / n) * Math.PI * 2, r = (v / 100) * R; return [c + Math.cos(ang) * r, c + Math.sin(ang) * r]; };
  const poly = p => AX.map(([, ks], i) => pt(ks.reduce((x, k) => x + p.r[k], 0) / ks.length, i).join(',')).join(' ');
  return (
    <svg viewBox="0 0 280 280" width="100%" style={{ maxWidth: 320 }} role="img" aria-label="Radar chart">
      {[25, 50, 75, 100].map(v => <polygon key={v} points={AX.map((_, i) => pt(v, i).join(',')).join(' ')} fill="none" stroke="var(--color-divider)" />)}
      {AX.map(([n2], i) => { const [x, y] = pt(118, i); return <text key={n2} x={x} y={y} fontSize="9.5" fill="var(--color-neutral-700)" textAnchor="middle" dominantBaseline="middle">{n2}</text>; })}
      <polygon points={poly(b)} fill="color-mix(in srgb, var(--gm-bad) 25%, transparent)" stroke="var(--gm-bad)" />
      <polygon points={poly(a)} fill="color-mix(in srgb, var(--color-accent) 30%, transparent)" stroke="var(--color-accent)" />
    </svg>
  );
}
export function CompareTab({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx, { p } = useP(vm), P = gm.db.P;
  const [q, setQ] = useState('');
  if (!p) return null;
  const pool = (Object.values(P) as any[]).filter(x => x.id !== p.id);
  const other = P[s.cmpId] && s.cmpId !== p.id ? P[s.cmpId] : pool.filter(x => x.grp === p.grp).sort((x, y) => y.ovr - x.ovr)[0];
  if (!other) return null;
  const hits = q.trim().length >= 2 ? pool.filter(x => x.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const ta = gm.seasonTotals(p, gm.Y), tb = gm.seasonTotals(other, gm.Y);
  const per = (t, k) => (t && t.gp ? (k === 'reb' ? (t.orb + t.drb) / t.gp : t[k] / t.gp) : 0);
  const STATS: [string, (t: any) => number, number, (v: number) => string][] = [['Points', t => per(t, 'pts'), 35, v => v.toFixed(1)], ['Rebounds', t => per(t, 'reb'), 15, v => v.toFixed(1)], ['Assists', t => per(t, 'ast'), 12, v => v.toFixed(1)], ['TS%', t => (t ? gm.tsOf(t) * 100 : 0), 75, v => v.toFixed(1)], ['USG%', t => (t ? gm.usgOf(t) : 0), 40, v => v.toFixed(1)], ['PER', t => (t ? gm.perOf(t, gm.Y) : 0), 35, v => v.toFixed(1)]];
  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '14px', position: 'relative' }}>
        <Kicker>Compare with</Kicker>
        <Link onClick={() => open(other.id)} style={{ fontWeight: 600, color: 'var(--gm-bad)' }}>{other.name}</Link>
        <input className="input" placeholder="Search any player…" value={q} onChange={e => setQ(e.target.value)} style={{ marginLeft: 'auto', width: '220px' }} />
        {hits.length > 0 && <div className="card" style={{ position: 'absolute', right: 0, top: '38px', zIndex: 5, padding: '4px 0', minWidth: '220px' }}>{hits.map(h => <button key={h.id} onClick={() => { gm.setState({ cmpId: h.id }); setQ(''); }} style={{ all: 'unset', cursor: 'pointer', display: 'block', padding: '4px 12px' }}>{h.name} <span style={muted}>· {h.pos} · {h.ovr}</span></button>)}</div>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,0.9fr) minmax(0,1.1fr)', gap: '30px', alignItems: 'start' }}>
        <section style={{ display: 'grid', justifyItems: 'center' }}>
          <Radar a={p} b={other} />
          <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}><span style={{ color: 'var(--color-accent-700)' }}>■ {p.name} ({p.ovr})</span><span style={{ color: 'var(--gm-bad)' }}>■ {other.name} ({other.ovr})</span></div>
        </section>
        <section>
          <h4 style={ruleH4}>{gm.seasonLbl()} per game</h4>
          {STATS.map(([n, f, mx, fmt]) => { const va = f(ta), vb = f(tb); return (
            <div key={n} style={{ display: 'grid', gridTemplateColumns: '48px minmax(0,1fr) 80px minmax(0,1fr) 48px', gap: '8px', alignItems: 'center', padding: '4px 0', fontSize: '12.5px' }}>
              <span style={{ textAlign: 'right', fontWeight: va > vb ? 700 : 400, color: va > vb ? good : undefined }}>{fmt(va)}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ height: 6, width: Math.min(100, (va / mx) * 100) + '%', background: 'var(--color-accent)' }} /></div>
              <span style={{ textAlign: 'center', ...muted }}>{n}</span>
              <div><div style={{ height: 6, width: Math.min(100, (vb / mx) * 100) + '%', background: 'var(--gm-bad)' }} /></div>
              <span style={{ fontWeight: vb > va ? 700 : 400, color: vb > va ? good : undefined }}>{fmt(vb)}</span>
            </div>
          ); })}
          <h4 style={{ ...ruleH4, marginTop: '14px' }}>Attributes</h4>
          {Object.keys(p.r).map(k => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: '30px minmax(0,1fr) 110px minmax(0,1fr) 30px', gap: '8px', alignItems: 'center', fontSize: '12px', padding: '1px 0' }}>
              <span style={{ textAlign: 'right', color: p.r[k] >= 70 ? gold : undefined }}>{p.r[k]}</span>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}><div style={{ height: 4, width: p.r[k] + '%', background: 'var(--color-accent)' }} /></div>
              <span style={{ textAlign: 'center', ...muted }}>{LB[k]}</span>
              <div><div style={{ height: 4, width: other.r[k] + '%', background: 'var(--gm-bad)' }} /></div>
              <span style={{ color: other.r[k] >= 70 ? gold : undefined }}>{other.r[k]}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
