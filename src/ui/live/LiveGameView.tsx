import type { VM } from '../vm';

export function LiveGameView({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--color-text)", fontVariantNumeric: "tabular-nums" }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto minmax(0,1fr) auto", gap: "24px", alignItems: "center", padding: "12px 16px", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", justifyContent: "flex-end" }}>
            <div style={{ alignSelf: "center" }}>
              {vm.away.logo}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "600", lineHeight: "1.1" }}>
                <button className="hv7" onClick={vm.away.open} style={{ all: "unset", cursor: "pointer" }}>
                  {vm.away.name}
                </button>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {vm.away.rec} · Away
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "44px", lineHeight: "1", minWidth: "64px", textAlign: "right" }}>
              {vm.away.pts}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "600", color: "var(--color-accent-700)" }}>
              {vm.clock}
            </div>
            <table style={{ borderCollapse: "collapse", fontSize: "12px", marginTop: "4px" }}>
              <tbody>
              <tr>
                <td style={{ padding: "1px 6px" }}></td>
                {(vm.qLabels || []).map((q: any, i: number) => (
                  <td key={i} style={{ padding: "1px 6px", color: "var(--color-neutral-600)" }}>
                    {q}
                  </td>
                ))}
                <td style={{ padding: "1px 6px", color: "var(--color-neutral-600)" }}>
                  T
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1px 6px" }}>
                  {vm.away.abbr}
                </td>
                {(vm.away.qs || []).map((q: any, i: number) => (
                  <td key={i} style={{ padding: "1px 6px" }}>
                    {q}
                  </td>
                ))}
                <td style={{ padding: "1px 6px", fontWeight: "600" }}>
                  {vm.away.pts}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1px 6px" }}>
                  {vm.home.abbr}
                </td>
                {(vm.home.qs || []).map((q: any, i: number) => (
                  <td key={i} style={{ padding: "1px 6px" }}>
                    {q}
                  </td>
                ))}
                <td style={{ padding: "1px 6px", fontWeight: "600" }}>
                  {vm.home.pts}
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "44px", lineHeight: "1", minWidth: "64px" }}>
              {vm.home.pts}
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "600", lineHeight: "1.1" }}>
                <button className="hv7" onClick={vm.home.open} style={{ all: "unset", cursor: "pointer" }}>
                  {vm.home.name}
                </button>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {vm.home.rec} · Home
              </div>
            </div>
            <div style={{ alignSelf: "center" }}>
              {vm.home.logo}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "stretch", minWidth: "190px" }}>
            {!!vm.notDone && (<>
              <div style={{ display: "flex", gap: "6px" }}>
                <button className="btn btn-secondary" onClick={vm.toggle} style={{ flex: "1", whiteSpace: "nowrap" }}>
                  {vm.runLabel}
                </button>
                <button className="btn btn-secondary" onClick={vm.stepOne} title="One play" style={{ whiteSpace: "nowrap" }}>
                  Step
                </button>
                <button className="btn btn-secondary" onClick={vm.toEnd} style={{ whiteSpace: "nowrap" }}>
                  Sim to end
                </button>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                Speed
                <input type="range" min="1" max="5" step="1" value={vm.speed} onChange={vm.setSpeed} style={{ flex: "1", accentColor: "var(--color-accent)" }} />
              </label>
            </>)}
            {!!vm.done && (<>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "18px", fontWeight: "600", textAlign: "center" }}>
                {vm.finalLine}
              </div>
              <button className="btn btn-primary" onClick={vm.finish}>
                Continue
              </button>
            </>)}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: "24px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "22px", minWidth: "0" }}>
            {(vm.sides || []).map((sd: any, i: number) => (
              <section key={i}>
                <h4 style={{ margin: "0 0 2px", fontSize: "19px", display: "flex", alignItems: "center", gap: "8px" }}>
                  {sd.small}
                  <button className="hv7" onClick={sd.open} style={{ all: "unset", cursor: "pointer" }}>
                    {sd.name}
                  </button>
                </h4>
                <table className="table" style={{ fontSize: "12.5px" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "5px 6px" }}>
                        Player
                      </th>
                      <th style={{ padding: "5px 6px" }}>
                        Pos
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        Min
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        FG
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        3P
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        FT
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        OR
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        Reb
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        Ast
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        TO
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        Stl
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        Blk
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        PF
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        Pts
                      </th>
                      <th style={{ padding: "5px 6px", textAlign: "right" }}>
                        +/−
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(sd.rows || []).map((r: any, i: number) => (
                      <tr key={i} style={{ background: r.bg }}>
                        <td style={{ padding: "3px 6px", borderBottom: r.line }}>
                          <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            <img src={r.flag} alt="" style={{ width: "15px", height: "10px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                            <button className="hv7" onClick={r.open} style={{ all: "unset", cursor: "pointer" }}>
                              {r.name}
                            </button>
                          </span>
                        </td>
                        <td style={{ padding: "3px 6px", borderBottom: r.line }}>
                          {r.pos}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.min}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.fg}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.tp}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.ft}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.orb}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.trb}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.ast}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.tov}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.stl}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.blk}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.pf}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", fontWeight: "600", borderBottom: r.line }}>
                          {r.pts}
                        </td>
                        <td style={{ padding: "3px 6px", textAlign: "right", borderBottom: r.line }}>
                          {r.pm}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ padding: "5px 6px", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                        Total
                      </td>
                      <td style={{ borderTop: "1px solid var(--color-text)" }}></td>
                      <td style={{ borderTop: "1px solid var(--color-text)" }}></td>
                      <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.fg}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.tp}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.ft}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.orb}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.trb}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.ast}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.tov}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.stl}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.blk}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.pf}
                      </td>
                      <td style={{ padding: "5px 6px", textAlign: "right", fontWeight: "600", borderTop: "1px solid var(--color-text)" }}>
                        {sd.tot.pts}
                      </td>
                      <td style={{ borderTop: "1px solid var(--color-text)" }}></td>
                    </tr>
                    <tr>
                      <td style={{ padding: "3px 6px", color: "var(--color-neutral-700)" }}>
                        Percentages
                      </td>
                      <td></td>
                      <td></td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: "var(--color-neutral-700)" }}>
                        {sd.tot.fgp}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: "var(--color-neutral-700)" }}>
                        {sd.tot.tpp}
                      </td>
                      <td style={{ padding: "3px 6px", textAlign: "right", color: "var(--color-neutral-700)" }}>
                        {sd.tot.ftp}
                      </td>
                      <td colSpan={9}></td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontSize: "12px", color: "var(--color-neutral-700)", marginTop: "4px" }}>
                  Shot zones: {sd.zones}
                </div>
              </section>
            ))}
            <p style={{ margin: "0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Shaded rows are on the floor. The dark rule separates starters from the bench.
            </p>
          </div>
          <aside style={{ position: "sticky", top: "0", borderLeft: "1px solid var(--color-divider)", paddingLeft: "16px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: "4px" }}>
              Play by play
            </div>
            <div style={{ maxHeight: "640px", overflow: "auto", display: "flex", flexDirection: "column" }}>
              {(vm.pbp || []).map((e: any, i: number) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr) auto", gap: "8px", padding: "6px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: e.color }}>
                    {e.abbr}
                  </span>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                      {e.time}
                    </div>
                    <div style={{ fontWeight: e.fw }}>
                      {e.text}
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                      {e.sub}
                    </div>
                  </div>
                  <span style={{ fontWeight: "600", whiteSpace: "nowrap" }}>
                    {e.score}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
