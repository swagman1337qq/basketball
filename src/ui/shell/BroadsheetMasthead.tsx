import type { VM } from '../vm';

export function BroadsheetMasthead({ vm }: { vm: VM }) {
  return (
    <>
      <header style={{ padding: "18px 28px 0", borderBottom: "1px solid var(--color-text)" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "28px", paddingBottom: "12px", borderBottom: "1px solid var(--color-divider)" }}>
          {vm.myLogoLg}
          <div style={{ flex: "1", minWidth: "0", marginLeft: "-12px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
              {vm.dateLong} · {vm.phaseLabel}
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "42px", fontWeight: "400", lineHeight: "1", marginTop: "4px", letterSpacing: "-.015em" }}>
              The {vm.myName}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "30px", lineHeight: "1" }}>
              {vm.recordShort}
            </div>
            <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
              {vm.seedLine}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-ghost" onClick={vm.toggleTheme} style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
              {vm.themeLabel}
            </button>
            <button className="btn btn-secondary" onClick={vm.play7} style={{ whiteSpace: "nowrap" }}>
              Play week
            </button>
            <button className="btn btn-primary" onClick={vm.play1} style={{ whiteSpace: "nowrap" }}>
              Play next game
            </button>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", columnGap: "20px" }}>
          {(vm.nav || []).map((n: any, i: number) => (
            <button key={i} className="hv1" onClick={n.go} style={{ all: "unset", cursor: "pointer", whiteSpace: "nowrap", padding: "10px 0 9px", fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: n.fw, color: n.color, borderBottom: `2px solid ${n.ul ?? ""}`, marginBottom: "-1px" }}>
              {n.label}
            </button>
          ))}
        </div>
      </header>
    </>
  );
}
