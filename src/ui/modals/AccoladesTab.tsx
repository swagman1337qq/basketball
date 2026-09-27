// Accolades: every honor a player has earned in this league, straight from the season awards
// (your award formulas in Settings → Award formulas), the playoffs, the stat leaderboards, the
// draft and the Hall of Fame. Like Basketball Reference's "Awards" box plus voting finishes.
import { useMemo, type ReactNode } from 'react';
import type { VM } from '../vm';
import { Link, muted, ruleH4 } from '../kit';

const ORD = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const TEAM_N = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];
// Joke awards (the defaults, plus any you add with a name like these) go in their own box.
const DUBIOUS = new Set(['LVP', 'AVG', 'LIP', 'LEP', 'WDP']), dubious = (sn: string, name: string) => DUBIOUS.has(sn) || /least|worst|perfectly average/i.test(name);
const CLASSIC: Record<string, [string, string]> = { mvp: ['MVP', 'Most Valuable Player'], dpoy: ['DPOY', 'Defensive Player of the Year'], roy: ['ROY', 'Rookie of the Year'], smoy: ['SMOY', 'Sixth Man of the Year'], mip: ['MIP', 'Most Improved Player'] };
const LEAD: [string, string, (t: any) => number][] = [['pts', 'Scoring', t => t.pts], ['trb', 'Rebounding', t => (t.orb || 0) + (t.drb || 0)], ['ast', 'Assists', t => t.ast], ['stl', 'Steals', t => t.stl], ['blk', 'Blocks', t => t.blk]];
const MIN_GP = 58; // NBA stat titles: 70% of the schedule

interface Row { season: number; label: string; tid?: number; line?: string; key: string }

