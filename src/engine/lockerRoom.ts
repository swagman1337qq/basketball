// The locker room: a team's morale, from how happy the players are, veteran leadership,
// winning, and the people who poison it (selfish scorers, volatile players who are unhappy,
// stars who want out). A good room helps a little on the court, keeps players happier and
// helps young players grow; a toxic one does the opposite.
// Mentoring: veterans with good habits (Professional, Team player) can rub off on young
// players, slowly and rarely. You can pair a mentor with a young player yourself (much
// stronger than informal leadership). See mentorTick for the odds.
import type { Game } from './Game';

export const NEGATIVE = ['padder', 'volatile', 'alpha', 'touches'];
export const POSITIVE = ['pro', 'team'];
export const MENTOR_AGE = 29, MENTEE_AGE = 25, MENTOR_MAX = 2;
const TL: Record<string, string> = { padder: 'Selfish', volatile: 'Volatile', alpha: 'Egotistic', touches: 'Ball-dominant', pro: 'Professional', team: 'Team player' };

export const isLeader = (p: any) => !!p && p.age >= MENTOR_AGE && (p.pers?.pro || p.pers?.team) && !p.pers?.padder && !p.pers?.volatile;
export const isMentee = (p: any) => !!p && p.age <= MENTEE_AGE;

export interface Room { score: number; label: string; color: string; factors: [string, number][]; leaders: number[]; trouble: number[] }
const cache = new WeakMap<object, Map<string, Room>>();

export function lockerRoom(g: Game, s: any, tid: number, rosters = s.rosters): Room {
  const T = s.teams[tid], key = tid + ':' + (T.w + T.l) + ':' + s.day + ':' + (rosters[tid] || []).join(',');
  let m = cache.get(rosters); if (!m) { m = new Map() as any; cache.set(rosters, m!); }
  const hit = (m as any).get(key); if (hit) return hit;
  const P = g.db.P, ids: number[] = (rosters[tid] || []).filter((id: number) => P[id]);
  const rot = ids.slice(0, 10), f: [string, number][] = [], leaders: number[] = [], trouble: number[] = [];
  const moods = new Map(ids.map((id, i) => [id, g.moodOf(P[id], i, { ...s, rosters }, tid, true).hap]));
  const avg = rot.reduce((a, id) => a + (moods.get(id) ?? 55), 0) / Math.max(1, rot.length);
  f.push(['Player happiness', Math.round((avg - 55) * 0.6)]);
  const gp = T.w + T.l; if (gp >= 5) f.push(['Winning', Math.round((g.pct(T) - 0.5) * 30)]);
  ids.filter(id => isLeader(P[id])).sort((a, b) => P[b].age - P[a].age).slice(0, 3).forEach(id => { leaders.push(id); f.push(['Veteran leader: ' + P[id].name, P[id].pers.pro && P[id].pers.team ? 8 : 6]); });
  const rank = ids.slice().sort((a, b) => P[b].ovr - P[a].ovr);
  rot.forEach(id => {
    const p = P[id], h = moods.get(id) ?? 55;
    if (p.pers.padder) { trouble.push(id); f.push(['Selfish: ' + p.name, -6]); }
    else if (p.pers.volatile && h < 45) { trouble.push(id); f.push(['Volatile and unhappy: ' + p.name, -5]); }
    else if (h < 30) { trouble.push(id); f.push(['Wants out: ' + p.name, -4]); }
    else if (p.pers.alpha && rank[0] !== id) f.push(['Wants to be the No. 1 option: ' + p.name, -3]);
  });
  const score = Math.round(Math.max(0, Math.min(100, 50 + f.reduce((a, x) => a + x[1], 0))));
  const room: Room = { score, label: score >= 80 ? 'Great' : score >= 62 ? 'Good' : score >= 45 ? 'Okay' : score >= 30 ? 'Tense' : 'Toxic', color: score >= 62 ? 'var(--gm-good)' : score < 45 ? 'var(--gm-bad)' : 'var(--color-text)', factors: f.filter(x => x[1] !== 0), leaders, trouble };
  (m as any).set(key, room); return room;
}

// Who is mentoring whom on a team: your pairings first, then team leaders informally.
export function mentorOf(g: Game, s: any, tid: number, pid: number, rosters = s.rosters): { mentor: number | null; paired: boolean } {
  const P = g.db.P, ids: number[] = rosters[tid] || [], club = g.clubOf(s, tid), set = club?.mentors || {};
  const m = set[pid]; if (m != null && ids.includes(m) && isLeader(P[m])) return { mentor: m, paired: true };
  const lead = ids.filter(id => isLeader(P[id]) && id !== pid).sort((a, b) => P[b].age - P[a].age)[0];
  return { mentor: lead ?? null, paired: false };
}

// Monthly: personalities change, rarely. How much a player can change depends on his hidden
// malleability (0–100): the fiercely independent almost never do, the impressionable can.
// Young players change more. Mentors help shed bad habits and pass on good ones; the room
// itself pushes too: a bad locker room breeds egos, a great one breeds team players.
const malF = (p: any) => Math.pow((p.pers.mal ?? 50) / 100, 2) * 2.5; // 90 → 2.0, 50 → 0.63, 20 → 0.1
const ageF = (a: number) => (a <= 22 ? 1.3 : a <= 25 ? 1 : a <= 29 ? 0.6 : 0.3);
export function mentorTick(g: Game, s: any, rosters: any): Record<number, string[]> {
  const P = g.db.P, out: Record<number, string[]> = {};
  Object.keys(rosters).forEach(k => {
    const tid = +k, room = lockerRoom(g, s, tid, rosters), roomF = 0.5 + room.score / 100;
    rosters[k].forEach((id: number) => {
      const p = P[id]; if (!p?.pers) return;
      const m = malF(p) * ageF(p.age); let note = '';
      if (isMentee(p)) {
        const { mentor, paired } = mentorOf(g, s, tid, id, rosters), M = mentor != null ? P[mentor] : null;
        const f = (paired ? 1 : M ? 0.3 : 0) * roomF * m;
        if (M) {
          for (const t of NEGATIVE.filter(t => p.pers[t])) { if (Math.random() < 0.012 * f) { p.pers[t] = false; note = p.name + ' is no longer ' + TL[t] + ', thanks to ' + M.name + '’s mentoring'; break; } }
          if (!note) for (const t of POSITIVE) { if (!M.pers[t] || p.pers[t] || (t === 'team' && (p.pers.alpha || p.pers.padder))) continue; if (Math.random() < 0.008 * f) { p.pers[t] = true; note = p.name + ' picked up ' + M.name + '’s habits: now a ' + TL[t]; break; } }
        }
      }
      // The room rubs off on everyone who's open to it.
      if (!note && room.score < 40 && !p.pers.alpha && !p.pers.pro && Math.random() < 0.006 * m * (40 - room.score) / 40) { p.pers.alpha = true; p.pers.team = false; note = 'The bad locker room is getting to ' + p.name + ': now Egotistic'; }
      if (!note && room.score > 70 && !p.pers.team && !p.pers.alpha && !p.pers.padder && Math.random() < 0.004 * m * (room.score - 70) / 30) { p.pers.team = true; note = 'The locker room culture is rubbing off on ' + p.name + ': now a Team player'; }
      if (note && g.isUser(s, tid)) (out[tid] = out[tid] || []).push(note);
    });
  });
  return out;
}
