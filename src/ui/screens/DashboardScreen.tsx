import type { VM } from '../vm';

export function DashboardScreen({ vm }: { vm: VM }) {
  return (
    <>
      {!!vm.hasProg && (<>
        <section className="card" style={{ padding: "14px 16px", marginBottom: "22px" }}>
          <div className="card-kicker" style={{ color: "var(--color-accent-700)" }}>
            Offseason development
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "4px 24px" }}>
            {(vm.progRows || []).map((r: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <button className="hv1" onClick={r.open} style={{ all: "unset", cursor: "pointer" }}>
                  {r.name}
                </button>
                <span>
                  {r.from} → {r.to}{" "}
                  <span style={{ color: r.color, fontWeight: "600", marginLeft: "4px" }}>
                    {r.d}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>
      </>)}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "24px", marginBottom: "26px" }}>
        {(vm.dashStats || []).map((st: any, i: number) => (
          <div key={i} style={{ borderTop: "1px solid var(--color-text)", paddingTop: "8px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              {st.label}
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "36px", lineHeight: "1.05" }}>
              {st.value}
            </div>
            <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
              {st.sub}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.05fr) minmax(0,1fr) minmax(0,1.1fr)", gap: "28px", alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <section className="card" style={{ gap: "12px", padding: "16px" }}>
            <div className="card-kicker" style={{ color: "var(--color-accent-700)" }}>
              Next game · {vm.next.when}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ flex: "1" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "30px", lineHeight: "1", display: "flex", alignItems: "center", gap: "10px" }}>
                  {vm.next.myLogo}
                  {vm.myAbbr}
                </div>
                <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
                  {vm.next.myRec}
                </div>
              </div>
              <div style={{ fontStyle: "italic", color: "var(--color-neutral-600)" }}>
                {vm.next.vs}
              </div>
              <div style={{ flex: "1", textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "30px", lineHeight: "1", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
                  <button className="hv4" onClick={vm.next.openT} style={{ all: "unset", cursor: "pointer" }}>
                    {vm.next.abbr}
                  </button>
                  {vm.next.logo}
                </div>
                <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
                  {vm.next.oppRec}
                </div>
              </div>
            </div>
            <div style={{ color: "var(--color-neutral-700)", fontSize: "12px", borderTop: "1px solid var(--color-divider)", paddingTop: "8px" }}>
              {vm.next.line}
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button className="btn btn-primary" onClick={vm.play1} style={{ flex: "1" }}>
                Watch game
              </button>
              <button className="btn btn-secondary" onClick={vm.quick1} style={{ whiteSpace: "nowrap", flex: "none" }}>
                Quick sim
              </button>
              <button className="btn btn-secondary" onClick={vm.play7} style={{ whiteSpace: "nowrap", flex: "none" }}>
                Week
              </button>
            </div>
          </section>
          <section>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              Recent results
            </h4>
            <table className="table" style={{ fontSize: "13px" }}>
              <tbody>
                {(vm.results || []).map((r: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)" }}>
                      {r.date}
                    </td>
                    <td style={{ padding: "5px 8px" }}>
                      <button className="hv4" onClick={r.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {r.logo}
                        {r.opp}
                      </button>
                    </td>
                    <td style={{ padding: "5px 8px", color: r.color, fontWeight: "600" }}>
                      {r.wl}
                    </td>
                    <td style={{ padding: "5px 8px", textAlign: "right" }}>
                      {r.score}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <section>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              Team leaders
            </h4>
            {(vm.leaders || []).map((l: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "10px", padding: "7px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <div style={{ width: "34px", fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                  {l.label}
                </div>
                <button className="hv4" onClick={l.open} style={{ all: "unset", cursor: "pointer", flex: "1" }}>
                  {l.name}
                </button>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "22px", lineHeight: "1" }}>
                  {l.value}
                </div>
              </div>
            ))}
          </section>
          <section>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
                Starting five
              </h4>
              <button className="btn btn-ghost" onClick={vm.goRoster} style={{ fontSize: "13px", whiteSpace: "nowrap", flex: "none" }}>
                Set lineup
              </button>
            </div>
            {(vm.lineup || []).map((p: any, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "2px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <div className="gm-face" style={{ width: "26px", height: "39px", flex: "none", overflow: "hidden" }}>
                  {p.face}
                </div>
                <div style={{ width: "28px", color: "var(--color-neutral-700)" }}>
                  {p.pos}
                </div>
                <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                <button className="hv4" onClick={p.open} style={{ all: "unset", cursor: "pointer", flex: "1" }}>
                  {p.name}
                </button>
                <div style={{ color: p.tone, fontWeight: "600" }}>
                  {p.ovr}
                </div>
              </div>
            ))}
          </section>
        </div>
        <section>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              {vm.confName}
            </h4>
            <button className="btn btn-ghost" onClick={vm.goStandings} style={{ fontSize: "13px", whiteSpace: "nowrap", flex: "none" }}>
              Standings
            </button>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px" }}>
                  #
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Team
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  W–L
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  GB
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.confMini || []).map((t: any, i: number) => (
                <tr key={i} style={{ background: t.bg }}>
                  <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)", borderBottom: t.line }}>
                    {t.seed}
                  </td>
                  <td style={{ padding: "5px 8px", fontWeight: t.fw, borderBottom: t.line }}>
                    <button className="hv4" onClick={t.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {t.logo}
                      {t.name}
                    </button>
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: t.line }}>
                    {t.rec}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--color-neutral-700)", borderBottom: t.line }}>
                    {t.gb}
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
