// Press room: quotes from the (fictional) owners and GMs around the league after
// trades, signings, the draft, firings and hirings. Every name links through.
import { useState } from 'react';
import type { VM } from '../vm';
import { Kicker, Link, linkNames, muted, Seg } from '../kit';

const KIND: Record<string, string> = { trade: 'Trade', sign: 'Signing', draft: 'Draft', fired: 'Firing', hired: 'Hiring', review: 'Owner review', offer: 'Job offer', interview: 'Interview', firesale: 'Fire sale', award: 'Awards', title: 'Champions', hof: 'Hall of Fame' };

export function PressScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx;
  const [f, setF] = useState<'all' | 'mine'>('all');
  const P = gm.db.P;
  const list = (s.news || []).filter(n => f === 'all' || gm.isUser(s, n.tid)).slice(0, 80);
  return (
    <>
      <div style={{ marginBottom: '16px' }}><Seg<'all' | 'mine'> value={f} options={[['all', 'Whole league'], ['mine', 'My teams']]} onChange={setF} /></div>
      {list.length === 0 && <p style={{ ...muted, fontStyle: 'italic' }}>Nothing on the record yet. Quotes come in with trades, signings, the draft and the end-of-season reviews.</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: '16px' }}>
        {list.map((n, i) => (
          <section key={i} className="card" style={{ padding: '12px 14px', gap: '6px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {T[n.tid] ? logo(n.tid, 22) : null}
              <Kicker accent>{KIND[n.kind] || 'News'} · {n.season - 1}–{String(n.season).slice(2)} · {gm.fmtS(n.day)}</Kicker>
            </div>
            <blockquote style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '16.5px', lineHeight: 1.35 }}>“{linkNames(n.quote, open, { P })}”</blockquote>
            <div style={{ fontSize: '12px', ...muted }}>
              — {n.who}, {T[n.tid] ? <Link onClick={() => openTeam(n.tid)}>{n.role}</Link> : n.role}
              {(n.pids || []).filter(id => P[id]).map(id => <span key={id}> · <Link onClick={() => open(id)}>{P[id].name}</Link></span>)}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
