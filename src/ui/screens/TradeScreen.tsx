import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { godBtn } from '../kit';
import { CapBar, CapLeft } from '../CapBar';

const TONE: Record<string, string> = { good: 'var(--gm-good)', ok: 'var(--color-accent-700)', bad: 'var(--gm-bad)' };
function AdviceBox({ a }: { a: any }) {
  if (!a) return null;
  return (
    <div style={{ marginTop: 8, padding: '8px 10px', borderLeft: '3px solid ' + TONE[a.tone], background: 'color-mix(in srgb, ' + TONE[a.tone] + ' 7%, transparent)', borderRadius: 4 }}>
      <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>Assistant GM</div>
      <div style={{ fontWeight: 600, color: TONE[a.tone], margin: '2px 0 4px' }}>“{a.head}”</div>
      {a.lines.map((l: string, i: number) => <div key={i} style={{ fontSize: '12px', color: 'var(--color-neutral-800)' }}>· {l}</div>)}
    </div>);
}

export function TradeScreen({ vm }: { vm: VM }) {
  // ‹ › step through the other teams in the menu's order.
  const cycle = (d: number) => { const o = vm.teamOptions || [], i = o.findIndex((x: any) => String(x.value) === String(vm.tTid)); if (o.length) vm.pickTeam({ target: { value: o[(i + d + o.length) % o.length].value } }); };
  const arrowBtn = { minWidth: 30, padding: "2px 8px", fontSize: "20px", lineHeight: 1 } as const;
  const srtT = useSort<any>(vm.tTheirs || [], { name: r => byLast(vm.ctx.gm.db.P[r.id] || r), age: r => r.age, ovr: r => r.ovr, pot: r => r.pot, contract: r => parseFloat(String(r.contract).replace(/[^0-9.]/g, '')) || 0 });
  const srtM = useSort<any>(vm.tMine || [], { name: r => byLast(vm.ctx.gm.db.P[r.id] || r), age: r => r.age, ovr: r => r.ovr, pot: r => r.pot, contract: r => parseFloat(String(r.contract).replace(/[^0-9.]/g, '')) || 0 });
  const O = vm.offersV;
  const side = (label: string, rows: any[]) => (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>{label}</div>
      {rows.map((r: any, i: number) => <div key={i} style={{ padding: "3px 0", borderBottom: "1px solid var(--color-divider)" }}>
        {r.open ? <button className="hv6" onClick={r.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)", fontWeight: 600 }}>{r.name}</button> : <b>{r.name}</b>}
        <span style={{ color: "var(--color-neutral-700)", fontSize: "12px", marginLeft: 8 }}>{r.sub}</span></div>)}
      {!rows.length && <div style={{ color: "var(--color-neutral-700)", fontSize: "12.5px" }}>Nothing</div>}
    </div>);
  return (
    <>
      {!!O && (
        <section style={{ marginBottom: 18, padding: "12px 14px", border: "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", background: "color-mix(in srgb, var(--color-accent) 6%, transparent)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <b style={{ fontFamily: "var(--font-heading)", fontSize: "18px" }}>{O.title}</b>
            <span style={{ color: "var(--color-neutral-700)", fontSize: "12.5px" }}>{O.loading ? '' : O.empty ? '0 offers' : O.count + (O.count === 1 ? ' offer' : ' offers')}</span>
            <button className="btn btn-ghost" onClick={O.close} style={{ marginLeft: "auto", fontSize: "12px" }}>Close</button>
          </div>
          {O.loading ? <p style={{ margin: 0, color: "var(--color-neutral-700)" }}>📞 Calling around the league…</p> : O.empty ? <p style={{ margin: 0, color: "var(--color-neutral-700)" }}>{O.emptyMsg}</p> : (<>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <button className="btn btn-ghost" onClick={O.prev} aria-label="Previous offer" style={arrowBtn}>‹</button>
              {O.logo}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: 600 }}>{O.team}</div>
                <div style={{ color: "var(--color-neutral-700)", fontSize: "12px" }}>{O.strat}{O.strat ? ' · ' : ''}GM {O.gm}{O.note && !/^Option/.test(O.note) ? ' · ' + O.note : ''}</div>
              </div>
              <span style={{ marginLeft: "auto", color: "var(--color-neutral-700)", fontSize: "12.5px", whiteSpace: "nowrap" }}>{O.pos} of {O.count}</span>
              <button className="btn btn-ghost" onClick={O.next} aria-label="Next offer" style={arrowBtn}>›</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, marginBottom: 12 }}>
              {side('You get', O.get || [])}{side('You send', O.send || [])}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary" onClick={O.accept}>Accept</button>
              <button className="btn btn-secondary" onClick={O.decline}>Decline</button>
              <button className="btn btn-ghost" onClick={O.negotiate} title="Load this offer into the trade builder to change it">Negotiate…</button>
              <button className="btn btn-ghost" onClick={O.askAdvice} title="Your assistant GM's take on this offer" style={{ marginLeft: 'auto' }}>🧠 {O.adviceOn ? 'Hide advice' : 'Ask for advice'}</button>
            </div>
            <AdviceBox a={O.advice} />
          </>)}
        </section>
      )}
      <CapBar gm={vm.ctx.gm} s={vm.ctx.s} tid={vm.ctx.s.me} delta={vm.tr.delta} />
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px minmax(0,1fr)", gap: "24px", alignItems: "start" }}>
        <section>
          <div style={{ display: "flex", alignItems: "center", height: "36px", marginBottom: "4px" }}>
            <h4 style={{ margin: "0", fontSize: "19px", display: "flex", alignItems: "center", gap: "10px" }}>
              {vm.myLogoTr}
              {vm.myName} send
            </h4>
            <button className="btn btn-secondary" onClick={vm.shopOffers} disabled={!vm.canShop} title={vm.canShop ? 'Every team that wants what you selected makes its best offer' : 'Select players or picks on your side first'} style={{ marginLeft: "auto", fontSize: "12px", padding: "3px 10px", whiteSpace: "nowrap" }}>📣 Ask for offers</button>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
<th style={{ width: 22, padding: '4px 8px' }} />{srtM.head('name', 'Player')}{srtM.head('age', 'Age', 'right')}{srtM.head('ovr', 'Ovr', 'right')}{srtM.head('pot', 'Pot', 'right')}{srtM.head('contract', 'Contract', 'right')}
</tr>
            </thead>
            <tbody>
              {srtM.rows.map((p: any, i: number) => (
                <tr key={i} style={{ background: p.bg }}>
                  <td onClick={p.toggle} title="Add to the trade / remove" style={{ padding: "4px 8px", cursor: "pointer" }}>
                    <span role="checkbox" aria-checked={!!p.mark} style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: p.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {p.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <button className="hv4" onClick={p.open} title="Open his profile" style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>{p.name}</button>{" "}
                      <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                        {p.pos}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.age}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.tone, fontWeight: "600" }}>
                    {p.ovr}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.pot}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.contract}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", margin: "16px 0 2px" }}>
            Draft picks
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              {(vm.tMinePicks || []).map((k: any, i: number) => (
                <tr key={i} onClick={k.toggle} style={{ cursor: "pointer", background: k.bg }}>
                  <td style={{ padding: "4px 8px", width: "22px" }}>
                    <span style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: k.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {k.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ fontStyle: k.swap ? 'italic' : undefined }}>{k.label}</span>
                    {k.prot && <select className="input" value={k.prot.v} onClick={e => e.stopPropagation()} onChange={k.prot.set} title="Protection: if the pick lands inside it, the team giving it keeps it and it rolls over to next year (twice, then unprotected)" style={{ width: 'auto', minHeight: 24, fontSize: '11.5px', padding: '0 4px', marginLeft: 8 }}>{(vm.protOpts || []).map(([n, l]: any) => <option key={n} value={n}>{l}</option>)}</select>}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>
                    {k.proj}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="card" style={{ padding: "16px", gap: "10px", position: "sticky", top: "0" }}>
          <div className="card-kicker" style={{ color: "var(--color-accent-700)" }}>
            Trade summary
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider)", paddingBottom: "5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Salary out
            </span>
            <span>
              {vm.tr.out}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider)", paddingBottom: "5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Salary in
            </span>
            <span>
              {vm.tr.in}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-divider)", paddingBottom: "5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Payroll after
            </span>
            <span>
              {vm.tr.after}
            </span>
          </div>
          <div style={{ borderBottom: "1px solid var(--color-divider)", paddingBottom: "6px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: 4 }}>
              Cap space left
            </div>
            <CapLeft gm={vm.ctx.gm} s={vm.ctx.s} tid={vm.ctx.s.me} pay={vm.tr.afterNum} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", fontSize: "12px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Salary rule
            </span>
            <span style={{ color: vm.tr.salColor, textAlign: "right" }}>
              {vm.tr.sal}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>
              Roster limits
            </span>
            <span style={{ color: vm.tr.rosColor }}>
              {vm.tr.ros}
            </span>
          </div>
          <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "8px" }}>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
              Their direction
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: "600" }}>
              {vm.tr.stratName}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              {vm.tr.stratDesc}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginBottom: "8px" }}>
              Their appetite
            </div>
            <div style={{ position: "relative", height: "14px" }}>
              <div style={{ position: "absolute", left: "0", right: "0", top: "6px", height: "1px", background: "var(--color-neutral-400)" }}></div>
              <div style={{ position: "absolute", left: "50%", top: "0", width: "1px", height: "14px", background: "var(--color-text)" }}></div>
              <div style={{ position: "absolute", left: vm.tr.meter, top: "2px", width: "10px", height: "10px", marginLeft: "-5px", transform: "rotate(45deg)", border: "1px solid var(--color-accent)", background: "var(--color-bg)" }}></div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--color-neutral-600)", marginTop: "2px" }}>
              <span>
                Decline
              </span>
              <span>
                Accept
              </span>
            </div>
            <div style={{ marginTop: "6px", fontStyle: "italic" }}>
              {vm.tr.verdict}
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.tr.askAdvice} disabled={vm.tr.cantBalance} title="Your assistant GM's take: good for us? will they bite?" style={{ width: "100%" }}>
            🧠 {vm.ctx.s.tAdvice ? 'Hide advice' : 'Ask for advice'}
          </button>
          <AdviceBox a={vm.tr.advice} />
          <button className="btn btn-primary" onClick={vm.propose} disabled={vm.tr.cantPropose} style={{ width: "100%", marginTop: "4px" }}>
            Propose trade
          </button>
          {!!vm.tr.god && <button className="btn btn-secondary" onClick={vm.forceAccept} disabled={vm.tr.cantForce} title="God Mode: they accept and the league office approves, whatever the rules say" style={{ ...godBtn,  width: "100%", borderColor: "var(--color-accent)", color: "var(--color-accent-700)" }}>
            ⚡ Force accept
          </button>}
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary" onClick={vm.balance} disabled={vm.tr.cantBalance} style={{ flex: "1", fontSize: "13px", whiteSpace: "nowrap" }}>
              What would it take?
            </button>
            <button className="btn btn-ghost" onClick={vm.clearTrade} style={{ fontSize: "13px" }}>
              Clear
            </button>
          </div>
          {!!vm.tr.hasMsg && (<>
            <div style={{ borderTop: "1px solid var(--color-divider)", paddingTop: "8px", color: "var(--color-accent-800)" }}>
              {vm.tr.msg}
            </div>
          </>)}
        </section>
        <section>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", height: "36px", marginBottom: "4px" }}>
            {vm.theirLogo}
            <button className="btn btn-ghost" onClick={() => cycle(-1)} title="Previous team" aria-label="Previous team" style={arrowBtn}>‹</button>
            <select className="input" value={vm.tTid} onChange={vm.pickTeam} style={{ fontFamily: "var(--font-heading)", fontSize: "16px", fontWeight: "600", minHeight: "34px", padding: "4px 26px 4px 8px", flex: "1 1 auto", minWidth: 0 }}>
              {(vm.teamOptions || []).map((o: any, i: number) => (
                <option key={i} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button className="btn btn-ghost" onClick={() => cycle(1)} title="Next team" aria-label="Next team" style={arrowBtn}>›</button>
            <span style={{ color: "var(--color-neutral-700)", whiteSpace: "nowrap" }}>
              send
            </span>
            <button className="btn btn-ghost" onClick={vm.viewTradeTeam} style={{ fontSize: "12px", whiteSpace: "nowrap" }}>
              View roster
            </button>
            <button className="btn btn-secondary" onClick={vm.askOffers} disabled={!vm.canAsk} title={vm.canAsk ? 'They tell you what they would want from your roster' : 'Select their players or picks first'} style={{ fontSize: "12px", padding: "3px 10px", whiteSpace: "nowrap" }}>📣 Ask what they want</button>
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
<th style={{ width: 22, padding: '4px 8px' }} />{srtT.head('name', 'Player')}{srtT.head('age', 'Age', 'right')}{srtT.head('ovr', 'Ovr', 'right')}{srtT.head('pot', 'Pot', 'right')}{srtT.head('contract', 'Contract', 'right')}
</tr>
            </thead>
            <tbody>
              {srtT.rows.map((p: any, i: number) => (
                <tr key={i} style={{ background: p.bg }}>
                  <td onClick={p.toggle} title="Add to the trade / remove" style={{ padding: "4px 8px", cursor: "pointer" }}>
                    <span role="checkbox" aria-checked={!!p.mark} style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: p.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {p.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      <img src={p.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <button className="hv4" onClick={p.open} title="Open his profile" style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>{p.name}</button>{" "}
                      <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                        {p.pos}
                      </span>
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.age}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: p.tone, fontWeight: "600" }}>
                    {p.ovr}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.pot}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.contract}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", margin: "16px 0 2px" }}>
            Draft picks
          </div>
          <table className="table" style={{ fontSize: "13px" }}>
            <tbody>
              {(vm.tTheirPicks || []).map((k: any, i: number) => (
                <tr key={i} onClick={k.toggle} style={{ cursor: "pointer", background: k.bg }}>
                  <td style={{ padding: "4px 8px", width: "22px" }}>
                    <span style={{ display: "grid", placeItems: "center", width: "14px", height: "14px", border: "1px solid var(--color-accent)", borderRadius: "2px", background: k.box, color: "var(--color-bg)", fontSize: "10px", lineHeight: "1" }}>
                      {k.mark}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ fontStyle: k.swap ? 'italic' : undefined }}>{k.label}</span>
                    {k.prot && <select className="input" value={k.prot.v} onClick={e => e.stopPropagation()} onChange={k.prot.set} title="Protection: if the pick lands inside it, the team giving it keeps it and it rolls over to next year (twice, then unprotected)" style={{ width: 'auto', minHeight: 24, fontSize: '11.5px', padding: '0 4px', marginLeft: 8 }}>{(vm.protOpts || []).map(([n, l]: any) => <option key={n} value={n}>{l}</option>)}</select>}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>
                    {k.proj}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
