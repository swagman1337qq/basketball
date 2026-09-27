import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { ScoutReportsSection } from './ScoutReportsSection';
import { BRIEF_AGE, BRIEF_FOCUS, BRIEF_POOL, BRIEF_POS } from '../../engine/scoutBrief';
import { PERSONAL_MAX } from '../../engine/overseas';

export function ScoutingScreen({ vm }: { vm: VM }) {
  const srtR = useSort<any>(vm.scoutRegions || [], { name: r => r.name, tier: r => String(r.tier), n: r => +r.n || 0, who: r => String(r.who), margin: r => -(parseFloat(String(r.margin).replace(/[^0-9.]/g, '')) || 0) });
  return (
    <>
      <ScoutReportsSection vm={vm} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) minmax(0,1fr)", gap: "32px", alignItems: "start" }}>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
            Regions
          </h4>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
{srtR.head('name', 'Region')}{srtR.head('tier', 'Talent')}<th style={{ padding: '6px 8px' }}>Typical prospects</th>{srtR.head('n', 'Prospects', 'right')}{srtR.head('who', 'Coverage')}{srtR.head('margin', 'Margin', 'right')}
</tr>
            </thead>
            <tbody>
              {srtR.rows.map((r: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "5px 8px" }}>
                    {r.name}
                  </td>
                  <td style={{ padding: "5px 8px" }}>
                    {r.tier}
                  </td>
                  <td style={{ padding: "5px 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                    {r.arche}
                  </td>
                  <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.n}
                  </td>
                  <td style={{ padding: "5px 8px", color: r.color }}>
                    {r.who}
                  </td>
                  <td style={{ padding: "5px 8px", fontSize: "12px", whiteSpace: "nowrap" }}>
                    {r.margin}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Prospects count across the next three draft classes. A scout working his own specialty narrows margins the most; unscouted regions carry the widest error.
          </p>
        </section>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
            Your scouts
          </h4>
          {(vm.scoutsV || []).map((x: any, i: number) => (
            <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600" }}>
                  {x.name}
                </span>
                <span style={{ color: "var(--color-accent-700)", letterSpacing: ".05em" }}>
                  {x.skill}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                Specialty: {x.spec} · {x.match}
              </div>
              <select className="input" value={x.assign || ''} onChange={x.set} style={{ marginTop: "4px", minHeight: "28px", fontSize: "12px", padding: "2px 6px" }} title="Region he covers: better reads on every prospect there">
                {(x.opts || []).map((o: any, i: number) => (
                  <option key={i} value={o.v}>
                    {o.label}
                  </option>
                ))}
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '12.5px', marginTop: 6, cursor: 'pointer' }} title="He picks the players he follows himself, every month, by his own read">
                <input type="checkbox" checked={!!x.brief.on} onChange={e => x.setBrief('on', e.target.checked)} /> Let him find players himself
              </label>
              {x.brief.on && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 4, marginTop: 4 }}>
                  <select className="input" value={x.brief.focus} onChange={e => x.setBrief('focus', e.target.value)} style={{ minHeight: 28, fontSize: '12px', padding: '2px 6px', gridColumn: '1 / -1' }} title={(BRIEF_FOCUS.find(f => f[0] === x.brief.focus) || [])[2]}>{BRIEF_FOCUS.map(([k, l]) => <option key={k} value={k}>Looking for: {l}</option>)}</select>
                  <select className="input" value={x.brief.pool} onChange={e => x.setBrief('pool', e.target.value)} style={{ minHeight: 28, fontSize: '12px', padding: '2px 6px', gridColumn: '1 / -1' }}>{BRIEF_POOL.map(([k, l]) => <option key={k} value={k}>Where: {l}</option>)}</select>
                  <select className="input" value={x.brief.pos} onChange={e => x.setBrief('pos', e.target.value)} style={{ minHeight: 28, fontSize: '12px', padding: '2px 6px' }}>{BRIEF_POS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  <select className="input" value={x.brief.age} onChange={e => x.setBrief('age', e.target.value)} style={{ minHeight: 28, fontSize: '12px', padding: '2px 6px' }}>{BRIEF_AGE.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                  <div style={{ gridColumn: '1 / -1', fontSize: '11.5px', color: 'var(--color-neutral-700)' }}>{(BRIEF_FOCUS.find(f => f[0] === x.brief.focus) || [])[2]} He judges by his own read, so a better scout finds better players; he re-checks every month.</div>
                </div>
              )}
              {x.following.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: '11px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>Following ({x.following.length}/{PERSONAL_MAX})</div>
                  {x.following.map((f: any) => (
                    <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: '12.5px', padding: '2px 0' }}>
                      <span><button className="hv4" onClick={f.open} style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)' }}>{f.name}</button> <span style={{ color: 'var(--color-neutral-600)', fontSize: '11.5px' }}>{f.pos} · {f.age} · {f.where}</span></span>
                      <span style={{ color: 'var(--color-neutral-700)', fontSize: '11.5px', textAlign: 'right' }}>{f.auto ? '🔎 ' : '📌 '}{f.why}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <h4 style={{ margin: "18px 0 4px", fontSize: "19px" }}>
            Draft promises
          </h4>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Agent reputation
            </span>
            <span>
              {vm.repV.label} · {vm.repV.v}
            </span>
          </div>
          <div style={{ height: "4px", background: "var(--color-neutral-300)", margin: "4px 0 8px" }}>
            <div style={{ height: "4px", width: vm.repV.w, background: "var(--color-accent)" }}></div>
          </div>
          {!!vm.noPromises && (<>
            <p style={{ margin: "0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              No promises. Open a prospect in the current class to promise him your pick (two at most). If a rival takes him, a loyal player may refuse to report; an ambitious one will sign anyway and your reputation suffers.
            </p>
          </>)}
          {(vm.promisesV || []).map((x: any, i: number) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--color-divider)" }}>
              <button onClick={x.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                {x.name}
              </button>
              <span>
                {x.n}
              </span>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
