import type { VM } from '../vm';

export function TeamModal({ vm }: { vm: VM }) {
  return (
    <>
      <div onClick={vm.closeTeam} style={{ position: "absolute", inset: "0", zIndex: "14", display: "grid", placeItems: "center", padding: "26px", background: "rgba(0,0,0,.55)" }}>
        <div onClick={vm.stop} style={{ width: "min(1100px,100%)", maxHeight: "100%", overflow: "auto", boxSizing: "border-box", background: "var(--color-bg)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "22px 26px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "20px", borderBottom: "1px solid var(--color-divider)", paddingBottom: "12px", marginBottom: "14px" }}>
            {vm.tm.logo}
            <div style={{ flex: "1", minWidth: "0" }}>
              <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                {vm.tm.line}
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "34px", lineHeight: "1.05" }}>
                {vm.tm.name}
              </div>
              <div style={{ color: "var(--color-neutral-700)" }}>
                {vm.tm.rec} · {vm.tm.market}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {vm.tm.staff}
              </div>
            </div>
            <div style={{ maxWidth: "320px" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "600" }}>
                {vm.tm.strat}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {vm.tm.stratDesc}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {!!vm.tm.isOther && (<>
                <button className="btn btn-primary" onClick={vm.tm.trade} style={{ whiteSpace: "nowrap" }}>
                  Propose a trade
                </button>
              </>)}
              <button className="btn btn-ghost" onClick={vm.closeTeam} style={{ fontSize: "13px" }}>
                Close
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "24px", marginBottom: "10px" }}>
            <span>
              Payroll{" "}
              <span style={{ fontWeight: "600" }}>
                {vm.tm.payroll}
              </span>
            </span>
            <span style={{ color: "var(--color-neutral-700)" }}>
              {vm.tm.cap}
            </span>
          </div>
          {!!vm.isGod && (<>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px", padding: "8px 10px", border: "1px dashed var(--color-accent)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                God Mode
              </span>
              <input className="input" value={vm.tm.region} onChange={vm.tm.setRegion} style={{ maxWidth: "170px", minHeight: "30px", fontSize: "13px" }} />
              <input className="input" value={vm.tm.nm} onChange={vm.tm.setName} style={{ maxWidth: "170px", minHeight: "30px", fontSize: "13px" }} />
              <input className="input" value={vm.tm.abbr} onChange={vm.tm.setAbbr} style={{ maxWidth: "70px", minHeight: "30px", fontSize: "13px" }} />
              <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                Team ID and past seasons stay locked.
              </span>
            </div>
          </>)}
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px" }}>
                  Player
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Pos
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
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Exp
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Pts
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Reb
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Ast
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.tm.rows || []).map((p: any, i: number) => (
                <tr key={i} onClick={p.open} style={{ cursor: "pointer" }}>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <span style={{ color: "var(--color-accent-700)" }}>
                        {p.name}
                      </span>
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
                    {p.contract}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.exp}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.pts}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.reb}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.ast}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", margin: "16px 0 4px" }}>
            Draft picks owned
          </div>
          <p style={{ margin: "0" }}>
            {vm.tm.picks}
          </p>
        </div>
      </div>
    </>
  );
}
