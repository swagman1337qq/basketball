// Tactics: every setting a coach can pick, what it does in the game engine (sim.ts applies the
// effects each possession), how well it suits a roster ("fit") and what it needs to unlock.
//
// Only teams you manage run tactics; the rest of the league plays Balanced, which keeps league
// stats on the 2026 baselines. Every option is a trade-off: it helps one thing and costs another,
// and shots a team forces beyond its natural mix go in a little less often, so an option pays
// off only when it suits your players (or hurts the opponent's).
//
// Sources for the behaviour: pick-and-roll coverages (drop protects the rim and concedes
// pull-up mid-range; switching removes open threes but creates mismatches; blitzing forces
// turnovers but leaks weak-side shooters), zones (league-wide, zones give up about 0.05 more
// points per possession than man-to-man, invite threes and lose rebounds), junk defenses (the
// Raptors' 2019 box-and-one on Stephen Curry), Houston's 2018–19 shot mix (about 52% threes, no
// mid-range), Phoenix's "seven seconds or less" (fastest pace in the league), the offensive
// rebounding vs transition defense trade-off, and the NBA's 2016 rule that an intentional foul
// away from the ball in the last two minutes of any quarter gives a free throw and the ball.

type Z = 'rim' | 'mid' | 'c3' | 'atb';
const ZS: Z[] = ['rim', 'mid', 'c3', 'atb'];
export interface Tactics { pace?: string; off?: string; def?: string; press?: string; reb?: string; lineup?: string; focus?: string; foul?: string; clutch?: string }
export interface TacOpt { v: string; label?: string; desc: string; how?: string }
export interface TacGroup { k: keyof Tactics; label: string; desc: string; opts: TacOpt[] }

