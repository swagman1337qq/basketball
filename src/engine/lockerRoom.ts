// The locker room: a team's morale, from how happy the players are, veteran leadership,
// winning, and the people who poison it (selfish scorers, volatile players who are unhappy,
// stars who want out). A good room helps a little on the court, keeps players happier and
// helps young players grow; a toxic one does the opposite.
// Mentoring: veterans with good habits (Professional, Team player) can rub off on young
// players, slowly and rarely. You can pair a mentor with a young player yourself (much
// stronger than informal leadership). See mentorTick for the odds.
import type { Game } from './Game';
import { yosOf } from './cba';

export const NEGATIVE = ['padder', 'volatile', 'alpha', 'touches'];
export const POSITIVE = ['pro', 'team'];
export const MENTOR_AGE = 29,
  MENTEE_AGE = 25,
  MENTOR_MAX = 2;
const TL: Record<string, string> = {
  padder: 'Selfish',
  volatile: 'Volatile',
  alpha: 'Egotistic',
  touches: 'Ball-dominant',
  pro: 'Professional',
  team: 'Team player',
};

// The hierarchy (2026-11-13): every player's standing in the room, from how good he is, his place among his
// teammates, his years in the league and age. A star veteran outweighs a bench veteran; a young star counts for
// less until he's been around. The top of it is the team leader. Big personalities pull the young players
// (25 and under, the open-minded more) their way: good habits from Professionals and Team players, bad ones
// (Egotistic, Selfish, Ball-dominant) from stars who have them.
export const BAD_SPREAD = ['alpha', 'padder', 'touches'];
export function stature(g: Game, p: any, rank: number): number {
  const ovrF = Math.max(0, Math.min(1.2, (p.ovr - 45) / 18)),
    rankF = rank === 0 ? 0.5 : rank <= 2 ? 0.25 : 0,
    yos = Math.min(12, yosOf(g, p)) / 12,
    ageF = p.age >= 29 ? 0.2 : p.age >= 26 ? 0.1 : 0;
  const v = ovrF + rankF + yos * 0.6 + ageF;
  return +(p.age <= 23 ? v * 0.6 : v).toFixed(2); // about 0 (a fringe rookie) to 2.5 (a veteran superstar)
}
// A good example: a veteran leader (29+, Professional or Team player), or a 26–28-year-old with the same habits who
// stands high in the room (a young star who carries himself right).
export const isGoodInfluence = (p: any, st: number) =>
  !!p && (p.pers?.pro || p.pers?.team) && !p.pers?.padder && !p.pers?.volatile && (p.age >= 29 || (p.age >= 26 && st >= 1.2));
export const isBadInfluence = (p: any) => !!p && p.age >= 26 && BAD_SPREAD.some(k => p.pers?.[k]) && !p.pers?.pro;
export interface Standing {
  id: number;
  st: number;
  role: 'Team leader' | 'Voice in the room' | 'Veteran' | 'Rotation' | 'Young player';
  influence: 'good' | 'bad' | 'none';
}
export function hierarchy(g: Game, s: any, tid: number, rosters = s.rosters): Standing[] {
  const P = g.db.P,
    ids: number[] = (rosters[tid] || []).filter((id: number) => P[id]);
  const byOvr = ids.slice().sort((a, b) => P[b].ovr - P[a].ovr);
  const out = ids
    .map(id => ({ id, st: stature(g, P[id], byOvr.indexOf(id)) }))
    .sort((a, b) => b.st - a.st)
    .map((x, i) => {
      const p = P[x.id];
      const influence: Standing['influence'] = isGoodInfluence(p, x.st) ? 'good' : isBadInfluence(p) && x.st >= 1 ? 'bad' : 'none';
      const role: Standing['role'] =
        i === 0 && x.st >= 1
          ? 'Team leader'
          : i <= 2 && x.st >= 1.1
            ? 'Voice in the room'
            : p.age <= 25
              ? 'Young player'
              : p.age >= 29
                ? 'Veteran'
                : 'Rotation';
      return { ...x, role, influence };
    });
  return out;
}
const stF = (st: number) => Math.max(0.6, Math.min(1.6, 0.6 + 0.4 * st)); // how strongly his example carries

