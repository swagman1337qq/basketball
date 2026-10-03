// Basketball families: sons of former players and brothers in the league, at roughly
// real NBA rates. About 2% of NBA players are sons of NBA players (the Currys, Klay
// Thompson, Bronny James) and about 3% have a brother who also made it (the Currys,
// Holidays, Antetokounmpos). A son takes his father's surname, heritage and often his
// frame; brothers share a surname, country and background.
import { syncOvr } from './ratings';
import type { Game } from './Game';
import { randomName } from '../data/heritage';

export const SON_RATE = 0.02, BROTHER_RATE = 0.03;
const NO_SURNAME = /Tibetan|Mongol/; // naming traditions without family names

export function relate(a: any, rel: 'father' | 'son' | 'brother', b: any) {
  // `a` is b's <rel>: father → b gets a 'father' entry; a gets 'son'.
  const add = (p, r, id) => { p.family = p.family || []; if (!p.family.some(x => x.pid === id)) p.family.push({ rel: r, pid: id }); };
  if (rel === 'father') { add(b, 'father', a.id); add(a, 'son', b.id); }
  else if (rel === 'son') { add(b, 'son', a.id); add(a, 'father', b.id); }
  else { add(a, 'brother', b.id); add(b, 'brother', a.id); }
}

// God Mode family editing (Edit player → NBA family). Links are real player records, always stored on
// both players (father ↔ son, brother ↔ brother). Names aren't touched: rename him yourself if you like.
const drop = (p: any, id: number) => { if (!p?.family) return; p.family = p.family.filter((x: any) => x.pid !== id); if (!p.family.length) delete p.family; };
export function unrelate(a: any, b: any) { drop(a, b?.id); drop(b, a?.id); }
export const relOf = (p: any, rel: string) => (p?.family || []).filter((x: any) => x.rel === rel).map((x: any) => x.pid as number);
// Why `q` can't be p's <rel> (father, son or brother), or null.
export function relateBlock(P: any, p: any, q: any, rel: 'father' | 'son' | 'brother'): string | null {
  if (!q || q.gone || !p) return 'Pick a player.';
  if (q.id === p.id) return 'He can’t be his own ' + rel + '.';
  const old = (q.family || []).find((x: any) => x.pid === p.id);
  if (old && old.rel !== ({ father: 'son', son: 'father', brother: 'brother' } as any)[rel]) return q.name + ' is already his ' + ({ father: 'son', son: 'father', brother: 'brother' } as any)[old.rel] + '.';
  if (rel === 'father' && q.age - p.age < 15) return 'A father has to be at least 15 years older (' + q.name + ' is ' + q.age + ', he’s ' + p.age + ').';
  if (rel === 'son' && p.age - q.age < 15) return 'A son has to be at least 15 years younger (' + q.name + ' is ' + q.age + ', he’s ' + p.age + ').';
  if (rel === 'brother' && relOf(p, 'father').includes(q.id)) return q.name + ' is his father.';
  return null;
}
// Set (or clear, with null) p's father; the old one loses him as a son.
export function setFather(P: any, p: any, fid: number | null) {
  relOf(p, 'father').forEach(id => unrelate(p, P[id]));
  if (fid != null && P[fid]) relate(P[fid], 'father', p);
}
export function addSon(P: any, p: any, sid: number) { if (P[sid]) setFather(P, P[sid], p.id); }
// Brothers: the two families of brothers become one (everyone is everyone's brother), and a father one
// side has and the other doesn't becomes the father of all of them.
export function addBrother(P: any, p: any, bid: number) {
  const q = P[bid]; if (!q) return;
  const group = [...new Set([p.id, ...relOf(p, 'brother'), q.id, ...relOf(q, 'brother')])].map(id => P[id]).filter(Boolean);
  group.forEach(a => group.forEach(b => { if (a.id < b.id) relate(a, 'brother', b); }));
  const dads = [...new Set(group.flatMap(x => relOf(x, 'father')))];
  if (dads.length === 1) group.forEach(x => { if (!relOf(x, 'father').length) relate(P[dads[0]], 'father', x); });
}

// Rebuild a player's full name (Romanized and native) after a surname change.
export function setSurname(p: any, last: string, nativeLast: string) {
  const parts = String(p.name).split(' ');
  const first = p.first ?? (p.familyFirst ? parts.slice(1).join(' ') : parts[0]);
  p.first = first; p.last = last;
  p.name = p.familyFirst ? last + ' ' + first : first + ' ' + last;
  if (p.nativeFirst && nativeLast) {
    p.nativeLast = nativeLast;
    p.native = p.nOrder === 'lf' ? nativeLast + p.nativeFirst : p.nOrder === 'lf ' ? nativeLast + ' ' + p.nativeFirst : p.nativeFirst + (p.nSep ?? ' ') + nativeLast;
  } else { p.native = ''; p.nativeLast = ''; }
}

