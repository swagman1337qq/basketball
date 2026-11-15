import type { VM } from '../vm';
import { Link, muted } from '../kit';
import { staffOf } from '../../engine/assistants';
import { teamSeasonValue } from '../teamSeasonStats';
import { rosterSeasonStats, type RosterSeasonStats } from '../rosterSeasonStats';

// Schedule-adjusted scoring margins, centered on the teams with recorded games.
export function rosterSrs(teams: any[], games: any[], playoffs = false) {
  const rows = teams.map(t => ({ tid: t.tid, margin: 0, opponents: [] as number[] }));
  for (const g of games.filter(g => (playoffs ? g.po === 'po' : !g.po))) {
    if (!rows[g.h] || !rows[g.a]) continue;
    rows[g.h].margin += g.hp - g.ap;
    rows[g.a].margin += g.ap - g.hp;
    rows[g.h].opponents.push(g.a);
    rows[g.a].opponents.push(g.h);
  }
  const played = rows.filter(r => r.opponents.length);
  let ratings = rows.map(() => 0);
  for (let n = 0; n < 100 && played.length; n++) {
    const next = ratings.slice();
    for (const r of played)
      next[r.tid] = 0.5 * ratings[r.tid] + (0.5 * (r.margin + r.opponents.reduce((s, opp) => s + ratings[opp], 0))) / r.opponents.length;
    const mean = played.reduce((s, r) => s + next[r.tid], 0) / played.length;
    ratings = next.map(v => v - mean);
  }
  return played.length ? ratings : null;
}

export function RosterTeamDetails({
  vm,
  tid,
  season,
  playoffs = false,
  data,
}: {
  vm: VM;
  tid: number;
  season: number;
  playoffs?: boolean;
  data?: RosterSeasonStats;
}) {
  const { gm, s, T, openTeamPage } = vm.ctx;
  const cur = season === gm.Y,
    team = T[tid],
    manager = s.gm?.name?.trim() || 'Name not set',
    scope = data || rosterSeasonStats(gm, s, season, playoffs),
    source = scope.teams;
  const stats = source[tid],
    games = stats?.gp || 0;
  const fmt = (v: number | undefined) => (v != null && Number.isFinite(v) ? v.toFixed(1) : '—');
  const value = (st: any, k: string) => teamSeasonValue(gm, st, k);
  const ranked = (k: string, lower = false) => {
    const v = value(stats, k),
      rows = Object.values(source).filter((x: any) => Number.isFinite(value(x, k)));
    if (!Number.isFinite(v)) return '—';
    const rank = 1 + rows.filter(x => (lower ? value(x, k) < v : value(x, k) > v)).length;
    return fmt(v) + ' (' + rank + ' of ' + T.length + ')';
  };
  const last = cur ? gm.resultsOf(s, tid).find(g => (playoffs ? g.po === 'po' : !g.po)) : null;
  const post = cur && (s.phase === 'playin' || s.phase === 'playoffs') ? gm.nextPostGame(s, tid) : null;
  const next = cur && (s.phase === 'regular' || s.phase === 'preseason') ? gm.nextUserGame(s.day, tid) : null;
  const srs = cur && games ? rosterSrs(T, scope.games, playoffs)?.[tid] : null;
  const expected = games && stats.pts + stats.oPts > 0 ? Math.round(games / (1 + Math.pow(stats.oPts / Math.max(1, stats.pts), 14))) : null;
  return (
    <div className="roster-team-details">
      {last && (
        <div>
          <b>Last game:</b>{' '}
          <Link onClick={() => last.bid && gm.setState({ boxId: last.bid, boxTeam: tid })}>
            {last.win ? 'W' : 'L'} {last.us}–{last.them}
          </Link>{' '}
          {last.home ? 'vs' : 'at'} <Link onClick={() => openTeamPage(last.opp)}>{T[last.opp].abbr}</Link>
        </div>
      )}
      <div>
        <b>Next game:</b>{' '}
        {post ? (
          <>
            {post.label} · {post.home === tid ? 'vs' : 'at'}{' '}
            <Link onClick={() => openTeamPage(post.home === tid ? post.away : post.home)}>
              {T[post.home === tid ? post.away : post.home].abbr}
            </Link>
          </>
        ) : next ? (
          <>
            {gm.fmtS(next.day)} {next.home ? 'vs' : 'at'} <Link onClick={() => openTeamPage(next.opp)}>{T[next.opp].abbr}</Link>
          </>
        ) : cur ? (
          'None scheduled'
        ) : (
          'Season complete'
        )}
      </div>
      {cur && (
        <>
          {vm.ctx.isMine(tid) && (
            <div>
              <b>Head coach:</b> {manager}
            </div>
          )}
          <div>
            <b>Executive:</b> {vm.ctx.isMine(tid) ? manager : team.gm} · <b>Owner:</b> {team.owner}
          </div>
        </>
      )}
      {scope.legacy && (
        <p style={{ ...muted, fontSize: 12 }}>
          Older saved postseason totals may include play-in games. Unrecorded team details are unavailable.
        </p>
      )}
      <div>
        <b>PTS/G:</b> {ranked('pts')} · <b>Opp PTS/G:</b> {ranked('oPts', true)}
      </div>
      <div>
        <span title="Schedule-adjusted scoring margin, centered on the league">
          <b>SRS:</b> {fmt(srs ?? undefined)}
        </span>{' '}
        · <b>Pace:</b> {ranked('pace')}
      </div>
      <div>
        <b>Off Rtg:</b> {ranked('off')} · <b>Def Rtg:</b> {ranked('def', true)} · <b>Net Rtg:</b> {ranked('net')}
      </div>
      <div title="Estimated wins from points scored and allowed: PF^14 / (PF^14 + PA^14), over games played">
        <b>Expected W–L (est.):</b> {expected == null ? '—' : expected + '–' + (games - expected)}
      </div>
      {cur && (
        <div>
          <b>Arena:</b> {team.arena || team.region + ' Arena'}
        </div>
      )}
    </div>
  );
}

