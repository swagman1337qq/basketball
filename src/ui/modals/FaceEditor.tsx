// The face editor, in normal mode and God Mode: a new random face, or any part of the face changed by
// hand. Changes are stored on the player as p.faceX ({ 'hair.style': 'afro', ... }) and laid over his
// generated face, so everything else about him (age, family resemblance) keeps working.
import { useState } from 'react';
import type { CSSProperties } from 'react';
import { DYES, DYE_KINDS, EYE_COLORS, FACE_OPTS, HAIR_COLORS, hairStyleOpts } from '../../engine/faces';
import { muted } from '../kit';

type Opt = string[];
const box: CSSProperties = { border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '10px 12px', margin: '0 0 14px' };
const fs: CSSProperties = { border: 'none', margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' };
const lg: CSSProperties = { fontSize: '11px', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px', ...muted };
const row: CSSProperties = { display: 'grid', gridTemplateColumns: '82px minmax(0,1fr)', alignItems: 'center', gap: '6px', fontSize: '12px' };
const named = (o: Record<string, [string, string]>): Opt[] => Object.keys(o).map(k => [k, o[k][0]]);
const TEXTURES = [['straight', 'Straight'], ['wavy', 'Wavy'], ['curly', 'Curly'], ['coily', 'Coily']];

export function FaceEditor({ gm, p, onClose }: { gm: any; p: any; onClose: () => void }) {
  const [orig] = useState(() => ({ faceSeed: p.faceSeed, faceX: p.faceX ? { ...p.faceX } : undefined, faceImg: p.faceImg }));
  const f = gm.face(p.id);
  const redraw = () => { gm.resetFace(p.id); gm.setState((st: any) => ({ gv: (st.gv || 0) + 1 })); };
  const set = (path: string, v: any) => { p.faceX = { ...(p.faceX || {}), [path]: v }; delete p.faceImg; redraw(); };
  const setMany = (o: Record<string, any>) => { p.faceX = { ...(p.faceX || {}), ...o }; delete p.faceImg; redraw(); };
  const newFace = () => { p.faceSeed = Math.floor(Math.random() * 1e9); delete p.faceX; delete p.faceImg; redraw(); };
  const undoEdits = () => { delete p.faceX; redraw(); };
  const cancel = () => { (['faceSeed', 'faceX', 'faceImg'] as const).forEach(k => (orig[k] === undefined ? delete p[k] : (p[k] = orig[k]))); redraw(); onClose(); };
  const get = (path: string) => path.split('.').reduce((o: any, k) => (o == null ? o : o[k]), f);
  // Plain functions that return elements (not components), so a slider being dragged isn't remounted.
  const sel = (label: string, value: any, opts: Opt[], on: (v: string) => void, none?: string) => (
    <label key={label} style={row}><span>{label}</span>
      <select className="input" value={value == null ? '' : String(value)} onChange={e => on(e.target.value)} style={{ fontSize: '12px', padding: '3px 6px', minWidth: 0 }}>
        {none != null && <option value="">{none}</option>}
        {opts.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select></label>);
  const pick = (label: string, path: string, opts: Opt[], none?: string) => sel(label, get(path), opts, v => set(path, v === '' ? null : v), none);
  const range = (label: string, path: string, lo: number, hi: number) => { const v = Number(get(path) ?? lo);
    return (<label key={label} style={row}><span>{label}</span><input type="range" min={lo} max={hi} step={(hi - lo) / 100} value={v} onChange={e => set(path, +(+e.target.value).toFixed(3))} style={{ width: '100%' }} /></label>); };
  const check = (label: string, value: boolean, on: (v: boolean) => void) => (<label key={label} style={{ ...row, gridTemplateColumns: 'auto 1fr' }}><input type="checkbox" checked={!!value} onChange={e => on(e.target.checked)} /><span>{label}</span></label>);
  const A = f.acc || {}, M = f.marks || {};
  const er = A.earrings, erV = er ? er.kind + (er.both ? '2' : '1') : '';
  return (
    <div style={box}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '10px' }}>
        <div className="gm-face" style={{ width: 84, height: 112, overflow: 'hidden', flex: 'none', borderRadius: 'var(--radius-sm)', background: 'var(--color-neutral-100)' }}>{gm.faceEl(p.id, -1)}</div>
        <div style={{ flex: '1 1 260px', minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', marginBottom: '4px' }}>Edit face</div>
          <p style={{ ...muted, fontSize: '12px', margin: '0 0 8px' }}>Every change shows right away. A new face rolls everything again; Undo my changes goes back to the generated face. He still ages: hair greys and recedes with the years unless you set them here.</p>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={newFace}>🎲 New face</button>
            <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={undoEdits} disabled={!p.faceX}>Undo my changes</button>
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '14px 18px' }}>
        <fieldset style={fs}><div style={lg}>Expression and skin</div>
          {pick('Expression', 'expr', FACE_OPTS.expr)}
          {range('Skin tone', 'skin.tone', 0, 1)}
          {pick('Undertone', 'skin.under', FACE_OPTS.under)}
          {range('Build', 'build', -1, 1)}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Head</div>
          {range('Width', 'head.w', 0.86, 1.14)}
          {range('Length', 'head.h', 0.92, 1.1)}
          {range('Cheekbones', 'head.cheek', 0.94, 1.06)}
          {range('Jaw', 'head.jaw', 0.7, 1)}
          {range('Chin width', 'head.chinW', 0.2, 0.56)}
          {range('Chin length', 'head.chin', 0, 1)}
          {check('Cleft chin', get('head.cleft'), v => set('head.cleft', v))}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Eyes and brows</div>
          {pick('Eye shape', 'eyes.shape', FACE_OPTS.eyes)}
          {pick('Eye color', 'eyes.color', named(EYE_COLORS))}
          {range('Eye size', 'eyes.size', 0.86, 1.14)}
          {range('Spacing', 'eyes.spacing', 0.9, 1.1)}
          {range('Tilt', 'eyes.tilt', -0.14, 0.2)}
          {pick('Brows', 'brows.shape', FACE_OPTS.brows)}
          {range('Brow weight', 'brows.thick', 0.7, 2.1)}
          {sel('Brow slit', get('brows.slit') || 0, [['0', 'None'], ['1', 'One line'], ['2', 'Two lines']], v => set('brows.slit', +v))}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Nose, mouth and ears</div>
          {range('Nose width', 'nose.w', 0, 1)}
          {range('Nose length', 'nose.len', 0, 1)}
          {range('Bridge', 'nose.bridge', 0, 1)}
          {range('Nose tip', 'nose.tip', 0, 1)}
          {range('Mouth width', 'mouth.w', 0, 1)}
          {range('Upper lip', 'mouth.upper', 0, 1)}
          {range('Lower lip', 'mouth.lower', 0, 1)}
          {range('Ear size', 'ears.size', 0.82, 1.18)}
          {range('Ears out', 'ears.out', 0, 1)}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Hair</div>
          {pick('Style', 'hair.style', hairStyleOpts())}
          {pick('Texture', 'hair.tex', TEXTURES)}
          {pick('Color', 'hair.natural', named(HAIR_COLORS))}
          {sel('Dyed', get('hair.dye'), named(DYES), v => (v ? setMany({ 'hair.dye': v, 'hair.dyeKind': get('hair.dyeKind') || 'full' }) : setMany({ 'hair.dye': null, 'hair.dyeKind': null })), 'Not dyed')}
          {get('hair.dye') && sel('Dye', get('hair.dyeKind') || 'full', DYE_KINDS, v => set('hair.dyeKind', v))}
          {pick('Hairline', 'hair.hairline', FACE_OPTS.hairline)}
          {range('Receding', 'hair.recede', 0, 1)}
          {range('Grey', 'hair.grey', 0, 0.9)}
          {range('Length', 'hair.len', 0, 1)}
          {range('Sideburns', 'hair.sb', 0, 1)}
          {sel('Part', get('hair.part') || 1, [['-1', 'Left'], ['1', 'Right']], v => set('hair.part', +v))}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Facial hair</div>
          {pick('Style', 'facial.style', FACE_OPTS.facial)}
          {range('Thickness', 'facial.density', 0.4, 1)}
          {range('Grey', 'facial.grey', 0, 0.9)}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Accessories</div>
          {sel('Headband', A.headband?.color, FACE_OPTS.headband, v => set('acc.headband', v ? { color: v, kind: A.headband?.kind || 'standard' } : null), 'None')}
          {A.headband && sel('Band', A.headband.kind || 'standard', FACE_OPTS.headbandKind, v => set('acc.headband', { ...A.headband, kind: v }))}
          {sel('Earrings', erV, [['stud1', 'One stud'], ['stud2', 'Studs'], ['hoop1', 'One hoop'], ['hoop2', 'Hoops']], v => set('acc.earrings', v ? { kind: v.slice(0, -1), both: v.endsWith('2'), metal: er?.metal || 'diamond' } : null), 'None')}
          {er && sel('Earring', er.metal, FACE_OPTS.metal, v => set('acc.earrings', { ...er, metal: v }))}
          {sel('Nose', A.nose?.kind, [['stud', 'Stud'], ['ring', 'Ring'], ['septum', 'Septum ring']], v => set('acc.nose', v ? { kind: v, metal: A.nose?.metal || 'silver', side: A.nose?.side || 1 } : null), 'None')}
          {sel('Lip', A.lip?.kind, [['ring', 'Ring'], ['labret', 'Stud']], v => set('acc.lip', v ? { kind: v, metal: A.lip?.metal || 'silver', side: A.lip?.side || 1 } : null), 'None')}
          {check('Eyebrow ring', !!A.brow, v => set('acc.brow', v ? { metal: 'silver', side: 1 } : null))}
          {sel('Glasses', A.glasses?.kind, FACE_OPTS.glasses, v => setMany({ 'acc.glasses': v ? { kind: v, color: A.glasses?.color || 'black' } : null, ...(v ? { 'acc.shield': null } : {}) }), 'None')}
          {A.glasses && sel('Frames', A.glasses.color, FACE_OPTS.frame, v => set('acc.glasses', { ...A.glasses, color: v }))}
          {sel('Face shield', A.shield?.kind, [['clear', 'Clear'], ['black', 'Black']], v => setMany({ 'acc.shield': v ? { kind: v } : null, ...(v ? { 'acc.glasses': null } : {}) }), 'None')}
          {sel('Undershirt', A.undershirt, FACE_OPTS.undershirt, v => set('acc.undershirt', v || null), 'None')}
        </fieldset>
        <fieldset style={fs}><div style={lg}>Marks</div>
          {range('Freckles', 'marks.freckles', 0, 1)}
          {check('Mole', !!M.mole, v => set('marks.mole', v ? [+(Math.random() * 2 - 1).toFixed(2), +Math.random().toFixed(2)] : null))}
          {sel('Neck tattoo', M.tattoo?.kind, [['script', 'Script'], ['design', 'Star']], v => set('marks.tattoo', v ? { kind: v, side: M.tattoo?.side || 1 } : null), 'None')}
          {check('Dimples (when he smiles)', !!M.dimples, v => set('marks.dimples', v))}
        </fieldset>
      </div>
    </div>
  );
}
