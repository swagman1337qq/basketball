// Signing and release dialogs. Signing: every CBA method the team can use for this player
// (with the reason when one is unavailable), years, first-year salary, options, trade kicker,
// no-trade clause and incentives, and a live read on whether he'd sign. Release: waive,
// stretch or buy out, with the dead money each season.
import type { VM } from '../vm';
import { BIRD_LABEL, birdOf, capState, deadSchedule, nums, remainingGuaranteed, signingMethods, teamSalary, yosOf } from '../../engine/cba';
import { acceptance, validateSigning } from '../../engine/contracts';
import { buyoutWilling, defaultTerms } from '../../engine/cbaFlow';
import { incentiveOptions } from '../../engine/frontOffice';
import { fmtMoney } from '../../engine/capModel';
import { muted, NumInput, Seg } from '../kit';

const lab: React.CSSProperties = { fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)', margin: '10px 0 4px' };
const row: React.CSSProperties = { display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' };

export function ContractDialog({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, dg = s.dialog;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 45%, transparent)', zIndex: 20 }} onClick={vm.closeDialog}>
      <div className="dialog" onClick={vm.stop} style={{ width: 'min(560px, calc(100vw - 32px))', maxHeight: 'calc(100vh - 40px)', overflow: 'auto' }}>
        {dg.type === 'sign' ? <Sign vm={vm} /> : <Release vm={vm} />}
      </div>
    </div>
  );
}

