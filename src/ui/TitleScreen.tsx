import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Download, Eye, Moon, Play, Plus, Sun, Trash2, Upload } from 'lucide-react';
import { deleteSave, exportSave, importSave, listSaves, type SaveRow } from '../db/saves';
import { TeamLogo } from './TeamLogo';
import { applyTheme, lastTheme, rememberTheme } from './theme';
import { TitleNewLeague, type LeagueStart } from './TitleNewLeague';
import './TitleScreen.css';

const PLAIN = {
  '--color-accent': 'var(--color-text)',
  '--color-accent-100': 'color-mix(in srgb, var(--color-text) 7%, transparent)',
  '--color-accent-700': 'var(--color-text)',
  '--color-accent-800': 'var(--color-text)',
  '--accent-ink': 'var(--color-text)',
  '--team-line': 'var(--color-text)',
};
const PHASE: Record<string, string> = {
  regular: 'Regular season',
  playin: 'Play-in',
  playoffs: 'Playoffs',
  lottery: 'Lottery',
  draft: 'Draft',
  preFA: 'Pre-free agency',
  fa: 'Free agency',
  preseason: 'Preseason',
};

// Read the saved snapshot without loading, migrating or modifying a league just to preview it.
function overview(row: SaveRow) {
  const s = row.data?.state;
  const spectator = !!s?.spectator;
  const team = spectator ? undefined : s?.teams?.[s.me ?? 0] || s?.teams?.[0];
  const year = Number(s?.season);
  const pick = s?.phase === 'draft' ? s.picks?.[s.pi ?? 0] : undefined;
  return {
    team,
    spectator,
    teamName: spectator ? 'Spectator league' : team ? team.region + ' ' + team.name : 'Saved league',
    season: Number.isFinite(year) ? year - 1 + '–' + String(year).slice(2) : 'League',
    phase: pick ? 'Draft · Pick ' + pick.n : PHASE[s?.phase] || s?.phase || 'Saved league',
    managed: s?.managed?.length || (spectator ? 0 : 1),
  };
}
function savedAt(value: number) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : 'Unknown date';
}

