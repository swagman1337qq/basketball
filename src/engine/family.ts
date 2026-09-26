// Basketball families: sons of former players and brothers in the league, at roughly
// real NBA rates. About 2% of NBA players are sons of NBA players (the Currys, Klay
// Thompson, Bronny James) and about 3% have a brother who also made it (the Currys,
// Holidays, Antetokounmpos). A son takes his father's surname, heritage and often his
// frame; brothers share a surname, country and background.
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
  if (!p.elig?.some(e => e.c === rel.rep)) p.elig = [...(p.elig || []), { c: rel.rep, why: 'through parents' }];
  if (NO_SURNAME.test(rel.heritage || '')) { p.name = nm.name; p.native = nm.native; p.last = nm.last; }
  else setSurname(p, rel.last ?? String(rel.name).split(' ').slice(-1)[0], rel.nativeLast || '');
  g.resetFace(p.id);
}

// A new prospect may be the son of a former (or veteran) player.
export function maybeSon(g: Game, p: any, rnd: () => number, force = false) {
  if (!force && rnd() >= SON_RATE) return null;
  const P = g.db.P;
  const dads = (Object.values(P) as any[]).filter(q => q.id !== p.id && q.age - p.age >= 20 && q.age - p.age <= 40 && !(q.family || []).some(f => f.rel === 'son' && P[f.pid]?.age === p.age));
  if (!dads.length) return null;
  const dad = dads.sort((a, b) => (b.retired ? 1 : 0) - (a.retired ? 1 : 0))[Math.floor(rnd() * Math.min(dads.length, Math.max(8, dads.filter(d => d.retired).length)))];
  inherit(g, p, dad, rnd);
  // Juniors: Western naming only, about one son in eight.
  if (!p.familyFirst && !NO_SURNAME.test(dad.heritage || '') && rnd() < 0.12 && !/ Jr\.$/.test(dad.name)) { p.first = dad.first ?? String(dad.name).split(' ')[0]; p.name = p.first + ' ' + p.last + ' Jr.'; }
  // Genes: height and frame drift toward the father's.
  p.r.hgt = Math.round((p.r.hgt + dad.r.hgt) / 2); if (dad.hgt) p.hgt = rnd() < 0.5 ? dad.hgt : p.hgt;
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
