// Expansion setup (Settings): choose new franchises from the database (ready-made teams
// for cities of 1 million+, plus a few smaller ones, flagged) or design your own (city,
// nickname, abbreviation, conference, division, market, colors, crest, logo style). Any
// even number join at the next preseason.
import type { VM } from '../vm';
import { TeamLogo } from '../TeamLogo';
import { muted } from '../kit';
import { FranchiseChooser } from '../FranchiseChooser';

export function ExpansionPicker({ vm }: { vm: VM }) {
  const { gm, s, T } = vm.ctx;
  const pend: any[] = s.expTeams || [],
    taken = new Set<string>([...T.map(t => t.abbr), ...pend.map(t => t.abbr)]),
    inLeague = new Set<string>(T.map(t => t.region + '|' + t.name));
  const setPend = (list: any[]) => gm.setState({ expTeams: list });
  const eastN = pend.filter(t => t.conf === 'East').length,
    westN = pend.length - eastN;
  const errs = [
    pend.length === 1 || pend.length % 2 ? 'Pick an even number of teams (the schedule needs an even league).' : '',
    pend.length && eastN !== westN
      ? 'Tip: an equal number per conference keeps the playoff races fair (' + eastN + ' East, ' + westN + ' West).'
      : '',
  ].filter(Boolean);
  if (!s.expansion) return null; // after every hook: turning expansion on and off must not change the hooks React sees
  return (
    <div style={{ padding: '10px 0 16px', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>Joining next preseason ({pend.length || 'none picked: two default teams'})</div>
      {pend.length > 0 ? (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 8 }}>
          {pend.map(t => (
            <div
              key={t.abbr}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                padding: '4px 8px',
                border: '1px solid var(--color-divider)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <TeamLogo team={t} size={34} />
              <div style={{ fontSize: '12.5px' }}>
                <b>
                  {t.region} {t.name}
                </b>
                <div style={muted}>
                  {t.abbr} · {t.conf} · {t.div} · market ×{t.mkt}
                </div>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '13px', padding: '0 6px', color: 'var(--gm-bad)' }}
                title="Remove"
                onClick={() => setPend(pend.filter(x => x.abbr !== t.abbr))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>
          If you don’t pick any, the two largest markets left in the database join (one per conference).
        </p>
      )}
      {errs.map(e => (
        <div key={e} style={{ fontSize: '12px', color: e.startsWith('Tip') ? 'var(--color-accent-800)' : 'var(--gm-bad)' }}>
          {e}
        </div>
      ))}
      <p style={{ ...muted, fontSize: '12px', margin: '6px 0 0' }}>
        Conferences follow geography: teams west of Lebanon, Kansas play in the West, teams east of it in the East. If that leaves one
        conference bigger, the teams nearest the line switch over until they’re even, so a new team can move a neighbor across. The
        conference shown is the side of the line a city is on; a city the game doesn’t know keeps the one you pick.
      </p>
      <FranchiseChooser
        taken={taken}
        inLeague={inLeague}
        picked={new Set<string>(pend.map(p => p.abbr))}
        onPick={t => setPend([...pend, t])}
      />
    </div>
  );
}
