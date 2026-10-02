import { usePaged } from '../kit';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';

export function ListModal({ vm }: { vm: VM }) {
  const srt = useSort<any>(vm.lm.rows || [], { name: byLast, team: r => r.team, drafted: r => r.draftedBy || '', pos: r => r.pos, age: r => r.age, ovr: r => r.ovr, pot: r => r.pot, extra: r => r.extra, pts: r => r.sPts ?? -1, reb: r => r.sReb ?? -1, ast: r => r.sAst ?? -1, stl: r => r.sStl ?? -1, blk: r => r.sBlk ?? -1, per: r => r.sPer ?? -99 });
  const pg = usePaged(srt.rows, 'players', 25, srt.sortKey);
  return (
    <>
      <div onClick={vm.closeList} style={{ position: "absolute", inset: "0", zIndex: "14", display: "grid", placeItems: "center", padding: "26px", background: "rgba(0,0,0,.55)" }}>
        <div onClick={vm.stop} style={{ width: "min(1180px,100%)", maxHeight: "100%", overflow: "auto", boxSizing: "border-box", background: "var(--color-bg)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "22px 26px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", borderBottom: "1px solid var(--color-divider)", paddingBottom: "10px", marginBottom: "12px" }}>
            {!!vm.lm.hasFlag && (<>
              <img src={vm.lm.flag} alt="" style={{ width: "42px", height: "28px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
            </>)}
            <div style={{ flex: "1" }}>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "32px", lineHeight: "1.05" }}>
                {vm.lm.title}
              </div>
              <div style={{ color: "var(--color-neutral-700)" }}>
                {vm.lm.sub}
              </div>
            </div>
            <button className="btn btn-ghost" onClick={vm.closeList} style={{ fontSize: "13px" }}>
              Close
            </button>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                {srt.head('name', 'Player')}{srt.head('team', vm.lm.drafted ? 'Current team' : 'Team')}{vm.lm.drafted && srt.head('drafted', 'Drafted by')}{srt.head('pos', 'Pos')}{srt.head('age', 'Age', 'right')}{srt.head('ovr', 'Ovr', 'right')}{srt.head('pot', 'Pot', 'right')}{srt.head('pts', 'PPG', 'right')}{srt.head('reb', 'RPG', 'right')}{srt.head('ast', 'APG', 'right')}{srt.head('stl', 'SPG', 'right')}{srt.head('blk', 'BPG', 'right')}{srt.head('per', 'PER', 'right')}{srt.head('extra', vm.lm.extraH)}
              </tr>
            </thead>
            <tbody>
              {pg.rows.map((p: any, i: number) => (
                <tr key={i} onClick={p.open} style={{ cursor: "pointer" }}>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <span style={{ color: "var(--color-accent-700)" }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                        {p.native}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <button className="hv4" onClick={p.openT} style={{ all: "unset", cursor: "pointer" }}>
                      {p.team}
                    </button>
                  </td>
                  {vm.lm.drafted && <td style={{ padding: "4px 8px" }}><button className="hv4" onClick={p.openD} style={{ all: "unset", cursor: "pointer" }}>{p.draftedBy}</button></td>}
                  <td style={{ padding: "4px 8px" }}>
                    {p.pos}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.age}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.tone, fontWeight: "600" }}>
                    {p.ovr}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.ptone }}>
                    {p.pot}
                  </td>
                  {['sPts', 'sReb', 'sAst', 'sStl', 'sBlk', 'sPer'].map(k => <td key={k} title={p.sGp ? p.sGp + ' games' + (p.sYr ? ' in ' + p.sYr : ' this season') : 'No NBA games yet'} style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', color: p.sYr ? 'var(--color-neutral-600)' : undefined, fontVariantNumeric: 'tabular-nums' }}>{p.sGp ? p[k].toFixed(1) : '—'}</td>)}
                  <td style={{ padding: "4px 8px", color: "var(--color-neutral-700)" }}>
                    {p.extra}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: 'var(--color-neutral-600)' }}>Per game this regular season; in grey, his latest earlier season (hover for which). PER: player efficiency, 15 is average.</p>
          {pg.pager}
        </div>
      </div>
    </>
  );
}
