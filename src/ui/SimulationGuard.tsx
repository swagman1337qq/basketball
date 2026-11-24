import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Game } from '../engine/Game';

// While a sim runs (2026-11-24): nothing is locked. Every page opens, the numbers update as days are played, and a
// change you make while a day is being played waits until that day is done (Game.setState). A small corner note says
// the sim is running, with Stop.
export function SimulationGuard({ game, children }: { game: Game; children: ReactNode }) {
  const running = useSyncExternalStore(game.subscribeSimulation, game.isSimulating, game.isSimulating);
  const [stopping, setStopping] = useState(false);
  useEffect(() => {
    if (!running) setStopping(false);
  }, [running]);
  return (
    <>
      {children}
      {running && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            bottom: 14,
            right: 14,
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 8px 6px 12px',
            background: 'var(--color-bg)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            boxShadow: '0 2px 10px rgba(0,0,0,.25)',
          }}
        >
          <span>{stopping ? 'Finishing the current day…' : 'Simulating…'}</span>
          <button
            data-simulation-stop
            className="btn btn-secondary"
            style={{ fontSize: '12px', padding: '3px 10px' }}
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
