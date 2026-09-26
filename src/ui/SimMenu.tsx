// The season bar's actions as one split button: the main part runs your usual choice, ▾ lists
// every option (play a day, a week, a month, to the deadline…). Picking one runs it and makes it
// the default next time. With one or two actions they stay plain buttons.
import { useEffect, useRef, useState } from 'react';

type Act = { label: string; go: () => void; cls?: string; dis?: boolean };
export function SimMenu({ actions }: { actions: Act[] }) {
  const [open, setOpen] = useState(false), [pick, setPick] = useState<string | null>(() => { try { return localStorage.getItem('simPick'); } catch { return null; } }), ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) return; const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', close); return () => document.removeEventListener('mousedown', close); }, [open]);
  if (actions.length <= 2) return <>{actions.map((a, i) => <button key={i} className={'btn ' + (a.cls || 'btn-secondary')} onClick={a.go} disabled={a.dis} style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '5px 12px' }}>{a.label}</button>)}</>;
  // The default: your last pick if it's on offer now, else the first (the smallest step), never a
  // big jump like 'Sim to training camp' by surprise.
  const main = actions.find(a => a.label === pick && !a.dis) || actions.find(a => !a.dis) || actions[0];
  const run = (a: Act) => { setOpen(false); if (a.dis) return; setPick(a.label); try { localStorage.setItem('simPick', a.label); } catch { /* private mode */ } a.go(); };
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <button className="btn btn-primary" onClick={() => run(main)} disabled={main.dis} style={{ whiteSpace: 'nowrap', fontSize: '13px', padding: '5px 12px', borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>▶ {main.label}</button>
      <button className="btn btn-primary" onClick={() => setOpen(o => !o)} aria-label="More options" aria-expanded={open} title="More ways to sim" style={{ fontSize: '13px', padding: '5px 9px', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, borderLeft: '1px solid color-mix(in srgb, var(--color-bg) 35%, transparent)' }}>▾</button>
      {open && (
        <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 60, minWidth: 250, background: 'var(--color-bg)', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', padding: 4 }}>
          {actions.map((a, i) => (
            <button key={i} className="hv2" disabled={a.dis} onClick={() => run(a)} style={{ all: 'unset', boxSizing: 'border-box', width: '100%', cursor: a.dis ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10, padding: '7px 10px', borderRadius: 4, fontSize: '13px', opacity: a.dis ? .45 : 1, fontWeight: a === main ? 600 : 400, color: a === main ? 'var(--color-accent-700)' : undefined }}>
              <span>{a.label}</span>{a === main && <span style={{ fontSize: '11px' }}>default</span>}
            </button>))}
        </div>)}
    </div>
  );
}
