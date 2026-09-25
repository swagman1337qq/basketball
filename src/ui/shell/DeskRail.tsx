import type { VM } from '../vm';

export function DeskRail({ vm }: { vm: VM }) {
  return (
    <>
      <nav style={{ width: "60px", flex: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "14px 0", borderRight: "1px solid var(--color-divider)", overflowY: "auto" }}>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", color: "var(--color-accent-700)", paddingBottom: "10px", marginBottom: "6px", borderBottom: "1px solid var(--color-divider)" }}>
          BAL
        </div>
        {(vm.nav || []).map((n: any, i: number) => (
          <button key={i} className="hv2" onClick={n.go} title={n.label} style={{ all: "unset", cursor: "pointer", width: "40px", height: "40px", display: "grid", placeItems: "center", borderRadius: "var(--radius-md)", color: n.color, boxShadow: n.ring }}>
            {n.icon}
          </button>
        ))}
      </nav>
    </>
  );
}
