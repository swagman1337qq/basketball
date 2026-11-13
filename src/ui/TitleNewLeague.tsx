import { useLayoutEffect, useMemo, useState } from 'react';
import { Game } from '../engine/Game';
import { TeamLogo } from './TeamLogo';
import { inkOn } from './kit';
import { defaultTeamSpecs, TEAM_COUNT, teamListError, teamStyle, type TeamSpec } from '../data/world';
import { FranchiseChooser } from './FranchiseChooser';

export type LeagueStart = '' | 'worst' | 'hopeless' | 'spectate';
const market = (m: number) => (m >= 1.15 ? 'Large' : m >= 0.95 ? 'Mid-large' : m >= 0.85 ? 'Mid-size' : 'Small');

export function TitleNewLeague({
  onCreate,
  onTeamChange,
  busy,
}: {
  onCreate: (name: string, seed: number, tids: number[], start: LeagueStart, teams?: TeamSpec[]) => void;
  onTeamChange: (team: any) => void;
  busy: boolean;
}) {
  const [name, setName] = useState('My league');
  const [seed, setSeed] = useState(() => String(1 + Math.floor(Math.random() * 999999)));
  const [sel, setSel] = useState<number[]>([0]);
  const [multi, setMulti] = useState(false);
  const [start, setStart] = useState<LeagueStart>('');
  // The league's teams: null = the default 30; otherwise the list from Edit teams (any even number, TEAM_COUNT)
  const [specs, setSpecs] = useState<TeamSpec[] | null>(null),
    [editing, setEditing] = useState(false);
  const list = specs || defaultTeamSpecs(),
    listErr = teamListError(list);
  const setList = (l: TeamSpec[]) => {
    setSpecs(l);
    setSel([0]);
    setMulti(false);
  };
  const seedNum = Number.isFinite(Number(seed)) && seed !== '' ? Math.floor(Number(seed)) : 2027;
  // Preview only a valid list (a 21-team league can't be built); while it's invalid the last good preview stays
  const [good, setGood] = useState<TeamSpec[] | null>(null);
  if (!listErr && good !== specs) setGood(specs);
  const teams = useMemo(() => Game.preview(seedNum, good || undefined), [seedNum, good]);
  const confN = (c: string) => teams.filter(t => t.conf === c).length,
    confErr =
      !listErr && good === specs && (confN('East') < 10 || confN('West') < 10)
        ? 'Each conference needs at least 10 teams for the play-in (now East ' +
          confN('East') +
          ', West ' +
          confN('West') +
          '). Conferences follow geography: add teams on the short side or remove some from the long one.'
        : '';
  const blocked = !!(listErr || confErr);
  const picked = teams.find(t => t.tid === sel[0]) || teams[0];
  const toggle = (t: number) => setSel(x => (!multi ? [t] : x.includes(t) ? (x.length > 1 ? x.filter(y => y !== t) : x) : [...x, t]));
  useLayoutEffect(() => onTeamChange(picked), [picked, onTeamChange]);
  const create = () => {
    if (!busy && !blocked) onCreate(name.trim() || 'My league', seedNum, sel, start, specs || undefined);
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
            </span>
          </label>
          {blocked && <div style={{ fontSize: '12.5px', color: 'var(--gm-bad)' }}>{listErr || confErr}</div>}
          <button className="btn btn-primary" onClick={create} disabled={blocked} style={{ width: '100%' }}>
            {start === 'spectate'
              ? 'Start spectating'
              : sel.length > 1
                ? 'Start running ' + sel.length + ' franchises'
                : 'Start as GM of the ' + picked.region + ' ' + picked.name}
          </button>
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
            <h3 style={{ margin: 0, fontSize: '25px', flex: 1 }}>
              {editing ? 'Teams in your league · ' + list.length : multi ? 'Select your teams' : 'Select your team'}
            </h3>
            <button
              className={editing ? 'btn btn-primary' : 'btn btn-ghost'}
              onClick={() => setEditing(!editing)}
              style={{ fontSize: '12px' }}
              title="Add or remove teams for this league"
            >
              {editing ? 'Done' : 'Edit teams · ' + list.length}
            </button>
            {multi && !editing && (
              <button className="btn btn-ghost" onClick={() => setSel(teams.map(t => t.tid))} style={{ fontSize: '12px' }}>
                Select all
              </button>
            )}
            {!editing && (
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
            )}
          </div>
          {editing && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap', fontSize: '12.5px' }}>
                <span style={{ color: listErr || confErr ? 'var(--gm-bad)' : 'var(--color-neutral-700)' }}>
                  {listErr ||
                    confErr ||
                    'Any even number from ' + TEAM_COUNT.min + ' to ' + TEAM_COUNT.max + ' teams. Conferences follow geography.'}
                </span>
                {specs && (
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '12px', marginLeft: 'auto' }}
                    onClick={() => setList(defaultTeamSpecs())}
                  >
                    Back to the default 30
                  </button>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 6 }}>
                {list.map(t => (
                  <div
                    key={t.abbr}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'center',
                      padding: '4px 8px',
                      border: '1px solid var(--color-divider)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12.5px',
                    }}
                  >
                    <TeamLogo team={{ ...(t.colors ? {} : teamStyle(t.abbr)), ...t } as any} size={28} />
                    <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.region} {t.name}
                    </span>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '13px', padding: '0 6px', color: 'var(--gm-bad)' }}
                      title={'Remove the ' + t.region + ' ' + t.name}
                      aria-label={'Remove the ' + t.region + ' ' + t.name}
                      onClick={() => setList(list.filter(x => x.abbr !== t.abbr))}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ fontWeight: 600, marginTop: 6 }}>Add teams</div>
              <FranchiseChooser
                taken={new Set<string>(list.map(t => t.abbr))}
                inLeague={new Set<string>(list.map(t => t.region + '|' + t.name))}
                picked={new Set<string>(list.map(t => t.abbr))}
                pickedLabel="In league"
                onPick={x => list.length < TEAM_COUNT.max && setList([...list, x])}
              />
            </div>
          )}
          <div style={{ display: editing ? 'none' : 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '0 32px' }}>
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
