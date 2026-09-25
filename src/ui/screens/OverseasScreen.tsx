import type { VM } from '../vm';

export function OverseasScreen({ vm }: { vm: VM }) {
  return (
    <>
      <p style={{ margin: "0 0 12px", color: "var(--color-neutral-700)" }}>
        Only players who were drafted or declared and went undrafted appear here; prospects who never declared go through the draft. Players who return face a 15-game adjustment period.
      </p>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 8px" }}>
              Player
            </th>
            <th style={{ padding: "6px 8px" }}>
              Club
            </th>
            <th style={{ padding: "6px 8px" }}>
              Abroad this season
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>
              Age
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>
              Projected ovr
            </th>
            <th style={{ padding: "6px 8px" }}>
              Contract
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>
              Asking
            </th>
            <th style={{ padding: "6px 8px" }}></th>
          </tr>
        </thead>
        <tbody>
          {(vm.ovRows || []).map((p: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: "4px 8px" }}>
                <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                  <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                  <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                    {p.name}
                  </button>
                  <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                    {p.pos} · {p.drafted}
                  </span>
                </span>
              </td>
              <td style={{ padding: "4px 8px" }}>
                {p.club}{" "}
                <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                  {p.lg} · {p.clubC}
                </span>
              </td>
              <td style={{ padding: "4px 8px", fontSize: "12px" }}>
                {p.line}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {p.age}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: "600" }}>
                {p.proj}
              </td>
              <td style={{ padding: "4px 8px", fontSize: "12px" }}>
                {p.clause}: {p.fee}
                <div style={{ color: "var(--color-neutral-600)" }}>
                  {p.capHit}
                </div>
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right" }}>
                {p.ask}
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
    </>
  );
}
