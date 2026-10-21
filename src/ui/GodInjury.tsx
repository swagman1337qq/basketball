// God Mode: injure a player by hand. Pick any injury type (data/injuries.ts, by how long it lasts) or type
// your own with the games he'll miss. These never cost him ratings (Game.godInjure); natural injuries do.
import { useState } from 'react';
import { INJ_DTD, INJ_MAJOR, INJ_SHORT, INJ_WEEKS, rollInjury, type InjType } from '../data/injuries';
import type { Game } from '../engine/Game';

const GROUPS: [string, InjType[], { major?: boolean; dtd?: boolean }][] = [['Day-to-day', INJ_DTD, { dtd: true }], ['Short (days)', INJ_SHORT, {}], ['Weeks', INJ_WEEKS, {}], ['Season-ending', INJ_MAJOR, { major: true }]];
const mid = (x: InjType) => Math.round((x.min + x.max) / 2);

// buttons: the profile's quick buttons (Heal, Minor injury: a random short or multi-week one, Major injury: a
// random season-ender) instead of the full list.
export function GodInjury({ gm, pid, injured, onHeal, buttons }: { gm: Game; pid: number; injured: boolean; onHeal: () => void; buttons?: boolean }) {
  const [name, setName] = useState(''), [games, setGames] = useState('10');
  const g = Math.round(+games);
  const ok = !!name.trim() && g >= 1 && g <= 500;
  return (
    <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
      {buttons ? <>
        <button className="btn btn-secondary" onClick={onHeal} style={{ fontSize: '12px', padding: '3px 10px' }}>Heal</button>
        <button className="btn btn-secondary" onClick={() => { const r = rollInjury(Math.random() < 0.6 ? INJ_SHORT : INJ_WEEKS); gm.godInjure(pid, r.name, r.games); }} style={{ fontSize: '12px', padding: '3px 10px' }}>Minor injury</button>
        <button className="btn btn-secondary" onClick={() => { const r = rollInjury(INJ_MAJOR); gm.godInjure(pid, r.name, r.games, { major: true }); }} style={{ fontSize: '12px', padding: '3px 10px' }}>Major injury</button>
      </> : <select className="input" value="" title="Injuries you trigger here never lower his ratings" onChange={e => { const [gi, i] = e.target.value.split(':').map(Number); const G = GROUPS[gi], x = G?.[1][i]; if (x) gm.godInjure(pid, x.name, mid(x), G[2]); }}>
        <option value="">Trigger an injury…</option>
        {GROUPS.map(([label, list], gi) => <optgroup key={label} label={label}>{list.map((x, i) => <option key={x.name} value={gi + ':' + i}>{x.name} ({mid(x)}g)</option>)}</optgroup>)}
      </select>}
      <input className="input" placeholder="Custom injury" value={name} onChange={e => setName(e.target.value)} style={{ width: '140px' }} />
      <input className="input" type="number" min={1} max={500} value={games} onChange={e => setGames(e.target.value)} style={{ width: '64px' }} title="Games out" />
      <span style={{ fontSize: '12px' }}>games</span>
      <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '3px 10px' }} disabled={!ok} onClick={() => { gm.godInjure(pid, name, g, { major: g >= 60 }); setName(''); }}>Injure</button>
      {injured && !buttons && <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '3px 10px' }} onClick={onHeal}>Heal now</button>}
    </span>
  );
}