export const TACTIC_GROUPS: TacGroup[] = [
  { k: 'pace', label: 'Pace', desc: 'How fast you play. More possessions reward speed, stamina and the better team.', opts: [
    { v: 'Slow', desc: 'Walk it up and use the shot clock: about 8% fewer possessions and closer games, an underdog’s friend.' },
    { v: 'Balanced', desc: 'League-average tempo.' },
    { v: 'Fast', desc: 'Push the ball after every miss: about 8% more possessions.' },
    { v: 'Seven seconds or less', desc: 'Run on everything, makes included, and shoot early in the clock (Phoenix, 2004–08): about 14% more possessions, more layups and early threes, a few more turnovers.' },
  ] },
  { k: 'off', label: 'Offense', desc: 'Your half-court system: who shoots, from where, and how the ball moves.', opts: [
    { v: 'Balanced', desc: 'A bit of everything: players take the shots their skills suggest.' },
    { v: 'Motion', desc: 'No set plays: constant passing, cutting and screening away from the ball, reading the defense (Golden State, San Antonio). More assists, shots spread across the lineup, fewer turnovers with good passers and smart players.' },
    { v: 'Pick and roll', desc: 'A ball handler and a screener attack every trip; the screener rolls to the rim or pops out. More layups and pull-up jumpers for your handler and your roll man. Best with a creator and a big who finishes.' },
    { v: 'Isolation', desc: 'Heliball: clear a side and let your best scorer go one-on-one. His usage soars; fewer assists and turnovers, more tough mid-range shots. Needs a true star.' },
    { v: 'Post-up', desc: 'Throw it inside and play through your bigs: more shots at the rim and short jumpers, more free throws, fewer threes, slower.' },
    { v: 'Triangle', desc: 'Tex Winter’s triangle (Chicago 1991–98, L.A. 2000–10): a sideline triangle, a post entry and reads off it. Everyone touches the ball and turnovers are rare, but it lives on post-ups and long twos, the least efficient shots in today’s game (about 0.9 points per shot against 1.05 for a three), and makes few threes. It works when your scorers are elite mid-range shooters (think Jordan or Kobe); for most modern rosters it costs points.' },
    { v: 'Princeton', desc: 'Backdoor cuts and high-post passing with everyone above the free-throw line (Princeton, Sacramento 2000s): easy assisted layups against aggressive defenders. Needs smart passers, bigs included; slow.' },
    { v: 'Flex', desc: 'A continuity offense of baseline screens and cuts repeated until a layup or open jumper comes. Few turnovers, good looks near the basket; predictable, and a bit slower.' },
    { v: 'Dribble drive', desc: 'Four out, one in: guards drive to the rim and kick out to the corners (Memphis college, Vance Walberg). Layups, corner threes and free throws; more turnovers. Needs quick guards.' },
    { v: 'Pace and space', label: 'Five-out', desc: 'All five players spread around the three-point line: many more threes, few mid-range shots, open driving lanes.' },
    { v: 'Moreyball', desc: 'Only layups and threes, no mid-range at all, with the star isolating (Houston 2018–20): about half your shots are threes. Great with shooters and a star; brutal without them.' },
  ] },
  { k: 'def', label: 'Defense', desc: 'How you guard: a man-to-man scheme against the pick and roll, a zone, or a junk defense.', opts: [
    { v: 'Switch', label: 'Switch everything', desc: 'Every screen is switched, so nobody is left open: takes away threes, but slow bigs get attacked on switches and the rim is softer.', how: 'Man-to-man' },
    { v: 'Drop', label: 'Drop coverage', desc: 'The big sags into the paint on the pick and roll: protects the rim, gives up pull-up mid-range jumpers and some threes. Best with a rim protector.', how: 'Man-to-man' },
    { v: 'Hedge', label: 'Hedge and recover', desc: 'The big jumps out at the ball handler, then races back: a few more turnovers, slightly more open threes. Needs mobile bigs.', how: 'Man-to-man' },
    { v: 'Blitz', desc: 'Trap the ball handler with two defenders off every screen: many more turnovers and their stars shoot less, but a 4-on-3 behind it leaks open threes.', how: 'Man-to-man' },
    { v: 'Ice', desc: 'Force side pick and rolls toward the baseline: fewer rim attacks and corner kick-outs; above-the-break threes and mid-range open up a little.', how: 'Man-to-man' },
    { v: 'Aggressive', label: 'Pressure', desc: 'Deny passes and gamble in the lanes: more steals, more fouls, some blow-bys to the rim.', how: 'Man-to-man' },
    { v: 'Pack line', desc: 'Everyone off the ball stays inside 16 feet (Virginia, Arizona): nobody drives, few fouls and few layups, but you force few turnovers and give up more threes.', how: 'Man-to-man' },
    { v: '2-3 zone', desc: 'Two up top, three along the baseline (Syracuse): packs the paint and hides poor perimeter defenders, but invites threes and gives up offensive rebounds.', how: 'Zone' },
    { v: '3-2 zone', desc: 'Three up top, two low: chases shooters off the line, opens the middle and the rim.', how: 'Zone' },
    { v: '1-3-1 zone', desc: 'A trapping zone: long, active wings force turnovers, but the corners are wide open.', how: 'Zone' },
    { v: 'Matchup zone', desc: 'A zone that guards man-to-man inside each area: a milder mix of both, a few more turnovers and rebounds lost.', how: 'Zone' },
    { v: 'Box-and-one', desc: 'A rare change-up: four in a box zone, one chaser face-guarding their best scorer (Toronto on Stephen Curry once Klay Thompson and Kevin Durant were out, 2019 Finals; on Jayson Tatum and Kemba Walker, 2020). It works only against a team with one real scoring threat; against a team with several scorers the other four shred the zone.', how: 'Junk defense' },
    { v: 'Wall', label: 'Build a wall', desc: 'Man-to-man, but all five collapse into the paint whenever their star drives, daring him to shoot (Toronto on Giannis Antetokounmpo, 2019). Crushing against a downhill star who can’t shoot; useless against one who can, and their shooters get open kick-outs.', how: 'Man-to-man' },
    { v: 'Triangle-and-two', desc: 'Two chasers on their two best scorers, three in a zone: slows both, but the other three get open shots.', how: 'Junk defense' },
  ] },
  { k: 'press', label: 'Press', desc: 'Pressure the inbound pass and the backcourt, all game.', opts: [
    { v: 'Off', desc: 'No press: get back and set your half-court defense.' },
    { v: '2-2-1 press', desc: 'A containing zone press that makes them walk it up: burns shot clock, so their half-court offense starts late and a little rushed. Few turnovers; NBA guards rarely get trapped.' },
    { v: '1-2-1-1 press', label: 'Diamond press', desc: 'A trapping press hunting turnovers (a college weapon): some steals and a faster game, but NBA ball handlers usually beat the first trap and the offense gets a numbers advantage and easy layups. Tiring.' },
    { v: 'Full-court man', label: 'Full-court pressure', desc: 'Pick up the ball handler for 94 feet, the modern NBA way (about 5% of possessions league-wide and rising): the goal is to take six or more seconds off the shot clock, not steals. Their offense starts late and rushed; tiring, and a few more fouls. Needs pesky, quick guards.' },
  ] },
  { k: 'reb', label: 'Rebounding', desc: 'After a shot: chase the offensive board or sprint back on defense.', opts: [
    { v: 'Crash the glass', desc: 'Send four to the offensive glass: more second chances, but when they get the rebound they run on you for easy baskets.' },
    { v: 'Balanced', desc: 'Your bigs crash, your guards get back.' },
    { v: 'Get back', desc: 'Everyone sprints back: fewer offensive rebounds, almost no fast-break baskets allowed.' },
  ] },
  { k: 'lineup', label: 'Lineups', desc: 'How big you play. The rotation still follows your minutes; this decides who plays together.', opts: [
    { v: 'Standard', desc: 'Two bigs or one, as the rotation falls.' },
    { v: 'Small ball', desc: 'At most one big on the floor: wings play the four and five (Golden State’s "death lineup"). Faster, more spacing and switching, weaker rebounding and rim protection.' },
    { v: 'Twin towers', desc: 'Two bigs together whenever you have them: own the glass and the paint, give up spacing and speed.' },
  ] },
  { k: 'focus', label: 'Emphasis', desc: 'Where the players put their energy.', opts: [
    { v: 'Balanced', desc: 'Equal effort at both ends.' },
    { v: 'Offense first', desc: 'Players save energy on defense for scoring: higher-scoring games. Pays off when your offense is better than your defense.' },
    { v: 'Defense first', desc: 'Grind on defense, take fewer risks on offense: lower-scoring games. Pays off when your defense is your strength.' },
  ] },
  { k: 'foul', label: 'Intentional fouls', desc: 'Fouling on purpose.', opts: [
    { v: 'Normal', desc: 'No intentional fouls.' },
    { v: 'Hack-a-Shaq', desc: 'Once they’re in the penalty, foul their worst free-throw shooter (below about 62%) away from the ball and make him earn it at the line. Not in the last two minutes of a quarter, when the rules give them a free throw and the ball.' },
  ] },
  { k: 'clutch', label: 'Clutch play', desc: 'The last 5 minutes of a close game: who takes the shots.', opts: [
    { v: 'Motion', desc: 'Keep running your offense.' },
    { v: 'Isolate the star', desc: 'Give the ball to your best player and get out of the way.' },
    { v: 'Pick and roll', desc: 'Your best ball handler and your best big run the pick and roll every trip.' },
    { v: 'Hot hand', desc: 'Feed whoever is scoring best tonight.' },
  ] },
];

