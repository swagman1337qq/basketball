import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';

export function ShortlistScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "20px" }}>
        <input className="input" value={vm.newList} onChange={vm.onNewList} placeholder="New category, e.g. Only if under $3M" style={{ maxWidth: "360px", minHeight: "34px", fontSize: "13px" }} />
        <button className="btn btn-primary" onClick={vm.addList} disabled={vm.noNewList} style={{ whiteSpace: "nowrap" }}>
          Add category
        </button>
        <span style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>
          Add players from any player page.
        </span>
      </div>
      {!!vm.noLists && (<>
        <p style={{ fontStyle: "italic", color: "var(--color-neutral-700)" }}>
          No categories yet. Create one above.
        </p>
      </>)}
      {(vm.shortlists || []).map((l: any, i: number) => (
        <section key={i} style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "10px", borderBottom: "1px solid var(--color-text)", paddingBottom: "3px" }}>
            <h4 style={{ margin: "0", fontSize: "19px" }}>
              {l.name}
            </h4>
            <span style={{ flex: "1", color: "var(--color-neutral-700)" }}>
              {l.count}
            </span>
            <button className="btn btn-ghost" onClick={l.del} style={{ fontSize: "12px" }}>
              Delete category
            </button>
          </div>
          {!!l.empty && (<>
            <p style={{ fontStyle: "italic", color: "var(--color-neutral-700)", margin: "8px 0" }}>
              Nobody here yet. Open a player and tap this category.
            </p>
          </>)}
          <ListTable vm={vm} rows={l.rows || []} />
        </section>
      ))}
    </>
  );
}


function ListTable({ vm, rows }: { vm: VM; rows: any[] }) {
  const srt = useSort<any>(rows, { name: r => byLast(vm.ctx.gm.db.P[r.id] || r), team: r => r.team, pos: r => r.pos, age: r => r.age, ovr: r => r.ovr, pot: r => r.pot, money: r => parseFloat(String(r.money).replace(/[^0-9.]/g, '')) || 0 });
  return (
    <table className="table" style={{ fontSize: "13px" }}>
      <thead><tr>{srt.head('name', 'Player')}{srt.head('team', 'Team')}{srt.head('pos', 'Pos')}{srt.head('age', 'Age', 'right')}{srt.head('ovr', 'Ovr', 'right')}{srt.head('pot', 'Pot', 'right')}{srt.head('money', 'Contract / ask', 'right')}<th></th></tr></thead>
      <tbody>
        {srt.rows.map((p: any, i: number) => (
          <tr key={i} onClick={p.open} style={{ cursor: "pointer" }}>
            <td style={{ padding: "5px 8px" }}>
              <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                <span style={{ color: "var(--color-accent-700)" }}>
                  {p.name}
                </span>
              </span>
            </td>
            <td style={{ padding: "5px 8px" }}>
              <button className="hv4" onClick={p.openT} style={{ all: "unset", cursor: "pointer" }}>
                {p.team}
              </button>
            </td>
            <td style={{ padding: "5px 8px" }}>
              {p.pos}
            </td>
            <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              {p.age}
            </td>
            <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.tone, fontWeight: "600" }}>
              {p.ovr}
            </td>
            <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.ptone }}>
              {p.pot}
            </td>
            <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              {p.money}
            </td>
            <td style={{ padding: "3px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
              <button className="btn btn-ghost" onClick={p.remove} style={{ fontSize: "12px" }}>
                Remove
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
