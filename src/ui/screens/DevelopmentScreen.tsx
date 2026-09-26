import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { MentoringSection } from '../LockerRoom';

export function DevelopmentScreen({ vm }: { vm: VM }) {
  const srtD = useSort<any>(vm.devRows || [], { name: r => byLast(vm.ctx.gm.db.P[r.id] || r), age: r => r.age, ovr: r => r.ovr, pot: r => r.pot, min: r => parseFloat(r.min) || 0, focus: r => r.focus, asg: r => String(r.asg) });
  return (
    <>
      <p style={{ margin: "0 0 12px", color: "var(--color-neutral-700)" }}>
        Set a training focus for each player: focused ratings grow about twice as fast, the rest more slowly. Young players need minutes to grow, so sending one down to the development league gives him game reps. Ratings carry hidden decimals, so small monthly gains add up.
      </p>
      <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", margin: "0 0 10px" }}>
        {!vm.coachV?.all && <button className="btn btn-primary" onClick={vm.coachV?.allOn} style={{ fontSize: "12.5px" }} title="Your assistant coaches set every player's training focus and development-league assignment, and re-check them every month">🧑‍🏫 Let assistant coaches decide for everyone</button>}
        {!!vm.coachV?.any && <button className="btn btn-secondary" onClick={vm.coachV?.allOff} style={{ fontSize: "12.5px" }}>Take over everyone</button>}
        <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>Coaches work on each player's costliest gaps for his position (conditioning for veterans 31+), send young players outside the top ten down for game reps, and recall them once they earn a rotation spot.</span>
      </div>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
{srtD.head('name', 'Player')}{srtD.head('age', 'Age', 'right')}{srtD.head('ovr', 'Ovr', 'right')}{srtD.head('pot', 'Pot', 'right')}{srtD.head('min', 'Min', 'right')}{srtD.head('focus', 'Training focus')}{srtD.head('asg', 'Assignment')}<th style={{ padding: '6px 8px', textAlign: 'right' }}>Last month</th>
</tr>
        </thead>
        <tbody>
          {srtD.rows.map((p: any, i: number) => (
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
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {p.age}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.tone, fontWeight: "600" }}>
                {p.ovr}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.ptone }}>
                {p.pot}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                {p.min}
              </td>
              <td style={{ padding: "3px 8px", whiteSpace: "nowrap" }}>
                {p.auto ? (<>
                  <span title={p.coachWhy} style={{ fontSize: "12px", padding: "2px 8px", borderRadius: 4, border: "1px solid var(--color-accent)", color: "var(--color-accent-700)", marginRight: 6, cursor: "help" }}>🧑‍🏫 Coaches: {p.coachFocus}</span>
                  <button className="btn btn-ghost" onClick={p.coachOff} style={{ fontSize: "11.5px", padding: "2px 6px" }}>Take over</button>
                </>) : (<>
                  <select className="input" value={p.focus} onChange={p.setFocus} style={{ minHeight: "28px", fontSize: "12px", padding: "2px 6px", width: "auto", marginRight: 6 }}>
                    {(p.focusOpts || []).map((o: any, i: number) => (
                      <option key={i} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-ghost" onClick={p.coachOn} style={{ fontSize: "11.5px", padding: "2px 6px" }} title="Your assistant coaches pick his training focus and development-league assignment, and re-check them every month">Let assistant coaches decide</button>
                </>)}
              </td>
              <td style={{ padding: "3px 8px", whiteSpace: "nowrap" }}>
                <span style={{ marginRight: "8px" }}>
                  {p.asg}{p.auto && p.canDev ? <span style={{ fontSize: "11px", color: "var(--color-neutral-700)" }}> (coaches)</span> : null}
                </span>
                {!!p.canDev && !p.auto && (<>
                  <button className="btn btn-ghost" onClick={p.toggleDev} style={{ fontSize: "12px", padding: "2px 6px" }}>
                    {p.asgBtn}
                  </button>
                </>)}
              </td>
              <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.lastColor, fontWeight: "600" }}>
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", margin: "0 0 10px" }}>
        {!vm.coachV?.all && <button className="btn btn-primary" onClick={vm.coachV?.allOn} style={{ fontSize: "12.5px" }} title="Your assistant coaches set every player's training focus and development-league assignment, and re-check them every month">🧑‍🏫 Let assistant coaches decide for everyone</button>}
        {!!vm.coachV?.any && <button className="btn btn-secondary" onClick={vm.coachV?.allOff} style={{ fontSize: "12.5px" }}>Take over everyone</button>}
        <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>Coaches work on each player's costliest gaps for his position (conditioning for veterans 31+), send young players outside the top ten down for game reps, and recall them once they earn a rotation spot.</span>
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
                    {x.focus}{x.dev ? <span style={{ color: "var(--gm-good)" }}> · Dev league</span> : null}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: x.color, fontWeight: "600" }}>
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
      <MentoringSection vm={vm} tid={vm.ctx.s.me} />
    </>
  );
}