// One-click playbooks from famous teams (they set several options at once; tweak from there).
export const PLAYBOOKS: { name: string; era: string; t: Tactics }[] = [
  { name: 'Seven seconds or less', era: 'Phoenix, 2004–08', t: { pace: 'Seven seconds or less', off: 'Pick and roll', def: 'Switch', press: 'Off', reb: 'Get back', lineup: 'Small ball', focus: 'Offense first' } },
  { name: 'Moreyball', era: 'Houston, 2018–20', t: { pace: 'Balanced', off: 'Moreyball', def: 'Switch', press: 'Off', reb: 'Get back', lineup: 'Small ball', focus: 'Balanced' } },
  { name: 'Death lineup', era: 'Golden State, 2015–19', t: { pace: 'Fast', off: 'Motion', def: 'Switch', press: 'Off', reb: 'Balanced', lineup: 'Small ball', focus: 'Balanced' } },
  { name: 'The beautiful game', era: 'San Antonio, 2013–14', t: { pace: 'Balanced', off: 'Motion', def: 'Ice', press: 'Off', reb: 'Get back', lineup: 'Standard', focus: 'Balanced' } },
  { name: 'Triangle', era: 'Chicago, 1991–98', t: { pace: 'Balanced', off: 'Triangle', def: 'Aggressive', press: 'Off', reb: 'Balanced', lineup: 'Standard', focus: 'Balanced' } },
  { name: 'Showtime', era: 'L.A., 1980s', t: { pace: 'Fast', off: 'Motion', def: 'Aggressive', press: 'Off', reb: 'Get back', lineup: 'Standard', focus: 'Offense first' } },
  { name: 'Grit and grind', era: 'Memphis, 2011–17', t: { pace: 'Slow', off: 'Post-up', def: 'Pack line', press: 'Off', reb: 'Crash the glass', lineup: 'Twin towers', focus: 'Defense first' } },
  { name: 'Bad Boys', era: 'Detroit, 1988–90', t: { pace: 'Slow', off: 'Post-up', def: 'Aggressive', press: 'Off', reb: 'Crash the glass', lineup: 'Standard', focus: 'Defense first' } },
  { name: 'Princeton', era: 'Princeton; Sacramento, 2000s', t: { pace: 'Slow', off: 'Princeton', def: 'Pack line', press: 'Off', reb: 'Get back', lineup: 'Standard', focus: 'Balanced' } },
  { name: 'Zone and bombs', era: 'Syracuse; Miami, 2020', t: { pace: 'Balanced', off: 'Pace and space', def: '2-3 zone', press: 'Off', reb: 'Get back', lineup: 'Standard', focus: 'Balanced' } },
  { name: 'Grinnell system', era: 'Grinnell College (a college style: brutal in the NBA)', t: { pace: 'Seven seconds or less', off: 'Pace and space', def: 'Aggressive', press: '1-2-1-1 press', reb: 'Crash the glass', lineup: 'Small ball', focus: 'Offense first' } },
];

export const TAC_DEFAULT: Required<Tactics> = { pace: 'Balanced', off: 'Balanced', def: 'Switch', press: 'Off', reb: 'Balanced', lineup: 'Standard', focus: 'Balanced', foul: 'Normal', clutch: 'Motion' };
export const optOf = (k: keyof Tactics, v?: string) => TACTIC_GROUPS.find(g => g.k === k)?.opts.find(x => x.v === v);
export const optLabel = (k: keyof Tactics, v?: string) => { const o = optOf(k, v); return o ? o.label || o.v : v || ''; };

// Older saves used Inside / Perimeter; they're Post-up and Five-out now.
export function migrateTactics(t: any) {
  if (!t || typeof t !== 'object') return t;
  if (t.off === 'Inside') t.off = 'Post-up';
  if (t.off === 'Perimeter') t.off = 'Pace and space';
  return t;
}

