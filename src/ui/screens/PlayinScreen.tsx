// Play-in: the real games once the regular season is over, otherwise the play-in as it
// would look if the season ended today, with the race for seeds 5–12 in each conference.
import type { VM } from '../vm';
import { h4Style, Link, muted, td, th } from '../kit';
import { PlayinBracket, TeamLine } from './PlayoffsScreen';

export function PlayinScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam, isMine } = vm.ctx;
  const gp = gm.gamesPlayed(s);
  if (s.playin) return (
    <>
      <PlayinBracket vm={vm} />
      <p style={{ ...muted, fontSize: '12px' }}>The two teams that lose here (and the two that lose 9 v 10) miss the playoffs. Under the 2027 lottery the 9 and 10 seeds get 2 lottery balls and the 7 v 8 losers get 1, even if they then win the last playoff spot. <Link onClick={() => gm.setState({ screen: 'lottery' })}>See the lottery odds →</Link></p>
    </>
  );
  const rec = (t: number) => T[t].w + '–' + T[t].l;
  const card = (label: string, a: number | null, sa: number | null, b: number | null, sb: number | null, pa?: string, pb?: string) => {
    const mineGame = (a != null && isMine(a)) || (b != null && isMine(b));
    return (
      <div style={{ border: '1px solid ' + (mineGame ? 'var(--color-accent)' : 'var(--color-divider)'), borderRadius: 'var(--radius-md)', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ fontSize: '9.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{label}</div>
        <TeamLine vm={vm} tid={a} seed={sa} wins={a != null ? <span style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }}>{rec(a)}</span> : ''} placeholder={pa} />
        <TeamLine vm={vm} tid={b} seed={sb} wins={b != null ? <span style={{ fontSize: '12px', fontFamily: 'var(--font-body)' }}>{rec(b)}</span> : ''} placeholder={pb} />
      </div>
    );
  };
  return (
    <>
      <div style={{ padding: '10px 14px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', marginBottom: '18px', fontSize: '13px' }}>
        <b>If the season ended today.</b> {gp < 82 ? gp + ' of 82 games played, so this will change.' : 'The regular season is over: start the play-in from the bar above.'} Seeds 7 and 8 get two chances to make the playoffs; seeds 9 and 10 must win twice.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: '28px' }}>
        {['East', 'West'].map(c => {
          const sd = gm.seeds(s, c), six = T[sd[5]], ten = T[sd[9]];
          const gb = (t: any, ref: any) => { const g = ((ref.w - t.w) + (t.l - ref.l)) / 2; return g === 0 ? '—' : (g > 0 ? g : '+' + -g).toString(); };
          return (
            <section key={c}>
              <h4 style={h4Style}>{c}ern Conference</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '10px', marginBottom: '12px' }}>
                {card('7 vs 8 · winner is the 7 seed', sd[6], 7, sd[7], 8)}
                {card('9 vs 10 · loser is out', sd[8], 9, sd[9], 10)}
                {card('For the 8 seed', null, null, null, null, 'Loser of 7 v 8', 'Winner of 9 v 10')}
              </div>
              <table className="table" style={{ fontSize: '12.5px' }}>
                <thead><tr><th style={th('right')}>Seed</th><th style={th()}>Team</th><th style={th('right')}>W–L</th><th style={th('right')} title="Games behind the 6th seed (a direct playoff spot)">GB 6th</th><th style={th('right')} title="Games behind the 10th seed (the last play-in spot)">GB 10th</th><th style={th('right')}>Left</th></tr></thead>
                <tbody>
                  {sd.slice(4, 13).map((t: number, i: number) => {
                    const seed = i + 5, tm = T[t], line = seed === 6 ? '2px solid var(--color-text)' : seed === 10 ? '2px dashed var(--color-text)' : undefined;
                    return (
                      <tr key={t} style={{ borderBottom: line, color: isMine(t) ? 'var(--color-accent-700)' : seed > 10 ? 'var(--color-neutral-600)' : undefined, fontWeight: isMine(t) ? 600 : 400 }}>
                        <td style={td('right')}>{seed}</td>
                        <td style={td()}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>{logo(t, 16)}<Link onClick={() => openTeam(t)}>{tm.region} {tm.name}</Link>{seed >= 7 && seed <= 10 ? <span style={{ fontSize: '10.5px', color: 'var(--color-accent-700)' }}>play-in</span> : null}</span></td>
                        <td style={td('right')}>{rec(t)}</td>
                        <td style={td('right')}>{seed <= 6 ? '' : gb(tm, six)}</td>
                        <td style={td('right')}>{seed <= 10 ? '' : gb(tm, ten)}</td>
                        <td style={td('right')}>{82 - tm.w - tm.l}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
      <p style={{ ...muted, fontSize: '12px', marginTop: '12px' }}>Solid line: seeds 1–6 go straight to the playoffs. Dashed line: the play-in cutoff. Ties are broken by wins. <Link onClick={() => gm.setState({ screen: 'lottery' })}>Lottery odds if the season ended today →</Link></p>
    </>
  );
}