function Sign({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, dg = s.dialog, P = gm.db.P, p = P[dg.pid], tid = s.me, N = nums(gm), yos = yosOf(gm, p);
  const methods = signingMethods(gm, s, tid, p);
  const t0 = dg.method ? { method: dg.method, amt: dg.amt, years: dg.years } : defaultTerms(gm, s, tid, p, methods);
  const m = methods.find(x => x.key === t0.method) || methods[0];
  const set = (patch: any) => gm.setState(st => ({ dialog: { ...t0, ...st.dialog, ...patch, err: null } }));
  const pickMethod = (k: string) => { const d = defaultTerms(gm, s, tid, p, methods.map(x => ({ ...x, ok: x.key === k }))); set({ ...d, opt: null, kicker: 0, ntc: false, inc: [] }); };
  const amt = +t0.amt, years = +t0.years, inc = dg.inc || [], chosen = inc.map(x => x.k);
  const fixedAmt = ['twoWay', 'tenDay', 'hardship', 'ex10', 'min'].includes(m.key);
  const opts = !fixedAmt && m.key !== 'dpe' ? incentiveOptions(gm, s, p, tid, amt) : [];
  const likely = inc.filter(x => x.likely).reduce((a, x) => a + x.amt, 0);
  const terms = { method: m.key, amt, years, opt: years >= 2 ? dg.opt || null : null, kicker: +(dg.kicker || 0) / 100, ntc: !!dg.ntc, inc };
  const v = validateSigning(gm, s, tid, p, { ...terms, amt: amt + likely });
  const acc = acceptance(gm, s, tid, p, { ...terms, amt: amt + inc.reduce((a, x) => a + x.amt * (x.likely ? 1 : 0.6), 0) });
  const hit = m.key === 'twoWay' ? 0 : m.key === 'min' && years === 1 && yos >= 2 ? N.min(2) : amt + likely;
  const pay = teamSalary(gm, s, tid), after = pay + hit, cs = capState(s, tid);
  const bird = birdOf(p, tid), ntcOk = yos >= 8 && m.key === 'bird' && (p.yrsWith || 0) >= 4;
  const status = after > N.AP2 ? 'above the 2nd apron' : after > N.AP1 ? 'above the 1st apron' : after > N.TAX ? 'over the tax line' : after > N.CAP ? 'over the cap' : 'under the cap';
  const Y1 = ['fa', 'draft', 'lottery', 'playoffs', 'playin'].includes(s.phase) ? gm.Y + 1 : gm.Y;
  const sched = Array.from({ length: Math.max(1, years) }, (_, i) => +(amt * Math.pow(1 + (m.key === 'bird' ? 0.08 : fixedAmt ? 0 : 0.05), i)).toFixed(2));
  return (
    <>
      <div className="dialog-title">{dg.offer ? 'Offer sheet: ' : 'Sign '}{p.name}</div>
      <div className="dialog-body" style={{ fontSize: '13px' }}>
        <div style={muted}>{p.pos} · {p.age} · {p.ovr} ovr · {yos} year{yos === 1 ? '' : 's'} of service{bird ? ' · you hold ' + BIRD_LABEL[bird] + ' rights' : ''}{p.rfa ? ' · restricted FA (' + s.teams[p.rfa.tid].abbr + ' can match)' : ''}{p.abroad ? ' · under contract at ' + p.abroad.club : ''}</div>
        <div style={lab}>How you sign him</div>
        <select value={m.key} onChange={e => pickMethod(e.target.value)} style={{ width: '100%' }}>
          {methods.map(x => <option key={x.key} value={x.key} disabled={!x.ok && !s.god}>{x.label}{x.ok ? ' · up to ' + fmtMoney(x.maxFirst) : ' · ' + (x.why || 'unavailable')}</option>)}
        </select>
        <div style={{ ...muted, fontSize: '12px', marginTop: '4px' }}>{m.note}</div>
        <div style={lab}>Terms</div>
        <div style={row}>
          <span>First-year salary</span>
          <NumInput value={amt} min={fixedAmt ? amt : 0} max={fixedAmt ? amt : m.maxFirst} step={0.1} width={90} disabled={fixedAmt && !s.god} onValue={x => set({ amt: x })} suffix={'$M · max ' + fmtMoney(m.maxFirst)} />
        </div>
        {m.maxYears > 0 && (
          <div style={{ ...row, marginTop: '6px' }}>
            <span>Years</span>
            <NumInput value={years} min={1} max={m.maxYears} step={1} width={60} onValue={x => set({ years: x })} suffix={'max ' + m.maxYears + ' · ' + (Y1 - 1) + '–' + String(Y1).slice(2) + ' to ' + (Y1 + years - 2) + '–' + String(Y1 + years - 1).slice(2)} />
          </div>
        )}
        {m.maxYears > 1 && years >= 2 && !fixedAmt && (
          <div style={{ ...row, marginTop: '6px' }}>
            <span>Final-year option</span>
            <Seg<string> value={dg.opt || 'none'} options={[['none', 'None'], ['player', 'Player option'], ['team', 'Team option']]} onChange={x => set({ opt: x === 'none' ? null : x })} />
          </div>
        )}
        {!fixedAmt && m.key !== 'dpe' && (
          <div style={{ ...row, marginTop: '6px' }}>
            <span>Trade kicker</span>
            <NumInput value={+(dg.kicker || 0)} min={0} max={15} step={1} width={56} onValue={x => set({ kicker: x })} suffix="% of remaining salary if traded" />
            <label style={{ display: 'flex', gap: '6px', alignItems: 'center', opacity: ntcOk ? 1 : 0.55 }} title={ntcOk ? '' : 'Needs 8+ years of service and 4+ with your team, re-signing with Bird rights'}>
              <input type="checkbox" checked={!!dg.ntc} disabled={!ntcOk} onChange={e => set({ ntc: e.target.checked })} /> No-trade clause
            </label>
          </div>
        )}
        {years > 1 && <div style={{ ...muted, fontSize: '12px', marginTop: '6px' }}>Salary by season: {sched.map((x, i) => (Y1 + i - 1) + '–' + String(Y1 + i).slice(2) + ' ' + fmtMoney(x)).join(' · ')}{dg.opt && years >= 2 ? ' (' + dg.opt + ' option on the last)' : ''}</div>}
        {opts.length > 0 && (
          <>
            <div style={lab}>Incentives (optional)</div>
            {opts.map((o: any) => { const on = chosen.includes(o.k); return (
              <label key={o.k} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '2px 0', cursor: 'pointer', fontSize: '12.5px' }}>
                <input type="checkbox" checked={on} onChange={() => set({ inc: on ? inc.filter(x => x.k !== o.k) : [...inc, o] })} />
                <span style={{ flex: 1 }}>{o.label}</span><span>{fmtMoney(o.amt)}</span>
                <span style={{ fontSize: '11px', width: '60px', textAlign: 'right', color: o.likely ? 'var(--color-accent-700)' : 'var(--color-neutral-600)' }}>{o.likely ? 'Likely' : 'Unlikely'}</span>
              </label>); })}
            <div style={{ ...muted, fontSize: '11.5px' }}>Likely bonuses (met last season) count on the cap and against the exception; unlikely ones don’t. He values unlikely bonuses at 60%.</div>
          </>
        )}
        <div style={{ margin: '12px 0 0', padding: '8px 10px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)', fontSize: '12.5px' }}>
          <div>Cap hit {fmtMoney(hit)} · team salary after {fmtMoney(after)} ({status}){cs.hardCap || m.hardCap ? ' · hard cap at the ' + ((m.hardCap || cs.hardCap) === 'AP1' ? '1st apron ' + fmtMoney(N.AP1) : '2nd apron ' + fmtMoney(N.AP2)) : ''}</div>
          {p.abroad && <div>His {p.abroad.clause.toLowerCase()} costs {fmtMoney(p.abroad.fee)} in cash{p.abroad.fee > 0.85 ? '; ' + fmtMoney(p.abroad.fee - 0.85) + ' of it counts on your cap this season' : ''}. Expect a 15-game adjustment.</div>}
          <div style={{ marginTop: '4px', color: !v.ok ? 'var(--gm-bad)' : acc.ok ? 'var(--gm-good)' : 'var(--color-accent-800)' }}>
            {!v.ok ? 'League office: ' + v.why : acc.ok ? p.name + '’s camp: “We have a deal.”' : p.name + '’s camp: “' + acc.why + '”'}
          </div>
          {!!dg.err && <div style={{ marginTop: '4px', color: 'var(--gm-bad)' }}>{dg.err}</div>}
        </div>
      </div>
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={vm.closeDialog}>Cancel</button>
        <button className="btn btn-primary" disabled={!s.god && (!v.ok || !acc.ok)} onClick={() => { gm.setState(st => ({ dialog: { ...t0, ...st.dialog } })); gm.confirmDialog(); }}>{m.key === 'offer' ? 'Submit offer sheet' : 'Sign player'}</button>
      </div>
    </>
  );
}

