import type { VM } from '../vm';

export function ScheduleScreen({ vm }: { vm: VM }) {
  return (
    <>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 8px" }}>
              Date
            </th>
            <th style={{ padding: "6px 8px" }}>
              Opponent
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              Their record
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {(vm.schedRows || []).map((r: any, i: number) => (
            <tr key={i} style={{ background: r.bg }}>
              <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)" }}>
                {r.date}
              </td>
              <td style={{ padding: "5px 8px" }}>
                <button className="hv4" onClick={r.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {r.logo}
                  {r.opp}
                </button>
              </td>
              <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>
                {r.rec}
              </td>
              <td style={{ padding: "3px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {!!r.notNext && (<>
                  <span style={{ color: r.resColor, fontWeight: "600" }}>
                    {r.res}
                  </span>
                </>)}
                {!!r.isNext && (<>
                  <span style={{ display: "inline-flex", gap: "6px" }}>
                    <button className="btn btn-primary" onClick={vm.play1} style={{ fontSize: "12px", padding: "3px 12px" }}>
                      Watch
                    </button>
                    <button className="btn btn-secondary" onClick={vm.quick1} style={{ fontSize: "12px", padding: "3px 12px" }}>
                      Quick sim
                    </button>
                  </span>
                </>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
