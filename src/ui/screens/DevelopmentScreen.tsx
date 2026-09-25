import type { VM } from '../vm';

export function DevelopmentScreen({ vm }: { vm: VM }) {
  return (
    <>
      <p style={{ margin: "0 0 12px", color: "var(--color-neutral-700)" }}>
        Set a training focus for each player: focused ratings grow about twice as fast, the rest more slowly. Young players need minutes to grow, so sending one down to the development league gives him game reps. Ratings carry hidden decimals, so small monthly gains add up.
      </p>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 8px" }}>
              Player
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
            <th style={{ padding: "6px 8px", textAlign: "right" }}>
              Min
            </th>
            <th style={{ padding: "6px 8px" }}>
              Training focus
            </th>
            <th style={{ padding: "6px 8px" }}>
              Assignment
            </th>
            <th style={{ padding: "6px 8px", textAlign: "right" }}>
              Last month
            </th>
          </tr>
        </thead>
        <tbody>
          {(vm.devRows || []).map((p: any, i: number) => (
            <tr key={i}>
              <td style={{ padding: "4px 8px" }}>
                <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                  {p.name}
                </button>
                {" "}
                <span style={{ fontSize: "11px", color: "var(--gm-bad)" }}>
                  {p.injTag}
                </span>
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
                {p.min}
              </td>
              <td style={{ padding: "3px 8px" }}>
                <select className="input" value={p.focus} onChange={p.setFocus} style={{ minHeight: "28px", fontSize: "12px", padding: "2px 6px", width: "auto" }}>
                  {(p.focusOpts || []).map((o: any, i: number) => (
                    <option key={i} value={o.v}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </td>
              <td style={{ padding: "3px 8px", whiteSpace: "nowrap" }}>
                <span style={{ marginRight: "8px" }}>
                  {p.asg}
                </span>
                {!!p.canDev && (<>
                  <button className="btn btn-ghost" onClick={p.toggleDev} style={{ fontSize: "12px", padding: "2px 6px" }}>
                    {p.asgBtn}
                  </button>
                </>)}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", color: p.lastColor, fontWeight: "600" }}>
                {p.last}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4 style={{ margin: "24px 0 4px", fontSize: "19px" }}>
        Monthly reports
      </h4>
      {!!vm.noReports && (<>
        <p style={{ fontStyle: "italic", color: "var(--color-neutral-700)" }}>
          The first report arrives when the calendar turns to a new month.
        </p>
      </>)}
      {(vm.reportsV || []).map((rp: any, i: number) => (
        <section key={i} style={{ marginBottom: "18px" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", borderBottom: "1px solid var(--color-text)", paddingBottom: "3px" }}>
            {rp.label}
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              {(rp.rows || []).map((x: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px" }}>
                    <button className="hv1" onClick={x.open} style={{ all: "unset", cursor: "pointer" }}>
                      {x.name}
                    </button>
                  </td>
                  <td style={{ padding: "4px 8px", color: "var(--color-neutral-700)" }}>
                    {x.focus}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: x.color, fontWeight: "600" }}>
                    {x.d} ovr
                  </td>
                  <td style={{ padding: "4px 8px", fontSize: "12px" }}>
                    {x.changes}
                  </td>
                  <td style={{ padding: "4px 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                    {x.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </>
  );
}
