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
