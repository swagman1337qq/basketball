import { useState } from 'react';
import { Game } from '../../engine/Game';
import { Link, linkNames } from '../kit';

export const periodNumbers = (period: string, count: number) =>
  period === 'Game'
    ? Array.from({ length: count }, (_, i) => i + 1)
    : period === 'H1'
      ? [1, 2]
      : period === 'H2'
        ? [3, 4]
        : [Number(period.replace(/\D/g, '')) + (period.startsWith('OT') ? 4 : 0)];
export function periodBox(box: any, period: string) {
  if (period === 'Game' || !box.details?.periods) return box;
  const selected = periodNumbers(period, Math.max(box.home.qs.length, box.away.qs.length));
  const result = { ...box };
  for (const side of ['home', 'away']) {
    const rows = new Map<number, number[]>();
    for (const q of selected) {
      const current = box.details.periods[q - 1]?.[side] || [],
        previous = box.details.periods[q - 2]?.[side] || [];
      for (const line of current) {
        const before = previous.find((p: number[]) => p[0] === line[0]);
        const row = rows.get(line[0]) || [line[0], ...Game.BOX_F.map(() => 0)];
        Game.BOX_F.forEach((f, i) => (row[i + 1] += f === 'gs' ? line[i + 1] : line[i + 1] - (before?.[i + 1] || 0)));
        rows.set(line[0], row);
      }
    }
    result[side] = {
      ...box[side],
      pts: selected.reduce((n, q) => n + (box[side].qs[q - 1] || 0), 0),
      lines: [...rows.values()].filter(l => l[1] > 0),
    };
  }
  return result;
}
const sum = (s: any, field: string) => s.lines.reduce((n: number, l: number[]) => n + (l[1 + Game.BOX_F.indexOf(field)] || 0), 0);
const percent = (a: number, b: number) => (b ? ((100 * a) / b).toFixed(1) : '—');
export function FourFactors({ box, T, onTeam }: any) {
  const sides = [box.away, box.home];
  const possessions = sides.map(s => sum(s, 'fga') + 0.44 * sum(s, 'fta') - sum(s, 'orb') + sum(s, 'tov'));
  const poss = (possessions[0] + possessions[1]) / 2;
  const minutes = sum(box.home, 'min') / 5;
  return (
    <section>
      <h3>Four Factors</h3>
      <table className="box-summary-table">
        <thead>
          <tr>
            {['Team', 'Pace', 'eFG%', 'TOV%', 'ORB%', 'FT/FGA', 'ORtg'].map(x => (
              <th key={x}>{x}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sides.map((s, i) => (
            <tr key={s.tid}>
              <th>
                <Link onClick={() => onTeam(s.tid)}>{T[s.tid].abbr}</Link>
              </th>
              <td>{minutes && poss ? ((poss * 48) / minutes).toFixed(1) : '—'}</td>
              <td>{percent(sum(s, 'fgm') + 0.5 * sum(s, 'tpm'), sum(s, 'fga'))}</td>
              <td>{percent(sum(s, 'tov'), sum(s, 'fga') + 0.44 * sum(s, 'fta') + sum(s, 'tov'))}</td>
              <td>{percent(sum(s, 'orb'), sum(s, 'orb') + sum(sides[1 - i], 'drb'))}</td>
              <td>{sum(s, 'fga') ? (sum(s, 'ftm') / sum(s, 'fga')).toFixed(3) : '—'}</td>
              <td>{poss ? ((100 * s.pts) / poss).toFixed(1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <small className="box-muted">Pace and offensive rating use estimated possessions.</small>
    </section>
  );
}
export function BoxScoreDetails({ box, vm, tab, period, onPlayer }: any) {
  const [players, setPlayers] = useState<Record<string, string>>({});
  const { T, gm } = vm.ctx,
    periods = periodNumbers(period, Math.max(box.home.qs.length, box.away.qs.length));
  if (!box.details)
    return (
      <p className="box-empty">
        Detailed {tab === 'pbp' ? 'play-by-play' : tab === 'shots' ? 'shot charts' : 'rotation'} data was not recorded for this saved game.
        New games record these details.
      </p>
    );
  const details = box.details;
  if (tab === 'pbp') {
    let score = '0–0';
    let lead = 0,
      changes = 0,
      ties = 0;
    for (const event of details.pbp || []) {
      if (!event.score || (period !== 'Game' && !periods.includes(event.q))) continue;
      const [away, home] = event.score.split(/[–-]/).map(Number),
        next = Math.sign(home - away);
      if (!next) ties++;
      else {
        if (lead && lead !== next) changes++;
        lead = next;
      }
    }
    return (
      <section>
        <h3>Game Summary</h3>
        <div className="box-game-summary">
          <div>
            <b>Ties</b>
            <p>{ties}</p>
          </div>
          <div>
            <b>Lead changes</b>
            <p>{changes}</p>
          </div>
          {['pts', 'orb', 'ast'].map(field => {
            const rows = periodBox(box, period),
              lines = [...rows.home.lines, ...rows.away.lines],
              value = (l: number[]) => (field === 'orb' ? l[9] + l[10] : l[1 + Game.BOX_F.indexOf(field)]),
              max = Math.max(0, ...lines.map(value));
            return (
              <div key={field}>
                <b>{field === 'pts' ? 'Scoring leader' : field === 'orb' ? 'Rebounding leader' : 'Assist leader'}</b>
                <p>
                  {lines
                    .filter(l => value(l) === max)
                    .map(l => gm.db.P[l[0]]?.name)
                    .join(', ')}{' '}
                  · {max}
                </p>
              </div>
            );
          })}
        </div>
        <h3>Play-by-Play</h3>
        <div className="box-table-scroll">
          <table className="box-pbp">
            <thead>
              <tr>
                <th>Time</th>
                <th>{T[box.away.tid].region}</th>
                <th>Score</th>
                <th>{T[box.home.tid].region}</th>
              </tr>
            </thead>
            <tbody>
              {(details.pbp || []).map((event: any, i: number) => {
                if (event.score) score = event.score;
                if (period !== 'Game' && !periods.includes(event.q)) return null;
                const words = linkNames(event.text, onPlayer, {
                  people: (event.ids || []).map((id: number) => ({ id, name: gm.db.P[id]?.name || '' })),
                });
                return (
                  <tr key={i} className={event.score ? 'box-scoring-play' : undefined}>
                    <td>{event.time}</td>
                    <td>
                      {event.side === 'away' ? (
                        <>
                          {words}
                          <small>{event.sub}</small>
                        </>
                      ) : (
                        ''
                      )}
                    </td>
                    <td>{score}</td>
                    <td>
                      {event.side === 'home' ? (
                        <>
                          {words}
                          <small>{event.sub}</small>
                        </>
                      ) : (
                        ''
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  }
  if (tab === 'shots')
    return (
      <div className="box-team-sections">
        {['away', 'home'].map(side => {
          const sd = box[side],
            shots = (details.shots || []).filter((x: any) => x.side === side && periods.includes(x.q)),
            pid = players[side] || '';
          const filtered = shots.filter((x: any) => !pid || String(x.pid) === pid);
          const zones = [
            ['rim', 'At rim', 250, 65],
            ['paint', 'Paint', 250, 150],
            ['mid', 'Mid-range', 250, 270],
            ['c3', 'Corner three', 55, 90],
            ['atb', 'Above-break three', 250, 370],
          ] as const;
          return (
            <section key={side}>
              <h2>
                {T[sd.tid].region} {T[sd.tid].name}
              </h2>
              <label>
                Player{' '}
                <select className="input" value={pid} onChange={e => setPlayers({ ...players, [side]: e.target.value })}>
                  <option value="">All players</option>
                  {[...new Set<number>(shots.map((x: any) => x.pid))].map(id => (
                    <option key={id} value={id}>
                      {gm.db.P[id]?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn btn-ghost" onClick={() => setPlayers({ ...players, [side]: '' })}>
                Reset
              </button>
              <p className="box-muted">
                {filtered.filter((x: any) => x.made).length} / {filtered.length} FG · Green dots: makes. Red crosses: misses. Markers are
                grouped by recorded zone; positions within each zone are illustrative.
              </p>
              <table className="box-summary-table">
                <thead>
                  <tr>
                    {['Period', 'FG', 'FGA', 'FG%', '3P', '3PA', '3P%'].map(x => (
                      <th key={x}>{x}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map(q => {
                    const qs = filtered.filter((x: any) => x.q === q),
                      made = qs.filter((x: any) => x.made).length,
                      threes = qs.filter((x: any) => x.zone === 'c3' || x.zone === 'atb'),
                      tm = threes.filter((x: any) => x.made).length;
                    return (
                      <tr key={q}>
                        <th>{q <= 4 ? 'Q' + q : 'OT' + (q - 4)}</th>
                        <td>{made}</td>
                        <td>{qs.length}</td>
                        <td>{percent(made, qs.length)}</td>
                        <td>{tm}</td>
                        <td>{threes.length}</td>
                        <td>{percent(tm, threes.length)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <svg className="box-court" viewBox="0 0 500 470" role="img" aria-label={T[sd.tid].region + ' shooting by zone'}>
                <rect x="1" y="1" width="498" height="468" fill="var(--color-bg)" stroke="currentColor" />
                <path
                  d="M190 0V190H310V0M30 0V140Q250 445 470 140V0M190 190A60 60 0 0 0 310 190M220 42H280"
                  fill="none"
                  stroke="currentColor"
                />
                <circle cx="250" cy="55" r="8" fill="none" stroke="currentColor" />
                {filtered.map((shot: any, i: number) => {
                  const a = ((shot.pid * 31 + Math.floor(shot.clock) * 7 + i * 137) % 1000) / 1000,
                    angle = a * Math.PI * 2;
                  let x = 250,
                    y = 55;
                  if (shot.zone === 'rim') {
                    x += 22 * Math.cos(angle);
                    y += 18 * Math.sin(angle);
                  } else if (shot.zone === 'paint') {
                    x += 45 * Math.cos(angle);
                    y = 125 + 50 * Math.sin(angle);
                  } else if (shot.zone === 'mid') {
                    x += 150 * Math.cos(angle);
                    y = 70 + 160 * Math.abs(Math.sin(angle));
                  } else if (shot.zone === 'c3') {
                    x = i % 2 ? 15 : 485;
                    y = 25 + a * 100;
                  } else {
                    x += 235 * Math.cos(0.25 + a * 2.64);
                    y = 55 + 320 * Math.sin(0.25 + a * 2.64);
                  }
                  return (
                    <g key={i} fill={shot.made ? '#2d9b4b' : '#d94141'} stroke={shot.made ? '#2d9b4b' : '#d94141'}>
                      <title>
                        {gm.db.P[shot.pid]?.name} · Q{shot.q} · {shot.zone} · {shot.made ? 'Made' : 'Missed'}
                      </title>
                      {shot.made ? (
                        <circle cx={x} cy={y} r="4" />
                      ) : (
                        <path d={'M' + (x - 4) + ' ' + (y - 4) + 'l8 8m0 -8l-8 8'} strokeWidth="2" />
                      )}
                    </g>
                  );
                })}
              </svg>
              <div className="box-shot-zones">
                {zones.map(([key, label]) => {
                  const group = filtered.filter((s: any) => s.zone === key),
                    made = group.filter((s: any) => s.made).length;
                  return (
                    <span key={key}>
                      {label}:{' '}
                      <b>
                        {made}/{group.length}
                      </b>
                    </span>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    );
  const totalSeconds = Math.max(1, ...(details.timeline || []).map((x: any) => x[1]));
  return (
    <div className="box-team-sections">
      <p className="box-muted">
        On = point differential while playing. Off = team differential while on the bench. Net = On minus Off. Green/red segments show each
        stint's point differential.
      </p>
      {['away', 'home'].map(side => {
        const sd = box[side],
          sign = side === 'home' ? 1 : -1,
          index = side === 'home' ? 2 : 3;
        const timeline = (details.timeline || []).filter(
          (x: any) =>
            period === 'Game' ||
            periods.some(q => x[0] >= (q <= 4 ? (q - 1) * 720 : 2880 + (q - 5) * 300) && x[0] < (q <= 4 ? q * 720 : 2880 + (q - 4) * 300)),
        );
        const teamDiff = timeline.reduce((n: number, x: any) => n + sign * (x[4] - x[5]), 0);
        return (
          <section key={side}>
            <h2>
              {T[sd.tid].region} {T[sd.tid].name}
            </h2>
            <div className="box-rotation-axis">
              {Array.from({ length: Math.max(box.home.qs.length, box.away.qs.length) }, (_, i) => (
                <span key={i} style={{ flex: i < 4 ? 720 : 300 }}>
                  {i < 4 ? 'Q' + (i + 1) : 'OT' + (i - 3)}
                </span>
              ))}
            </div>
            {sd.lines.map((l: number[]) => {
              const stints: any[] = [];
              for (const trip of timeline)
                if (trip[index].includes(l[0])) {
                  const diff = sign * (trip[4] - trip[5]),
                    last = stints.at(-1);
                  if (last && last.end === trip[0]) {
                    last.end = trip[1];
                    last.diff += diff;
                  } else stints.push({ start: trip[0], end: trip[1], diff });
                }
              const on = stints.reduce((n, x) => n + x.diff, 0),
                off = teamDiff - on;
              return (
                <div className="box-rotation-player" key={l[0]}>
                  <Link onClick={() => onPlayer(l[0])}>{gm.db.P[l[0]]?.name || 'Unknown'}</Link>
                  <span>
                    {' '}
                    · On {on > 0 ? '+' : ''}
                    {on} · Off {off > 0 ? '+' : ''}
                    {off} · Net {on - off > 0 ? '+' : ''}
                    {on - off}
                  </span>
                  <div className="box-rotation-track">
                    {stints.map((x, i) => (
                      <span
                        key={i}
                        title={(x.start / 60).toFixed(1) + '–' + (x.end / 60).toFixed(1) + ' minutes: ' + x.diff}
                        style={{
                          left: (100 * x.start) / totalSeconds + '%',
                          width: (100 * (x.end - x.start)) / totalSeconds + '%',
                          background: x.diff > 0 ? '#8bd18b' : x.diff < 0 ? '#ed9993' : '#b6b6b6',
                          color: '#171715',
                        }}
                      >
                        {x.diff > 0 ? '+' : ''}
                        {x.diff}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
