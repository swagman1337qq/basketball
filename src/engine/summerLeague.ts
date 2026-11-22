// Summer League (2026-11-22): mid-July in free agency (SL_DAY), every team takes its young players (rookies,
// second-year players, two-ways, anyone 22 or under) and fills out its roster with undrafted free agents it invites;
// you pick up to SL_INV of your own invites (the rest are picked for you). Each team plays SL_GAMES games on the
// CCP's light game model (ccp.ts ccpQuickGame, about a tenth of a full game's cost: some 75 games all told).
//  • Every player's line is kept (p.sl, the last three summers) and shown on his profile; the standings and the
//    champion go in the league log.
//  • Your scouts watch: everyone who played gets a little intel (sharper skill reads, overseas.ts intelF).
//  • A showcase: an undrafted player who stands out (a Game Score of 10 a game or more, among the dozen best) earns
//    a two-way deal from the AI team that brought him, if it has a two-way slot open. Your own standouts are
//    yours to sign: the Mailbox tells you who.
// Nothing here runs during the season.
import type { Game } from './Game';
import { ccpQuickGame, simSide } from './ccp';
import { applySigning } from './contracts';
import { nums, twoWayIds, TWO_WAY_MAX, yosOf } from './cba';

export const SL_DAY = 10;
export const SL_GAMES = 5;
export const SL_INV = 5;
const SL_MAX = 12,
  SL_MIN = 8;
