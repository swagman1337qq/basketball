import type { VM } from '../vm';
import { LeagueMenu } from '../LeagueMenu';
import { PlayerSearch } from '../PlayerSearch';

export function DeskTopbar({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ height: "56px", flex: "none", display: "flex", alignItems: "center", gap: "16px", padding: "0 24px", borderBottom: "1px solid var(--color-divider)", position: "relative", zIndex: "5" }}>
        <PlayerSearch vm={vm} width={360} />
        <div style={{ flex: "1" }}></div>
        {!!vm.switcher.show && (
            <select className="input" aria-label="Switch team" value={vm.switcher.value} onChange={vm.switcher.set} style={{ maxWidth: "220px", minHeight: "28px", fontSize: "12px", padding: "2px 6px" }}>
              {vm.switcher.opts.map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}
            </select>
          )}
        <div style={{ color: "var(--color-neutral-700)" }}>
          {vm.dateLong}
        </div>
        <LeagueMenu vm={vm} bar />
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
