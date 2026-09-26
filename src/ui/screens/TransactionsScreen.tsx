import type { VM } from '../vm';
import { useSort } from '../sortable';

export function TransactionsScreen({ vm }: { vm: VM }) {
  const rows0 = (vm.txRows || []).map((r: any, i: number) => ({ ...r, _i: i }));
  const srt = useSort<any>(rows0, { date: r => -r._i, type: r => r.type, teams: r => (r.teamLinks || []).map((k: any) => k.abbr).join(' '), text: r => r.text });
  return (
    <>
      <div style={{ display: "flex", marginBottom: "14px" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {(vm.txSegs || []).map((sg: any, i: number) => (
            <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", color: sg.color, boxShadow: sg.ring }}>
              {sg.label}
            </button>
          ))}
        </div>
      </div>
      <table className="table" style={{ fontSize: "13px" }}>
        <thead>
          <tr>
            {srt.head('date', 'Date')}{srt.head('type', 'Type')}{srt.head('teams', 'Teams')}{srt.head('text', 'Move')}
          </tr>
        </thead>
        <tbody>
          {srt.rows.map((r: any, i: number) => (
            <tr key={i} style={{ background: r.bg }}>
              <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)", whiteSpace: "nowrap" }}>
                {r.date}
              </td>
              <td style={{ padding: "5px 8px" }}>
                {r.type}
              </td>
              <td style={{ padding: "5px 8px", whiteSpace: "nowrap" }}>
                <span style={{ display: "inline-flex", gap: "6px" }}>
                  {(r.teamLinks || []).map((k: any, i: number) => (
                    <button key={i} className="hv4" onClick={k.open} style={{ all: "unset", cursor: "pointer" }}>
                      {k.abbr}
                    </button>
                  ))}
                </span>
              </td>
              <td style={{ padding: "5px 8px" }}>
                {r.text}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ margin: "10px 0 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
        Your moves are shaded. Click a column to sort (Date: newest or oldest first). Other teams sign, trade and waive players as days pass.
      </p>
    </>
  );
}
