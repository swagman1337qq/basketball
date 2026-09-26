import type { VM } from '../vm';

export function FreeAgencyScreen({ vm }: { vm: VM }) {
  return (
    <>
      {(vm.ctx.s.offerSheets || []).length > 0 && (
        <div style={{ padding: "8px 12px", marginBottom: "12px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", fontSize: "13px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span style={{ flex: 1 }}>Another team signed one of your restricted free agents to an offer sheet. Match it or let him go before preseason.</span>
          <button className="btn btn-primary" style={{ fontSize: "12px", padding: "4px 10px" }} onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Open the cap sheet</button>
        </div>
      )}
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            {(vm.faCols || []).map((c: any, i: number) => (
              <th key={i} onClick={c.onClick} style={{ padding: "6px 8px", textAlign: c.align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: c.color }}>
                {c.label}{c.arrow}
              </th>
            ))}
            <th style={{ padding: "6px 8px" }}>
              How you can sign him
            </th>
            <th style={{ padding: "6px 8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {(vm.faRows || []).map((p: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: "4px 8px" }}>
                <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                  <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                  <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                    {p.name}
                  </button>
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
                {p.askS}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {p.exp}
              </td>
              <td style={{ padding: "4px 8px" }}>
                <span className="tag" style={{ background: p.moodBg, color: p.moodFg, padding: "1px 8px" }}>
                  {p.mood}
                </span>
              </td>
              <td style={{ padding: "4px 8px", fontSize: "12px" }}>
                {p.mot}
              </td>
              <td style={{ padding: "4px 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {p.how}
              </td>
              <td style={{ padding: "3px 8px", textAlign: "right" }}>
                <button className="btn btn-primary" onClick={p.sign} disabled={p.cant} style={{ fontSize: "12px", padding: "3px 12px" }}>
                  Sign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "10px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
        {vm.faNote}
      </p>
    </>
  );
}
