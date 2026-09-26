// The cap sheet: where the team stands against the cap, tax line and aprons; offer sheets to
// answer; option and qualifying-offer decisions; exceptions; every contract by season; dead
// money; cap holds; and a reference for every CBA rule the league uses, at today's numbers.
import { useState } from 'react';
import type { VM } from '../vm';
import { BIRD_LABEL, birdOf, capHold, capState, DAY, describeContract, exceptionsOf, nums, qoFor, rosterMax, stdIds, taxBill, teamSalary, twoWayIds, yosOf } from '../../engine/cba';
import { answerOfferSheet, convertContract, decisionsFor, renounce } from '../../engine/cbaFlow';
import { fmtMoney } from '../../engine/capModel';
import { Link, muted, ruleH4 } from '../kit';

const tdc: React.CSSProperties = { padding: '4px 8px' }, tdr: React.CSSProperties = { padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' };

export function CapSheetScreen({ vm }: { vm: VM }) {
  const { gm, s, T, open } = vm.ctx, P = gm.db.P, tid = s.me, N = nums(gm), Y = gm.Y, cs = capState(s, tid);
  const [ref, setRef] = useState(false);
  const off = ['draft', 'fa', 'lottery'].includes(s.phase) || (s.phase === 'playoffs' && s.po?.champ != null);
  const Y0 = off ? Y + 1 : Y, years = [0, 1, 2, 3, 4].map(i => Y0 + i);
  const pay = teamSalary(gm, s, tid), payH = teamSalary(gm, s, tid, { holds: true }), room = N.CAP - (s.phase === 'fa' || s.phase === 'draft' ? payH : pay);
  const taxH = (cs as any).taxHist || (s.cap?.[tid]?.taxHist) || [], repeater = taxH.slice(-4).filter(Boolean).length >= 3, bill = taxBill(gm, pay, repeater);
  const payS = s.phase === 'fa' || s.phase === 'draft' ? payH : pay;
  const status = payS > N.AP2 ? ['Above the 2nd apron', 'No mid-level, no aggregating salaries or taking back more in trades, no cash in trades, the pick seven years out is frozen; 3 of 5 seasons here and your first-rounder drops to 30th.'] : payS > N.AP1 ? ['Above the 1st apron', 'Taxpayer mid-level only; can’t take back more than 100% of outgoing salary, sign-and-trades or bought-out players who earned over the mid-level.'] : payS > N.TAX ? ['Taxpayer', 'You pay the luxury tax on the amount over the tax line.'] : payS > N.CAP ? ['Over the cap', 'Sign with exceptions (mid-level, bi-annual, minimum) and Bird rights; match salaries in trades.'] : ['Under the cap', 'Sign free agents into cap space; absorb salary in trades.'];
  const sheets = (s.offerSheets || []).filter(o => s.managed.includes(o.to));
  const decs = decisionsFor(gm, s, tid), dec = s.decide || {};
  const setDec = (k: string, v: boolean) => gm.setState(st => ({ decide: { ...(st.decide || {}), [k]: v } }));
  const exc = exceptionsOf(gm, s, tid), dead = cs.dead.filter(d => Object.keys(d.amts || {}).some(y => +y >= Y0));
  const ids = s.rosters[tid] || [], std = stdIds(gm, ids), tw = twoWayIds(gm, ids);
  const holds = s.phase === 'fa' || s.phase === 'draft' ? s.fa.filter(id => P[id].birdTid === tid) : [];
  const sal = (p: any, y: number) => (y > p.exp && !p.ext ? 0 : gm.salAt(p, y));
  const tot = (y: number) => ids.reduce((a, id) => a + (P[id].ctype === 'twoWay' ? 0 : sal(P[id], y)), 0) + dead.reduce((a, d) => a + (d.amts?.[y] || 0), 0) + (y === Y0 ? holds.reduce((a, id) => a + capHold(gm, s, P[id]), 0) : 0);
  const typeTag = (p: any) => ({ rookie: 'Rookie', max: 'Max', min: 'Min', twoWay: 'Two-way', ex10: 'Exhibit 10', tenDay: '10-day', hardship: 'Hardship' } as any)[p.ctype] || 'Veteran';
  const mark = (p: any, y: number) => (p.opt?.season === y ? (p.opt.kind === 'player' ? ' PO' : ' TO') : '');
  const box = (k: string, v: string, sub?: string, bad?: boolean) => (
    <div key={k} style={{ borderTop: '1px solid var(--color-text)', paddingTop: '6px' }}><div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase' }}>{k}</div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', color: bad ? 'var(--gm-bad)' : undefined }}>{v}</div>{sub && <div style={{ ...muted, fontSize: '11.5px' }}>{sub}</div>}</div>
  );
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '18px', marginBottom: '14px' }}>
        {box('Team salary', fmtMoney(pay), (s.phase === 'fa' || s.phase === 'draft') && payH !== pay ? fmtMoney(payH) + ' with cap holds' : std.length + ' standard · ' + tw.length + ' two-way')}
        {box(room >= 0 ? 'Cap room' : 'Over the cap', fmtMoney(Math.abs(room)), 'Cap ' + fmtMoney(N.CAP))}
        {box('Tax line', fmtMoney(N.TAX), pay > N.TAX ? fmtMoney(pay - N.TAX) + ' over · bill ' + fmtMoney(bill) + (repeater ? ' (repeater)' : '') : fmtMoney(N.TAX - pay) + ' under', pay > N.TAX)}
        {box('1st apron', fmtMoney(N.AP1), pay > N.AP1 ? fmtMoney(pay - N.AP1) + ' over' : fmtMoney(N.AP1 - pay) + ' under', pay > N.AP1)}
        {box('2nd apron', fmtMoney(N.AP2), pay > N.AP2 ? fmtMoney(pay - N.AP2) + ' over' : fmtMoney(N.AP2 - pay) + ' under', pay > N.AP2)}
        {box('Hard cap', cs.hardCap === 'AP1' ? '1st apron' : cs.hardCap === 'AP2' ? '2nd apron' : 'None', cs.hardCap ? 'Triggered by an exception you used' : 'Using the NT-MLE, BAE or sign-and-trade triggers one')}
      </div>
      <div style={{ padding: '8px 12px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', marginBottom: '18px', fontSize: '13px' }}><b>{status[0]}{payS !== pay ? ' (counting cap holds)' : ''}.</b> {status[1]} Salary floor {fmtMoney(N.FLOOR)}{pay < N.FLOOR ? ': you’re ' + fmtMoney(N.FLOOR - pay) + ' short, and the shortfall is paid to your players at season’s end.' : '.'}</div>

      {sheets.length > 0 && (
        <section style={{ marginBottom: '18px' }}>
          <h4 style={{ ...ruleH4, color: 'var(--color-accent-800)' }}>Offer sheets to answer</h4>
          {sheets.map(o => { const p = P[o.pid]; return (
            <div key={o.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '6px 0', borderBottom: '1px solid var(--color-divider)', fontSize: '13px' }}>
              <span style={{ flex: 1, minWidth: '240px' }}><Link onClick={() => open(p.id)}>{p.name}</Link> ({p.ovr}) signed an offer sheet with the {T[o.from].region} {T[o.from].name}: {fmtMoney(o.terms.amt)} × {o.terms.years} years{o.terms.opt ? ', ' + o.terms.opt + ' option' : ''}. Match with Bird rights and he stays on those exact terms; decline and he leaves.{s.managed.length > 1 && o.to !== tid ? ' (For ' + T[o.to].abbr + '.)' : ''}</span>
              <button className="btn btn-primary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => answerOfferSheet(gm, o.id, true)}>Match</button>
              <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => answerOfferSheet(gm, o.id, false)}>Decline</button>
            </div>); })}
          {s.offerMsg && <div style={{ color: 'var(--gm-bad)', fontSize: '12.5px', marginTop: '4px' }}>{s.offerMsg}</div>}
        </section>
      )}

      {decs.length > 0 && s.phase !== 'fa' && (
        <section style={{ marginBottom: '18px' }}>
          <h4 style={ruleH4}>Decisions due when free agency opens</h4>
          <table className="table" style={{ fontSize: '12.5px' }}><tbody>
            {decs.map(d => { const k = (d.kind === 'teamOpt' ? 'opt' : 'qo') + d.pid, v = dec[k] ?? d.def, p = P[d.pid]; return (
              <tr key={k}>
                <td style={tdc}><Link onClick={() => open(p.id)}>{p.name}</Link> <span style={muted}>{p.pos} · {p.age} · {p.ovr}</span></td>
                <td style={tdc}>{d.label}</td><td style={tdr}>{fmtMoney(d.amt)}</td>
                <td style={tdc}><label style={{ display: 'flex', gap: '6px', alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={v} onChange={e => setDec(k, e.target.checked)} />{d.kind === 'teamOpt' ? (v ? 'Exercise' : 'Decline') : (v ? 'Extend (restricted FA)' : 'Don’t extend (unrestricted)')}</label></td>
                <td style={{ ...tdc, ...muted, fontSize: '11.5px', maxWidth: '300px' }}>{d.note}</td>
              </tr>); })}
          </tbody></table>
        </section>
      )}

      <section style={{ marginBottom: '18px' }}>
        <h4 style={ruleH4}>Exceptions{off ? ' (reset when free agency opens)' : ''}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '6px 18px', fontSize: '12.5px' }}>
          {[['Non-taxpayer mid-level', exc.used.includes('cap') ? 'Not available (you used cap space)' : exc.used.includes('tpmle') ? 'Not available (you used the taxpayer MLE)' : fmtMoney(exc.ntmle) + ' left · 4 yrs · hard cap at 1st apron'],
            ['Taxpayer mid-level', exc.used.includes('cap') || exc.used.includes('ntmle') ? 'Not available' : fmtMoney(exc.tpmle) + ' · 2 yrs · hard cap at 2nd apron'],
            ['Bi-annual exception', exc.used.includes('cap') ? 'Not available' : cs.baeLast === Y - 1 || cs.baeLast === Y0 - 1 ? 'Used last season (not back-to-back)' : fmtMoney(exc.bae) + ' left · 2 yrs'],
            ['Room exception', exc.used.includes('cap') ? fmtMoney(exc.room) + ' · 2 yrs (after using cap space)' : 'Only after using cap space'],
            ['Disabled player exception', (s.cap?.[tid]?.dpe) ? fmtMoney(s.cap[tid].dpe.amt) + ' for ' + P[s.cap[tid].dpe.pid]?.name + ' · until ' + gm.fmtS(DAY.DPE_DEADLINE) : 'None (granted for a season-ending injury)'],
            ['Minimum exception', 'Always available (below a hard cap): ' + fmtMoney(N.min(0)) + ' to ' + fmtMoney(N.min(10)) + ' by service']].map(([k, v]) => <div key={k}><b>{k}</b><div style={muted}>{v}</div></div>)}
          <div><b>Traded player exceptions</b><div style={muted}>{cs.tpe.length ? cs.tpe.map((x: any) => fmtMoney(x.amt) + ' (from ' + x.from + ')').join(' · ') : 'None'}</div></div>
        </div>
      </section>

      <section style={{ marginBottom: '18px' }}>
        <h4 style={ruleH4}>Contracts · {std.length} of {rosterMax(s)} standard{tw.length ? ' · ' + tw.length + ' of 3 two-way' : ''}</h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '12.5px', minWidth: '760px' }}>
            <thead><tr><th style={tdc}>Player</th><th style={tdc}>Type</th>{years.map(y => <th key={y} style={tdr}>{y - 1}–{String(y).slice(2)}</th>)}<th style={tdc}>Bird</th><th style={tdc}></th></tr></thead>
            <tbody>
              {ids.slice().sort((a, b) => sal(P[b], Y0) - sal(P[a], Y0)).map(id => { const p = P[id]; return (
                <tr key={id}>
                  <td style={tdc}><Link onClick={() => open(id)}>{p.name}</Link> <span style={muted}>{p.ovr}</span></td>
                  <td style={{ ...tdc, fontSize: '11.5px' }} title={describeContract(gm, p)}>{typeTag(p)}{p.kicker ? ' · kicker' : ''}{p.ntc ? ' · NTC' : ''}{p.ctype === 'twoWay' ? ' · ' + (p.twoWay?.games || 0) + '/50 g' : ''}</td>
                  {years.map(y => { const v = sal(p, y); return <td key={y} style={{ ...tdr, color: p.opt?.season === y ? 'var(--color-accent-700)' : v ? undefined : 'var(--color-neutral-500)' }}>{v ? fmtMoney(v) + mark(p, y) : y === p.exp + 1 && qoFor && qoOk(gm, p) ? 'RFA' : y === p.exp + 1 ? 'UFA' : ''}</td>; })}
                  <td style={{ ...tdc, fontSize: '11.5px' }}>{(p.yrsWith || 0) >= 3 ? 'Full' : p.yrsWith === 2 ? 'Early' : 'Non'}</td>
                  <td style={{ ...tdc, whiteSpace: 'nowrap' }}>
                    {p.ctype === 'ex10' && <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '1px 6px' }} onClick={() => convertContract(gm, id, 'twoWay')}>To two-way</button>}
                    {p.ctype === 'twoWay' && <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '1px 6px' }} onClick={() => convertContract(gm, id, 'standard')}>To standard</button>}
                    <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '1px 6px' }} onClick={() => gm.setState({ dialog: { type: 'release', pid: id } })}>Release</button>
                  </td>
                </tr>); })}
              {dead.map((d, i) => <tr key={'d' + i} style={{ color: 'var(--gm-bad)' }}><td style={tdc}>{d.name}</td><td style={{ ...tdc, fontSize: '11.5px' }}>Dead money ({d.mode === 'stretch' ? 'stretched' : d.mode === 'buyout' ? 'buyout' : 'waived'})</td>{years.map(y => <td key={y} style={tdr}>{d.amts?.[y] ? fmtMoney(d.amts[y]) : ''}</td>)}<td /><td /></tr>)}
              {holds.map(id => { const p = P[id]; return <tr key={'h' + id} style={muted}><td style={tdc}><Link onClick={() => open(id)}>{p.name}</Link></td><td style={{ ...tdc, fontSize: '11.5px' }}>Cap hold{p.rfa ? ' (RFA, QO ' + fmtMoney(p.rfa.qo) + ')' : ''}</td>{years.map((y, i) => <td key={y} style={tdr}>{i === 0 ? fmtMoney(capHold(gm, s, p)) : ''}</td>)}<td style={{ ...tdc, fontSize: '11.5px' }}>{BIRD_LABEL[birdOf(p, tid) || 'non'].replace(' Bird', '').replace('-Bird', '')}</td><td style={tdc}><button className="btn btn-ghost" style={{ fontSize: '11px', padding: '1px 6px' }} onClick={() => renounce(gm, id)}>Renounce</button></td></tr>; })}
              <tr style={{ fontWeight: 600, borderTop: '1px solid var(--color-text)' }}><td style={tdc}>Total</td><td />{years.map(y => <td key={y} style={{ ...tdr, color: tot(y) > N.TAX && y === Y0 ? 'var(--gm-bad)' : undefined }}>{fmtMoney(tot(y))}</td>)}<td /><td /></tr>
            </tbody>
          </table>
        </div>
        <p style={{ ...muted, fontSize: '11.5px', margin: '6px 0 0' }}>PO / TO = player / team option. Future seasons include 5–8% raises. Two-way salaries don’t count on the cap. Cap holds count until the player signs or you renounce him (renouncing clears the hold and gives up his Bird rights).</p>
        {s.convMsg && <div style={{ color: 'var(--gm-bad)', fontSize: '12.5px' }}>{s.convMsg}</div>}
      </section>

      <section>
        <h4 style={{ ...ruleH4, cursor: 'pointer' }} onClick={() => setRef(!ref)}>{ref ? '▾' : '▸'} CBA reference (this season’s numbers)</h4>
        {ref && <CbaReference vm={vm} />}
      </section>
    </>
  );
}
const qoOk = (g: any, p: any) => !!p.rookieScale || yosOf(g, p) <= 3;

