import type { VM } from '../vm';
import { LeagueMenu } from '../LeagueMenu';

// Collapsed: a narrow rail of icons, each with its name underneath (and on hover).
function Rail({ vm }: { vm: VM }) {
  const tiny = { fontSize: "9.5px", lineHeight: 1.1, textAlign: "center" as const, maxWidth: "70px" };
  return (
    <aside style={{ width: "78px", flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "10px 0", background: "var(--color-surface)", borderRight: "1px solid var(--color-divider)", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box" }}>
      <button className="hv2" onClick={vm.toggleNav} title="Expand the menu" aria-label="Expand the menu" style={{ all: "unset", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "4px 6px", borderRadius: "var(--radius-md)", color: "var(--color-accent-700)" }}>
        <span style={{ fontSize: "18px", lineHeight: 1 }}>»</span><span style={tiny}>Expand</span>
      </button>
      <div title={vm.myName} style={{ padding: "6px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>{vm.myLogoSm}<span style={{ ...tiny, fontWeight: 600 }}>{vm.myAbbr}</span></div>
      <LeagueMenu vm={vm} compact />
      <button className="btn btn-primary" onClick={vm.play1} title="Play next game" style={{ width: "66px", padding: "4px 0", fontSize: "11px" }}>▶ Game</button>
      <button className="btn btn-secondary" onClick={vm.play7} title="Play one week" style={{ width: "66px", padding: "4px 0", fontSize: "11px", marginBottom: "4px" }}>▶▶ Week</button>
      {(vm.navGroups || []).map((g: any, gi: number) => (
        <div key={gi} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1px", width: "100%", borderTop: "1px solid var(--color-divider)", paddingTop: "4px", marginTop: "2px" }}>
          <span style={{ ...tiny, fontSize: "8.5px", letterSpacing: ".08em", textTransform: "uppercase", color: "var(--color-neutral-600)" }}>{g.label}</span>
          {(g.items || []).map((n: any, i: number) => (
            <button key={i} className="hv2" onClick={n.go} title={n.label} aria-label={n.label} style={{ all: "unset", boxSizing: "border-box", cursor: "pointer", width: "72px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "5px 2px", borderRadius: "var(--radius-md)", color: n.color, boxShadow: n.ring }}>
              {n.icon}<span style={{ ...tiny, fontWeight: n.fw }}>{n.label}</span>
            </button>
          ))}
        </div>
      ))}
      <button className="btn btn-ghost" onClick={vm.toggleTheme} title={vm.themeLabel} style={{ fontSize: "10px", marginTop: "auto", padding: "4px" }}>{String(vm.themeLabel).replace(/ mode$/i, "")}</button>
    </aside>
  );
}

export function AlmanacSidebar({ vm }: { vm: VM }) {
  if (vm.navCollapsed) return <Rail vm={vm} />;
  return (
    <>
      <aside style={{ width: "224px", flex: "none", display: "flex", flexDirection: "column", gap: "14px", padding: "18px 18px", background: "var(--color-surface)", borderRight: "1px solid var(--color-divider)", overflowY: "auto", overflowX: "hidden", boxSizing: "border-box" }}>
        <div>
          <div style={{ marginBottom: "10px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {vm.myLogo}
            <button className="btn btn-ghost" onClick={vm.toggleNav} title="Collapse the menu to icons" aria-label="Collapse the menu" style={{ fontSize: "12px", padding: "2px 8px" }}>« Collapse</button>
          </div>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            Basketball Manager
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "25px", fontWeight: "600", lineHeight: "1.1", marginTop: "4px" }}>
            {vm.myName}
          </div>
          <div style={{ color: "var(--color-neutral-700)", marginTop: "2px" }}>
            {vm.recordLine}
          </div>
          {!!vm.gmName && <div style={{ color: "var(--color-neutral-700)", fontSize: "12px", marginTop: "2px" }}>GM {vm.gmName}</div>}
          {!!vm.switcher.show && (
            <select className="input" aria-label="Switch team" value={vm.switcher.value} onChange={vm.switcher.set} style={{ marginTop: "6px", minHeight: "28px", fontSize: "12px", padding: "2px 6px" }}>
              {vm.switcher.opts.map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          )}
        </div>
        <LeagueMenu vm={vm} />
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
              <button key={i} className="hv1" onClick={n.go} style={{ all: "unset", boxSizing: "border-box", width: "100%", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", padding: "4px 0", fontFamily: "var(--font-body)", fontSize: "14px", fontWeight: n.fw === 600 ? 600 : 500, color: n.color }}>
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
