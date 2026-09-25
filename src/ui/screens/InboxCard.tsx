// Front-office inbox on the dashboard: incentive dilemmas and owner mandates.
import type { VM } from '../vm';
import { resolveInbox } from '../../engine/frontOffice';
import { Kicker, Link, muted } from '../kit';

export function InboxCard({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx;
  const items = (s.inbox || []).filter(x => !x.done || x.kind === 'mandate' && !x.resolved).slice(0, 6);
  const recent = (s.inbox || []).filter(x => x.done && x.kind !== 'mandate').slice(0, 3);
  if (!items.length && !recent.length) return null;
  return (
    <section className="card" style={{ padding: '14px 16px', marginBottom: '22px', gap: '10px' }}>
      <Kicker accent>Front-office inbox</Kicker>
      {items.map(x => (
        <div key={x.id} style={{ borderBottom: '1px solid var(--color-divider)', paddingBottom: '8px' }}>
          <div style={{ fontWeight: 600 }}>{x.pid != null ? <Link onClick={() => open(x.pid)}>{x.title}</Link> : x.title}</div>
          <div style={{ fontSize: '12.5px', ...muted, margin: '2px 0 6px' }}>{x.text}</div>
          {!x.done && (
            <div style={{ display: 'flex', gap: '6px' }}>
              {x.options.map(o => <button key={o.k} className={o.k === 'yes' || o.k === 'ok' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ fontSize: '12px', padding: '4px 10px' }} onClick={() => resolveInbox(gm, x.id, o.k)}>{o.label}</button>)}
            </div>
          )}
          {x.kind === 'mandate' && x.done && <div style={{ fontSize: '12px', color: 'var(--color-accent-700)' }}>Deadline {gm.fmtS(x.deadline)} · payroll must be under ${x.target.toFixed(1)}M</div>}
        </div>
      ))}
      {recent.map(x => <div key={x.id} style={{ fontSize: '12px', ...muted }}>✓ {x.title}{x.choice ? ' — ' + (x.options.find(o => o.k === x.choice)?.label || '') : ''}</div>)}
    </section>
  );
}
