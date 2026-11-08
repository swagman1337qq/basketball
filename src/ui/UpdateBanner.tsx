// "A new version is ready" (2026-11-01): when an update has installed in the background (main.tsx, 'bm-update'),
// a small bar offers to reload. Your league is saved first, so nothing is lost; Later hides it until the next update.
import { useEffect, useState } from 'react';

export function UpdateBanner({ beforeReload }: { beforeReload?: () => Promise<void> | void }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const f = () => setOn(true);
    window.addEventListener('bm-update', f);
    return () => window.removeEventListener('bm-update', f);
  }, []);
  if (!on) return null;
  const reload = async () => {
    try {
      await beforeReload?.();
    } catch {
      /* reload anyway: the league autosaves */
    }
    window.location.reload();
  };
  return (
    <div
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 18,
        transform: 'translateX(-50%)',
        zIndex: 2000,
        display: 'flex',
        gap: 12,
        alignItems: 'center',
        padding: '9px 14px',
        background: 'var(--color-bg)',
        color: 'var(--color-text)',
        border: '1px solid var(--color-accent)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 8px 24px rgba(0,0,0,.35)',
        fontSize: '13px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span>A new version of the game is ready.</span>
      <button className="btn btn-primary" onClick={reload} style={{ fontSize: '12.5px', padding: '3px 12px' }}>
        Reload
      </button>
      <button className="btn btn-ghost" onClick={() => setOn(false)} style={{ fontSize: '12.5px' }}>
        Later
      </button>
    </div>
  );
}
