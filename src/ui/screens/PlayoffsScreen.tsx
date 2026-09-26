// Postseason: play-in games, then an NBA-style bracket with the East on the left, the
// West on the right and the Finals in the middle. Past seasons and the lottery below.
import type { ReactNode } from 'react';
import type { VM } from '../vm';
import { h4Style, Kicker, Link, muted, td, th } from '../kit';

const RN = ['First round', 'Conference semifinals', 'Conference finals', 'Finals'];

export function TeamLine({ vm, tid, seed, wins, won, lost, placeholder }: { vm: VM; tid: number | null; seed?: number | null; wins?: ReactNode; won?: boolean; lost?: boolean; placeholder?: string }) {
  const { T, logo, openTeam, isMine } = vm.ctx;
  const t = tid != null ? T[tid] : null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, fontWeight: won ? 600 : 400, color: t && isMine(tid) ? 'var(--color-accent-700)' : lost ? 'var(--color-neutral-600)' : 'var(--color-text)' }}>
      <span style={{ width: '16px', textAlign: 'right', fontSize: '11px', color: 'var(--color-neutral-600)' }}>{seed ?? ''}</span>
      {t ? logo(tid, 16) : <span style={{ width: 16, height: 16, borderRadius: '50%', border: '1px dashed var(--color-neutral-500)', flex: 'none' }} />}
      <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {t ? <Link onClick={() => openTeam(tid)}>{t.region}</Link> : <span style={{ fontStyle: 'italic', color: 'var(--color-neutral-600)' }}>{placeholder}</span>}
      </span>
      <span style={{ fontFamily: 'var(--font-heading)', fontSize: '16px' }}>{wins}</span>
    </div>
  );
}

