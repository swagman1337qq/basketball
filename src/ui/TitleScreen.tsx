import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { deleteSave, exportSave, importSave, listSaves, type SaveRow } from '../db/saves';
import { applyTheme, lastTheme } from './theme';

const kicker = { fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)' } as const;

export function TitleScreen({ onOpen, onCreate }: { onOpen: (id: string) => void; onCreate: (name: string, seed: number) => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saves, setSaves] = useState<SaveRow[] | null>(null);
  const [name, setName] = useState('My league');
  const [seed, setSeed] = useState('2027');
  const [msg, setMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState<SaveRow | null>(null);

  useLayoutEffect(() => applyTheme(rootRef.current, lastTheme() === 'dark'), []);
  const refresh = () => listSaves().then(setSaves).catch(() => { setSaves([]); setMsg('This browser blocked local storage, so saves are unavailable.'); });
  useEffect(() => { refresh(); }, []);

  const create = () => {
    const n = Number(seed);
    onCreate(name.trim() || 'My league', Number.isFinite(n) ? Math.floor(n) : 2027);
  };
  const onImport = async (f: File | undefined) => {
    if (!f) return;
    try { const row = await importSave(f); setMsg('Imported ' + row.name + '.'); refresh(); } catch (e) { setMsg((e as Error).message); }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div ref={rootRef} style={{ minHeight: '100%', background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontSize: '13px', lineHeight: 1.45, fontVariantNumeric: 'tabular-nums' }}>
      <div style={{ maxWidth: '980px', margin: '0 auto', padding: '48px 28px 64px' }}>
        <header style={{ borderBottom: '1px solid var(--color-text)', paddingBottom: '14px', marginBottom: '28px' }}>
          <div style={kicker}>Basketball general manager · single player</div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 400, fontSize: '56px', lineHeight: 1, margin: '6px 0 0', letterSpacing: '-.015em' }}>Front Office</h1>
          <p style={{ margin: '10px 0 0', color: 'var(--color-neutral-700)', maxWidth: '640px' }}>
            Run the Baltimore Tides as general manager and head coach: set the rotation, trade, sign, draft and develop players across as many seasons as you like.
            Leagues are saved in this browser automatically.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: '36px', alignItems: 'start' }}>
          <section>
            <h4 style={{ margin: '0 0 4px', fontSize: '19px' }}>Your leagues</h4>
            {saves === null ? (
              <p style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic' }}>Loading…</p>
            ) : saves.length === 0 ? (
              <p style={{ color: 'var(--color-neutral-700)', fontStyle: 'italic', padding: '8px 0' }}>No saved leagues yet. Start one on the right.</p>
            ) : (
              <table className="table" style={{ fontSize: '13px' }}>
                <tbody>
                  {saves.map(s => (
                    <tr key={s.id}>
                      <td style={{ padding: '8px' }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 600, lineHeight: 1.15 }}>{s.name}</div>
                        <div style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{s.summary} · saved {new Date(s.updatedAt).toLocaleString()}</div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button className="btn btn-primary" onClick={() => onOpen(s.id)} style={{ fontSize: '13px', padding: '5px 14px' }}>Continue</button>
                        <button className="btn btn-ghost" onClick={() => exportSave(s)} style={{ fontSize: '12px', marginLeft: '6px' }}>Export</button>
                        <button className="btn btn-ghost" onClick={() => setConfirmDel(s)} style={{ fontSize: '12px' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '14px' }}>
              <button className="btn btn-secondary" onClick={() => fileRef.current?.click()} style={{ fontSize: '13px' }}>Import a save file</button>
              <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => onImport(e.target.files?.[0])} />
              <span style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>Export regularly: clearing browser data deletes local saves.</span>
            </div>
            {msg && <p style={{ margin: '10px 0 0', color: 'var(--color-accent-800)' }}>{msg}</p>}
          </section>

          <section className="card" style={{ padding: '16px', gap: '12px' }}>
            <div className="card-kicker" style={{ color: 'var(--color-accent-700)' }}>New league</div>
            <div className="field">
              <label htmlFor="league-name">League name</label>
              <input id="league-name" className="input" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
            </div>
            <div className="field">
              <label htmlFor="league-seed">World seed</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input id="league-seed" className="input" inputMode="numeric" value={seed} onChange={e => setSeed(e.target.value.replace(/[^\d]/g, ''))} />
                <button className="btn btn-ghost" onClick={() => setSeed(String(Math.floor(Math.random() * 1e6)))} style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Random</button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)', marginTop: '4px' }}>The same seed always builds the same players, teams and draft classes. 2027 is the reference world.</div>
            </div>
            <button className="btn btn-primary" onClick={create} style={{ width: '100%' }}>Start as GM of the Baltimore Tides</button>
          </section>
        </div>
      </div>

      {confirmDel && (
        <div onClick={() => setConfirmDel(null)} style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 45%, transparent)', zIndex: 20 }}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-title">Delete {confirmDel.name}?</div>
            <div className="dialog-body">This removes the league from this browser. Export it first if you might want it back.</div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setConfirmDel(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={async () => { await deleteSave(confirmDel.id); setConfirmDel(null); refresh(); }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