// What a roster needs to run some options (God Mode ignores locks).
export function tacticUnlocks(n: (role: string) => number) {
  const sh = n('Floor spacer') + n('Stretch big'), cr = n('Primary creator'), poa = n('Point-of-attack defender');
  return {
    'Pace and space': [sh >= 3, '3+ floor spacers or stretch bigs'],
    Moreyball: [sh >= 3 && cr + n('Slasher') >= 1, '3+ floor spacers and a creator or slasher'],
    Isolation: [cr >= 1, 'a primary creator'],
    'Isolate the star': [cr >= 1, 'a primary creator'],
    'Dribble drive': [n('Slasher') + cr >= 2, '2+ slashers or creators'],
    Princeton: [n('Connector') + cr >= 2, '2+ connectors or creators'],
    Triangle: [n('Connector') >= 2, '2+ connectors'],
    Aggressive: [poa >= 2, '2+ point-of-attack defenders'],
    Blitz: [poa >= 1, 'a point-of-attack defender'],
    '1-2-1-1 press': [poa >= 2, '2+ point-of-attack defenders'],
    'Full-court man': [poa >= 2, '2+ point-of-attack defenders'],
    Fast: [n('Slasher') + cr >= 2, '2+ slashers or creators'],
    'Seven seconds or less': [n('Slasher') + cr >= 2 && sh >= 2, '2+ slashers or creators and 2+ shooters'],
    Drop: [n('Rim protector') >= 1, 'a rim protector'],
    'Twin towers': [n('Rim protector') + n('Rebounder') >= 2, '2+ rim protectors or rebounders'],
  } as Record<string, [boolean, string]>;
}

// ── Engine effects ──────────────────────────────────────────────────────────────────────────
// Per possession, from the offense's and the defense's tactics and the ten players on the floor.
export interface TacFx {
  dt: number; tov: number; nsf: number; trip: number; ast: number; orb: number; useExp: number;
  prof: Partial<Record<Z, number>>; pct: Record<Z, number>;
  use: Map<any, number>; pctP: Map<any, number>;
}
const add = (o: Record<Z, number>, d: Partial<Record<Z, number>>, k = 1) => { for (const z of ZS) if (d[z]) o[z] += d[z]! * k; };
const mul = (o: Partial<Record<Z, number>>, d: Partial<Record<Z, number>>) => { for (const z of ZS) if (d[z]) o[z] = (o[z] ?? 1) * d[z]!; };
const avgOf = (ps: any[], f: (p: any) => number) => ps.length ? ps.reduce((a, p) => a + f(p), 0) / ps.length : 50;