function SeriesCard({ vm, x, title }: { vm: VM; x: any; title?: string }) {
  const done = x.wa === 4 || x.wb === 4;
  const tip = (x.g || []).map((g, i) => 'G' + (i + 1) + ': ' + vm.ctx.T[g.h].abbr + ' home, ' + g.hp + '–' + g.ap).join('\n');
  return (
    <div title={tip} style={{ border: '1px solid ' + (vm.ctx.isMine(x.a) || vm.ctx.isMine(x.b) ? 'var(--color-accent)' : 'var(--color-divider)'), borderRadius: 'var(--radius-md)', padding: '5px 8px', display: 'flex', flexDirection: 'column', gap: '2px', background: 'var(--color-bg)' }}>
      {title && <div style={{ fontSize: '9.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{title}</div>}
      <TeamLine vm={vm} tid={x.a} seed={x.sa} wins={x.wa ?? ''} won={done && x.wa === 4} lost={done && x.wa < 4} placeholder={x.pa} />
      <TeamLine vm={vm} tid={x.b} seed={x.sb} wins={x.wb ?? ''} won={done && x.wb === 4} lost={done && x.wb < 4} placeholder={x.pb} />
    </div>
  );
}

function Column({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <div style={{ fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--color-neutral-700)', borderBottom: '1px solid var(--color-text)', paddingBottom: '3px', marginBottom: '8px', textAlign: 'center' }}>{label}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '10px', minHeight: '330px' }}>{children}</div>
    </div>
  );
}

// The real play-in games of this season, by conference.
export function PlayinBracket({ vm }: { vm: VM }) {
  const { gm, s, isMine } = vm.ctx;
  return (
      <section style={{ marginBottom: '26px' }}>
        <h4 style={h4Style}>Play-in tournament</h4>
        <p style={{ ...muted, margin: '0 0 10px', fontSize: '12px' }}>Seed 7 hosts 8: the winner is the 7 seed. Seed 9 hosts 10: the loser is out. The loser of 7 v 8 then hosts the winner of 9 v 10 for the 8 seed.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '28px' }}>
          {['East', 'West'].map(c => (
            <div key={c}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', marginBottom: '6px' }}>{c}ern Conference</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '10px' }}>
                {s.playin[c].map(x => {
                  const next = !x.done && gm.playinPending(s.playin).some(p => p.x === x || (p.x.id === x.id && p.c === c));
                  const mineGame = x.a != null && (isMine(x.a) || isMine(x.b));
                  return (
                    <div key={x.id} style={{ border: '1px solid ' + (mineGame ? 'var(--color-accent)' : 'var(--color-divider)'), borderRadius: 'var(--radius-md)', padding: '6px 8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ fontSize: '9.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-600)' }}>{x.label}{x.done ? ' · Final' : next ? ' · Next' : ''}</div>
                      <TeamLine vm={vm} tid={x.a} seed={x.sa} wins={x.done ? x.hp : ''} won={x.done && x.w === x.a} lost={x.done && x.w !== x.a} placeholder="Loser of 7 v 8" />
                      <TeamLine vm={vm} tid={x.b} seed={x.sb} wins={x.done ? x.ap : ''} won={x.done && x.w === x.b} lost={x.done && x.w !== x.b} placeholder="Winner of 9 v 10" />
                      {next && mineGame && <button className="btn btn-primary" onClick={() => gm.setState({ screen: 'game' })} style={{ fontSize: '12px', padding: '3px 10px', marginTop: '2px' }}>Watch</button>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
  );
}

export function PlayoffsScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam, isMine } = vm.ctx;
  const P = gm.db.P;
  // Bracket rounds: the real ones, or a projection from today's seeds.
  let rounds: any[][] = s.po ? s.po.rounds : null;
  let projected = false;
  if (!rounds) {
    projected = true;
    const r1 = [];
    ['East', 'West'].forEach(c => {
      const sd = s.seeds?.[c] || gm.seeds(s, c), pin = s.playin?.[c];
      const seven = pin?.[0]?.done ? pin[0].w : null, eight = pin?.[2]?.done ? pin[2].w : null;
      [[0, 7], [3, 4], [2, 5], [1, 6]].forEach(([i, j]) => r1.push({ conf: c, a: sd[i], sa: i + 1, b: j === 6 ? seven : j === 7 ? eight : sd[j], sb: j + 1, pb: 'Play-in winner' }));
    });
    rounds = [r1];
  }
  const conf = (ri: number, c: string) => (rounds[ri] || []).filter(x => x.conf === c);
  const empty = (n: number) => Array.from({ length: n }, (_, i) => <SeriesCard key={'e' + i} vm={vm} x={{ a: null, b: null, pa: 'TBD', pb: 'TBD' }} />);
  const col = (ri: number, c: string, n: number) => { const xs = conf(ri, c); return xs.length ? xs.map((x, i) => <SeriesCard key={i} vm={vm} x={x} />) : empty(n); };
  const finals = rounds[3]?.[0];
  const champ = s.po?.champ;
  const aw = (s.awards || {})[gm.Y];

  return (
    <>
      {champ != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '14px 16px', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)', marginBottom: '18px' }}>
          {logo(champ, 56)}
          <div style={{ flex: 1 }}>
            <Kicker accent>{gm.seasonLbl()} champions</Kicker>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '32px', lineHeight: 1.1 }}>{T[champ].region} {T[champ].name}</div>
            <div style={muted}>Beat the {T[s.po.runner].region} {T[s.po.runner].name} in the Finals{aw?.fmvp ? <> · Finals MVP <Link onClick={() => open(aw.fmvp.pid)}>{P[aw.fmvp.pid].name}</Link> ({aw.fmvp.line})</> : null}</div>
          </div>
        </div>
      )}

      {s.playin && <PlayinBracket vm={vm} />}

      <section style={{ marginBottom: '26px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h4 style={h4Style}>{projected ? 'Playoff bracket, if the season ended today' : 'Playoff bracket'}</h4>
          <span style={{ ...muted, fontSize: '12px' }}>East on the left, West on the right; conference champions meet in the Finals. Hover a series for game scores.</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gap: '10px', marginTop: '8px' }}>
          <Column label="East · R1">{col(0, 'East', 4)}</Column>
          <Column label="East · Semis">{col(1, 'East', 2)}</Column>
          <Column label="East · Finals">{col(2, 'East', 1)}</Column>
          <Column label="Finals">{finals ? <SeriesCard vm={vm} x={finals} /> : empty(1)}</Column>
          <Column label="West · Finals">{col(2, 'West', 1)}</Column>
          <Column label="West · Semis">{col(1, 'West', 2)}</Column>
          <Column label="West · R1">{col(0, 'West', 4)}</Column>
        </div>
        {projected && s.phase === 'regular' && <p style={{ ...muted, fontSize: '12px', margin: '10px 0 0' }}>Seeds 1–6 qualify directly; seeds 7–10 go to the play-in for the last two spots in each conference.</p>}
      </section>

      {s.lotto && (
        <section style={{ marginBottom: '26px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}><h4 style={h4Style}>Draft lottery</h4><Link onClick={() => gm.setState({ screen: 'lottery' })}>Odds and full results →</Link></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '0 28px' }}>
            {s.lotto.filter(x => x.t != null).map(x => (
              <div key={x.n} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--color-divider)', color: isMine(x.t) ? 'var(--color-accent-700)' : 'var(--color-text)' }}>
                <span style={{ width: '22px', textAlign: 'right', color: 'var(--color-neutral-600)' }}>{x.n}</span>
                {logo(x.t, 16)}
                <span style={{ flex: 1 }}><Link onClick={() => openTeam(x.t)}>{T[x.t].region} {T[x.t].name}</Link></span>
                {x.exp != null ? <span style={{ fontSize: '12px', color: x.n < x.exp - 0.5 ? 'var(--gm-good)' : x.n > x.exp + 0.5 ? 'var(--gm-bad)' : 'var(--color-neutral-700)' }}>{x.balls} ball{x.balls === 1 ? '' : 's'} · expected {x.exp}</span> : <span style={{ fontSize: '12px', color: x.from > x.n ? 'var(--gm-good)' : x.from < x.n ? 'var(--gm-bad)' : 'var(--color-neutral-700)' }}>{x.from > x.n ? '▲ from ' + x.from : x.from < x.n ? '▼ from ' + x.from : '—'}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {s.history.length > 0 && (
        <section>
          <h4 style={h4Style}>Past seasons</h4>
          <table className="table" style={{ fontSize: '13px' }}>
            <thead><tr><th style={th()}>Season</th><th style={th()}>Champion</th><th style={th()}>Runner-up</th><th style={th()}>Finals MVP</th><th style={th('right')}>{T[s.me].region}</th><th style={th()}>Finish</th></tr></thead>
            <tbody>
              {s.history.map((x, i) => {
                const mineRow = x.teams?.[s.me] || (x.teams ? null : { rec: x.rec, fin: x.fin });
                return (
                  <tr key={i}>
                    <td style={td()}>{x.season}</td>
                    <td style={td()}><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>{logo(x.champ, 16)}<Link onClick={() => openTeam(x.champ)}>{T[x.champ].region} {T[x.champ].name}</Link></span></td>
                    <td style={td()}>{T[x.runner]?.abbr}</td>
                    <td style={td()}>{x.fmvp != null && P[x.fmvp] ? <Link onClick={() => open(x.fmvp)}>{P[x.fmvp].name}</Link> : '—'}</td>
                    <td style={td('right')}>{mineRow ? mineRow.rec : '—'}</td>
                    <td style={td()}>{mineRow ? mineRow.fin : 'Not your team yet'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}
      <p style={{ ...muted, fontSize: '12px', marginTop: '12px' }}>{RN.join(' → ')}. Best of seven, 2-2-1-1-1 home court to the higher seed; the Finals go to the better record.</p>
    </>
  );
}
