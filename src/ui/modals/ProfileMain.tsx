// Player profile: the header (identity, badges, season snapshot, ratings, actions) and
// the Overview tab, laid out as Profile & family · Ratings & badges · This season.
import type { VM } from '../vm';
import { fmtChange } from '../../engine/progress';
import { yosOf } from '../../engine/cba';
import { BADGE_FLAVOR, TIERS } from '../../engine/ratings';
import { knownBadges } from '../../engine/scoutReport';
import { BadgeChip } from '../BadgeChip';
import { HoverCard } from '../HoverCard';
import { CountryPicker, godBox, godText, Kicker, Link, muted, RATING_TIERS, ratingTier, ruleH4 } from '../kit';
import { useState } from 'react';
import { OverviewExtras } from './ProfileExtras';

const chip = { display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '2px 9px', borderRadius: '999px', border: '1px solid var(--color-divider)', fontSize: '12px', whiteSpace: 'nowrap' as const };

function useProfile(vm: VM) {
  const { gm, s } = vm.ctx, p = gm.db.P[s.pid] || {};
  let tid = -9; Object.keys(s.rosters).forEach(k => { if (s.rosters[k].includes(p.id)) tid = +k; });
  const draftYear = p.cls || p.draft;
  const openClass = () => draftYear && gm.setState({ listModal: { type: 'class', year: draftYear } });
  const draftLabel = p.cls && !p.dr ? 'Class of ' + p.cls : p.dr ? draftYear + ' draft · round ' + p.dr.rd + ', pick ' + p.dr.pick : draftYear ? draftYear + ' draft · undrafted' : '';
  return { gm, s, p, tid, draftYear, openClass, draftLabel };
}

function Ring({ v, label, ceiling }: { v: number; label: string; ceiling?: boolean }) {
  const r = 30, c = 2 * Math.PI * r, f = Math.max(0, Math.min(100, v)) / 100, t = ratingTier(v), tone = t.color;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-label={label + ' ' + v}>
        <circle cx="38" cy="38" r={r} fill="none" stroke="var(--color-neutral-300)" strokeWidth="5" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={tone || 'var(--color-accent)'} strokeWidth="5" strokeDasharray={c * f + ' ' + c} strokeLinecap="round" transform="rotate(-90 38 38)" />
        <text x="38" y="45" textAnchor="middle" fontFamily="var(--font-heading)" fontSize="24" fill={tone || 'var(--color-text)'}>{v}</text>
      </svg>
      <div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: '11px', color: tone, marginTop: 1 }} title={RATING_TIERS.map(([n, name], i) => (i === RATING_TIERS.length - 1 ? 'below 41' : n + '+') + ' ' + name).join(' · ')}>{t.name}{ceiling ? ' ceiling' : ''}</div>
    </div>
  );
}

// Rating tiers: a word and a color for every rating, so the numbers read at a glance.
const RTIERS: [string, string, number][] = [['Elite', 'var(--gm-elite)', 80], ['Great', 'var(--gm-good)', 70], ['Good', '#4a9fd8', 60], ['Average', 'var(--color-text)', 50], ['Below avg', '#d98a2b', 40], ['Poor', 'var(--gm-bad)', 0]];
const rtier = (v: number): [string, string] => { const t = RTIERS.find(x => v >= x[2]) || RTIERS[RTIERS.length - 1]; return [t[0], t[1]]; };

