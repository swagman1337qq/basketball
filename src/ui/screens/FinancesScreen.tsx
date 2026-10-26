import type { VM } from '../vm';
import { GOD_PINK } from '../kit';

export function FinancesScreen({ vm }: { vm: VM }) {
  return (
    <>
      {vm.fin.teams && (() => { // God Mode only, so in God Mode's color: the team box and its arrows
        const T = vm.fin.teams, i = Math.max(0, T.findIndex((t: any) => t.v === vm.fin.teamV)), go = (d: number) => vm.fin.setTeam({ target: { value: T[(i + d + T.length) % T.length].v } });
        const arrow = { all: "unset", cursor: "pointer", display: "grid", placeItems: "center", width: "30px", height: "30px", border: "1px solid " + GOD_PINK, borderRadius: "var(--radius-md)", color: GOD_PINK, background: "color-mix(in srgb, " + GOD_PINK + " 10%, transparent)", fontSize: "15px", lineHeight: 1 } as const;
        return (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "18px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: GOD_PINK }}>God Mode · finances of</span>
            <button onClick={() => go(-1)} title="Previous team" aria-label="Previous team" style={arrow}>‹</button>
            <select className="input" value={vm.fin.teamV} onChange={vm.fin.setTeam} style={{ width: "auto", borderColor: GOD_PINK, color: GOD_PINK, background: "color-mix(in srgb, " + GOD_PINK + " 10%, var(--color-bg))" }}>
              {T.map((t: any) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            <button onClick={() => go(1)} title="Next team" aria-label="Next team" style={arrow}>›</button>
            {vm.fin.readOnly && <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>Their budget is set by their owner (shown, not editable here).</span>}
          </div>
        );
      })()}
      <section style={{ marginBottom: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h4 style={{ margin: "0", fontSize: "19px" }}>
            Payroll against the {vm.pov.seasonLbl} salary cap
          </h4>
          <span style={{ fontFamily: "var(--font-heading)", fontSize: "24px" }}>
            {vm.fin.payroll}
          </span>
        </div>
        <div style={{ position: "relative", height: "40px", margin: "30px 0 22px" }}>
          <div style={{ position: "absolute", left: "0", right: "0", top: "18px", height: "1px", background: "var(--color-neutral-400)" }}></div>
          <div style={{ position: "absolute", left: "0", top: "15px", height: "7px", width: vm.fin.payW, background: "var(--color-text)" }}></div>
          {(vm.fin.marks || []).map((m: any, i: number) => (
            <div key={i} style={{ position: "absolute", left: m.left, top: "6px", height: "26px", borderLeft: "1px solid var(--color-accent)" }}>
              <div style={{ position: "absolute", left: "5px", top: m.top, fontSize: "11px", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>
                {m.label} {m.val}
              </div>
            </div>
          ))}
        </div>
        <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
          {vm.fin.status}
        </div>
      </section>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.9fr) minmax(0,1.1fr)", gap: "36px", alignItems: "start", marginBottom: "30px" }}>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
            Projected season ledger
          </h4>
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ padding: "8px 8px 4px", fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                  Revenue
                </td>
              </tr>
              {(vm.fin.rev || []).map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px" }}>
                    {r.name}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.v}
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} style={{ padding: "12px 8px 4px", fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                  Expenses
                </td>
              </tr>
              {(vm.fin.exp || []).map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px" }}>
                    {r.name}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.v}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: "8px", fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                  Net
                </td>
                <td style={{ padding: "8px", textAlign: "right", whiteSpace: "nowrap", fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "600", borderTop: "1px solid var(--color-text)", color: vm.fin.netColor }}>
                  {vm.fin.net}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 0 4px" }}>
            <h4 style={{ margin: "0", fontSize: "19px" }}>
              Budget
            </h4>
            {!vm.fin.readOnly && <button onClick={() => vm.fin.setAllAuto(!vm.fin.allAuto)} title={vm.fin.allAuto ? "Take every category off Auto" : "Put every category on Auto"} style={autoBtn(vm.fin.allAuto)}>
              {vm.fin.allAuto ? "All on Auto ✓" : "Auto all"}
            </button>}
          </div>
          {(vm.fin.budget || []).map((b: any, i: number) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 84px 56px 40px", gap: "14px", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600" }}>
                  {b.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                  {b.range}
                </div>
              </div>
              {(() => { // 0–100% of what's allowed (100% = the most you can spend), the dollars alongside
                const span = b.max - b.min, pct = span ? Math.round(((b.v - b.min) / span) * 100) : 0;
                const setPct = (x: number) => { const raw = b.min + (x / 100) * span, v = Math.min(b.max, Math.max(b.min, Math.round(raw / b.step) * b.step)); b.set({ target: { value: +v.toFixed(2) } }); };
                return (<>
                  <div>
                    <input type="range" min={0} max={100} step={1} value={pct} onChange={e => setPct(+e.target.value)} disabled={vm.fin.readOnly} aria-label={b.name + ' budget, percent of the maximum'} style={{ width: "100%", accentColor: "var(--color-accent)" }} />
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-700)" }}>
                      {b.effect}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{pct}%</span>
                    <div style={{ fontSize: "12px", color: "var(--color-neutral-600)" }}>{b.amt}{b.name === "Ticket price" ? " avg" : ""}</div>
                  </div>
                </>);
              })()}
              {vm.fin.readOnly ? <span /> : <button onClick={b.toggleAuto} aria-pressed={b.auto} title={b.auto ? "On Auto: follows the recommendation (" + b.rec + ") as your record and revenue change. Click to set it yourself." : "Auto sets " + b.name.toLowerCase() + " to the recommendation (" + b.rec + " now) and keeps it there as your record and revenue change."} style={autoBtn(b.auto)}>
                {b.auto ? "Auto ✓" : "Auto"}
              </button>}
              <div style={{ textAlign: "right", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {b.rank}
              </div>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Each budget runs from 0% (the least allowed) to 100% (the most); the dollar amount per season is in gray. The rank compares you with the other 29 teams. Auto spends in line with your revenue and owner, and prices tickets for the most money while keeping the arena at least 90% full; moving a slider takes that category off Auto.
          </p>
        </section>
      </div>
      <section>
        <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
          Committed salary
        </h4>
        <table className="table" style={{ fontSize: "13px" }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 8px" }}>
                Player
              </th>
              {(vm.fin.years || []).map((y: any, i: number) => (
                <th key={i} style={{ padding: "6px 8px", textAlign: "right" }}>
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(vm.fin.ledger || []).map((p: any, i: number) => (
              <tr key={i}>
                <td style={{ padding: "4px 8px" }}>
                  <button className="hv4" onClick={p.open} style={{ all: "unset", cursor: "pointer" }}>
                    {p.name}
                  </button>
                </td>
                {(p.cells || []).map((c: any, i: number) => (
                  <td key={i} style={{ padding: "4px 8px", textAlign: "right" }}>
                    {c}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td style={{ padding: "6px 8px", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                Total
              </td>
              {(vm.fin.totals || []).map((c: any, i: number) => (
                <td key={i} style={{ padding: "6px 8px", textAlign: "right", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                  {c}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>
    </>
  );
}

const autoBtn = (on: boolean) => ({ cursor: "pointer", padding: "4px 8px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", whiteSpace: "nowrap" as const, border: "1px solid " + (on ? "var(--color-accent)" : "var(--color-divider)"), background: on ? "var(--color-accent-100)" : "transparent", color: on ? "var(--color-accent-700)" : "var(--color-text)" });
