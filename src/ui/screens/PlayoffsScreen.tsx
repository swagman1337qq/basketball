import type { VM } from '../vm';

export function PlayoffsScreen({ vm }: { vm: VM }) {
  return (
    <>
      {!!vm.pov.hasChamp && (<>
        <div style={{ padding: "14px 16px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", marginBottom: "18px" }}>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            {vm.pov.seasonLbl} champions
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "32px", lineHeight: "1.1" }}>
            {vm.pov.champName}
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            {vm.pov.champSub}
          </div>
        </div>
      </>)}
      {!!vm.pov.hasLotto && (<>
        <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
          Draft lottery
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "0 28px", marginBottom: "22px" }}>
          {(vm.pov.lotto || []).map((x: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: "10px", padding: "4px 0", borderBottom: "1px solid var(--color-divider)", color: x.color }}>
              <span style={{ width: "22px", textAlign: "right", color: "var(--color-neutral-600)" }}>
                {x.n}
              </span>
              <button className="hv6" onClick={x.open} style={{ all: "unset", cursor: "pointer", flex: "1", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                {x.logo}
                {x.name}
              </button>
              <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {x.move}
              </span>
            </div>
          ))}
        </div>
      </>)}
      <p style={{ margin: "0 0 12px", color: "var(--color-neutral-700)" }}>
        {vm.pov.note}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: "18px", alignItems: "start", marginBottom: "24px" }}>
        {(vm.pov.rounds || []).map((rd: any, i: number) => (
          <div key={i}>
            <h4 style={{ margin: "0 0 8px", fontSize: "17px", borderBottom: "1px solid var(--color-text)", paddingBottom: "3px" }}>
              {rd.name}
            </h4>
            {(rd.series || []).map((x: any, i: number) => (
              <div key={i} style={{ border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", padding: "6px 10px", marginBottom: "8px" }}>
                <div style={{ fontSize: "10px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>
                  {x.conf}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontWeight: x.fa, color: x.ca }}>
                  <button className="hv6" onClick={x.oa} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {x.la}
                    {x.na}
                  </button>
                  <span>
                    {x.wa}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontWeight: x.fb, color: x.cb }}>
                  <button className="hv6" onClick={x.ob} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {x.lb}
                    {x.nb}
                  </button>
                  <span>
                    {x.wb}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      {!!vm.pov.hasPlayin && (<>
        <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
          Play-in
        </h4>
        {(vm.pov.playin || []).map((t: any, i: number) => (
          <div key={i} style={{ padding: "4px 0", borderBottom: "1px solid var(--color-divider)" }}>
            {t}
          </div>
        ))}
      </>)}
      {!!vm.pov.hasHistory && (<>
        <h4 style={{ margin: "22px 0 4px", fontSize: "19px" }}>
          Past seasons
        </h4>
        <table className="table" style={{ fontSize: "13px" }}>
          <thead>
            <tr>
              <th style={{ padding: "6px 8px" }}>
                Season
              </th>
              <th style={{ padding: "6px 8px" }}>
                Champion
              </th>
              <th style={{ padding: "6px 8px" }}>
                Runner-up
              </th>
              <th style={{ padding: "6px 8px", textAlign: "right" }}>
                {vm.myRegion}
              </th>
              <th style={{ padding: "6px 8px" }}>
                Finish
              </th>
            </tr>
          </thead>
          <tbody>
            {(vm.pov.history || []).map((x: any, i: number) => (
              <tr key={i}>
                <td style={{ padding: "5px 8px" }}>
                  {x.season}
                </td>
                <td style={{ padding: "5px 8px" }}>
                  {x.champ}
                </td>
                <td style={{ padding: "5px 8px" }}>
                  {x.runner}
                </td>
                <td style={{ padding: "5px 8px", textAlign: "right" }}>
                  {x.rec}
                </td>
                <td style={{ padding: "5px 8px" }}>
                  {x.fin}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </>)}
    </>
  );
}
