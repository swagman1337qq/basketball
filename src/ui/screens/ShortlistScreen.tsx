import { useState } from 'react';
import { usePaged, PN } from '../kit';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { useScoutSelect } from '../ScoutSelect';

let lastPick = ''; // the shortlist last shown, kept while the game is open
export function ShortlistScreen({ vm }: { vm: VM }) {
  const [pick, setPick0] = useState(lastPick), setPick = (id: string) => { lastPick = id; setPick0(id); };
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
      {/* One shortlist at a time (2026-10-30), picked from the dropdown; the choice is remembered while the game is open. */}
      {(() => { const ls: any[] = vm.shortlists || [], l = ls.find(x => x.id === pick) || ls[0]; if (!l) return null; return (
        <section key={l.id} style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid var(--color-text)", paddingBottom: "5px", flexWrap: "wrap" }}>
            <select className="input" value={l.id} onChange={e => setPick(e.target.value)} title="Choose which shortlist to show" style={{ width: "auto", fontSize: "16px", fontFamily: "var(--font-heading)", padding: "3px 10px" }}>
              {ls.map(x => <option key={x.id} value={x.id}>{x.name} ({x.count})</option>)}
            </select>
            <span style={{ flex: "1" }} />
            <button className="btn btn-ghost" onClick={() => { l.del(); setPick(''); }} style={{ fontSize: "12px" }}>
              Delete category
            </button>
          </div>
          {!!l.empty && (<>
            <p style={{ fontStyle: "italic", color: "var(--color-neutral-700)", margin: "8px 0" }}>
              Nobody here yet. Add players from their profile, or pick several players on the draft board, free agency or overseas and right-click.
            </p>
          </>)}
          <ListTable vm={vm} rows={l.rows || []} />
        </section>); })()}
    </>
  );
}


function ListTable({ vm, rows }: { vm: VM; rows: any[] }) {
  const srt = useSort<any>(rows, { name: r => byLast(vm.ctx.gm.db.P[r.id] || r), team: r => r.team, pos: r => r.pos, age: r => r.age, ovr: r => r.ovr, pot: r => r.pot, money: r => parseFloat(String(r.money).replace(/[^0-9.]/g, '')) || 0 });
  const sc = useScoutSelect(vm, srt.rows.map((p: any) => p.id));
  const pg = usePaged(srt.rows, 'players', 25, srt.sortKey);
  return (<>
    {sc.bar()}{sc.Menu()}
    <table className="table" style={{ fontSize: "13px" }}>
      <thead><tr>{sc.head()}{srt.head('name', 'Player')}{srt.head('team', 'Team')}{srt.head('pos', 'Pos')}{srt.head('age', 'Age', 'right')}{srt.head('ovr', 'Ovr', 'right')}{srt.head('pot', 'Pot', 'right')}{srt.head('money', 'Contract / ask', 'right')}<th></th></tr></thead>
      <tbody>
        {pg.rows.map((p: any, i: number) => (
          <tr key={i} {...sc.row(p.id)} style={{ userSelect: "none", background: sc.isSel(p.id) ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined }}>
            {sc.cell(p.id)}
            <td style={{ padding: "5px 8px" }}>
              <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                <span title={p.name} data-pid={p.id} onClick={p.open} style={{ color: "var(--color-accent-700)", cursor: "pointer", ...PN }}>
                  {p.name}
                </span>
                {sc.tag(p.id)}
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
          {pg.pager}
  </>);
}