export function tacticEffects(tO: Tactics, tD: Tactics, onO: any[], onD: any[], useOf: (p: any) => number): TacFx {
  const fx: TacFx = { dt: 1, tov: 0, nsf: 1, trip: 1, ast: 1, orb: 0, useExp: 1, prof: {}, pct: { rim: 0, mid: 0, c3: 0, atb: 0 }, use: new Map(), pctP: new Map() };
  const um = (p: any, x: number) => fx.use.set(p, (fx.use.get(p) ?? 1) * x), pm = (p: any, x: number) => fx.pctP.set(p, (fx.pctP.get(p) ?? 0) + x);
  const byUse = onO.slice().sort((a, b) => useOf(b) - useOf(a)), star = byUse[0];
  const oiq = avgOf(onO, p => p.r.oiq), pss = avgOf(onO, p => p.r.pss), bigsO = onO.filter(p => p.grp === 'B'), bigsD = onD.filter(p => p.grp === 'B');
  const handler = onO.reduce((a, p) => (p.r.drb + p.r.pss > a.r.drb + a.r.pss ? p : a), onO[0]);
  const roller = (bigsO.length ? bigsO : onO.filter(p => p !== handler)).reduce((a, p) => ((p.r.dnk + (p.r.lay ?? p.r.dnk)) > (a.r.dnk + (a.r.lay ?? a.r.dnk)) ? p : a));

  // Pace (the offense's clock).
  if (tO.pace === 'Slow') fx.dt *= 1.08;
  if (tO.pace === 'Fast') fx.dt *= 0.92;
  if (tO.pace === 'Seven seconds or less') { fx.dt *= 0.87; mul(fx.prof, { rim: 1.06, atb: 1.06, mid: 0.9 }); fx.tov += 0.004; }

  // Offensive system.
  switch (tO.off) {
    case 'Motion': fx.ast *= 1.1; fx.useExp = 0.75; fx.tov += -0.003 - 0.0006 * (pss - 55); add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, -0.001 + 0.0004 * (oiq - 55)); fx.dt *= 1.03; break;
    case 'Pick and roll': mul(fx.prof, { rim: 1.12, mid: 1.1, c3: 0.9 }); um(handler, 1.2); um(roller, 1.15);
      add(fx.pct, { rim: 0.004 + 0.0004 * (handler.r.pss - 60) + 0.0004 * (roller.r.dnk - 60), mid: 0.0003 * (handler.r.fg - 60) }); break;
    case 'Isolation': um(star, 1.7); fx.ast *= 0.8; fx.tov -= 0.005; mul(fx.prof, { mid: 1.2, c3: 0.85 }); pm(star, 0.0005 * (star.ovr - 70)); fx.dt *= 1.06; break;
    case 'Post-up': mul(fx.prof, { rim: 1.2, mid: 1.15, atb: 0.8, c3: 0.85 }); bigsO.forEach(p => um(p, 1.35)); fx.trip *= 1.15; fx.ast *= 0.92; fx.dt *= 1.06;
      add(fx.pct, { rim: 0.0004 * (avgOf(bigsO, p => p.r.ins) - 60) }); break;
    case 'Triangle': { const fgA = avgOf(onO, p => p.r.fg), starFg = byUse[0].r.fg; mul(fx.prof, { mid: 1.35, rim: 1.05, atb: 0.75, c3: 0.9 }); fx.ast *= 1.08; fx.useExp = 0.85; fx.tov += -0.006 + 0.0006 * (55 - oiq); fx.dt *= 1.05;
      // Long twos only pay with elite mid-range shooters (and the star's pull-up game).
      add(fx.pct, { mid: 0.0009 * (fgA - 60) + 0.0004 * (starFg - 65) + 0.0003 * (oiq - 55), rim: 0.002 }); break; }
    case 'Princeton': mul(fx.prof, { rim: 1.15, mid: 1.05, atb: 0.9 }); fx.ast *= 1.12; fx.dt *= 1.08; fx.tov += -0.003 + 0.0005 * (55 - oiq);
      add(fx.pct, { rim: -0.002 + 0.0008 * (oiq - 55) + 0.0004 * (avgOf(bigsO, p => p.r.pss) - 50) }); break;
    case 'Flex': mul(fx.prof, { rim: 1.1, mid: 1.1, c3: 0.95, atb: 0.85 }); fx.ast *= 1.06; fx.dt *= 1.05; fx.tov -= 0.004; add(fx.pct, { rim: 0.003 }); break;
    case 'Dribble drive': mul(fx.prof, { rim: 1.15, c3: 1.15, mid: 0.8 }); fx.trip *= 1.08; fx.tov += 0.01; onO.filter(p => p.grp === 'G').forEach(p => um(p, 1.15));
      add(fx.pct, { rim: 0.0004 * (avgOf(onO.filter(p => p.grp === 'G'), p => (p.r.acc ?? p.r.spd)) - 60) }); break;
    case 'Pace and space': mul(fx.prof, { atb: 1.25, c3: 1.3, mid: 0.7, rim: 0.9 }); add(fx.pct, { rim: 0.006 }); break;
    case 'Moreyball': mul(fx.prof, { rim: 1.18, c3: 1.32, atb: 1.32, mid: 0.4 }); um(star, 1.35); fx.ast *= 0.9; fx.trip *= 1.08; break;
  }

  // Spacing: defenders ignore players who can't shoot and pack the paint, which chokes the systems
  // built on spreading the floor (a Moreyball team without shooters gets nothing at the rim).
  const tpO = avgOf(onO, p => p.r.tp), cramp = Math.max(0, 52 - tpO) / 10;
  if (cramp > 0 && ['Pace and space', 'Moreyball', 'Dribble drive', 'Pick and roll', 'Motion'].includes(tO.off || '')) add(fx.pct, { rim: -0.014 * cramp, c3: -0.006 * cramp, atb: -0.006 * cramp, mid: -0.004 * cramp }, tO.off === 'Pick and roll' || tO.off === 'Motion' ? 0.5 : tO.off === 'Moreyball' ? 1.5 : 1);
  if (tO.pace === 'Seven seconds or less' && cramp > 0) add(fx.pct, { rim: -0.006 * cramp, atb: -0.004 * cramp });
  // Lineups: small ball gives up the glass and the rim; twin towers crowd the paint and close out slowly.
  if (tO.lineup === 'Small ball') fx.orb -= 0.02;
  if (tD.lineup === 'Small ball') { fx.orb += 0.03; add(fx.pct, { rim: 0.015 }); }
  if (tO.lineup === 'Twin towers') { fx.orb += 0.02; add(fx.pct, { rim: -0.006, atb: -0.003 }); }
  if (tD.lineup === 'Twin towers') { fx.orb -= 0.015; add(fx.pct, { rim: -0.01, c3: 0.006, atb: 0.006 }); }

  // Defensive scheme (effects are on the offense's shots: minus helps the defense).
  const spdBigD = avgOf(bigsD, p => p.r.spd), hgtD = avgOf(onD, p => p.r.hgt), diqD = avgOf(onD, p => p.r.diq);
  const zoneOrb = (x: number) => (fx.orb += x);
  switch (tD.def) {
    case 'Switch': add(fx.pct, { c3: -0.012, atb: -0.012, rim: 0.008 + 0.0004 * (55 - spdBigD), mid: 0.004 }); break;
    case 'Drop': add(fx.pct, { mid: 0.022, atb: 0.006, rim: -0.02 - 0.0003 * (avgOf(bigsD, p => p.r.hgt) - 60) }); mul(fx.prof, { mid: 1.1 }); break;
    case 'Hedge': fx.tov += 0.006; add(fx.pct, { atb: 0.006, c3: 0.004, mid: -0.006, rim: -0.004 - 0.0003 * (spdBigD - 50) }); fx.nsf *= 1.05; break;
    case 'Blitz': fx.tov += 0.02; add(fx.pct, { c3: 0.02, atb: 0.015, rim: 0.006 }); um(star, 0.8); fx.ast *= 1.08; fx.nsf *= 1.1; break;
    case 'Ice': add(fx.pct, { rim: -0.01, c3: -0.008, atb: 0.008, mid: 0.006 }); break;
    case 'Aggressive': fx.tov += 0.016; fx.trip *= 1.15; fx.nsf *= 1.25; add(fx.pct, { rim: 0.006 }); break;
    case 'Pack line': add(fx.pct, { rim: -0.018, mid: -0.004, c3: 0.01, atb: 0.01 }); mul(fx.prof, { rim: 0.92, atb: 1.08, c3: 1.08 }); fx.tov -= 0.006; fx.trip *= 0.9; fx.nsf *= 0.9; break;
    case '2-3 zone': mul(fx.prof, { rim: 0.85, c3: 1.15, atb: 1.12 }); add(fx.pct, { rim: -0.02 - 0.0003 * (hgtD - 60), mid: 0.008, c3: 0.018, atb: 0.012 }); zoneOrb(0.03); fx.trip *= 0.85; fx.nsf *= 0.85; fx.tov += 0.004; break;
    case '3-2 zone': mul(fx.prof, { c3: 0.9, atb: 0.85, rim: 1.1, mid: 1.1 }); add(fx.pct, { atb: -0.012, c3: -0.008, mid: 0.006, rim: 0.01 }); zoneOrb(0.015); break;
    case '1-3-1 zone': fx.tov += 0.012 + 0.0006 * (avgOf(onD, p => (p.r.ape ?? 4)) - 4) * 10 / 4; mul(fx.prof, { c3: 1.2 }); add(fx.pct, { c3: 0.022, atb: -0.01, mid: -0.006, rim: 0.002 }); zoneOrb(0.025); break;
    case 'Matchup zone': fx.tov += 0.006; add(fx.pct, { c3: 0.005, atb: 0.005, rim: -0.012 }); zoneOrb(0.012); break;
    case 'Box-and-one': { const second = byUse[1] || star, k = Math.max(0.15, Math.min(1, (useOf(star) / Math.max(0.01, useOf(second)) - 1.05) / 0.5)); // one lone scorer → works
      um(star, 1 - 0.45 * k); pm(star, -0.035 * k); onO.forEach(p => p !== star && pm(p, 0.006 + 0.012 * (1 - k))); add(fx.pct, { mid: 0.006 }); zoneOrb(0.015); break; }
    case 'Wall': { const sTp = star.r.tp, k = Math.max(-0.6, Math.min(1, (58 - sTp) / 20)); // a downhill star who can't shoot → works
      pm(star, -0.03 * k); um(star, 1 - 0.12 * Math.max(0, k)); onO.forEach(p => p !== star && pm(p, 0.008)); add(fx.pct, { c3: 0.004, atb: 0.004 }); break; }
    case 'Triangle-and-two': byUse.slice(0, 2).forEach(p => { um(p, 0.7); pm(p, -0.022); }); byUse.slice(2).forEach(p => pm(p, 0.014)); zoneOrb(0.015); break;
  }
  // Better defenders run any scheme a little better.
  if (tD.def && tD.def !== 'Switch') add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, -0.0002 * (diqD - 55));

  // Press (the defense's), scaled by how quick the pressing team is.
  const qk = (avgOf(onD, p => (p.r.spd + (p.r.acc ?? p.r.spd)) / 2) - 55) / 10;
  if (tD.press === '2-2-1 press') { fx.tov += 0.003 + 0.002 * qk; fx.dt *= 1.04; add(fx.pct, { rim: -0.002, mid: -0.004, c3: -0.003, atb: -0.003 }); }
  if (tD.press === '1-2-1-1 press') { fx.tov += 0.012 + 0.004 * qk; fx.dt *= 0.94; add(fx.pct, { rim: 0.022, c3: 0.006 }); fx.nsf *= 1.15; }
  if (tD.press === 'Full-court man') { fx.tov += 0.004 + 0.003 * qk; fx.dt *= 1.03; add(fx.pct, { rim: -0.003 + 0.002 * -qk, mid: -0.006, c3: -0.005, atb: -0.005 }, 1); fx.nsf *= 1.12; }
  // Pressing all game tires your own legs on the other end.
  if (tO.press && tO.press !== 'Off') add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, -0.004 - 0.0004 * (55 - avgOf(onO, p => p.r.endu)));

  // Rebounding (offense's choice) and transition (the defense's "get back").
  if (tO.reb === 'Crash the glass') fx.orb += 0.04;
  if (tO.reb === 'Get back') fx.orb -= 0.03;
  if (tD.reb === 'Get back') { add(fx.pct, { rim: -0.012, atb: -0.003 }); mul(fx.prof, { rim: 0.95 }); }

  // Lineups beyond who's on the floor.
  if (tO.lineup === 'Small ball') fx.dt *= 0.97;

  // Emphasis: effort moves from one end to the other, scaled by where the talent is.
  const oiqD = avgOf(onD, p => p.r.oiq);
  if (tO.focus === 'Offense first') { add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, 0.008 * oiq / 55); fx.dt *= 0.98; }
  if (tO.focus === 'Defense first') add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, -0.006 * oiq / 55);
  if (tD.focus === 'Offense first') add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, 0.008 * diqD / 55);
  if (tD.focus === 'Defense first') add(fx.pct, { rim: 1, mid: 1, c3: 1, atb: 1 }, -0.008 * diqD / 55 + 0 * oiqD);
  return fx;
}