export const isLeader = (p: any) => !!p && p.age >= MENTOR_AGE && (p.pers?.pro || p.pers?.team) && !p.pers?.padder && !p.pers?.volatile;
export const isMentee = (p: any) => !!p && p.age <= MENTEE_AGE;

export interface Room {
  score: number;
  label: string;
  color: string;
  factors: [string, number][];
  leaders: number[];
  trouble: number[];
}
const cache = new WeakMap<object, Map<string, Room>>();

export function lockerRoom(g: Game, s: any, tid: number, rosters = s.rosters): Room {
  const T = s.teams[tid],
    key = tid + ':' + (T.w + T.l) + ':' + s.day + ':' + (rosters[tid] || []).join(',');
  let m = cache.get(rosters);
  if (!m) {
    m = new Map() as any;
    cache.set(rosters, m!);
  }
  const hit = (m as any).get(key);
  if (hit) return hit;
  const P = g.db.P,
    ids: number[] = (rosters[tid] || []).filter((id: number) => P[id]);
  const rot = ids.slice(0, 10),
    f: [string, number][] = [],
    leaders: number[] = [],
    trouble: number[] = [];
  const moods = new Map(ids.map((id, i) => [id, g.moodOf(P[id], i, { ...s, rosters }, tid, true).hap]));
  const avg = rot.reduce((a, id) => a + (moods.get(id) ?? 55), 0) / Math.max(1, rot.length);
  f.push(['Player happiness', Math.round((avg - 55) * 0.6)]);
  const gp = T.w + T.l;
  if (gp >= 5) f.push(['Winning', Math.round((g.pct(T) - 0.5) * 30)]);
  // Veteran leaders by age, as before the hierarchy: the room's score (it feeds the games, `chem`) is unchanged; the
  // hierarchy decides who the young players follow (mentorTick), not how good the room is.
  ids
    .filter(id => isLeader(P[id]))
    .sort((a, b) => P[b].age - P[a].age)
    .slice(0, 3)
    .forEach(id => {
      leaders.push(id);
      f.push(['Veteran leader: ' + P[id].name, P[id].pers.pro && P[id].pers.team ? 8 : 6]);
    });
  const rank = ids.slice().sort((a, b) => P[b].ovr - P[a].ovr);
  rot.forEach(id => {
    const p = P[id],
      h = moods.get(id) ?? 55;
    if (p.pers.padder) {
      trouble.push(id);
      f.push(['Selfish: ' + p.name, -6]);
    } else if (p.pers.volatile && h < 45) {
      trouble.push(id);
      f.push(['Volatile and unhappy: ' + p.name, -5]);
    } else if (h < 30) {
      trouble.push(id);
      f.push(['Wants out: ' + p.name, -4]);
    } else if (p.pers.alpha && rank[0] !== id) f.push(['Wants to be the No. 1 option: ' + p.name, -3]);
  });
  const score = Math.round(Math.max(0, Math.min(100, 50 + f.reduce((a, x) => a + x[1], 0))));
  const room: Room = {
    score,
    label: score >= 80 ? 'Great' : score >= 62 ? 'Good' : score >= 45 ? 'Okay' : score >= 30 ? 'Tense' : 'Toxic',
    color: score >= 62 ? 'var(--gm-good)' : score < 45 ? 'var(--gm-bad)' : 'var(--color-text)',
    factors: f.filter(x => x[1] !== 0),
    leaders,
    trouble,
  };
  (m as any).set(key, room);
  return room;
}

// Who is mentoring whom on a team: your pairings first, then team leaders informally.
export function mentorOf(g: Game, s: any, tid: number, pid: number, rosters = s.rosters): { mentor: number | null; paired: boolean } {
  const P = g.db.P,
    ids: number[] = rosters[tid] || [],
    club = g.clubOf(s, tid),
    set = club?.mentors || {};
  const m = set[pid];
  if (m != null && ids.includes(m) && isLeader(P[m])) return { mentor: m, paired: true };
  const H = hierarchy(g, s, tid, rosters),
    lead = H.find(x => x.id !== pid && x.influence === 'good')?.id; // informally: the good example highest in the hierarchy
  return { mentor: lead ?? null, paired: false };
}

