import type { VM } from '../vm';

export function RosterScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <div style={{ flex: "1", color: "var(--color-neutral-700)" }}>
          Drag a row or use the arrows to set the rotation; the top five start. Sorting a column keeps starters above the rule and the bench below it. {vm.lineupHint}
        </div>
        <button className="btn btn-secondary" onClick={vm.autoLineup} style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
          Auto-sort by rating
        </button>
      </div>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 4px", width: "52px" }}></th>
            {(vm.rosterCols || []).map((c: any, i: number) => (
              <th key={i} onClick={c.onClick} style={{ padding: "6px 8px", textAlign: c.align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: c.color }}>
                {c.label}{c.arrow}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(vm.rosterRows || []).map((p: any, i: number) => (
            <tr key={i} onClick={p.open} draggable="true" onDragStart={p.dragStart} onDragOver={p.dragOver} onDrop={p.drop} onDragEnd={vm.dragEnd} style={{ cursor: "pointer", background: p.bg, boxShadow: p.dropLine }}>
              <td style={{ padding: "2px 4px", whiteSpace: "nowrap", borderBottom: p.line }}>
                <span style={{ display: "inline-flex", gap: "2px", alignItems: "center" }}>
                  <span style={{ cursor: "grab", color: "var(--color-neutral-500)", padding: "0 3px", fontSize: "12px" }}>
                    ⋮⋮
                  </span>
                  <button className="hv5" onClick={p.up} title="Move up" style={{ all: "unset", cursor: "pointer", width: "18px", height: "22px", display: "grid", placeItems: "center", color: "var(--color-neutral-600)", borderRadius: "2px" }}>
                    ↑
                  </button>
                  <button className="hv5" onClick={p.down} title="Move down" style={{ all: "unset", cursor: "pointer", width: "18px", height: "22px", display: "grid", placeItems: "center", color: "var(--color-neutral-600)", borderRadius: "2px" }}>
                    ↓
                  </button>
                </span>
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--color-neutral-700)", borderBottom: p.line }}>
                {p.rk}
              </td>
              <td style={{ padding: "5px 8px", borderBottom: p.line }}>
                <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                  <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                  <span style={{ color: "var(--color-accent-700)" }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                    {p.native ? "(" + p.native + ")" : ""}
                  </span>
                  {(p.topBadges || []).map((b: any) => <span key={b.key} title={b.name + ' · ' + b.tierName} style={{ fontSize: "10.5px", color: b.color, border: "1px solid " + b.color, borderRadius: "999px", padding: "0 6px", whiteSpace: "nowrap" }}>{b.name}</span>)}
                  <span style={{ fontSize: "10px", letterSpacing: ".08em", color: "var(--color-neutral-600)" }}>
                    {p.role}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--gm-bad)" }}>
                    {p.injTag}
                  </span>
                </span>
              </td>
              <td style={{ padding: "5px 8px", borderBottom: p.line }}>
                {p.pos}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.age}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", color: p.tone, fontWeight: "600", borderBottom: p.line }}>
                {p.ovr}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", color: p.ptone, borderBottom: p.line }}>
                {p.pot}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.contract}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.exp}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.gp}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.min}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.pts}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.reb}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.ast}
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", borderBottom: p.line }}>
                {p.per}
              </td>
              <td style={{ padding: "5px 8px", borderBottom: p.line, color: p.hapColor, whiteSpace: "nowrap" }}>
                {p.hapLabel}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "10px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
        S marks a starter. Flags show the national team each player represents.
      </p>
    </>
  );
}
