import { useState, type CSSProperties } from 'react';
import { FullPortrait, FullPortraitFallback } from '../../engine/FullPortrait';
import {
  FULL_HEADS,
  FULL_OPTIONS,
  fullDefaults,
  newFullPortrait,
  randomFullFeatures,
  type FullChoiceKey,
  type FullNumberKey,
  type FullPortraitSettings,
} from '../../engine/fullPortraits';
import { muted } from '../kit';
const row: CSSProperties = { display: 'grid', gridTemplateColumns: '114px minmax(0,1fr)', alignItems: 'center', gap: 8, fontSize: 12 };
const grid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,265px),1fr))',
  gap: '12px 24px',
  margin: '14px 0',
};
export function FullFaceEditor({
  config,
  face,
  context,
  onChange,
  onLegacy,
}: {
  config: FullPortraitSettings;
  face: any;
  context: 'player' | 'staff';
  onChange: (p: FullPortraitSettings) => void;
  onLegacy: () => void;
}) {
  const [tab, setTab] = useState('face'),
    [heads, setHeads] = useState(false);
  const set = (key: string, value: string | number | boolean) => {
    const extra =
      key === 'grey'
        ? { greyManual: true }
        : key === 'recede'
          ? { recedeManual: true }
          : key === 'beardGrey'
            ? { beardGreyManual: true }
            : {};
    onChange({ ...config, [key]: value, ...extra });
  };
  const select = (label: string, key: FullChoiceKey) => (
    <label style={row} key={key}>
      <span>{label}</span>
      <select
        aria-label={label}
        className="input"
        value={config[key]}
        onChange={e => set(key, e.target.value)}
        style={{ minWidth: 0, fontSize: 12, padding: '5px 28px 5px 7px' }}
      >
        {FULL_OPTIONS[key].map(([id, text]) => (
          <option value={id} key={id}>
            {text}
          </option>
        ))}
      </select>
    </label>
  );
  const range = (label: string, key: FullNumberKey, lo = -1, hi = 1) => (
    <label style={row} key={key}>
      <span>{label}</span>
      <input
        aria-label={label}
        type="range"
        min={lo}
        max={hi}
        step={0.05}
        value={config[key]}
        onChange={e => set(key, +e.target.value)}
        style={{ width: '100%', minWidth: 0 }}
      />
    </label>
  );
  const flag = (label: string, key: 'cleft' | 'mole' | 'browRing' | 'ageAuto') => (
    <label style={{ ...row, gridTemplateColumns: 'auto 1fr' }} key={key}>
      <input type="checkbox" checked={config[key]} onChange={e => set(key, e.target.checked)} />
      <span>{label}</span>
    </label>
  );
  return (
    <section aria-label="Full illustrated face editor">
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ width: 150, height: 200, flex: 'none', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
          <FullPortrait config={config} age={face.age?.years ?? 25} />
        </div>
        <div style={{ flex: '1 1 240px', minWidth: 0 }}>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>Editable illustrated portrait</div>
          <p style={{ ...muted, fontSize: 12, margin: '0 0 10px' }}>
            16 painted heads, 45 hairstyles and 17 facial-hair choices. Edit each feature below. Head and hairstyle choices are open to
            everyone. Random choices follow the person’s in-game appearance; their name, background and gender stay unchanged.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              className="btn btn-secondary"
              onClick={() => onChange(newFullPortrait(face, Math.floor(Math.random() * 1e9), context, config.base))}
            >
              New portrait
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => onChange(randomFullFeatures(config, Math.floor(Math.random() * 1e9), face))}
            >
              Shuffle features
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => {
                const fresh = newFullPortrait(face, config.seed, context);
                onChange({
                  ...fullDefaults(config.base),
                  hair: fresh.hair,
                  texture: fresh.texture,
                  facial: fresh.facial,
                  natural: fresh.natural,
                  outfit: config.outfit,
                  seed: config.seed,
                });
              }}
            >
              Reset edits
            </button>
            <button className="btn btn-ghost" onClick={onLegacy}>
              Previous portrait library
            </button>
          </div>
        </div>
      </div>
      <div role="group" aria-label="Face feature groups" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, margin: '14px 0' }}>
        {[
          ['face', 'Face'],
          ['hair', 'Hair'],
          ['facial', 'Facial hair'],
          ['skin', 'Skin and marks'],
          ['accessories', 'Accessories'],
          ['clothing', 'Clothing'],
        ].map(([id, name]) => (
          <button
            key={id}
            className={'btn ' + (tab === id ? 'btn-primary' : 'btn-secondary')}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
      </div>
      {tab === 'face' && (
        <>
          <button className="btn btn-secondary" aria-expanded={heads} onClick={() => setHeads(!heads)}>
            {heads ? '▴ Hide head choices' : '▾ Choose head'}
          </button>
          {heads && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(72px,1fr))', gap: 8, marginTop: 12 }}>
              {FULL_HEADS.map(h => (
                <button
                  type="button"
                  key={h.id}
                  className="btn btn-ghost"
                  aria-label={'Choose ' + h.label}
                  aria-pressed={config.base === h.id}
                  onClick={() => onChange({ ...config, base: h.id })}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: 3,
                    minWidth: 0,
                    border: config.base === h.id ? '2px solid var(--color-accent)' : '2px solid transparent',
                  }}
                >
                  <span style={{ display: 'block', width: '100%', height: 96 }}>
                    <FullPortraitFallback config={{ ...config, base: h.id }} />
                  </span>
                  <span style={{ fontSize: 11, marginTop: 4 }}>{h.label}</span>
                </button>
              ))}
            </div>
          )}
          <div style={grid}>
            {range('Head width', 'headWidth')}
            {range('Head length', 'headLength')}
            {range('Cheekbones', 'cheek')}
            {range('Jaw width', 'jaw')}
            {range('Chin width', 'chinWidth')}
            {range('Chin length', 'chinLength')}
            {flag('Cleft chin', 'cleft')}
            {select('Expression', 'expr')}
            {select('Eye shape', 'eyes')}
            {select('Eye color', 'eyeColor')}
            {range('Eye size', 'eyeSize')}
            {range('Eye spacing', 'spacing')}
            {range('Eye tilt', 'tilt')}
            {select('Eyebrows', 'brows')}
            {range('Brow weight', 'browWeight')}
            <label style={row}>
              <span>Brow slit</span>
              <select aria-label="Brow slit" className="input" value={config.browSlit} onChange={e => set('browSlit', +e.target.value)}>
                <option value={0}>None</option>
                <option value={1}>One line</option>
                <option value={2}>Two lines</option>
              </select>
            </label>
            {range('Nose width', 'noseWidth')}
            {range('Nose length', 'noseLength')}
            {range('Nose bridge', 'noseBridge')}
            {range('Nose tip', 'noseTip')}
            {range('Mouth width', 'mouthWidth')}
            {range('Upper lip', 'upperLip')}
            {range('Lower lip', 'lowerLip')}
            {range('Ear size', 'earSize')}
            {range('Ears out', 'earsOut')}
            {range('Build', 'build')}
          </div>
        </>
      )}
      {tab === 'hair' && (
        <div style={grid}>
          {select('Hairstyle', 'hair')}
          {select('Texture', 'texture')}
          {select('Hair color', 'natural')}
          {select('Dyed', 'dye')}
          {config.dye !== 'none' && select('Dye pattern', 'dyeKind')}
          {select('Hairline', 'hairline')}
          {range('Hair length', 'hairLength')}
          {range('Sideburns', 'sideburns')}
          {range('Receding', 'recede', 0, 1)}
          {range('Grey', 'grey', 0, 1)}
          <label style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
            <input type="checkbox" checked={!config.greyManual} onChange={e => set('greyManual', !e.target.checked)} />
            <span>Automatic greying</span>
          </label>
          <label style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
            <input type="checkbox" checked={!config.recedeManual} onChange={e => set('recedeManual', !e.target.checked)} />
            <span>Automatic recession</span>
          </label>
        </div>
      )}
      {tab === 'facial' && (
        <div style={grid}>
          {select('Facial-hair style', 'facial')}
          {range('Beard thickness', 'beardDensity', 0.15, 1)}
          {range('Beard grey', 'beardGrey', 0, 1)}
          <label style={{ ...row, gridTemplateColumns: 'auto 1fr' }}>
            <input type="checkbox" checked={!config.beardGreyManual} onChange={e => set('beardGreyManual', !e.target.checked)} />
            <span>Automatic beard greying</span>
          </label>
        </div>
      )}
      {tab === 'skin' && (
        <div style={grid}>
          {range('Skin tone', 'skinTone')}
          {select('Undertone', 'under')}
          {range('Extra freckles', 'freckles', 0, 1)}
          {flag('Mole', 'mole')}
          {select('Neck tattoo', 'tattoo')}
          {flag('Follow age', 'ageAuto')}
        </div>
      )}
      {tab === 'accessories' && (
        <div style={grid}>
          {select('Headband', 'headband')}
          {config.headband !== 'none' && select('Headband type', 'bandKind')}
          {select('Earrings', 'earrings')}
          {select('Metal', 'metal')}
          {select('Nose piercing', 'noseRing')}
          {select('Lip piercing', 'lipRing')}
          {flag('Eyebrow ring', 'browRing')}
          {select('Glasses', 'glasses')}
          {config.glasses !== 'none' && select('Frames', 'frame')}
          {select('Face shield', 'shield')}
        </div>
      )}
      {tab === 'clothing' && (
        <div style={grid}>
          {select('Clothing', 'outfit')}
          {config.outfit === 'jersey' && select('Undershirt', 'undershirt')}
        </div>
      )}
    </section>
  );
}
