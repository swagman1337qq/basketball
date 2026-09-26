import type { VM } from '../vm';
import { CapBar } from '../CapBar';
import { useState } from 'react';
import { Seg } from '../kit';
import { BadgeChip } from '../BadgeChip';

export function FreeAgencyScreen({ vm }: { vm: VM }) {
  const [f, setF] = useState<'all' | 'gl' | 'home'>('all');
  const rows = (vm.faRows || []).filter((p: any) => f === 'all' || (f === 'gl' ? !!p.glT : !p.glT));
  const nGl = (vm.faRows || []).filter((p: any) => p.glT).length;
  return (
    <>
      <CapBar gm={vm.ctx.gm} s={vm.ctx.s} tid={vm.ctx.s.me} />
      {(vm.ctx.s.offerSheets || []).length > 0 && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ flex: 1 }}>Another team signed one of your restricted free agents to an offer sheet. Match it or let him go before preseason.</span>
          <button className="btn btn-primary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Open the cap sheet</button>
        </div>
      )}
      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", margin: "0 0 10px" }}>
        <Seg<'all' | 'gl' | 'home'> value={f} options={[['all', 'All ' + (vm.faRows || []).length], ['gl', 'In the G League ' + nGl], ['home', 'Unsigned ' + ((vm.faRows || []).length - nGl)]]} onChange={setF} />
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
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {p.age}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", color: p.tone, fontWeight: "600" }}>
                {p.ovr}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", color: p.ptone }}>
                {p.pot}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {p.askS}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
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
              <td style={{ padding: "3px 8px", textAlign: "right" }}>
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