// ── Fit ─────────────────────────────────────────────────────────────────────────────────────
// How well each setting suits the top eight players (about −1.5 to +1.5 each, roughly points per
// 100 possessions). Shown on the Tactics screen and used by the staff when they pick for you.
export function tacticFitParts(top: any[], t: Tactics): Record<string, number> {
  if (!top.length) return {};
  const av = (k: string) => top.reduce((a, p) => a + (p.r[k] ?? 50), 0) / top.length;
  const bigs = top.filter(p => p.grp === 'B'), guards = top.filter(p => p.grp === 'G');
  const avIn = (ps: any[], k: string, d = 45) => ps.length ? ps.reduce((a, p) => a + (p.r[k] ?? 50), 0) / ps.length : d;
  const star = top.reduce((a, p) => (p.ovr > a.ovr ? p : a), top[0]);
  const tp = av('tp'), ins = (av('ins') + av('dnk')) / 2, spd = (av('spd') + av('endu')) / 2, pss = av('pss'), oiq = av('oiq'), diq = av('diq'), hgt = av('hgt');
  const ape = top.reduce((a, p) => a + (p.r.ape ?? 4), 0) / top.length;
  const c = (x: number) => Math.max(-1.5, Math.min(1.5, x));
  const out: Record<string, number> = {};
  out.pace = c(({ Fast: (spd - 55) / 10 * .4, 'Seven seconds or less': (spd - 57) / 10 * .5 + (tp - 57) / 10 * .3, Slow: (55 - spd) / 10 * .3 } as any)[t.pace || ''] ?? 0);
  out.off = c(({
    Motion: (pss - 55) / 10 * .5 + (oiq - 55) / 10 * .3 - (star.ovr - 72) / 10 * .2,
    'Pick and roll': ((star.r.drb + star.r.pss) / 2 - 60) / 10 * .4 + (avIn(bigs, 'dnk') - 58) / 10 * .3,
    Isolation: (star.ovr - 70) / 10 * .7 + (star.r.drb - 62) / 10 * .2 - (pss - 55) / 10 * .2,
    'Post-up': (avIn(bigs, 'ins') - 60) / 10 * .5 + (avIn(bigs, 'stre') - 58) / 10 * .2 - (tp - 55) / 10 * .2,
    Triangle: (av('fg') - 62) / 10 * .6 + (star.r.fg - 70) / 10 * .3 + (oiq - 58) / 10 * .3 - (tp - 58) / 10 * .2,
    Princeton: (oiq - 58) / 10 * .5 + (avIn(bigs, 'pss') - 50) / 10 * .3,
    Flex: (oiq - 55) / 10 * .2 + (ins - 55) / 10 * .2,
    'Dribble drive': (avIn(guards, 'acc', 50) - 60) / 10 * .4 + (tp - 55) / 10 * .3 + (avIn(guards, 'drb', 50) - 60) / 10 * .2,
    'Pace and space': (tp - 55) / 10 * .8,
    Moreyball: (tp - 57) / 10 * .8 + (ins - 57) / 10 * .3 + (star.ovr - 72) / 10 * .2 - (av('fg') - 55) / 10 * .2,
  } as any)[t.off || ''] ?? 0);
  const perim = (diq + av('spd')) / 2;
  out.def = c(({
    Switch: (av('spd') - 55) / 10 * .3 + (avIn(bigs, 'spd') - 50) / 10 * .2,
    Drop: (avIn(bigs, 'hgt') - 62) / 10 * .3 + (avIn(bigs, 'diq') - 55) / 10 * .2,
    Hedge: (avIn(bigs, 'spd') - 52) / 10 * .3 + (diq - 55) / 10 * .1,
    Blitz: (diq - 57) / 10 * .3 + (av('spd') - 57) / 10 * .2,
    Ice: (diq - 55) / 10 * .3,
    Aggressive: (diq - 57) / 10 * .3 + (av('stl') - 55) / 10 * .3 + (ape - 4) / 4 * .2, // gambling for steals: quick hands first
    'Pack line': (avIn(bigs, 'hgt') - 60) / 10 * .2 + (55 - perim) / 10 * .2,
    '2-3 zone': (hgt - 60) / 10 * .3 + (55 - perim) / 10 * .3 - .1,
    '3-2 zone': (perim - 57) / 10 * .3 - .1,
    '1-3-1 zone': (ape - 4) / 4 * .3 + (diq - 57) / 10 * .2 - .1,
    'Matchup zone': (diq - 58) / 10 * .3 - .05,
    'Box-and-one': -.1, 'Triangle-and-two': -.15, Wall: -.05,
  } as any)[t.def || ''] ?? 0);
  out.press = c(({ '2-2-1 press': (av('spd') - 55) / 10 * .2, '1-2-1-1 press': (av('spd') - 58) / 10 * .5 + (av('endu') - 57) / 10 * .3, 'Full-court man': (av('spd') - 58) / 10 * .4 + (av('endu') - 57) / 10 * .3 + (diq - 57) / 10 * .1 } as any)[t.press || ''] ?? 0);
  out.reb = c(t.reb === 'Crash the glass' ? (av('reb') - 55) / 10 * .5 - (spd - 55) / 10 * .1 : t.reb === 'Get back' ? (55 - av('reb')) / 10 * .3 + (spd - 55) / 10 * .1 : 0);
  out.lineup = c(t.lineup === 'Small ball' ? (top.filter(p => p.grp === 'W').length - 3) * .25 + (tp - 55) / 10 * .3 - (bigs.length > 3 ? .3 : 0) : t.lineup === 'Twin towers' ? (bigs.length - 3) * .25 + (avIn(bigs, 'reb') - 58) / 10 * .3 - (tp - 55) / 10 * .2 : 0);
  out.focus = c(t.focus === 'Offense first' ? (oiq - diq) / 10 * .5 : t.focus === 'Defense first' ? (diq - oiq) / 10 * .5 : 0);
  return out;
}
export const tacticFit = (top: any[], t: Tactics) => Math.max(-3, Math.min(3, Object.values(tacticFitParts(top, t)).reduce((a, b) => a + b, 0)));

