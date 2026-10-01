// How your moves turned out: signings, declines, matched offer sheets, players who signed
// elsewhere, player options, expired contracts. Queued in s.notices; one popup shows them all.
import type { VM } from '../vm';
import { Kicker, Link, muted } from '../kit';

const TONE: Record<string, [string, string]> = { good: ['var(--gm-good)', '✓'], bad: ['var(--gm-bad)', '✗'], info: ['var(--color-accent-700)', '•'] };

export function NoticeModal({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx, P = gm.db.P, list: any[] = s.notices || [];
  if (!list.length) return null;
  const close = () => gm.setState({ notices: [] });
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 45%, transparent)', zIndex: 29, padding: '16px' }} onClick={close}>
      <div className="card" role="dialog" aria-label="Updates" onClick={e => e.stopPropagation()} style={{ width: 'min(560px, 100%)', maxHeight: '86vh', overflowY: 'auto', padding: '20px 22px', gap: '14px', background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
        <Kicker accent>{list.length === 1 ? 'Update' : list.length + ' updates'}</Kicker>
        {list.map(n => { const [c, mark] = TONE[n.tone] || TONE.info; return (
          <div key={n.id} style={{ borderLeft: '3px solid ' + c, paddingLeft: 12 }}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', color: c }}>{mark} {n.title}</div>
            <ul style={{ margin: '4px 0 0', paddingLeft: '16px', lineHeight: 1.5 }}>{n.lines.map((x: string, i: number) => <li key={i}>{x}</li>)}</ul>
            {(n.pids || []).filter((id: number) => P[id] && !P[id].gone).length > 0 && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4, fontSize: '12px' }}>
              <span style={muted}>Profile:</span>{n.pids.filter((id: number) => P[id] && !P[id].gone).map((id: number) => <Link key={id} onClick={() => { close(); open(id); }} style={{ textDecoration: 'underline' }}>{P[id].name}</Link>)}
            </div>}
          </div>); })}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button className="btn btn-primary" onClick={close} autoFocus>Got it</button></div>
      </div>
    </div>
  );
}
