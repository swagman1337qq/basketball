import type { VM } from '../vm';

export function StandingsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", marginBottom: "16px" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {(vm.standSegs || []).map((sg: any, i: number) => (
            <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", color: sg.color, boxShadow: sg.ring }}>
              {sg.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "28px 32px" }}>
        {(vm.standGroups || []).map((g: any, i: number) => (
          <section key={i}>
            <h4 style={{ margin: "0 0 2px", fontSize: "19px" }}>
              {g.label}
            </h4>
            <table className="table" style={{ fontSize: "13px" }}>
              <thead>
                <tr>
                  <th style={{ padding: "6px 6px" }}>
                    #
                  </th>
                  <th style={{ padding: "6px 6px" }}>
                    Team
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    W
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    L
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    Pct
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    GB
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    Home
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    Road
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    L10
                  </th>
                  <th style={{ padding: "6px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    Strk
                  </th>
                </tr>
              </thead>
              <tbody>
                {(g.rows || []).map((t: any, i: number) => (
                  <tr key={i} style={{ background: t.bg }}>
                    <td style={{ padding: "4px 6px", color: "var(--color-neutral-700)", borderBottom: t.line }}>
                      {t.seed}
                    </td>
                    <td style={{ padding: "4px 6px", fontWeight: t.fw, whiteSpace: "nowrap", borderBottom: t.line }}>
                      <button className="hv4" onClick={t.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        {t.logo}
                        {t.name}
                      </button>
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: t.line }}>
                      {t.w}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: t.line }}>
                      {t.l}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: t.line }}>
                      {t.pct}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: t.line }}>
                      {t.gb}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)", borderBottom: t.line }}>
                      {t.home}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)", borderBottom: t.line }}>
                      {t.road}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: t.line }}>
                      {t.l10}
                    </td>
                    <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: t.line }}>
                      {t.strk}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
      {!!vm.standConf && (<>
        <p style={{ margin: "12px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
          Solid rule: the top six seeds go straight to the playoffs. Dashed rule: seeds 7–10 go to the play-in.
        </p>
      </>)}
    </>
  );
}
