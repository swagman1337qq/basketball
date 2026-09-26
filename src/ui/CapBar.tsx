// Salary-cap indicator: team salary against the floor, cap, tax line and both aprons.
import type { Game } from '../engine/Game';
import { nums, teamSalary } from '../engine/cba';
import { fmtMoney } from '../engine/capModel';

export function CapBar({ gm, s, tid, compact }: { gm: Game; s: any; tid: number; compact?: boolean }) {
  const N = nums(gm), offseason = s.phase === 'fa' || s.phase === 'draft';
  const pay = teamSalary(gm, s, tid), payH = offseason ? teamSalary(gm, s, tid, { holds: true }) : pay;
  const max = Math.max(N.AP2 * 1.08, payH * 1.04), x = (v: number) => (Math.min(v, max) / max) * 100;
  const state = payH > N.AP2 ? ['Above the 2nd apron', 'var(--gm-bad)'] : payH > N.AP1 ? ['Above the 1st apron', 'var(--gm-bad)'] : payH > N.TAX ? ['Taxpayer', 'var(--color-accent-800)'] : payH > N.CAP ? ['Over the cap', 'var(--color-accent-700)'] : ['Under the cap', 'var(--gm-good)'];
  const marks: [string, number][] = [['Floor', N.FLOOR], ['Cap', N.CAP], ['Tax', N.TAX], ['1st apron', N.AP1], ['2nd apron', N.AP2]];
  const room = N.CAP - payH;
  return (
    <div data-tour="capbar" style={{ margin: compact ? '0 0 12px' : '0 0 16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap', fontSize: '12.5px', marginBottom: '4px' }}>
        <b style={{ color: state[1] }}>{state[0]}</b>
        <span>Team salary {fmtMoney(pay)}{payH !== pay ? ' · ' + fmtMoney(payH) + ' with cap holds' : ''}</span>
        <span style={{ color: 'var(--color-neutral-700)' }}>{room >= 0 ? fmtMoney(room) + ' in cap room' : fmtMoney(-room) + ' over the cap'} · {payH <= N.TAX ? fmtMoney(N.TAX - payH) + ' under the tax' : fmtMoney(payH - N.TAX) + ' over the tax'} · {payH <= N.AP1 ? fmtMoney(N.AP1 - payH) + ' under the 1st apron' : payH <= N.AP2 ? fmtMoney(N.AP2 - payH) + ' under the 2nd apron' : fmtMoney(payH - N.AP2) + ' over the 2nd apron'}</span>
      </div>
      <div style={{ position: 'relative', height: compact ? 10 : 14, background: 'var(--color-neutral-100)', borderRadius: 3, overflow: 'visible' }} title="Team salary against the floor, cap, tax line and aprons">
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: x(pay) + '%', background: state[1], opacity: 0.75, borderRadius: 3 }} />
        {payH !== pay && <div style={{ position: 'absolute', left: x(pay) + '%', top: 0, bottom: 0, width: x(payH) - x(pay) + '%', background: state[1], opacity: 0.3 }} />}
        {marks.map(([k, v]) => <div key={k} style={{ position: 'absolute', left: x(v) + '%', top: -3, bottom: -3, width: 1, background: 'var(--color-text)' }} />)}
      </div>
      {!compact && <div style={{ position: 'relative', height: 26, fontSize: '10.5px', color: 'var(--color-neutral-700)' }}>
        {marks.map(([k, v], i) => <span key={k} style={{ position: 'absolute', left: x(v) + '%', top: i % 2 ? 13 : 1, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{k} {fmtMoney(v)}</span>)}
      </div>}
    </div>
  );
}
