import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { getSave, newSaveId, putSave, summarize, exportSave, type SaveRow } from './db/saves';
import { Game } from './engine/Game';
import { GMView } from './ui/GMView';
import { TitleScreen } from './ui/TitleScreen';
import { applyTheme, rememberTheme } from './ui/theme';
import { buildView } from './ui/viewModel';

interface Open { id: string; name: string; createdAt: number; game: Game }

export function App() {
  const [open, setOpen] = useState<Open | null>(null);
  const [error, setError] = useState('');

  const onCreate = useCallback(async (name: string, seed: number, tids: number[]) => {
    const game = Game.create(seed, tids);
    const now = Date.now();
    const row: SaveRow = { id: newSaveId(), name, createdAt: now, updatedAt: now, summary: '', data: game.toSave() };
    row.summary = summarize(row.data);
    try { await putSave(row); } catch { setError('Could not write to browser storage; this league will not be saved.'); }
    setOpen({ id: row.id, name, createdAt: now, game });
  }, []);

  const onOpen = useCallback(async (id: string) => {
    const row = await getSave(id);
    if (!row) return;
    setOpen({ id, name: row.name, createdAt: row.createdAt, game: Game.load(row.data) });
  }, []);

  if (!open) return <TitleScreen onOpen={onOpen} onCreate={onCreate} />;
  return <GameScreen key={open.id} open={open} error={error} onExit={() => setOpen(null)} />;
}

function GameScreen({ open, error, onExit }: { open: Open; error: string; onExit: () => void }) {
  const { game } = open;
  const version = useSyncExternalStore(game.subscribe, game.getVersion);
  const rootRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(error || 'Saved');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSaved = useRef(version);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (lastSaved.current === game.version) return;
    const v = game.version, data = game.toSave();
    try {
      await putSave({ id: open.id, name: open.name, createdAt: open.createdAt, updatedAt: Date.now(), summary: summarize(data), data });
      lastSaved.current = v;
      setStatus('Saved');
    } catch {
      setStatus('Save failed: browser storage unavailable');
    }
  }, [game, open]);

  // Autosave shortly after every change, and immediately when the tab is hidden or closed.
  useEffect(() => {
    if (version === lastSaved.current) return;
    setStatus('Saving…');
    clearTimeout(timer.current);
    timer.current = setTimeout(save, 700);
  }, [version, save]);
  useEffect(() => {
    const flush = () => { if (document.visibilityState === 'hidden') save(); };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', flush);
    return () => { window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', flush); save(); };
  }, [save]);

  // Escape closes the topmost overlay: confirm dialog, then player, team and list modals.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const s = game.state;
      if (s.dialog) game.setState({ dialog: null });
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
  useLayoutEffect(() => { applyTheme(rootRef.current, dark, game.state.teams[game.state.me]?.colors); rememberTheme(dark ? 'dark' : 'light'); });

  const exportNow = () => exportSave({ id: open.id, name: open.name, createdAt: open.createdAt, updatedAt: Date.now(), summary: '', data: game.toSave() });
  const vm = buildView(game, rootRef, { saveName: open.name, saveStatus: status, onExit: async () => { await save(); onExit(); }, onExport: exportNow });
  return <GMView vm={vm} />;
}
