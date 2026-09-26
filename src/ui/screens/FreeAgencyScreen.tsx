import type { VM } from '../vm';
import { CapBar } from '../CapBar';
import { useState } from 'react';
import { Seg } from '../kit';
import { BadgeChip } from '../BadgeChip';
import { TraitFilter, byTrait } from '../TraitFilter';
import { Link, muted } from '../kit';
import { Game } from '../../engine/Game';

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

export function FreeAgencyScreen({ vm }: { vm: VM }) {
  const [f, setF] = useState<'all' | 'gl' | 'home'>('all'), [tk, setTk] = useState('');
  const rows = (vm.faRows || []).filter((p: any) => f === 'all' || (f === 'gl' ? !!p.glT : !p.glT)).filter(byTrait(vm, tk));
  const nGl = (vm.faRows || []).filter((p: any) => p.glT).length;
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
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", margin: "0 0 10px" }}>
        <Seg<'all' | 'gl' | 'home'> value={f} options={[['all', 'All ' + (vm.faRows || []).length], ['gl', 'In the G League ' + nGl], ['home', 'Unsigned ' + ((vm.faRows || []).length - nGl)]]} onChange={setF} />
        <TraitFilter value={tk} onChange={setTk} />
        <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>G League players are on standard G League deals: any NBA team can call them up by signing them.</span>
      </div>
      <table data-tour="fa-table" className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
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
          {rows.map((p: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: "4px 8px" }}>
                <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                  <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                  <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                    {p.name}
                  </button>
                  {(p.topBadges || []).map((b: any) => <BadgeChip key={b.key} b={b} small />)}
                  {p.udT && <span style={{ fontSize: "10.5px", padding: "0 6px", borderRadius: 999, border: "1px solid var(--color-divider)", color: "var(--color-neutral-700)", whiteSpace: "nowrap" }}>{p.udT}</span>}
                  {p.glT && <span title={p.glLine} style={{ fontSize: "10.5px", padding: "0 6px", borderRadius: 999, border: "1px solid #6b8fd6", color: "#6b8fd6", whiteSpace: "nowrap" }}>G League · {p.glT}</span>}
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
      <p style={{ margin: "10px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
        {vm.faNote}
      </p>
    </>
  );
}
