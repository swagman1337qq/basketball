// Salary-cap indicator: team salary against the floor, cap, tax line and both aprons.
import type { Game } from '../engine/Game';
import { capState, nums, teamSalary } from '../engine/cba';
import { fmtMoney } from '../engine/capModel';

// delta: a hypothetical change (a trade being built): the bar and numbers show payroll after it,
// with a tick where payroll is now.
export function CapBar({ gm, s, tid, compact, delta = 0 }: { gm: Game; s: any; tid: number; compact?: boolean; delta?: number }) {
  const N = nums(gm), offseason = s.phase === 'fa' || s.phase === 'draft';
  const pay0 = teamSalary(gm, s, tid), payH0 = offseason ? teamSalary(gm, s, tid, { holds: true }) : pay0, pay = pay0 + delta, payH = payH0 + delta;
  const max = Math.max(N.AP2 * 1.08, payH * 1.04), x = (v: number) => (Math.min(v, max) / max) * 100;
  const state = payH > N.AP2 ? [s.capEasy ? 'Over the hard cap' : 'Above the 2nd apron', 'var(--gm-bad)'] : payH > N.AP1 ? ['Above the 1st apron', 'var(--gm-bad)'] : payH > N.TAX ? ['Taxpayer', 'var(--color-accent-800)'] : payH > N.CAP ? ['Over the cap', 'var(--color-accent-700)'] : ['Under the cap', 'var(--gm-good)'];
  const easy = !!s.capEasy, marks: [string, number][] = easy ? [['Floor', N.FLOOR], ['Cap', N.CAP], ['Tax', N.TAX], ['Hard cap', N.AP2]] : [['Floor', N.FLOOR], ['Cap', N.CAP], ['Tax', N.TAX], ['1st apron', N.AP1], ['2nd apron', N.AP2]];
  const room = N.CAP - payH;
  return (
    <div data-tour="capbar" style={{ margin: compact ? '0 0 12px' : '0 0 16px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'baseline', flexWrap: 'wrap', fontSize: '12.5px', marginBottom: '4px' }}>
        <b style={{ color: state[1] }}>{state[0]}</b>
        <span>{delta !== 0 ? 'After this trade: ' : 'Team salary '}{fmtMoney(pay)}{payH !== pay ? ' · ' + fmtMoney(payH) + ' with cap holds' : ''}{delta !== 0 ? <span style={{ color: delta > 0 ? 'var(--gm-bad)' : 'var(--gm-good)' }}> ({delta > 0 ? '+' : '−'}{fmtMoney(Math.abs(delta))})</span> : null}</span>
        <span style={{ color: 'var(--color-neutral-700)' }}>{room >= 0 ? fmtMoney(room) + ' in cap room' : fmtMoney(-room) + ' over the cap'} · {payH <= N.TAX ? fmtMoney(N.TAX - payH) + ' under the tax' : fmtMoney(payH - N.TAX) + ' over the tax'} · {s.capEasy ? (payH <= N.AP2 ? fmtMoney(N.AP2 - payH) + ' under the hard cap' : fmtMoney(payH - N.AP2) + ' over the hard cap') : payH <= N.AP1 ? fmtMoney(N.AP1 - payH) + ' under the 1st apron' : payH <= N.AP2 ? fmtMoney(N.AP2 - payH) + ' under the 2nd apron' : fmtMoney(payH - N.AP2) + ' over the 2nd apron'}</span>
      </div>
      <div style={{ position: 'relative', height: compact ? 10 : 14, background: 'var(--color-neutral-100)', borderRadius: 3, overflow: 'visible' }} title="Team salary against the floor, cap, tax line and aprons">
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: x(pay) + '%', background: state[1], opacity: 0.75, borderRadius: 3 }} />
        {payH !== pay && <div style={{ position: 'absolute', left: x(pay) + '%', top: 0, bottom: 0, width: x(payH) - x(pay) + '%', background: state[1], opacity: 0.3 }} />}
        {marks.map(([k, v]) => <div key={k} style={{ position: 'absolute', left: x(v) + '%', top: -3, bottom: -3, width: 1, background: 'var(--color-text)' }} />)}
        {delta !== 0 && <div title={'Now: ' + fmtMoney(payH0)} style={{ position: 'absolute', left: x(payH0) + '%', top: -5, bottom: -5, width: 3, marginLeft: -1, background: 'var(--color-neutral-600)', borderRadius: 2 }} />}
      </div>
      {!compact && <div style={{ position: 'relative', height: 26, fontSize: '10.5px', color: 'var(--color-neutral-700)' }}>
        {marks.map(([k, v], i) => <span key={k} style={{ position: 'absolute', left: x(v) + '%', top: i % 2 ? 13 : 1, transform: 'translateX(-50%)', whiteSpace: 'nowrap' }}>{k} {fmtMoney(v)}</span>)}
      </div>}
    </div>
  );
}

// How much room is left before each line, in plain words: "$4.2M left until the 1st apron".
export function capLeft(gm: Game, s: any, tid: number, pay: number): { label: string; v: number; over: boolean; hard?: boolean }[] {
  const N = nums(gm), hc = capState(s, tid).hardCap, rows: { label: string; v: number; over: boolean; hard?: boolean }[] = [];
  const add = (label: string, line: number, hard = false) => rows.push({ label, v: Math.abs(line - pay), over: pay > line, hard });
  add('the cap', N.CAP); add('the luxury tax', N.TAX);
  if (s.capEasy) add('the hard cap', N.AP2, true);
  else { add('the 1st apron', N.AP1, hc === 'AP1'); add('the 2nd apron', N.AP2, hc === 'AP2'); }
  return rows;
}
export function CapLeft({ gm, s, tid, pay }: { gm: Game; s: any; tid: number; pay: number }) {
  const rows = capLeft(gm, s, tid, pay), hc = capState(s, tid).hardCap;
  return (
    <div style={{ display: 'grid', gap: 3, fontSize: '12px' }}>
      {rows.map(r => <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ color: 'var(--color-neutral-700)' }}>{r.over ? 'Over ' : 'Until '}{r.label}{r.hard && r.label !== 'the hard cap' ? ' (your hard cap)' : ''}</span>
        <b style={{ color: r.over ? (r.hard ? 'var(--gm-bad)' : 'var(--color-accent-800)') : r.hard ? 'var(--gm-good)' : 'var(--color-text)', whiteSpace: 'nowrap' }}>{r.over ? fmtMoney(r.v) + ' over' : fmtMoney(r.v) + ' left'}</b>
      </div>)}
      {hc && !s.capEasy && <div style={{ color: 'var(--color-neutral-700)', fontSize: '11px' }}>You’re hard-capped at the {hc === 'AP1' ? '1st' : '2nd'} apron this season: payroll can’t go past it.</div>}
    </div>
  );
}
