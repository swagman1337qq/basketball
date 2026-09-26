// Multi-team dashboard: every franchise you run at a glance, with alerts, and switching.
import type { VM } from '../vm';
import { teamSalary, rosterMax, stdIds } from '../../engine/cba';
import { h4Style, Kicker, Link, muted } from '../kit';

export function MyTeamsScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam, money, ord } = vm.ctx;
  const P = gm.db.P;
  const others = T.filter(t => !gm.isUser(s, t.tid));
  return (
    <>
      <p style={{ ...muted, margin: '0 0 16px' }}>
        You run {s.managed.length} franchise{s.managed.length === 1 ? '' : 's'}. The one on screen is highlighted; switch to manage another. Each club keeps its own tactics, budget, scouts, training and log.
        {s.managed.length > 1 ? ' Resigning from a club hands it to the AI, which runs it by its owner’s archetype.' : ''}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(340px,1fr))', gap: '18px', marginBottom: '28px' }}>
        {s.managed.map(tid => {
          const t = T[tid], club = gm.clubOf(s, tid), ids = s.rosters[tid], pay = teamSalary(gm, s, tid), ceil = gm.ownerCeiling(t.arch);
          const conf = T.filter(x => x.conf === t.conf).sort((a, b) => gm.pct(b) - gm.pct(a) || b.w - a.w), seed = conf.indexOf(t) + 1;
          const post = gm.nextPostGame(s, tid), g = post ? { opp: post.home === tid ? post.away : post.home, home: post.home === tid } : s.phase === 'regular' ? gm.userGame(s.day, tid) : null;
          const inj = ids.filter(id => P[id].inj), inbox = (club?.inbox || []).filter(x => !x.done).length;
          const alerts: [string, string][] = [];
          const std = stdIds(gm, ids).length, lim = rosterMax(s);
          if (std > lim) alerts.push(['bad', std + ' standard contracts: cut to ' + lim]);
          if (std < 14 && s.phase !== 'fa' && s.phase !== 'draft') alerts.push(['bad', 'Only ' + std + ' players: sign to 14']);
          if (pay > ceil) alerts.push(['bad', 'Payroll ' + money(pay) + ' is over the owner’s ' + money(ceil) + ' ceiling']);
          else if (pay > gm.TAX) alerts.push(['warn', 'In the luxury tax (' + money(pay - gm.TAX) + ' over)']);
          if (inbox) alerts.push(['warn', inbox + ' decision' + (inbox === 1 ? '' : 's') + ' waiting in the inbox']);
          const on = tid === s.me;
          return (
            <section key={tid} className="card" style={{ padding: '14px 16px', gap: '10px', borderColor: on ? 'var(--color-accent)' : undefined }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {logo(tid, 48)}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Kicker accent={on}>{on ? 'On screen' : t.conf + 'ern Conference'}</Kicker>
                  <Link onClick={() => openTeam(tid)} style={{ fontFamily: 'var(--font-heading)', fontSize: '21px', fontWeight: 600 }}>{t.region} {t.name}</Link>
                  <div style={{ ...muted, fontSize: '12px' }}>{t.w}–{t.l} · {ord(seed)} in the {t.conf} · Owner {t.owner} ({t.arch})</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', borderTop: '1px solid var(--color-divider)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div><span style={muted}>Next: </span>{g ? <>{post ? post.label + ' · ' : gm.fmtS(s.day) + ' · '}{g.home ? 'vs ' : 'at '}<Link onClick={() => openTeam(g.opp)}>{T[g.opp].region}</Link> ({T[g.opp].w}–{T[g.opp].l})</> : s.phase === 'playoffs' || s.phase === 'playin' ? 'Season over' : 'No games until the regular season'}</div>
                <div><span style={muted}>Payroll: </span>{money(pay)} · {ids.length} players</div>
                <div><span style={muted}>Injuries: </span>{inj.length ? inj.map((id, i) => <span key={id}>{i ? ', ' : ''}<Link onClick={() => open(id)}>{P[id].name}</Link> ({P[id].inj.dtd ? 'DTD' : P[id].inj.games + 'g'})</span>) : 'None'}</div>
              </div>
              {alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '12px' }}>
                  {alerts.map(([k, a], i) => <div key={i} style={{ color: k === 'bad' ? 'var(--gm-bad)' : 'var(--color-accent-700)' }}>● {a}</div>)}
                </div>
              )}
              <div style={{ display: 'flex', gap: '6px' }}>
                {!on && <button className="btn btn-primary" onClick={() => gm.switchTeam(tid)} style={{ fontSize: '13px' }}>Switch to {t.abbr}</button>}
                {s.managed.length > 1 && <button className="btn btn-ghost" onClick={() => gm.handToAI(tid, 'Resigned from')} style={{ fontSize: '12px' }}>Resign · hand to AI</button>}
              </div>
            </section>
          );
        })}
      </div>
      <section>
        <h4 style={h4Style}>Take over another franchise</h4>
        {s.god ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {others.map(t => (
              <button key={t.tid} className="btn btn-secondary" onClick={() => gm.takeOver(t.tid)} style={{ fontSize: '12px', padding: '4px 10px', gap: '6px' }}>{logo(t.tid, 16)}{t.abbr}</button>
            ))}
          </div>
        ) : (
          <p style={{ ...muted, margin: 0 }}>Turn on God Mode in Settings to take over any team mid-season, or find a new job through the Career screen.</p>
        )}
      </section>
    </>
  );
}
