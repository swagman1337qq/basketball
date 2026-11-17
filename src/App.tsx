import { disposeProfileStats } from './ui/profileStatsClient';
import { createSaveWriter } from './db/saveWriter';
import { SaveStatusContext } from './ui/SaveStatus';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { getSave, newSaveId, putSave, summarize, exportSave, type SaveRow } from './db/saves';
import { adoptLeagueCards, loadCards } from './db/cards';
import type { TeamSpec } from './data/world';
import { Game } from './engine/Game';
import { GMView } from './ui/GMView';
import { TitleScreen } from './ui/TitleScreen';
import { applyTheme, rememberTheme } from './ui/theme';
import { buildView } from './ui/viewModel';
import { PlayerHover } from './ui/PlayerHover';
import { StatHover } from './ui/StatHover';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { UpdateBanner } from './ui/UpdateBanner';

interface Open {
  id: string;
  name: string;
  createdAt: number;
  game: Game;
}

export function App() {
  const [open, setOpen] = useState<Open | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    loadCards();
  }, []); // the shared player-card library

  const onCreate = useCallback(
    async (name: string, seed: number, tids: number[], start: '' | 'worst' | 'hopeless' | 'spectate' = '', teams?: TeamSpec[]) => {
      const game = Game.create(seed, tids, {
        worst: start === 'worst',
        hopeless: start === 'hopeless',
        spectate: start === 'spectate',
        teams,
      });
      const now = Date.now();
      const row: SaveRow = { id: newSaveId(), name, createdAt: now, updatedAt: now, summary: '', data: game.toSave() };
      row.summary = summarize(row.data);
      try {
        await putSave(row);
      } catch {
        setError('Could not write to browser storage; this league will not be saved.');
      }
      setOpen({ id: row.id, name, createdAt: now, game });
    },
    [],
  );

  const onOpen = useCallback(async (id: string) => {
    const row = await getSave(id, { lazyBoxes: true });
    if (!row) return;
    const game = Game.load(row.data);
    // A league from before cards were shared: its cards join the shared library, then leave the save.
    if (game.state.cards) {
      try {
        await adoptLeagueCards(game.state.cards, row.name);
        game.setState({ cards: undefined });
      } catch {
        /* keep them in the save */
      }
    }
    setOpen({ id, name: row.name, createdAt: row.createdAt, game });
  }, []);

  if (!open)
    return (
      <>
        <TitleScreen onOpen={onOpen} onCreate={onCreate} />
        <UpdateBanner />
      </>
    );
  return <GameScreen key={open.id} open={open} error={error} onExit={() => setOpen(null)} onSwitch={onOpen} />;
}

function GameScreen({ open, error, onExit, onSwitch }: { open: Open; error: string; onExit: () => void; onSwitch: (id: string) => void }) {
  const { game } = open;
  const version = useSyncExternalStore(game.subscribe, game.getVersion);
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(error || 'Saved');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSaved = useRef(game.saveVersion);
  const lastSavedView = useRef(game.version);
  const writer = useMemo(() => createSaveWriter(), [game]);
  const saving = useRef<Promise<void> | null>(null);
  useEffect(() => () => disposeProfileStats(game), [game]);

  const save = useCallback(
    async (force = false) => {
      clearTimeout(timer.current);
      // Coalesce simultaneous autosave, exit and visibility requests. An explicit exit
      // waits for the latest version, even if a previous save was already in flight.
      while (saving.current) await saving.current;
      if (lastSaved.current === game.saveVersion && (!force || lastSavedView.current === game.version)) return;
      const viewVersion = game.version;
      const job = (async () => {
        try {
          lastSaved.current = await writer.save(game, open);
          lastSavedView.current = viewVersion;
          setStatus(lastSaved.current === game.saveVersion ? 'Saved' : 'Saving…');
        } catch {
          setStatus('Save failed: browser storage unavailable');
        }
      })();
      saving.current = job;
      await job;
      if (saving.current === job) saving.current = null;
    },
    [game, open, writer],
  );

  // Autosave shortly after every change, and immediately when the tab is hidden or closed. While a
  // multi-day sim runs, nothing is saved until it stops (writing a long league's whole save between
  // days slowed the sim down); the change that ends the sim brings the save.
  useEffect(() => {
    if (game.saveVersion === lastSaved.current) return;
    setStatus('Saving…');
    clearTimeout(timer.current);
    if (game.busy || game.state.simming) return;
    timer.current = setTimeout(() => void save(), 700);
  }, [version, save, game]);
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') void save(true);
    };
    const hide = () => void save(true);
    window.addEventListener('pagehide', hide);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('pagehide', hide);
      document.removeEventListener('visibilitychange', flush);
      clearTimeout(timer.current);
      void save(true).finally(() => writer.dispose());
    };
  }, [save, writer]);

  // Escape closes the topmost overlay: confirm dialog, then player, team and list modals.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const s = game.state;
      if (s.dialog) game.setState({ dialog: null });
      else if (s.boxId) game.setState({ boxId: null });
      else if (s.letterOpen) game.setState({ letterOpen: null });
      else if (s.modal) game.setState({ modal: false });
      else if (s.teamModal != null) game.setState({ teamModal: null });
      else if (s.listModal) game.setState({ listModal: null });
      else if (s.q) game.setState({ q: '' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [game]);

  const dark = (game.state.theme ?? 'dark') === 'dark';
  useLayoutEffect(() => {
    applyTheme(rootRef.current, dark, game.state.teams[game.state.me]?.colors);
    rememberTheme(dark ? 'dark' : 'light');
  }, [dark, game.state.me, game.state.teams[game.state.me]?.colors]);

  const exportNow = async () => {
    try {
      await exportSave({
        id: open.id,
        name: open.name,
        createdAt: open.createdAt,
        updatedAt: Date.now(),
        summary: '',
        data: game.toSave(),
      });
    } catch {
      setStatus('Export failed: game details could not be loaded. Please try again.');
    }
  };
  const vm = useMemo(
    () =>
      buildView(game, rootRef, {
        saveId: open.id,
        saveName: open.name,
        saveStatus: 'Saved',
        onExit: async () => {
          await save(true);
          onExit();
        },
        onSwitch: async (id: string) => {
          await save(true);
          onSwitch(id);
        },
        onExport: exportNow,
      }),
    [game, version, open, save, onExit, onSwitch],
  );
  const content = useMemo(() => <GMView vm={vm} />, [vm]);
  return (
    <>
      <SaveStatusContext.Provider value={status}>{content}</SaveStatusContext.Provider>
      <ErrorBoundary quiet resetKey={String(version)}>
        <PlayerHover gm={game} />
        <StatHover />
      </ErrorBoundary>
      <UpdateBanner beforeReload={() => save(true)} />
    </>
  );
}
