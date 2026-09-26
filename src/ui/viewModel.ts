// View model: turns the league state into the flat values the screens render.
// Ported from the prototype's renderVals(); every handler calls back into Game.
import { createElement, type RefObject } from 'react';
import { natDefault, regionOf, regions, roleDefs } from '../data/world';
import { Game } from '../engine/Game';
import { intelF } from '../engine/overseas';
import { baseAfterIncentives, financesOf, incentiveOptions, ownerReview, reputation, seasonReview } from '../engine/frontOffice';
import { TeamLogo } from './TeamLogo';
import { linkNames } from './kit';
import type { VM } from './vm';

export interface ViewExtras { saveName: string; onExit: () => void; onExport: () => void; saveStatus: string }

export function buildView(gm: Game, rootRef: RefObject<HTMLDivElement | null>, extra: ViewExtras): VM {
  const s = gm.state, d = gm.db, P = d.P, C = d.C, cl = gm.cl, variant = s.variant ?? 'A';
  const money = v => (v < 0 ? '−' : '') + '$' + Math.abs(v).toFixed(1) + 'M';
  const ord = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');
  const tone = v => v >= 65 ? 'var(--gm-elite)' : v < 45 ? 'var(--color-neutral-500)' : 'var(--color-text)';
  const open = id => e => { e && e.stopPropagation && e.stopPropagation(); gm.setState({ pid: id, modal: true, ptab: 'overview', extYears: null, extAmt: null, extMsg: null, q: '', showJson: false }); };
  const go = k => () => gm.setState({ screen: k, q: '' });
  const openTeam = tid => e => { e && e.stopPropagation && e.stopPropagation(); if (tid >= 0) gm.setState({ teamModal: tid }); };
  const T = s.teams, me = T[s.me], mine = s.rosters[s.me], pct = t => gm.pct(t), mine2 = t => gm.isUser(s, t);
  const logo = (tid, size = 18) => (tid >= 0 && T[tid] ? createElement(TeamLogo, { team: T[tid], size }) : null);
  const myName = me.region + ' ' + me.name;
  const tidOf = {}; Object.keys(s.rosters).forEach(t => s.rosters[t].forEach(id => tidOf[id] = +t)); s.fa.forEach(id => tidOf[id] = -1); (s.overseas || []).forEach(id => tidOf[id] = -2);
  const fpct = t => pct(t).toFixed(3).replace(/^0/, ''), byPct = (a, b) => pct(b) - pct(a) || b.w - a.w;
  const gb = (t, lead) => { const g = ((lead.w - t.w) + (t.l - lead.l)) / 2; return g <= 0 ? '—' : String(g); };
  const strk = t => { const q = t.seq; if (!q.length) return '—'; const last = q[q.length - 1]; let n = 0; for (let i = q.length - 1; i >= 0 && q[i] === last; i--) n++; return (last ? 'W' : 'L') + n; };
  const l10 = t => { const q = t.seq.slice(-10), w = q.filter(Boolean).length; return w + '–' + (q.length - w); };
  const payroll = mine.reduce((a, id) => a + P[id].amt, 0), capRoom = gm.CAP - payroll;
  const confT = T.filter(t => t.conf === me.conf).sort(byPct), seed = confT.indexOf(me) + 1;
  const dateLong = gm.dateOf(s.day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const sortBy = (arr, [k, dir]) => arr.slice().sort((a, b) => { const x = a[k], y = b[k]; return (typeof x === 'string' ? x.localeCompare(y) : x - y) * dir; });
  const hdr = (tbl, cols) => cols.map(([k, label, al]) => { const [sk, sd] = s.sort[tbl]; return { label, align: al || 'right', arrow: sk === k ? (sd > 0 ? ' ↑' : ' ↓') : '', color: sk === k ? 'var(--color-accent-700)' : 'color-mix(in srgb, var(--color-text) 60%, transparent)', onClick: () => gm.setState(st => ({ sort: { ...st.sort, [tbl]: [k, st.sort[tbl][0] === k ? -st.sort[tbl][1] : (['rk', 'name', 'pos', 'rank', 'fromT', 'age', 'mood'].includes(k) ? 1 : -1)] } })) }; });
  const pBase = id => { const p = P[id]; return { ...p, native: p.native || '', injTag: p.inj ? 'Out ' + p.inj.games + 'g · ' + p.inj.name : '', flag: gm.flag(p.rep), cname: C[p.rep].n, tone: tone(p.ovr), ptone: tone(p.pot), open: open(id) }; };
  const strat = gm.strategies(T);
  const STRAT = { rebuild: ['Rebuilding', 'Prioritizing draft capital and young upside. Willing to absorb unfavorable contracts as the cost of acquiring picks.'], middle: ['On the rise', 'Building around a young core. Values high-upside players and is reluctant to move picks except for a priority target.'], contend: ['Contending', 'In win-now mode. Will part with draft picks for proven, immediate contributors.'] };

  const NAV = [['dash', 'Dashboard', 'League'], ...(s.managed.length > 1 || s.god ? [['teams', 'My teams', 'League']] : []), ['standings', 'Standings', 'League'], ['schedule', 'Schedule', 'League'], ['tx', 'Transactions', 'League'], ['playoffs', 'Playoffs', 'League'], ['awards', 'Awards', 'League'], ['league', 'League stats', 'League'], ['settings', 'Settings', 'League'], ...(s.god ? [['editor', 'League editor', 'League']] : []), ['roster', 'Roster', 'Team'], ['depth', 'Depth chart', 'Team'], ['dev', 'Development', 'Team'], ['tactics', 'Tactics', 'Team'], ['fin', 'Finances', 'Team'], ['trade', 'Trade', 'Front office'], ['fa', 'Free agency', 'Front office'], ['draft', 'Draft', 'Front office'], ['short', 'Shortlist', 'Front office'], ['scouting', 'Scouting', 'Front office'], ['overseas', 'Overseas', 'Front office'], ['owner', 'Owner', 'Front office'], ['career', 'Career', 'Front office'], ['press', 'Press room', 'League']];
  const ICON = { dash: ['m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'], standings: ['M3 3v18h18', 'M18 17V9', 'M13 17V5', 'M8 17v-3'], roster: ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M22 21v-2a4 4 0 0 0-3-3.87', 'M16 3.13a4 4 0 0 1 0 7.75', 'M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'], depth: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'], player: ['M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2', 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0'], fin: ['M12 2v20', 'M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'], trade: ['M8 3 4 7l4 4', 'M4 7h16', 'm16 21 4-4-4-4', 'M20 17H4'], fa: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'], draft: ['M10 6h11', 'M10 12h11', 'M10 18h11', 'M4 6h1v4', 'M4 10h2', 'M6 18H4c0-1 2-2 2-3s-1-1.5-2-1'], dev: ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'], tactics: ['M3 4h18v16H3z', 'M12 4v16', 'M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4'], scouting: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'], overseas: ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'M2 12h20', 'M12 2a15 15 0 0 1 0 20', 'M12 2a15 15 0 0 0 0 20'], owner: ['M2 20h20', 'M4 20V9l8-5 8 5v11', 'M9 20v-6h6v6'], playoffs: ['M6 9H4.5a2.5 2.5 0 0 1 0-5H6', 'M18 9h1.5a2.5 2.5 0 0 0 0-5H18', 'M4 22h16', 'M18 2H6v7a6 6 0 0 0 12 0V2Z'], settings: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'], schedule: ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'], tx: ['M22 12h-4l-3 9L9 3l-3 9H2'], short: ['m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z'], awards: ['M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15', 'M11 12 5.12 2.2', 'm13 12 5.88-9.8', 'M8 7h8', 'M17 17a5 5 0 1 1-10 0 5 5 0 0 1 10 0'], editor: ['M12 20h9', 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'], league: ['M3 3v18h18', 'M7 16l4-6 4 3 5-8'], career: ['M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16', 'M4 6h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z'], press: ['M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2', 'M18 14h-8', 'M15 18h-5', 'M10 6h8v4h-8V6Z'], teams: ['M12 2 2 7l10 5 10-5-10-5Z', 'm2 17 10 5 10-5', 'm2 12 10 5 10-5'], search: ['m21 21-4.3-4.3', 'M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0'] };
  const icon = k => { const sz = k === 'search' ? 15 : 19; return createElement('svg', { width: sz, height: sz, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }, ...ICON[k].map((dd, i) => createElement('path', { d: dd, key: i }))); };
  const nav = NAV.map(([k, label, grp]) => { const on = s.screen === k; return { key: k, label, grp, go: go(k), icon: icon(k), color: on ? 'var(--color-accent-700)' : 'var(--color-text)', fw: on ? 600 : 400, dot: on ? 'var(--color-accent)' : 'transparent', ul: on ? 'var(--color-accent)' : 'transparent', ring: on ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }; });
  const navGroups = ['League', 'Team', 'Front office'].map(g => ({ label: g, items: nav.filter(n => n.grp === g) }));
  const is: any = {}; NAV.forEach(([k]) => is[k] = s.screen === k); is.game = s.screen === 'game';

  // Your next game: the regular-season schedule, or your next play-in / playoff game.
  const post = s.phase === 'playin' || s.phase === 'playoffs' ? gm.nextPostGame(s, s.me) : null;
  const g = post ? { opp: post.home === s.me ? post.away : post.home, home: post.home === s.me } : gm.userGame(s.day), opp = T[g.opp];
  const canWatch = !s.simming && ((s.phase === 'regular' && gm.gamesPlayed(s) < 82) || !!post);
  const next = { logo: logo(g.opp, 40), myLogo: logo(s.me, 40), smLogo: logo(g.opp, 22), openT: openTeam(g.opp), when: post ? post.label : gm.fmtS(s.day), vs: g.home ? 'vs' : 'at', abbr: opp.abbr, oppName: opp.region + ' ' + opp.name, oppRec: opp.w + '–' + opp.l, myRec: me.w + '–' + me.l, line: (g.home ? 'Home · ' + me.region : 'Road · ' + opp.region) + ' · ' + ord(T.filter(t => t.conf === opp.conf).sort(byPct).indexOf(opp) + 1) + ' in the ' + opp.conf };
  const myResults = gm.resultsOf(s, s.me);
  const results = myResults.slice(0, 6).map(r => ({ logo: logo(r.opp, 16), openT: openTeam(r.opp), date: gm.fmtS(r.day), opp: (r.home ? 'vs ' : 'at ') + T[r.opp].abbr, wl: r.win ? 'W' : 'L', color: r.win ? 'var(--gm-good)' : 'var(--gm-bad)', score: r.us + '–' + r.them }));
  const played = mine.map(id => P[id]).filter(p => p.gp > 0);
  const leaders = [['pts', 'Pts'], ['reb', 'Reb'], ['ast', 'Ast']].map(([k, label]) => { const p = played.slice().sort((a, b) => b[k] - a[k])[0]; return p ? { label, name: p.name, value: p[k].toFixed(1), open: open(p.id) } : { label, name: '—', value: '', open: () => {} }; });
  const lineup = mine.slice(0, 5).map(id => ({ ...pBase(id), face: gm.faceEl(id, s.me) }));
  const confMini = confT.slice(0, 10).map((t, i) => ({ logo: logo(t.tid, 18), seed: i + 1, name: t.region + ' ' + t.name, rec: t.w + '–' + t.l, gb: gb(t, confT[0]), bg: t.tid === s.me ? 'var(--color-accent-100)' : mine2(t.tid) ? 'color-mix(in srgb, var(--color-accent-100) 55%, transparent)' : 'transparent', fw: mine2(t.tid) ? 600 : 400, openT: openTeam(t.tid), line: i === 5 ? '1px solid var(--color-text)' : '1px solid var(--color-divider)' }));
  const dashStats = [
    { label: 'Record', value: me.w + '–' + me.l, sub: strk(me) + ' streak · ' + l10(me) + ' in last 10' },
    { label: me.conf + ' seed', value: ord(seed), sub: seed === 1 ? 'Leading the conference' : gb(me, confT[0]) + ' games back of ' + confT[0].abbr },
    { label: 'Payroll', value: money(payroll), sub: (capRoom >= 0 ? money(capRoom) + ' under the cap' : money(-capRoom) + ' over the cap') + ' · ' + money(gm.TAX - payroll) + ' to the tax' },
    { label: 'Roster', value: mine.length + '/15', sub: mine.length < 15 ? (15 - mine.length) + ' open spot' + (15 - mine.length > 1 ? 's' : '') : 'Full' }];

  const byOrder = s.sort.roster[0] === 'rk' && s.sort.roster[1] === 1;
  const moveTo = (id, to) => gm.setState(st => { const o = st.rosters[st.me].filter(x => x !== id); o.splice(cl(to, 0, o.length), 0, id); return { rosters: { ...st.rosters, [st.me]: o }, sort: { ...st.sort, roster: ['rk', 1] }, dragId: null, overId: null }; });
  const stopThen = fn => e => { e.stopPropagation(); fn(); };
  const rows = mine.map((id, i) => ({ ...pBase(id), rk: i + 1, role: i < 5 ? 'S' : '', contract: money(P[id].amt), ...gm.moodOf(P[id], i, s),
    up: stopThen(() => moveTo(id, i - 1)), down: stopThen(() => moveTo(id, i + 1)),
    dragStart: e => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(id)); gm.setState({ dragId: id }); },
    dragOver: e => { e.preventDefault(); if (s.overId !== id) gm.setState({ overId: id }); },
    drop: e => { e.preventDefault(); const from = +e.dataTransfer.getData('text/plain'); if (from && from !== id) moveTo(from, i); else gm.setState({ dragId: null, overId: null }); },
    bg: s.dragId === id ? 'var(--color-accent-100)' : 'transparent', dropLine: s.dragId && s.overId === id && s.dragId !== id ? 'inset 0 2px 0 var(--color-accent)' : 'none' }));
  const rosterRows = [...sortBy(rows.slice(0, 5), s.sort.roster), ...sortBy(rows.slice(5), s.sort.roster)].map((r, i) => ({ ...r, line: i === 4 ? '1px solid var(--color-text)' : '1px solid var(--color-divider)' }));
  const rosterCols = hdr('roster', [['rk', '#'], ['name', 'Player', 'left'], ['pos', 'Pos', 'left'], ['age', 'Age'], ['ovr', 'Ovr'], ['pot', 'Pot'], ['amt', 'Contract'], ['exp', 'Exp'], ['gp', 'GP'], ['min', 'Min'], ['pts', 'Pts'], ['reb', 'Reb'], ['ast', 'Ast'], ['per', 'PER'], ['hap', 'Mood', 'left']]);
  const starterOvr = mine.slice(0, 5).map(id => P[id].ovr), benchBest = Math.max(...mine.slice(5).map(id => P[id].ovr));
  const lineupHint = benchBest > Math.min(...starterOvr) ? 'Your best bench player is rated higher than one of your starters.' : '';

  const SL = ['PG', 'SG', 'SF', 'PF', 'C'];
  const POSF = { PG: [1, .7, .3, .1, 0], SG: [.6, 1, .7, .2, 0], G: [.9, .9, .4, .1, 0], SF: [.2, .7, 1, .7, .2], GF: [.3, .9, .9, .4, .1], F: [.1, .4, .9, .9, .4], PF: [0, .1, .6, 1, .6], FC: [0, 0, .3, .9, .9], C: [0, 0, .1, .6, 1] };
  const st5 = mine.slice(0, 5); let bestPerm = [0, 1, 2, 3, 4], bestFit = -1;
  const perm = (a, k) => { if (k === a.length) { const f = a.reduce((x, pi, j) => x + (st5[pi] ? POSF[P[st5[pi]].pos][j] : 0), 0); if (f > bestFit) { bestFit = f; bestPerm = a.slice(); } return; } for (let i = k; i < a.length; i++) { [a[k], a[i]] = [a[i], a[k]]; perm(a, k + 1); [a[k], a[i]] = [a[i], a[k]]; } };
  perm([0, 1, 2, 3, 4], 0);
  const benchBy = SL.map(() => []);
  mine.slice(5).forEach(id => { const f = POSF[P[id].pos]; benchBy[f.indexOf(Math.max(...f))].push(id); });
  const depth = SL.map((pos, j) => { const sid = st5[bestPerm[j]], sp = P[sid], fit = sp ? POSF[sp.pos][j] : 0; return { pos, count: (1 + benchBy[j].length) + ' deep', s: sp ? { name: sp.name, pos: sp.pos, ovr: sp.ovr, open: open(sid), face: gm.faceEl(sid, s.me), note: fit < 0.8 ? 'Playing out of position' : '' } : { name: '—', pos: '', ovr: '', open: () => {}, face: null, note: '' }, bench: benchBy[j].map(id => ({ name: P[id].name, pos: P[id].pos, ovr: P[id].ovr, tone: tone(P[id].ovr), open: open(id) })) }; });
  const roleMap = {}; mine.forEach(id => gm.rolesOf(P[id]).forEach(r => (roleMap[r] = roleMap[r] || []).push(P[id].name)));
  const roles = roleDefs().map(([name, desc, mn, mx]) => { const ps = roleMap[name] || [], n = ps.length, stt = n < mn ? 'Thin' : n > mx ? 'Surplus' : 'Covered'; return { name, desc, count: n, target: mn + '–' + mx, status: stt, color: stt === 'Thin' ? 'var(--color-accent-800)' : stt === 'Surplus' ? 'var(--color-neutral-700)' : 'var(--color-text)', fw: stt === 'Thin' ? 600 : 400, players: ps.join(', ') || '—' }; });
  const gaps = roles.filter(r => r.status === 'Thin').map(r => r.name);
  const grpN = k => mine.filter(id => P[id].grp === k).length;
  const avgAge = mine.reduce((a, id) => a + P[id].age, 0) / mine.length;
  const intl = mine.filter(id => P[id].rep !== 'US').length;
  const comp = [{ label: 'Guards · wings · bigs', value: grpN('G') + ' · ' + grpN('W') + ' · ' + grpN('B'), sub: 'By listed position' }, { label: 'Average age', value: avgAge.toFixed(1), sub: mine.filter(id => P[id].age <= 23).length + ' players 23 or younger' }, { label: 'Thin spots', value: String(gaps.length), sub: gaps.slice(0, 2).join(', ') || 'Every role is covered' }, { label: 'International', value: String(intl), sub: 'Represent a country other than the US' }];

  const pp = P[s.pid] || P[mine[0]], ptid = tidOf[pp.id];
  const pk = s.picks.find(x => x.pid === pp.id);
  const status = ptid === s.me ? 'mine' : ptid === -1 ? 'fa' : ptid === -2 ? 'abroad' : ptid > 0 ? 'other' : 'pro';
  const RG: any[] = [['Physical', [['hgt', 'Height'], ['stre', 'Strength'], ['spd', 'Speed'], ['jmp', 'Jumping'], ['endu', 'Endurance']]], ['Shooting', [['ins', 'Inside'], ['dnk', 'Dunks & layups'], ['ft', 'Free throws'], ['fg', 'Mid-range'], ['tp', 'Three-pointers']]], ['Skill', [['oiq', 'Offensive IQ'], ['diq', 'Defensive IQ'], ['drb', 'Dribbling'], ['pss', 'Passing'], ['reb', 'Rebounding']]]];
  const career = [];
  if (status !== 'pro') {
    // Seasons before the league began are scouting estimates; seasons since are real totals ÷ games.
    const first = d.firstSeason || 2027, rows = (pp.stats || []).slice().sort((a, b) => a.season - b.season || (a.po ? 1 : 0) - (b.po ? 1 : 0));
    const firstTeam = rows.length ? T[rows[0].tid] : ptid >= 0 ? T[ptid] : null, abbr = firstTeam ? firstTeam.region + ' ' + firstTeam.name : 'Free agent';
    for (let E = first - 4; E <= first - 1; E++) {
      const k = gm.Y - E; if (pp.age - k < 19) continue;
      const yr = E - 1, pre = yr < pp.draft, o = pp.ovr - k * (pp.age - k < 27 ? 3 : -1), f = cl((o - 36) / 30, 0.12, 1) * (pre ? 1.15 : 1);
      career.push({ season: yr + '–' + String(yr + 1 - 2000).padStart(2, '0'), team: pre ? pp.from.team : abbr, lg: pre ? pp.from.lg : 'League (est.)', gp: pre ? (pp.from.lg === 'NCAA' ? 30 + (pp.id + k) % 8 : 28 + (pp.id + k) % 12) : 58 + ((pp.id * 7 + k * 13) % 24), min: (10 + Math.min(1, f) * 24).toFixed(1), pts: (Math.max(2, (o - 32) * 0.72) * f).toFixed(1), reb: (f * pp.r.reb / 7.5).toFixed(1), ast: (f * pp.r.pss / 9).toFixed(1), per: cl(15 + (o - 50) * 0.75, 3, 32).toFixed(1), fw: 400 });
    }
    rows.forEach(r => { const g1 = v => (v / r.gp).toFixed(1), t = T[r.tid];
      career.push({ season: (r.season - 1) + '–' + String(r.season).slice(2), team: t ? t.region + ' ' + t.name : '—', lg: r.po ? 'Playoffs' : 'League', gp: r.gp, min: g1(r.min), pts: g1(r.pts), reb: g1(r.orb + r.drb), ast: g1(r.ast), per: gm.perOf(r, r.season).toFixed(1), fw: r.season === gm.Y && !r.po ? 600 : 400 }); });
  }
  const fc = gm.face(pp.id);
  const pl = { ...pp, flag: gm.flag(pp.rep), cname: C[pp.rep].n, tone: tone(pp.ovr), face: gm.faceEl(pp.id, ptid),
    groups: RG.map(([label, ks]) => ({ label, items: ks.map(([k, n]) => ({ name: n, v: pp.r[k], w: pp.r[k] + '%', tone: tone(pp.r[k]) })) })),
    teamLogo: ptid >= 0 ? logo(ptid, 16) : null, teamLabel: ptid === -2 ? 'Overseas · ' + pp.abroad.club + ' (' + pp.abroad.lg + ')' : ptid >= 0 ? T[ptid].region + ' ' + T[ptid].name : ptid === -1 ? 'Free agent' : pk ? 'Drafted #' + pk.n + ' by ' + T[gm.owner2027(pk.orig, s.assets)].abbr : 'Class of ' + pp.cls + ' prospect',
    bio: 'Age ' + pp.age + ' · ' + pp.hgt + ' · ' + pp.wt + ' lb · ' + (() => { const fr = pp.from.lg === 'NCAA' || pp.from.lg === 'High school' ? pp.from.team + ' (' + pp.from.lg + ')' : pp.from.team + ', ' + C[pp.from.country].n; if (status === 'pro' && !pk) return 'Playing for ' + fr; const dd = pk ? { rd: 1, pick: pk.n } : pp.dr; return dd ? 'Drafted ' + pp.draft + ' in round ' + dd.rd + ', pick #' + dd.pick + ', overall #' + ((dd.rd - 1) * 30 + dd.pick) + ' – out of ' + fr : 'Undrafted in ' + pp.draft + ' – out of ' + fr; })(),
    contractLine: status === 'fa' ? 'Asking ' + money(gm.askFor(pp, s)) + ' per year through ' + pp.exp + ' · ' + pp.mood.toLowerCase() + ' to sign' : status === 'pro' ? 'Projected #' + d.rank[pp.id] + ' on the ' + pp.cls + ' big board' : money(pp.amt) + ' per year through ' + pp.exp,
    bgRows: [{ k: 'Health', hasFlag: false, flag: '', v: pp.inj ? pp.inj.name + ', out about ' + pp.inj.games + ' games' : 'Healthy' + ((pp.injHist || []).length ? ' · ' + pp.injHist.length + ' injur' + (pp.injHist.length === 1 ? 'y' : 'ies') + ' on record' : '') }, { k: 'Born', hasFlag: true, flag: gm.flag(pp.born), v: pp.city + (regionOf(pp.city) ? ', ' + regionOf(pp.city) : '') + ', ' + C[pp.born].n }, { k: 'Represents', hasFlag: true, flag: gm.flag(pp.rep), v: C[pp.rep].n + ' national team' }],
    elig: pp.elig.map(e => ({ flag: gm.flag(e.c), name: C[e.c].n, why: e.why })),
    career, hasCareer: career.length > 0, noCareer: career.length === 0, ask: money(gm.askFor(pp, s)),
    isMine: status === 'mine', isOther: status === 'other', isFA: status === 'fa' || status === 'abroad', abroadBtn: status === 'mine', toAbroad: () => gm.setState({ dialog: { type: 'abroad', pid: pp.id } }),
    jsonLabel: s.showJson ? 'Hide face JSON' : 'Show face JSON', faceJson: JSON.stringify(fc, null, 2),
    release: () => gm.setState({ dialog: { type: 'release', pid: pp.id } }), sign: () => gm.setState({ dialog: { type: 'sign', pid: pp.id } }),
    tradeFor: () => gm.setState({ modal: false, screen: 'trade', tTid: ptid, tTheirs: [pp.id], tMine: [], tkMine: [], tkTheirs: [], tMsg: null }) };

  const conf = s.stand === 'conf';
  const grs = conf ? ['East', 'West'].map(c => ({ label: c + 'ern Conference', ts: T.filter(t => t.conf === c) })) : ['Atlantic', 'Northwest', 'Central', 'Pacific', 'Southeast', 'Southwest'].map(v => ({ label: v + ' Division', ts: T.filter(t => t.div === v) }));
  const standGroups = grs.map(gr => { const ts = gr.ts.slice().sort(byPct); return { label: gr.label, rows: ts.map((t, i) => ({ logo: logo(t.tid), seed: i + 1, name: t.region + ' ' + t.name, w: t.w, l: t.l, pct: fpct(t), gb: gb(t, ts[0]), home: t.hw + '–' + t.hl, road: t.rw + '–' + t.rl, l10: l10(t), strk: strk(t), bg: t.tid === s.me ? 'var(--color-accent-100)' : mine2(t.tid) ? 'color-mix(in srgb, var(--color-accent-100) 55%, transparent)' : 'transparent', fw: mine2(t.tid) ? 600 : 400, openT: openTeam(t.tid), line: conf && i === 5 ? '1px solid var(--color-text)' : conf && i === 9 ? '1px dashed var(--color-neutral-500)' : '1px solid var(--color-divider)' })) }; });
  const standSegs = [['conf', 'Conference'], ['div', 'Division']].map(([k, label]) => ({ label, onClick: () => gm.setState({ stand: k }), color: s.stand === k ? 'var(--color-accent-700)' : 'var(--color-text)', ring: s.stand === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }));

  const box = on => ({ box: on ? 'var(--color-accent)' : 'transparent', mark: on ? '✓' : '', bg: on ? 'var(--color-accent-100)' : 'transparent' });
  const tog = (key, id) => () => gm.setState(st => ({ [key]: st[key].includes(id) ? st[key].filter(x => x !== id) : [...st[key], id], tMsg: null }));
  const tRow = key => id => ({ ...pBase(id), contract: money(P[id].amt), ...box(s[key].includes(id)), toggle: tog(key, id) });
  const usedPick = a => a.yr === gm.Y && a.rd === 1 && s.picks.some(x => x.orig === a.orig && x.pid);
  const projTxt = a => { if (a.rd === 2) return 'Second round'; const sl = Math.round(gm.projSlot(a, T)); return a.yr === gm.Y ? 'Proj. #' + sl : sl <= 14 ? 'Proj. lottery' : sl <= 22 ? 'Proj. mid first' : 'Proj. late first'; };
  const kRow = key => a => ({ label: gm.pickLabel(a, T), proj: projTxt(a), ...box(s[key].includes(a.id)), toggle: tog(key, a.id) });
  const myAssets = s.assets.filter(a => a.owner === s.me && !usedPick(a)), theirAssets = s.assets.filter(a => a.owner === s.tTid && !usedPick(a));
  const send = s.tMine.map(id => P[id]), get = s.tTheirs.map(id => P[id]);
  const out = send.reduce((a, p) => a + p.amt, 0), inc = get.reduce((a, p) => a + p.amt, 0), after = payroll - out + inc;
  const agg = after > gm.AP2 && send.length > 1;
  const salOk = !agg && (after <= gm.CAP || (after <= gm.AP1 ? inc <= out * 1.25 + 0.25 : inc <= out));
  const rosOk = mine.length - send.length + get.length <= 15 && s.rosters[s.tTid].length - get.length + send.length <= 15;
  const any = send.length + get.length + s.tkMine.length + s.tkTheirs.length > 0;
  const ev = gm.evalTrade(s, s.tMine, s.tTheirs, s.tkMine, s.tkTheirs);
  const tst = strat[s.tTid] || 'middle';
  const tr = { out: money(out), in: money(inc), after: money(after), sal: agg ? 'Above the 2nd apron: salaries can\u2019t be combined' : after <= gm.CAP ? 'Under the cap' : salOk ? 'Matches' : after <= gm.AP1 ? 'Take back at most 125% + $0.25M' : 'Above the 1st apron: take back at most 100%', salColor: salOk ? 'var(--color-text)' : 'var(--color-accent-800)', ros: rosOk ? 'OK' : 'Exceeds 15 players', rosColor: rosOk ? 'var(--color-text)' : 'var(--color-accent-800)',
    stratName: mine2(s.tTid) ? 'Also yours' : STRAT[tst][0], stratDesc: mine2(s.tTid) ? 'You run both franchises, so any trade you build goes through (salary rules still apply).' : STRAT[tst][1],
    meter: (any ? cl(50 + ev.diff / Math.max(10, Math.abs(ev.give)) * 60, 2, 98) : 50) + '%', verdict: !any ? 'Pick players or picks on either side to build an offer.' : ev.ok ? 'They would likely accept.' : ev.diff < -Math.max(10, Math.abs(ev.give)) * 0.4 ? 'Not close yet.' : 'Close. A little more should do it.',
    cantPropose: !any || (!s.god && (!salOk || !rosOk)), cantBalance: !any, hasMsg: !!s.tMsg, msg: s.tMsg };
  const teamOptions = T.filter(t => t.tid !== s.me).map(t => ({ value: t.tid, label: t.region + ' ' + t.name + ' · ' + (mine2(t.tid) ? 'Also yours' : STRAT[strat[t.tid]][0]) }));

  const MOOD = { Eager: ['var(--color-accent-100)', 'var(--color-accent-800)'], Open: ['var(--color-neutral-100)', 'var(--color-neutral-800)'], Reluctant: ['transparent', 'var(--color-neutral-600)'] };
  const faCols = hdr('fa', [['name', 'Player', 'left'], ['pos', 'Pos', 'left'], ['age', 'Age'], ['ovr', 'Ovr'], ['pot', 'Pot'], ['ask', 'Asking'], ['exp', 'Through'], ['mood', 'Mood', 'left'], ['mot', 'Wants', 'left']]);
  const faRows = sortBy(s.fa.map(id => { const p = P[id], how = gm.signHow(p, s); return { ...pBase(id), askS: money(gm.askFor(p, s)), mot: p.pers.mot, moodBg: MOOD[p.mood][0], moodFg: MOOD[p.mood][1], cant: !how, how: how || (mine.length >= 15 ? 'Roster full' : 'Can\u2019t fit'), sign: () => gm.setState({ dialog: { type: 'sign', pid: id } }) }; }), s.sort.fa);
  const faNote = 'Over the cap you can still sign players at the veteran minimum (' + money(gm.VMIN) + ') or use the non-taxpayer mid-level exception once (up to ' + money(gm.MLE) + ', staying under the 1st apron). Mid-level: ' + (s.mleUsed ? 'used.' : 'available.');

  const scoutF = 1.5 - (s.budget.Scouting - 1) / 11;
  const yearsOut = s.dClass - gm.Y, spread = (yearsOut * 5 + 3) * scoutF;
  const est = (p, i) => Math.round((i ? p.pot : p.ovr) + p.nz[i] * spread * 1.6);
  const cur = s.phase === 'draft' ? s.picks[s.pi] : null, onClock = !!cur && mine2(gm.owner2027(cur.orig, s.assets)), taken = new Set(s.picks.filter(x => x.pid).map(x => x.pid));
  const myPicks = s.picks.filter(x => mine2(gm.owner2027(x.orig, s.assets))), myNext = myPicks.find(x => !x.pid);
  const isCur = s.dClass === gm.Y;
  const clsIds = d.cls[s.dClass].filter(id => !isCur || !taken.has(id));
  const draftCols = hdr('draft', [['rank', 'Rk'], ['name', 'Prospect', 'left'], ['pos', 'Pos', 'left'], ['age', 'Age'], ['fromT', 'Playing for', 'left'], ['hgt', 'Hgt'], ['ovr', isCur ? 'Ovr' : 'Ovr range'], ['pot', isCur ? 'Pot' : 'Pot range']]);
  const rng = (p, i) => { const e = est(p, i), w = Math.round(spread); return isCur ? String(e) : Math.max(20, e - w) + '–' + Math.min(90, e + w); };
  const draftRows = sortBy(clsIds.map(id => { const p = P[id]; return { ...pBase(id), rank: d.rank[id], ovr: est(p, 0), pot: est(p, 1), ovrS: rng(p, 0), potS: rng(p, 1), tone: tone(est(p, 0)), ptone: tone(est(p, 1)), fromT: p.from.team, fromL: p.from.lg, showDraft: isCur, cant: !onClock, draft: () => gm.draftPick(id) }; }), s.sort.draft);
  const scoutRank = ord(1 + d.lg.Scouting.filter(x => x > s.budget.Scouting).length);
  const conf2 = s.budget.Scouting >= 7 ? 'We have seen him plenty; high confidence.' : s.budget.Scouting >= 3.5 ? 'Moderate confidence in the read.' : 'Limited film on him. A bigger scouting budget would sharpen gm.';
  const advice = [];
  if (isCur && myNext) {
    const ahead = Math.max(0, myNext.n - 1 - s.pi);
    const avail = d.cls[gm.Y].filter(id => !taken.has(id));
    const pool = avail.slice(Math.round(ahead * 0.85));
    const where = ahead ? 'likely there at #' + myNext.n : 'on the board now';
    if (s.adv.scouts && pool.length) {
      const b = pool.slice(0, 12).sort((x, y) => (est(P[y], 1) * .75 + est(P[y], 0) * .25) - (est(P[x], 1) * .75 + est(P[x], 0) * .25))[0], p = P[b];
      advice.push({ who: 'Scouting department', name: p.name, meta: p.pos + ' · ' + p.age + ' · ' + p.from.team + ' (' + p.from.lg + ') · ' + C[p.rep].n, open: open(b), canDraft: onClock, draft: () => gm.draftPick(b), why: 'Highest ceiling we project among players ' + where + ': potential around ' + est(p, 1) + ', overall ' + est(p, 0) + ' today. ' + conf2 + ' Our scouting budget ranks ' + scoutRank + '.' });
    }
    if (s.adv.agm && pool.length) {
      const top = pool.slice(0, 10);
      const sc = id => { const fit = gm.rolesOf(P[id], true).filter(r => gaps.includes(r)); return { id, fit, v: (est(P[id], 1) * .7 + est(P[id], 0) * .3) + fit.length * 6 + (P[id].age <= 19 ? 2 : 0) }; };
      const b = top.map(sc).sort((x, y) => y.v - x.v)[0], p = P[b.id], bpa = top[0] === b.id;
      const why = b.fit.length ? 'We\u2019re thin at ' + gaps.slice(0, 2).join(' and ').toLowerCase() + '. ' + p.name + ' projects as a ' + b.fit.join(' and ').toLowerCase() + (bpa ? ', and he\u2019s also the best player ' + where + '.' : '. He\u2019s #' + d.rank[b.id] + ' on the board, so it\u2019s a slight reach for fit, but he fills a hole.') : 'No need is worth reaching for. Take the best player ' + where + ': ' + p.name + ' (#' + d.rank[b.id] + ').';
      advice.push({ who: 'Assistant GM', name: p.name, meta: p.pos + ' · ' + p.age + ' · ' + p.from.team + ' (' + p.from.lg + ') · ' + C[p.rep].n, open: open(b.id), canDraft: onClock, draft: () => gm.draftPick(b.id), why });
    }
  }
  const dr = { isCurrent: isCur, isFuture: !isCur, hasAdvice: advice.length > 0, advice, noAdvice: !myNext,
    classNote: isCur ? 'Ratings are your scouts\u2019 estimates (±' + Math.round(spread) + ').' : 'Early look, ' + yearsOut + ' year' + (yearsOut > 1 ? 's' : '') + ' out. Ranges narrow as prospects develop and as you spend more on scouting.',
    scoutLine: 'Scouting budget ' + money(s.budget.Scouting) + ' (' + scoutRank + ' in the league). Ranges shown are ±' + Math.round(spread) + '.',
    myFuture: s.assets.filter(a => a.owner === s.me && a.yr === s.dClass).map(a => ({ label: gm.pickLabel(a, T), proj: projTxt(a) })),
    status: cur ? 'Pick ' + cur.n + ' · ' + (onClock ? 'You are on the clock' + (gm.owner2027(cur.orig, s.assets) !== s.me ? ' as ' + T[gm.owner2027(cur.orig, s.assets)].abbr : '') : T[gm.owner2027(cur.orig, s.assets)].region + ' ' + T[gm.owner2027(cur.orig, s.assets)].name + ' on the clock') : 'First round complete',
    sub: myPicks.length ? (myNext ? 'Your next pick: #' + myNext.n : 'Your picks are in') : 'You don\u2019t own a first this year', noSimMine: !cur || onClock || !myNext, done: !cur,
    order: s.picks.map((x, i) => { const ow = gm.owner2027(x.orig, s.assets); return { n: x.n, logoLg: logo(ow, 26), team: T[ow].region + ' ' + T[ow].name, via: ow !== x.orig ? 'via ' + T[x.orig].abbr : '', onClock: i === s.pi && !x.pid, pid: x.pid, pmeta: x.pid ? P[x.pid].pos + ' · ' + P[x.pid].ovr + '/' + P[x.pid].pot + ' · ' + (P[x.pid].from?.team || '') : '', openP: x.pid ? open(x.pid) : null, mine: mine2(ow), logo: logo(ow, 16), openT: openTeam(ow), abbr: T[ow].abbr, who: x.pid ? P[x.pid].name : i === s.pi ? 'On the clock' : (ow !== x.orig ? 'via ' + T[x.orig].abbr : ''), fs: x.pid ? 'normal' : 'italic', bg: i === s.pi ? 'var(--color-accent-100)' : 'transparent', color: mine2(ow) ? 'var(--color-accent-700)' : 'var(--color-text)', fw: mine2(ow) ? 600 : 400 }; }) };
  if (dr.myFuture.length === 0) dr.myFuture = [{ label: 'No picks in this class', proj: '' }];
  if (s.phase !== 'draft') { const pre = ['regular', 'playin', 'playoffs', 'lottery'].includes(s.phase); dr.status = pre ? 'Draft night comes after the playoffs and lottery' : 'The ' + gm.Y + ' draft is complete'; dr.sub = pre ? 'Order shown is projected from the standings. Use the bar above to move through the season.' : ''; dr.noSimMine = true; dr.done = true; }
  const dClasses = [gm.Y, (gm.Y + 1), (gm.Y + 2)].map(y => ({ label: y === gm.Y ? y + ' · this June' : String(y), onClick: () => gm.setState({ dClass: y, adv: {} }), color: s.dClass === y ? 'var(--color-accent-700)' : 'var(--color-text)', ring: s.dClass === y ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }));

  const b = s.budget, lgAvg = k => d.lg[k].reduce((a, x) => a + x, 0) / d.lg[k].length, rel = k => (b[k] / lgAvg(k) - 1);
  const sgn = v => (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)) + '%';
  const wp = pct(me);
  const mk = me.mkt, mRank = 1 + T.filter(t => t.mkt > mk).length;
  const F = financesOf(gm, s, s.me), att = F.att, taxBill = F.taxBill, rev = F.rev, exp = F.exp, net = F.net;
  const EFF = { Coaching: 'Player progression ' + sgn(rel('Coaching') * 25) + ' vs league average', Health: 'Injury recovery ' + sgn(rel('Health') * 30) + ' vs league average', Facilities: 'Attendance and hype ' + sgn(rel('Facilities') * 15) + ', builds over seasons', Scouting: 'Draft ratings ±' + Math.round(3 * scoutF) + ' this year, ±' + Math.round(13 * scoutF) + ' two classes out', Tickets: att.toLocaleString() + ' per game · ' + Math.round(F.full * 100) + '% of ' + F.cap.toLocaleString() + ' seats' };
  const YRS = [gm.Y, (gm.Y + 1), (gm.Y + 2), (gm.Y + 3), (gm.Y + 4)];
  const led = mine.map(id => P[id]).sort((x, y) => y.amt - x.amt);
  const pos = v => (cl(v, 120, 240) - 120) / 120 * 100 + '%';
  const fin = { payroll: money(payroll), payW: pos(payroll), status: payroll > gm.AP2 ? 'Above the 2nd apron: heavy trade and signing restrictions.' : payroll > gm.AP1 ? 'Above the 1st apron: no mid-level, trades must match 100%.' : payroll > gm.TAX ? 'In the tax: paying ' + money(taxBill) + ' this season.' : payroll > gm.CAP ? 'Over the cap, ' + money(gm.TAX - payroll) + ' under the tax and ' + money(gm.AP1 - payroll) + ' under the 1st apron.' : money(capRoom) + ' in cap space.',
    marks: [['Minimum', gm.MINP, 1], ['Cap', gm.CAP, 0], ['Tax', gm.TAX, 1], ['1st apron', gm.AP1, 0], ['2nd apron', gm.AP2, 1]].map(([label, v, below]) => ({ label, val: money(v), left: pos(v), top: below ? '28px' : '-20px' })),
    rev: rev.map(([name, v]) => ({ name, v: money(v) })), exp: exp.map(([name, v]) => ({ name, v: money(v) })), net: money(net), netColor: net < 0 ? 'var(--color-accent-800)' : 'var(--color-text)',
    budget: ['Tickets', 'Coaching', 'Health', 'Facilities', 'Scouting'].map(k => { const [mn, mx, , stp] = d.BUD[k]; return { name: k === 'Tickets' ? 'Ticket price' : k, min: mn, max: mx, step: stp, v: b[k], range: k === 'Tickets' ? '$' + mn + '–$' + mx + ' average' : money(mn) + '–' + money(mx), amt: k === 'Tickets' ? '$' + b[k] : money(b[k]), rank: ord(1 + d.lg[k].filter(x => x > b[k]).length), effect: EFF[k], set: e => { const v = +e.target.value; gm.setState(st => ({ budget: { ...st.budget, [k]: v } })); } }; }),
    years: YRS.map(y => '’' + String(y - 1).slice(2) + '–' + String(y).slice(2)), ledger: led.map(p => ({ name: p.name, open: open(p.id), cells: YRS.map(y => gm.salAt(p, y) ? money(gm.salAt(p, y)) : '') })), totals: YRS.map(y => money(led.reduce((a, p) => a + gm.salAt(p, y), 0))) };

  const usL = gm.simTeam(s, 0), themL = gm.simTeam(s, g.opp), [hT, aT] = g.home ? [0, g.opp] : [g.opp, 0];
  const live = { home: g.home ? usL : themL, away: g.home ? themL : usL, userSide: g.home ? 'home' : 'away', norms: d.norms, logos: { home: logo(hT, 44), away: logo(aT, 44), homeSm: logo(hT, 22), awaySm: logo(aT, 22) }, onPlayer: id => gm.setState({ pid: id, modal: true, ptab: 'overview', extYears: null, extAmt: null, extMsg: null }), onTeam: tid => gm.setState({ teamModal: tid }), onFinish: r => { if (s.phase === 'playin') gm.simPlayin(r); else if (s.phase === 'playoffs') gm.simPo('game', r); else gm.sim(1, r); gm.setState({ screen: s.phase === 'regular' ? 'dash' : 'playoffs' }); } };
  const left = s.phase === 'regular' ? Math.max(0, 82 - me.w - me.l) : 0;
  const schedRows = [...myResults.slice().reverse().map(r => ({ logo: logo(r.opp), openT: openTeam(r.opp), date: gm.fmtS(r.day), opp: (r.home ? 'vs ' : 'at ') + T[r.opp].region + ' ' + T[r.opp].name, rec: T[r.opp].w + '–' + T[r.opp].l, res: (r.win ? 'W ' : 'L ') + r.us + '–' + r.them, resColor: r.win ? 'var(--gm-good)' : 'var(--gm-bad)', isNext: false, notNext: true, bg: 'transparent' })),
    ...Array.from({ length: Math.min(15, left) }, (_, k) => { const gg = gm.userGame(s.day + k), o = T[gg.opp]; return { logo: logo(gg.opp), openT: openTeam(gg.opp), date: gm.fmtS(s.day + k), opp: (gg.home ? 'vs ' : 'at ') + o.region + ' ' + o.name, rec: o.w + '–' + o.l, res: '—', resColor: 'var(--color-neutral-600)', isNext: k === 0, notNext: k !== 0, bg: k === 0 ? 'var(--color-accent-100)' : 'transparent' }; })];
  const typeOf = t => /^Traded/.test(t) ? 'Trade' : /^Signed/.test(t) ? 'Signing' : /^Released/.test(t) ? 'Release' : 'Draft';
  const allTx = [...s.log.map(l => ({ day: l.day ?? s.day, type: typeOf(l.text), teams: me.abbr, text: l.text, mine: true })), ...s.lgLog.map(e => ({ ...e, mine: false }))].sort((x, y) => y.day - x.day);
  const txRows = allTx.filter(x => s.txFilter === 'All' || x.type === s.txFilter).map(x => ({ date: gm.fmtS(x.day), type: x.type, teams: x.teams, teamLinks: String(x.teams).split(' · ').map(ab => ({ abbr: ab, open: openTeam(T.findIndex(t => t.abbr === ab)) })), text: linkNames(x.text, id => open(id)(null), { P }), bg: x.mine ? 'var(--color-accent-100)' : 'transparent' }));
  const txSegs = ['All', 'Trade', 'Signing', 'Release', 'Draft'].map(k => ({ label: k === 'All' ? 'All' : k === 'Trade' ? 'Trades' : k === 'Signing' ? 'Signings' : k === 'Release' ? 'Releases' : 'Draft', onClick: () => gm.setState({ txFilter: k }), color: s.txFilter === k ? 'var(--color-accent-700)' : 'var(--color-text)', ring: s.txFilter === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }));
  const teamOf = id => { const t = tidOf[id]; return t >= 0 ? T[t].abbr : t === -1 ? 'Free agent' : t === -2 ? 'Overseas' : 'Class of ' + P[id].cls; };
  const openC = code => e => { e && e.stopPropagation && e.stopPropagation(); gm.setState({ listModal: { type: 'country', code }, modal: false }); };
  const openClass = yr => e => { e && e.stopPropagation && e.stopPropagation(); gm.setState({ listModal: { type: 'class', year: yr }, modal: false }); };
  pl.openRep = openC(pp.rep);
  pl.bgRows = [...pl.bgRows.map(r => ({ ...r, open: r.k === 'Born' ? openC(pp.born) : r.k === 'Represents' ? openC(pp.rep) : () => {} })), { k: 'Draft class', hasFlag: false, flag: '', v: pp.cls ? 'Class of ' + pp.cls : pp.draft + (pp.dr ? ' · round ' + pp.dr.rd + ', pick ' + pp.dr.pick : ' · undrafted'), open: openClass(pp.cls || pp.draft) }, ...(pp.heritage && pp.her && C[pp.her] ? [{ k: 'Heritage', hasFlag: true, flag: gm.flag(pp.her), v: pp.heritage + ' · ' + C[pp.her].n, open: openC(pp.her) }] : [])];
  pl.elig = pl.elig.map((e, i) => ({ ...e, open: openC(pp.elig[i].c) }));
  const LMs = s.listModal; let lm = {};
  if (LMs) {
    const act = (Object.values(P) as any[]).filter(p => tidOf[p.id] !== undefined || (p.cls && p.cls >= gm.Y));
    let ps = LMs.type === 'country' ? act.filter(p => p.rep === LMs.code).sort((x, y) => y.ovr - x.ovr) : act.filter(p => p.cls ? p.cls === LMs.year : p.draft === LMs.year && !p.cls);
    if (LMs.type === 'class') ps.sort((x, y) => (x.cls ? d.rank[x.id] : x.dr ? (x.dr.rd - 1) * 30 + x.dr.pick : 99) - (y.cls ? d.rank[y.id] : y.dr ? (y.dr.rd - 1) * 30 + y.dr.pick : 99));
    lm = { title: LMs.type === 'country' ? C[LMs.code].n : LMs.year + ' draft class', flag: LMs.type === 'country' ? gm.flag(LMs.code) : '', hasFlag: LMs.type === 'country', sub: ps.length + ' players' + (LMs.type === 'country' ? ' represent ' + C[LMs.code].n : ''), extraH: LMs.type === 'country' ? 'Born' : 'Pick',
      rows: ps.map(p => ({ ...pBase(p.id), team: teamOf(p.id), openT: openTeam(tidOf[p.id] ?? -1), extra: LMs.type === 'country' ? C[p.born].n : p.cls ? 'Board #' + d.rank[p.id] : p.dr ? 'Rd ' + p.dr.rd + ', #' + p.dr.pick + ' (' + ((p.dr.rd - 1) * 30 + p.dr.pick) + ' overall)' : 'Undrafted' })) };
  }
  const togList = (lid, pid) => () => gm.setState(st => ({ lists: st.lists.map(l => l.id !== lid ? l : { ...l, ids: l.ids.includes(pid) ? l.ids.filter(x => x !== pid) : [...l.ids, pid] }) }));
  pl.lists = s.lists.map(l => { const on = l.ids.includes(pp.id); return { name: l.name, mark: on ? '✓ ' : '+ ', toggle: togList(l.id, pp.id), color: on ? 'var(--color-accent-800)' : 'var(--color-text)', bg: on ? 'var(--color-accent-100)' : 'transparent', border: on ? 'var(--color-accent)' : 'var(--color-divider)' }; });
  const shortlists = s.lists.map(l => ({ name: l.name, count: l.ids.length + (l.ids.length === 1 ? ' player' : ' players'), empty: l.ids.length === 0, del: () => gm.setState(st => ({ lists: st.lists.filter(x => x.id !== l.id) })),
    rows: l.ids.map(id => ({ ...pBase(id), team: teamOf(id), openT: openTeam(tidOf[id] ?? -1), money: tidOf[id] === -1 ? 'Asking ' + money(P[id].ask) : P[id].cls && tidOf[id] === undefined ? '—' : money(P[id].amt), remove: e => { e.stopPropagation(); togList(l.id, id)(); } })) }));
  {
    const m = pp.pers.mot, conf = T.filter(t => t.conf === me.conf).sort(byPct), top = conf.indexOf(me) < 6;
    const MOTD = { Winning: 'Wants to compete for titles. Will take less to join a contender and grows restless on a losing team.', Money: 'Chases the biggest contract on the table; veterans also push for more years.', Fame: 'Wants a big stage: large media markets and lifestyle cities.', Loyalty: 'Values stability and grows more attached the longer he stays.', 'Playing time': 'Wants minutes and a starting role above all else.' };
    const FIT = { Winning: top ? 'Would see ' + me.region + ' as a contender.' : 'Your record would be a hard sell.', Money: 'Will follow the biggest offer.', Fame: me.mkt >= 1.1 ? me.region + '\u2019s market appeals to him.' : 'Would prefer a bigger market than ' + me.region + '.', Loyalty: 'Hard to pry away from his current team.', 'Playing time': 'Would want a clear path to starter minutes.' };
    const md = status === 'mine' ? gm.moodOf(pp, mine.indexOf(pp.id), s) : null;
    pl.openT = openTeam(ptid >= 0 ? ptid : pk ? gm.owner2027(pk.orig, s.assets) : -1);
    pl.mot = m; pl.motDesc = MOTD[m]; pl.traits = [pp.pers.alpha && 'Wants to lead his own team', pp.pers.touches && 'Wants the ball', pp.pers.pro && 'Consummate professional', pp.pers.volatile && 'Volatile', pp.pers.crowd && 'Crowd reliant', pp.pers.clutch && 'Clutch', pp.pers.prone && 'Injury prone'].filter(Boolean);
    if (!pl.traits.length) pl.traits = ['Even-keeled'];
    pl.hasMood = !!md; pl.noMood = !md; pl.hapLabel = md ? md.hapLabel + ' · ' + md.hap : ''; pl.hapColor = md ? md.hapColor : 'var(--color-text)'; pl.hapW = md ? md.hap + '%' : '0%';
    pl.factors = md ? md.factors.map(([n, v]) => ({ n, v: (v > 0 ? '+' : '') + v, color: v > 0 ? 'var(--gm-good)' : 'var(--gm-bad)' })) : [];
    pl.fitNote = 'Happiness is tracked for players on your roster. ' + FIT[m];
    const svc = Math.max(0, (gm.Y - 1) - pp.draft), maxPct = svc >= 10 ? .35 : svc >= 7 ? .30 : .25, maxSal = gm.CAP * maxPct;
    const bird = pp.yrsWith >= 3 ? 'Full Bird' : pp.yrsWith === 2 ? 'Early Bird' : 'Non-Bird';
    const birdCap = pp.yrsWith >= 3 ? 'can re-sign him up to the max (' + money(maxSal) + ') while over the cap' : pp.yrsWith === 2 ? 'can re-sign him for up to 175% of his salary (' + money(Math.min(maxSal, pp.amt * 1.75)) + ') while over the cap' : 'can re-sign him for up to 120% of his salary (' + money(pp.amt * 1.2) + ') while over the cap';
    const qo = pp.amt * 1.35;
    pl.cRows = status === 'pro' ? [{ k: 'Status', v: 'Draft prospect' }, { k: 'If drafted in round 1', v: '4-year rookie-scale contract' }] : status === 'fa' ? [{ k: 'Asking', v: money(gm.askFor(pp, s)) + ' per year' }, { k: 'Through', v: String(pp.exp) }, { k: 'Wants', v: m }, { k: 'Service', v: svc + ' seasons' }, { k: 'Max salary', v: money(maxSal) + ' (' + maxPct * 100 + '% of cap)' }] :
      [{ k: gm.seasonLbl() + ' salary', v: money(pp.amt) }, { k: 'Through', v: String(pp.exp) + (pp.ext ? ', extended to ' + (pp.exp + pp.ext.yrs) + ' at ' + money(pp.ext.amt) : '') }, { k: 'Contract type', v: pp.rookie ? 'Rookie scale (1st round)' : pp.amt <= 3.9 ? 'Minimum' : 'Veteran' }, { k: 'Bird rights', v: bird + ' · ' + pp.yrsWith + ' season' + (pp.yrsWith === 1 ? '' : 's') + ' with the team' }, { k: 'Service', v: svc + ' seasons' }, { k: 'Max salary tier', v: maxPct * 100 + '% of cap (' + money(maxSal) + ')' }];
    pl.cStatus = status === 'pro' ? 'Not yet drafted.' : status === 'fa' ? 'Unrestricted free agent.' : pp.exp === gm.Y && !pp.ext ? (pp.rookie ? 'Restricted free agent in July. A qualifying offer of ' + money(qo) + ' keeps the right to match any offer sheet.' : 'Unrestricted free agent in July.' + (status === 'mine' ? ' With ' + bird + ' rights you ' + birdCap + '.' : '')) : 'Under contract through ' + (pp.ext ? pp.exp + pp.ext.yrs : pp.exp) + '.';
    const canExt = status === 'mine' && !pp.ext && (pp.rookie ? pp.exp === (gm.Y + 1) : pp.exp <= (gm.Y + 1) && pp.yrsWith >= 2);
    pl.canExt = canExt; pl.noExt = !canExt;
    pl.extWhy = status !== 'mine' ? 'Only players on your roster can be extended.' : pp.ext ? 'Already extended through ' + (pp.exp + pp.ext.yrs) + '.' : pp.rookie && pp.exp === gm.Y ? 'His rookie-scale extension window closed Oct. 21. He becomes a restricted free agent in July; a ' + money(qo) + ' qualifying offer keeps your right to match.' : pp.rookie ? 'Rookie-scale players can be extended in the offseason before their final season (summer ' + (pp.exp - 1) + ').' : pp.yrsWith < 2 ? 'Veterans become extension-eligible two years after signing.' : 'Only players with two or fewer seasons left can be extended.';
    pl.tabOverview = (s.ptab || 'overview') === 'overview'; pl.tabContract = s.ptab === 'contract'; pl.tabHistory = s.ptab === 'history'; pl.tabEdit = s.ptab === 'edit' && !!s.god; pl.tabDev = s.ptab === 'dev'; pl.tabCompare = s.ptab === 'compare'; pl.nativeSep = pp.native ? '| ' + pp.native : '';
    {
      const mut = fn => { fn(pp); gm.setState(st => ({ gv: (st.gv || 0) + 1 })); };
      const chip = on => ({ bg: on ? 'var(--color-accent-100)' : 'transparent', color: on ? 'var(--color-accent-800)' : 'var(--color-text)', border: on ? 'var(--color-accent)' : 'var(--color-divider)', mark: on ? '✓ ' : '+ ' });
      pl.ed = { name: pp.name, native: pp.native || '', setName: e => mut(p => p.name = e.target.value), setNative: e => mut(p => p.native = e.target.value),
        sliders: [['Age', 'age', 16, 42, 1], ['Overall', 'ovr', 25, 85, 1], ['Potential', 'pot', 25, 90, 1], ['Salary', 'amt', 1.1, gm.MAXC, .1], ['Contract through', 'exp', gm.Y, gm.Y + 5, 1]].map(([label, k, mn, mx, stp]) => ({ label, min: mn, max: mx, step: stp, v: pp[k], val: k === 'amt' ? money(pp[k]) : String(pp[k]), set: e => mut(p => { const v = +e.target.value; if (k === 'age') { p.age = v; if (v >= 29) p.pot = Math.max(p.ovr, Math.min(p.pot, p.ovr + (v < 31 ? 2 : 0))); else if (v <= 22 && p.pot < p.ovr + 3) p.pot = Math.min(90, p.ovr + 3); if (p.dob) p.dob = (gm.Y - 1 - v) + p.dob.slice(4); return; } if (k === 'ovr') { const dl = v - p.ovr; Object.keys(p.r).forEach(x => p.r[x] = cl(p.r[x] + dl, 4, 99)); if (p.pot < v) p.pot = v; } if (k === 'pot' && v < p.ovr) return; p[k] = v; }) })),
        ratings: RG.flatMap(([, ks]) => ks).map(([k, label]) => ({ label, min: 4, max: 99, step: 1, v: pp.r[k], val: String(pp.r[k]), set: e => mut(p => p.r[k] = +e.target.value) })),
        motOpts: ['Winning', 'Money', 'Fame', 'Loyalty', 'Playing time'].map(x => ({ v: x, label: x })), motV: pp.pers.mot, setMot: e => mut(p => p.pers.mot = e.target.value),
        repOpts: Object.keys(C).sort((x, y) => C[x].n.localeCompare(C[y].n)).map(c => ({ v: c, label: C[c].n })), repV: pp.rep, setRep: e => { const code = e.target.value; const undo = gm.renationalize(pp, code); gm.setState(st => ({ gv: (st.gv || 0) + 1, nameUndo: undo })); },
        teamOpts: [{ v: '-1', label: 'Free agent' }, ...T.map(t => ({ v: String(t.tid), label: t.region + ' ' + t.name }))], teamV: String(ptid ?? -1),
        setTeam: e => { const to = +e.target.value; gm.setState(st => { const rosters = { ...st.rosters }; let fa = st.fa.filter(x => x !== pp.id); Object.keys(rosters).forEach(k => rosters[k] = rosters[k].filter(x => x !== pp.id)); if (to === -1) fa = [pp.id, ...fa]; else rosters[to] = [...rosters[to], pp.id]; return { rosters, fa, log: gm.logEntry(st, 'God Mode: moved ' + pp.name + ' to ' + (to === -1 ? 'free agency' : st.teams[to].abbr)) }; }); },
        traits: [['alpha', 'Wants to lead'], ['touches', 'Wants the ball'], ['pro', 'Professional'], ['volatile', 'Volatile'], ['crowd', 'Crowd reliant'], ['clutch', 'Clutch'], ['prone', 'Injury prone'], ['padder', 'Stat padder']].map(([k, label]) => ({ label, ...chip(!!pp.pers[k]), toggle: () => mut(p => p.pers[k] = !p.pers[k]) })),
        health: pp.inj ? pp.inj.name + ', ' + pp.inj.games + ' games left' : 'Healthy',
        heal: () => mut(p => { delete p.inj; }), injMinor: () => mut(p => p.inj = { name: 'Ankle sprain', games: 5 }), injMajor: () => mut(p => p.inj = { name: 'Torn ACL', games: 90, major: true }) };
    }
    var ptabs = [['overview', 'Overview'], ['contract', 'Contract'], ['dev', 'Development'], ['history', 'History'], ['compare', 'Comparison'], ...(s.god ? [['edit', 'Edit player']] : [])].map(([k, label]) => { const on = (s.ptab || 'overview') === k; return { label, go: () => gm.setState({ ptab: k }), color: on ? 'var(--color-accent-700)' : 'var(--color-text)', fw: on ? 600 : 400, ul: on ? 'var(--color-accent)' : 'transparent' }; });
    var ext = {};
    if (canExt) {
      const maxAllowed = +(pp.rookie ? maxSal : Math.min(maxSal, pp.amt * 1.4)).toFixed(1), minS = pp.age <= 22 ? 1.35 : 2.44;
      let ask = gm.fair(pp.ovr) * (m === 'Money' ? 1.15 : m === 'Winning' && top ? .9 : m === 'Loyalty' ? .92 : 1) * (md.hap < 45 ? 1.2 : 1);
      ask = +gm.cl(ask, minS, maxAllowed).toFixed(1);
      const minYears = m === 'Money' && pp.age >= 30 ? 4 : m === 'Loyalty' ? 1 : 2, maxYears = pp.rookie ? 5 : 4;
      const yrs = s.extYears ?? 3, amt = s.extAmt ?? ask;
      ext = { maxYears, years: yrs, yearsLabel: yrs + (yrs === 1 ? ' year' : ' years'), min: minS, max: maxAllowed, amt, amtLabel: money(amt),
        rule: pp.rookie ? 'Rookie-scale extension: up to 5 years, capped at ' + maxPct * 100 + '% of the cap for his service level.' : 'Veteran extension: up to 4 years; the first year can be at most 140% of his current salary (' + money(pp.amt * 1.4) + ').',
        askLine: md.hap < 30 ? 'His camp says he wants a fresh start.' : 'His camp is looking for about ' + money(ask) + ' a year over at least ' + minYears + ' year' + (minYears > 1 ? 's' : '') + '.',
        setYears: e => gm.setState({ extYears: +e.target.value, extMsg: null }), setAmt: e => gm.setState({ extAmt: +e.target.value, extMsg: null }),
        hasMsg: !!s.extMsg, msg: s.extMsg,
        offer: () => { if (md.hap < 30) return gm.setState({ extMsg: pp.name + ' declined to discuss an extension.' }); if (amt >= ask - 0.05 && yrs >= minYears) { pp.ext = { amt, yrs }; gm.setState(st => ({ extMsg: 'Agreed: ' + yrs + ' years at ' + money(amt) + ' per year, starting ' + (pp.exp) + '–' + String(pp.exp + 1).slice(2) + '.', log: gm.logEntry(st, 'Extended ' + pp.name + ': ' + yrs + ' yrs, ' + money(amt) + '/yr') })); } else gm.setState({ extMsg: 'No deal. They want about ' + money(ask) + ' a year over at least ' + minYears + ' years.' }); } };
    }
  }
  const tmT = s.teamModal != null ? T[s.teamModal] : null;
  const tm = !tmT ? {} : (() => { const tid = tmT.tid, ids = mine2(tid) ? s.rosters[tid].slice() : s.rosters[tid].slice().sort((x, y) => P[y].ovr - P[x].ovr), pay = ids.reduce((a, id) => a + P[id].amt, 0), cs = T.filter(t => t.conf === tmT.conf).sort(byPct), ks = s.assets.filter(a => a.owner === tid && !usedPick(a));
    return { logo: logo(tid, 58), abbr: tmT.abbr, name: tmT.region + ' ' + tmT.name, line: ord(cs.indexOf(tmT) + 1) + ' in the ' + tmT.conf + ' · ' + tmT.div + ' Division', rec: tmT.w + '–' + tmT.l + ' · ' + strk(tmT) + ' · ' + l10(tmT) + ' last 10', market: (tmT.mkt >= 1.15 ? 'Large' : tmT.mkt >= .95 ? 'Mid-large' : tmT.mkt >= .85 ? 'Mid-size' : 'Small') + ' market',
      strat: tid === s.me ? 'Your team' : mine2(tid) ? 'Also yours' : STRAT[strat[tid]][0], stratDesc: mine2(tid) ? '' : STRAT[strat[tid]][1], payroll: money(pay), cap: pay > gm.TAX ? money(pay - gm.TAX) + ' over the tax' : pay > gm.CAP ? money(pay - gm.CAP) + ' over the cap' : money(gm.CAP - pay) + ' in cap space',
      staff: 'Owner ' + tmT.owner + ' (' + tmT.arch + ') · GM ' + tmT.gm, region: tmT.region, nm: tmT.name, setRegion: e => { const v = e.target.value; gm.setState(st => ({ teams: st.teams.map(t => t.tid === tid ? { ...t, region: v } : t) })); }, setName: e => { const v = e.target.value; gm.setState(st => ({ teams: st.teams.map(t => t.tid === tid ? { ...t, name: v } : t) })); }, setAbbr: e => { const v = e.target.value.toUpperCase().slice(0, 4); gm.setState(st => ({ teams: st.teams.map(t => t.tid === tid ? { ...t, abbr: v } : t) })); },
      rows: ids.map(id => ({ ...pBase(id), contract: money(P[id].amt) })), picks: ks.length ? ks.map(a => gm.pickLabel(a, T) + ' (' + projTxt(a).replace('Proj. ', '') + ')').join(' · ') : 'None', isOther: tid !== s.me,
      trade: () => gm.setState({ teamModal: null, modal: false, screen: 'trade', tTid: tid, tTheirs: [], tkTheirs: [], tMsg: null }),
      canSwitch: mine2(tid) && tid !== s.me, switchTo: () => gm.switchTeam(tid), canTake: !!s.god && !mine2(tid), takeOver: () => { gm.setState({ teamModal: null }); gm.takeOver(tid); }, canResign: mine2(tid) && s.managed.length > 1, resign: () => { gm.setState({ teamModal: null }); gm.handToAI(tid, 'Resigned from'); } }; })();
  const dark = (s.theme ?? 'dark') === 'dark';
  const RV = ownerReview(gm, s, s.me), secV = RV.sec;
  const own = { name: me.owner, arch: me.arch, desc: RV.desc, sec: secV, secW: secV + '%', secLabel: RV.label, secColor: secV >= 70 ? 'var(--gm-good)' : secV >= 40 ? 'var(--color-text)' : 'var(--gm-bad)',
    demands: RV.demands.map(([d0, cur, stt]) => ({ d: d0, cur, stt, color: stt === 'Met' ? 'var(--gm-good)' : stt === 'At risk' ? 'var(--color-accent-700)' : 'var(--gm-bad)' })), limits: RV.limits, fire: s.ownerFiring === false ? ['Firing is off in Settings: the owner still reviews you, but can’t fire you.'] : RV.fire,
    hist: ((s.teamHist || {})[s.me] || []).slice().reverse(), fails: (s.mandateFails || {})[s.me] || 0 };

  const FOCS = ['Balanced', 'Shooting', 'Finishing', 'Playmaking', 'Defense', 'Rebounding', 'Athleticism', 'Conditioning'];
  const lastRep = s.reports[0], lastBy = {}; (lastRep ? lastRep.rows : []).forEach(r => lastBy[r.id] = r);
  const devRows = mine.map(id => { const p = P[id], el = p.dev || (p.age <= 25 && p.ovr < 58); return { ...pBase(id), focus: s.train[id] || 'Balanced', focusOpts: FOCS.map(x => ({ v: x, label: x })), setFocus: e => { const v = e.target.value; gm.setState(st => ({ train: { ...st.train, [id]: v } })); }, asg: p.dev ? 'Dev league' : 'Main roster', asgBtn: p.dev ? 'Recall' : 'Send down', canDev: el, noDev: !el, toggleDev: () => { p.dev = !p.dev; gm.setState(st => ({ log: gm.logEntry(st, (p.dev ? 'Assigned ' : 'Recalled ') + p.name + (p.dev ? ' to the development league' : ' from the development league')) })); }, last: lastBy[id] ? lastBy[id].d : '—', lastColor: lastBy[id] ? (lastBy[id].up ? 'var(--gm-good)' : 'var(--gm-bad)') : 'var(--color-neutral-600)' }; });
  const reportsV = s.reports.map(r => ({ label: r.label, rows: r.rows.map(x => ({ ...x, color: x.up ? 'var(--gm-good)' : 'var(--gm-bad)', open: open(x.id) })) }));
  const REG = regions();
  if (status === 'pro' || status === 'abroad') {
    const fac = gm.regFactor(pp, s), yo = Math.max(0, (pp.cls || gm.Y) - gm.Y), iF = intelF(s, pp.id), margin = Math.round((yo * 5 + 3) * scoutF * fac / iF);
    const LBR = { hgt: 'size', stre: 'strength', spd: 'speed', jmp: 'leaping', endu: 'motor', ins: 'post game', dnk: 'finishing', ft: 'free throws', fg: 'mid-range', tp: 'three-point shooting', oiq: 'feel for the game', diq: 'defensive instincts', drb: 'handle', pss: 'passing', reb: 'rebounding' };
    const relK = Object.keys(pp.r).sort((x, y) => pp.r[y] - pp.r[x]);
    let comp = null, best = 1e9; Object.keys(s.rosters).forEach(t => s.rosters[t].forEach(id => { const q = P[id]; let dd = 0; Object.keys(q.r).forEach(k => dd += Math.pow((q.r[k] - q.ovr) - (pp.r[k] - pp.ovr), 2)); if (dd < best) { best = dd; comp = q; } }));
    const sc = s.scouts.filter(x => x.assign === gm.regionKey((pp.from && pp.from.country) || pp.raised));
    const canPromise = status === 'pro' && pp.cls === gm.Y && ['regular', 'playin', 'playoffs', 'lottery', 'draft'].includes(s.phase) && !!myNext && !taken.has(pp.id) && Object.keys(s.promises).length < 2 && !s.promises[pp.id];
    pl.isPro = true;
    pl.sr = { margin, scout: sc.length ? 'Scouted by ' + sc.map(x => x.name).join(', ') : 'No scout assigned to ' + REG[gm.regionKey((pp.from && pp.from.country) || pp.raised)].name, str: LBR[relK[0]] + ', ' + LBR[relK[1]], weak: LBR[relK[relK.length - 1]] + ', ' + LBR[relK[relK.length - 2]],
      summary: pp.pos + ' who projects as a ' + (gm.rolesOf(pp, true).slice(0, 2).join(' and ').toLowerCase() || 'developmental rotation player') + '. Our read on his ceiling is potential around ' + (pp.pot + Math.round(pp.nz[1] * margin * 1.6)) + ', give or take ' + margin + '.',
      comp: comp ? comp.name : '—', openComp: comp ? open(comp.id) : () => {}, intang: fac <= .6 ? ([pp.pers.alpha && 'wants to lead', pp.pers.pro && 'consummate professional', pp.pers.volatile && 'volatile', pp.pers.clutch && 'clutch', pp.pers.prone && 'injury history'].filter(Boolean).join(', ') || 'even-keeled') + '; motivated by ' + pp.pers.mot.toLowerCase() : 'Unknown until a specialist scouts his region',
      intel: ((s.intel || {})[pp.id] || 0).toFixed(1), focused: (s.scoutFocus || []).includes(pp.id), toggleFocus: () => gm.setState(st => { const f0 = st.scoutFocus || []; return { scoutFocus: f0.includes(pp.id) ? f0.filter(x => x !== pp.id) : [...f0, pp.id].slice(-5) }; }),
      canPromise, promised: !!s.promises[pp.id], pickN: s.promises[pp.id] ? s.promises[pp.id].n : myNext ? myNext.n : '',
      promise: () => gm.setState(st => ({ promises: { ...st.promises, [pp.id]: { n: myNext.n, str: 40 + (fac < .6 ? 25 : 10) + (pp.pers.mot === 'Loyalty' ? 15 : 0) + Math.random() * 15 } }, log: gm.logEntry(st, 'Promised ' + pp.name + ' the No. ' + myNext.n + ' pick') })),
      unpromise: () => gm.setState(st => { const pr = { ...st.promises }; delete pr[pp.id]; return { promises: pr, agentRep: gm.cl(st.agentRep - 5, 0, 100), log: gm.logEntry(st, 'Withdrew the draft promise to ' + pp.name) }; }) };
  } else { pl.isPro = false; pl.sr = {}; }
  const allPros = [gm.Y, gm.Y + 1, gm.Y + 2].flatMap(y => d.cls[y] || []);
  const scoutRegions = (Object.entries(REG) as [string, any][]).map(([k, r]) => { const sc = s.scouts.filter(x => x.assign === k); return { name: r.name, tier: 'Tier ' + r.tier, arche: r.arche, n: allPros.filter(id => gm.regionKey((P[id].from && P[id].from.country) || P[id].raised) === k).length, who: sc.map(x => x.name).join(', ') || 'Unscouted', margin: '±' + Math.round(3 * scoutF * gm.regFactorK(k, s)) + ' now · ±' + Math.round(13 * scoutF * gm.regFactorK(k, s)) + ' in 2 yrs', color: sc.length ? 'var(--color-text)' : 'var(--gm-bad)' }; });
  const scoutsV = s.scouts.map((x, i) => ({ name: x.name, spec: REG[x.spec].name, skill: '★'.repeat(x.skill) + '☆'.repeat(5 - x.skill), assign: x.assign, opts: Object.keys(REG).map(k => ({ v: k, label: REG[k].name })), set: e => { const v = e.target.value; gm.setState(st => ({ scouts: st.scouts.map((y, j) => j === i ? { ...y, assign: v } : y) })); }, match: x.assign === x.spec ? 'Specialty match' : 'Outside specialty: wider margins' }));
  const promisesV = (Object.entries(s.promises) as [string, any][]).map(([id, pr]) => ({ name: P[id].name, n: '#' + pr.n, open: open(+id) }));
  const repV = { v: s.agentRep, label: s.agentRep >= 65 ? 'Trusted by agents' : s.agentRep >= 40 ? 'Neutral' : 'Agents are wary', w: s.agentRep + '%' };
  const ovRows = (s.overseas || []).map(id => { const p = P[id], a = p.abroad || {}; return { ...pBase(id), club: a.club, lg: a.lg, clubC: C[a.country] ? C[a.country].n : '', line: a.pts + ' pts · ' + a.reb + ' reb · ' + a.ast + ' ast', proj: Math.max(25, p.ovr - 3) + '–' + (p.ovr + 3), clause: a.clause, fee: money(a.fee), capHit: a.fee > .85 ? money(a.fee - .85) + ' counts against the cap' : 'No cap hit', ask: money(gm.askFor(p, s)), how: gm.signHow(p, s) || 'Can\u2019t fit', cant: !gm.signHow(p, s), sign: () => gm.setState({ dialog: { type: 'sign', pid: id } }), drafted: p.dr ? 'Drafted ' + p.draft : 'Undrafted ' + p.draft }; }).sort((x, y) => y.ovr - x.ovr);
  const TAC: any[] = [['pace', 'Pace', ['Slow', 'Balanced', 'Fast'], 'Faster pace means more possessions and rewards speed and endurance.'], ['off', 'Offense', ['Inside', 'Balanced', 'Perimeter', 'Pace and space'], 'Shifts your shot mix between the rim, mid-range and threes.'], ['def', 'Defense', ['Drop', 'Switch', 'Aggressive'], 'Aggressive forces turnovers but fouls more; Switch takes away threes; Drop protects the rim.'], ['clutch', 'Clutch play', ['Motion', 'Isolate the star'], 'In the last 5 minutes of a close game, who takes the shots.']];
  // Target minutes per player: his own setting, else the default for his slot among healthy players.
  const healthy = mine.filter(id => !P[id].inj && !P[id].dev), rotOf = id => Math.round(P[id].rot ?? Game.ROTATION[healthy.indexOf(id)] ?? 0);
  const tacV = { groups: TAC.map(([k, label, opts, desc]) => ({ label, desc, opts: opts.map(o => ({ label: o, onClick: () => gm.setState(st => ({ tactics: { ...st.tactics, [k]: o } })), color: s.tactics[k] === o ? 'var(--color-accent-700)' : 'var(--color-text)', ring: s.tactics[k] === o ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })) })), fit: (() => { const f = gm.tacFit(mine, s.tactics); return (f >= 0 ? '+' : '−') + Math.abs(f).toFixed(1) + ' roster fit: how well these settings suit your players'; })(),
    total: Math.round(mine.reduce((a, id) => a + (P[id].inj || P[id].dev ? 0 : rotOf(id)), 0)), rot: mine.map((id, i) => ({ name: P[id].name, pos: P[id].pos, tag: P[id].inj ? 'Injured' : P[id].dev ? 'Dev league' : i < 5 ? 'Starter' : '', v: rotOf(id), val: rotOf(id) + ' min' + (P[id].gp ? ' · plays ' + Math.round(P[id].min) : ''), dis: !!(P[id].inj || P[id].dev), set: e => { P[id].rot = +e.target.value; gm.setState(st => ({ gv: (st.gv || 0) + 1 })); } })) };
  const natTot = (Object.values(s.natW) as any[]).reduce((a, x) => a + (+x || 0), 0);
  const natRows = Object.keys(C).filter(c => s.natW[c] !== undefined).sort((x, y) => (s.natW[y] || 0) - (s.natW[x] || 0)).map(c => ({ flag: gm.flag(c), name: C[c].n, w: s.natW[c], share: ((s.natW[c] || 0) / natTot * 100).toFixed(1) + '%', set: e => { const v = Math.max(0, +e.target.value || 0); gm.setState(st => ({ natW: { ...st.natW, [c]: v } })); }, open: openC(c) }));
  const firing = { on: s.ownerFiring !== false, label: s.ownerFiring === false ? 'Off: owners review you but can’t fire you' : 'On: owners fire you if their written conditions are broken', btn: s.ownerFiring === false ? 'Turn on' : 'Turn off', toggle: () => gm.setState(st => ({ ownerFiring: st.ownerFiring === false })) };
  const god = { on: !!s.god, label: s.god ? 'On' : 'Off', btn: s.god ? 'Turn off' : 'Turn on', toggle: () => gm.setState(st => ({ god: !st.god })) };
  const gp = gm.gamesPlayed(s), PH = [['regular', 'Regular season'], ['playin', 'Play-in'], ['playoffs', 'Playoffs'], ['lottery', 'Lottery'], ['draft', 'Draft'], ['fa', 'Free agency'], ['preseason', 'Preseason']];
  const phK = s.phase;
  const act = (label, go, primary?) => ({ label, go, cls: primary ? 'btn-primary' : 'btn-secondary' });
  const draftDone = s.pi >= s.picks.length;
  const watch = post ? [act('Watch your game', () => gm.setState({ screen: 'game', q: '' }))] : [];
  const ph = { season: gm.seasonLbl() + ' season', steps: PH.map(([k, label]) => ({ label, color: k === phK ? 'var(--color-accent-700)' : 'var(--color-neutral-600)', fw: k === phK ? 600 : 400 })), note: '', actions: [] };
  if (s.phase === 'regular') { if (gp < 82) { ph.note = 'Game ' + gp + ' of 82'; ph.actions = [act('Play a day', () => gm.sim(1)), act('Play a week', () => gm.sim(7)), act('Sim to end of regular season', () => gm.sim(82))]; } else { ph.note = 'Regular season complete · awards are in'; ph.actions = [act('Start the play-in', () => gm.startPlayin(), true)]; } }
  else if (s.phase === 'playin') { const left = gm.playinPending(s.playin).length; ph.note = left ? 'Play-in · ' + left + ' game' + (left === 1 ? '' : 's') + ' next' : 'Play-in complete · seeds 7 and 8 are set'; ph.actions = left ? [...watch, act('Sim play-in games', () => gm.simPlayin(), true)] : [act('Start the playoffs', () => gm.startPlayoffs(), true)]; }
  else if (s.phase === 'playoffs') { if (s.po.champ == null) { ph.note = 'Best-of-7 series · East and West, then the Finals'; ph.actions = [...watch, act('Sim a game', () => gm.simPo('game')), act('Sim round', () => gm.simPo('round')), act('Sim to champion', () => gm.simPo('all'), true)]; } else { ph.note = T[s.po.champ].region + ' ' + T[s.po.champ].name + ' are champions'; ph.actions = [act('End the season · owner review', () => seasonReview(gm), true)]; } }
  else if (s.phase === 'lottery') { ph.note = 'Non-playoff teams; the top 4 picks are drawn'; ph.actions = [act('Run the lottery', () => gm.runLottery(), true)]; }
  else if (s.phase === 'draft') { ph.note = draftDone ? 'Draft complete' : 'Pick ' + (s.pi + 1) + ' of ' + s.picks.length; { const c = s.picks[s.pi], mineNow = c && mine2(gm.owner2027(c.orig, s.assets)); if (!draftDone && mineNow) ph.note = 'You are on the clock' + (gm.owner2027(c.orig, s.assets) !== s.me ? ' as ' + T[gm.owner2027(c.orig, s.assets)].abbr : '') + ': pick from the board'; ph.actions = draftDone ? [act('Open free agency', () => gm.startFA(), true)] : mineNow ? [act('Go to the board', go('draft')), act('Auto-pick for me', () => gm.aiDraft(false))] : [act('Sim to my pick', () => gm.aiDraft(true), true), act('Auto-draft the rest', () => gm.aiDraft(false))]; } }
  else if (s.phase === 'fa') { ph.note = s.fa.length + ' free agents'; ph.actions = [act('Advance a day', () => gm.advanceFA(1)), act('Start preseason', () => gm.startPreseason(), true)]; }
  else if (s.phase === 'preseason') { const overT = s.managed.filter(t => s.rosters[t].length > 15), underT = s.managed.filter(t => s.rosters[t].length < 13); ph.note = underT.length && !overT.length ? 'Under 13 players (' + underT.map(t => T[t].abbr + ' ' + s.rosters[t].length).join(', ') + '): opening night fills the roster with minimum deals, or sign your own' : overT.length ? 'Cut to 15 players before opening night (' + overT.map(t => T[t].abbr + ' ' + s.rosters[t].length).join(', ') + ')' : 'Players have developed; ratings updated'; ph.actions = [{ ...act('Start the regular season', () => gm.startSeason(), true), dis: overT.length > 0 }]; }
  if (s.unemployed) { ph.note = 'You were fired. Accept an offer on the Career screen to continue.'; ph.actions = [act('Go to Career', go('career'), true)]; }
  if (s.simming) ph.note = 'Simulating… ' + s.simming.left + ' day' + (s.simming.left === 1 ? '' : 's') + ' to go';
  ph.actions = ph.actions.map(a => ({ ...a, dis: !!a.dis || !!s.simming }));
  { const prim = ph.actions.find(a => a.cls === 'btn-primary' && !a.dis), NEXT = { regular: 'playin', playin: 'playoffs', playoffs: s.po && s.po.champ != null ? 'lottery' : null, lottery: 'draft', draft: 'fa', fa: 'preseason', preseason: 'regular' }[s.phase], VIEW = { regular: 'dash', playin: 'playoffs', playoffs: 'playoffs', lottery: 'playoffs', draft: 'draft', fa: 'fa', preseason: 'dash' };
    if (s.phase === 'regular' && gp < 82) ph.note += ' · the play-in unlocks after game 82';
    ph.steps = PH.map(([k, label]) => { const cur = k === phK, nx = k === NEXT && !!prim; return { label, go: cur ? go(VIEW[k]) : nx ? prim.go : () => {}, title: nx ? prim.label : cur ? 'Current phase' : '', cursor: cur || nx ? 'pointer' : 'default', border: nx ? '1px solid var(--color-accent)' : '1px solid transparent', color: cur ? 'var(--color-accent-700)' : nx ? 'var(--color-text)' : 'var(--color-neutral-600)', fw: cur || nx ? 600 : 400 }; }); }
  const RNM = ['First round', 'Conference semifinals', 'Conference finals', 'Finals'];
  const serRow = x => { const done = x.wa === 4 || x.wb === 4, aw = x.wa === 4, bw = x.wb === 4; return { la: logo(x.a, 16), lb: logo(x.b, 16), conf: x.conf, na: '(' + x.sa + ') ' + T[x.a].region + ' ' + T[x.a].name, nb: '(' + x.sb + ') ' + T[x.b].region + ' ' + T[x.b].name, wa: x.wa, wb: x.wb, fa: aw ? 600 : 400, fb: bw ? 600 : 400, ca: mine2(x.a) ? 'var(--color-accent-700)' : done && !aw ? 'var(--color-neutral-600)' : 'var(--color-text)', cb: mine2(x.b) ? 'var(--color-accent-700)' : done && !bw ? 'var(--color-neutral-600)' : 'var(--color-text)', oa: openTeam(x.a), ob: openTeam(x.b) }; };
  let poRounds;
  if (s.po) poRounds = s.po.rounds.map((r, i) => ({ name: RNM[i], series: r.map(serRow) }));
  else { const ser = []; ['East', 'West'].forEach(c => { const sd = gm.seeds(s, c); [[0, 7], [3, 4], [2, 5], [1, 6]].forEach(([i, j]) => ser.push({ a: sd[i], sa: i + 1, b: sd[j], sb: j + 1, wa: 0, wb: 0, conf: c })); }); poRounds = [{ name: 'First round, if the season ended today', series: ser.map(x => { const r = serRow(x); if (x.sb >= 7) r.nb = '(' + x.sb + ') Play-in winner'; r.wa = ''; r.wb = ''; return r; }) }]; }
  const pov = { rounds: poRounds, hasChamp: !!(s.po && s.po.champ != null), champName: s.po && s.po.champ != null ? T[s.po.champ].region + ' ' + T[s.po.champ].name : '', champSub: s.po && s.po.champ != null ? 'Beat the ' + T[s.po.runner].region + ' ' + T[s.po.runner].name + ' in the Finals' : '', seasonLbl: gm.seasonLbl(),
    note: s.phase === 'regular' ? 'Seeds 1–6 qualify directly; seeds 7–10 play in for the last two spots.' : '', playin: s.playinRes, hasPlayin: s.playinRes.length > 0,
    history: s.history.map(x => ({ season: x.season, champ: T[x.champ].region + ' ' + T[x.champ].name, runner: T[x.runner].abbr, rec: x.rec, fin: x.fin })), hasHistory: s.history.length > 0,
    lotto: (s.lotto || []).slice(0, 14).map(x => ({ logo: logo(x.t, 16), n: x.n, name: T[x.t].region + ' ' + T[x.t].name, move: x.from > x.n ? '▲ from ' + x.from : x.from < x.n ? '▼ from ' + x.from : '—', color: mine2(x.t) ? 'var(--color-accent-700)' : 'var(--color-text)', open: openTeam(x.t) })), hasLotto: !!s.lotto };
  const LAYOUTS = [['A', 'Almanac', 'Grouped sidebar with the play controls always within reach.'], ['B', 'Broadsheet', 'Newspaper masthead, one row of tabs, full-width tables.'], ['C', 'Desk', 'Icon rail, jump-to-player search, and a side panel with the next game, books and transactions.']];
  const layout = { desc: LAYOUTS.find(x => x[0] === variant)[2], segs: LAYOUTS.map(([k, label]) => ({ label, onClick: () => gm.setState({ variant: k }), color: variant === k ? 'var(--color-accent-700)' : 'var(--color-text)', ring: variant === k ? 'inset 0 0 0 1px var(--color-accent)' : 'none' })) };
  const save = { name: extra.saveName, status: extra.saveStatus, onExport: extra.onExport, onExit: extra.onExit };
  const settings = { expLabel: s.expanded ? 'Expanded to 32 teams' : s.expansion ? 'On: two teams join at the next preseason' : 'Off: 30 teams', expBtn: s.expansion ? 'Turn off' : 'Turn on', expDis: s.expanded, toggleExp: () => gm.setState(st => st.expanded ? null : { expansion: !st.expansion }) };
  const hasProg = s.phase === 'preseason' && !!s.prog, progRows = (s.prog || []).map(x => ({ name: P[x.id].name, from: x.from, to: x.to, d: (x.to - x.from > 0 ? '+' : '') + (x.to - x.from), color: x.to > x.from ? 'var(--gm-good)' : x.to < x.from ? 'var(--gm-bad)' : 'var(--color-text)', open: open(x.id) }));
  const titles = { editor: 'Team & league editor', league: 'League stats', career: 'Career & job market', press: 'Press room', awards: 'Awards', teams: 'My teams', tactics: 'Tactics & rotation', scouting: 'Global scouting', overseas: 'Overseas market', dev: 'Player development', owner: 'Ownership', playoffs: 'Playoffs', settings: 'Settings', game: 'Live game', schedule: 'Schedule', tx: 'League transactions', short: 'Shortlist', dash: 'Dashboard', standings: 'Standings', roster: 'Roster', depth: 'Roster construction', player: 'Player', fin: 'Finances', trade: 'Trade', fa: 'Free agency', draft: 'Draft' };
  const metas = { editor: 'God Mode', league: 'Anchored to the 2026 league averages', career: 'Reputation ' + reputation(s) + ' · ' + ((s.career?.seasons || []).length) + ' seasons', press: 'Owners and GMs around the league, on the record', awards: 'Voted at the end of the regular season', teams: s.managed.length + ' franchise' + (s.managed.length === 1 ? '' : 's') + ' under your control', tactics: 'You are GM and head coach', scouting: s.scouts.length + ' scouts · agent reputation ' + s.agentRep, overseas: (s.overseas || []).length + ' players abroad', dev: 'Growth is calculated monthly', owner: me.owner + ' · ' + me.arch, playoffs: gm.seasonLbl() + ' postseason · 15 teams per conference', settings: '', game: next.oppName, schedule: (me.w + me.l) + ' played · ' + (82 - me.w - me.l) + ' remaining', tx: 'All ' + T.length + ' teams', short: s.lists.reduce((a, l) => a + l.ids.length, 0) + ' players tracked', dash: '', standings: (me.w + me.l) + ' of 82 games played', roster: mine.length + ' players · payroll ' + money(payroll), depth: 'From your current rotation', player: '', fin: 'Market size: ' + (mk >= 1.15 ? 'large' : mk >= .95 ? 'mid-large' : mk >= .85 ? 'mid' : 'small') + ' (' + ord(mRank) + ' of ' + T.length + ') · cap ' + money(gm.CAP), trade: 'Payroll ' + money(payroll), fa: s.fa.length + ' available · ' + (15 - mine.length) + ' roster spot' + (15 - mine.length === 1 ? '' : 's'), draft: isCur ? 'Big board · ' + clsIds.length + ' prospects left' : 'Class of ' + s.dClass + ' · ' + clsIds.length + ' tracked' };
  const page = { kicker: variant === 'B' ? myName : dateLong, title: titles[s.screen], meta: metas[s.screen] };

  const qq = s.q.trim().toLowerCase();
  const matches = qq.length < 2 ? [] : (Object.values(P) as any[]).filter(p => p.name.toLowerCase().includes(qq)).slice(0, 7).map(p => { const t = tidOf[p.id]; return { name: p.name, flag: gm.flag(p.rep), meta: p.pos + ' · ' + (t >= 0 ? T[t].abbr : t === -1 ? 'FA' : 'Class of ' + p.cls) + ' · ' + p.ovr, open: open(p.id) }; });

  const dg = s.dialog, dp = dg && P[dg.pid];
  const how = dg && dg.type === 'sign' ? gm.signHow(dp, s) : null;
  const dlg = !dg ? {} : dg.type === 'abroad' ? { title: 'Release ' + dp.name + ' to play overseas?', body: 'He joins a club abroad, where heavy minutes can rebuild his game. He stays on the overseas market and can be signed back later.', cta: 'Release overseas', confirm: () => gm.confirmDialog() } : dg.type === 'sign' && dp.abroad ? { title: 'Sign ' + dp.name + ' from ' + dp.abroad.club + '?', body: money(gm.askFor(dp, s)) + ' per year. His ' + dp.abroad.clause.toLowerCase() + ' costs ' + money(dp.abroad.fee) + (dp.abroad.fee > .85 ? ', and ' + money(dp.abroad.fee - .85) + ' of it counts against the cap' : '') + '. Expect a 15-game adjustment period.', cta: 'Sign player', confirm: () => gm.confirmDialog() } : dg.type === 'sign' ? (() => { const ask = gm.askFor(dp, s), opts = incentiveOptions(gm, s, dp, s.me, ask), chosen = (dg.inc || []).map(x => x.k), sel = opts.filter(o => chosen.includes(o.k)), base = sel.length ? baseAfterIncentives(ask, sel) : ask, hit = base + sel.filter(x => x.likely).reduce((a, x) => a + x.amt, 0);
      return { title: 'Sign ' + dp.name + '?', body: money(base) + ' base per year through ' + dp.exp + (how ? ', using ' + (how === 'Cap space' ? 'cap space' : how === 'Minimum' ? 'the veteran minimum' : how === 'Taxpayer mid-level' ? 'the taxpayer mid-level' : how === 'Bird rights' ? 'Bird rights' : 'your mid-level exception') : '') + '. Cap hit ' + money(hit) + ' · payroll after: ' + money(payroll + hit) + '.', cta: 'Sign player', confirm: () => gm.confirmDialog(),
        inc: opts.map(o => ({ ...o, on: chosen.includes(o.k), amtS: money(o.amt), toggle: () => gm.setState(st => ({ dialog: { ...st.dialog, inc: chosen.includes(o.k) ? st.dialog.inc.filter(x => x.k !== o.k) : [...(st.dialog.inc || []), o] } })) })) }; })() : { title: 'Release ' + dp.name + '?', body: 'He goes to free agency and any team can sign him. His ' + money(dp.amt) + ' comes off your books.', cta: 'Release', confirm: () => gm.confirmDialog() };

  return {
    ctx: { gm, s, T, logo, open: id => open(id)(null), openTeam: tid => openTeam(tid)(null), isMine: mine2, money, ord, tone },
    switcher: { show: s.managed.length > 1, value: s.me, opts: s.managed.map(t => ({ v: t, label: T[t].region + ' ' + T[t].name })), set: e => gm.switchTeam(+e.target.value) },
    myName, myRegion: me.region, myAbbr: me.abbr, myLogo: logo(s.me, 44), myLogoLg: logo(s.me, 56), myLogoSm: logo(s.me, 34), theirLogo: logo(s.tTid, 28), myLogoTr: logo(s.me, 28),
    phaseLabel: gm.seasonLbl() + ' ' + { regular: 'regular season', playoffs: 'playoffs', lottery: 'draft lottery', draft: 'draft', fa: 'free agency', preseason: 'preseason' }[s.phase], layout, save, isA: variant === 'A', isB: variant === 'B', isC: variant === 'C', nav, navGroups, is, page, dateLong,
    recordLine: me.w + '–' + me.l + ' · ' + ord(seed) + ' in the ' + me.conf, recordShort: me.w + '–' + me.l, seedLine: ord(seed) + ' in the ' + me.conf + ' · ' + strk(me),
    play1: () => { if (canWatch) gm.setState({ screen: 'game', q: '' }); }, quick1: () => gm.sim(1), play7: () => gm.sim(7), live, schedRows, txRows, txSegs, shortlists, noLists: s.lists.length === 0, newList: s.newList, noNewList: !s.newList.trim(),
    onNewList: e => gm.setState({ newList: e.target.value }), addList: () => gm.setState(st => st.newList.trim() ? { lists: [...st.lists, { id: 'l' + Date.now(), name: st.newList.trim(), ids: [] }], newList: '' } : null), goShort: go('short'), goRoster: go('roster'), goStandings: go('standings'),
    next, results, leaders, lineup, confMini, dashStats, confName: me.conf + 'ern Conference',
    rosterCols, rosterRows, lineupHint, dragEnd: () => gm.setState({ dragId: null, overId: null }),
    autoLineup: () => gm.setState(st => ({ rosters: { ...st.rosters, [st.me]: st.rosters[st.me].slice().sort((x, y) => P[y].ovr - P[x].ovr) }, sort: { ...st.sort, roster: ['rk', 1] } })),
    comp, depth, roles, pl, showJson: s.showJson, toggleJson: () => gm.setState(st => ({ showJson: !st.showJson })), downloadFaces: () => gm.downloadFaces(),
    standGroups, standSegs, standConf: conf,
    tMine: mine.map(tRow('tMine')), tTheirs: s.rosters[s.tTid].map(tRow('tTheirs')), tMinePicks: myAssets.map(kRow('tkMine')), tTheirPicks: theirAssets.map(kRow('tkTheirs')), tr, teamOptions, tTid: s.tTid,
    pickTeam: e => gm.setState({ tTid: +e.target.value, tTheirs: [], tkTheirs: [], tMsg: null }), propose: () => gm.propose(), balance: () => gm.balance(), clearTrade: () => gm.setState({ tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: null }),
    faCols, faRows, faNote, dr, dClasses, draftCols, draftRows, simToMine: () => gm.aiDraft(true), simAll: () => gm.aiDraft(false),
    askScouts: () => gm.setState(st => ({ adv: { ...st.adv, scouts: true } })), askAgm: () => gm.setState(st => ({ adv: { ...st.adv, agm: true } })),
    fin, q: s.q, onSearch: e => gm.setState({ q: e.target.value }), matches, hasMatches: matches.length > 0, searchIcon: icon('search'),
    books: [{ k: 'Payroll', v: money(payroll) }, { k: capRoom >= 0 ? 'Cap space' : 'Over the cap', v: money(Math.abs(capRoom)) }, { k: 'Room under tax', v: money(gm.TAX - payroll) }, { k: 'Mid-level', v: s.mleUsed ? 'Used' : 'Available' }, { k: 'Next pick', v: myNext ? '#' + myNext.n : '—' }],
    log: s.log.map(l => ({ ...l, text: linkNames(l.text, id => open(id)(null), { P }) })), noLog: s.log.length === 0,
    lm, hasList: !!s.listModal, closeList: () => gm.setState({ listModal: null }), scoutRegions, scoutsV, promisesV, noPromises: promisesV.length === 0, repV, ovRows, tacV, natRows, resetNat: () => gm.setState({ natW: natDefault() }), devRows, reportsV, noReports: s.reports.length === 0, own, god, firing, isGod: !!s.god, ph, pov, settings, hasProg, progRows, hasTeamModal: !!tmT, tm, closeTeam: () => gm.setState({ teamModal: null }), viewTradeTeam: openTeam(s.tTid), themeLabel: dark ? 'Light mode' : 'Dark mode', toggleTheme: () => gm.setState({ theme: dark ? 'light' : 'dark' }), rootRef, hasModal: !!s.modal, closeModal: () => gm.setState({ modal: false }), ptabs, ext, hasDialog: !!dg, dlg, closeDialog: () => gm.setState({ dialog: null }), stop: e => e.stopPropagation()
  };
}