function Release({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, dg = s.dialog, P = gm.db.P, p = P[dg.pid], mode = dg.mode || 'waive', give = +(dg.giveBack || 0);
  const set = (patch: any) => gm.setState(st => ({ dialog: { ...st.dialog, ...patch, err: null } }));
  const rem = remainingGuaranteed(gm, s, p), owed = Object.values(rem).reduce((a: number, b: any) => a + b, 0) as number;
  const nonGtd = ['ex10', 'tenDay', 'hardship', 'twoWay'].includes(p.ctype) || owed === 0;
  const sched = deadSchedule(gm, s, p, mode === 'stretch', mode === 'buyout' ? give / 100 : 0), ys = Object.keys(sched).map(Number).sort();
  const willing = Math.round(buyoutWilling(gm, p) * 100);
  const late = s.phase === 'regular' && s.day > 61;
  return (
    <>
      <div className="dialog-title">Release {p.name}?</div>
      <div className="dialog-body" style={{ fontSize: '13px' }}>
        {nonGtd ? (
          <div>{p.ctype === 'twoWay' ? 'Two-way' : p.ctype === 'ex10' ? 'Exhibit 10' : p.ctype === 'tenDay' ? '10-day' : p.ctype === 'hardship' ? 'Hardship' : 'His'} contract isn’t guaranteed{owed === 0 && !['ex10', 'tenDay', 'hardship', 'twoWay'].includes(p.ctype) ? ' past this point' : ''}: releasing him costs nothing on the cap.</div>
        ) : (
          <>
            <div>He’s owed {fmtMoney(owed)} in guaranteed salary ({ys.length ? Object.keys(rem).map(y => (+y - 1) + '–' + String(y).slice(2) + ' ' + fmtMoney(rem[y])).join(', ') : ''}).</div>
            <div style={lab}>How</div>
            <Seg<string> value={mode} options={[['waive', 'Waive'], ['stretch', 'Stretch'], ['buyout', 'Buyout']]} onChange={x => set({ mode: x })} />
            <div style={{ ...muted, fontSize: '12px', marginTop: '6px' }}>
              {mode === 'waive' ? 'What he’s owed stays on your cap as dead money in the seasons it was due. Another team under the cap may claim him (and his contract) off waivers.' : mode === 'stretch' ? 'The stretch provision spreads what he’s owed over twice the remaining years plus one: smaller cap hits for longer.' : 'He gives back part of what he’s owed to become a free agent now (buyouts skip waiver claims).'}
            </div>
            {mode === 'buyout' && <div style={{ ...row, marginTop: '6px' }}><span>He gives back</span><NumInput value={give} min={0} max={30} step={1} width={56} onValue={x => set({ giveBack: x })} suffix={'% · his agent says up to ' + willing + '%'} /></div>}
            <div style={lab}>Dead money</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', fontSize: '12.5px' }}>{ys.map(y => <span key={y}>{y - 1}–{String(y).slice(2)}: {fmtMoney(sched[y])}</span>)}</div>
          </>
        )}
        {late && <div style={{ ...muted, fontSize: '12px', marginTop: '8px' }}>After March 1, a waived player can sign elsewhere but can’t play in that team’s postseason.</div>}
        {!!dg.err && <div style={{ marginTop: '6px', color: 'var(--gm-bad)' }}>{dg.err}</div>}
      </div>
      <div className="dialog-actions">
        <button className="btn btn-secondary" onClick={vm.closeDialog}>Cancel</button>
        <button className="btn btn-primary" onClick={() => gm.confirmDialog()}>{nonGtd ? 'Release' : mode === 'buyout' ? 'Buy him out' : mode === 'stretch' ? 'Waive and stretch' : 'Waive'}</button>
      </div>
    </>
  );
}
