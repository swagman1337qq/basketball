import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Game } from '../engine/Game';

const READING = '[data-simulation-read-region]';
function readingControl(target: Element) {
  const control = target.closest('button, input, select, textarea, a, [role="button"], [contenteditable="true"], [data-simulation-browse]');
  return !!target.closest(READING) || !!control?.hasAttribute('data-simulation-browse');
}

// Only marked reading controls can use the isolated browsing copy while running.
export function SimulationGuard({
  game,
  browsing = false,
  asOf,
  children,
}: {
  game: Game;
  browsing?: boolean;
  asOf?: string;
  children: ReactNode;
}) {
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
      if (browsing && target instanceof Element && event.type !== 'drop' && event.type !== 'dragstart') {
        if (readingControl(target)) return;
        if (event instanceof KeyboardEvent && ['Tab', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key))
          return;
      }
      if (event instanceof KeyboardEvent && event.key === 'Escape') {
        game.stopSim();
        setStopping(true);
      }
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    // Capture synchronously as well as using inert: a second action cannot race
    // React's first render of the running state, and portals are covered too.
    const events = [
      'click',
      'dblclick',
      'pointerdown',
      'keydown',
      'keyup',
      'beforeinput',
      'input',
      'change',
      'submit',
      'drop',
      'dragstart',
    ];
    events.forEach(name => document.addEventListener(name, block, true));
    return () => events.forEach(name => document.removeEventListener(name, block, true));
  }, [game, browsing]);
  useEffect(() => {
    if (!running || !browsing) return;
    const locked = new Map<
      HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement,
      { inert: boolean; aria: string | null }
    >();
    const restore = (previous: { inert: boolean; aria: string | null }, el: HTMLElement) => {
      el.inert = previous.inert;
      if (previous.aria == null) el.removeAttribute('aria-disabled');
      else el.setAttribute('aria-disabled', previous.aria);
      delete el.dataset.simulationLocked;
    };
    const lock = () => {
      document
        .querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement>('button,input,select,textarea')
        .forEach(el => {
          if (el.closest('[data-simulation-stop]') || readingControl(el)) return;
          if (!locked.has(el)) locked.set(el, { inert: el.inert, aria: el.getAttribute('aria-disabled') });
          if (!el.inert) el.inert = true;
          el.setAttribute('aria-disabled', 'true');
          el.dataset.simulationLocked = '';
        });
      locked.forEach((previous, el) => {
        if (!el.isConnected) {
          restore(previous, el);
          locked.delete(el);
        }
      });
    };
    lock();
    const observer = new MutationObserver(lock);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['inert'] });
    return () => {
      observer.disconnect();
      locked.forEach(restore);
    };
  }, [running, browsing]);
  return (
    <>
      <div inert={running && !browsing} style={{ display: 'contents' }}>
        {children}
      </div>
      {running && <style>{'[data-simulation-locked] { opacity: .45 !important; cursor: not-allowed !important; }'}</style>}
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
          <span>
            {stopping
              ? 'Finishing the current day…'
              : browsing
                ? 'Simulating… Showing ' + (asOf || 'completed') + ' results. Changes are locked.'
                : 'Simulating…'}
          </span>
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
