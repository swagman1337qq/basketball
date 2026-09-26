// Draft lottery: every lottery team's odds at every pick under the 2027 "3-2-1" rules,
// if the season ended today (or from the real field once the play-in is done), and the
// results once it's drawn.
import type { VM } from '../vm';
import { h4Style, Link, muted, td, th } from '../kit';
import { BALLS, FLOOR, TIER_LABEL, expectedPick, lotteryField, lotteryOdds, type LotTeam, type Tier } from '../../engine/lottery';

const TIER_SHORT: Record<Tier, string> = { bottom: 'Bottom 3', out: 'Missed play-in', playin: 'Play-in 9/10', loser78: '7 v 8 loser' };
const TIER_COLOR: Record<Tier, string> = { bottom: 'var(--gm-bad)', out: 'var(--color-accent-700)', playin: 'var(--color-text)', loser78: 'var(--color-neutral-600)' };
const pc = (x: number) => (x >= 0.9995 ? '100' : x < 0.0005 ? '' : (x * 100).toFixed(1));

function Balls({ n, color }: { n: number; color: string }) {
  return <span style={{ display: 'inline-flex', gap: 2 }}>{Array.from({ length: n }, (_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: color, display: 'inline-block' }} />)}</span>;
}

export function LotteryScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam, isMine } = vm.ctx;
  const gp = gm.gamesPlayed(s);
  const rules = (
    <section style={{ marginBottom: '22px' }}>
      <h4 style={h4Style}>How the 2027 lottery works</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '10px', marginTop: '6px' }}>
        {[
          ['16 teams, 37 balls', 'Everyone except the top 6 seeds and the two 7 v 8 play-in winners.'],
          ['3 · 2 · 1', <>Missed the play-in: <Balls n={3} color={TIER_COLOR.out} /> Bottom three and play-in 9/10 seeds: <Balls n={2} color={TIER_COLOR.bottom} /> 7 v 8 losers: <Balls n={1} color={TIER_COLOR.loser78} /></>],
          ['Every pick is drawn', 'Picks 1 to 16 all come out of the drum. Once a team is drawn, its balls come out.'],
          ['Losing on purpose doesn’t pay', 'The three worst teams get fewer balls than the next seven, but can’t fall below pick ' + FLOOR + '.'],
          ['No repeat winners', 'A team’s own pick can’t be No. 1 two drafts in a row, or top-5 three drafts in a row.'],
        ].map(([h, b], i) => (
          <div key={i} style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '8px 10px', fontSize: '12.5px' }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>{h}</div><div style={muted}>{b}</div>
          </div>
        ))}
      </div>
    </section>
  );
  if (gp === 0 && !s.lotto) return (<>
    <div style={{ padding: '10px 14px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>No games have been played yet. Odds appear here once the season starts.</div>
    {rules}
  </>);

  const f = lotteryField(gm, s), odds = lotteryOdds(f.teams), n = f.teams.length;
  const set = !f.projected, drawn = s.lotto && s.lotto.length && s.lotto[0].tier;
  const nameOf = (x: LotTeam) => x.tid != null ? T[x.tid].region + ' ' + T[x.tid].name : 'Loser of ' + x.conf + ' 7 v 8';
  const owner = (t: number) => gm.owner2027(t, s.assets, 1);
  const teamCell = (x: LotTeam) => {
    if (x.tid == null) return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
        <span style={{ fontStyle: 'italic' }}>Loser of {x.conf} 7 v 8:</span>{x.cand!.map((t, i) => <span key={t} style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{i ? 'or ' : ''}{logo(t, 14)}<Link onClick={() => openTeam(t)}>{T[t].abbr}</Link></span>)}
      </span>
    );
    const ow = owner(x.tid);
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
        {logo(x.tid, 16)}<Link onClick={() => openTeam(x.tid!)}>{nameOf(x)}</Link>
        {ow !== x.tid && <span style={{ fontSize: '11px', color: isMine(ow) ? 'var(--color-accent-700)' : 'var(--color-neutral-600)' }}>pick owned by {T[ow].abbr}</span>}
        {x.why.length > 0 && <span title={x.why.join('\n')} style={{ fontSize: '11px', color: 'var(--gm-bad)', cursor: 'help' }}>⚠ {x.noOne && !x.noTop5 ? 'no No. 1' : 'no top 5'}</span>}
      </span>
    );
  };
  const mineRow = (x: LotTeam) => x.tid != null && (isMine(x.tid) || isMine(owner(x.tid)));
  const rows = f.teams.map((x, i) => { const o = odds[i], nz = o.map((p, k) => (p > 1e-9 ? k + 1 : 0)).filter(Boolean); return { x, i, o, exp: expectedPick(o), best: nz[0], worst: nz[nz.length - 1], top4: o.slice(0, 4).reduce((a, b) => a + b, 0) }; });
  const myRows = rows.filter(r => mineRow(r.x));

  return (
    <>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: '10px 14px', border: '1px solid ' + (s.phase === 'lottery' ? 'var(--color-accent)' : 'var(--color-divider)'), borderRadius: 'var(--radius-md)', marginBottom: '18px', fontSize: '13px' }}>
        <div style={{ flex: 1, minWidth: 220 }}>
          {drawn ? <><b>The {gm.Y} lottery has been drawn.</b> Results first, then the odds each team had going in.</>
            : set ? <><b>The field is set.</b> These are the real odds for the {gm.Y} lottery.</>
            : <><b>If the season ended today.</b> {gp < 82 ? gp + ' of 82 games played; odds move as the standings do.' : 'The play-in decides the last spots.'} The 7 v 8 play-in losers aren’t known yet, so both candidates are shown.</>}
        </div>
        {s.phase === 'lottery' && <button className="btn btn-primary" onClick={() => gm.runLottery()}>Run the lottery</button>}
      </div>

      {myRows.length > 0 && !drawn && (
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          {myRows.map(r => (
            <div key={r.i} style={{ border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', padding: '8px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
              {logo(r.x.tid!, 30)}
              <div><div style={{ fontSize: '11px', ...muted }}>{isMine(r.x.tid!) ? 'Your pick' : 'Your pick via ' + T[r.x.tid!].abbr}</div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px' }}>{pc(r.o[0]) || '0.0'}% for No. 1 · {(r.top4 * 100).toFixed(1)}% top 4</div><div style={{ fontSize: '12px', ...muted }}>Most likely pick {1 + r.o.indexOf(Math.max(...r.o))} · average {r.exp.toFixed(1)} · somewhere from {r.best} to {r.worst}</div></div>
            </div>
          ))}
        </div>
      )}

      {drawn && (
        <section style={{ marginBottom: 24 }}>
          <h4 style={h4Style}>Results</h4>
          <table className="table" style={{ fontSize: '13px' }}>
            <thead><tr style={{ whiteSpace: 'nowrap' }}><th style={th('right')}>Pick</th><th style={th()}>Team</th><th style={th()}>Group</th><th style={th('right')}>Balls</th><th style={th('right')}>Had for No. 1</th><th style={th('right')}>Expected</th><th style={th()}>Luck</th></tr></thead>
            <tbody>{s.lotto.map((x: any) => { const d = x.exp - x.n, ow = owner(x.t); return (
              <tr key={x.n} style={{ color: isMine(x.t) || isMine(ow) ? 'var(--color-accent-700)' : undefined, fontWeight: isMine(ow) ? 600 : 400 }}>
                <td style={td('right')}>{x.n}</td>
                <td style={td()}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>{logo(x.t, 16)}<Link onClick={() => openTeam(x.t)}>{T[x.t].region} {T[x.t].name}</Link>{ow !== x.t && <span style={{ fontSize: '11px', ...muted }}>to {T[ow].abbr}</span>}</span></td>
                <td style={td()}><span style={{ color: TIER_COLOR[x.tier as Tier] }}>{TIER_SHORT[x.tier as Tier]}</span></td>
                <td style={td('right')}><Balls n={x.balls} color={TIER_COLOR[x.tier as Tier]} /></td>
                <td style={td('right')}>{(x.odds1 * 100).toFixed(1)}%</td>
                <td style={td('right')}>{x.exp}</td>
                <td style={td()}><span style={{ color: d > 0.5 ? 'var(--gm-good)' : d < -0.5 ? 'var(--gm-bad)' : 'var(--color-neutral-700)' }}>{d > 0.5 ? '▲ ' + d.toFixed(1) + ' spots better' : d < -0.5 ? '▼ ' + (-d).toFixed(1) + ' spots worse' : 'as expected'}</span></td>
              </tr>); })}</tbody>
          </table>
        </section>
      )}

      <section style={{ marginBottom: 24 }}>
        <h4 style={h4Style}>{drawn ? 'The odds going in' : 'Lottery odds'}</h4>
        <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>Chance (%) of landing each pick, worked out exactly from the balls, the pick-{FLOOR} floor and the repeat-winner rules. Darker = more likely. Hover ⚠ for restrictions.</p>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ fontSize: '12px', minWidth: 900 }}>
            <thead><tr style={{ whiteSpace: 'nowrap' }}>
              <th style={th()}>Team</th><th style={th('right')}>W–L</th><th style={th()}>Group</th><th style={th()}>Balls</th>
              <th style={th('right')}>No. 1</th><th style={th('right')}>Top 4</th><th style={th('right')} title="Average pick">Avg</th><th style={th('right')} title="Best and worst possible pick">Range</th>
              {Array.from({ length: n }, (_, k) => <th key={k} style={{ ...th('right'), padding: '6px 3px', minWidth: 30 }}>{k + 1}</th>)}
            </tr></thead>
            <tbody>
              {rows.map(({ x, i, o, exp, best, worst, top4 }) => (
                <tr key={i} style={{ color: mineRow(x) ? 'var(--color-accent-700)' : undefined, fontWeight: mineRow(x) ? 600 : 400, borderTop: i > 0 && rows[i - 1].x.tier !== x.tier ? '2px solid var(--color-divider)' : undefined }}>
                  <td style={td()}>{teamCell(x)}</td>
                  <td style={td('right', { whiteSpace: 'nowrap' })}>{x.tid != null ? T[x.tid].w + '–' + T[x.tid].l : ''}</td>
                  <td style={td()} title={TIER_LABEL[x.tier]}><span style={{ color: TIER_COLOR[x.tier], whiteSpace: 'nowrap' }}>{TIER_SHORT[x.tier]}</span></td>
                  <td style={td()}><Balls n={x.balls} color={TIER_COLOR[x.tier]} /></td>
                  <td style={td('right')}>{(o[0] * 100).toFixed(1)}%</td>
                  <td style={td('right')}>{(top4 * 100).toFixed(1)}%</td>
                  <td style={td('right')}>{exp.toFixed(1)}</td>
                  <td style={td('right', { whiteSpace: 'nowrap' })}>{best}–{worst}</td>
                  {o.map((p, k) => <td key={k} style={{ ...td('right'), padding: '5px 3px', fontSize: '11px', background: p > 0.0005 ? 'color-mix(in srgb, var(--color-accent) ' + Math.round(Math.min(1, p / 0.35) * 70) + '%, transparent)' : undefined }}>{pc(p)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ ...muted, fontSize: '12px', marginTop: 8 }}>Balls: {Object.entries(BALLS).map(([k, v]) => TIER_SHORT[k as Tier] + ' ' + v).join(' · ')}. After the lottery, the rest of the first round goes worst record first. The NBA approved this system for the 2027–2029 drafts; this league keeps it after that.</p>
      </section>
      {rules}
    </>
  );
}
