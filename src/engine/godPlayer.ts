// God Mode player management: delete a player for good, or clone one into a second, separate player.
// Both keep the league's references straight.
//  - Delete: he leaves every list (rosters, free agency, abroad, draft classes, trade offers, watch
//    lists, scouting, training, mentors, family) and his record shrinks to the name-only stub the league
//    already keeps for players who are gone (prune.ts removeUnplayed), so old box scores, awards, drafts
//    and news still read correctly while he's hidden from every list, search and profile.
//  - Clone: a new player (new id) with the same game, body, background, personality, tendencies and
//    face (and his draft line), and none of the original's history (stats, awards, transactions, family,
//    contract). He starts
//    as a free agent (or in the same draft class, for a prospect); edit him like anyone else.
import type { Game } from './Game';
import { addTx } from './txlog';
import { nums, yosOf } from './cba';

// Club fields (Game.CLUB_KEYS) keyed by player id, and the ones that are lists of player ids.
const PID_MAPS = ['train', 'promises', 'intel', 'scoutAssign', 'briefPicks', 'coachAuto', 'scoutReports'];
const PID_LISTS = ['scoutList', 'scoutFocus'];

export function deletePlayer(g: Game, pid: number): boolean {
  const P = g.db.P, p = P[pid]; if (!p || p.gone) return false;
  const drop = (ids: any) => (Array.isArray(ids) ? ids.filter((x: any) => x !== pid) : ids);
  const club = (c: any) => {
    if (!c) return c; const x = { ...c };
    PID_MAPS.forEach(k => { if (x[k] && typeof x[k] === 'object' && !Array.isArray(x[k]) && pid in x[k]) { x[k] = { ...x[k] }; delete x[k][pid]; } });
    PID_LISTS.forEach(k => { if (Array.isArray(x[k])) x[k] = drop(x[k]); });
    if (x.mentors) { const m = { ...x.mentors }; delete m[pid]; Object.keys(m).forEach(k => { if (m[k] === pid) delete m[k]; }); x.mentors = m; }
    return x;
  };
  // His family no longer lists him.
  (p.family || []).forEach((f: any) => { const q = P[f.pid]; if (q?.family) { q.family = q.family.filter((x: any) => x.pid !== pid); if (!q.family.length) delete q.family; } });
  // Draft classes and the world's starting rosters.
  Object.keys(g.db.cls || {}).forEach(y => { g.db.cls[y] = drop(g.db.cls[y]); });
  if (g.db.rank) delete g.db.rank[pid];
  if (g.db.rosters) Object.keys(g.db.rosters).forEach(k => { g.db.rosters[k] = drop(g.db.rosters[k]); });
  g.setState(s => {
    const has = (o: any) => [...(o.aP || []), ...(o.bP || [])].includes(pid);
    const offers = s.offers && s.offers.list?.some((o: any) => [...(o.mine || []), ...(o.theirs || [])].includes(pid)) ? null : s.offers;
    const offered = { ...(s.offered || {}) }; delete offered[pid];
    return {
      ...club(s), clubs: Object.fromEntries(Object.entries(s.clubs || {}).map(([k, c]) => [k, club(c)])),
      rosters: Object.fromEntries(Object.entries(s.rosters).map(([k, v]) => [k, drop(v)])), fa: drop(s.fa), overseas: drop(s.overseas || []),
      inOffers: (s.inOffers || []).filter((o: any) => !has(o)), offers, offered, offerSheets: (s.offerSheets || []).filter((o: any) => o.pid !== pid), agentCalls: (s.agentCalls || []).filter((o: any) => o.pid !== pid),
      tMine: drop(s.tMine), tTheirs: drop(s.tTheirs), lists: (s.lists || []).map((l: any) => ({ ...l, ids: drop(l.ids) })),
      notices: (s.notices || []).map((n: any) => (n.pids?.includes(pid) ? { ...n, pids: drop(n.pids) } : n)),
      hof: (s.hof || []).filter((h: any) => h.pid !== pid),
      dialog: s.dialog?.pid === pid ? null : s.dialog, ...(s.pid === pid ? { modal: false, pid: null } : {}),
      lgLog: [{ day: s.day, type: 'God Mode', teams: '', pids: [], text: p.name + ' was deleted from the league (God Mode).' }, ...(s.lgLog || [])], gv: (s.gv || 0) + 1,
    };
  });
  P[pid] = { id: pid, name: p.name, native: p.native, pos: p.pos, grp: p.grp, age: p.age, ovr: p.ovr, pot: p.pot, rep: p.rep, her: p.her, heritage: p.heritage, race: p.race, faceSeed: p.faceSeed, faceX: p.faceX,
    retired: { season: g.Y, age: p.age, tid: -1, why: 'Deleted in God Mode' }, gone: 1, deleted: 1, stats: [] };
  g.resetFace(pid);
  return true;
}

// Everything that belongs to the original's life rather than to who he is as a player.
const HISTORY = ['stats', 'tx', 'injHist', 'rh', 'feed', 'last5', 'family', 'retired', 'hof', 'signed', 'legacy', 'awards', 'ring', 'overseasArc', 'waived', 'leftAsFA',
  'exp', 'ctype', 'opt', 'kicker', 'ntc', 'inc', 'capOverride', 'rookie', 'rookieScale', 'birdTid', 'rfa', 'twoWay', 'tenDay', 'tenDayWith', 'ext', 'extNoTrade', 'prevAmt', 'poIneligible', 'abroad', 'adjust',
  'gl', 'glx', 'ccpS', 'inj', 'preInj', 'minorCount', 'hapGod', 'offered', 'slim', 'wasEx10', 'lastTid', 'yrsWith', 'progB', 'progD', 'dev', 'rot'];

export function clonePlayer(g: Game, pid: number): number | null {
  const P = g.db.P, src = P[pid]; if (!src || src.gone || src.retired || !src.r) return null;
  const q = JSON.parse(JSON.stringify(src)), id = g.db.nid++;
  HISTORY.forEach(k => delete q[k]);
  const N = nums(g), yos = yosOf(g, src);
  Object.assign(q, { id, yos0: yos, faceSeed: src.faceSeed ?? src.id, cloneOf: src.id, stats: [], gp: 0, min: 0, pts: 0, reb: 0, ast: 0, per: 0, fat: 0, yrsWith: 0, exp: g.Y,
    ask: +Math.max(N.min(yos), g.fair(src.ovr)).toFixed(2) });
  P[id] = q;
  const prospect = src.cls && src.cls >= g.Y && (g.db.cls[src.cls] || []).includes(src.id);
  if (prospect) { g.db.cls[src.cls] = [...g.db.cls[src.cls], id]; if (g.db.rank && g.db.rank[src.id] != null) g.db.rank[id] = g.db.rank[src.id] + 0.5; }
  g.setState(s => {
    addTx(g, s, q, { k: 'god', tid: -1, text: 'Created in God Mode as a clone of ' + src.name });
    return { ...(prospect ? {} : { fa: [...s.fa, id] }), lgLog: [{ day: s.day, type: 'God Mode', teams: '', pids: [id, src.id], text: src.name + ' was cloned (God Mode): a new ' + (prospect ? 'prospect in the ' + src.cls + ' draft class' : 'free agent') + '.' }, ...(s.lgLog || [])], gv: (s.gv || 0) + 1 };
  });
  return id;
}
