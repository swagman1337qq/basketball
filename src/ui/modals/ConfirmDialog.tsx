import type { VM } from '../vm';

export function ConfirmDialog({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ position: "absolute", inset: "0", display: "grid", placeItems: "center", background: "color-mix(in srgb, var(--color-neutral-900) 45%, transparent)", zIndex: "20" }} onClick={vm.closeDialog}>
        <div className="dialog" onClick={vm.stop}>
          <div className="dialog-title">
            {vm.dlg.title}
          </div>
          <div className="dialog-body">
            {vm.dlg.body}
          </div>
          {!!vm.dlg.inc && (
            <div style={{ margin: "4px 0 12px", fontSize: "12.5px" }}>
              <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)", marginBottom: "4px" }}>Incentives (optional)</div>
              {vm.dlg.inc.map((o: any) => (
                <label key={o.k} style={{ display: "flex", gap: "8px", alignItems: "center", padding: "3px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={o.on} onChange={o.toggle} />
                  <span style={{ flex: 1 }}>{o.label}</span>
                  <span>{o.amtS}</span>
                  <span style={{ fontSize: "11px", width: "62px", textAlign: "right", color: o.likely ? "var(--color-accent-700)" : "var(--color-neutral-600)" }}>{o.likely ? "Likely" : "Unlikely"}</span>
                </label>
              ))}
              <div style={{ fontSize: "11.5px", color: "var(--color-neutral-700)", marginTop: "4px" }}>Likely bonuses (met last season) count against the cap now; unlikely ones don’t, but the player values them at 60%, so the base drops less.</div>
            </div>
          )}
          <div className="dialog-actions">
            <button className="btn btn-secondary" onClick={vm.closeDialog}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={vm.dlg.confirm}>
              {vm.dlg.cta}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
