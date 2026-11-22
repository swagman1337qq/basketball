import { Game } from '../engine/Game';
import { yieldToBrowser } from '../engine/cooperative';
import { copyBrowseDb } from './simulationBrowseCopy';
import { BrowseCopyWarmup, type BrowseIdleScheduler } from './simulationBrowseIdle';

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

export class SimulationBrowse {
  view: Game | null = null;
  revision = 0;
  private runVersion = 0;
  private listeners = new Set<() => void>();
  private changed: Record<string, any> = {};
  private connected = false;
  private previous?: { source: object; db: any };
  private warmed?: { source: object; revision: number };
  private warmup: BrowseCopyWarmup;
  private disposeView: (view: Game) => void;
  constructor(
    readonly source: Game,
    disposeView: (view: Game) => void = () => {},
    private pause = yieldToBrowser,
    idle?: BrowseIdleScheduler,
  ) {
    this.disposeView = disposeView;
    this.warmup = new BrowseCopyWarmup(idle);
  }
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  getVersion = () => this.revision;
  // React must not repeatedly retry a frozen screen against a changing live
  // store snapshot. The completed source version becomes visible at run end.
  getLiveVersion = () => (this.source.busy && this.view ? this.runVersion : this.source.getVersion());
  private emit() {
    this.revision++;
    this.listeners.forEach(fn => fn());
  }
  private warm() {
    const source = this.source.db,
      revision = this.source.statsVersion;
    if (!this.connected || this.source.busy || this.source.dayInProgress || this.source.state.phase !== 'regular') {
      this.warmup.stop();
      return;
    }
    if (this.warmed && this.warmed.source === source && this.warmed.revision === revision) return;
    const previous = this.previous && this.previous.source === source ? this.previous.db : undefined;
    this.warmup.start(
      source,
      revision,
      previous,
      () =>
        this.connected &&
        !this.source.busy &&
        !this.source.dayInProgress &&
        this.source.db === source &&
        this.source.statsVersion === revision,
      db => {
        this.previous = { source, db };
        this.warmed = { source, revision };
      },
    );
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
        const source = this.source.db,
          revision = this.source.statsVersion;
        const previous = this.previous && this.previous.source === source ? this.previous.db : undefined;
        const db = await copyBrowseDb(
          source,
          previous,
          this.pause,
          () => stopped() || !this.connected || this.source.db !== source || this.source.statsVersion !== revision,
        );
        if (!db) {
          if (!stopped()) throw new Error('The browsing source changed during preparation.');
          return;
        }
        if (!this.connected || !this.view) return;
        this.previous = { source, db };
        this.warmed = { source, revision };
        const old = this.view;
        this.view = this.reader(db, old.state);
        this.disposeView(old);
        this.emit();
      } catch {
        this.previous = undefined;
        this.warmed = undefined;
        if (this.view) this.disposeView(this.view);
        this.view = null;
        this.changed = {};
        this.emit();
      }
    };
    this.source.prepareSimulation = prepare;
    const unsubscribe = this.source.subscribeSimulation(() => {
      if (this.source.busy) {
        this.warmup.stop();
        this.runVersion = this.source.getVersion();
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
        this.warm();
      }
    });
    const unsubscribeData = this.source.subscribe(() => this.warm());
    this.warm();
    return () => {
      this.connected = false;
      this.warmup.stop();
      unsubscribe();
      unsubscribeData();
      if (this.source.prepareSimulation === prepare) this.source.prepareSimulation = undefined;
      if (this.view) this.disposeView(this.view);
      this.view = null;
      this.previous = undefined;
      this.warmed = undefined;
    };
  }
}
