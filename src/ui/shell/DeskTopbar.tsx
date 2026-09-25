import type { VM } from '../vm';

export function DeskTopbar({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ height: "56px", flex: "none", display: "flex", alignItems: "center", gap: "16px", padding: "0 24px", borderBottom: "1px solid var(--color-divider)", position: "relative", zIndex: "5" }}>
        <div style={{ position: "relative", width: "360px" }}>
          <div style={{ position: "absolute", left: "10px", top: "9px", color: "var(--color-neutral-600)" }}>
            {vm.searchIcon}
          </div>
          <input className="input" value={vm.q} onChange={vm.onSearch} placeholder="Jump to any player…" style={{ paddingLeft: "34px", minHeight: "34px", fontSize: "13px" }} />
          {!!vm.hasMatches && (<>
            <div style={{ position: "absolute", top: "40px", left: "0", right: "0", background: "var(--color-bg)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", padding: "4px 0" }}>
              {(vm.matches || []).map((m: any, i: number) => (
                <button key={i} className="hv3" onClick={m.open} style={{ all: "unset", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", width: "100%", boxSizing: "border-box", padding: "7px 12px" }}>
                  <img src={m.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                  <span style={{ flex: "1" }}>
                    {m.name}
                  </span>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    {m.meta}
                  </span>
                </button>
              ))}
            </div>
          </>)}
        </div>
        <div style={{ flex: "1" }}></div>
        {!!vm.switcher.show && (
            <select className="input" aria-label="Switch team" value={vm.switcher.value} onChange={vm.switcher.set} style={{ maxWidth: "220px", minHeight: "28px", fontSize: "12px", padding: "2px 6px" }}>
              {vm.switcher.opts.map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          )}
        <div style={{ color: "var(--color-neutral-700)" }}>
          {vm.dateLong}
        </div>
        <button className="btn btn-ghost" onClick={vm.toggleTheme} style={{ whiteSpace: "nowrap", fontSize: "13px" }}>
          {vm.themeLabel}
        </button>
        <div style={{ fontFamily: "var(--font-heading)", fontSize: "20px", fontWeight: "600" }}>
          {vm.recordShort}
        </div>
      </div>
    </>
  );
}
