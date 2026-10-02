// Draft surprises: how an amateur's game translates to the NBA. What's on the draft board is how
// he played in college or abroad (seen through your scouts, or exactly in God Mode), but nobody can
// see how it carries over: the athletes are bigger, the spacing is different, college may have used
// him wrong. That's rolled when he becomes a prospect, kept hidden (God Mode can peek), and shows
// at his first NBA training camp:
//   • his level: about half are what the scouts saw (±2), the rest are worse or better by 3–6, and
//     about one in eight is a real bust (7–10 worse) or a real steal (7–11 better);
//   • his shape, often whatever the level: a skill that's better than it looked and another that's
//     worse (misused in college: "he can really shoot, but he's no point guard");
//   • his ceiling, partly with his level and partly on its own: some plateau as good players, not
//     the stars they were drafted to be; a few late bloomers see theirs rise.
// The league's averages don't drift: the swings cancel out on average.
import { mulberry32 } from './rng';
import { syncOvr } from './ratings';

export interface Translation { o: number; c: number; sh: Record<string, number>; tier: string }
export const GROUPS: Record<string, { label: string; keys: string[]; up: string; down: string }> = {
  shoot: { label: 'shooting', keys: ['tp', 'fg', 'ft'], up: 'his shot is better than his college numbers showed', down: 'the shot doesn’t carry over to the NBA line' },
  finish: { label: 'finishing', keys: ['ins', 'lay', 'dnk'], up: 'he finishes through contact better than anyone expected', down: 'he can’t finish against NBA size' },
  play: { label: 'playmaking', keys: ['pss', 'drb', 'oiq'], up: 'he sees the floor and handles it better than his role there let him show', down: 'he isn’t the playmaker his old role made him look like' },
  def: { label: 'defense', keys: ['diq', 'stl', 'blk'], up: 'his defensive instincts are real', down: 'he gets lost on defense against NBA speed' },
  reb: { label: 'rebounding', keys: ['reb', 'box'], up: 'he rebounds well above his size', down: 'he gets pushed around on the glass' },
};
const SKILLS = ['ins', 'dnk', 'lay', 'ft', 'fg', 'tp', 'oiq', 'diq', 'blk', 'stl', 'drb', 'pss', 'reb', 'box']; // the body (height, strength, speed, leap, stamina) is measured at the combine
export const TIER_LABEL: Record<string, string> = { same: 'about what the scouts saw', worse: 'not quite what the scouts saw', better: 'better than advertised', bust: 'overmatched so far', steal: 'a steal' };

// One prospect's translation, the same every time for the same player.
export function rollTranslation(id: number): Translation {
  const r = mulberry32((id * 2654435761 + 0x5eed) >>> 0), u = r(), nrm = () => (r() + r() + r() - 1.5) * 2;
  let o: number, tier: string;
  if (u < 0.52) { o = Math.max(-2, Math.min(2, Math.round(nrm() * 1.1))); tier = 'same'; }
  else if (u < 0.71) { o = -Math.round(3 + r() * 2.9); tier = 'worse'; }
  else if (u < 0.88) { o = Math.round(3 + r() * 2.9); tier = 'better'; }
  else if (u < 0.94) { o = -Math.round(7 + r() * 3.4); tier = 'bust'; }
  else { o = Math.round(7 + r() * 3.9); tier = 'steal'; }
  // The ceiling: partly with his level, partly its own story (a plateau, or a late bloom).
  let c = Math.round(0.5 * o + nrm() * 1.5); const v = r();
  if (v < 0.12) c -= 4 + Math.round(r() * 4); else if (v > 0.93) c += 4 + Math.round(r() * 3);
  // The shape: often a skill better than it looked and another worse; sometimes just one.
  const sh: Record<string, number> = {}, ks = Object.keys(GROUPS), w = r();
  if (w < 0.5) { const a = ks[Math.floor(r() * ks.length)]; let b = ks[Math.floor(r() * ks.length)]; if (b === a) b = ks[(ks.indexOf(a) + 1 + Math.floor(r() * (ks.length - 1))) % ks.length]; sh[a] = 3 + Math.round(r() * 4); sh[b] = -(3 + Math.round(r() * 4)); }
  else if (w < 0.65) { const a = ks[Math.floor(r() * ks.length)]; sh[a] = (r() < 0.5 ? -1 : 1) * (3 + Math.round(r() * 3)); }
  return { o, c, sh, tier };
}

// Give a prospect his hidden translation (new prospects, and older saves' prospects and unsigned draftees).
export function ensureTranslation(p: any) { if (p && !p.dx && !p.dxDone) p.dx = rollTranslation(p.id); return p?.dx; }

// His first NBA camp: apply it. Returns what changed, for the camp report.
export function applyTranslation(p: any) {
  const t: Translation = p.dx; if (!t || p.dxDone) return null;
  const from = p.ovr, pot0 = p.pot, base = { ...p.r }, cl = (v: number) => Math.max(1, Math.min(100, Math.round(v)));
  let d = t.o;
  for (let i = 0; i < 4; i++) {
    SKILLS.forEach(k => { if (base[k] != null) p.r[k] = cl(base[k] + d); });
    Object.entries(t.sh).forEach(([g, x]) => GROUPS[g]?.keys.forEach(k => { if (p.r[k] != null) p.r[k] = cl(p.r[k] + x); }));
    syncOvr(p); const got = p.ovr - from; if (Math.abs(got - t.o) <= 0.5 || p.ovr <= 5) break; d += (t.o - got) * 1.15;
  }
  p.pot = Math.max(p.ovr, Math.min(100, Math.round(pot0 + t.c + (p.ovr - from) * 0.5)));
  p.dxDone = { from, to: p.ovr, pot0, pot: p.pot, tier: t.tier, sh: t.sh, o: t.o }; delete p.dx;
  return p.dxDone;
}

// A line for the camp report: "Name (PG, #4 pick): 50 → 56, better than advertised. His shot is better…; he isn't…"
export function translationLine(p: any, x: any) {
  const parts = Object.entries(x.sh || {}).sort((a: any, b: any) => b[1] - a[1]).map(([g, v]: any) => (v > 0 ? GROUPS[g].up : GROUPS[g].down) + ' (' + GROUPS[g].label + ' ' + (v > 0 ? '+' : '−') + Math.abs(v) + ')');
  const pot = x.pot !== x.pot0 ? '; ceiling ' + x.pot0 + ' → ' + x.pot : '';
  return p.name + ' (' + p.pos + (p.dr ? ', #' + (p.dr.rd === 2 ? p.dr.pick + 30 : p.dr.pick) + ' pick' : ', undrafted') + '): ' + x.from + ' → ' + x.to + ', ' + TIER_LABEL[x.tier] + (parts.length ? '. ' + parts.join('; ').replace(/^./, (c: string) => c.toUpperCase()) : '') + pot + '.';
}

// God Mode's peek at a prospect's hidden translation.
export function translationPreview(t: Translation) {
  const sh = Object.entries(t.sh || {}).map(([g, v]) => GROUPS[g].label + ' ' + (v > 0 ? '+' : '−') + Math.abs(v)).join(', ');
  return (t.o > 0 ? '+' : t.o < 0 ? '−' : '±') + Math.abs(t.o) + ' overall (' + TIER_LABEL[t.tier] + ')' + (sh ? '; ' + sh : '') + (t.c ? '; ceiling ' + (t.c > 0 ? '+' : '−') + Math.abs(t.c) : '');
}
