import type { VM } from '../vm';
import { CapBar } from '../CapBar';
import { useState } from 'react';
import { Seg, usePaged } from '../kit';
import { BadgeChip } from '../BadgeChip';
import { TraitFilter, byTrait } from '../TraitFilter';
import { Link, muted } from '../kit';
import { Game } from '../../engine/Game';
import { useScoutSelect } from '../ScoutSelect';
import { rosterMax, stdIds, twoWayIds } from '../../engine/cba';
import { faAdvice, type FaAdvice } from '../../engine/assistants';

// The free agency clock: where we are on the NBA calendar, how much of the market has signed,
// what happened since you last advanced, and the best players still out there.
function FATracker({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open } = vm.ctx, P = gm.db.P;
  if (s.phase !== 'fa') return null;
  const fd = gm.faDayOf(s), END = Game.FA_END, date = gm.faDate(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const top: number[] = s.faTop || [], unsigned = new Set<number>(s.fa), signedTop = top.filter(id => !unsigned.has(id)).length;
  const since = s.faPrev ?? s.day, fromT = s.faStart ?? 0;
  const sign = (s.lgLog || []).filter((e: any) => e.type === 'Signing' && e.day >= fromT && (e.pids || []).length);
  const fresh = sign.filter((e: any) => e.day >= since), recent = (fresh.length ? fresh : sign).slice(0, 14);
  const best = s.fa.map((id: number) => P[id]).filter((p: any) => p && !p.retired).sort((a: any, b: any) => b.ovr - a.ovr).slice(0, 8);
  const marks: [number, string][] = [[0, 'Jun 30 · open'], [15, 'Summer League'], [46, 'August'], [END, 'Sep 30 · training camp']];
  return (
    <section className="card" style={{ padding: '12px 14px', gap: 10, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div><div style={{ fontSize: '18px', fontWeight: 600 }}>{date}</div><div style={{ ...muted, fontSize: '12.5px' }}>Day {fd} of free agency · {gm.faStage(fd)}</div></div>
        <div style={{ fontSize: '13px' }}><b>{signedTop}</b> of the top {top.length} free agents have signed · <b>{s.fa.length}</b> players unsigned</div>
      </div>
      <div style={{ position: 'relative', height: 30 }}>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 6, borderRadius: 3, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)' }} />
        <div style={{ position: 'absolute', left: (10 / END * 100) + '%', width: (10 / END * 100) + '%', top: 8, height: 6, background: 'color-mix(in srgb, var(--color-accent) 35%, transparent)' }} title="Summer League" />
        <div style={{ position: 'absolute', left: 0, width: Math.min(100, fd / END * 100) + '%', top: 8, height: 6, borderRadius: 3, background: 'var(--color-accent)' }} />
        <div title="July 6: the moratorium ends and deals become official" style={{ position: 'absolute', left: (6 / END * 100) + '%', top: 4, width: 2, height: 14, background: 'var(--color-text)', opacity: .5 }} />
        {marks.filter(m => m[1]).map(([d, l]) => <span key={d} style={{ position: 'absolute', left: (d / END * 100) + '%', top: 16, transform: d === END ? 'translateX(-100%)' : d ? 'translateX(-50%)' : undefined, fontSize: '10.5px', ...muted, whiteSpace: 'nowrap' }}>{l}</span>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>{fresh.length ? fresh.length + ' signing' + (fresh.length === 1 ? '' : 's') + ' since you last advanced' : 'Latest signings'}</div>
          {recent.length ? recent.map((e: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, alignItems: 'baseline', fontSize: '12.5px', padding: '2px 0', borderBottom: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)' }}>
              <span style={{ ...muted, fontSize: '11px', width: 44, flex: 'none' }}>{e.date || ''}</span><span>{e.text}</span>
            </div>)) : <div style={{ ...muted, fontSize: '12.5px' }}>Nobody has signed yet. Negotiations open tonight.</div>}
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Best still available</div>
          {best.map((p: any) => (
            <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '12.5px', padding: '2px 0', borderBottom: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)' }}>
              <span style={{ fontWeight: 700, width: 22, color: vm.ctx.tone(p.ovr) }}>{p.ovr}</span><Link onClick={() => open(p.id)}>{p.name}</Link><span style={{ ...muted, fontSize: '11.5px' }}>{p.pos} · {p.age}{p.birdTid != null && T[p.birdTid] ? ' · last with ' + T[p.birdTid].abbr : ''}{p.rfa ? ' · restricted' : ''}{p.ask ? ' · asking $' + p.ask.toFixed(1) + 'M' : ''}</span>
            </div>))}
        </div>
      </div>
    </section>
  );
}

// The filter bar: who you can sign right now, and ranges for age, overall, potential and asking
// price. Kept in the save (s.faF) so it survives leaving the screen; Reset clears everything.
type FaF = { can?: boolean; pos?: string; ageMin?: number; ageMax?: number; ovrMin?: number; ovrMax?: number; potMin?: number; potMax?: number; askMax?: number };
const POS_F: [string, string][] = [['any', 'Any position'], ['G', 'Guards'], ['W', 'Wings'], ['B', 'Bigs'], ['PG', 'PG'], ['SG', 'SG'], ['SF', 'SF'], ['PF', 'PF'], ['C', 'C']];
function Range({ label, lo, hi, onLo, onHi, step = 1, width = 54, loPh = 'min', hiPh = 'max' }: { label: string; lo?: number; hi?: number; onLo?: (v?: number) => void; onHi: (v?: number) => void; step?: number; width?: number; loPh?: string; hiPh?: string }) {
  const num = (v: string) => (v.trim() === '' || !isFinite(+v) ? undefined : +v);
  const box = (v: number | undefined, ph: string, set: (v?: number) => void) => <input className="input" type="number" step={step} value={v ?? ''} placeholder={ph} onChange={e => set(num(e.target.value))} style={{ width, padding: '3px 6px', fontSize: '12.5px' }} />;
  return <label style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: '12.5px' }}>{label}{onLo && box(lo, loPh, onLo)}{onLo && <span style={muted}>to</span>}{box(hi, hiPh, onHi)}</label>;
}

