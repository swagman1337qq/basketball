import { Game } from '../engine/Game';
import { yieldToBrowser } from '../engine/cooperative';

// Cursor state belongs to the reader, never to the in-flight simulation.
const VIEW_KEYS = new Set([
  'screen',
  'modal',
  'pid',
  'ptab',
  'ptabHist',
  'pageStack',
  'teamModal',
  'listModal',
  'boxId',
  'boxTeam',
  'q',
  'rosterAt',
  'rosterView',
  'rosterSub',
  'showJson',
  'baseY',
  'navTick',
  'awardsYear',
  'standMode',
  'standSeg',
  'stand',
  'navCollapsed',
  'adv',
  'sort',
]);
const CLEAR_KEYS = new Set(['extYears', 'extAmt', 'extMsg']);
export const BROWSE_SCREENS = new Set([
  'dash',
  'roster',
  'standings',
  'schedule',
  'daily',
  'leaders',
  'stats',
  'playoffs',
  'history',
  'records',
  'draft',
  'trade',
  'staff',
  'players',
  'hall',
  'awards',
]);

// Completed box bodies are append-only during regular-season simulation. Own the
// index, and reuse those large immutable bodies instead of copying a season's PBP.
async function copyDb(db: any, pause = yieldToBrowser, stopped = () => false): Promise<any> {
  const result: any = {};
  let started = performance.now();
  for (const [key, value] of Object.entries(db)) {
    if (stopped()) return null;
    if (key === 'boxes') result[key] = { ...(value as any) };
    else if (key === 'P' || key === 'rapm') {
      const entries = Object.entries(value as any);
      const out: any = (result[key] = {});
      for (let i = 0; i < entries.length; i += 12) {
        if (stopped()) return null;
        Object.assign(out, structuredClone(Object.fromEntries(entries.slice(i, i + 12))));
        if (performance.now() - started >= 8) {
          await pause();
          started = performance.now();
        }
      }
    } else result[key] = structuredClone(value);
    if (performance.now() - started >= 8) {
      await pause();
      started = performance.now();
    }
  }
  return result;
}

export class SimulationBrowse {
  view: Game | null = null;
  revision = 0;
  private listeners = new Set<() => void>();
  private changed: Record<string, any> = {};
  private connected = false;
  private disposeView: (view: Game) => void;
  constructor(
    readonly source: Game,
    disposeView: (view: Game) => void = () => {},
    private pause = yieldToBrowser,
  ) {
    this.disposeView = disposeView;
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = () => this.revision;
  private emit() {
    this.revision++;
    this.listeners.forEach(fn => fn());
  }
  private reader(db: any, state: any) {
    const view = new Game();
    view.db = db;
    view.state = state;
    view.busy = true;
    view.saveVersion = this.source.saveVersion;
    view.statsVersion = this.source.statsVersion;
    view.setState = (update: any) => {
      // Functional navigation updaters run against detached state. The capture
      // guard admits only marked reading controls; mixed edits are rejected.
      if (!this.source.busy || this.view !== view) return;
      const patch = typeof update === 'function' ? update(view.state) : update;
      if (!patch || !Object.keys(patch).every(k => VIEW_KEYS.has(k) || (CLEAR_KEYS.has(k) && patch[k] == null))) return;
      if (patch.ptab === 'edit' || (patch.screen && !BROWSE_SCREENS.has(patch.screen))) return;
      view.state = { ...view.state, ...patch };
      for (const key of Object.keys(patch)) if (VIEW_KEYS.has(key)) this.changed[key] = patch[key];
      view.version++;
      this.emit();
    };
    // A browsing copy is never a save source or a second simulator.
    view.saveSnapshot = () => {
      throw new Error('Browsing copies cannot be saved.');
    };
    return view;
  }
  connect() {
    this.connected = true;
    const prepare = async (stopped: () => boolean) => {
      try {
        const db = await copyDb(this.source.db, this.pause, () => stopped() || !this.connected);
        if (!db || !this.connected || !this.view) return;
        const old = this.view;
        this.view = this.reader(db, old.state);
        this.disposeView(old);
        this.emit();
      } catch {
        if (this.view) this.disposeView(this.view);
        this.view = null;
        this.changed = {};
        this.emit();
      }
    };
    this.source.prepareSimulation = prepare;
    const unsubscribe = this.source.subscribeSimulation(() => {
      if (this.source.busy) {
        this.changed = {};
        // While preparation yields the live database is stable: sim() awaits it.
        // Navigation is already available, and editing remains capture-blocked.
        try {
          const state = structuredClone(this.source.state);
          // Opening a sim from an editor must not mount editing effects against
          // the stable database used while the detached copy is being prepared.
          if (!BROWSE_SCREENS.has(state.screen)) state.screen = 'roster';
          if (state.ptab === 'edit') state.ptab = 'overview';
          state.dialog = null;
          state.dragId = state.overId = null;
          this.disposeView(this.source);
          this.view = this.reader(this.source.db, state);
        } catch {
          this.view = null;
        }
        this.emit();
      } else {
        if (this.view) this.disposeView(this.view);
        this.view = null;
        const patch = this.changed;
        this.changed = {};
        // Commit only the reader's cursor after the entire run has finished.
        if (Object.keys(patch).length) this.source.setState(patch);
        this.emit();
      }
    });
    return () => {
      this.connected = false;
      unsubscribe();
      if (this.source.prepareSimulation === prepare) this.source.prepareSimulation = undefined;
      if (this.view) this.disposeView(this.view);
      this.view = null;
    };
  }
}