// The staff's pick: the best-fitting option in each setting (they add up independently).
export function bestTacticsFor(top: any[], cur: Tactics) {
  const t: Tactics = { ...TAC_DEFAULT, ...cur };
  for (const g of TACTIC_GROUPS) {
    if (g.k === 'foul' || g.k === 'clutch') continue;
    let best = t[g.k], hi = -1e9;
    for (const o of g.opts) { const f = tacticFitParts(top, { ...t, [g.k]: o.v })[g.k] ?? 0; if (f > hi + 0.02) { hi = f; best = o.v; } }
    (t as any)[g.k] = best;
  }
  return t;
}

// ── Practice reps ───────────────────────────────────────────────────────────────────────────
// A system is practised every day: players who play in it grow a little faster in the skills it
// uses (a Moreyball team gets up thousands of threes). Extra growth share per rating, on top of
// the training focus; only when a player is improving, and less for players who barely play.
const REPS: Record<string, Record<string, number>> = {
  'Seven seconds or less': { endu: .3, spd: .15, tp: .1 }, Fast: { endu: .2, spd: .1 }, Slow: { oiq: .1 },
  Motion: { pss: .25, oiq: .25 }, 'Pick and roll': { drb: .2, pss: .2, dnk: .15 }, Isolation: { drb: .3, fg: .2 }, 'Post-up': { ins: .35, stre: .15 },
  Triangle: { oiq: .25, fg: .25, pss: .15 }, Princeton: { oiq: .3, pss: .25, lay: .1 }, Flex: { ins: .15, fg: .15, oiq: .1 }, 'Dribble drive': { acc: .2, lay: .25, drb: .15 },
  'Pace and space': { tp: .35 }, Moreyball: { tp: .35, lay: .2, dnk: .1 },
  Switch: { spd: .1, diq: .1 }, Drop: { diq: .15 }, Hedge: { spd: .1, diq: .1 }, Blitz: { diq: .15, acc: .15 }, Ice: { diq: .15 }, Aggressive: { stl: .2, diq: .1, acc: .15 },
  'Pack line': { diq: .2 }, '2-3 zone': { diq: .1, reb: .1 }, '3-2 zone': { diq: .1, spd: .05 }, '1-3-1 zone': { diq: .15, acc: .1 }, 'Matchup zone': { diq: .2 },
  '2-2-1 press': { spd: .1, endu: .1 }, '1-2-1-1 press': { spd: .15, endu: .25, acc: .1 }, 'Full-court man': { spd: .15, endu: .25, diq: .1 }, Wall: { diq: .15 },
  'Crash the glass': { reb: .25, box: .2 }, 'Get back': { spd: .1 }, 'Small ball': { spd: .1, tp: .1 }, 'Twin towers': { reb: .15, ins: .1 },
};
export function tacticReps(t: Tactics | null | undefined): Record<string, number> {
  const out: Record<string, number> = {};
  if (!t) return out;
  for (const g of TACTIC_GROUPS) { if (g.k === 'clutch' || g.k === 'foul') continue; const r = REPS[(t as any)[g.k]]; if (r) for (const k in r) out[k] = (out[k] || 0) + r[k]; }
  return out;
}
// How much of a system's reps a player can absorb in one rating (0.1–1): a skill he's already
// decent at grows with practice; one he has no feel for barely moves. Bigs have less touch from
// three and guards less size-based skill, whatever they practise.
export function repAffinity(p: any, k: string) {
  const cur = p.r?.[k] ?? 50, base = Math.max(0.1, Math.min(1, (cur - 30) / 35));
  const bodyCap = (k === 'tp' || k === 'drb') && p.grp === 'B' ? 0.5 : (k === 'ins' || k === 'reb' || k === 'box') && p.grp === 'G' ? 0.6 : 1;
  return base * bodyCap;
}