export function FreeAgencyScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, P = gm.db.P;
  const [f, setF] = useState<'all' | 'gl' | 'home'>('all'), [tk, setTk] = useState('');
  const F: FaF = s.faF || {}, setFF = (x: Partial<FaF>) => gm.setState(st => ({ faF: { ...(st.faF || {}), ...x } }));
  const inR = (v: number, lo?: number, hi?: number) => (lo == null || v >= lo) && (hi == null || v <= hi);
  const posOk = (p: any) => !F.pos || F.pos === 'any' || (F.pos.length === 1 ? P[p.id]?.grp === F.pos : p.pos === F.pos || ({ GF: ['SG', 'SF'], FC: ['PF', 'C'], G: ['PG', 'SG'], F: ['SF', 'PF'] } as Record<string, string[]>)[p.pos]?.includes(F.pos));
  const all = vm.faRows || [];
  const rows = all.filter((p: any) => f === 'all' || (f === 'gl' ? !!p.glT : !p.glT)).filter(byTrait(vm, tk))
    .filter((p: any) => (!F.can || !p.cant) && posOk(p) && inR(p.age, F.ageMin, F.ageMax) && inR(p.ovr, F.ovrMin, F.ovrMax) && inR(p.pot, F.potMin, F.potMax) && (F.askMax == null || (p.ask ?? 0) <= F.askMax + 1e-9));
  const nGl = all.filter((p: any) => p.glT).length, nCan = all.filter((p: any) => !p.cant).length;
  const active = f !== 'all' || !!tk || Object.entries(F).some(([k, v]) => v != null && v !== false && !(k === 'pos' && v === 'any'));
  const reset = () => { setF('all'); setTk(''); gm.setState({ faF: {} }); };
  const ids = s.rosters[s.me] || [], lim = rosterMax(s), std = stdIds(gm, ids).length, tw = twoWayIds(gm, ids).length, inSeason = ['regular', 'playin', 'playoffs'].includes(s.phase);
  // The assistant GM: press to highlight his picks (the rest dim); press again to turn it off.
  // The picks stay put while you page, sort or filter, until you turn him off.
  const adv: FaAdvice | null = s.faAsk || null, advPick = new Map((adv?.picks || []).map(x => [x.pid, x]));
  const toggleAsk = () => gm.setState(st => ({ faAsk: st.faAsk ? null : faAdvice(gm, st, st.me) }));
  const sc = useScoutSelect(vm, rows.map((p: any) => p.id));
  const pg = usePaged(rows, 'free agents', 25);
  return (
    <>
      <FATracker vm={vm} />
      <CapBar gm={vm.ctx.gm} s={vm.ctx.s} tid={vm.ctx.s.me} />
      {(vm.ctx.s.offerSheets || []).length > 0 && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ flex: 1 }}>Another team signed one of your restricted free agents to an offer sheet. Match it or let him go before preseason.</span>
          <button className="btn btn-primary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Open the cap sheet</button>
        </div>
      )}
      <div style={{ fontSize: '12.5px', margin: '0 0 8px', color: std > (inSeason ? 15 : 21) ? 'var(--gm-bad)' : undefined }}>
        <b>Your roster:</b> {std} of {lim} standard contracts{lim > 15 ? <span style={muted}> (up to 21 in the offseason, including Exhibit 10 camp deals; cut to 15 by opening night{std > 15 ? ': ' + (std - 15) + ' to go' : ''})</span> : <span style={muted}> (15 in season; a hardship exception can add a 16th when 4+ players are out)</span>} · {tw} of 3 two-way
      </div>
      <div className="card" style={{ padding: '10px 12px', margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className={F.can ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '12.5px' }} onClick={() => setFF({ can: true })} title="Hide players you can’t sign right now: no cap room or exception that fits, roster full, hard cap, two-way limit…">Players you can sign now · {nCan}</button>
          <button className={!F.can ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '12.5px' }} onClick={() => setFF({ can: false })}>Show every player in free agency · {all.length}</button>
          <span style={{ flex: 1 }} />
          <button className={adv ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '12.5px', background: adv ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)' : undefined }} onClick={toggleAsk} aria-pressed={!!adv} title={adv ? 'Turn off the assistant GM’s picks' : 'Ask your assistant GM who to sign for the season'}>{adv ? '✓ Assistant GM’s picks · turn off' : 'Ask the assistant GM'}</button>
          <button className="btn btn-ghost" style={{ fontSize: '12.5px' }} disabled={!active} onClick={reset}>Reset all filters</button>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Range label="Age" lo={F.ageMin} hi={F.ageMax} onLo={v => setFF({ ageMin: v })} onHi={v => setFF({ ageMax: v })} />
          <Range label="Overall" lo={F.ovrMin} hi={F.ovrMax} onLo={v => setFF({ ovrMin: v })} onHi={v => setFF({ ovrMax: v })} />
          <Range label="Potential" lo={F.potMin} hi={F.potMax} onLo={v => setFF({ potMin: v })} onHi={v => setFF({ potMax: v })} />
          <Range label="Asking up to $" hi={F.askMax} onHi={v => setFF({ askMax: v })} step={0.5} width={64} hiPh="M" />
          <select className="input" value={F.pos || 'any'} onChange={e => setFF({ pos: e.target.value })} style={{ padding: '3px 6px', fontSize: '12.5px', width: 'auto' }}>{POS_F.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <Seg<'all' | 'gl' | 'home'> value={f} options={[['all', 'All ' + all.length], ['gl', 'In the CCP ' + nGl], ['home', 'Unsigned ' + (all.length - nGl)]]} onChange={setF} />
          <TraitFilter value={tk} onChange={setTk} />
          <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>Ranges include both ends (Age 19 to 21 means 19, 20 and 21). CCP players are on standard CCP deals: any NBA team can call them up by signing them.</span>
        </div>
        {active && <div style={{ ...muted, fontSize: '12px' }}>Showing {rows.length} of {all.length} free agents.</div>}
      </div>
      {adv && <div className="card" style={{ padding: '10px 12px', margin: '0 0 10px', borderLeft: '3px solid var(--color-accent)' }}>
        <div style={{ fontSize: '12.5px' }}><b>{adv.by.name}</b> <span style={muted}>· {adv.by.role}</span></div>
        <div style={{ fontSize: '12.5px', margin: '2px 0 6px' }}>“{adv.summary}”</div>
        {adv.picks.map(x => { const p = P[x.pid], gone = !(s.fa || []).includes(x.pid); return (
          <div key={x.pid} style={{ display: 'flex', gap: 8, alignItems: 'baseline', fontSize: '12.5px', padding: '3px 0', borderTop: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)', opacity: gone ? 0.5 : 1 }}>
            <span style={{ fontWeight: 700, width: 22, color: vm.ctx.tone(p.ovr) }}>{p.ovr}</span>
            <span style={{ whiteSpace: 'nowrap' }}><Link onClick={() => vm.ctx.open(x.pid)}>{p.name}</Link> <span style={muted}>{p.pos} · {p.age}</span>{x.kind === 'twoWay' && <span style={{ fontSize: '10.5px', marginLeft: 6, padding: '0 6px', borderRadius: 999, border: '1px solid #6b8fd6', color: '#6b8fd6' }}>two-way</span>}</span>
            <span style={{ flex: 1 }}>{gone ? 'Signed elsewhere or with you.' : x.why}</span>
            {!gone && <button className="btn btn-primary" style={{ fontSize: '12px', padding: '2px 10px' }} onClick={() => gm.setState({ dialog: { type: 'sign', pid: x.pid } })}>Sign</button>}
          </div>); })}
        <div style={{ ...muted, fontSize: '11.5px', marginTop: 4 }}>His picks are highlighted in the list below; everyone else is dimmed. Press the button again to turn this off.</div>
      </div>}
      {sc.bar()}{sc.Menu()}
      <table data-tour="fa-table" className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            {sc.head()}
            {(vm.faCols || []).map((c: any, i: number) => (
              <th key={i} onClick={c.onClick} style={{ padding: "6px 8px", textAlign: c.align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: c.color }}>
                {c.label}{c.arrow}
              </th>
            ))}
            <th style={{ padding: "6px 8px" }}>
              How you can sign him
            </th>
            <th style={{ padding: "6px 8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {pg.rows.map((p: any, i: number) => (
            <tr key={i} onContextMenu={sc.onContext(p.id)} style={{ background: sc.isSel(p.id) || advPick.has(p.id) ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined, boxShadow: advPick.has(p.id) ? 'inset 3px 0 0 var(--color-accent)' : undefined, opacity: adv && !advPick.has(p.id) ? 0.35 : 1, transition: 'opacity .15s' }}>
              {sc.cell(p.id)}
              <td style={{ padding: "4px 8px" }}>
                <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                  <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                  <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                    {p.name}
                  </button>
                  {sc.tag(p.id)}
                  {(p.topBadges || []).map((b: any) => <BadgeChip key={b.key} b={b} small />)}
                  {p.udT && <span style={{ fontSize: "10.5px", padding: "0 6px", borderRadius: 999, border: "1px solid var(--color-divider)", color: "var(--color-neutral-700)", whiteSpace: "nowrap" }}>{p.udT}</span>}
                  {advPick.has(p.id) && <span title={advPick.get(p.id)!.why} style={{ fontSize: '10.5px', padding: '0 6px', borderRadius: 999, border: '1px solid var(--color-accent)', color: 'var(--color-accent)', whiteSpace: 'nowrap', fontWeight: 600 }}>{advPick.get(p.id)!.kind === 'twoWay' ? 'Assistant: two-way' : 'Assistant pick'}</span>}
                  {p.glT && <span title={p.glLine} style={{ fontSize: "10.5px", padding: "0 6px", borderRadius: 999, border: "1px solid #6b8fd6", color: "#6b8fd6", whiteSpace: "nowrap" }}>CCP · {p.glT}</span>}
                </span>
              </td>
              <td style={{ padding: "4px 8px" }}>
                {p.pos}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {p.age}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.tone, fontWeight: "600" }}>
                {p.ovr}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.ptone }}>
                {p.pot}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {p.askS}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {p.exp}
              </td>
              <td style={{ padding: "4px 8px" }}>
                <span className="tag" style={{ background: p.moodBg, color: p.moodFg, padding: "1px 8px" }}>
                  {p.mood}
                </span>
              </td>
              <td style={{ padding: "4px 8px", fontSize: "12px" }}>
                {p.mot}
              </td>
              <td style={{ padding: "4px 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {p.how}
              </td>
              <td style={{ padding: "3px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                <button className="btn btn-primary" onClick={p.sign} disabled={p.cant} style={{ fontSize: "12px", padding: "3px 12px" }}>
                  Sign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
          {pg.pager}
      <p style={{ margin: "10px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
        {vm.faNote}
      </p>
    </>
  );
}