const K = ['min', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'] as const;
export type SlLine = { y: number; tid: number; gp: number } & Record<(typeof K)[number], number>;

// Who can be invited: an undrafted free agent (no NBA seasons, 25 or under) still on the market.
export const slEligible = (g: Game, s: any, p: any) =>
  !!p && !p.retired && (s.fa || []).includes(p.id) && yosOf(g, p) === 0 && p.age <= 25 && !(p.abroad && p.abroad.clause);
export const slOpen = (g: Game, s: any) =>
  (s.phase === 'draft' && (s.picks || []).length > 0 && (s.picks || []).every((x: any) => x.pid)) ||
  s.phase === 'preFA' ||
  (s.phase === 'fa' && g.faDayOf(s) < SL_DAY);
export const slInvites = (g: Game, s: any): number[] => (s.slInv?.y === g.Y ? s.slInv.ids : []);
export function slInvite(g: Game, s: any, pid: number, on: boolean): string {
  const p = g.db.P[pid];
  if (!slOpen(g, s)) return 'Summer League invites close when it starts in mid-July.';
  if (on && !slEligible(g, s, p)) return 'Only undrafted free agents can be invited.';
  const cur = slInvites(g, s).filter(id => id !== pid);
  if (on && cur.length >= SL_INV) return 'You can invite ' + SL_INV + ' players.';
  g.setState({ slInv: { y: g.Y, ids: on ? [...cur, pid] : cur } });
  return '';
}
const gmsc = (l: any) =>
  l.pts +
  0.4 * l.fgm -
  0.7 * l.fga -
  0.4 * (l.fta - l.ftm) +
  0.7 * l.orb +
  0.3 * l.drb +
  l.stl +
  0.7 * l.ast +
  0.7 * l.blk -
  0.4 * l.pf -
  l.tov;
export const slGmSc = (l: SlLine) => (l.gp ? gmsc(l) / l.gp : 0);
export const slOf = (p: any, y: number): SlLine | undefined => (p?.sl || []).find((x: SlLine) => x.y === y);

// The rosters: each team's young players, then invites (yours first), the best left by a simple read.
export function slRosters(g: Game, s: any): Record<number, number[]> {
  const P = g.db.P,
    used = new Set<number>(),
    out: Record<number, number[]> = {};
  const tids: number[] = s.teams.map((t: any) => t.tid);
  tids.forEach(tid => {
    const own = (s.rosters[tid] || [])
      .filter((id: number) => {
        const p = P[id];
        return p && !p.inj && (p.ctype === 'twoWay' || yosOf(g, p) <= 1 || p.age <= 22);
      })
      .sort((a: number, b: number) => P[b].ovr - P[a].ovr)
      .slice(0, SL_MAX - 3);
    own.forEach((id: number) => used.add(id));
    out[tid] = own;
  });
  const pool = (s.fa || [])
    .filter((id: number) => slEligible(g, s, P[id]) && !P[id].inj)
    .sort((a: number, b: number) => P[b].ovr * 0.6 + P[b].pot * 0.4 - (P[a].ovr * 0.6 + P[a].pot * 0.4));
  const mine = (s.managed || [s.me]).filter((t: number) => out[t]);
  slInvites(g, s)
    .filter(id => pool.includes(id))
    .forEach(id => {
      const t = mine.find((t: number) => out[t].length < SL_MAX);
      if (t == null || used.has(id)) return;
      out[t].push(id);
      used.add(id);
    });
  // Everyone fills out to SL_MIN (and takes up to SL_INV invites), in a shuffled order so nobody always picks first.
  const order = tids.slice().sort(() => Math.random() - 0.5);
  for (let round = 0; round < SL_INV; round++)
    order.forEach(tid => {
      if (out[tid].length >= SL_MAX || (round >= 2 && out[tid].length >= SL_MIN)) return;
      const id = pool.find((x: number) => !used.has(x));
      if (id == null) return;
      out[tid].push(id);
      used.add(id);
    });
  return out;
}

export function summerLeague(g: Game, s: any) {
  const P = g.db.P,
    Y = g.Y,
    T = s.teams,
    ros = slRosters(g, s),
    tids = Object.keys(ros)
      .map(Number)
      .filter(t => ros[t].length >= 5);
  const rec: Record<number, number[]> = {},
    lines: Record<number, SlLine> = {};
  tids.forEach(t => (rec[t] = [0, 0, 0, 0]));
  const side = (tid: number) =>
    simSide(
      g,
      tid,
      T[tid].region + ' ' + T[tid].name,
      T[tid].abbr,
      ros[tid].slice().sort((a, b) => P[b].ovr - P[a].ovr),
    );
  for (let r = 0; r < SL_GAMES; r++) {
    const o = tids.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i + 1 < o.length; i += 2) {
      const h = o[i],
        a = o[i + 1],
        res: any = ccpQuickGame(g, side(h), side(a));
      [
        [h, res.home, res.away],
        [a, res.away, res.home],
      ].forEach(([tid, me, op]: any) => {
        const R = rec[tid];
        if (me.pts > op.pts) R[0]++;
        else R[1]++;
        R[2] += me.pts;
        R[3] += op.pts;
        Object.entries(me.box).forEach(([id, b]: any) => {
          const L = (lines[+id] ||= { y: Y, tid, gp: 0, ...(Object.fromEntries(K.map(k => [k, 0])) as any) });
          if ((b.min || 0) > 0) L.gp++;
          K.forEach(k => (L[k] = +(L[k] + (b[k] || 0)).toFixed(1)));
        });
      });
    }
  }
  Object.entries(lines).forEach(([id, L]) => {
    const p = P[+id];
    if (!p || !L.gp) return;
    p.sl = [...(p.sl || []).filter((x: SlLine) => x.y !== Y), L].slice(-3);
  });
  const champ = tids.slice().sort((a, b) => rec[b][0] - rec[a][0] || rec[b][2] - rec[b][3] - (rec[a][2] - rec[a][3]))[0];
  // Standouts: undrafted invitees with a big summer; the AI team that had him signs him to a two-way if it can.
  const N = nums(g),
    box = { rosters: { ...s.rosters }, fa: (s.fa || []).slice(), overseas: (s.overseas || []).slice(), cap: { ...(s.cap || {}) } },
    lgLog: any[] = [],
    notices: any[] = [];
  const undrafted = Object.entries(lines)
    .map(([id, L]) => ({ id: +id, L, gs: slGmSc(L) }))
    .filter(x => x.L.gp >= 3 && slEligible(g, s, P[x.id]) && x.gs >= 10)
    .sort((a, b) => b.gs - a.gs)
    .slice(0, 12);
  const mineT = new Set<number>(s.managed || [s.me]);
  undrafted.forEach(({ id, L, gs }) => {
    const p = P[id],
      tid = L.tid,
      ppg = (L.pts / L.gp).toFixed(1);
    if (mineT.has(tid)) {
      notices.push({
        tone: 'good',
        title: 'Summer League standout: ' + p.name,
        lines: [
          p.name +
            ' (your invite) averaged ' +
            ppg +
            ' points (Game Score ' +
            gs.toFixed(1) +
            '). He’s still a free agent: sign him if you want him.',
        ],
      });
      return;
    }
    if (twoWayIds(g, box.rosters[tid] || []).length >= TWO_WAY_MAX) return;
    const line = applySigning(g, { ...s, rosters: box.rosters, cap: box.cap }, box, tid, p, { method: 'twoWay', amt: N.TWO_WAY, years: 2 });
    lgLog.push({
      day: s.day,
      type: 'Signing',
      teams: T[tid].abbr,
      text: line + ' after a strong Summer League (' + ppg + ' ppg)',
      pids: [id],
    });
  });
  // Your summer: record and best players.
  [...mineT].forEach(tid => {
    const R = rec[tid];
    if (!R) return;
    const best = ros[tid]
      .map(id => ({ p: P[id], L: lines[id] }))
      .filter(x => x.L?.gp)
      .sort((a, b) => slGmSc(b.L) - slGmSc(a.L))
      .slice(0, 3)
      .map(x => x.p.name + ' ' + (x.L.pts / x.L.gp).toFixed(1) + ' ppg');
    notices.push({
      tone: 'info',
      title: 'Summer League: ' + R[0] + '–' + R[1] + (tid === champ ? ', champions' : ''),
      lines: [
        'Your best: ' + best.join(', ') + '.',
        'Every line is on the Free agency screen’s Summer League panel and each player’s profile.',
      ],
    });
  });
  lgLog.push({
    day: s.day,
    type: 'Summer League',
    teams: T[champ]?.abbr,
    text: (T[champ]?.region || '') + ' won the Summer League (' + rec[champ]?.[0] + '–' + rec[champ]?.[1] + ')',
  });
  // Your scouts watched every game.
  const intel = { ...(s.intel || {}) };
  Object.keys(lines).forEach(id => (intel[+id] = +Math.min(12, (intel[+id] || 0) + 3).toFixed(2)));
  return { box, lgLog, notices, intel, sl: { y: Y, rec, champ, ros } };
}
