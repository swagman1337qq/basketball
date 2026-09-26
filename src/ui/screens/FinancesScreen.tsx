import type { VM } from '../vm';
import { NumInput } from '../kit';

export function FinancesScreen({ vm }: { vm: VM }) {
  return (
    <>
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
          <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
            Budget
          </h4>
          {(vm.fin.budget || []).map((b: any, i: number) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 72px 40px", gap: "14px", alignItems: "center", padding: "9px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600" }}>
                  {b.name}
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                  {b.range}
                </div>
              </div>
              <div>
                <NumInput value={b.v} min={b.min} max={b.max} step={b.step} onValue={v => b.set({ target: { value: v } })} suffix={b.name === "Ticket price" ? "$ per ticket" : "$M per season"} />
                <div style={{ fontSize: "11px", color: "var(--color-neutral-700)" }}>
                  {b.effect}
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: "18px" }}>
                {b.amt}
              </div>
              <div style={{ textAlign: "right", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {b.rank}
              </div>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Budgets are per season; the rank compares you with the other 29 teams.
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
