// Hall of Fame: each year's class as plaques, who's on the ballot, active players on a
// Hall of Fame track, and exactly how the score works.
import { useState } from 'react';
import type { VM } from '../vm';
import { CLASS_MAX, FIRST_BALLOT, HOF_BAR, hofScore, MIN_SEASONS, WAIT } from '../../engine/hof';
import { Bar, Kicker, Link, muted, ruleH4, Seg } from '../kit';

export function HallOfFameScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open } = vm.ctx, P = gm.db.P;
  const [tab, setTab] = useState<'hall' | 'ballot' | 'track' | 'how'>('hall');
  const hof = (s.hof || []).slice().sort((a, b) => b.year - a.year || b.score - a.score);
  const years = [...new Set(hof.map(h => h.year))] as number[];
  const inHof = new Set(hof.map(h => h.pid));
  const retired = (Object.values(P) as any[]).filter(p => p.retired && !inHof.has(p.id));
  const ballot = retired.map(p => ({ p, ...hofScore(gm, s, p) })).filter(x => x.score >= HOF_BAR * 0.6).sort((a, b) => b.score - a.score).slice(0, 30);
  const active = [...Object.values(s.rosters).flat(), ...s.fa] as number[];
  const track = active.map(id => ({ p: P[id], ...hofScore(gm, s, P[id]) })).filter(x => x.score >= HOF_BAR * 0.45).sort((a, b) => b.score - a.score).slice(0, 25);
  const Plaque = ({ h }: { h: any }) => { const p = P[h.pid], lt = h.tids?.slice(-1)[0]; return (
    <section className="card" style={{ padding: '14px 16px', gap: '8px', borderColor: 'color-mix(in srgb, var(--gm-elite) 45%, var(--color-divider))' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="gm-face" style={{ width: 48, height: 72, flex: 'none', overflow: 'hidden', borderRadius: 'var(--radius-sm)' }}>{gm.faceEl(p.id, lt ?? -1)}</div>
        <div style={{ minWidth: 0 }}>
          <Kicker accent>{h.firstBallot ? 'First ballot · ' : ''}Class of {h.year}</Kicker>
          <Link onClick={() => open(p.id)} style={{ fontFamily: 'var(--font-heading)', fontSize: '21px', fontWeight: 600, color: 'var(--gm-elite)' }}>{p.name}</Link>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginTop: '2px' }}>{(h.tids || []).slice(-4).map(t => T[t] ? <span key={t}>{logo(t, 16)}</span> : null)}<span style={{ ...muted, fontSize: '12px', marginLeft: '4px' }}>{p.pos}{p.legacy ? ' · pre-league era' : ''}</span></div>
        </div>
      </div>
      <div style={{ fontSize: '12.5px' }}>{h.line}</div>
      {h.honors && <div style={{ fontSize: '12px', color: 'var(--gm-elite)' }}>{h.honors}</div>}
      <div style={{ fontSize: '11.5px', ...muted }}>Hall score {h.score}</div>
    </section>
  ); };
  const Row = ({ x, i }: { x: any; i: number }) => (
    <div style={{ display: 'grid', gridTemplateColumns: '24px minmax(0,1.3fr) minmax(0,2fr) 120px', gap: '10px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-divider)', fontSize: '12.5px' }}>
      <span style={muted}>{i + 1}</span>
      <span><Link onClick={() => open(x.p.id)} style={{ fontWeight: 600 }}>{x.p.name}</Link> <span style={{ ...muted, fontSize: '11px' }}>{x.p.pos} · {x.p.retired ? 'retired ' + x.p.retired.season + (x.p.retired.season + WAIT > gm.Y ? ' · eligible ' + (x.p.retired.season + WAIT) : '') : 'age ' + x.p.age}</span></span>
      <span style={muted}>{x.parts.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([n, v]) => n + ' ' + v.toFixed(0)).join(' · ')}</span>
      <span><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}><span>{x.score.toFixed(0)}</span><span style={muted}>/ {HOF_BAR}</span></div><Bar value={x.score} max={HOF_BAR} color={x.score >= HOF_BAR ? 'var(--gm-elite)' : 'var(--color-accent)'} /></span>
    </div>
  );
  return (
    <>
      <div style={{ marginBottom: '16px' }}><Seg<'hall' | 'ballot' | 'track' | 'how'> value={tab} options={[['hall', 'Inductees'], ['ballot', 'On the ballot'], ['track', 'Active players on track'], ['how', 'How it works']]} onChange={setTab} /></div>
      {tab === 'hall' && (hof.length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>No one has been inducted yet. A class is voted in when each season’s playoffs end; players become eligible {WAIT} seasons after retiring.</p> : years.map(y => (
        <section key={y} style={{ marginBottom: '24px' }}>
          <h4 style={ruleH4}>Class of {y}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '16px' }}>{hof.filter(h => h.year === y).map(h => <Plaque key={h.pid} h={h} />)}</div>
        </section>
      )))}
      {tab === 'ballot' && (ballot.length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>No retired player is close to the bar yet.</p> : <><p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>Retired players within reach of the bar ({HOF_BAR}), best first. Those not yet eligible show when they will be.</p>{ballot.map((x, i) => <Row key={x.p.id} x={x} i={i} />)}</>)}
      {tab === 'track' && (track.length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>No active player is on a Hall of Fame track yet.</p> : <><p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>Active players already halfway or more to the bar. Their score only grows while they play.</p>{track.map((x, i) => <Row key={x.p.id} x={x} i={i} />)}</>)}
      {tab === 'how' && (
        <section style={{ maxWidth: '720px', fontSize: '13px' }}>
          <p>Players become eligible <b>{WAIT} seasons after they retire</b>. When each season’s playoffs end, every eligible player with a Hall score of <b>{HOF_BAR}</b> or more is inducted, best first, up to {CLASS_MAX} a year (the rest wait for next year). He must have played at least {MIN_SEASONS} seasons. A player inducted in his first eligible year with {FIRST_BALLOT}+ is a <b>first-ballot</b> Hall of Famer.</p>
          <h4 style={ruleH4}>The Hall score</h4>
          {[['Points', '2 per 1,000'], ['Rebounds', '1.2 per 1,000'], ['Assists', '1.6 per 1,000'], ['Steals and blocks', '1 per 250'], ['MVP', '20 each'], ['Finals MVP', '10 each'], ['Defensive Player of the Year', '8 each'], ['All-League team', '7 first, 4 second, 2.5 third'], ['All-Defensive team', '2.5 first, 1.2 second'], ['Championship', '3 each'], ['ROY / Sixth Man / Most Improved', '2 / 2 / 1'], ['Peak season PER above 18 (40+ games)', '0.6 per point, up to 10'], ['Longevity', '0.5 per season'], ['Pre-league All-Star selections', '5 each']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--color-divider)' }}><span>{k}</span><span style={muted}>{v}</span></div>
          ))}
          <p style={{ ...muted, fontSize: '12px' }}>A long, productive career gets a player most of the way; titles and top-level honors carry him in. Roughly: a 20,000-point star with a few All-League nods is a lock; a steady 10,000-point starter falls short.</p>
        </section>
      )}
    </>
  );
}
