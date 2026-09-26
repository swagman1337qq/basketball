// Deterministic SVG faces, one per player id. Custom generator (not facesjs).
import { createElement } from 'react';
import { mulberry32 } from './rng';

export function makeFace(p) {
  const pid = p.id, rnd = mulberry32((p.faceSeed ?? pid) * 7919 + 13), pick = a => a[Math.floor(rnd() * a.length)], race = p.race;
  const SK = { white: ['#f1d3bd', '#e8c1a4', '#dcae8e', '#f5dcc8'], black: ['#6b4430', '#5a3825', '#7a4e35', '#4a2e1f', '#8a5a3d'], asian: ['#f0d2b0', '#e6c39d', '#dcb58c'], brown: ['#c89468', '#b98256', '#a8734a', '#d4a37a'] };
  const HC = { asian: ['#16120f', '#211a14'], black: ['#15100d', '#1e1712'], brown: ['#1f1712', '#2e2219', '#3b2a1e'], white: ['#2b1d14', '#4a3322', '#7a5a3a', '#a07a4f', '#c9a36a', '#1f1712'] };
  const ST = { black: ['buzz', 'short', 'fade', 'afro', 'locs', 'bald', 'braids'], asian: ['short', 'sidepart', 'spiky', 'buzz', 'fringe'], white: ['short', 'sidepart', 'buzz', 'messy', 'bald', 'long'], brown: ['short', 'fade', 'buzz', 'curly', 'sidepart'] };
  const grey = p.age >= 33 && rnd() < .4;
  return { v: 1, generator: 'Front Office faces', race, skin: pick(SK[race]), head: { w: +(0.9 + rnd() * .2).toFixed(2), h: +(0.95 + rnd() * .12).toFixed(2), jaw: +rnd().toFixed(2) },
    hair: { style: pick(ST[race]), color: grey ? '#8d8a86' : pick(HC[race]) }, eyes: { shape: race === 'asian' ? 'narrow' : pick(['round', 'almond', 'almond']), size: +(0.9 + rnd() * .25).toFixed(2), spacing: +(0.95 + rnd() * .12).toFixed(2) },
    brows: { tilt: +((rnd() - .5) * .4).toFixed(2), thick: +(1.6 + rnd() * 1.6).toFixed(2) }, nose: { w: +((0.8 + rnd() * .5) * (race === 'black' ? 1.25 : 1)).toFixed(2), len: +(0.9 + rnd() * .3).toFixed(2) },
    mouth: { w: +(0.85 + rnd() * .35).toFixed(2), smile: +(rnd() * .8 - .2).toFixed(2) }, facial: p.age < 21 ? 'none' : pick(['none', 'none', 'stubble', 'goatee', 'beard', 'mustache']), ears: +(0.9 + rnd() * .25).toFixed(2) };
}

