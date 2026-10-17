// The coaching staff's tactics. Every setting a team doesn't set by hand is the staff's call, made the
// way a real staff makes it, in three layers:
//  1. Identity: what the roster is built for (coachBase). Shooters spread the floor, a team of quick
//     players runs, a big front line owns the glass, a team that can't guard on the perimeter packs
//     the paint. It follows the roster as it changes.
//  2. A game plan for the opponent (gamePlan): slow the game down as the underdog and push it as the
//     favorite, dare a team that can't shoot to shoot, take away the threes of one that can, go small
//     against a slow front line, and set a junk defense on a lone star.
//  3. Reads during the game (liveTactics, every trip): the defense matches who is on the floor (a zone
//     against a lineup with no shooters, switching against five shooters, the box-and-one only while
//     the star plays), the staff looks at the box score every six minutes (a team hot from three gets
//     run off the line, one living at the rim meets a drop big), and the score late in the game decides
//     the pace, the press and the glass.
// The head coach's quality (the Coaching budget) decides how often the staff makes those reads: a great
// staff makes nearly all of them, a poor one misses about half.
import { TACTIC_GROUPS, tacticFitParts, type Tactics } from './tactics';

export type TacKey = keyof Tactics;
export const TAC_KEYS: TacKey[] = ['pace', 'off', 'def', 'press', 'reb', 'lineup', 'focus', 'foul', 'clutch'];
// Defenses a team can play as its everyday scheme; the junk defenses (box-and-one, triangle-and-two,
// the wall) and the presses are situational, so the staff only reaches for them in a game plan or a read.
const BASE_DEF = ['Man', 'Switch', 'Drop', 'Hedge', 'Ice', 'Pack line', 'Aggressive', 'Blitz', '2-3 zone', '3-2 zone', 'Matchup zone'];
const PACES = ['Very slow', 'Slow', 'Average', 'Fast', 'Very fast'];
// How well an option suits a typical roster (league means of tacticFitParts on generated teams): the
// staff judges its own roster against them, so it picks what its players are relatively good at instead
// of whatever suits every roster a little (post-ups and twin towers, otherwise).
const TYPICAL: Record<string, number> = {
  // (offense: nudged toward the spacing systems today's staffs favor and away from post-ups and long twos)
  'off:Motion': 0.06, 'off:Pick and roll': 0.4, 'off:Isolation': 0.13, 'off:Post-up': 0.67, 'off:Triangle': -0.24, 'off:Princeton': -0.24, 'off:Flex': 0.01,
  'off:Dribble drive': 0.27, 'off:Pace and space': -0.09, 'off:Moreyball': -0.37, 'lineup:Small ball': -0.16, 'lineup:Twin towers': 0.19,
  'def:Man': 0, 'def:Switch': 0.14, 'def:Drop': 0.19, 'def:Hedge': -0.03, 'def:Ice': 0.01, 'def:Aggressive': -0.04, 'def:Pack line': 0.12, 'def:Blitz': 0,
  'def:2-3 zone': -0.44, 'def:3-2 zone': -0.09, 'def:Matchup zone': -0.13, 'reb:Crash the glass': -0.04, 'reb:Get back': 0.04, 'focus:Offense first': -0.04, 'focus:Defense first': 0.04,
};
const avg = (ps: any[], f: (p: any) => number) => (ps.length ? ps.reduce((a, p) => a + f(p), 0) / ps.length : 50);
const shooter = (p: any) => (p.r.tp ?? 0) >= 55;
const offScore = (p: any) => Math.max(p.r.tp ?? 0, p.r.fg ?? 0, ((p.r.dnk ?? 0) + (p.r.lay ?? p.r.dnk ?? 0) + (p.r.ins ?? 0)) / 3) * 0.6 + (p.ovr ?? 50) * 0.4;

// The coach's quality from the Coaching budget ($5–40M a season; 18 is typical): 0.35 to 0.95.
export const coachQuality = (coachingBudget = 18) => Math.max(0.35, Math.min(0.95, 0.35 + ((coachingBudget - 5) / 35) * 0.6));

