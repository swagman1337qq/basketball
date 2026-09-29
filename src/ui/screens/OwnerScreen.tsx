import { Fragment, useState } from 'react';
import type { VM } from '../vm';
import { KIND_LABEL, ownerProfile } from '../../engine/owners';
import { fmtBillions } from '../../engine/frontOffice';

export function OwnerScreen({ vm }: { vm: VM }) {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.3fr)", gap: "36px", alignItems: "start" }}>
        <section>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
            Owner
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "34px", lineHeight: "1.05" }}>
            {vm.own.name}
          </div>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: "600", marginTop: "2px" }}>
            {vm.own.arch}
          </div>
          <p style={{ margin: "6px 0 18px", color: "var(--color-neutral-700)" }}>
            {vm.own.desc}
          </p>
          {vm.own.sales?.[0] && (() => { const x = vm.own.sales[0]; return (
            <p style={{ margin: "-10px 0 18px", fontSize: "13px" }}>
              {vm.own.newOwner && <b style={{ color: "var(--color-accent-700)" }}>New owner. </b>}
              Bought {x.stake === 100 ? 'the team' : 'a ' + x.stake + '% controlling stake'} from {x.from} for {fmtBillions(x.price)} before the {x.season - 1}–{String(x.season).slice(2)} season.
              {vm.own.newOwner && ' He gives you his first full season before he judges you, and spends a little more than his type usually would this year.'}
            </p>); })()}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              Job security
            </span>
            <span style={{ color: vm.own.secColor, fontWeight: "600" }}>
              {vm.own.secLabel} · {vm.own.sec}
            </span>
          </div>
          <div style={{ height: "4px", background: "var(--color-neutral-300)", margin: "6px 0 18px" }}>
            <div style={{ height: "4px", width: vm.own.secW, background: vm.own.secColor }}></div>
          </div>
          <h4 style={{ margin: "0 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Budget limits
          </h4>
          {(vm.own.limits || []).map((t: any, i: number) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
              {t}
            </div>
          ))}
          <h4 style={{ margin: "18px 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            You’re fired if
          </h4>
          {(vm.own.fire || []).map((t: any, i: number) => (
            <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
              {t}
            </div>
          ))}
          {vm.own.sales?.length > 0 && <>
            <h4 style={{ margin: "18px 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
              Ownership changes
            </h4>
            {vm.own.sales.map((x: any, i: number) => (
              <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--color-divider)", fontSize: "13px" }}>
                <b>{x.season - 1}–{String(x.season).slice(2)}</b>: {x.from} ({x.fromArch}) sold {x.stake === 100 ? 'the team' : x.stake + '%'} to {x.to} ({x.arch}), {x.who}, for {fmtBillions(x.price)}{x.stake < 100 ? ' (club valued at ' + fmtBillions(x.value) + ')' : ''}.
              </div>
            ))}
          </>}
        </section>
        <section>
          <h4 style={{ margin: "0 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Expectations
          </h4>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                <th style={{ padding: "6px 8px" }}>
                  Demand
                </th>
                <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                  Now
                </th>
                <th style={{ padding: "6px 8px" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {(vm.own.demands || []).map((d: any, i: number) => (
                <tr key={i}>
                  <td style={{ padding: "6px 8px" }}>
                    {d.d}
                  </td>
                  <td style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {d.cur}
                  </td>
                  <td style={{ padding: "6px 8px", color: d.color, fontWeight: "600" }}>
                    {d.stt}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ margin: "12px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Nothing is hidden: these are every rule and limit the owner uses to judge you.
          </p>
          {vm.own.fails > 0 && <p style={{ margin: "8px 0 0", fontSize: "12px", color: "var(--gm-bad)" }}>Missed payroll mandates this season: {vm.own.fails} (−10 job security each).</p>}
          <h4 style={{ margin: "22px 0 4px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
            Franchise history
          </h4>
          {Object.keys(vm.ctx.s.letters || {}).length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "0 0 8px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-neutral-700)", alignSelf: "center" }}>Year-end letters:</span>
              {Object.keys(vm.ctx.s.letters).map(Number).sort((a, b) => b - a).map(y => <button key={y} className="btn btn-secondary" style={{ fontSize: "12px", padding: "3px 10px" }} onClick={() => vm.ctx.gm.setState({ letterOpen: y })}>{y - 1}–{String(y).slice(2)}</button>)}
            </div>
          )}
          {(vm.own.hist || []).length === 0 ? <p style={{ fontSize: "12px", color: "var(--color-neutral-700)", fontStyle: "italic" }}>Reviewed at the end of each season.</p> : (
            <table className="table" style={{ fontSize: "12.5px" }}>
              <thead><tr><th style={{ padding: "5px 8px" }}>Season</th><th style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>W–L</th><th style={{ padding: "5px 8px" }}>Finish</th><th style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>Payroll</th><th style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>Profit</th></tr></thead>
              <tbody>{vm.own.hist.map((h: any, i: number) => (
                <tr key={i}><td style={{ padding: "5px 8px" }}>{h.season - 1}–{String(h.season).slice(2)}</td><td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>{h.w}–{h.l}</td><td style={{ padding: "5px 8px" }}>{h.fin}</td><td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>${h.payroll.toFixed(1)}M</td><td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap", color: h.net < 0 ? "var(--gm-bad)" : "var(--gm-good)" }}>{h.net < 0 ? "−" : ""}${Math.abs(h.net).toFixed(1)}M</td></tr>
              ))}</tbody>
            </table>
          )}
        </section>
      </div>
      <OwnerDirectory vm={vm} />
    </>
  );
}

// Owner biography (yours first) and every owner in the league, searchable.
function OwnerDirectory({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam } = vm.ctx, [q, setQ] = useState(''), [openT, setOpenT] = useState<number | null>(null), [kind, setKind] = useState('all');
  const mine = ownerProfile(gm, s, s.me);
  const all = T.map((t: any) => ({ t, o: ownerProfile(gm, s, t.tid) }))
    .filter(({ t, o }: any) => (kind === 'all' || o.kind === kind) && (!q || (o.name + ' ' + t.region + ' ' + t.name + ' ' + t.abbr).toLowerCase().includes(q.toLowerCase())))
    .sort((a: any, b: any) => b.o.worth - a.o.worth);
  const H4 = { margin: "26px 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" };
  return (
    <>
      <h4 style={H4}>Owner biography</h4>
      <div style={{ display: 'flex', gap: 14, alignItems: 'baseline', flexWrap: 'wrap', marginBottom: 6 }}>
        <b style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>{mine.name}</b>
        <span style={{ fontSize: '12.5px', color: 'var(--color-neutral-700)' }}>{mine.kindLabel} · {mine.worthLabel} · bought the team in {mine.year} for {mine.priceLabel}</span>
      </div>
      <p style={{ margin: 0, lineHeight: 1.6, maxWidth: 900 }}>{mine.bio}</p>
      <h4 style={H4}>Owners around the league</h4>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        <input className="input" placeholder="Search an owner or a team…" value={q} onChange={e => setQ(e.target.value)} style={{ width: 260 }} />
        <select className="input" value={kind} onChange={e => setKind(e.target.value)} style={{ width: 'auto' }}><option value="all">Every kind of owner</option>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <span style={{ fontSize: '12px', color: 'var(--color-neutral-700)' }}>Richest first · click an owner for the biography</span>
      </div>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead><tr><th style={{ padding: '5px 8px' }}>Owner</th><th style={{ padding: '5px 8px' }}>Team</th><th style={{ padding: '5px 8px' }}>Owner type</th><th style={{ padding: '5px 8px' }}>Kind</th><th style={{ padding: '5px 8px', textAlign: 'right' }}>Fortune</th><th style={{ padding: '5px 8px', textAlign: 'right' }}>Bought</th></tr></thead>
        <tbody>{all.map(({ t, o }: any) => (<Fragment key={t.tid}>
          <tr onClick={() => setOpenT(openT === t.tid ? null : t.tid)} style={{ cursor: 'pointer', background: openT === t.tid ? 'var(--color-neutral-100)' : undefined }}>
            <td style={{ padding: '5px 8px', fontWeight: 600, color: 'var(--color-accent-700)' }}>{o.name}</td>
            <td style={{ padding: '5px 8px' }}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{logo(t.tid, 16)}<button className="hv4" onClick={e => { e.stopPropagation(); openTeam(t.tid); }} style={{ all: 'unset', cursor: 'pointer' }}>{t.region} {t.name}</button></span></td>
            <td style={{ padding: '5px 8px' }}>{t.arch}</td>
            <td style={{ padding: '5px 8px' }} title={o.kindDesc}>{o.kindLabel}</td>
            <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{o.worthLabel.replace(' net worth', '').replace(' under management', ' AUM')}</td>
            <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{o.year} · {o.priceLabel}</td>
          </tr>
          {openT === t.tid && <tr><td colSpan={6} style={{ padding: '6px 8px 12px', lineHeight: 1.6, fontSize: '13px' }}>{o.bio}</td></tr>}
        </Fragment>))}</tbody>
      </table>
    </>
  );
}