// Monthly: personalities change, rarely. How much a player can change depends on his hidden
// malleability (0–100): the fiercely independent almost never do, the impressionable can.
// Young players change more. Mentors help shed bad habits and pass on good ones; the room
// itself pushes too: a bad locker room breeds egos, a great one breeds team players.
const malF = (p: any) => Math.pow((p.pers.mal ?? 50) / 100, 2) * 2.5; // 90 → 2.0, 50 → 0.63, 20 → 0.1
const ageF = (a: number) => (a <= 22 ? 1.3 : a <= 25 ? 1 : a <= 29 ? 0.6 : 0.3);
export function mentorTick(g: Game, s: any, rosters: any): Record<number, string[]> {
  const P = g.db.P,
    out: Record<number, string[]> = {};
  Object.keys(rosters).forEach(k => {
    const tid = +k,
      room = lockerRoom(g, s, tid, rosters),
      roomF = 0.5 + room.score / 100,
      H = hierarchy(g, s, tid, rosters),
      stOf = (id: number) => H.find(x => x.id === id)?.st ?? 0,
      badBig = H.find(x => x.influence === 'bad'); // the biggest bad influence in the room
    rosters[k].forEach((id: number) => {
      const p = P[id];
      if (!p?.pers) return;
      const m = malF(p) * ageF(p.age);
      let note = '';
      if (isMentee(p)) {
        const { mentor, paired } = mentorOf(g, s, tid, id, rosters),
          M = mentor != null ? P[mentor] : null;
        const f = (paired ? 1 : M ? 0.45 : 0) * roomF * m * (M ? stF(stOf(mentor!)) : 1); // informal: 0.3 before the hierarchy (2026-11-13)
        if (M) {
          for (const t of NEGATIVE.filter(t => p.pers[t])) {
            if (Math.random() < 0.012 * f) {
              p.pers[t] = false;
              note = p.name + ' is no longer ' + TL[t] + ', thanks to ' + M.name + '’s mentoring';
              break;
            }
          }
          if (!note)
            for (const t of POSITIVE) {
              if (!M.pers[t] || p.pers[t] || (t === 'team' && (p.pers.alpha || p.pers.padder))) continue;
              if (Math.random() < 0.008 * f) {
                p.pers[t] = true;
                note = p.name + ' picked up ' + M.name + '’s habits: now a ' + TL[t];
                break;
              }
            }
        }
      }
      // A star with bad habits pulls the young players his way (a mentor you paired holds that back).
      if (!note && isMentee(p) && badBig && badBig.id !== id && !p.pers.pro) {
        const B = P[badBig.id],
          guard = isMentee(p) && mentorOf(g, s, tid, id, rosters).paired ? 0.4 : 1;
        for (const t of BAD_SPREAD.filter(t => B.pers[t] && !p.pers[t])) {
          if (Math.random() < 0.0025 * stF(badBig.st) * m * guard * (1.5 - room.score / 100)) {
            p.pers[t] = true;
            if (t === 'alpha' || t === 'padder') p.pers.team = false;
            note = p.name + ' is picking up ' + B.name + '’s habits: now ' + TL[t];
            break;
          }
        }
      }
      // The room rubs off on everyone who's open to it.
      if (!note && room.score < 40 && !p.pers.alpha && !p.pers.pro && Math.random() < (0.006 * m * (40 - room.score)) / 40) {
        p.pers.alpha = true;
        p.pers.team = false;
        note = 'The bad locker room is getting to ' + p.name + ': now Egotistic';
      }
      if (
        !note &&
        room.score > 70 &&
        !p.pers.team &&
        !p.pers.alpha &&
        !p.pers.padder &&
        Math.random() < (0.004 * m * (room.score - 70)) / 30
      ) {
        p.pers.team = true;
        note = 'The locker room culture is rubbing off on ' + p.name + ': now a Team player';
      }
      if (note && g.isUser(s, tid)) (out[tid] = out[tid] || []).push(note);
    });
  });
  return out;
}
