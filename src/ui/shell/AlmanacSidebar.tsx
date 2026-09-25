import type { VM } from '../vm';

export function AlmanacSidebar({ vm }: { vm: VM }) {
  return (
    <>
      <aside style={{ width: "224px", flex: "none", display: "flex", flexDirection: "column", gap: "14px", padding: "18px 18px", background: "var(--color-surface)", borderRight: "1px solid var(--color-divider)", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box" }}>
        <div>
          <div style={{ marginBottom: "10px" }}>
            {vm.myLogo}
          </div>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            Front office
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "25px", fontWeight: "600", lineHeight: "1.1", marginTop: "4px" }}>
            {vm.myName}
          </div>
          <div style={{ color: "var(--color-neutral-700)", marginTop: "2px" }}>
            {vm.recordLine}
          </div>
          {!!vm.switcher.show && (
            <select className="input" aria-label="Switch team" value={vm.switcher.value} onChange={vm.switcher.set} style={{ marginTop: "6px", minHeight: "28px", fontSize: "12px", padding: "2px 6px" }}>
              {vm.switcher.opts.map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <button className="btn btn-primary" onClick={vm.play1} style={{ width: "100%" }}>
            Play next game
          </button>
          <button className="btn btn-secondary" onClick={vm.play7} style={{ width: "100%" }}>
            Play one week
          </button>
        </div>
        {(vm.navGroups || []).map((g: any, i: number) => (
          <div key={i} style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-600)", padding: "0 0 4px", borderBottom: "1px solid var(--color-divider)", marginBottom: "4px" }}>
              {g.label}
            </div>
            {(g.items || []).map((n: any, i: number) => (
              <button key={i} className="hv1" onClick={n.go} style={{ all: "unset", boxSizing: "border-box", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "3px 0", fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: n.fw, color: n.color }}>
                <span style={{ width: "5px", height: "5px", transform: "rotate(45deg)", background: n.dot, flex: "none" }}></span>
                {n.label}
              </button>
            ))}
          </div>
        ))}
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px", color: "var(--color-neutral-700)", fontSize: "12px" }}>
          <span>
            {vm.dateLong}
          </span>
          <button className="btn btn-ghost" onClick={vm.toggleTheme} style={{ fontSize: "12px", paddingLeft: "0" }}>
            {vm.themeLabel}
          </button>
        </div>
      </aside>
    </>
  );
}
