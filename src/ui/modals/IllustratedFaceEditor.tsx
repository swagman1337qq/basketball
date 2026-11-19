import { useState, type CSSProperties } from 'react';
import { IllustratedBase, IllustratedPortrait } from '../../engine/IllustratedPortrait';
import {
  chooseIllustration,
  ILLUSTRATED_CHOICES,
  ILLUSTRATED_HAIR,
  illustratedChoice,
  illustrationDefaults,
  randomIllustratedFeatures,
  type IllustrationSettings,
  type PortraitContext,
} from '../../engine/illustratedPortraits';
import { muted } from '../kit';

const field: CSSProperties = { display: 'grid', gridTemplateColumns: '100px minmax(0,1fr)', gap: 8, alignItems: 'center', fontSize: 12 };
export function IllustratedFaceEditor({
  config,
  face,
  context,
  onChange,
}: {
  config: IllustrationSettings;
  face: any;
  context: PortraitContext;
  onChange: (value: IllustrationSettings) => void;
}) {
  const [group, setGroup] = useState(() =>
    illustratedChoice(config.base)?.editable ? 'editable' : illustratedChoice(config.base)?.role === 'staff' ? 'staff' : 'players',
  );
  const [page, setPage] = useState(0);
  const portrait = illustratedChoice(config.base)!;
  const choices = ILLUSTRATED_CHOICES.filter(p =>
    group === 'editable' ? p.editable : group === 'staff' ? p.role === 'staff' : p.role === 'player' && !p.editable,
  );
  const pages = Math.ceil(choices.length / 12),
    currentPage = Math.min(page, pages - 1);
  const change = (key: keyof IllustrationSettings, value: number) => onChange({ ...config, [key]: value });
  const select = (label: string, key: 'hair' | 'eyes' | 'nose' | 'brows' | 'beard' | 'smile', options: string[]) => (
    <label style={field} key={key}>
      <span>{label}</span>
      <select
        aria-label={label}
        className="input"
        value={config[key]}
        onChange={e => change(key, +e.target.value)}
        style={{ minWidth: 0, fontSize: 12, padding: '5px 6px' }}
      >
        {options.map((s, i) => (
          <option value={i} key={i}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <section aria-label="Illustrated face editor">
      <div style={{ display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ width: 150, height: 180, flex: 'none' }}>
          <IllustratedPortrait config={config} />
        </div>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ fontSize: 18, fontFamily: 'var(--font-heading)', marginBottom: 6 }}>{portrait.label}</div>
          <p style={{ ...muted, fontSize: 12, margin: '0 0 10px' }}>
            Choose a painted portrait, or use the editable face to change its features. Portrait choices leave the person’s background
            unchanged. This art keeps its pictured age and clothing.
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              className="btn btn-secondary"
              onClick={() => {
                const next = illustrationDefaults(
                  chooseIllustration({ ...face, seed: Math.floor(Math.random() * 1e9) }, context, config.base),
                );
                onChange(next);
                setGroup(
                  illustratedChoice(next.base)?.editable
                    ? 'editable'
                    : illustratedChoice(next.base)?.role === 'staff'
                      ? 'staff'
                      : 'players',
                );
                setPage(0);
              }}
            >
              New portrait
            </button>
            {portrait.editable && (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={() => onChange(randomIllustratedFeatures(config, Math.floor(Math.random() * 1e9)))}
                >
                  Randomize features
                </button>
                <button className="btn btn-ghost" onClick={() => onChange(illustrationDefaults(config.base))}>
                  Reset features
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {portrait.editable ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,250px),1fr))',
            gap: '10px 20px',
            margin: '14px 0',
          }}
        >
          {select('Hairstyle', 'hair', ILLUSTRATED_HAIR)}
          {select('Eyes', 'eyes', ['Original', 'Wider lids'])}
          {select('Nose', 'nose', ['Original', 'Broader tip'])}
          {select('Eyebrows', 'brows', ['Original', 'Fuller'])}
          {select('Facial hair', 'beard', ['Clean shaven', 'Stubble'])}
          {select('Expression', 'smile', ['Neutral', 'Slight smile'])}
          {(['jaw', 'spacing', 'mouth'] as const).map((key, i) => (
            <label style={field} key={key}>
              <span>{['Jaw width', 'Eye spacing', 'Mouth width'][i]}</span>
              <input
                aria-label={['Jaw width', 'Eye spacing', 'Mouth width'][i]}
                type="range"
                min={-1}
                max={1}
                step={0.05}
                value={config[key]}
                onChange={e => change(key, +e.target.value)}
                style={{ width: '100%', minWidth: 0 }}
              />
            </label>
          ))}
        </div>
      ) : (
        <p style={{ ...muted, fontSize: 12 }}>
          This finished portrait has fixed features. Choose “Editable face” below for feature controls.
        </p>
      )}
      <div role="group" aria-label="Portrait collections" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '14px 0 10px' }}>
        {(
          [
            ['editable', 'Editable face (1)'],
            ['players', 'Players (24)'],
            ['staff', 'Staff (32)'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            className={'btn ' + (group === id ? 'btn-primary' : 'btn-secondary')}
            aria-pressed={group === id}
            onClick={() => {
              setGroup(id);
              setPage(0);
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(76px,1fr))', gap: 8 }}>
        {choices.slice(currentPage * 12, currentPage * 12 + 12).map(p => (
          <button
            key={p.id}
            type="button"
            className="btn btn-ghost"
            aria-label={'Choose ' + p.label}
            aria-pressed={config.base === p.id}
            onClick={() => onChange(illustrationDefaults(p.id))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: 4,
              border: config.base === p.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              minWidth: 0,
            }}
          >
            <span style={{ display: 'block', width: '100%', height: 96 }}>
              <IllustratedBase portrait={p} />
            </span>
            <span style={{ display: 'block', fontSize: 11, whiteSpace: 'normal', marginTop: 4 }}>{p.label}</span>
          </button>
        ))}
      </div>
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
          <button
            className="btn btn-secondary"
            aria-label="Previous portraits"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
          >
            ←
          </button>
          <span style={{ fontSize: 12 }}>
            {currentPage + 1} / {pages}
          </span>
          <button
            className="btn btn-secondary"
            aria-label="Next portraits"
            disabled={currentPage === pages - 1}
            onClick={() => setPage(currentPage + 1)}
          >
            →
          </button>
        </div>
      )}
    </section>
  );
}