function CbaReference({ vm }: { vm: VM }) {
  const { gm } = vm.ctx, N = nums(gm), M = fmtMoney;
  const rows: [string, string][] = [
    ['Salary cap', M(N.CAP) + '. Follows the league’s cap outlook (League → Cap outlook); up to +10% a year. Tax line ' + M(N.TAX) + ', 1st apron ' + M(N.AP1) + ', 2nd apron ' + M(N.AP2) + ', salary floor ' + M(N.FLOOR) + '.'],
    ['Maximum salary', '25% of the cap with 0–6 years of service (' + M(N.max(0)) + '), 30% with 7–9 (' + M(N.max(7)) + '), 35% with 10+ (' + M(N.max(10)) + '). Raises up to 8% with Bird rights, 5% otherwise.'],
    ['Rose Rule', 'A rookie-scale extension can start at 30% of the cap if the player won MVP or made an All-League team (or DPOY) in the last season or two of the last three.'],
    ['Designated veteran (supermax)', '35% for players with 7–9 years of service still with the team that drafted them (or traded for them on their rookie deal), after MVP, DPOY or All-League honors. Up to 5 years.'],
    ['Minimum salary', 'By service: ' + M(N.min(0)) + ' (rookie) to ' + M(N.min(10)) + ' (10+ years). One-year minimums for 2+ year veterans count as the 2-year minimum on the cap; the league pays the rest.'],
    ['Rookie scale', 'First-round picks sign 4-year deals at 120% of the scale (No. 1: ' + M(N.rookie(1)) + ', No. 30: ' + M(N.rookie(30)) + '), with team options on years 3 and 4. Second-rounders sign minimum or two-way deals.'],
    ['Qualifying offer', 'Keeps a player with a rookie-scale deal or 3 or fewer years of service restricted: 130–150% of his rookie salary by pick, otherwise 125% of his salary (at least the minimum plus a bit). He can sign it for one year.'],
    ['Restricted free agency', 'Other teams sign him to an offer sheet; his team can match it (with Bird rights). Arenas provision: for players with 1–2 years of service, offer sheets can’t start above the non-taxpayer mid-level.'],
    ['Bird rights', 'Full Bird (3 seasons with the team without changing teams as a free agent): re-sign up to the max over the cap, up to 5 years. Early Bird (2 seasons): up to 175% of last salary or 105% of the average salary, 2–4 years. Non-Bird: up to 120% of last salary. Rights travel with trades and survive waivers claimed by another team.'],
    ['Cap holds', 'Your unsigned free agents count against the cap until they sign or you renounce them: 120–190% of last salary by Bird level, 250% of salary for rookie-scale RFAs; incomplete-roster charges for spots under 12.'],
    ['Mid-level exceptions', 'Non-taxpayer ' + M(N.NTMLE) + ' (4 years; hard-caps you at the 1st apron). Taxpayer ' + M(N.TPMLE) + ' (2 years; hard cap at the 2nd apron; not available above it). Room ' + M(N.ROOM) + ' (2 years) for teams that used cap space.'],
    ['Bi-annual exception', M(N.BAE) + ', up to 2 years; not in consecutive seasons; hard cap at the 1st apron; not for teams above it.'],
    ['Disabled player exception', 'For a season-ending injury (before ' + gm.fmtS(DAY.DPE_DEADLINE) + '): half his salary or the non-taxpayer MLE, whichever is less, to sign or trade for one player on a one-year deal.'],
    ['Two-way contracts', 'Up to 3 per team for players with fewer than 4 years of service; ' + M(N.TWO_WAY) + ', off the 15-man roster and the cap; up to ' + DAY.TWO_WAY_GAMES + ' NBA games; not playoff-eligible. Can be converted to a standard contract.'],
    ['Exhibit 10', 'One-year, non-guaranteed minimum deals for training camp (21-man offseason limit). Convert to a two-way before opening night, keep (becomes standard) or waive at no cap cost; a waived Exhibit 10 who joins your G League team earns up to ' + M(N.E10_BONUS) + '.'],
    ['10-day contracts', 'From ' + gm.fmtS(DAY.TEN_DAY_START) + ': prorated minimum for 10 days, at most two with the same team; after that it’s the rest of the season.'],
    ['Hardship exception', 'With 4+ players out, a 16th player on a non-guaranteed minimum deal until the roster is healthy.'],
    ['Roster', '15 standard contracts in season (21 in the offseason), at least 14; plus up to 3 two-ways.'],
    ['Options, kickers, no-trade clauses', 'Player or team option on the final year. Trade kicker: up to 15% of remaining salary, paid when traded (never above the max). No-trade clauses only for 8+ year veterans with 4+ years on the team, re-signing with Bird rights.'],
    ['Over-38 rule', 'Contracts of 4+ years can’t run past his 38th birthday (in effect: fewer years for older players).'],
    ['Extensions', 'Rookie scale: in the offseason before his final season until opening night, up to 5 years. Veterans: 2 years after signing, with 2 or fewer years left; first year up to 140% of his salary or of the average salary; 4 years (5 for supermax).'],
    ['Waivers', 'Guaranteed salary stays on the cap as dead money in the seasons it was due. Stretch provision: spread over twice the remaining years plus one. Buyouts: he gives some back. Teams under the cap can claim waived players. Released after March 1: not playoff-eligible for a new team.'],
    ['Trades', 'Over the cap you may take back 200% + ' + M(N.TRADE_BUF) + ' for up to ' + M(N.TRADE_SMALL) + ' out, outgoing + ' + M(N.TRADE_SMALL) + ' up to ' + M(N.TRADE_BIG) + ', then 125% + ' + M(N.TRADE_BUF) + '. Above the 1st apron: 100%. Above the 2nd apron: no aggregating. Newly signed players wait (' + gm.fmtS(DAY.SIGNEE_TRADE) + ' for offseason signings; ~3 months in season). Deadline ' + gm.fmtS(DAY.TRADE_DEADLINE) + '. Stepien rule: never without a first-rounder in consecutive future drafts.'],
    ['Traded player exception', 'Send out more salary than you take back while over the cap and you get the difference as an exception for one year, to absorb a player without sending salary back.'],
    ['Luxury tax', 'On the last day of the regular season: $1.50 per $1 over for the first ' + M(N.TAX_STEP) + ', then $1.75, $2.50, $3.25, and +$0.50 per bracket after. Repeaters (taxpayers in 3 of the previous 4 seasons) pay $1 more per bracket.'],
    ['2nd apron penalties', 'Above it: the first-round pick furthest out is frozen in trades; above it in 3 of 5 seasons, your first-rounder moves to the end of the round.'],
  ];
  return <table className="table" style={{ fontSize: '12.5px' }}><tbody>{rows.map(([k, v]) => <tr key={k}><td style={{ ...tdc, fontWeight: 600, width: '200px', verticalAlign: 'top' }}>{k}</td><td style={tdc}>{v}</td></tr>)}</tbody></table>;
}
