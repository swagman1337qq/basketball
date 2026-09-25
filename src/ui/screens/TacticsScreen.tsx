import type { VM } from '../vm';

export function TacticsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "36px", alignItems: "start" }}>
        <section>
          <h4 style={{ margin: "0 0 6px", fontSize: "19px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Tactical identity
          </h4>
          {(vm.tacV.groups || []).map((g: any, i: number) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ width: "90px", fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600" }}>
                  {g.label}
                </span>
                <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
                  {(g.opts || []).map((o: any, i: number) => (
                    <button key={i} onClick={o.onClick} style={{ all: "unset", cursor: "pointer", padding: "5px 12px", fontSize: "13px", whiteSpace: "nowrap", color: o.color, boxShadow: o.ring }}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)", marginTop: "4px" }}>
                {g.desc}
              </div>
            </div>
          ))}
          <p style={{ margin: "12px 0 0", fontWeight: "600" }}>
            {vm.tacV.fit}
          </p>
        </section>
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px", marginBottom: "4px" }}>
            <h4 style={{ margin: "0", fontSize: "19px" }}>
              Rotation minutes
            </h4>
            <span>
              {vm.tacV.total} of 240
            </span>
          </div>
          {(vm.tacV.rot || []).map((r: any, i: number) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 70px minmax(0,1fr) 56px", gap: "10px", alignItems: "center", padding: "3px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <span>
                {r.name}{" "}
                <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                  {r.pos}
                </span>
              </span>
              <span style={{ fontSize: "11px", color: "var(--color-accent-700)" }}>
                {r.tag}
              </span>
              <input type="range" min="0" max="42" step="1" value={r.v} onChange={r.set} disabled={r.dis} style={{ width: "100%", accentColor: "var(--color-accent)" }} />
              <span style={{ textAlign: "right" }}>
                {r.val}
              </span>
            </div>
          ))}
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Minutes drive stats, development and happiness. Starting order comes from the Roster screen.
          </p>
        </section>
      </div>
    </>
  );
}
