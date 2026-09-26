// Settings → Retirement age: players retire the moment they reach it (off by default).
import type { VM } from '../vm';
import { muted, NumInput } from '../kit';

export function RetirementSetting({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, on = !!s.retireAge;
  const set = (v: number | null) => { gm.setState({ retireAge: v }); if (v) gm.enforceRetirement(); };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(0,1fr) auto', gap: '16px', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600 }}>Retirement age</div>
      <div>
        <div>{on ? 'Mandatory at ' + s.retireAge : 'Off: players retire on their own, usually 35–40'}</div>
        <div style={{ fontSize: '12px', ...muted }}>When on, any player who reaches this age retires immediately, whether he’s on a roster, a free agent or playing abroad. Lowering it retires everyone already past it.</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {on && <NumInput value={s.retireAge} min={25} max={50} step={1} width={64} onValue={v => set(v)} suffix="years" />}
        <button className="btn btn-secondary" onClick={() => set(on ? null : 38)} style={{ whiteSpace: 'nowrap' }}>{on ? 'Turn off' : 'Turn on'}</button>
      </div>
    </div>
  );
}
