// Pre-Free Agency: between the draft and June 30. Player options (the player's call) are in;
// you decide team options, qualifying offers, which expiring contracts to keep and which to let
// go, and who to extend once the July 6 window opens. Free agency waits until it's all decided.
import type { VM } from '../vm';
import { preFAChoose, preFARows, type PreRow } from '../../engine/preFA';
import { fmtMoney } from '../../engine/capModel';
import { Link, muted, ratingTier, ruleH4 } from '../kit';

const SECTIONS: [PreRow['kind'], string, string][] = [
  ['teamOpt', 'Team options', 'Your call: exercise to keep him next season at the option salary, or decline and he becomes a free agent.'],
  ['expiring', 'Expiring contracts', 'These deals end June 30. Re-sign now (an extension he has to agree to), keep his rights and re-sign him in free agency, extend a qualifying offer to make him restricted, or let him go.'],
  ['extend', 'Extension candidates (optional)', 'Entering the final year of their deals. Extensions open July 6; choose Extend and you’ll get a reminder then.'],
];

export function PreFAScreen({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx, P = gm.db.P, Y = gm.Y, live = s.phase === 'draft' && !!s.preFA, inFA = s.phase === 'fa';
  if (inFA) return <p style={muted}>Free agency is open: this summer’s decisions are done. Next summer’s options and expiring contracts show here once the season starts.</p>;
  const rows = preFARows(gm, s, s.me), left = rows.filter(r => r.required && !r.decided).length, easy = !!s.easy?.cap;
  const opts = (s.preFA?.opts || []).filter((o: any) => o.tid === s.me);
  const openContract = (id: number) => { open(id); gm.setState({ ptab: 'contract' }); };
  const choose = (r: PreRow, k: string) => k === 'resignNow' ? openContract(r.pid) : preFAChoose(gm, r.pid, k);
  return (
    <div style={{ display: 'grid', gap: '22px' }}>
      <div className="card" style={{ padding: '14px 18px', borderColor: live && left ? 'var(--color-accent)' : 'var(--color-divider)' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>
          {live ? (left ? left + ' decision' + (left === 1 ? '' : 's') + ' left before free agency opens' : 'All set: open free agency from the bar above') : 'Preview of your ' + Y + ' summer'}
        </div>
        <div style={{ ...muted, fontSize: '12.5px', marginTop: 4 }}>
          {live ? 'Free agency opens June 30 and can’t start until every team option and expiring contract has a decision.' + (easy ? ' Easy mode is on: anything you leave undecided gets your assistant’s recommendation.' : '') : s.phase === 'draft' ? 'Finish the draft, then start Pre-Free Agency from the bar above.' : 'Pre-Free Agency opens after the draft. You can set team options and qualifying offers early; player options are decided by the players when it opens.'} Recommended choices are marked ★.
        </div>
      </div>

      {live && <section>
        <h4 style={ruleH4}>Player options</h4>
        <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>The player decides. Those who opted out are now expiring contracts below.</p>
        {opts.length ? opts.map((o: any) => { const p = P[o.pid]; return (
          <div key={o.pid} style={{ display: 'flex', gap: 10, alignItems: 'baseline', padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
            <Link onClick={() => open(o.pid)} style={{ fontWeight: 600 }}>{p.name}</Link>
            <span style={{ ...muted, fontSize: '12px' }}>{p.pos} · {p.age} · <span style={{ color: ratingTier(p.ovr).color }}>{p.ovr}</span></span>
            <span style={{ marginLeft: 'auto', color: o.stay ? 'var(--gm-good)' : 'var(--gm-bad)', fontWeight: 600 }}>{o.stay ? 'Opted in · ' + fmtMoney(o.amt) + ' next season' : 'Opted out · free agent June 30'}</span>
          </div>); }) : <p style={{ ...muted, fontSize: '12.5px', margin: 0 }}>None of your players had a player option this summer.</p>}
      </section>}

      {SECTIONS.map(([kind, title, blurb]) => { const rs = rows.filter(r => r.kind === kind); return (
        <section key={kind}>
          <h4 style={ruleH4}>{title} {rs.length > 0 && <span style={{ ...muted, fontSize: '13px', fontWeight: 400 }}>· {rs.length}</span>}</h4>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>{blurb}</p>
          {!rs.length && <p style={{ ...muted, fontSize: '12.5px', margin: 0 }}>None.</p>}
          {rs.map(r => { const p = P[r.pid], need = r.required && !r.decided; return (
            <div key={r.pid} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: '6px 16px', alignItems: 'center', padding: '9px 10px', borderBottom: '1px solid var(--color-divider)', borderLeft: '3px solid ' + (need ? 'var(--color-accent)' : 'transparent') }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Link onClick={() => open(r.pid)} style={{ fontWeight: 600, fontSize: '14px' }}>{p.name}</Link>
                  <span style={{ ...muted, fontSize: '12px' }}>{p.pos} · {p.age} yrs · <span style={{ color: ratingTier(p.ovr).color }}>{p.ovr}</span>/{p.pot}</span>
                  <span style={{ fontSize: '12.5px' }}>{r.head}</span>
                </div>
                <div style={{ ...muted, fontSize: '12px', marginTop: 2 }}>{r.detail}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: need ? 'var(--color-accent-700)' : r.decided ? 'var(--gm-good)' : 'var(--color-neutral-700)', marginRight: 4 }}>{r.status}</span>
                {r.choices.map(c => (
                  <button key={c.k} className={c.on ? 'btn btn-primary' : 'btn btn-secondary'} title={c.title} onClick={() => choose(r, c.k)} style={{ fontSize: '12px', padding: '3px 9px' }}>
                    {c.label}{c.rec ? ' ★' : ''}
                  </button>
                ))}
              </div>
            </div>); })}
        </section>); })}
    </div>
  );
}
