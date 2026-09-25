import type { VM } from '../vm';

export function SettingsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section style={{ maxWidth: "900px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Appearance
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            Dark or light theme.
          </div>
          <button className="btn btn-secondary" onClick={vm.toggleTheme} style={{ whiteSpace: "nowrap" }}>
            {vm.themeLabel}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Layout
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            {vm.layout.desc}
          </div>
          <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            {(vm.layout.segs || []).map((sg: any, i: number) => (
              <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", whiteSpace: "nowrap", color: sg.color, boxShadow: sg.ring }}>
                {sg.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Save file
          </div>
          <div>
            <div>
              {vm.save.name} · {vm.save.status}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Saved automatically in this browser. Export a copy to back it up or move it to another device.
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary" onClick={vm.save.onExport} style={{ whiteSpace: "nowrap" }}>
              Export
            </button>
            <button className="btn btn-secondary" onClick={vm.save.onExit} style={{ whiteSpace: "nowrap" }}>
              All leagues
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            God Mode
          </div>
          <div>
            <div>
              {vm.god.label}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Edit any player or team, move players anywhere, and make trades and signings without cap or salary-matching rules. IDs, engine formulas and past-season stats stay locked.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.god.toggle} style={{ whiteSpace: "nowrap" }}>
            {vm.god.btn}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Owner can fire you
          </div>
          <div>
            <div>
              {vm.firing.label}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Each owner’s firing conditions are listed on the Owner screen and checked when you end the season.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.firing.toggle} style={{ whiteSpace: "nowrap" }}>
            {vm.firing.btn}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            League expansion
          </div>
          <div>
            <div>
              {vm.settings.expLabel}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Two new teams join at the next preseason through an expansion draft. The schedule, lottery, draft pool and salary cap adjust.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.settings.toggleExp} disabled={vm.settings.expDis} style={{ whiteSpace: "nowrap" }}>
            {vm.settings.expBtn}
          </button>
        </div>
        <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", flex: "1" }}>
              Nationality mix for new players
            </div>
            <button className="btn btn-ghost" onClick={vm.resetNat} style={{ fontSize: "12px" }}>
              Reset to 1980–2026 history
            </button>
          </div>
          <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Weights are approximate counts of NBA players by nationality since 1980. They set how likely each country is for every newly generated player (draft classes, expansion). Click a country to see who represents it.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "0 24px" }}>
            {(vm.natRows || []).map((r: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr) 64px 80px", gap: "8px", alignItems: "center", padding: "3px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <img src={r.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                <button className="hv1" onClick={r.open} style={{ all: "unset", cursor: "pointer" }}>
                  {r.name}
                </button>
                <span style={{ textAlign: "right", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                  {r.share}
                </span>
                <input className="input" type="number" min="0" value={r.w} onChange={r.set} style={{ minHeight: "26px", fontSize: "12px", padding: "2px 6px" }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "16px", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Season format
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            82 games, a play-in for seeds 7–10, then four best-of-7 rounds. The offseason runs lottery, draft, free agency and preseason.
          </div>
        </div>
      </section>
    </>
  );
}
