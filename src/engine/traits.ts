// Personality traits: a short name, and a one-line description shown on hover. Your own
// players' traits are known exactly (you see them every day). Everyone else's are your
// scouts' read, shown as fact, like real life: a strong department reads them right, a weak
// one misses real traits, invents wrong ones, or comes back with nothing. You find out the
// truth when he joins your team. The read uses the same accuracy as scouting reports.
import type { Game } from './Game';
import { mulberry32 } from './rng';
import { scoutRead } from './scoutReport';

export interface Trait { k: string; label: string; desc: string }
export const TRAITS: Trait[] = [
  { k: 'alpha', label: 'Egotistic', desc: 'Wants to be the first option and the face of the team. Unhappy as anyone’s sidekick.' },
  { k: 'legacy', label: 'Legacy-driven', desc: 'Cares about his place in history: rings, awards, records, the Hall of Fame. Wants to win, as a star.' },
  { k: 'touches', label: 'Ball-dominant', desc: 'Wants the ball in his hands and more shots. Grumbles when he isn’t scoring.' },
  { k: 'team', label: 'Team player', desc: 'Gives up shots and stats for the team. Happy in any role as long as you win.' },
  { k: 'pro', label: 'Professional', desc: 'Keeps his feelings in check and rarely complains. Good for the locker room.' },
  { k: 'volatile', label: 'Volatile', desc: 'His mood swings hard: great when happy, a problem when he isn’t.' },
  { k: 'crowd', label: 'Crowd-fed', desc: 'Feeds off the home crowd: better at home, worse on the road.' },
  { k: 'clutch', label: 'Clutch', desc: 'Raises his game in the last minutes of close games.' },
  { k: 'prone', label: 'Injury prone', desc: 'Gets hurt more often than most players.' },
  { k: 'padder', label: 'Selfish', desc: 'Only cares about his own stats. Puts up big numbers, stops the ball and coasts on defense: the team plays worse with him.' },
];
export const TRAIT = Object.fromEntries(TRAITS.map(t => [t.k, t])) as Record<string, Trait>;
export const EVEN = { k: 'even', label: 'Even-keeled', desc: 'No strong quirks either way.' };

export interface TraitRead { keys: string[]; exact: boolean; none: boolean; note: string }

// What you believe about a player's personality.
export function traitRead(g: Game, s: any, p: any): TraitRead {
  const truth = TRAITS.filter(t => p.pers?.[t.k]).map(t => t.k);
  let tid = -99; for (const k of Object.keys(s.rosters || {})) if (s.rosters[k].includes(p.id)) { tid = +k; break; }
  const mine = tid >= 0 && g.isUser(s, tid);
  if (s.god || mine) return { keys: truth, exact: true, none: false, note: '' };
  const r = scoutRead(g, s, p), q = Math.max(0, Math.min(1, 1 - r.margin / 10));
  if (q >= 0.97) return { keys: truth, exact: true, none: false, note: '' };
  // Deterministic for a given level of knowledge: the read only changes when your scouting does.
  const rnd = mulberry32(p.id * 7907 + Math.round(q * 8) * 131 + 17);
  if (q < 0.3 && rnd() < 0.5) return { keys: [], exact: false, none: true, note: '' };
  const keys = TRAITS.filter(t => {
    const has = truth.includes(t.k), x = rnd();
    return has ? x < 0.25 + 0.75 * q : x < 0.16 * Math.pow(1 - q, 1.5);
  }).filter((t, _i, a) => !(t.k === 'team' && a.some(o => o.k === 'alpha' || o.k === 'padder'))).map(t => t.k);
  return { keys, exact: false, none: false, note: '' };
}