export function RosterReports({ vm, tid, season, ids }: { vm: VM; tid: number; season: number; ids: number[] }) {
  const { gm, s, T, open, openTeamPage } = vm.ctx;
  if (season !== gm.Y) return null;
  const injured = ids.map(id => gm.db.P[id]).filter(p => p?.inj),
    staff = staffOf(tid);
  return (
    <div className="roster-reports">
      <section>
        <h3>Injury Report</h3>
        {injured.length ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="roster-report-table" aria-label="Injury report">
              <thead>
                <tr>
                  {['Player', 'Team', 'Update', 'Description'].map(x => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {injured.map(p => {
                  const h = p.inj.h != null ? p.injHist?.[p.inj.h] : null;
                  return (
                    <tr key={p.id}>
                      <td>
                        <Link onClick={() => open(p.id)}>{p.name}</Link>
                      </td>
                      <td>
                        <Link onClick={() => openTeamPage(tid)}>
                          {T[tid].region} {T[tid].name}
                        </Link>
                      </td>
                      <td>{h?.day != null ? gm.fmtDay(h.day) : 'Date not recorded'}</td>
                      <td>
                        <b>{p.inj.dtd ? 'Day to day' : 'Out'}</b> · {p.inj.name} · {gm.injText(p, true)}
                        {p.inj.dtd ? ' · Can play at reduced effectiveness' : ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ ...muted, fontSize: '12.5px' }}>No current injuries.</p>
        )}
      </section>
      <section>
        <h3>Assistant Coaches and Staff</h3>
        <table className="roster-report-table roster-staff" aria-label="Assistant coaches and staff">
          <tbody>
            {staff.map((coach, i) => (
              <tr key={i}>
                <td>{coach.name}</td>
                <td>{coach.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
