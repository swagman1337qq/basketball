import { useLayoutEffect, useMemo, useState } from 'react';
import { Game } from '../engine/Game';
import { TeamLogo } from './TeamLogo';
import { inkOn } from './kit';

export type LeagueStart = '' | 'worst' | 'hopeless' | 'spectate';
const market = (m: number) => (m >= 1.15 ? 'Large' : m >= 0.95 ? 'Mid-large' : m >= 0.85 ? 'Mid-size' : 'Small');

export function TitleNewLeague({
  onCreate,
  onTeamChange,
  busy,
}: {
  onCreate: (name: string, seed: number, tids: number[], start: LeagueStart) => void;
  onTeamChange: (team: any) => void;
  busy: boolean;
}) {
  const [name, setName] = useState('My league');
  const [seed, setSeed] = useState(() => String(1 + Math.floor(Math.random() * 999999)));
  const [sel, setSel] = useState<number[]>([0]);
  const [multi, setMulti] = useState(false);
  const [start, setStart] = useState<LeagueStart>('');
  const seedNum = Number.isFinite(Number(seed)) && seed !== '' ? Math.floor(Number(seed)) : 2027;
  const teams = useMemo(() => Game.preview(seedNum), [seedNum]);
  const picked = teams.find(t => t.tid === sel[0]) || teams[0];
  const toggle = (t: number) => setSel(x => (!multi ? [t] : x.includes(t) ? (x.length > 1 ? x.filter(y => y !== t) : x) : [...x, t]));
  useLayoutEffect(() => onTeamChange(picked), [picked, onTeamChange]);
  const create = () => {
    if (!busy) onCreate(name.trim() || 'My league', seedNum, sel, start);
  };
  return (
    <fieldset className="title-new-fields" disabled={busy} aria-label="New league setup">
      <div className="title-new-layout">
        <section className="card title-new-options" style={{ padding: '16px', gap: '12px' }}>
          <div className="card-kicker" style={{ color: 'var(--color-accent-700)' }}>
            New league
          </div>
          <div className="field">
            <label htmlFor="league-name">League name</label>
            <input
              id="league-name"
              className="input"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && create()}
            />
          </div>
          <div className="field">
            <label htmlFor="league-seed">World seed</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                id="league-seed"
                className="input"
                inputMode="numeric"
                value={seed}
                onChange={e => setSeed(e.target.value.replace(/[^\d]/g, ''))}
              />
              <button
                className="btn btn-ghost"
                onClick={() => setSeed(String(1 + Math.floor(Math.random() * 999999)))}
                style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                title="A new random world"
              >
                🎲 New world
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setSeed('2027')}
                style={{ fontSize: '12px', whiteSpace: 'nowrap' }}
                title="The reference world: the same players every time"
              >
                2027
              </button>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)', marginTop: '4px' }}>
              Each new league starts in a fresh random world: new players, rosters, owners and draft classes. Type a seed to replay a world
              exactly (the same seed always builds the same league; 2027 is the reference world).
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              borderTop: '1px solid var(--color-divider)',
              paddingTop: '12px',
            }}
          >
            <TeamLogo team={picked} size={48} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-700)' }}>
                {sel.length > 1 ? 'Your teams · you start on' : 'Your team'}
              </div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 600, lineHeight: 1.1 }}>
                {picked.region} {picked.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-neutral-700)' }}>
                {sel.length > 1
                  ? '+ ' +
                    (sel.length - 1) +
                    ' more: ' +
                    sel
                      .slice(1)
                      .map(t => teams[t].abbr)
                      .join(', ')
                  : picked.outlook + ' · ' + picked.conf + 'ern Conference'}
              </div>
            </div>
          </div>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={start === 'worst'}
              onChange={e => setStart(e.target.checked ? 'worst' : '')}
              style={{ marginTop: '3px' }}
            />
            <span>
              <b>Give me the worst roster</b>
              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--color-neutral-600)' }}>
                {start === 'worst'
                  ? 'You start with the league\u2019s weakest roster, the ' +
                    teams.slice().sort((a, b) => a.top8 - b.top8)[0].region +
                    ' roster (team rating ' +
                    teams.slice().sort((a, b) => a.top8 - b.top8)[0].top8 +
                    '), without its blue-chip prospects: they go to other teams for veterans about as good today, so one modest prospect at most is left' +
                    (sel.length > 1 ? '; your other teams take the next-worst rosters, the same way' : '') +
                    '. Your club keeps its name, market and owner.'
                  : 'The weakest roster on the floor today.'}
              </span>
            </span>
          </label>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={start === 'hopeless'}
              onChange={e => setStart(e.target.checked ? 'hopeless' : '')}
              style={{ marginTop: '3px' }}
            />
            <span>
              <b>Give me the most hopeless roster</b>
              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--color-neutral-600)' }}>
                {start === 'hopeless'
                  ? 'Not just bad: stuck. You start from the ' +
                    (teams.find((t: any) => t.hopeless) || teams[0]).region +
                    ' roster, the worst overall situation among the ten weakest, and it gets worse: no real prospects, an old rotation, three or four mediocre veterans on big contracts with years left (over the luxury tax, no cap room), role players starting at guard, and this season\u2019s first-round pick plus another first already traded away. Bottom five in team rating' +
                    (sel.length > 1 ? '; your other teams get the next most hopeless situations' : '') +
                    '. Your club keeps its name, market and owner.'
                  : 'A bad team with bad contracts, an old roster, no young talent and no picks: hard to fix.'}
              </span>
            </span>
          </label>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '13px' }}>
            <input
              type="checkbox"
              checked={start === 'spectate'}
              onChange={e => setStart(e.target.checked ? 'spectate' : '')}
              style={{ marginTop: '3px' }}
            />
            <span>
              <b>Spectator Mode</b>
              <span style={{ display: 'block', fontSize: '11.5px', color: 'var(--color-neutral-600)' }}>
                {start === 'spectate'
                  ? 'You don\u2019t run a team: the AI makes every decision for all ' +
                    teams.length +
                    ' teams (rosters, trades, free agency, the draft, lineups) and nothing stops to ask you. Sim a day, a week, a season or several, and look at the standings, stats, awards, transactions and playoffs as you go. Stop any time and pick a team to manage.'
                  : 'Watch the league run itself, season after season, without running a team.'}
              </span>
            </span>
          </label>
          {!start && (
            <div style={{ fontSize: '11.5px', color: 'var(--color-neutral-600)', marginTop: '-6px' }}>
              None: you run the team you pick, and rosters are dealt at random, as listed below.
            </div>
          )}
          <button className="btn btn-primary" onClick={create} style={{ width: '100%' }}>
            {start === 'spectate'
              ? 'Start spectating'
              : sel.length > 1
                ? 'Start running ' + sel.length + ' franchises'
                : 'Start as GM of the ' + picked.region + ' ' + picked.name}
          </button>
          <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>
            Check one or more clubs below. The first one you pick is on screen first; switch any time.
          </div>
        </section>
        <section className="title-team-picker">
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              borderBottom: '1px solid var(--color-text)',
              paddingBottom: '6px',
              marginBottom: '4px',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '25px' }}>{multi ? 'Select your teams' : 'Select your team'}</h3>
            <span style={{ color: 'var(--color-neutral-700)', flex: 1 }}>
              {multi
                ? 'Click as many clubs as you like (up to all 30); the first one you picked is where you start.'
                : 'Click a club to run it.'}{' '}
              Listed A to Z; the # is each team's rank by team rating (the roster weighted by rotation minutes). The season starts 0–0.
            </span>
            {multi && (
              <button className="btn btn-ghost" onClick={() => setSel(teams.map(t => t.tid))} style={{ fontSize: '12px' }}>
                Select all
              </button>
            )}
            <button
              className="btn btn-ghost"
              onClick={() => {
                if (multi) setSel([sel[0]]);
                setMulti(!multi);
              }}
              style={{ fontSize: '12px' }}
            >
              {multi ? 'Back to one team' : 'Multiple teams'}
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '0 32px' }}>
            {['West', 'East'].map(conf => (
              <div key={conf}>
                <h4 style={{ margin: '14px 0 4px', fontSize: '19px' }}>{conf}ern Conference</h4>
                {teams
                  .filter(t => t.conf === conf)
                  .sort((a, b) => (a.region + ' ' + a.name).localeCompare(b.region + ' ' + b.name))
                  .map(t => {
                    const on = sel.includes(t.tid),
                      first = sel[0] === t.tid,
                      fill = (t.colors || [])[0] || '#444444',
                      ink = on ? inkOn(fill) : 'var(--color-text)',
                      sub = on ? 'color-mix(in srgb, ' + ink + ' 78%, transparent)' : null;
                    return (
                      <button
                        key={t.tid}
                        onClick={() => toggle(t.tid)}
                        role={multi ? 'checkbox' : 'radio'}
                        aria-checked={on}
                        className={on ? '' : 'hv3'}
                        style={{
                          all: 'unset',
                          boxSizing: 'border-box',
                          cursor: 'pointer',
                          width: '100%',
                          display: 'grid',
                          gridTemplateColumns: '14px 40px minmax(0,1fr) auto',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '8px 10px',
                          marginTop: '4px',
                          border: '1px solid ' + (on ? fill : 'var(--color-divider)'),
                          borderRadius: 'var(--radius-md)',
                          background: on ? fill : 'transparent',
                          color: ink,
                          ...(on ? { textShadow: 'none' } : {}),
                        }}
                      >
                        <span
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            width: '14px',
                            height: '14px',
                            border: '1px solid ' + ink,
                            borderRadius: multi ? '2px' : '50%',
                            background: on ? ink : 'transparent',
                            color: fill,
                            fontSize: '10px',
                            lineHeight: 1,
                          }}
                        >
                          {on ? '✓' : ''}
                        </span>
                        <TeamLogo team={t} size={40} />
                        <span style={{ minWidth: 0 }}>
                          <span
                            style={{
                              display: 'block',
                              fontFamily: 'var(--font-heading)',
                              fontSize: '18px',
                              fontWeight: 600,
                              lineHeight: 1.15,
                              color: ink,
                            }}
                          >
                            {t.region} {t.name}
                            {first && sel.length > 1 ? ' · first' : ''}
                          </span>
                          <span
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              color: sub ?? 'var(--color-neutral-700)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            Best player: {t.star.name}, {t.star.pos} · {t.star.ovr} ovr · {market(t.mkt)} market · {t.arch}
                          </span>
                        </span>
                        <span style={{ textAlign: 'right' }}>
                          <span style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: ink }}>{t.outlook}</span>
                          <span style={{ display: 'block', fontSize: '11px', color: sub ?? 'var(--color-neutral-600)' }}>
                            #{t.rank} · rating {t.top8.toFixed(1)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </fieldset>
  );
}