// Give `p` the identity of a relative's family: same country, background and look.
function inherit(g: Game, p: any, rel: any, rnd: () => number) {
  const nm = randomName(rel.her, rnd, rel.heritage);
  Object.assign(p, { her: rel.her, rep: rel.rep, heritage: rel.heritage, race: rnd() < 0.8 ? rel.race : p.race, first: nm.first, familyFirst: nm.familyFirst, nOrder: nm.nOrder, nSep: nm.nSep, nativeFirst: nm.nativeFirst });
  // Tribal nations and mixed race run in the family too.
  delete p.tribe2; delete p.mix; if (rel.tribe2) p.tribe2 = rel.tribe2; if (rel.mix) { p.mix = rel.mix; p.first = randomName('US', rnd).first; }
  if (!p.elig?.some(e => e.c === rel.rep)) p.elig = [...(p.elig || []), { c: rel.rep, why: 'through parents' }];
  // Tribal nations: a relative's family decides where he grew up too (tribal members are U.S. citizens
  // and can only represent the United States).
  if (rel.her === 'XN' || p.born === 'XN') { const C = g.db.C, home = rel.her === 'XN' ? (rel.mix && rel.born === 'US' ? 'US' : 'XN') : 'US', towns = (C[home]?.cities || []) as string[];
    p.born = home; p.raised = home; if (towns.length) p.city = towns[Math.floor(rnd() * towns.length)];
    if (rel.her === 'XN') { p.rep = 'US'; p.elig = [{ c: 'US', why: 'U.S. citizen (tribal nation)' }]; } }
  if (NO_SURNAME.test(rel.heritage || '')) { p.name = nm.name; p.native = nm.native; p.last = nm.last; }
  else setSurname(p, rel.last ?? String(rel.name).split(' ').slice(-1)[0], rel.nativeLast || '');
  g.resetFace(p.id);
}

// A new prospect may be the son of a former (or veteran) player.
export function maybeSon(g: Game, p: any, rnd: () => number, force = false) {
  if (!force && rnd() >= SON_RATE) return null;
  const P = g.db.P;
  const dads = (Object.values(P) as any[]).filter(q => !q.gone && q.id !== p.id && q.age - p.age >= 20 && q.age - p.age <= 40 && !(q.family || []).some(f => f.rel === 'son' && P[f.pid]?.age === p.age));
  if (!dads.length) return null;
  const dad = dads.sort((a, b) => (b.retired ? 1 : 0) - (a.retired ? 1 : 0))[Math.floor(rnd() * Math.min(dads.length, Math.max(8, dads.filter(d => d.retired).length)))];
  inherit(g, p, dad, rnd);
  // Juniors: Western naming only, about one son in eight.
  if (!p.familyFirst && !NO_SURNAME.test(dad.heritage || '') && rnd() < 0.12 && !/ Jr\.$/.test(dad.name)) { p.first = dad.first ?? String(dad.name).split(' ')[0]; p.name = p.first + ' ' + p.last + ' Jr.'; }
  // Genes: height and frame drift toward the father's.
  p.r.hgt = Math.round((p.r.hgt + dad.r.hgt) / 2); if (dad.hgt) p.hgt = rnd() < 0.5 ? dad.hgt : p.hgt; syncOvr(p);
  relate(dad, 'father', p);
  return dad;
}

// A new player may be the brother of someone already in the league (or in a draft class).
export function maybeBrother(g: Game, s: any, p: any, rnd: () => number, force = false) {
  if (!force && rnd() >= BROTHER_RATE) return null;
  const P = g.db.P, pool = new Set<number>([...Object.values(s.rosters || {}).flat() as number[], ...(s.fa || []), ...[g.Y, g.Y + 1, g.Y + 2].flatMap(y => g.db.cls[y] || [])]);
  const sibs = [...pool].map(id => P[id]).filter(q => q && q.id !== p.id && !q.retired && Math.abs(q.age - p.age) >= 1 && Math.abs(q.age - p.age) <= 6 && (q.family || []).filter(f => f.rel === 'brother').length < 2);
  if (!sibs.length) return null;
  const bro = sibs[Math.floor(rnd() * sibs.length)];
  inherit(g, p, bro, rnd);
  relate(bro, 'brother', p);
  // An existing father is his father too.
  (bro.family || []).filter(f => f.rel === 'father').forEach(f => relate(P[f.pid], 'father', p));
  return bro;
}

// Retired players from before the league's records begin, so sons can appear from year one.
export function legacyCareer(p: any, rnd: () => number) {
  const seasons = 3 + Math.floor(rnd() * 13), q = (p.ovr - 40) / 30;
  p.legacy = { seasons, pts: +(4 + q * 18 + rnd() * 4).toFixed(1), reb: +(2 + q * 6 + rnd() * 2).toFixed(1), ast: +(1 + q * 4 + rnd() * 2).toFixed(1), allStar: q > 0.8 ? Math.floor(rnd() * 6) : q > 0.6 && rnd() < 0.4 ? 1 : 0 };
}

export function familyTag(g: Game, p: any) {
  const P = g.db.P, f = (p.family || []).find(x => x.rel === 'father'), b = (p.family || []).find(x => x.rel === 'brother');
  return f ? ', son of ' + P[f.pid].name : b ? ', brother of ' + P[b.pid].name : '';
}