export function faceSvg(f, jersey: [string, string] = ['#605d5d', '#bab6b6']) {
  const E = createElement, k = [0];
  const el = (t, a) => E(t, { key: k[0]++, ...a });
  const cx = 50, cy = 62, rw = 24 * f.head.w, rh = 30 * f.head.h, hc = f.hair.color, sk = f.skin;
  const J = jersey;
  const out = [];
  out.push(el('path', { d: 'M8 150 Q10 112 38 104 L62 104 Q90 112 92 150 Z', fill: J[0] }), el('path', { d: 'M38 104 L50 118 L62 104', fill: 'none', stroke: J[1], strokeWidth: 3 }));
  out.push(el('rect', { x: cx - 9, y: cy + rh - 8, width: 18, height: 16, fill: sk }));
  if (f.hair.style === 'afro') out.push(el('ellipse', { cx, cy: cy - rh * .35, rx: rw * 1.35, ry: rh * .95, fill: hc }));
  if (f.hair.style === 'long') out.push(el('path', { d: `M${cx - rw * 1.05} ${cy - rh * .2} L${cx - rw * 1.08} ${cy + rh * .7} L${cx - rw * .7} ${cy + rh * .6} Z M${cx + rw * 1.05} ${cy - rh * .2} L${cx + rw * 1.08} ${cy + rh * .7} L${cx + rw * .7} ${cy + rh * .6} Z`, fill: hc }));
  out.push(el('ellipse', { cx: cx - rw, cy: cy + 2, rx: 4.5 * f.ears, ry: 7 * f.ears, fill: sk }), el('ellipse', { cx: cx + rw, cy: cy + 2, rx: 4.5 * f.ears, ry: 7 * f.ears, fill: sk }));
  const jawY = cy + rh, jw = rw * (0.62 + f.head.jaw * .2);
  out.push(el('path', { d: `M${cx - rw} ${cy} Q${cx - rw} ${cy - rh} ${cx} ${cy - rh} Q${cx + rw} ${cy - rh} ${cx + rw} ${cy} Q${cx + rw} ${jawY - 8} ${cx + jw} ${jawY - 3} Q${cx} ${jawY + 4} ${cx - jw} ${jawY - 3} Q${cx - rw} ${jawY - 8} ${cx - rw} ${cy} Z`, fill: sk }));
  const cap = (lift, op) => el('path', { d: `M${cx - rw - 1} ${cy - rh * .15} Q${cx - rw - 1} ${cy - rh - lift} ${cx} ${cy - rh - lift} Q${cx + rw + 1} ${cy - rh - lift} ${cx + rw + 1} ${cy - rh * .15} L${cx + rw * .9} ${cy - rh * .45} Q${cx} ${cy - rh * .8} ${cx - rw * .9} ${cy - rh * .45} Z`, fill: hc, opacity: op });
  const st = f.hair.style;
  if (st === 'buzz') out.push(cap(0, .55)); else if (st === 'fade') out.push(cap(2, .9), el('path', { d: `M${cx - rw} ${cy - rh * .15} L${cx - rw * .95} ${cy - rh * .45} M${cx + rw} ${cy - rh * .15} L${cx + rw * .95} ${cy - rh * .45}`, stroke: hc, strokeWidth: 3, opacity: .35 }));
  else if (['short', 'sidepart', 'fringe', 'messy', 'curly', 'long', 'braids', 'locs', 'spiky'].includes(st)) out.push(cap(st === 'short' || st === 'sidepart' ? 4 : 6, 1));
  if (st === 'sidepart') out.push(el('path', { d: `M${cx - rw * .9} ${cy - rh * .45} Q${cx - rw * .2} ${cy - rh * 1.05} ${cx + rw * .6} ${cy - rh * .75}`, stroke: hc, strokeWidth: 5, fill: 'none' }));
  if (st === 'fringe') out.push(el('path', { d: `M${cx - rw * .9} ${cy - rh * .5} Q${cx} ${cy - rh * .35} ${cx + rw * .9} ${cy - rh * .5} L${cx + rw * .9} ${cy - rh * .7} L${cx - rw * .9} ${cy - rh * .7} Z`, fill: hc }));
  if (st === 'spiky') for (let i = -2; i <= 2; i++) out.push(el('path', { d: `M${cx + i * rw * .38 - 5} ${cy - rh - 2} L${cx + i * rw * .38} ${cy - rh - 11} L${cx + i * rw * .38 + 5} ${cy - rh - 2} Z`, fill: hc }));
  if (st === 'messy' || st === 'curly') for (let i = -3; i <= 3; i++) out.push(el('circle', { cx: cx + i * rw * .3, cy: cy - rh - 3 + Math.abs(i) * 3, r: st === 'curly' ? 6 : 5, fill: hc }));
  if (st === 'locs' || st === 'braids') for (let i = -3; i <= 3; i++) out.push(el('rect', { x: cx + i * rw * .31 - 2.2, y: cy - rh * .6, width: 4.4, height: st === 'locs' ? rh * .95 : rh * .3, rx: 2.2, fill: hc }));
  if (st === 'bald') out.push(el('ellipse', { cx: cx - rw * .35, cy: cy - rh * .75, rx: 5, ry: 2.5, fill: '#ffffff', opacity: .18 }));
  const ey = cy - 2, ex = 10 * f.eyes.spacing, ery = f.eyes.shape === 'narrow' ? 1.6 : f.eyes.shape === 'almond' ? 2.4 : 3, erx = 3.6 * f.eyes.size;
  [-1, 1].forEach(sd => { out.push(el('ellipse', { cx: cx + sd * ex, cy: ey, rx: erx, ry: ery * f.eyes.size, fill: '#1a1512' }), el('circle', { cx: cx + sd * ex + 1, cy: ey - .6, r: .8, fill: '#fff', opacity: .8 }));
    out.push(el('line', { x1: cx + sd * (ex - 5), y1: ey - 7 - sd * f.brows.tilt * 3 * -1, x2: cx + sd * (ex + 5), y2: ey - 7 + f.brows.tilt * 3, stroke: f.hair.style === 'bald' || f.hair.color === '#8d8a86' ? '#3a2e26' : hc, strokeWidth: f.brows.thick, strokeLinecap: 'round' })); });
  const nw = 4 * f.nose.w, nl = 9 * f.nose.len;
  out.push(el('path', { d: `M${cx - 1} ${ey + 2} L${cx - nw * .4} ${ey + nl} Q${cx} ${ey + nl + 2} ${cx + nw} ${ey + nl - 1}`, fill: 'none', stroke: 'rgba(0,0,0,.35)', strokeWidth: 1.4, strokeLinecap: 'round' }));
  const my = ey + nl + 8, mw = 8 * f.mouth.w;
  if (f.facial === 'stubble') out.push(el('path', { d: `M${cx - rw * .9} ${cy + 6} Q${cx - rw * .8} ${jawY - 2} ${cx} ${jawY + 3} Q${cx + rw * .8} ${jawY - 2} ${cx + rw * .9} ${cy + 6} Q${cx} ${my + 2} ${cx - rw * .9} ${cy + 6} Z`, fill: hc, opacity: .22 }));
  // Full beard: sideburns down the cheeks and around the jaw, open around the mouth (which is drawn on top).
  if (f.facial === 'beard') out.push(el('path', { d: `M${cx - rw * .97} ${cy + 2} Q${cx - rw * .9} ${jawY - 4} ${cx - jw} ${jawY - 1} Q${cx} ${jawY + 7} ${cx + jw} ${jawY - 1} Q${cx + rw * .9} ${jawY - 4} ${cx + rw * .97} ${cy + 2} L${cx + rw * .78} ${cy + 4} Q${cx + rw * .7} ${my - 2} ${cx + mw + 3} ${my + 1} Q${cx} ${my + 9} ${cx - mw - 3} ${my + 1} Q${cx - rw * .7} ${my - 2} ${cx - rw * .78} ${cy + 4} Z`, fill: hc, opacity: .9 }),
    el('path', { d: `M${cx - mw - 1} ${my - 2.5} Q${cx} ${my - 7} ${cx + mw + 1} ${my - 2.5}`, stroke: hc, strokeWidth: 3, fill: 'none', strokeLinecap: 'round', opacity: .9 }));
  if (f.facial === 'goatee') out.push(el('path', { d: `M${cx - 5} ${my + 3} Q${cx} ${jawY + 4} ${cx + 5} ${my + 3} Z`, fill: hc }));
  if (f.facial === 'mustache' || f.facial === 'goatee') out.push(el('path', { d: `M${cx - mw} ${my - 2} Q${cx} ${my - 6} ${cx + mw} ${my - 2}`, stroke: hc, strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }));
  out.push(el('path', { d: `M${cx - mw} ${my} Q${cx} ${my + 4 * f.mouth.smile + 1} ${cx + mw} ${my}`, fill: 'none', stroke: f.facial === 'beard' || f.facial === 'goatee' ? '#b0625a' : '#5a2e24', strokeWidth: 1.8, strokeLinecap: 'round' }));
  return E('svg', { viewBox: '0 0 100 150', width: '100%', height: '100%', style: { display: 'block' } }, ...out);
}
