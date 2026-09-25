import type { VM } from '../vm';

export function ListModal({ vm }: { vm: VM }) {
  return (
    <>
      <div onClick={vm.closeList} style={{ position: "absolute", inset: "0", zIndex: "14", display: "grid", placeItems: "center", padding: "26px", background: "rgba(0,0,0,.55)" }}>
        <div onClick={vm.stop} style={{ width: "min(980px,100%)", maxHeight: "100%", overflow: "auto", boxSizing: "border-box", background: "var(--color-bg)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "22px 26px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", borderBottom: "1px solid var(--color-divider)", paddingBottom: "10px", marginBottom: "12px" }}>
            {!!vm.lm.hasFlag && (<>
              <img src={vm.lm.flag} alt="" style={{ width: "42px", height: "28px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
            </>)}
            <div style={{ flex: "1" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "32px", lineHeight: "1.05" }}>
                {vm.lm.title}
              </div>
              <div style={{ color: "var(--color-neutral-700)" }}>
                {vm.lm.sub}
              </div>
            </div>
            <button className="btn btn-ghost" onClick={vm.closeList} style={{ fontSize: "13px" }}>
              Close
            </button>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px" }}>
                  Player
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Team
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
                <th style={{ padding: "6px 8px" }}>
                  {vm.lm.extraH}
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.lm.rows || []).map((p: any, i: number) => (
                <tr key={i} onClick={p.open} style={{ cursor: "pointer" }}>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <span style={{ color: "var(--color-accent-700)" }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                        {p.native}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <button className="hv4" onClick={p.openT} style={{ all: "unset", cursor: "pointer" }}>
                      {p.team}
                    </button>
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
                  <td style={{ padding: "4px 8px", color: "var(--color-neutral-700)" }}>
                    {p.extra}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
