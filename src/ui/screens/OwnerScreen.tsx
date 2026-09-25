import type { VM } from '../vm';

export function OwnerScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)", gap: "36px", alignItems: "start" }}>
        <section>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            Owner
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "34px", lineHeight: "1.05" }}>
            {vm.own.name}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: "600", marginTop: "2px" }}>
            {vm.own.arch}
          </div>
          <p style={{ margin: "6px 0 18px", color: "var(--color-neutral-700)" }}>
            {vm.own.desc}
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              Job security
            </span>
            <span style={{ color: vm.own.secColor, fontWeight: "600" }}>
              {vm.own.secLabel} · {vm.own.sec}
            </span>
          </div>
          <div style={{ height: "4px", background: "var(--color-neutral-300)", margin: "6px 0 18px" }}>
            <div style={{ height: "4px", width: vm.own.secW, background: vm.own.secColor }}></div>
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Budget limits
          </h4>
          {(vm.own.limits || []).map((t: any, i: number) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
              {t}
            </div>
          ))}
          <h4 style={{ margin: "18px 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            You’re fired if
          </h4>
          {(vm.own.fire || []).map((t: any, i: number) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
              {t}
            </div>
          ))}
        </section>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Expectations
          </h4>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px" }}>
                  Demand
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Now
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.own.demands || []).map((d: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "6px 8px" }}>
                    {d.d}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right" }}>
                    {d.cur}
                  </td>
                  <td style={{ padding: "6px 8px", color: d.color, fontWeight: "600" }}>
                    {d.stt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Nothing is hidden: these are every rule and limit the owner uses to judge you.
          </p>
          {vm.own.fails > 0 && <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--gm-bad)" }}>Missed payroll mandates this season: {vm.own.fails} (−10 job security each).</p>}
          <h4 style={{ margin: "22px 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Franchise history
          </h4>
          {(vm.own.hist || []).length === 0 ? <p style={{ fontSize: "12px", color: "var(--color-neutral-700)", fontStyle: "italic" }}>Reviewed at the end of each season.</p> : (
            <table className="table" style={{ fontSize: "12.5px" }}>
              <thead><tr><th style={{ padding: "5px 8px" }}>Season</th><th style={{ padding: "5px 8px", textAlign: "right" }}>W–L</th><th style={{ padding: "5px 8px" }}>Finish</th><th style={{ padding: "5px 8px", textAlign: "right" }}>Payroll</th><th style={{ padding: "5px 8px", textAlign: "right" }}>Profit</th></tr></thead>
              <tbody>{vm.own.hist.map((h: any, i: number) => (
                <tr key={i}><td style={{ padding: "5px 8px" }}>{h.season - 1}–{String(h.season).slice(2)}</td><td style={{ padding: "5px 8px", textAlign: "right" }}>{h.w}–{h.l}</td><td style={{ padding: "5px 8px" }}>{h.fin}</td><td style={{ padding: "5px 8px", textAlign: "right" }}>${h.payroll.toFixed(1)}M</td><td style={{ padding: "5px 8px", textAlign: "right", color: h.net < 0 ? "var(--gm-bad)" : "var(--gm-good)" }}>{h.net < 0 ? "−" : ""}${Math.abs(h.net).toFixed(1)}M</td></tr>
              ))}</tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
