import type { VM } from '../vm';

export function DepthChartScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "24px", marginBottom: "24px" }}>
        {(vm.comp || []).map((st: any, i: number) => (
          <div key={i} style={{ borderTop: "1px solid var(--color-text)", paddingTop: "8px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              {st.label}
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "32px", lineHeight: "1.05" }}>
              {st.value}
            </div>
            <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
              {st.sub}
            </div>
          </div>
        ))}
      </div>
      <h4 style={{ margin: "0 0 8px", fontSize: "19px" }}>
        Depth chart
      </h4>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: "16px", marginBottom: "30px" }}>
        {(vm.depth || []).map((c: any, i: number) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--color-text)", paddingBottom: "2px", marginBottom: "8px" }}>
              <span style={{ fontFamily: "var(--font-heading)", fontSize: "22px" }}>
                {c.pos}
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                {c.count}
              </span>
            </div>
            {/* Every starter box is the same height, with a line kept for the out-of-position note, so the
                five columns (and the bench lists under them) stay lined up. */}
            <div className="hv3" onClick={c.s.open} title={c.s.note ? c.s.name + ': playing out of position (his ratings fit another spot better)' : c.s.name} style={{ display: "flex", gap: "10px", alignItems: "center", padding: "8px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", cursor: "pointer", marginBottom: "6px", height: "80px", boxSizing: "border-box" }}>
              <div className="gm-face" style={{ width: "40px", height: "60px", flex: "none", overflow: "hidden" }}>
                {c.s.face}
              </div>
              <div style={{ minWidth: "0", flex: "1" }}>
                <div style={{ fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)", lineHeight: "13px" }}>
                  Starter
                </div>
                <div title={c.s.name} style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", lineHeight: "1.1", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.s.name}
                </div>
                <div style={{ fontSize: "12px", color: "var(--color-neutral-700)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.s.pos} · {c.s.ovr} ovr
                </div>
                <div style={{ fontSize: "11px", color: "var(--color-accent-800)", fontStyle: "italic", height: "14px", lineHeight: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {c.s.note}
                </div>
              </div>
            </div>
            {(c.bench || []).map((b: any, i: number) => (
              <div key={i} className="hv1" onClick={b.open} style={{ display: "flex", justifyContent: "space-between", gap: "6px", padding: "4px 2px", borderBottom: "1px solid var(--color-divider)", cursor: "pointer" }}>
                <span title={b.name} style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {b.name}{" "}
                  <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                    {b.pos}
                  </span>
                </span>
                <span style={{ color: b.tone, fontWeight: "600" }}>
                  {b.ovr}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
        Roles
      </h4>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 8px" }}>
              Role
            </th>
            <th style={{ padding: "6px 8px" }}>
              What it means
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              Have
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              Target
            </th>
            <th style={{ padding: "6px 8px" }}>
              Status
            </th>
            <th style={{ padding: "6px 8px" }}>
              Players
            </th>
          </tr>
        </thead>
        <tbody>
          {(vm.roles || []).map((r: any, i: number) => (
            <tr key={i}>
              <td title={r.name} style={{ padding: "5px 8px", whiteSpace: "nowrap", maxWidth: "26ch", overflow: "hidden", textOverflow: "ellipsis" }}>
                {r.name}
              </td>
              <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)" }}>
                {r.desc}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", fontFamily: "var(--font-heading)", fontSize: "18px" }}>
                {r.count}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>
                {r.target}
              </td>
              <td style={{ padding: "5px 8px", color: r.color, fontWeight: r.fw }}>
                {r.status}
              </td>
              <td style={{ padding: "5px 8px", fontSize: "12px" }}>
                {r.players}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "10px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
        Roles come from ratings, and a player can fill more than one. Starters come from your Roster order and are placed where they fit best.
      </p>
    </>
  );
}