export function TitleScreen({
  onOpen,
  onCreate,
}: {
  onOpen: (id: string) => void | Promise<void>;
  onCreate: (name: string, seed: number, tids: number[], start?: LeagueStart) => void | Promise<void>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const deleteRef = useRef<HTMLDialogElement>(null);
  const pending = useRef(false);
  const [saves, setSaves] = useState<SaveRow[] | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [setupMounted, setSetupMounted] = useState(false);
  const [newTeam, setNewTeam] = useState<any>(null);
  const [dark, setDark] = useState(() => lastTheme() === 'dark');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState('');
  const [confirmDel, setConfirmDel] = useState<SaveRow | null>(null);
  const selected = saves?.find(row => row.id === selectedId) || saves?.[0];
  const info = selected ? overview(selected) : null;
  const activeTeam = showNew ? newTeam : info?.team;

  useLayoutEffect(() => {
    const el = rootRef.current;
    applyTheme(el, dark, activeTeam?.colors);
    if (!el) return;
    if (!activeTeam?.colors) Object.entries(PLAIN).forEach(([key, value]) => el.style.setProperty(key, value));
    el.style.setProperty('--title-primary', activeTeam?.colors?.[0] || 'var(--color-text)');
  }, [dark, activeTeam?.colors?.[0], activeTeam?.colors?.[1]]);

  const refresh = useCallback(async (preferredId?: string) => {
    try {
      const rows = await listSaves();
      setSaves(rows);
      setSelectedId(previous => (rows.some(row => row.id === (preferredId || previous)) ? preferredId || previous : rows[0]?.id || ''));
      return true;
    } catch {
      setSaves([]);
      setMessage('This browser blocked local storage, so saves are unavailable.');
      setIsError(true);
      return false;
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (confirmDel && deleteRef.current && !deleteRef.current.open) deleteRef.current.showModal();
  }, [confirmDel]);

  const begin = (action: string) => {
    if (pending.current) return false;
    pending.current = true;
    setBusy(action);
    setMessage('');
    setIsError(false);
    return true;
  };
  const finish = () => {
    pending.current = false;
    setBusy('');
  };
  const reportError = (error: unknown) => {
    setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    setIsError(true);
  };
  const openLeague = async (id: string) => {
    if (!begin(id)) return;
    try {
      await onOpen(id);
    } catch (error) {
      reportError(error);
    } finally {
      finish();
    }
  };
  const createLeague = async (name: string, seed: number, tids: number[], start: LeagueStart) => {
    if (!begin('create')) return;
    try {
      await onCreate(name, seed, tids, start);
    } catch (error) {
      reportError(error);
    } finally {
      finish();
    }
  };
  const onImport = async (file: File | undefined) => {
    if (!file || !begin('import')) return;
    try {
      const row = await importSave(file);
      const refreshed = await refresh(row.id);
      setShowNew(false);
      if (refreshed) setMessage('Imported ' + row.name + '.');
    } catch (error) {
      reportError(error);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
      finish();
    }
  };
  const removeSelected = async () => {
    if (!confirmDel || !begin('delete')) return;
    try {
      await deleteSave(confirmDel.id);
      setConfirmDel(null);
      await refresh();
    } catch (error) {
      reportError(error);
      setConfirmDel(null);
    } finally {
      finish();
    }
  };
  const newLeague = () => {
    setSetupMounted(true);
    setShowNew(true);
    setMessage('');
    setIsError(false);
  };
  const exportSelected = () => {
    if (selected)
      try {
        exportSave(selected);
      } catch (error) {
        reportError(error);
      }
  };

  return (
    <div ref={rootRef} className="title-screen" data-theme={dark ? 'dark' : 'light'}>
      <div className="title-page" data-view={showNew ? 'new' : 'library'}>
        <header className="title-masthead">
          <span className="title-wordmark">Basketball GM</span>
        </header>
        <header className="title-heading">
          <div>
            <div className="title-kicker">{showNew ? 'Build your franchise' : 'Welcome back'}</div>
            <h1>{showNew ? 'New league' : 'Your leagues'}</h1>
            <p className="title-muted">
              {showNew ? 'Choose your world, your team and your starting situation.' : 'Pick up where you left off.'}
            </p>
          </div>
          {showNew ? (
            <button type="button" className="btn btn-secondary" disabled={!!busy} onClick={() => setShowNew(false)}>
              <ArrowLeft size={16} aria-hidden="true" /> Back to leagues
            </button>
          ) : (
            <button type="button" className="btn title-primary" disabled={!!busy} onClick={newLeague}>
              <Plus size={16} aria-hidden="true" /> New league
            </button>
          )}
        </header>
        {message && (
          <p className="title-message" role={isError ? 'alert' : 'status'}>
            {message}
          </p>
        )}
        <div className="title-library" hidden={showNew}>
          <section className="title-save-list" aria-label="Saved leagues">
            {saves === null ? (
              <p className="title-empty" role="status">
                Loading leagues…
              </p>
            ) : saves.length === 0 ? (
              <div className="title-empty">
                <h2>No saved leagues yet</h2>
                <p>Create your first league or import a save.</p>
                <button type="button" className="btn title-primary" disabled={!!busy} onClick={newLeague}>
                  Create a league
                </button>
              </div>
            ) : (
              saves.map(row => {
                const meta = overview(row),
                  isSelected = row.id === selected?.id;
                return (
                  <article key={row.id} className="title-save-row" data-save-id={row.id} data-selected={isSelected}>
                    <button
                      type="button"
                      className="title-select-save"
                      aria-pressed={isSelected}
                      disabled={!!busy}
                      onClick={() => {
                        setSelectedId(row.id);
                        setMessage('');
                        setIsError(false);
                      }}
                    >
                      <span className="title-save-logo" aria-hidden="true">
                        {meta.team ? <TeamLogo team={meta.team} size={42} /> : <Eye size={27} />}
                      </span>
                      <span className="title-save-copy">
                        <strong>{row.name}</strong>
                        <span>
                          {meta.teamName} · {meta.season}
                        </span>
                        <span>
                          {meta.phase} · Saved {savedAt(row.updatedAt)}
                        </span>
                      </span>
                    </button>
                    {isSelected ? (
                      <button
                        type="button"
                        className="btn title-primary title-row-continue"
                        disabled={!!busy}
                        aria-label={'Continue league: ' + row.name}
                        onClick={() => void openLeague(row.id)}
                      >
                        {busy === row.id ? 'Opening…' : 'Continue league'} <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    ) : (
                      <ChevronRight className="title-save-chevron" size={17} aria-hidden="true" />
                    )}
                  </article>
                );
              })
            )}
          </section>
          <aside className="title-resume" aria-label="Selected league">
            {selected && info ? (
              <>
                <div className="title-kicker">Continue your league</div>
                <div className="title-resume-team">
                  {info.team ? <TeamLogo team={info.team} size={58} /> : <Eye size={38} aria-hidden="true" />}
                  <h2>{info.teamName}</h2>
                </div>
                <p className="title-muted title-league-name">{selected.name}</p>
                {info.spectator && <p className="title-spectator-note">Spectator Mode · the AI runs every team.</p>}
                <div className="title-resume-meta">
                  <span>{info.season}</span>
                  <span>{info.phase}</span>
                </div>
                {info.managed > 1 && <p className="title-managed-note">Managing {info.managed} teams · showing your active club.</p>}
                <button
                  type="button"
                  className="btn title-primary title-panel-continue"
                  disabled={!!busy}
                  aria-label={'Continue selected league: ' + selected.name}
                  onClick={() => void openLeague(selected.id)}
                >
                  <Play size={16} aria-hidden="true" /> {busy === selected.id ? 'Opening…' : 'Continue league'}
                </button>
                <p className="title-last-played">Saved {savedAt(selected.updatedAt)}</p>
                <div className="title-save-actions">
                  <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={exportSelected}>
                    <Download size={15} aria-hidden="true" /> Export save
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => setConfirmDel(selected)}>
                    <Trash2 size={15} aria-hidden="true" /> Delete save
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="title-kicker">Your next chapter</div>
                <h2>Build your team.</h2>
                <p className="title-muted">Run a club as general manager and head coach, or watch the league in Spectator Mode.</p>
                <button type="button" className="btn title-primary title-panel-continue" disabled={!!busy} onClick={newLeague}>
                  <Plus size={16} aria-hidden="true" /> New league
                </button>
              </>
            )}
          </aside>
        </div>
        {setupMounted && (
          <div hidden={!showNew}>
            <TitleNewLeague onCreate={createLeague} onTeamChange={setNewTeam} busy={!!busy} />
          </div>
        )}
        <footer className="title-footer">
          <p>Leagues save automatically in this browser. Clearing browser data deletes local saves; export a backup to keep a copy.</p>
          <div className="title-footer-actions">
            <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => fileRef.current?.click()}>
              <Upload size={16} aria-hidden="true" /> {busy === 'import' ? 'Importing…' : 'Import league'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={!!busy}
              onClick={() => {
                rememberTheme(dark ? 'light' : 'dark');
                setDark(!dark);
              }}
            >
              {dark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />} {dark ? 'Light theme' : 'Dark theme'}
            </button>
          </div>
        </footer>
        <input
          ref={fileRef}
          className="title-import-input"
          type="file"
          accept="application/json,.json"
          aria-label="Import league file"
          onChange={event => void onImport(event.target.files?.[0])}
        />
      </div>
      {confirmDel && (
        <dialog
          ref={deleteRef}
          className="dialog title-delete-dialog"
          aria-labelledby="title-delete-heading"
          onCancel={event => {
            if (busy) event.preventDefault();
            else setConfirmDel(null);
          }}
        >
          <h2 className="dialog-title" id="title-delete-heading">
            Delete {confirmDel.name}?
          </h2>
          <div className="dialog-body">This removes the league from this browser. Export it first if you might want it back.</div>
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" disabled={!!busy} autoFocus onClick={() => setConfirmDel(null)}>
              Cancel
            </button>
            <button type="button" className="btn title-primary" disabled={!!busy} onClick={() => void removeSelected()}>
              {busy === 'delete' ? 'Deleting…' : 'Delete league'}
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
