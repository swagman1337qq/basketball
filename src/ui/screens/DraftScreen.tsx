import type { VM } from '../vm';

export function DraftScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden", flex: "none" }}>
          {(vm.dClasses || []).map((sg: any, i: number) => (
            <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", whiteSpace: "nowrap", color: sg.color, boxShadow: sg.ring }}>
              {sg.label}
            </button>
          ))}
        </div>
        <div style={{ flex: "1", color: "var(--color-neutral-700)", fontSize: "12px" }}>
          {vm.dr.classNote}
        </div>
        {!!vm.dr.isCurrent && (<>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary" onClick={vm.askScouts} disabled={vm.dr.noAdvice} style={{ whiteSpace: "nowrap" }}>
              Ask scouts
            </button>
            <button className="btn btn-secondary" onClick={vm.askAgm} disabled={vm.dr.noAdvice} style={{ whiteSpace: "nowrap" }}>
              Ask assistant GM
            </button>
          </div>
        </>)}
      </div>
      {!!vm.dr.isCurrent && (<>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "10px 14px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)" }}>
          <div style={{ flex: "1" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: "600" }}>
              {vm.dr.status}
            </span>
            {" "}
            <span style={{ color: "var(--color-neutral-700)", marginLeft: "8px" }}>
              {vm.dr.sub}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={vm.simToMine} disabled={vm.dr.noSimMine} style={{ whiteSpace: "nowrap", flex: "none" }}>
            Sim to my pick
          </button>
          <button className="btn btn-secondary" onClick={vm.simAll} disabled={vm.dr.done} style={{ whiteSpace: "nowrap", flex: "none" }}>
            Auto-draft the rest
          </button>
        </div>
      </>)}
      {!!vm.dr.hasAdvice && (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "16px", marginBottom: "18px" }}>
          {(vm.dr.advice || []).map((a: any, i: number) => (
            <div key={i} className="card" style={{ padding: "14px 16px" }}>
              <div className="card-kicker" style={{ color: "var(--color-accent-700)" }}>
                {a.who}
              </div>
              <button className="hv1" onClick={a.open} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "600", lineHeight: "1.1" }}>
                {a.name}
              </button>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {a.meta}
              </div>
              <p style={{ margin: "4px 0 0", textAlign: "justify", hyphens: "auto" }}>
                {a.why}
              </p>
              {!!a.canDraft && (<>
                <div>
                  <button className="btn btn-primary" onClick={a.draft} style={{ fontSize: "13px" }}>
                    Draft {a.name}
                  </button>
                </div>
              </>)}
            </div>
          ))}
        </div>
      </>)}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,320px) minmax(0,1fr)", gap: "28px", alignItems: "start" }}>
        <section>
          {!!vm.dr.isCurrent && (<>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              First round
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "calc(100vh - 260px)", overflowY: "auto", paddingRight: "4px" }}>
              {(vm.dr.order || []).map((o: any, i: number) => (
                <div key={i} ref={o.onClock ? (el => { const box = el?.parentElement; if (el && box && box.dataset.at !== String(o.n)) { box.dataset.at = String(o.n); box.scrollTop = el.offsetTop - box.offsetTop - 90; } }) : undefined} style={{ display: "grid", gridTemplateColumns: "30px 30px minmax(0,1fr)", gap: "10px", alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-md)", border: o.onClock ? "1px solid var(--color-accent)" : "1px solid var(--color-divider)", background: o.onClock ? "var(--color-accent-100)" : o.mine ? "color-mix(in srgb, var(--color-accent) 6%, transparent)" : "transparent" }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "20px", textAlign: "right", color: o.onClock ? "var(--color-accent-700)" : "var(--color-neutral-600)" }}>{o.n}</span>
                  <button onClick={o.openT} title={o.team} style={{ all: "unset", cursor: "pointer" }}>{o.logoLg}</button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "baseline", fontSize: "13px", color: o.mine ? "var(--color-accent-700)" : "var(--color-text)", fontWeight: o.mine ? 600 : 400 }}>
                      <button className="hv4" onClick={o.openT} style={{ all: "unset", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.team}</button>
                      {o.via && <span style={{ fontSize: "11px", color: "var(--color-neutral-600)", whiteSpace: "nowrap" }}>{o.via}</span>}
                    </div>
                    {o.pid ? (
                      <div style={{ fontSize: "12.5px", lineHeight: 1.35 }}>
                        <button className="hv1" onClick={o.openP} style={{ all: "unset", cursor: "pointer", fontWeight: 600 }}>{o.who}</button>
                        <div style={{ fontSize: "11.5px", color: "var(--color-neutral-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.pmeta}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", fontStyle: "italic", color: o.onClock ? "var(--color-accent-700)" : "var(--color-neutral-600)" }}>{o.onClock ? "On the clock" : "Pick " + o.n}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>)}
          {!!vm.dr.isFuture && (<>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              Your picks
            </h4>
            {(vm.dr.myFuture || []).map((k: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 2px", borderBottom: "1px solid var(--color-divider)" }}>
                <span>
                  {k.label}
                </span>
                <span style={{ color: "var(--color-neutral-700)" }}>
                  {k.proj}
                </span>
              </div>
            ))}
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              {vm.dr.scoutLine}
            </p>
          </>)}
        </section>
        <section>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                {(vm.draftCols || []).map((c: any, i: number) => (
                  <th key={i} onClick={c.onClick} style={{ padding: "6px 8px", textAlign: c.align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: c.color }}>
                    {c.label}{c.arrow}
                  </th>
                ))}
                <th style={{ padding: "6px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {(vm.draftRows || []).map((p: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: "var(--color-neutral-700)" }}>
                    {p.rank}
                  </td>
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
                  <td style={{ padding: "4px 8px" }}>
                    {p.fromT}{" "}
                    <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                      {p.fromL}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right" }}>
                    {p.hgt}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: p.tone, fontWeight: "600", whiteSpace: "nowrap" }}>
                    {p.ovrS}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: p.ptone, fontWeight: "600", whiteSpace: "nowrap" }}>
                    {p.potS}
                  </td>
                  <td style={{ padding: "3px 8px", textAlign: "right" }}>
                    {!!p.showDraft && (<>
                      <button className="btn btn-primary" onClick={p.draft} disabled={p.cant} style={{ fontSize: "12px", padding: "3px 12px" }}>
                        Draft
                      </button>
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
