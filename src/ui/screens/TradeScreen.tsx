import type { VM } from '../vm';

export function TradeScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px minmax(0,1fr)", gap: "24px", alignItems: "start" }}>
        <section>
          <div style={{ display: "flex", alignItems: "center", height: "36px", marginBottom: "4px" }}>
            <h4 style={{ margin: "0", fontSize: "19px", display: "flex", alignItems: "center", gap: "10px" }}>
              {vm.myLogoTr}
              {vm.myName} send
            </h4>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px", width: "22px" }}></th>
                <th style={{ padding: "6px 8px" }}>
                  Player
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Age
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Ovr
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Pot
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Contract
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.tMine || []).map((p: any, i: number) => (
                <tr key={i} onClick={p.toggle} style={{ cursor: "pointer", background: p.bg }}>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: p.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {p.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      {p.name}{" "}
                      <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                        {p.pos}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.age}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: p.tone, fontWeight: "600" }}>
                    {p.ovr}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.pot}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.contract}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", margin: "16px 0 2px" }}>
            Draft picks
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              {(vm.tMinePicks || []).map((k: any, i: number) => (
                <tr key={i} onClick={k.toggle} style={{ cursor: "pointer", background: k.bg }}>
                  <td style={{ padding: "4px 8px", width: "22px" }}>
                    <span style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: k.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {k.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    {k.label}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-neutral-700)" }}>
                    {k.proj}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card" style={{ padding: "16px", gap: "10px", position: "sticky", top: "0" }}>
          <div className="card-kicker" style={{ color: "var(--color-accent-700)" }}>
            Trade summary
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider)", paddingBottom: "5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Salary out
            </span>
            <span>
              {vm.tr.out}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider)", paddingBottom: "5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Salary in
            </span>
            <span>
              {vm.tr.in}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider)", paddingBottom: "5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Payroll after
            </span>
            <span>
              {vm.tr.after}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Salary rule
            </span>
            <span style={{ color: vm.tr.salColor, textAlign: "right" }}>
              {vm.tr.sal}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Roster limits
            </span>
            <span style={{ color: vm.tr.rosColor }}>
              {vm.tr.ros}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "8px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              Their direction
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: "600" }}>
              {vm.tr.stratName}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              {vm.tr.stratDesc}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: "8px" }}>
              Their appetite
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <div style={{ position: "absolute", left: "0", right: "0", top: "6px", height: "1px", background: "var(--color-neutral-400)" }}></div>
              <div style={{ position: "absolute", left: "50%", top: "0", width: "1px", height: "14px", background: "var(--color-text)" }}></div>
              <div style={{ position: "absolute", left: vm.tr.meter, top: "2px", width: "10px", height: "10px", marginLeft: "-5px", transform: "rotate(45deg)", border: "1px solid var(--color-accent)", background: "var(--color-bg)" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-neutral-600)", marginTop: "2px" }}>
              <span>
                Decline
              </span>
              <span>
                Accept
              </span>
            </div>
            <div style={{ marginTop: "6px", fontStyle: "italic" }}>
              {vm.tr.verdict}
            </div>
          </div>
          <button className="btn btn-primary" onClick={vm.propose} disabled={vm.tr.cantPropose} style={{ width: "100%", marginTop: "4px" }}>
            Propose trade
          </button>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary" onClick={vm.balance} disabled={vm.tr.cantBalance} style={{ flex: "1", fontSize: "13px", whiteSpace: "nowrap" }}>
              What would it take?
            </button>
            <button className="btn btn-ghost" onClick={vm.clearTrade} style={{ fontSize: "13px" }}>
              Clear
            </button>
          </div>
          {!!vm.tr.hasMsg && (<>
            <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "8px", color: "var(--color-accent-800)" }}>
              {vm.tr.msg}
            </div>
          </>)}
        </section>
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "36px", marginBottom: "4px" }}>
            {vm.theirLogo}
            <select className="input" value={vm.tTid} onChange={vm.pickTeam} style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", minHeight: "34px", padding: "4px 8px" }}>
              {(vm.teamOptions || []).map((o: any, i: number) => (
                <option key={i} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <span style={{ color: "var(--color-neutral-700)", whiteSpace: "nowrap" }}>
              send
            </span>
            <button className="btn btn-ghost" onClick={vm.viewTradeTeam} style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
              View roster
            </button>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px", width: "22px" }}></th>
                <th style={{ padding: "6px 8px" }}>
                  Player
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Age
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Ovr
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Pot
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Contract
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.tTheirs || []).map((p: any, i: number) => (
                <tr key={i} onClick={p.toggle} style={{ cursor: "pointer", background: p.bg }}>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: p.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {p.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      {p.name}{" "}
                      <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                        {p.pos}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.age}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: p.tone, fontWeight: "600" }}>
                    {p.ovr}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.pot}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.contract}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", margin: "16px 0 2px" }}>
            Draft picks
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              {(vm.tTheirPicks || []).map((k: any, i: number) => (
                <tr key={i} onClick={k.toggle} style={{ cursor: "pointer", background: k.bg }}>
                  <td style={{ padding: "4px 8px", width: "22px" }}>
                    <span style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: k.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {k.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    {k.label}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-neutral-700)" }}>
                    {k.proj}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
