// Filter a player list by personality, as your scouts read it (your own players are certain;
// everyone else's traits are only as good as your scouting).
import type { VM } from './vm';
import { TRAITS, traitRead } from '../engine/traits';

export function TraitFilter({ value, onChange }: { value: string; onChange: (k: string) => void }) {
  return (
    <select className="input" value={value} onChange={e => onChange(e.target.value)} style={{ width: 'auto', minHeight: 30, fontSize: '12.5px', padding: '3px 8px' }}>
      <option value="">Any personality</option>
      {TRAITS.map(t => <option key={t.k} value={t.k}>{t.label}</option>)}
    </select>
  );
}
export const byTrait = (vm: VM, k: string) => (row: any) => !k || traitRead(vm.ctx.gm, vm.ctx.s, vm.ctx.gm.db.P[row.id]).keys.includes(k);
