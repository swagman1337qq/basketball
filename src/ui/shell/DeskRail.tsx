import type { VM } from '../vm';

export function DeskRail({ vm }: { vm: VM }) {
  return (
    <>
      <nav style={{ width: "66px", flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "14px 0", borderRight: "1px solid var(--color-divider)", overflowY: "auto" }}>
        <div title={vm.myName} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", fontFamily: "var(--font-heading)", fontSize: "14px", fontWeight: "600", color: "var(--color-accent-700)", paddingBottom: "10px", marginBottom: "6px", borderBottom: "1px solid var(--color-divider)" }}>
          {vm.myLogoSm}
          {vm.myAbbr}
        </div>
        {(vm.nav || []).map((n: any, i: number) => (
          <button key={i} className="hv2" onClick={n.go} title={n.label} aria-label={n.label} style={{ all: "unset", cursor: "pointer", width: "58px", padding: "4px 1px", boxSizing: "border-box", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", borderRadius: "var(--radius-md)", color: n.color, boxShadow: n.ring }}>
            {n.icon}<span style={{ fontSize: "9px", lineHeight: 1.1, textAlign: "center" }}>{n.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
