// A player's transaction history: drafted, signed, traded (and what came back), waived,
// retired. Traded draft picks are followed to the player they became, so you can walk a
// trade tree: every player and pick links onward.
import type { ReactNode } from 'react';
import type { VM } from '../vm';
import { Link, muted } from '../kit';
import { pickTrades, pickUsed, tradesOf, type Trade, type Tx } from '../../engine/txlog';

export function TransactionsTab({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P, p = P[s.pid];
  if (!p) return null;
  const tx: Tx[] = p.tx || [], trades = tradesOf(gm);
  const team = (tid?: number) => (tid != null && T[tid] ? <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center', whiteSpace: 'nowrap' }}>{logo(tid, 14)}<Link onClick={() => openTeam(tid)}>{T[tid].abbr}</Link></span> : <span>—</span>);
  const player = (pid: number) => { const q = P[pid]; return q ? <span style={{ whiteSpace: 'nowrap' }}><Link onClick={() => open(pid)} style={{ color: 'var(--color-accent-700)' }}>{q.name}</Link> <span style={{ ...muted, fontSize: '11.5px' }}>{q.pos} · {q.ovr}</span></span> : <span>Unknown player</span>; };
  // A pick: its label, where it went next, and what it became.
  const pick = (id: string, after?: Trade) => {
    const [yr, rd, orig] = id.split('-').map(Number), used = pickUsed(gm, id);
    const later = pickTrades(gm, id).filter(t => !after || t.id > after.id);
    const lab = yr + ' ' + (rd === 1 ? '1st' : '2nd') + '-round pick (' + (T[orig]?.abbr || '?') + ')';
    return (
      <span>
        <b style={{ fontWeight: 600 }}>{lab}</b>
        {later.map(t => { const to = t.aK.includes(id) ? t.b : t.a; return <span key={t.id} style={muted}> → traded to {T[to]?.abbr} ({t.date})</span>; })}
        {used ? <> → became the <b>#{used.n}</b> pick: {player(used.pid)}</> : yr >= gm.Y && !(yr === gm.Y && s.phase === 'draft' && s.pi > 0) ? <span style={muted}> · not used yet</span> : null}
      </span>
    );
  };
  const got = (t: Trade, from: number) => { const ps = t.a === from ? t.bP : t.aP, ks = t.a === from ? t.bK : t.aK; return [...ps.map(id => <span key={'p' + id}>{player(id)}</span>), ...ks.map(k => <span key={'k' + k}>{pick(k, t)}</span>)]; };
  const also = (t: Trade, from: number) => { const ps = (t.a === from ? t.aP : t.bP).filter(id => id !== p.id), ks = t.a === from ? t.aK : t.bK; return [...ps.map(id => <span key={'p' + id}>{player(id)}</span>), ...ks.map(k => <span key={'k' + k}>{pick(k, t)}</span>)]; };
  const list = (xs: ReactNode[]) => xs.length ? <ul style={{ margin: '2px 0 0', paddingLeft: 18 }}>{xs.map((x, i) => <li key={i}>{x}</li>)}</ul> : <span style={muted}> nothing</span>;

  const row = (e: Tx, i: number) => {
    let what: ReactNode = e.text || e.k, who: ReactNode = team(e.tid), detail: ReactNode = null;
    if (e.k === 'draft') {
      const id = e.season + '-' + e.rd + '-' + e.orig, via = e.orig != null && e.orig !== e.tid ? pickTrades(gm, id) : [];
      what = <>Drafted <b>#{e.n}</b> overall{e.rd === 2 ? ' (2nd round)' : ''}</>;
      if (e.orig != null && e.orig !== e.tid) detail = <div style={{ fontSize: '12.5px' }}>With {T[e.orig]?.abbr}’s pick{via.length ? <>, acquired in {via.length === 1 ? 'a trade' : via.length + ' trades'}: {via.map(t => <span key={t.id} style={muted}> {T[t.aK.includes(id) ? t.a : t.b]?.abbr} → {T[t.aK.includes(id) ? t.b : t.a]?.abbr} ({t.date})</span>)}</> : ''}</div>;
    } else if (e.k === 'trade') {
      const t = trades[e.trade!];
      who = <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{team(e.from)} → {team(e.to)}</span>;
      what = <>Traded to the {T[e.to!]?.region} {T[e.to!]?.name}{t?.note ? ' · ' + t.note : ''}</>;
      if (t) detail = <div style={{ fontSize: '12.5px', marginTop: 2 }}><div><b>{T[e.from!]?.abbr} received:</b>{list(got(t, e.from!))}</div>{also(t, e.from!).length > 0 && <div style={{ marginTop: 2 }}><span style={muted}>Also going to {T[e.to!]?.abbr}:</span>{list(also(t, e.from!))}</div>}</div>;
    } else if (e.k === 'expansion') { who = <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>{team(e.from)} → {team(e.to)}</span>; what = 'Taken in the expansion draft'; }
    return (
      <tr key={i} style={{ verticalAlign: 'top' }}>
        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap', color: 'var(--color-neutral-700)' }}>{e.date}</td>
        <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>{who}</td>
        <td style={{ padding: '6px 8px' }}>{what}{detail}</td>
      </tr>
    );
  };
  // Before this league began (or before the log existed): what we know.
  const first = tx[0]?.season ?? gm.Y + 1, pre: ReactNode[] = [];
  if (p.dr && p.draft && !tx.some(e => e.k === 'draft')) pre.push(<>Drafted in {p.draft}: round {p.dr.rd}, pick {p.dr.pick}{p.draftTid != null && T[p.draftTid] ? <> by {team(p.draftTid)}</> : ''}</>);
  else if (!p.dr && p.draft && !tx.some(e => e.k === 'draft') && !p.cls) pre.push(<>Went undrafted in {p.draft}</>);
  const log = !tx.length ? (s.lgLog || []).filter((x: any) => (x.pids || []).includes(p.id) && (x.season ?? gm.Y) < first).slice(0, 20) : [];
  return (
    <div style={{ marginTop: 18 }}>
      {(pre.length > 0 || log.length > 0) && <div style={{ ...muted, fontSize: '12.5px', marginBottom: 8 }}>{pre.map((x, i) => <div key={i}>{x}</div>)}{log.map((x: any, i: number) => <div key={'l' + i}>{x.text}</div>)}</div>}
      {tx.length ? (
        <table className="table" style={{ fontSize: '13px' }}>
          <thead><tr><th style={{ padding: '6px 8px' }}>Date</th><th style={{ padding: '6px 8px' }}>Team</th><th style={{ padding: '6px 8px' }}>Move</th></tr></thead>
          <tbody>{tx.map(row)}</tbody>
        </table>
      ) : <p style={{ ...muted, fontStyle: 'italic' }}>No transactions yet{pre.length ? ' in this league' : ''}.</p>}
    </div>
  );
}
