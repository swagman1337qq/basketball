import type { VM } from '../vm';
import { useSort } from '../sortable';

export function StandingsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", marginBottom: "16px" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {(vm.standSegs || []).map((sg: any, i: number) => (
            <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", color: sg.color, boxShadow: sg.ring }}>
              {sg.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "28px 32px" }}>
        {(vm.standGroups || []).map((g: any, i: number) => <Group key={g.label} g={g} />)}
      </div>
      {!!vm.standConf && (<>
        <p style={{ margin: "12px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
          Solid rule: the top six seeds go straight to the playoffs. Dashed rule: seeds 7–10 go to the play-in.
        </p>
      </>)}
    </>
  );
}

// One conference or division. Click a header to sort; the playoff lines show in seed order.
const wl = (x: string) => { const [w, l] = String(x).split('–').map(Number); return w + l ? w / (w + l) : 0; };
function Group({ g }: { g: any }) {
  const srt = useSort<any>(g.rows || [], { seed: r => -r.seed, name: r => r.name, w: r => r.w, l: r => r.l, pct: r => parseFloat(r.pct) || 0, gb: r => r.gb === '—' ? 0 : -parseFloat(r.gb), home: r => wl(r.home), road: r => wl(r.road), l10: r => wl(r.l10), strk: r => (String(r.strk)[0] === 'W' ? 1 : -1) * (parseInt(String(r.strk).slice(1)) || 0) });
  return (
    <section>
      <h4 style={{ margin: "0 0 2px", fontSize: "19px" }}>
        {g.label}
      </h4>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            {srt.head('seed', '#')}{srt.head('name', 'Team')}{srt.head('w', 'W', 'right')}{srt.head('l', 'L', 'right')}{srt.head('pct', 'Pct', 'right')}{srt.head('gb', 'GB', 'right')}{srt.head('home', 'Home', 'right')}{srt.head('road', 'Road', 'right')}{srt.head('l10', 'L10', 'right')}{srt.head('strk', 'Strk', 'right')}
          </tr>
        </thead>
        <tbody>
          {srt.rows.map((t: any, i: number) => (
            <tr key={i} style={{ background: t.bg }}>
              <td style={{ padding: "4px 6px", color: "var(--color-neutral-700)", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.seed}
              </td>
              <td style={{ padding: "4px 6px", fontWeight: t.fw, whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                <button className="hv4" onClick={t.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  {t.logo}
                  {t.name}
                </button>
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.w}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.l}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.pct}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.gb}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.home}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.road}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.l10}
              </td>
              <td style={{ padding: "4px 6px", textAlign: "right", whiteSpace: "nowrap", borderBottom: srt.sortKey ? undefined : t.line }}>
                {t.strk}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
