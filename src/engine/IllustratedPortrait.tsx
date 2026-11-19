import { useEffect, useId, useRef, useState } from 'react';
import {
  createIllustrationPainter,
  illustratedChoice,
  PORTRAIT_SIZE,
  readIllustration,
  type IllustrationSettings,
  type IllustratedChoice,
  type AnyIllustration,
} from './illustratedPortraits';
import { FullPortrait } from './FullPortrait';

export function IllustratedBase({ portrait }: { portrait: IllustratedChoice }) {
  const [failed, setFailed] = useState(false);
  const clip = useId().replace(/:/g, '');
  useEffect(() => setFailed(false), [portrait.url]);
  const [x, y, width, height] = portrait.crop;
  if (failed)
    return (
      <span
        role="img"
        aria-label="Portrait artwork unavailable"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          background: 'var(--color-neutral-100)',
          color: 'var(--color-text)',
          fontSize: 11,
        }}
      >
        Portrait unavailable
      </span>
    );
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={portrait.crop.join(' ')}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMin slice"
      style={{ display: 'block' }}
      role="img"
      aria-label={portrait.label}
    >
      <defs>
        <clipPath id={clip} clipPathUnits="userSpaceOnUse">
          <rect x={x} y={y} width={width} height={height} />
        </clipPath>
      </defs>
      <image
        href={portrait.url}
        width={portrait.width}
        height={portrait.height}
        clipPath={'url(#' + clip + ')'}
        onError={() => setFailed(true)}
      />
    </svg>
  );
}
let painterPromise: Promise<ReturnType<typeof createIllustrationPainter>> | null = null;
function painter() {
  if (!painterPromise)
    painterPromise = new Promise<ReturnType<typeof createIllustrationPainter>>((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        try {
          const size = PORTRAIT_SIZE,
            canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) throw Error('Canvas unavailable');
          const frames: Uint8ClampedArray[] = [],
            cw = image.naturalWidth / 4,
            ch = image.naturalHeight / 3;
          for (let j = 0; j < 11; j++) {
            ctx.clearRect(0, 0, size, size);
            ctx.drawImage(image, (j % 4) * cw, Math.floor(j / 4) * ch, cw, ch, 0, 0, size, size);
            frames.push(ctx.getImageData(0, 0, size, size).data);
          }
          resolve(createIllustrationPainter(frames));
        } catch (error) {
          reject(error);
        }
      };
      image.onerror = () => reject(Error('Portrait artwork unavailable'));
      image.src = illustratedChoice('editable-01')!.url;
    }).catch(error => {
      painterPromise = null;
      throw error;
    });
  return painterPromise;
}
const pixels = new Map<string, Uint8ClampedArray>();
type Job = {
  config: IllustrationSettings;
  key: string;
  alive: () => boolean;
  resolve: (value: Uint8ClampedArray | null) => void;
  reject: (error: unknown) => void;
};
const queue: Job[] = [];
let scheduled = false;
function schedule() {
  if (scheduled || !queue.length) return;
  scheduled = true;
  requestAnimationFrame(async () => {
    while (queue.length && !queue[0].alive()) queue.shift()!.resolve(null);
    if (!queue.length) {
      scheduled = false;
      return;
    }
    const job = queue.shift()!;
    try {
      if (!job.alive()) job.resolve(null);
      else {
        const p = await painter();
        if (!job.alive()) job.resolve(null);
        else {
          let value = pixels.get(job.key);
          if (!value) {
            value = p.render(job.config);
            if (pixels.size >= 16) pixels.delete(pixels.keys().next().value!);
            pixels.set(job.key, value);
          }
          job.resolve(value);
        }
      }
    } catch (error) {
      job.reject(error);
    } finally {
      scheduled = false;
      schedule();
    }
  });
}
export function IllustratedPortrait({
  config,
  jersey,
  age,
  label,
}: {
  config: AnyIllustration;
  jersey?: [string, string];
  age?: number;
  label?: { name?: string; num?: string };
}) {
  const value = readIllustration(config);
  if (!value)
    return (
      <span role="img" aria-label="Portrait artwork unavailable">
        Portrait unavailable
      </span>
    );
  return value.v === 2 ? (
    <FullPortrait config={value} jersey={jersey} age={age} label={label} />
  ) : (
    <LegacyIllustratedPortrait config={value} />
  );
}
function LegacyIllustratedPortrait({ config }: { config: IllustrationSettings }) {
  const settings = readIllustration(config) as IllustrationSettings,
    portrait = illustratedChoice(settings.base)!;
  const ref = useRef<HTMLCanvasElement>(null),
    [painted, setPainted] = useState('');
  const key = JSON.stringify(settings);
  const needsPaint =
    portrait.editable &&
    !!(
      settings.hair ||
      settings.eyes ||
      settings.nose ||
      settings.brows ||
      settings.beard ||
      settings.smile ||
      settings.jaw ||
      settings.spacing ||
      settings.mouth
    );
  useEffect(() => {
    setPainted('');
    if (!needsPaint) return;
    let alive = true;
    const job = new Promise<Uint8ClampedArray | null>((resolve, reject) => {
      queue.push({ config: settings, key, alive: () => alive, resolve, reject });
      schedule();
    });
    void job
      .then(data => {
        if (!alive || !data || !ref.current) return;
        const ctx = ref.current.getContext('2d');
        if (ctx) {
          ctx.putImageData(new ImageData(new Uint8ClampedArray(data), PORTRAIT_SIZE, PORTRAIT_SIZE), 0, 0);
          setPainted(key);
        }
      })
      .catch(() => {
        /* Keep the same intact base illustration if drawing is unavailable. */
      });
    return () => {
      alive = false;
    };
  }, [key, needsPaint]);
  const ready = needsPaint && painted === key;
  return (
    <span
      data-portrait-style="illustrated"
      data-portrait-id={portrait.id}
      data-portrait-painted={ready ? 'true' : 'false'}
      style={{ position: 'relative', display: 'block', width: '100%', height: '100%' }}
    >
      <span style={{ display: 'block', width: '100%', height: '100%', visibility: ready ? 'hidden' : 'visible' }}>
        <IllustratedBase portrait={portrait} />
      </span>
      {portrait.editable && (
        <canvas
          ref={ref}
          width={PORTRAIT_SIZE}
          height={PORTRAIT_SIZE}
          role="img"
          aria-label="Edited illustrated portrait"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: ready ? 'block' : 'none',
          }}
        />
      )}
    </span>
  );
}
