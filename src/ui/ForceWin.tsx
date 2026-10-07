// God Mode: force the winner of a regular-season game that's still to be played. Two small tick
// boxes, one per team's abbreviation (away first); tick one and that team wins when the day is
// simmed. The game is still played out with a real box score; the ticked team just ends up on top.
import type { VM } from './vm';
import { GOD_PINK } from './kit';

export const godKey = (Y: number, day: number, h: number, a: number) => Y + ':' + day + ':' + h + ':' + a; // Game.simDay reads s.godWin by this key

export function ForceWin({ vm, day, h, a, small }: { vm: VM; day: number; h: number; a: number; small?: boolean }) {
  const { gm, s, T } = vm.ctx;
  if (!s.god || s.phase !== 'regular' || day < s.day) return null;
  const k = godKey(gm.Y, day, h, a), w = (s.godWin || {})[k];
  const set = (tid: number) => gm.setState((st: any) => { const g = { ...(st.godWin || {}) }; if (g[k] === tid) delete g[k]; else g[k] = tid; return { godWin: g }; });
  const box = (tid: number) => (
    <label key={tid} title={w === tid ? T[tid].name + ' will win (untick to let the game decide)' : 'God Mode: make the ' + T[tid].name + ' win'}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 3, cursor: 'pointer', fontSize: small ? '10.5px' : '11.5px', lineHeight: 1, color: w === tid ? GOD_PINK : 'var(--color-neutral-700)', fontWeight: w === tid ? 700 : 500 }}>
      <input type="checkbox" checked={w === tid} onChange={() => set(tid)} style={{ accentColor: GOD_PINK, margin: 0, width: small ? 11 : 13, height: small ? 11 : 13, cursor: 'pointer' }} />{T[tid].abbr}
    </label>);
  return <span onClick={e => e.stopPropagation()} style={{ display: 'inline-flex', gap: small ? 5 : 8, alignItems: 'center', flexWrap: 'wrap' }}>{box(a)}{box(h)}</span>;
}