// 1. Identity from the roster (its top eight; sim or database players, both carry r, grp, ovr). Cached by
// who the eight are and their overalls: it is worked out once and reused until the roster or ratings change.
const BASE_CACHE = new Map<string, Required<Tactics>>();
export function coachBase(top: any[], quick0 = 42): Required<Tactics> {
  const ck = top.map(p => p.id + ':' + p.ovr + ':' + (p.age ?? '')).join(',') + '|' + Math.round(quick0 * 10);
  const hit = BASE_CACHE.get(ck); if (hit) return { ...hit };
  const res = coachBase0(top, quick0);
  if (BASE_CACHE.size > 600) BASE_CACHE.clear();
  BASE_CACHE.set(ck, res); return { ...res };
}
function coachBase0(top: any[], quick0 = 42): Required<Tactics> {
  const t: any = { pace: 'Average', off: 'Balanced', def: 'Man', press: 'Off', reb: 'Balanced', lineup: 'Standard', focus: 'Balanced', foul: 'Normal', clutch: 'Motion' };
  if (!top.length) return t;
  // An option replaces the plain one only when it suits this roster clearly better than it suits most.
  const pick = (k: TacKey, opts: string[], margin = 0.2) => {
    const rel = (v: string) => ((tacticFitParts(top, { ...t, [k]: v }) as any)[k] ?? 0) - (TYPICAL[k + ':' + v] ?? 0);
    let best = t[k], hi = rel(t[k]);
    for (const v of opts) { const f = rel(v); if (f > hi + margin) { hi = f; best = v; } }
    t[k] = best;
  };
  const optsOf = (k: TacKey) => TACTIC_GROUPS.find(g => g.k === k)!.opts.map(o => o.v);
  pick('off', optsOf('off'));
  pick('def', BASE_DEF);
  pick('reb', optsOf('reb'));
  pick('lineup', optsOf('lineup'), 0.35);
  pick('focus', optsOf('focus'));
  // Pace: quick, young rosters run, big veteran ones grind (Very fast and Very slow are for game plans and
  // late-game situations; NBA teams' paces sit within about 5% of the average).
  const quick = avg(top, p => ((p.r.spd ?? 50) + (p.r.acc ?? p.r.spd ?? 50)) / 2 - (p.r.stre ?? 50) * 0.3), age = avg(top, p => p.age ?? 26);
  const tempo = 1 - (quick - quick0) * 0.0012 + (age - 27) * 0.004; // the length of its trips, about 0.97–1.03 (quick0: the league's typical quickness, Norms.quick)
  t.pace = tempo < 0.985 ? 'Fast' : tempo > 1.012 ? 'Slow' : 'Average';
  // Crunch time: a real star gets the ball; a handler and a finishing big run the pick and roll.
  const by = top.slice().sort((a, b) => offScore(b) - offScore(a)), star = by[0], second = by[1];
  const handler = top.reduce((a, p) => ((p.r.drb ?? 0) + (p.r.pss ?? 0) > (a.r.drb ?? 0) + (a.r.pss ?? 0) ? p : a), top[0]);
  const finisher = top.filter(p => p.grp === 'B').reduce((a: any, p) => (!a || (p.r.dnk ?? 0) > (a.r.dnk ?? 0) ? p : a), null);
  t.clutch = star && second && offScore(star) - offScore(second) >= 5 && (star.r.drb ?? 0) >= 55 ? 'Isolate the star' : finisher && (handler.r.pss ?? 0) >= 60 && (finisher.r.dnk ?? 0) >= 60 ? 'Pick and roll' : 'Motion';
  return t;
}

export interface CoachPlan {
  base: Required<Tactics>; // identity adjusted for tonight's opponent
  junk: string | null; junkOn: number[]; // a junk defense and whose being on the floor triggers it
  zoneOk: boolean; // the staff will zone a lineup that can't shoot
  notes: string[];
}