export function ProfileHeader({ vm }: { vm: VM }) {
  const { gm, s, p, tid, openClass, draftLabel } = useProfile(vm), pl: any = vm.pl;
  if (!p.id) return null;
  const t = gm.seasonTotals(p, gm.Y), gp = t?.gp || 0, f1 = (v: number) => v.toFixed(1);
  const kb = knownBadges(gm, s, p), badges = kb.list, T = s.teams;
  // His NBA season: years of service (including before this league began) plus this one once he has played.
  const yrs = yosOf(gm, p) + ((p.stats || []).some(r => !r.po && r.season === gm.Y) ? 1 : 0);
  const tc = tid >= 0 ? T[tid].colors?.[0] : undefined;
  const stack = { display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' } as const;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '112px minmax(0,1fr) auto', gap: '22px', alignItems: 'center', marginBottom: '14px' }}>
        <div className="gm-face" style={{ width: 112, height: 150, overflow: 'hidden', borderRadius: 'var(--radius-md)', boxShadow: tc ? 'inset 0 -4px 0 ' + tc : undefined, background: 'var(--color-neutral-100)' }}>{pl.face}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', ...muted }}>
            <img src={pl.flag} alt="" style={{ width: 18, height: 12, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />
            <Link onClick={() => pl.openRep(null)}>{pl.cname}</Link><span>·</span><span>{p.pos}</span><span>·</span>
            <Link onClick={() => pl.openT(null)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{pl.teamLogo}{pl.teamLabel}</Link>
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '42px', lineHeight: 1.04, letterSpacing: '-.01em', marginTop: '2px' }}>
            {p.num != null && tid >= 0 && <JerseyNum vm={vm} p={p} tid={tid} />}{p.name}{p.native ? <span style={{ fontSize: '24px', ...muted, marginLeft: '12px' }}>{p.native}</span> : null}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'flex-start', marginTop: '8px' }}>
            {/* Age over his measurements; draft slot over his season count. */}
            <span style={stack}>
              <span style={chip}>Age {p.age}</span>
              <span style={chip} title="Height · weight · wingspan">{p.hgt} · {p.wt} lb{p.wing ? ' · ' + Math.floor(p.wing / 12) + '′' + (p.wing % 12) + '″ wingspan' : ''}</span>
            </span>
            {(draftLabel || yrs > 0) && <span style={stack}>
              {draftLabel && <button onClick={openClass} className="hv4" style={{ ...chip, cursor: 'pointer', background: 'transparent', color: 'var(--color-accent-700)', borderColor: 'color-mix(in srgb, var(--color-accent) 45%, var(--color-divider))' }} title="See everyone in this draft class">{draftLabel} ›</button>}
              {yrs > 0 && <span style={chip}>{yrs === 1 ? 'Rookie season' : 'Season ' + yrs}</span>}
            </span>}
            {(p.family || []).slice(0, 3).map(x => { const q = gm.db.P[x.pid]; return q ? <button key={x.pid} onClick={() => vm.ctx.open(x.pid)} className="hv4" style={{ ...chip, cursor: 'pointer', background: 'transparent', color: 'var(--color-accent-700)' }}>{{ father: 'Son of', son: 'Father of', brother: 'Brother of' }[x.rel]} {q.name} ›</button> : null; })}
          </div>
          {badges.length > 0 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
              {badges.slice(0, 7).map(b => <BadgeChip key={b.key} b={b} />)}
              {badges.length > 7 && <span style={{ ...chip, ...muted }}>+{badges.length - 7}</span>}
              {kb.partial && <span style={{ ...chip, ...muted }} title="Your scouts haven’t seen enough of him to know all his badges">More unknown · scout him</span>}
            </div>
          )}
          {badges.length === 0 && kb.partial && <div style={{ marginTop: '8px', fontSize: '12px', ...muted }}>Badges unknown: your scouts haven’t seen enough of him.</div>}
          <div style={{ marginTop: '8px', fontSize: '13px' }}>{pl.contractLine}</div>
        </div>
        <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
          {gp > 0 && (
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', textAlign: 'center' }}>
              {[['PTS', t.pts / gp], ['REB', (t.orb + t.drb) / gp], ['AST', t.ast / gp], ['PER', gm.perOf(t, gm.Y)]].map(([k, v]: any) => (
                <div key={k}><div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', lineHeight: 1 }}>{f1(v)}</div><div style={{ ...muted, fontSize: '10px', letterSpacing: '.08em' }}>{k}</div></div>
              ))}
            </div>
          )}
          <Ring v={p.ovr} label="Overall" />
          <Ring v={p.pot} label="Potential" ceiling />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '130px' }}>
            {pl.isMine && pl.canExt && <button className="btn btn-primary" onClick={() => gm.setState({ ptab: 'contract' })} title="He's eligible for an extension now">Extend…</button>}{pl.isMine && <><button className="btn btn-secondary" onClick={pl.release}>Release</button><button className="btn btn-ghost" onClick={pl.toAbroad} style={{ fontSize: '12px' }}>Release to play overseas</button></>}
            {pl.isOther && <button className="btn btn-primary" onClick={pl.tradeFor}>Trade for</button>}
            {pl.isFA && <button className="btn btn-primary" onClick={pl.sign}>Sign · {pl.ask}</button>}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', margin: '0 0 14px' }}>
        <span style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', marginRight: '4px' }}>Shortlist</span>
        {(pl.lists || []).map((c: any, i: number) => <button key={i} onClick={c.toggle} style={{ all: 'unset', cursor: 'pointer', padding: '2px 10px', border: '1px solid ' + c.border, borderRadius: 'var(--radius-sm)', fontSize: '12px', color: c.color, background: c.bg }}>{c.mark}{c.name}</button>)}
        <button className="btn btn-ghost" onClick={vm.goShort} style={{ fontSize: '12px' }}>Manage categories</button>
      </div>
    </>
  );
}

