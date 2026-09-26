// Contracts: what's coming up on your roster, summer by summer. Who becomes a free agent and
// what kind (restricted with a qualifying offer, or unrestricted), the Bird rights you'll hold,
// player and team options, extension windows, estimated cap holds, and live offer sheets.
import type { VM } from '../vm';
import { BIRD_LABEL, capHold, describeContract, qoFor, yosOf } from '../../engine/cba';
import { decisionsFor } from '../../engine/cbaFlow';
import { fmtMoney } from '../../engine/capModel';
import { Link, muted, ratingTier, ruleH4 } from '../kit';

const tdc: React.CSSProperties = { padding: '5px 8px', verticalAlign: 'top' }, tdr: React.CSSProperties = { ...tdc, textAlign: 'right', whiteSpace: 'nowrap' };
const th: React.CSSProperties = { padding: '5px 8px', textAlign: 'left', fontWeight: 600, fontSize: '11px', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' };
const tag = (text: string, color: string, title?: string) => <span title={title} style={{ display: 'inline-block', fontSize: '11px', padding: '1px 7px', borderRadius: 3, border: '1px solid ' + color, color, whiteSpace: 'nowrap', marginRight: 4 }}>{text}</span>;
const C_RFA = 'var(--rt-0)', C_UFA = 'var(--rt-4)', C_OPT = 'var(--color-accent-700)', C_EXT = 'var(--rt-2)';
const NO_BIRD = ['tenDay', 'hardship', 'ex10'];

export function ContractsScreen({ vm }: { vm: VM }) {
  const { gm, s, T, open } = vm.ctx, P = gm.db.P, tid = s.me, Y = gm.Y, lbl = (y: number) => (y - 1) + '–' + String(y).slice(2);
  const ids: number[] = s.rosters[tid] || [];
  const offseason = ['draft', 'fa'].includes(s.phase), opening = s.phase === 'preseason' || (s.phase === 'regular' && s.day === 0);
  // Once this season is over, this summer's free agents have already left the roster.
  const first = offseason ? Y + 1 : Y, summers = [first, first + 1, first + 2, first + 3];
  const endOf = (p: any) => p.exp + (p.ext?.yrs || 0);

  // What happens to a player in the summer his deal runs out.
  const outlook = (p: any, y: number) => {
    const ahead = Math.max(0, y - Y), yos = yosOf(gm, p) + ahead, yrs = (p.yrsWith || 0) + ahead;
    const noBird = NO_BIRD.includes(p.ctype), bird = noBird ? null : yrs >= 3 ? 'full' : yrs >= 2 ? 'early' : 'non';
    const rfa = !noBird && ((!!p.rookieScale && !p.ext) || yos <= 3);
    const sal = gm.salAt(p, y), qo = rfa ? (y === Y || (y === first && offseason) ? qoFor(gm, p) : +(sal * 1.3).toFixed(2)) : 0;
    const hold = noBird ? 0 : capHold(gm, s, { ...p, birdTid: tid, yrsWith: yrs, prevAmt: sal, amt: sal, rfa: rfa ? { qo } : undefined });
    return { rfa, qo, bird, hold, sal, yos };
  };
  const extNow = (p: any) => !p.ext && ((!!p.rookieScale && ((p.exp === Y + 1 && offseason) || (p.exp === Y && opening)))
    || (!p.rookieScale && (p.signed?.season != null ? Y - p.signed.season >= 2 : (p.yrsWith || 0) >= 2) && p.exp <= Y + 1 && !['twoWay', 'ex10', 'tenDay', 'hardship'].includes(p.ctype)));
  const extNote = (p: any) => extNow(p) ? 'Eligible now' : p.ext ? 'Extended through ' + lbl(endOf(p)) : p.rookieScale ? 'Rookie extension: summer ' + (p.exp - 1) : p.exp > Y + 1 ? 'Veteran extension: summer ' + (p.exp - 1) : '';

  const who = (p: any) => (
    <td style={tdc}><Link onClick={() => open(p.id)}>{p.name}</Link> <span style={muted}>{p.pos} · {p.age}</span></td>);
  const rat = (p: any) => <td style={tdr}><b style={{ color: ratingTier(p.ovr).color }}>{p.ovr}</b> <span style={muted}>/</span> <span style={{ color: ratingTier(p.pot).color }}>{p.pot}</span></td>;

  // Summer-by-summer groups: deals ending, and options to decide (the option year starts that fall).
  const groups = summers.map(y => {
    const ending = ids.map(id => P[id]).filter(p => endOf(p) === y && !(p.opt?.season === y + 1)).sort((a, b) => b.amt - a.amt);
    const opts = ids.map(id => P[id]).filter(p => p.opt?.season === y + 1 && !p.ext).sort((a, b) => b.amt - a.amt);
    const off = ending.reduce((a, p) => a + gm.salAt(p, y), 0), rfaN = ending.filter(p => outlook(p, y).rfa).length;
    return { y, ending, opts, off, rfaN };
  });
  const sheets = (s.offerSheets || []).filter((o: any) => o.to === tid || o.from === tid);
  const mineFA = offseason ? (s.fa || []).map((id: number) => P[id]).filter((p: any) => p.birdTid === tid).sort((a: any, b: any) => b.ovr - a.ovr) : [];
  const decs = decisionsFor(gm, s, tid);
  const extNowL = ids.map(id => P[id]).filter(extNow);

  const box = (k: string, v: string, sub: string) => (
    <div key={k} style={{ borderTop: '1px solid var(--color-text)', paddingTop: 6 }}><div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase' }}>{k}</div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px' }}>{v}</div><div style={{ ...muted, fontSize: '12px' }}>{sub}</div></div>);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 18, marginBottom: 16 }}>
        {groups.slice(0, 3).map(g => box('Summer ' + g.y, g.ending.length + ' free agent' + (g.ending.length === 1 ? '' : 's'), (g.ending.length ? g.rfaN + ' restricted · ' + (g.ending.length - g.rfaN) + ' unrestricted · ' + fmtMoney(g.off) + ' off the books' : 'Nobody’s deal ends') + (g.opts.length ? ' · ' + g.opts.length + ' option' + (g.opts.length === 1 ? '' : 's') : '')))}
        {box('Extensions', String(extNowL.length), extNowL.length ? 'Eligible now: ' + extNowL.map(p => p.name.split(' ').slice(-1)[0]).join(', ') : 'Nobody eligible right now')}
      </div>
      <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 14px' }}>
        {tag('Restricted', C_RFA)} extend his qualifying offer and you can match any offer sheet. {tag('Unrestricted', C_UFA)} he can sign anywhere. {tag('Full Bird', 'var(--color-text)')} re-sign him over the cap up to the max (3+ seasons with you); Early Bird up to 175% of his salary (2 seasons); Non-Bird up to 120%. The cap hold counts against your cap from the draft until he signs or you renounce him. Set qualifying offers and team options on the <Link onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Cap sheet</Link>.
      </p>

      {sheets.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h4 style={{ ...ruleH4, color: 'var(--color-accent-800)' }}>Offer sheets</h4>
          {sheets.map((o: any) => { const p = P[o.pid], yours = o.to === tid; return (
            <div key={o.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--color-divider)', fontSize: 13 }}>
              {tag(yours ? 'To answer' : 'Waiting', yours ? C_RFA : C_OPT)}<Link onClick={() => open(p.id)}>{p.name}</Link> · {yours ? 'signed an offer sheet with the ' + T[o.from].region + ' ' + T[o.from].name : 'your offer sheet; the ' + T[o.to].region + ' ' + T[o.to].name + ' can match'}: {fmtMoney(o.terms.amt)} × {o.terms.years} yrs
              {yours && <> · <Link onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Match or decline on the Cap sheet ›</Link></>}
            </div>); })}
        </section>
      )}

      {mineFA.length > 0 && (
        <section style={{ marginBottom: 18 }}>
          <h4 style={ruleH4}>Your free agents now</h4>
          <table className="table" style={{ fontSize: '12.5px' }}>
            <thead><tr><th style={th}>Player</th><th style={{ ...th, textAlign: 'right' }}>Ovr / Pot</th><th style={th}>Status</th><th style={th}>Rights</th><th style={{ ...th, textAlign: 'right' }}>Cap hold</th><th style={{ ...th, textAlign: 'right' }}>Asking</th></tr></thead>
            <tbody>{mineFA.map((p: any) => (
              <tr key={p.id}>{who(p)}{rat(p)}
                <td style={tdc}>{p.rfa ? tag('Restricted', C_RFA, 'Qualifying offer ' + fmtMoney(p.rfa.qo)) : tag('Unrestricted', C_UFA)}{p.rfa && <span style={muted}>QO {fmtMoney(p.rfa.qo)}</span>}</td>
                <td style={tdc}>{BIRD_LABEL[(p.yrsWith || 0) >= 3 ? 'full' : (p.yrsWith || 0) >= 2 ? 'early' : 'non']}</td>
                <td style={tdr}>{fmtMoney(capHold(gm, s, p))}</td><td style={tdr}>{fmtMoney(p.ask || 0)}</td>
              </tr>))}</tbody>
          </table>
        </section>
      )}

      {decs.length > 0 && (
        <p style={{ fontSize: 13, margin: '0 0 16px', padding: '8px 12px', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)' }}>
          <b>{decs.length} decision{decs.length === 1 ? '' : 's'} due when free agency opens:</b> {decs.map(d => P[d.pid].name + ' (' + (d.kind === 'qo' ? 'qualifying offer ' : 'team option ') + fmtMoney(d.amt) + ')').join(', ')}. <Link onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Decide on the Cap sheet ›</Link>
        </p>
      )}

      {groups.map(g => (
        <section key={g.y} style={{ marginBottom: 20 }}>
          <h4 style={ruleH4}>Summer {g.y} <span style={{ ...muted, fontSize: 13, fontWeight: 400 }}>· after the {lbl(g.y)} season{g.y === first && !offseason ? ' (this season)' : ''}</span></h4>
          {g.ending.length === 0 && g.opts.length === 0 ? <div style={{ ...muted, fontSize: 13 }}>No contracts end and no options come up.</div> : (
            <table className="table" style={{ fontSize: '12.5px' }}>
              <thead><tr><th style={th}>Player</th><th style={{ ...th, textAlign: 'right' }}>Ovr / Pot</th><th style={th}>Contract</th><th style={{ ...th, textAlign: 'right' }}>Salary {lbl(g.y)}</th><th style={th}>Becomes</th><th style={th}>Your rights</th><th style={{ ...th, textAlign: 'right' }}>Est. cap hold</th><th style={th}>Extension</th></tr></thead>
              <tbody>
                {g.opts.map(p => { const o = outlook(p, g.y), player = p.opt.kind === 'player', nxt = gm.salAt(p, g.y + 1); return (
                  <tr key={'o' + p.id}>{who(p)}{rat(p)}<td style={tdc}>{describeContract(gm, p).split(' · ')[0]}</td><td style={tdr}>{fmtMoney(o.sal)}</td>
                    <td style={tdc}>{tag(player ? 'Player option' : 'Team option', C_OPT)}<span style={muted}>{fmtMoney(nxt)} for {lbl(g.y + 1)}: {player ? 'he decides' : 'you decide'}. If {player ? 'he opts out' : 'declined'}: unrestricted</span></td>
                    <td style={tdc}>{o.bird ? BIRD_LABEL[o.bird as 'full'] : 'None'}</td><td style={tdr}>{o.hold ? fmtMoney(o.hold) : '—'}</td><td style={{ ...tdc, fontSize: '11.5px' }}>{extNow(p) ? tag('Eligible now', C_EXT) : <span style={muted}>{extNote(p)}</span>}</td>
                  </tr>); })}
                {g.ending.map(p => { const o = outlook(p, g.y); return (
                  <tr key={p.id}>{who(p)}{rat(p)}<td style={tdc}>{describeContract(gm, p).split(' · ')[0]}{p.ext ? <span style={muted}> + extension</span> : null}</td><td style={tdr}>{fmtMoney(o.sal)}</td>
                    <td style={tdc}>{o.rfa ? <>{tag('Restricted', C_RFA)}<span style={muted}>QO ≈ {fmtMoney(o.qo)}</span></> : tag('Unrestricted', C_UFA)}{NO_BIRD.includes(p.ctype) && <span style={muted}> (short-term deal)</span>}</td>
                    <td style={tdc}>{o.bird ? BIRD_LABEL[o.bird as 'full'] : 'None'}</td><td style={tdr}>{o.hold ? fmtMoney(o.hold) : '—'}</td><td style={{ ...tdc, fontSize: '11.5px' }}>{extNow(p) ? tag('Eligible now', C_EXT) : <span style={muted}>{extNote(p)}</span>}</td>
                  </tr>); })}
              </tbody>
            </table>)}
        </section>
      ))}
      <p style={{ ...muted, fontSize: '11.5px' }}>Later summers are estimates: Bird rights assume he stays with you, qualifying offers and cap holds are based on his salary then. Players whose deals run past {lbl(summers[3])} aren’t shown.</p>
    </>
  );
}
