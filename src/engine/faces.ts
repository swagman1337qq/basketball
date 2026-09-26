// Deterministic SVG faces, one per player id. Custom generator (not facesjs).
import { createElement } from 'react';
import { mulberry32 } from './rng';

export function makeFace(p) {
  const pid = p.id, rnd = mulberry32((p.faceSeed ?? pid) * 7919 + 13), pick = a => a[Math.floor(rnd() * a.length)], race = p.race;
  const SK = { white: ['#f6dcc8', '#f1d3bd', '#ecc8ae', '#e8c1a4', '#e2b594', '#dcae8e', '#d3a07e', '#f3d6c2'], black: ['#9a6a48', '#8a5a3d', '#7a4e35', '#6b4430', '#5a3825', '#4a2e1f', '#3d261a', '#a8744f', '#613f2b'], asian: ['#f3dcc0', '#f0d2b0', '#ebcaa4', '#e6c39d', '#dcb58c', '#d2a77c', '#c99d74'], brown: ['#d9ac84', '#d4a37a', '#c89468', '#be8a5e', '#b98256', '#a8734a', '#9a6843', '#8c5e3c'] };
  const HC = { asian: ['#16120f', '#211a14', '#1b1511', '#2a211a'], black: ['#15100d', '#1e1712', '#110d0b', '#2a1f18'], brown: ['#1f1712', '#2e2219', '#3b2a1e', '#171210', '#4a3526'], white: ['#2b1d14', '#4a3322', '#7a5a3a', '#a07a4f', '#c9a36a', '#1f1712', '#8a3f1f', '#b5572a', '#d8bb7c', '#5c4430'] };
  // Dyed hair: bleached blond for some Black players, a brown tint for some Asian players (never red).
  const DYED = { black: ['#d8bb7c', '#c9a36a'], asian: ['#4a3526', '#5a4030'] };
  // Facial hair by look: East Asian players are mostly clean-shaven.
  const FH = { asian: ['none', 'none', 'none', 'none', 'none', 'none', 'stubble', 'stubble', 'mustache', 'goatee', 'soulpatch'], black: ['none', 'none', 'stubble', 'stubble', 'goatee', 'beard', 'beard', 'mustache', 'chinstrap', 'circle', 'soulpatch', 'heavy'], white: ['none', 'none', 'none', 'stubble', 'stubble', 'goatee', 'beard', 'mustache', 'chinstrap', 'circle', 'heavy'], brown: ['none', 'none', 'stubble', 'stubble', 'goatee', 'beard', 'mustache', 'chinstrap', 'circle', 'soulpatch'] };
  const ST = {
    black: ['buzz', 'buzz', 'short', 'fade', 'fade', 'waves', 'waves', 'afro', 'locs', 'bald', 'braids', 'cornrows', 'twists', 'hightop', 'frohawk', 'flattop', 'crew', 'mohawk'],
    asian: ['short', 'short', 'sidepart', 'sidepart', 'buzz', 'buzz', 'fringe', 'undercut', 'textured', 'crew', 'crew', 'fade', 'spiky'],
    white: ['short', 'sidepart', 'buzz', 'messy', 'bald', 'long', 'undercut', 'slick', 'bun', 'crew', 'curly', 'textured', 'fauxhawk', 'curtains', 'fade'],
    brown: ['short', 'fade', 'buzz', 'curly', 'sidepart', 'waves', 'undercut', 'slick', 'crew', 'textured', 'mohawk', 'bun', 'messy', 'bald'],
  };
  const EYE = { white: ['#3a2a1e', '#4a6a8a', '#5b7a4a', '#6b5a3a', '#2a1f18', '#4e7ea8'], brown: ['#2a1f18', '#3a2a1e', '#5a4a2a', '#4a3a26'], black: ['#1a1512', '#2a1f18'], asian: ['#1a1512', '#2a1f18'] };
  const grey = p.age >= 33 && rnd() < .4, style = pick(ST[race] || ST.white);
  const dyed = !grey && DYED[race] && rnd() < .05;
  return { v: 2, generator: 'Basketball Manager faces', race, skin: pick(SK[race]), head: { w: +(0.86 + rnd() * .26).toFixed(2), h: +(0.93 + rnd() * .16).toFixed(2), jaw: +rnd().toFixed(2) },
    hair: { style, color: grey ? pick(['#8d8a86', '#a8a49e', '#6f6a64']) : dyed ? pick(DYED[race]) : pick(HC[race]) },
    eyes: { shape: race === 'asian' ? pick(['narrow', 'narrow', 'almond']) : pick(['round', 'almond', 'almond', 'hooded']), size: +(0.88 + rnd() * .28).toFixed(2), spacing: +(0.93 + rnd() * .16).toFixed(2), color: pick(EYE[race] || EYE.white) },
    brows: { tilt: +((rnd() - .5) * .5).toFixed(2), thick: +(1.4 + rnd() * 2).toFixed(2), arch: rnd() < .35 },
    nose: { w: +((0.78 + rnd() * .55) * (race === 'black' ? 1.25 : 1)).toFixed(2), len: +(0.88 + rnd() * .34).toFixed(2), bridge: rnd() < .4 },
    mouth: { w: +(0.82 + rnd() * .4).toFixed(2), smile: +(rnd() * .9 - .25).toFixed(2), lips: +(rnd() * (race === 'black' ? 1 : .6)).toFixed(2) },
    facial: p.age < 20 ? 'none' : pick(FH[race] || FH.white),
    ears: +(0.88 + rnd() * .3).toFixed(2),
    extra: { headband: rnd() < .07 ? pick(['#ffffff', '#1a1a1a', '#c8102e', '#1d428a']) : null, earring: rnd() < .08, freckles: race === 'white' && rnd() < .12, lines: p.age >= 33 && rnd() < .5 } };
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
  if (st === 'buzz') out.push(cap(0, .55)); else if (st === 'crew') out.push(cap(3, .95)); else if (st === 'waves') { out.push(cap(1, .9)); for (let i = 1; i <= 3; i++) out.push(el('path', { d: `M${cx - rw * (1 - i * .18)} ${cy - rh * (.55 + i * .1)} Q${cx} ${cy - rh * (.95 + i * .02)} ${cx + rw * (1 - i * .18)} ${cy - rh * (.55 + i * .1)}`, stroke: '#ffffff', strokeWidth: .8, fill: 'none', opacity: .16 })); }
  else if (st === 'fade') out.push(cap(2, .9), el('path', { d: `M${cx - rw} ${cy - rh * .15} L${cx - rw * .95} ${cy - rh * .45} M${cx + rw} ${cy - rh * .15} L${cx + rw * .95} ${cy - rh * .45}`, stroke: hc, strokeWidth: 3, opacity: .35 }));
  else if (['short', 'sidepart', 'fringe', 'messy', 'curly', 'long', 'braids', 'locs', 'spiky'].includes(st)) out.push(cap(st === 'short' || st === 'sidepart' ? 4 : 6, 1));
  if (st === 'sidepart') out.push(el('path', { d: `M${cx - rw * .9} ${cy - rh * .45} Q${cx - rw * .2} ${cy - rh * 1.05} ${cx + rw * .6} ${cy - rh * .75}`, stroke: hc, strokeWidth: 5, fill: 'none' }));
  if (st === 'fringe') out.push(el('path', { d: `M${cx - rw * .9} ${cy - rh * .5} Q${cx} ${cy - rh * .35} ${cx + rw * .9} ${cy - rh * .5} L${cx + rw * .9} ${cy - rh * .7} L${cx - rw * .9} ${cy - rh * .7} Z`, fill: hc }));
  if (st === 'spiky') for (let i = -2; i <= 2; i++) out.push(el('path', { d: `M${cx + i * rw * .38 - 5} ${cy - rh - 2} L${cx + i * rw * .38} ${cy - rh - 11} L${cx + i * rw * .38 + 5} ${cy - rh - 2} Z`, fill: hc }));
  if (st === 'messy' || st === 'curly') for (let i = -3; i <= 3; i++) out.push(el('circle', { cx: cx + i * rw * .3, cy: cy - rh - 3 + Math.abs(i) * 3, r: st === 'curly' ? 6 : 5, fill: hc }));
  if (st === 'locs' || st === 'braids') for (let i = -3; i <= 3; i++) out.push(el('rect', { x: cx + i * rw * .31 - 2.2, y: cy - rh * .6, width: 4.4, height: st === 'locs' ? rh * .95 : rh * .3, rx: 2.2, fill: hc }));
  if (st === 'hightop' || st === 'flattop') out.push(cap(2, 1), el('rect', { x: cx - rw * .78, y: cy - rh - (st === 'hightop' ? 16 : 9), width: rw * 1.56, height: (st === 'hightop' ? 16 : 9) + 4, rx: 3, fill: hc }));
  if (st === 'twists') { out.push(cap(4, 1)); for (let i = -3; i <= 3; i++) out.push(el('ellipse', { cx: cx + i * rw * .28, cy: cy - rh - 4 + Math.abs(i) * 2.5, rx: 3.2, ry: 5.5, fill: hc })); }
  if (st === 'cornrows') { out.push(cap(1, .95)); for (let i = -2; i <= 2; i++) out.push(el('path', { d: `M${cx + i * rw * .3} ${cy - rh * .45} Q${cx + i * rw * .34} ${cy - rh * .85} ${cx + i * rw * .22} ${cy - rh - 1}`, stroke: sk, strokeWidth: 1, fill: 'none', opacity: .55 })); }
  if (st === 'mohawk' || st === 'frohawk' || st === 'fauxhawk') { if (st !== 'mohawk') out.push(cap(0, .45)); out.push(el('path', { d: `M${cx - 6} ${cy - rh * .5} Q${cx - 7} ${cy - rh - (st === 'frohawk' ? 12 : 9)} ${cx} ${cy - rh - (st === 'frohawk' ? 14 : 11)} Q${cx + 7} ${cy - rh - (st === 'frohawk' ? 12 : 9)} ${cx + 6} ${cy - rh * .5} Z`, fill: hc })); }
  if (st === 'undercut' || st === 'slick' || st === 'textured' || st === 'curtains' || st === 'bun') {
    if (st === 'undercut') out.push(cap(0, .35));
    out.push(el('path', { d: `M${cx - rw * .92} ${cy - rh * .42} Q${cx - rw * .95} ${cy - rh - (st === 'textured' ? 7 : 5)} ${cx} ${cy - rh - (st === 'textured' ? 8 : 6)} Q${cx + rw * .95} ${cy - rh - (st === 'textured' ? 7 : 5)} ${cx + rw * .92} ${cy - rh * .42} Q${cx} ${cy - rh * .72} ${cx - rw * .92} ${cy - rh * .42} Z`, fill: hc }));
    if (st === 'slick') out.push(el('path', { d: `M${cx - rw * .5} ${cy - rh * .8} Q${cx} ${cy - rh - 4} ${cx + rw * .5} ${cy - rh * .8}`, stroke: '#ffffff', strokeWidth: 1.2, fill: 'none', opacity: .25 }));
    if (st === 'curtains') out.push(el('path', { d: `M${cx} ${cy - rh - 5} L${cx - rw * .55} ${cy - rh * .45} M${cx} ${cy - rh - 5} L${cx + rw * .55} ${cy - rh * .45}`, stroke: hc, strokeWidth: 5, strokeLinecap: 'round' }));
    if (st === 'textured') for (let i = -2; i <= 2; i++) out.push(el('path', { d: `M${cx + i * rw * .35 - 4} ${cy - rh - 4} L${cx + i * rw * .35} ${cy - rh - 9} L${cx + i * rw * .35 + 4} ${cy - rh - 4} Z`, fill: hc }));
    if (st === 'bun') out.push(el('circle', { cx, cy: cy - rh - 9, r: 7, fill: hc }));
  }
  if (st === 'bald') out.push(el('ellipse', { cx: cx - rw * .35, cy: cy - rh * .75, rx: 5, ry: 2.5, fill: '#ffffff', opacity: .18 }));
  const X = f.extra || {};
  if (X.headband) out.push(el('rect', { x: cx - rw - 1, y: cy - rh * .62, width: rw * 2 + 2, height: 6, rx: 2, fill: X.headband }));
  if (X.lines) [0, 1].forEach(i => out.push(el('path', { d: `M${cx - 9} ${cy - rh * .4 + i * 3} Q${cx} ${cy - rh * .45 + i * 3} ${cx + 9} ${cy - rh * .4 + i * 3}`, stroke: 'rgba(0,0,0,.18)', strokeWidth: .8, fill: 'none' })));
  if (X.earring) out.push(el('circle', { cx: cx + rw + 1, cy: cy + 8 * f.ears, r: 1.5, fill: '#e8e3d8' }));
  const ey = cy - 2, ex = 10 * f.eyes.spacing, ery = f.eyes.shape === 'narrow' ? 1.6 : f.eyes.shape === 'hooded' ? 2 : f.eyes.shape === 'almond' ? 2.4 : 3, erx = 3.6 * f.eyes.size;
  [-1, 1].forEach(sd => { out.push(el('ellipse', { cx: cx + sd * ex, cy: ey, rx: erx, ry: ery * f.eyes.size, fill: f.eyes.color || '#1a1512' }), el('circle', { cx: cx + sd * ex, cy: ey, r: Math.min(erx, ery * f.eyes.size) * .55, fill: '#120e0c' }), el('circle', { cx: cx + sd * ex + 1, cy: ey - .6, r: .8, fill: '#fff', opacity: .8 }));
    if (f.eyes.shape === 'hooded') out.push(el('path', { d: `M${cx + sd * ex - erx} ${ey - 1.2} Q${cx + sd * ex} ${ey - 3.4} ${cx + sd * ex + erx} ${ey - 1.2}`, stroke: 'rgba(0,0,0,.35)', strokeWidth: 1, fill: 'none' }));
    out.push(el('line', { x1: cx + sd * (ex - 5), y1: ey - 7 - sd * f.brows.tilt * 3 * -1, x2: cx + sd * (ex + 5), y2: ey - 7 + f.brows.tilt * 3, stroke: f.hair.style === 'bald' || f.hair.color === '#8d8a86' ? '#3a2e26' : hc, strokeWidth: f.brows.thick, strokeLinecap: 'round' })); });
  if (X.freckles) [-1, 1].forEach(sd => [0, 1, 2].forEach(i => out.push(el('circle', { cx: cx + sd * (8 + i * 2.5), cy: ey + 7 + (i % 2) * 2, r: .7, fill: '#a0603c', opacity: .5 }))));
  const nw = 4 * f.nose.w, nl = 9 * f.nose.len;
  out.push(el('path', { d: `M${cx - 1} ${ey + 2} L${cx - nw * .4} ${ey + nl} Q${cx} ${ey + nl + 2} ${cx + nw} ${ey + nl - 1}`, fill: 'none', stroke: 'rgba(0,0,0,.35)', strokeWidth: 1.4, strokeLinecap: 'round' }));
  if (f.nose.bridge) out.push(el('path', { d: `M${cx + 1.5} ${ey + 1} L${cx + 1.5} ${ey + nl - 3}`, stroke: 'rgba(0,0,0,.14)', strokeWidth: 1.2 }));
  const my = ey + nl + 8, mw = 8 * f.mouth.w;
  if (f.facial === 'stubble') out.push(el('path', { d: `M${cx - rw * .9} ${cy + 6} Q${cx - rw * .8} ${jawY - 2} ${cx} ${jawY + 3} Q${cx + rw * .8} ${jawY - 2} ${cx + rw * .9} ${cy + 6} Q${cx} ${my + 2} ${cx - rw * .9} ${cy + 6} Z`, fill: hc, opacity: .22 }));
  // Full beard: sideburns down the cheeks and around the jaw, open around the mouth (which is drawn on top).
  if (f.facial === 'beard') out.push(el('path', { d: `M${cx - rw * .97} ${cy + 2} Q${cx - rw * .9} ${jawY - 4} ${cx - jw} ${jawY - 1} Q${cx} ${jawY + 7} ${cx + jw} ${jawY - 1} Q${cx + rw * .9} ${jawY - 4} ${cx + rw * .97} ${cy + 2} L${cx + rw * .78} ${cy + 4} Q${cx + rw * .7} ${my - 2} ${cx + mw + 3} ${my + 1} Q${cx} ${my + 9} ${cx - mw - 3} ${my + 1} Q${cx - rw * .7} ${my - 2} ${cx - rw * .78} ${cy + 4} Z`, fill: hc, opacity: .9 }),
    el('path', { d: `M${cx - mw - 1} ${my - 2.5} Q${cx} ${my - 7} ${cx + mw + 1} ${my - 2.5}`, stroke: hc, strokeWidth: 3, fill: 'none', strokeLinecap: 'round', opacity: .9 }));
  if (f.facial === 'heavy') out.push(el('path', { d: `M${cx - rw * .98} ${cy} Q${cx - rw * .95} ${jawY + 2} ${cx} ${jawY + 12} Q${cx + rw * .95} ${jawY + 2} ${cx + rw * .98} ${cy} L${cx + rw * .75} ${cy + 3} Q${cx + mw + 4} ${my - 4} ${cx} ${my - 5} Q${cx - mw - 4} ${my - 4} ${cx - rw * .75} ${cy + 3} Z`, fill: hc }));
  if (f.facial === 'chinstrap') out.push(el('path', { d: `M${cx - rw * .97} ${cy + 2} Q${cx - rw * .9} ${jawY - 2} ${cx} ${jawY + 3} Q${cx + rw * .9} ${jawY - 2} ${cx + rw * .97} ${cy + 2}`, stroke: hc, strokeWidth: 3, fill: 'none' }));
  if (f.facial === 'circle') out.push(el('path', { d: `M${cx - mw - 2} ${my - 3} Q${cx - mw - 3} ${jawY + 1} ${cx} ${jawY + 3} Q${cx + mw + 3} ${jawY + 1} ${cx + mw + 2} ${my - 3} Q${cx} ${my + 6} ${cx - mw - 2} ${my - 3} Z`, fill: hc }), el('path', { d: `M${cx - mw} ${my - 2.5} Q${cx} ${my - 6.5} ${cx + mw} ${my - 2.5}`, stroke: hc, strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }));
  if (f.facial === 'soulpatch') out.push(el('path', { d: `M${cx - 2} ${my + 3} L${cx + 2} ${my + 3} L${cx} ${my + 7} Z`, fill: hc }));
  if (f.facial === 'goatee') out.push(el('path', { d: `M${cx - 5} ${my + 3} Q${cx} ${jawY + 4} ${cx + 5} ${my + 3} Z`, fill: hc }));
  if (f.facial === 'mustache' || f.facial === 'goatee') out.push(el('path', { d: `M${cx - mw} ${my - 2} Q${cx} ${my - 6} ${cx + mw} ${my - 2}`, stroke: hc, strokeWidth: 2.4, fill: 'none', strokeLinecap: 'round' }));
  out.push(el('path', { d: `M${cx - mw} ${my} Q${cx} ${my + 4 * f.mouth.smile + 1} ${cx + mw} ${my}`, fill: 'none', stroke: ['beard', 'goatee', 'heavy', 'circle'].includes(f.facial) ? '#b0625a' : '#5a2e24', strokeWidth: 1.8 + (f.mouth.lips || 0) * 1.2, strokeLinecap: 'round' }));
  return E('svg', { viewBox: '0 0 100 150', width: '100%', height: '100%', style: { display: 'block' } }, ...out);
}
