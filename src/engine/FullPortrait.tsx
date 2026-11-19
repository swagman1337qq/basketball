import { useEffect, useId, useRef, useState } from 'react';
import { FULL_SIZE as W, FULL_SHEETS, fullHead, fullHair, fullBeard, type FullSheet, type FullPortraitSettings } from './fullPortraits';
import { paintFullPixels, type FullPixels } from './fullPortraitPainter';
import { fullPortraitOverlays } from './fullPortraitOverlays';

const images = new Map<FullSheet, Promise<HTMLImageElement>>(),
  frames = new Map<string, Uint8ClampedArray>();
function sheet(name: FullSheet) {
  let p = images.get(name);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve(img);
      img.onerror = () => reject(Error('Portrait artwork unavailable'));
      img.src = FULL_SHEETS[name].url;
    }).catch(error => {
      images.delete(name);
      throw error;
    });
    images.set(name, p);
  }
  return p;
}
async function frame(name: FullSheet, index: number) {
  const key = name + ':' + index,
    old = frames.get(key);
  if (old) {
    frames.delete(key);
    frames.set(key, old);
    return old;
  }
  const image = await sheet(name),
    info = FULL_SHEETS[name],
    c = document.createElement('canvas');
  c.width = c.height = W;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw Error('Canvas unavailable');
  const cw = image.naturalWidth / info.cols,
    ch = image.naturalHeight / info.rows;
  ctx.drawImage(image, (index % info.cols) * cw, Math.floor(index / info.cols) * ch, cw, ch, 0, 0, W, W);
  const data = ctx.getImageData(0, 0, W, W).data;
  if (frames.size >= 24) frames.delete(frames.keys().next().value!);
  frames.set(key, data);
  return data;
}
type Result = ReturnType<typeof paintFullPixels>;
const drawings = new Map<string, Result>();
type Job = {
  key: string;
  config: FullPortraitSettings;
  age: number;
  jersey: [string, string];
  alive: () => boolean;
  done: (r: Result | null) => void;
  fail: (e: unknown) => void;
};
const jobs: Job[] = [];
let busy = false;
function schedule() {
  if (busy || !jobs.length) return;
  busy = true;
  requestAnimationFrame(async () => {
    while (jobs.length && !jobs[0].alive()) jobs.shift()!.done(null);
    const j = jobs.shift();
    if (!j) {
      busy = false;
      return;
    }
    try {
      let value = drawings.get(j.key);
      if (!value) {
        const h = fullHair(j.config.hair),
          b = fullBeard(j.config.facial),
          outfit = ['polo', 'suit', 'blouse', 'tie'].indexOf(j.config.outfit);
        const data = await Promise.all([
          frame('heads', fullHead(j.config.base)!.index),
          h.sheet ? frame(h.sheet, h.index) : null,
          b.sheet ? frame(b.sheet, b.index) : null,
          outfit >= 0 ? frame('clothes', outfit) : null,
        ]);
        if (!j.alive()) {
          j.done(null);
          return;
        }
        const assets: FullPixels = { head: data[0]! };
        if (data[1]) assets.hair = data[1];
        if (data[2]) assets.beard = data[2];
        if (data[3]) assets.clothes = data[3];
        value = paintFullPixels(assets, j.config, j.age, j.jersey);
        if (drawings.size >= 16) drawings.delete(drawings.keys().next().value!);
        drawings.set(j.key, value);
      }
      j.done(j.alive() ? value : null);
    } catch (e) {
      j.fail(e);
    } finally {
      busy = false;
      schedule();
    }
  });
}
export function FullPortraitFallback({ config }: { config: FullPortraitSettings }) {
  const clip = useId().replace(/:/g, ''),
    [failed, setFailed] = useState(false),
    h = fullHair(config.hair),
    b = fullBeard(config.facial),
    outfit = ['polo', 'suit', 'blouse', 'tie'].indexOf(config.outfit);
  const layers: { sheet: FullSheet; index: number }[] = [{ sheet: 'heads', index: fullHead(config.base)!.index }];
  if (outfit >= 0) layers.push({ sheet: 'clothes', index: outfit });
  if (b.sheet) layers.push({ sheet: b.sheet, index: b.index });
  if (h.sheet) layers.push({ sheet: h.sheet, index: h.index });
  if (failed)
    return (
      <span
        role="img"
        aria-label="Portrait artwork unavailable"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', height: '100%', fontSize: 11 }}
      >
        Portrait unavailable
      </span>
    );
  return (
    <svg
      width="100%"
      height="100%"
      viewBox={'0 40 ' + W + ' ' + (W - 40)}
      preserveAspectRatio="xMidYMin slice"
      role="img"
      aria-label="Illustrated portrait"
      style={{ display: 'block' }}
    >
      <defs>
        <clipPath id={clip}>
          <rect width={W} height={W} />
        </clipPath>
      </defs>
      <g clipPath={'url(#' + clip + ')'}>
        {layers.map(({ sheet, index }) => {
          const s = FULL_SHEETS[sheet];
          return (
            <image
              key={sheet}
              href={s.url}
              x={-(index % s.cols) * W}
              y={-Math.floor(index / s.cols) * W}
              width={s.cols * W}
              height={s.rows * W}
              onError={() => setFailed(true)}
            />
          );
        })}
      </g>
    </svg>
  );
}
export function FullPortrait({
  config,
  age = 25,
  jersey = ['#764191', '#f5e9d3'],
  label,
}: {
  config: FullPortraitSettings;
  age?: number;
  jersey?: [string, string];
  label?: { name?: string; num?: string };
}) {
  const canvas = useRef<HTMLCanvasElement>(null),
    [painted, setPainted] = useState(''),
    [frameTop, setFrameTop] = useState(0),
    [error, setError] = useState(false),
    [retry, setRetry] = useState(0);
  const key = JSON.stringify([config, age, jersey]),
    displayKey = key + '|' + (label?.num || '') + '|' + retry;
  useEffect(() => {
    // Keep the last completed frame during edits; never flash the uncoloured
    // source art between slider updates. faceSvg keys this component per person.
    let alive = true;
    setError(false);
    const p = new Promise<Result | null>((resolve, reject) => {
      jobs.push({ key, config, age, jersey, alive: () => alive, done: resolve, fail: reject });
      schedule();
    });
    void p
      .then(result => {
        if (!alive || !result || !canvas.current) return;
        const ctx = canvas.current.getContext('2d');
        if (!ctx) throw Error('Canvas unavailable');
        ctx.putImageData(new ImageData(new Uint8ClampedArray(result.pixels), W, W), 0, 0);
        fullPortraitOverlays(ctx, config, result.warp, age, jersey, label, result.garment, result.skin);
        setFrameTop(result.frameTop);
        setPainted(displayKey);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [displayKey]);
  const ready = painted === displayKey,
    hasFrame = !!painted;
  return (
    <span
      data-portrait-style="illustrated"
      data-portrait-catalogue="full"
      data-portrait-id={config.base}
      data-portrait-painted={ready ? 'true' : 'false'}
      data-portrait-error={error ? 'true' : 'false'}
      data-portrait-crop-top={frameTop}
      style={{ display: 'block', position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}
    >
      <span style={{ display: 'block', width: '100%', height: '100%', visibility: hasFrame ? 'hidden' : 'visible' }}>
        <span
          role="img"
          aria-label={error ? 'Portrait artwork unavailable' : 'Loading illustrated portrait'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            width: '100%',
            height: '100%',
            fontSize: 10,
            background: 'var(--color-neutral-100)',
          }}
        >
          {error ? 'Portrait unavailable' : '…'}
        </span>
      </span>
      <canvas
        ref={canvas}
        width={W}
        height={W}
        role="img"
        aria-label="Edited illustrated portrait"
        style={{
          display: hasFrame ? 'block' : 'none',
          position: 'absolute',
          left: 0,
          top: (-100 * frameTop) / (W - frameTop) + '%',
          width: '100%',
          height: (100 * W) / (W - frameTop) + '%',
          objectFit: 'cover',
          objectPosition: 'center top',
        }}
      />
      {error && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setRetry(n => n + 1)}
          style={{ position: 'absolute', bottom: 2, left: 2, right: 2, fontSize: 10, padding: 2 }}
        >
          Retry portrait
        </button>
      )}
    </span>
  );
}