export function AccoladesTab({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, p = gm.db.P[s.pid], T = s.teams, P = gm.db.P;
  const lbl = (y: number) => (y - 1) + '–' + String(y).slice(2);
  const tidIn = (y: number, po = false) => { const r = (p?.stats || []).filter((x: any) => x.season === y && !!x.po === po); return r.length ? r[r.length - 1].tid : undefined; };
  const nAw = Object.keys(s.awards || {}).length;

  const data = useMemo(() => {
    const won: Row[] = [], teams: Row[] = [], votes: Row[] = [], dub: Row[] = [], series: Row[] = [];
    if (!p) return { won, teams, votes, dub, series, titles: [] as Row[], leads: [] as Row[] };
    Object.values(s.awards || {}).sort((a: any, b: any) => a.season - b.season).forEach((a: any) => {
      const y = a.season;
      // Single-winner awards: a win, or a finish in the voting.
      const lists: [string, string, any[]][] = a.list ? (a.defs || []).filter((d: any) => !d.numTeams && !d.statRange).map((d: any) => [d.shortName, d.name, a.list[d.shortName] || []])
        : Object.entries(CLASSIC).map(([k, [sn, nm]]) => [sn, nm, a[k] || []]);
      lists.forEach(([sn, name, l]) => {
        const i = l.findIndex((e: any) => e.pid === p.id); if (i < 0) return;
        const e = l[i], bad = dubious(sn, name), row: Row = { season: y, tid: e.tid, line: e.line, key: sn, label: name };
        if (i === 0) (bad ? dub : won).push(row);
        else if (!bad) votes.push({ ...row, label: ORD(i + 1) + ' in ' + name + ' voting' + (e.share != null ? ' (' + (e.share * 100).toFixed(1) + '% share' + (e.first ? ', ' + e.first + ' first-place vote' + (e.first === 1 ? '' : 's') : '') + ')' : '') });
      });
      // Team awards (All-League, All-Defensive, All-Rookie, and any you added).
      const tms: [string, string, number[][]][] = a.teams ? (a.defs || []).filter((d: any) => d.numTeams).map((d: any) => [d.shortName, d.name, a.teams[d.shortName] || []])
        : [['ALL', 'All-League', a.allLeague || []], ['DEF', 'All-Defensive', a.allDef || []], ['ALR', 'All-Rookie', a.allRookie?.length ? [a.allRookie] : []]];
      tms.forEach(([sn, name, t]) => t.forEach((tm, i) => { if (tm.includes(p.id)) teams.push({ season: y, key: sn + (i + 1), tid: tidIn(y), label: (t.length > 1 ? TEAM_N[i] + ' Team ' : '') + name }); }));
      // Series MVPs.
      if (a.fmvp?.pid === p.id) series.push({ season: y, key: 'FMVP', tid: a.fmvp.tid, line: a.fmvp.line, label: 'Finals MVP' });
      Object.entries(a.sfmvp || {}).forEach(([c, e]: any) => { if (e?.pid === p.id) series.push({ season: y, key: 'SFMVP', tid: e.tid, line: e.line, label: c + ' Finals MVP' }); });
    });
    // Championships and Finals trips.
    const titles: Row[] = [];
    (s.history || []).forEach((h: any) => { const t = tidIn(h.year, true) ?? tidIn(h.year); if (t == null) return; // hurt all playoffs still gets the ring
      if (h.champ === t) titles.push({ season: h.year, key: 'CH', tid: t, label: 'NBA Champion' });
      else if (h.runner === t) titles.push({ season: h.year, key: 'RU', tid: t, label: 'Reached the Finals' }); });
    // League leader in a counting stat (per game, at least 58 games), in seasons the awards were voted.
    const leads: Row[] = [];
    const mySeasons = [...new Set((p.stats || []).filter((r: any) => !r.po).map((r: any) => r.season))] as number[];
    const all = Object.values(P) as any[];
    mySeasons.filter(y => (s.awards || {})[y]).forEach(y => {
      const mine = gm.seasonTotals(p, y); if (!mine || mine.gp < MIN_GP) return;
      const pool = all.filter(q => (q.stats || []).some((r: any) => r.season === y && !r.po)).map(q => ({ q, t: gm.seasonTotals(q, y) })).filter(x => x.t && x.t.gp >= MIN_GP);
      LEAD.forEach(([k, name, f]) => { const best = pool.reduce((b, x) => (f(x.t) / x.t.gp > f(b.t) / b.t.gp ? x : b), pool[0]); if (best?.q.id === p.id) leads.push({ season: y, key: 'LEAD' + k, tid: tidIn(y), label: 'Led the league in ' + name.toLowerCase(), line: (f(mine) / mine.gp).toFixed(1) + ' per game' }); });
    });
    return { won, teams, votes, dub, series, titles, leads };
  }, [p?.id, nAw, (s.history || []).length]);

  if (!p) return null;
  const { won, teams, votes, dub, series, titles, leads } = data;
  const hof = (s.hof || []).find((h: any) => h.pid === p.id), no1 = p.dr?.rd === 1 && p.dr?.pick === 1, L = p.legacy;

  // The summary chips: counts, biggest honors first.
  const count = (rows: Row[]) => { const m = new Map<string, { label: string; n: number; years: number[] }>(); rows.forEach(r => { const e = m.get(r.label) || { label: r.label, n: 0, years: [] }; e.n++; e.years.push(r.season); m.set(r.label, e); }); return [...m.values()]; };
  const champs = titles.filter(t => t.key === 'CH');
  const chips = [...(champs.length ? [{ label: 'NBA Champion', n: champs.length, years: champs.map(c => c.season) }] : []), ...count(won), ...count(series), ...count(teams), ...count(leads)];

  const Team = ({ tid }: { tid?: number }) => tid != null && T[tid] ? <Link onClick={() => gm.setState({ teamModal: tid, modal: false })}>{T[tid].abbr}</Link> : <span style={muted}>—</span>;
  const Table = ({ title, rows, note }: { title: string; rows: Row[]; note?: ReactNode }) => rows.length ? (
    <section style={{ marginBottom: 18 }}>
      <h4 style={ruleH4}>{title}</h4>
      <table className="table" style={{ fontSize: '13px', tableLayout: 'fixed', width: '100%' }}>
        <colgroup><col style={{ width: 80 }} /><col style={{ width: '42%' }} /><col style={{ width: 60 }} /><col /></colgroup>
        <tbody>{[...rows].sort((a, b) => b.season - a.season).map((r, i) => (
          <tr key={i}><td style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>{lbl(r.season)}</td><td style={{ padding: '4px 8px', fontWeight: 600 }}>{r.label}</td><td style={{ padding: '4px 8px' }}><Team tid={r.tid} /></td><td style={{ padding: '4px 8px', ...muted, fontSize: '12px' }}>{r.line || ''}</td></tr>))}
        </tbody>
      </table>
      {note && <p style={{ ...muted, fontSize: '11.5px', margin: '4px 0 0' }}>{note}</p>}
    </section>) : null;

  const nothing = !chips.length && !votes.length && !dub.length && !hof && !no1 && !L && !titles.length;
  return (
    <div style={{ marginTop: 22 }}>
      {chips.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {chips.map(c => <span key={c.label} style={{ padding: '4px 10px', borderRadius: 999, border: '1px solid var(--gm-elite, var(--color-accent))', color: 'var(--gm-elite, var(--color-accent-700))', fontSize: '12.5px', fontWeight: 600 }}>{c.n > 1 ? c.n + '× ' : ''}{c.label} <span style={{ fontWeight: 400, opacity: 0.85 }}>({[...c.years].sort((a, b) => a - b).map(lbl).join(', ')})</span></span>)}
      </div>}
      {(hof || no1 || L) && <section style={{ marginBottom: 18 }}>
        <h4 style={ruleH4}>Career milestones</h4>
        <div style={{ fontSize: '13px', display: 'grid', gap: 4 }}>
          {hof && <div>🏛️ <b>Hall of Fame</b>, class of {hof.year}{hof.firstBallot ? ' (first ballot)' : ''}{hof.honors ? <span style={muted}> · {hof.honors}</span> : ''}</div>}
          {no1 && <div>🥇 <b>No. 1 overall pick</b> in the {p.draft} draft{p.draftTid != null && T[p.draftTid] ? ' by ' + T[p.draftTid].region + ' ' + T[p.draftTid].name : ''}</div>}
          {L && <div>📜 Before this league: {L.seasons} seasons, {L.pts} pts · {L.reb} reb · {L.ast} ast{L.allStar ? ', ' + L.allStar + '× All-Star' : ''}</div>}
        </div>
      </section>}
      <Table title="Championships" rows={titles} />
      <Table title="Awards" rows={won} />
      <Table title="Playoff series MVPs" rows={series} />
      <Table title="All-League teams" rows={teams} />
      <Table title="League leader" rows={leads} note={'Per game, among players with at least ' + MIN_GP + ' games (70% of the season), like the NBA’s stat titles.'} />
      <Table title="Award voting" rows={votes} note="Finishes in the media vote without winning (100 voters)." />
      <Table title="Dubious honors" rows={dub} note="The joke awards from your award formulas." />
      {nothing && <p style={{ ...muted, fontStyle: 'italic' }}>No accolades yet. Awards are voted at the end of each regular season.</p>}
      <p style={{ ...muted, fontSize: '11.5px', marginTop: 10 }}>Awards come from your award formulas (<Link onClick={() => gm.setState({ screen: 'settings', modal: false })}>Settings → Award formulas</Link>); every season’s full results are on the <Link onClick={() => gm.setState({ screen: 'awards', modal: false })}>Awards</Link> screen.</p>
    </div>
  );
}
