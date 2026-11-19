// Select complete finished artwork without changing its features or proportions.
import { useEffect, useRef, useState } from 'react';
import {
  PORTRAITS,
  anotherPortrait,
  clearPortrait,
  portraitEditSnapshot,
  restorePortraitEdit,
  portraitElement,
  portraitForFace,
  selectPortrait,
  type PortraitContext,
} from '../../engine/portraitCatalog';
import { processImage } from '../upload';
import { muted } from '../kit';

export function FaceEditor({ gm, p, onClose, context = 'player' }: { gm: any; p: any; onClose: () => void; context?: PortraitContext }) {
  const [orig] = useState(() => portraitEditSnapshot(p));
  const f = gm.face(p.id),
    current = portraitForFace(f, context);
  const [collection, setCollection] = useState(context === 'staff' ? 'staff' : 'approved'),
    [gender, setGender] = useState(f.fem ? 'woman' : 'man');
  const [page, setPage] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const redraw = () => {
    gm.resetFace(p.id);
    gm.setState((s: any) => ({ gv: (s.gv || 0) + 1 }));
  };
  const choose = (id: string) => {
    if (selectPortrait(p, id)) {
      setError('');
      redraw();
    }
  };
  const cancel = () => {
    alive.current = false;
    restorePortraitEdit(p, orig);
    redraw();
    onClose();
  };
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const url = await processImage(file, 320, 400, 'image/jpeg');
      if (alive.current) {
        p.faceImg = url;
        redraw();
      }
    } catch (e: any) {
      if (alive.current) setError(e.message || 'Unable to open this image.');
    } finally {
      if (alive.current) setBusy(false);
    }
  };
  const filtered = PORTRAITS.filter(
    x =>
      (gender === 'all' || x.gender === gender) &&
      (collection === 'all' || (collection === 'approved' ? x.sheet === 'approved' : x.role === collection)),
  );
  const size = 16,
    lastPage = Math.max(0, Math.ceil(filtered.length / size) - 1),
    shownPage = Math.min(page, lastPage),
    visible = filtered.slice(shownPage * size, (shownPage + 1) * size);
  return (
    <section style={{ border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: 12, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: 152, flex: 'none' }}>
          <div
            className="gm-face"
            style={{
              width: 152,
              height: 180,
              overflow: 'hidden',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-neutral-100)',
            }}
          >
            {p.faceImg ? (
              <img
                src={p.faceImg}
                alt="Selected portrait"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              gm.faceEl(p.id, -1)
            )}
          </div>
          <div style={{ ...muted, fontSize: 11, marginTop: 5 }}>{p.faceImg ? 'Custom upload' : current.label}</div>
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 20, marginBottom: 8 }}>Choose portrait</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" disabled={busy} onClick={() => choose(anotherPortrait(f, context, current.id).id)}>
              🎲 New portrait
            </button>
            <label className="btn btn-secondary" style={{ cursor: busy ? 'wait' : 'pointer', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Opening image…' : 'Upload JPG/PNG'}
              <input
                type="file"
                accept="image/png,image/jpeg"
                disabled={busy}
                style={{ display: 'none' }}
                onChange={e => {
                  void upload(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
            <button
              className="btn btn-ghost"
              disabled={busy || (!p.faceImg && !f.portrait?.id)}
              onClick={() => {
                clearPortrait(p);
                setError('');
                redraw();
              }}
            >
              Use automatic portrait
            </button>
          </div>
          <p style={{ ...muted, fontSize: 12, margin: '10px 0' }}>
            Your portrait stays selected until you choose another. Portrait choices do not change the person’s biography.
          </p>
          {error && (
            <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 12 }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={cancel}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={busy}
              onClick={() => {
                alive.current = false;
                onClose();
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', margin: '14px 0 10px' }}>
        <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          Collection
          <select
            className="input"
            value={collection}
            onChange={e => {
              setCollection(e.target.value);
              setPage(0);
            }}
          >
            <option value="approved">Approved portraits</option>
            <option value="player">Players</option>
            <option value="staff">Staff</option>
            <option value="all">All portraits</option>
          </select>
        </label>
        <label style={{ fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
          Portraits
          <select
            className="input"
            value={gender}
            onChange={e => {
              setGender(e.target.value);
              setPage(0);
              if (collection === 'approved' && e.target.value === 'woman') setCollection('staff');
            }}
          >
            <option value="man">Men</option>
            <option value="woman">Women</option>
            <option value="all">All</option>
          </select>
        </label>
        <span style={{ flex: 1 }} />
        <button
          className="btn btn-secondary"
          aria-label="Previous portrait page"
          disabled={shownPage === 0}
          onClick={() => setPage(shownPage - 1)}
        >
          ‹
        </button>
        <span style={{ ...muted, fontSize: 12 }}>
          {filtered.length
            ? `${shownPage * size + 1}–${Math.min(filtered.length, (shownPage + 1) * size)} of ${filtered.length}`
            : '0 portraits'}
        </span>
        <button
          className="btn btn-secondary"
          aria-label="Next portrait page"
          disabled={shownPage === lastPage}
          onClick={() => setPage(shownPage + 1)}
        >
          ›
        </button>
      </div>
      {visible.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: 8 }}>
          {visible.map(portrait => {
            const selected = !p.faceImg && portrait.id === current.id;
            return (
              <button
                key={portrait.id}
                type="button"
                aria-label={'Choose ' + portrait.label}
                aria-pressed={selected}
                disabled={busy}
                onClick={() => choose(portrait.id)}
                style={{
                  padding: 4,
                  border: `2px solid ${selected ? 'var(--color-accent-700)' : 'var(--color-divider)'}`,
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <div style={{ height: 132, overflow: 'hidden' }}>{portraitElement(portrait)}</div>
                <div style={{ fontSize: 10, marginTop: 4 }}>
                  {selected ? '✓ ' : ''}
                  {portrait.label}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <p style={{ ...muted, fontSize: 12 }}>No portraits in this collection. Choose another collection or show all portraits.</p>
      )}
    </section>
  );
}
