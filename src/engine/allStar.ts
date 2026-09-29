// All-Star Weekend, mid-February. Each conference sends 12: five starters (two guards, three
// frontcourt players), like the fan vote, where fame and market count as well as numbers, and
// seven reserves chosen by production and winning (two guards, three frontcourt, two wild cards),
// like the coaches' picks. Then East vs. West, the NBA's All-Star format from 2024 on, with an MVP.
import type { Game } from './Game';

export interface AllStarTeam { starters: number[]; reserves: number[] }
export interface AllStarSeason { East: AllStarTeam; West: AllStarTeam; game?: { East: number; West: number; winner: 'East' | 'West'; mvp: number; mvpLine: string; mvpTid: number } }

// The game day of the break: the first day on or after February 15.
export function allStarDay(g: Game) { let d = 0; const t = new Date(g.Y, 1, 15).getTime(); while (d < 82 && g.dateOf(d).getTime() < t) d++; return d; }

export function allStarsOf(s: any, y: number): number[] { const a = (s.allStars || {})[y]; return a ? [...a.East.starters, ...a.East.reserves, ...a.West.starters, ...a.West.reserves] : []; }

export function runAllStar(g: Game) {
  g.setState(s => {
    const Y = g.Y; if ((s.allStars || {})[Y] || s.phase !== 'regular') return null;
    const P = g.db.P, T = s.teams, played = (tid: number) => Math.max(1, T[tid].w + T[tid].l);
    const pool: { id: number; tid: number; conf: string; grp: string; score: number; fame: number }[] = [];
    Object.entries(s.rosters).forEach(([k, ids]: any) => { const tid = +k, t = T[tid]; if (!t) return; ids.forEach((id: number) => {
      const p = P[id], x = g.seasonTotals(p, Y); if (!x || x.gp < played(tid) * 0.5 || x.gp < 10) return;
      const pg = (v: number) => v / x.gp, wp = t.w / played(tid);
      const score = pg(x.pts) + 0.5 * pg(x.orb + x.drb) + 0.8 * pg(x.ast) + 1.3 * pg(x.stl + x.blk) - 0.6 * pg(x.tov) + 0.25 * (pg(x.min) - 30) + 14 * (wp - 0.5);
      pool.push({ id, tid, conf: t.conf, grp: p.grp || 'W', score, fame: score + 0.35 * (p.ovr - 55) + 4 * ((t.mkt || 1) - 1) + (p.pers?.alpha ? 1 : 0) });
    }); });
    const out: any = {};
    (['East', 'West'] as const).forEach(c => {
      const cand = pool.filter(x => x.conf === c), used = new Set<number>(), take = (list: typeof cand, n: number, key: 'score' | 'fame') => list.filter(x => !used.has(x.id)).sort((a, b) => b[key] - a[key]).slice(0, n).map(x => { used.add(x.id); return x.id; });
      const G = cand.filter(x => x.grp === 'G'), F = cand.filter(x => x.grp !== 'G');
      const starters = [...take(G, 2, 'fame'), ...take(F, 3, 'fame')];
      const reserves = [...take(G, 2, 'score'), ...take(F, 3, 'score'), ...take(cand, 2, 'score')];
      out[c] = { starters, reserves };
    });
    // The game: stars don't defend, so 170–200 points a side. The better team usually wins.
    const str = (c: 'East' | 'West') => [...out[c].starters, ...out[c].reserves].reduce((a: number, id: number) => a + P[id].ovr, 0);
    const pE = 1 / (1 + Math.exp(-(str('East') - str('West')) / 25)), winner: 'East' | 'West' = Math.random() < pE ? 'East' : 'West';
    const hi = 180 + Math.round(Math.random() * 22), lo = hi - 2 - Math.round(Math.random() * 16);
    const wIds = [...out[winner].starters, ...out[winner].reserves], mvp = wIds.map(id => ({ id, v: P[id].ovr + (P[id].pers?.flashy ? 3 : 0) + Math.random() * 9 })).sort((a, b) => b.v - a.v)[0].id;
    const mp = P[mvp], pts = 22 + Math.round(Math.random() * 18 + (mp.r?.tp || 50) / 12), reb = 3 + Math.round(Math.random() * (mp.grp === 'B' ? 12 : 6)), ast = 2 + Math.round(Math.random() * (mp.grp === 'G' ? 10 : 5));
    const mvpTid = Number(Object.keys(s.rosters).find(k => s.rosters[k].includes(mvp)));
    out.game = { East: winner === 'East' ? hi : lo, West: winner === 'West' ? hi : lo, winner, mvp, mvpTid, mvpLine: pts + ' pts, ' + reb + ' reb, ' + ast + ' ast' };
    const tOf = (id: number) => Number(Object.keys(s.rosters).find(k => s.rosters[k].includes(id)));
    const lgLog = [
      { day: s.day, type: 'Awards', teams: 'League', text: winner + ' beat the ' + (winner === 'East' ? 'West' : 'East') + ' ' + hi + '–' + lo + ' in the All-Star Game. MVP: ' + mp.name + ' (' + out.game.mvpLine + ')' },
      { day: s.day, type: 'Awards', teams: 'League', text: 'All-Star starters: East ' + out.East.starters.map((id: number) => P[id].name).join(', ') + '; West ' + out.West.starters.map((id: number) => P[id].name).join(', ') },
      ...s.lgLog];
    const mine = allStarsOfOut(out).filter(id => g.isUser(s, tOf(id)));
    const news = [{ day: s.day, season: Y, kind: 'allstar', tid: mvpTid, who: T[mvpTid]?.owner || '', role: 'Owner, ' + (T[mvpTid]?.abbr || ''), pids: [mvp], quote: mp.name + ' put on a show out there. All-Star Game MVP, and he earned every bit of it.' }, ...(s.news || [])];
    return { allStars: { ...(s.allStars || {}), [Y]: out }, lgLog, news, ...(mine.length ? { log: [{ date: g.fmtS(s.day), day: s.day, text: 'All-Stars: ' + mine.map(id => P[id].name).join(', ') }, ...(s.log || [])] } : {}) };
  });
}
const allStarsOfOut = (a: any) => [...a.East.starters, ...a.East.reserves, ...a.West.starters, ...a.West.reserves];