// 2. Tonight's plan against `them` (sim players with minutes targets). `q` is the coach's quality, `rnd` 0–1.
export function gamePlan(us: any[], them: any[], q: number, rnd: () => number = Math.random, quick0 = 42): CoachPlan {
  const top = (ps: any[]) => ps.slice().sort((a, b) => (b.target ?? 0) - (a.target ?? 0)).slice(0, 8);
  const U = top(us), T = top(them), base = coachBase(U, quick0), notes: string[] = [];
  const plan: CoachPlan = { base, junk: null, junkOn: [], zoneOk: rnd() < q, notes };
  const sees = () => rnd() < q; // does the staff make this read?
  const wavg = (ps: any[], f: (p: any) => number) => { const w = ps.reduce((a, p) => a + (p.target || 1), 0) || 1; return ps.reduce((a, p) => a + f(p) * (p.target || 1), 0) / w; };
  // Pace: the underdog shortens the game, the favorite stretches it.
  const edge = wavg(U, p => p.ovr) - wavg(T, p => p.ovr), i = PACES.indexOf(base.pace);
  if (edge <= -3 && i > 0 && sees()) { base.pace = PACES[i - 1] as any; notes.push('Slowed the game down as the underdog'); }
  else if (edge >= 3 && i < 4 && sees()) { base.pace = PACES[i + 1] as any; notes.push('Pushed the pace as the better team'); }
  // Their shooting decides the everyday defense.
  const tpT = wavg(T, p => p.r.tp ?? 40), bigsU = U.filter(p => p.grp === 'B');
  if (tpT < 44 && sees()) { base.def = 'Pack line'; notes.push('Packed the paint and dared them to shoot'); }
  else if (tpT >= 66 && sees()) { base.def = 'Switch'; notes.push('Switched everything to take away their threes'); }
  // A lone star gets a junk defense (only while he's on the floor).
  const byT = T.slice().sort((a, b) => offScore(b) - offScore(a)), [s1, s2, s3] = byT;
  if (s1 && s2 && sees()) {
    if (offScore(s1) - offScore(s2) >= 12 && (s1.r.tp ?? 0) < 48 && (s1.r.dnk ?? 0) + (s1.r.lay ?? 0) >= 130) { plan.junk = 'Wall'; plan.junkOn = [s1.id]; notes.push('Built a wall in the paint against ' + s1.name); }
    else if (offScore(s1) - offScore(s2) >= 14) { plan.junk = 'Box-and-one'; plan.junkOn = [s1.id]; notes.push('Box-and-one on ' + s1.name); }
    else if (s3 && offScore(s2) - offScore(s3) >= 11 && offScore(s1) - offScore(s2) < 4) { plan.junk = 'Triangle-and-two'; plan.junkOn = [s1.id, s2.id]; notes.push('Triangle-and-two on ' + s1.name + ' and ' + s2.name); }
  }
  // Size: go small against a slow front line, big against a small team, if the roster allows it.
  const bigsT = T.filter(p => p.grp === 'B'), wingsU = U.filter(p => p.grp === 'W');
  if (bigsT.length && avg(bigsT, p => p.r.spd ?? 50) < 45 && wingsU.length >= 3 && sees()) { base.lineup = 'Small ball'; notes.push('Went small against their slow front line'); }
  else if (bigsT.length <= 1 && bigsU.length >= 3 && sees()) { base.lineup = 'Twin towers'; notes.push('Played two bigs against their small lineup'); }
  // The glass: crash it when the bigger team, get back against a running team.
  const glass = (ps: any[]) => avg(ps, p => (p.r.reb ?? 50) * 0.6 + (p.r.hgt ?? 50) * 0.4), runT = avg(T, p => p.r.spd ?? 50);
  if (glass(U) - glass(T) >= 4 && sees()) { base.reb = 'Crash the glass'; notes.push('Crashed the offensive glass'); }
  else if (runT >= 62 && sees()) { base.reb = 'Get back'; notes.push('Sprinted back against their transition game'); }
  return plan;
}

export interface LiveState {
  q: number; t: number; lead: number; // quarter, seconds left in it, our lead
  oppOn: any[]; // their players on the floor (when we defend)
  oppBox: () => { tpm: number; tpa: number; rm: number; ra: number }; // their shooting so far tonight (read every six minutes)
  ftPct: (p: any) => number;
}
export interface LiveMemory { cp: number; def: string | null; note?: string }

// 3. The staff's tactics for this trip.
export function liveTactics(plan: CoachPlan, st: LiveState, mem: LiveMemory, q: number, rnd: () => number = Math.random): Tactics {
  const t: any = { ...plan.base };
  // Every six minutes the staff reads the box score.
  const el = st.q <= 4 ? (st.q - 1) * 720 + (720 - st.t) : 2880 + (st.q - 5) * 300 + (300 - st.t), cp = Math.floor(el / 360);
  if (cp !== mem.cp) {
    mem.cp = cp; const b = st.oppBox();
    if (rnd() < q) {
      if (b.tpa >= 10 && b.tpm / b.tpa >= 0.42) { mem.def = plan.base.def === 'Switch' ? '3-2 zone' : 'Switch'; mem.note = 'Ran them off the three-point line'; }
      else if (b.ra >= 12 && b.rm / b.ra >= 0.7) { mem.def = 'Drop'; mem.note = 'Dropped a big into the paint to stop the layups'; }
      else mem.def = null;
    }
  }
  if (mem.def) t.def = mem.def;
  // Who is on the floor right now.
  const on = st.oppOn, shooters = on.filter(shooter).length;
  if (plan.junk && plan.junkOn.every(id => on.some(p => p.id === id))) t.def = plan.junk;
  else if (shooters <= 1 && plan.zoneOk) t.def = '2-3 zone';
  else if (shooters >= 5 && t.def !== 'Switch' && plan.zoneOk) t.def = 'Switch';
  // The score late in the game.
  const late = st.q >= 4 && st.t <= 360;
  if (late && st.lead <= -10) { t.pace = 'Very fast'; t.press = 'Full-court man'; t.reb = 'Crash the glass'; }
  else if (late && st.lead >= 10) { t.pace = 'Very slow'; t.press = 'Off'; t.reb = 'Get back'; }
  else if (st.q >= 4 && st.t <= 180 && st.lead < 0) t.pace = 'Fast';
  // Hack a poor free-throw shooter when chasing late (the engine keeps it out of the last two minutes).
  if (st.q >= 4 && st.t <= 300 && st.lead < 0 && st.lead >= -12 && on.some(p => st.ftPct(p) < 0.5)) t.foul = 'Hack-a-Shaq';
  return t;
}