export function ProfileOverview({ vm }: { vm: VM }) {
  const { gm, s, p, openClass, draftLabel } = useProfile(vm), pl: any = vm.pl, open = vm.ctx.open;
  if (!p.id) return null;
  const P = gm.db.P, kb = knownBadges(gm, s, p), badges = kb.list;
  const bio = (pl.bgRows || []).filter(r => !['Father', 'Son', 'Brother', 'Draft class'].includes(r.k));
  const Row = ({ k, children }: { k: string; children: any }) => <div style={{ display: 'grid', gridTemplateColumns: '96px minmax(0,1fr)', gap: '8px', padding: '5px 0', borderBottom: '1px solid var(--color-divider)', alignItems: 'center' }}><span style={muted}>{k}</span><span style={{ minWidth: 0 }}>{children}</span></div>;
  return (
    <>
      {pl.isPro && pl.sr && (
        <section className="card" style={{ padding: '14px 16px', marginBottom: '22px', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
            <Kicker accent>Scouting report · margin ±{pl.sr.margin}</Kicker>
            <span style={{ ...muted, fontSize: '12px', display: 'inline-flex', gap: '8px', alignItems: 'center' }}>{pl.sr.scout} · intel {pl.sr.intel}/12<button className="btn btn-ghost" onClick={pl.sr.toggleFocus} style={{ fontSize: '11.5px', padding: '2px 8px' }}>{pl.sr.focused ? 'Focused ✓' : 'Focus scouting'}</button></span>
          </div>
          <p style={{ margin: 0 }}>{pl.sr.summary}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '16px', fontSize: '13px' }}>
            <div><div style={{ ...muted, fontSize: '11px' }}>Strengths</div>{pl.sr.str}</div>
            <div><div style={{ ...muted, fontSize: '11px' }}>Weaknesses</div>{pl.sr.weak}</div>
            <div><div style={{ ...muted, fontSize: '11px' }}>Plays like</div><Link onClick={() => pl.sr.openComp(null)} style={{ color: 'var(--color-accent-700)' }}>{pl.sr.comp}</Link></div>
          </div>
          <div style={{ ...muted, fontSize: '12px' }}>Intangibles: {pl.sr.intang}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => vm.goTab('scout')} style={{ fontSize: '13px' }}>Full scouting report →</button>
            {pl.sr.canPromise && <button className="btn btn-primary" onClick={pl.sr.promise} style={{ fontSize: '13px' }}>Promise to draft him at #{pl.sr.pickN}</button>}
          </div>
          {pl.sr.promised && <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}><span style={{ color: 'var(--color-accent-800)' }}>You promised him the No. {pl.sr.pickN} pick.</span><button className="btn btn-ghost" onClick={pl.sr.unpromise} style={{ fontSize: '12px' }}>Withdraw</button></div>}
        </section>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.15fr) minmax(0,1.1fr)', gap: '30px', alignItems: 'start' }}>
        <section>
          <h4 style={ruleH4}>Profile</h4>
          {bio.map((r, i) => (
            <Row key={i} k={r.k}>
              <span style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>{r.hasFlag && <img src={r.flag} alt="" style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />}{r.open ? <button className="hv4" onClick={r.open} style={{ all: 'unset', cursor: 'pointer' }}>{r.v}</button> : <span>{r.v}</span>}</span>
            </Row>
          ))}
          {draftLabel && <Row k="Draft"><Link onClick={openClass} style={{ color: 'var(--color-accent-700)' }}>{draftLabel} ›</Link></Row>}
          <Row k="Eligible for"><EligEditor vm={vm} p={p} /></Row>
          {(p.family || []).length > 0 && (
            <>
              <h4 style={{ ...ruleH4, marginTop: '18px' }}>Family</h4>
              {p.family.filter(x => P[x.pid]).map(x => { const q = P[x.pid]; return (
                <div key={x.pid} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
                  <div className="gm-face" style={{ width: 30, height: 44, overflow: 'hidden', flex: 'none' }}>{gm.faceEl(q.id, -1)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...muted, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.08em' }}>{{ father: 'Father', son: 'Son', brother: 'Brother' }[x.rel]}</div>
                    <Link onClick={() => open(q.id)} style={{ fontWeight: 600, color: 'var(--color-accent-700)' }}>{q.name}</Link>
                    <span style={{ ...muted, fontSize: '12px' }}> · {q.retired ? 'retired' + ((vm.ctx.s.hof || []).some(h => h.pid === q.id) ? ', Hall of Fame' : '') : q.pos + ' · ' + q.ovr + ' ovr'}</span>
                  </div>
                </div>
              ); })}
            </>
          )}
          <h4 style={{ ...ruleH4, marginTop: '18px' }}>Personality</h4>
          <Row k="Motivated by"><b>{pl.mot}</b></Row>
          <p style={{ margin: '6px 0', ...muted, fontSize: '12px' }}>{pl.motDesc}</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{(pl.traits || []).map((t: any) => (
            <HoverCard key={t.k} width={240} anchor={<button className="tag" onClick={t.open || undefined} style={{ border: 'none', cursor: t.open ? 'pointer' : 'help', background: 'var(--color-neutral-200)', color: 'var(--color-neutral-800)', font: 'inherit', fontSize: '12px' }}>{t.label}</button>}>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>{t.label}</div><div style={{ fontSize: '12.5px' }}>{t.desc}</div>{t.open && <div style={{ ...muted, fontSize: '11.5px', marginTop: 4 }}>Click to see every player with this trait.</div>}
            </HoverCard>))}</div>
          {pl.mal != null && <div style={{ ...muted, fontSize: '11.5px', marginTop: 4 }} title="Hidden: how open he is to changing his personality (mentoring, locker room). Only God Mode shows it.">Malleability {pl.mal}/100 · {pl.mal >= 70 ? 'impressionable' : pl.mal >= 40 ? 'open to change' : pl.mal >= 20 ? 'set in his ways' : 'fiercely independent'}</div>}
          <h4 style={{ ...ruleH4, marginTop: '18px', display: 'flex', justifyContent: 'space-between' }}><span>Happiness</span><span style={{ color: pl.hapColor, fontSize: '15px' }}>{pl.hapLabel}</span></h4>
          {pl.hasMood ? (
            <>
              <div style={{ height: 4, background: 'var(--color-neutral-300)', margin: '6px 0 8px' }}><div style={{ height: 4, width: pl.hapW, background: pl.hapColor }} /></div>
              {(pl.factors || []).map((f: any, i: number) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--color-divider)', fontSize: '12.5px' }}><span>{f.n}</span><span style={{ color: f.color, fontWeight: 600 }}>{f.v}</span></div>)}
            </>
          ) : <p style={{ ...muted, fontSize: '12px' }}>{pl.fitNote}</p>}
        </section>
        <section>
          <h4 style={ruleH4}>Ratings</h4>
          {pl.progLabel && <div style={{ ...muted, fontSize: '12px', margin: '0 0 4px' }}>▲▼ change since {pl.progLabel}: overall <b style={{ color: pl.progOvr > 0 ? 'var(--gm-good)' : pl.progOvr < 0 ? 'var(--gm-bad)' : undefined }}>{fmtChange(pl.progOvr)}</b>, potential <b style={{ color: pl.progPot > 0 ? 'var(--gm-good)' : pl.progPot < 0 ? 'var(--gm-bad)' : undefined }}>{fmtChange(pl.progPot, 0)}</b>. Year by year on the Development tab.</div>}
          {(pl.groups || []).map((g: any, gi: number) => (
            <div key={gi} style={{ marginBottom: '12px' }}>
              <div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', margin: '6px 0 2px' }}>{g.label}</div>
              {(g.items || []).map((r: any, i: number) => { const t = rtier(r.v); return (
                <div key={i} title={r.hint || r.name + ': ' + r.v + ' (' + t[0] + ')'} style={{ display: 'grid', gridTemplateColumns: '118px minmax(0,1fr) 80px 44px 72px', gap: '10px', alignItems: 'center', padding: '3px 0', fontSize: '13.5px', borderBottom: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)' }}>
                  <span>{r.name}</span>
                  <div style={{ position: 'relative', height: 9, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)', borderRadius: 5 }}>
                    <div style={{ height: 9, width: r.w, background: t[1], borderRadius: 5 }} />
                    <div title="League average (50)" style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'color-mix(in srgb, var(--color-text) 45%, transparent)' }} />
                  </div>
                  <span style={{ textAlign: 'right', color: t[1], fontWeight: 700, fontSize: r.text ? '13.5px' : '16px', whiteSpace: 'nowrap' }}>{r.text || r.v}</span>
                  <span title={r.d ? (r.d > 0 ? 'Up ' : 'Down ') + Math.abs(r.d).toFixed(1) + ' since ' + pl.progLabel : ''} style={{ fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', color: r.d > 0 ? 'var(--gm-good)' : r.d < 0 ? 'var(--gm-bad)' : 'var(--color-neutral-600)' }}>{r.d == null || Math.abs(r.d) < 0.05 ? '' : fmtChange(r.d)}</span>
                  <span style={{ fontSize: '11.5px', color: t[1], whiteSpace: 'nowrap' }}>{r.sub || t[0]}</span>
                </div>
              ); })}
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '11.5px', margin: '-4px 0 8px' }}>{RTIERS.map(([n, c, lo]) => <span key={n} style={{ color: c }}>■ {n} {lo}+</span>)}<span style={muted}>· the line marks the league average</span></div>
          <h4 style={{ ...ruleH4, marginTop: '14px' }}>Badges</h4>
          {badges.length === 0 ? <p style={{ ...muted, fontSize: '12px', fontStyle: 'italic' }}>{kb.partial ? 'Unknown: your scouts haven’t seen enough of him to tell. Put him on the scouting list or have a scout follow him.' : 'No badges yet. They’re earned by reaching rating thresholds.'}</p> : badges.map(b => (
            <div key={b.key} style={{ display: 'grid', gridTemplateColumns: '18px minmax(0,1fr) auto', gap: '8px', alignItems: 'baseline', padding: '4px 0', borderBottom: '1px solid var(--color-divider)' }}>
              <span style={{ color: b.color }}>◆</span>
              <span><b style={{ color: b.color }}>{b.name}</b><span style={{ ...muted, fontSize: '11.5px', display: 'block' }}>{b.desc}. <i>{BADGE_FLAVOR[b.key]}</i></span></span>
              <span style={{ fontSize: '11px', color: b.color, whiteSpace: 'nowrap' }}>{b.tierName}</span>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px', fontSize: '11px' }}>{TIERS.map(([n, c]) => <span key={n} style={{ color: c }}>◆ {n}</span>)}</div>
        </section>
        <section><OverviewExtras vm={vm} stack /></section>
      </div>
    </>
  );
}

// National-team eligibility: who he can play for and which he represents. In God Mode,
// add any country (type to search) with a reason, remove one, or switch who he represents.
const WHY = ['citizen by birth', 'born there', 'through parents', 'through grandparents', 'naturalized', 'set in God Mode'];
function EligEditor({ vm, p }: { vm: VM; p: any }) {
  const { gm, s } = vm.ctx, C = gm.db.C, god = !!s.god, [why, setWhy] = useState('naturalized');
  const bump = () => gm.setState(st => ({ gv: (st.gv || 0) + 1 }));
  const elig: any[] = p.elig || [];
  const remove = (c: string) => { if (elig.length <= 1) return; p.elig = elig.filter(e => e.c !== c); if (p.rep === c) p.rep = p.elig[0].c; bump(); };
  const represent = (c: string) => { p.rep = c; bump(); };
  const add = (c: string) => { if (!elig.some(e => e.c === c)) p.elig = [...elig, { c, why }]; bump(); };
  const setReason = (c: string, w: string) => { p.elig = elig.map(e => (e.c === c ? { ...e, why: w } : e)); bump(); };
  return (
    <span style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {elig.filter(e => C[e.c]).map(e => (
        <span key={e.c} style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <img src={gm.flag(e.c)} alt="" style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />
          <button className="hv4" onClick={() => gm.setState({ listModal: { type: 'country', code: e.c } })} style={{ all: 'unset', cursor: 'pointer', fontWeight: p.rep === e.c ? 600 : 400 }}>{C[e.c].n}</button>
          {p.rep === e.c && <span style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: '999px', border: '1px solid var(--color-accent)', color: 'var(--color-accent-700)' }}>represents</span>}
          {god ? <select value={e.why} onChange={ev => setReason(e.c, ev.target.value)} style={{ fontSize: '11px', padding: '0 4px', width: 'auto', minHeight: 0 }}>{[...new Set([...WHY, e.why])].map(w => <option key={w} value={w}>{w}</option>)}</select> : <span style={{ ...muted, fontSize: '11px' }}>{e.why}</span>}
          {god && p.rep !== e.c && <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '0 6px', ...godText }} onClick={() => represent(e.c)}>Represent</button>}
          {god && elig.length > 1 && <button className="btn btn-ghost" title="Remove this eligibility" style={{ fontSize: '14px', lineHeight: 1, padding: '2px 7px', color: 'var(--gm-bad)', border: '1px solid var(--color-divider)' }} onClick={() => remove(e.c)}>✕</button>}
        </span>
      ))}
      {god && (
        <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', marginTop: '2px', padding: '4px 6px', ...godBox }}>
          <CountryPicker C={C} onPick={add} exclude={elig.map(e => e.c)} placeholder="+ Add a country…" width={180} />
          <select value={why} onChange={ev => setWhy(ev.target.value)} style={{ fontSize: '11.5px', width: 'auto' }}>{WHY.map(w => <option key={w} value={w}>{w}</option>)}</select>
        </span>
      )}
    </span>
  );
}

// Jersey number: yours to change for your own players (anyone's in God Mode). Taking a
// teammate's number swaps the two.
function JerseyNum({ vm, p, tid }: { vm: VM; p: any; tid: number }) {
  const { gm, s } = vm.ctx, [ed, setEd] = useState<string | null>(null), [msg, setMsg] = useState('');
  const can = gm.isUser(s, tid) || !!s.god, pink = !gm.isUser(s, tid) && !!s.god;
  if (!can) return <span title="Jersey number" style={{ ...muted, marginRight: '12px', fontSize: '26px' }}>#{p.num}</span>;
  const mate = (n: string) => (s.rosters[tid] || []).map((id: number) => gm.db.P[id]).find((q: any) => q && q.id !== p.id && q.num === n);
  const save = () => {
    const n = String(ed ?? '').trim();
    if (!/^(00|[0-9]|[1-9][0-9])$/.test(n)) { setMsg('Use 0–99 or 00.'); return; }
    const other = mate(n), old = p.num;
    Object.assign(p, { num: n, numFav: n, numTid: tid, numLocked: true }); if (other) Object.assign(other, { num: old, numTid: tid }); gm.setState(st => ({ gv: (st.gv || 0) + 1 }));
    setMsg(other ? other.name + ' takes #' + old + '.' : ''); setEd(null);
  };
  if (ed == null) return <button onClick={() => { setEd(p.num); setMsg(''); }} title={'Jersey number: click to change' + (pink ? ' (God Mode)' : '')} className="hv4" style={{ all: 'unset', cursor: 'pointer', ...muted, marginRight: '12px', fontSize: '26px', ...(pink ? godText : {}), borderBottom: '1px dotted currentColor' }}>#{p.num}{msg && <span style={{ fontSize: '12px', marginLeft: 8 }}>{msg}</span>}</button>;
  const other = mate(String(ed).trim());
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 12, fontSize: '14px', fontFamily: 'var(--font-body)', verticalAlign: 'middle', ...(pink ? { ...godBox, padding: '2px 6px' } : {}) }}>
      #<input className="input" autoFocus value={ed} onChange={e => setEd(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEd(null); }} style={{ width: 52, minHeight: 28 }} />
      <button className="btn btn-primary" onClick={save} style={{ fontSize: '12px', padding: '3px 10px' }}>{other ? 'Swap with ' + other.name.split(' ').slice(-1)[0] : 'Save'}</button>
      <button className="btn btn-ghost" onClick={() => setEd(null)} style={{ fontSize: '12px', padding: '3px 8px' }}>Cancel</button>
      {msg && <span style={{ color: 'var(--gm-bad)', fontSize: '12px' }}>{msg}</span>}
    </span>
  );
}
