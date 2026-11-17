import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Game } from '../engine/Game';

// A yielding day has mutable player data but has not committed its standings/logs
// yet. Keep all editing/navigation inert until Stop finishes that day.
export function SimulationGuard({ game, children }: { game: Game; children: ReactNode }) {
  const running = useSyncExternalStore(game.subscribeSimulation, game.isSimulating, game.isSimulating);
  const [stopping, setStopping] = useState(false);
  useEffect(() => {
    if (!running) setStopping(false);
  }, [running]);
  useEffect(() => {
    const block = (event: Event) => {
      if (!game.busy) return;
      const target = event.target;
      if (target instanceof Element && target.closest('[data-simulation-stop]')) return;
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        game.stopSim();
        setStopping(true);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    // Capture synchronously as well as using inert: a second action cannot race
    // React's first render of the running state, and portals are covered too.
    const events = ['click', 'dblclick', 'pointerdown', 'keydown', 'keyup', 'beforeinput', 'input', 'change', 'submit', 'drop'];
    events.forEach(name => document.addEventListener(name, block, true));
    return () => events.forEach(name => document.removeEventListener(name, block, true));
  }, [game]);
  return (
    <>
      <div inert={running} style={{ display: 'contents' }}>
        {children}
      </div>
      {running && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 18,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '9px 14px',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <span>{stopping ? 'Finishing the current day…' : 'Simulating…'}</span>
          <button
            data-simulation-stop
            className="btn btn-secondary"
            disabled={stopping}
            onClick={() => {
              game.stopSim();
              setStopping(true);
            }}
          >
            Stop
          </button>
        </div>
      )}
    </>
  );
}
