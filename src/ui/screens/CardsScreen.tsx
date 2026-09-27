// Player cards (God Mode only): build, save and apply whole player builds. Pick the player to
// apply them to at the top (any player: rosters, free agents, overseas, draft prospects).
import type { VM } from '../vm';
import { Combo, GOD_PINK, muted } from '../kit';
import { CardLibrary, playerOpts } from '../modals/CardLibrary';
import { useState } from 'react';

export function CardsScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, P = gm.db.P, target = s.cardTarget != null ? P[s.cardTarget] : null, [q, setQ] = useState('');
  const tidOf = (id: number) => { for (const k of Object.keys(s.rosters)) if (s.rosters[k].includes(id)) return s.teams[+k].abbr; return null; };
  const from = s.cardFrom, back = from && P[from.pid] ? () => gm.setState({ screen: from.screen || 'dash', pid: from.pid, modal: true, ptab: from.ptab || 'overview', cardFrom: null }) : null;
  return (<>
    {back && <button className="hv4" onClick={back} style={{ all: 'unset', cursor: 'pointer', color: GOD_PINK, fontSize: '13px', marginBottom: 10, display: 'inline-block' }}>← Back to {P[from.pid].name}</button>}
    <div style={{ padding: '8px 12px', marginBottom: 12, borderLeft: '3px solid ' + GOD_PINK, background: 'color-mix(in srgb, ' + GOD_PINK + ' 8%, transparent)', fontSize: '12.5px' }}>
      <b style={{ color: GOD_PINK }}>God Mode</b> · A card is a whole player build: name, bio, ratings, potential, intangibles, personality and shot tendencies. Build one from a blank template or from any player, edit it, save it, and apply it to anyone. Test it by simming seasons and adjust.
    </div>
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
      <b style={{ fontSize: '13px' }}>Apply cards to:</b>
      {target ? <span style={{ fontSize: '13px' }}><button className="hv4" onClick={() => vm.ctx.open(target.id)} style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)', fontWeight: 600 }}>{target.name}</button> <span style={muted}>{target.pos} · {target.age} · {target.ovr}/{target.pot} · {tidOf(target.id) || (target.cls ? 'Class of ' + target.cls : 'FA')}</span></span> : <span style={muted}>nobody yet</span>}
      <Combo value={q} options={playerOpts(gm, s)} placeholder={target ? 'Pick someone else…' : 'Pick a player (search by name)…'} width={260} onChange={setQ} onPick={o => { setQ(''); gm.setState({ cardTarget: (o as any).id }); }} />
    </div>
    <CardLibrary vm={vm} p={target} />
  </>);
}
