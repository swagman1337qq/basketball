import type { VM } from '../vm';
import { ScoutReportsSection } from './ScoutReportsSection';

export function ScoutingScreen({ vm }: { vm: VM }) {
  return (
    <>
      <ScoutReportsSection vm={vm} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: "32px", alignItems: "start" }}>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
            Regions
          </h4>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px" }}>
                  Region
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Talent
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Typical prospects
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right" }}>
                  Prospects
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Coverage
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Margin
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.scoutRegions || []).map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "5px 8px" }}>
                    {r.name}
                  </td>
                  <td style={{ padding: "5px 8px" }}>
                    {r.tier}
                  </td>
                  <td style={{ padding: "5px 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                    {r.arche}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right" }}>
                    {r.n}
                  </td>
                  <td style={{ padding: "5px 8px", color: r.color }}>
                    {r.who}
                  </td>
                  <td style={{ padding: "5px 8px", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {r.margin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Prospects count across the next three draft classes. A scout working his own specialty narrows margins the most; unscouted regions carry the widest error.
          </p>
        </section>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
            Your scouts
          </h4>
          {(vm.scoutsV || []).map((x: any, i: number) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600" }}>
                  {x.name}
                </span>
                <span style={{ color: "var(--color-accent-700)", letterSpacing: ".05em" }}>
                  {x.skill}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                Specialty: {x.spec} · {x.match}
              </div>
              <select className="input" value={x.assign} onChange={x.set} style={{ marginTop: "4px", minHeight: "28px", fontSize: "12px", padding: "2px 6px" }}>
                {(x.opts || []).map((o: any, i: number) => (
                  <option key={i} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <h4 style={{ margin: "18px 0 4px", fontSize: "19px" }}>
            Draft promises
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Agent reputation
            </span>
            <span>
              {vm.repV.label} · {vm.repV.v}
            </span>
          </div>
          <div style={{ height: "4px", background: "var(--color-neutral-300)", margin: "4px 0 8px" }}>
            <div style={{ height: "4px", width: vm.repV.w, background: "var(--color-accent)" }}></div>
          </div>
          {!!vm.noPromises && (<>
            <p style={{ margin: "0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              No promises. Open a prospect in the current class to promise him your pick (two at most). If a rival takes him, a loyal player may refuse to report; an ambitious one will sign anyway and your reputation suffers.
            </p>
          </>)}
          {(vm.promisesV || []).map((x: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <button onClick={x.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                {x.name}
              </button>
              <span>
                {x.n}
              </span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
