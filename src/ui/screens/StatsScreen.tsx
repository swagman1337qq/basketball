// Stats hub: player stats for any season or career (per game, totals, per 36, shooting,
// advanced), team stats and ratings by season, the league-wide page, and league history
// (champions, runners-up, Finals MVPs, every major award, best records, this season's race).
import { useMemo, useState } from 'react';
import type { VM } from '../vm';
import { seasonAdvanced } from '../../engine/advanced';
import { computeAwards } from '../../engine/awards';
import { LeagueStatsScreen } from './LeagueStatsScreen';
import { Link, muted, ruleH4, Seg } from '../kit';

type Tab = 'players' | 'teams' | 'league' | 'history';
const F = ['gp', 'min', 'pts', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'gs'];
const sum = (rows: any[]) => { const t: any = {}; F.forEach(k => (t[k] = 0)); rows.forEach(r => F.forEach(k => (t[k] += r[k] || 0))); return t; };
const pct = (m: number, a: number) => (a ? (100 * m) / a : null);

export function StatsScreen({ vm }: { vm: VM }) {
  const [tab, setTab] = useState<Tab>('players');
  return (
    <>
      <div style={{ marginBottom: 14 }}><Seg<Tab> value={tab} options={[['players', 'Player stats'], ['teams', 'Team stats'], ['league', 'League stats'], ['history', 'League history']]} onChange={setTab} /></div>
      {tab === 'players' && <PlayerStats vm={vm} />}
      {tab === 'teams' && <TeamStats vm={vm} />}
      {tab === 'league' && <LeagueStatsScreen vm={vm} />}
      {tab === 'history' && <History vm={vm} />}
    </>
  );
}

function useSeasons(vm: VM) { const { gm } = vm.ctx, first = gm.db.firstSeason || 2027; return Array.from({ length: gm.Y - first + 1 }, (_, i) => gm.Y - i); }
const lbl = (y: number) => y - 1 + '–' + String(y).slice(2);

function SortTable({ cols, rows, initial = 2, limit = 250 }: { cols: [string, string, (r: any) => any, number?][]; rows: any[]; initial?: number; limit?: number }) {
  const [sort, setSort] = useState<[number, number]>([initial, -1]);
  const c = cols[sort[0]], srt = rows.slice().sort((a, b) => { const x = c[2](a), y = c[2](b); if (typeof x === 'string' || typeof y === 'string') return String(x).localeCompare(String(y)) * sort[1] * -1; return ((y ?? -1e9) - (x ?? -1e9)) * (sort[1] === -1 ? 1 : -1); });
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="table" style={{ fontSize: '12.5px', minWidth: 900 }}>
        <thead><tr><th style={{ padding: '5px 6px', textAlign: 'right' }}>#</th>{cols.map(([h, tip], i) => <th key={h + i} title={tip} onClick={() => setSort([i, sort[0] === i ? -sort[1] : -1])} style={{ padding: '5px 6px', textAlign: i < 3 ? 'left' : 'right', cursor: 'pointer', whiteSpace: 'nowrap', color: sort[0] === i ? 'var(--color-accent-700)' : undefined }}>{h}{sort[0] === i ? (sort[1] === -1 ? ' ↓' : ' ↑') : ''}</th>)}</tr></thead>
        <tbody>{srt.slice(0, limit).map((r, i) => <tr key={r.key ?? i}><td style={{ padding: '3px 6px', textAlign: 'right', color: 'var(--color-neutral-600)' }}>{i + 1}</td>{cols.map(([h, , f, d], j) => { const v = f(r); return <td key={h + j} style={{ padding: '3px 6px', textAlign: j < 3 ? 'left' : 'right', whiteSpace: 'nowrap' }}>{v == null || (typeof v === 'number' && !isFinite(v)) ? '—' : typeof v === 'number' ? v.toFixed(d ?? 1) : v}</td>; })}</tr>)}</tbody>
      </table>
      {srt.length > limit && <p style={{ ...muted, fontSize: '12px' }}>Showing the top {limit} of {srt.length}. Sort or filter to see others.</p>}
    </div>
  );
}

function PlayerStats({ vm }: { vm: VM }) {
  const { gm, s, T, open } = vm.ctx, P = gm.db.P, seasons = useSeasons(vm);
  const [season, setSeason] = useState<number | 'career'>(gm.Y), [po, setPo] = useState(false), [mode, setMode] = useState<'pg' | 'tot' | 'p36' | 'shoot' | 'adv'>('pg'), [team, setTeam] = useState(-1), [minG, setMinG] = useState(1), [pos, setPos] = useState('all');
  const rows = useMemo(() => {
    const adv = season !== 'career' && !po ? seasonAdvanced(gm, s, season).byPid : null;
    return (Object.values(P) as any[]).flatMap(p => {
      const rs = (p.stats || []).filter((r: any) => !!r.po === po && (season === 'career' || r.season === season) && (team < 0 || r.tid === team)); if (!rs.length) return [];
      const t = sum(rs), tids = [...new Set(rs.map((r: any) => r.tid))] as number[];
      return [{ key: p.id, p, t, a: adv?.[p.id], team: tids.map(x => T[x]?.abbr).join('/'), yrs: season === 'career' ? new Set(rs.map((r: any) => r.season)).size : 1 }];
    }).filter(r => r.t.gp >= minG && (pos === 'all' || r.p.grp === pos));
  }, [season, po, team, minG, pos, s.day, s.phase]);
  const name = (r: any) => <Link onClick={() => open(r.p.id)}>{r.p.name}</Link>;
  const pg = (k: string) => (r: any) => r.t[k] / r.t.gp, tot = (k: string) => (r: any) => r.t[k], p36 = (k: string) => (r: any) => (r.t.min ? (r.t[k] * 36) / r.t.min : null);
  const base: any[] = [['Player', '', name], ['Team', '', (r: any) => r.team], ['Pos', '', (r: any) => r.p.pos], ['Age', 'Age that season', (r: any) => (season === 'career' ? r.p.age : r.p.age - (gm.Y - (season as number))), 0], ['G', 'Games', (r: any) => r.t.gp, 0], ...(season === 'career' ? [['Yrs', 'Seasons', (r: any) => r.yrs, 0]] : [])];
  const f = mode === 'tot' ? tot : mode === 'p36' ? p36 : pg;
  const cols: any[] = mode === 'shoot' ? [...base, ['FGM', '', pg('fgm')], ['FGA', '', pg('fga')], ['FG%', '', (r: any) => pct(r.t.fgm, r.t.fga)], ['3PM', '', pg('tpm')], ['3PA', '', pg('tpa')], ['3P%', '', (r: any) => pct(r.t.tpm, r.t.tpa)], ['FTM', '', pg('ftm')], ['FTA', '', pg('fta')], ['FT%', '', (r: any) => pct(r.t.ftm, r.t.fta)], ['eFG%', 'Effective field goal %', (r: any) => pct(r.t.fgm + 0.5 * r.t.tpm, r.t.fga)], ['TS%', 'True shooting %', (r: any) => pct(r.t.pts, 2 * (r.t.fga + 0.44 * r.t.fta))], ['3PAr', '3-point attempt rate', (r: any) => (r.t.fga ? r.t.tpa / r.t.fga : null), 3], ['FTr', 'Free throw rate', (r: any) => (r.t.fga ? r.t.fta / r.t.fga : null), 3]]
    : mode === 'adv' ? [...base, ['Min', '', pg('min')], ['PER', 'Player efficiency rating', (r: any) => r.a?.per ?? gm.perOf(r.t, season === 'career' ? gm.Y : season)], ['TS%', '', (r: any) => r.a?.tsp ?? pct(r.t.pts, 2 * (r.t.fga + 0.44 * r.t.fta))], ['USG%', 'Usage rate', (r: any) => r.a?.usgp], ['AST%', '', (r: any) => r.a?.astp], ['TRB%', '', (r: any) => r.a?.trbp], ['STL%', '', (r: any) => r.a?.stlp], ['BLK%', '', (r: any) => r.a?.blkp], ['TOV%', '', (r: any) => r.a?.tovp], ['ORtg', 'Offensive rating', (r: any) => r.a?.ortg, 0], ['DRtg', 'Defensive rating', (r: any) => r.a?.drtg, 0], ['OWS', '', (r: any) => r.a?.ows], ['DWS', '', (r: any) => r.a?.dws], ['WS', 'Win shares', (r: any) => r.a?.ws], ['WS/48', '', (r: any) => r.a?.ws48, 3], ['OBPM', '', (r: any) => r.a?.obpm], ['DBPM', '', (r: any) => r.a?.dbpm], ['BPM', 'Box plus-minus', (r: any) => r.a?.bpm], ['VORP', '', (r: any) => r.a?.vorp], ['+/-', 'Plus-minus per 100 possessions', (r: any) => r.a?.pm100]]
    : [...base, ['GS', 'Games started', (r: any) => r.t.gs, 0], ['Min', '', f('min'), mode === 'tot' ? 0 : 1], ['Pts', '', f('pts'), mode === 'tot' ? 0 : 1], ['Reb', '', (r: any) => f('orb')(r) + f('drb')(r), mode === 'tot' ? 0 : 1], ['Orb', '', f('orb'), mode === 'tot' ? 0 : 1], ['Drb', '', f('drb'), mode === 'tot' ? 0 : 1], ['Ast', '', f('ast'), mode === 'tot' ? 0 : 1], ['Stl', '', f('stl'), mode === 'tot' ? 0 : 1], ['Blk', '', f('blk'), mode === 'tot' ? 0 : 1], ['TOV', '', f('tov'), mode === 'tot' ? 0 : 1], ['PF', '', f('pf'), mode === 'tot' ? 0 : 1], ['FG%', '', (r: any) => pct(r.t.fgm, r.t.fga)], ['3P%', '', (r: any) => pct(r.t.tpm, r.t.tpa)], ['FT%', '', (r: any) => pct(r.t.ftm, r.t.fta)]];
  const noAdv = mode === 'adv' && (season === 'career' || po);
  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10, fontSize: '13px' }}>
        <select className="input" style={{ width: 'auto' }} value={String(season)} onChange={e => setSeason(e.target.value === 'career' ? 'career' : +e.target.value)}><option value="career">Career (all seasons)</option>{seasons.map(y => <option key={y} value={y}>{lbl(y)}</option>)}</select>
        <Seg<string> value={po ? 'po' : 'rs'} options={[['rs', 'Regular season'], ['po', 'Playoffs']]} onChange={v => setPo(v === 'po')} />
        <Seg<any> value={mode} options={[['pg', 'Per game'], ['tot', 'Totals'], ['p36', 'Per 36'], ['shoot', 'Shooting'], ['adv', 'Advanced']]} onChange={setMode} />
        <select className="input" style={{ width: 'auto' }} value={team} onChange={e => setTeam(+e.target.value)}><option value={-1}>All teams</option>{T.map(t => <option key={t.tid} value={t.tid}>{t.region} {t.name}</option>)}</select>
        <select className="input" style={{ width: 'auto' }} value={pos} onChange={e => setPos(e.target.value)}><option value="all">All positions</option><option value="G">Guards</option><option value="W">Wings</option><option value="B">Bigs</option></select>
        <label style={{ display: 'flex', gap: 6, alignItems: 'center' }}>Min games <input className="input" type="number" value={minG} min={0} onChange={e => setMinG(Math.max(0, +e.target.value || 0))} style={{ width: 64 }} /></label>
      </div>
      {noAdv && <p style={{ ...muted, fontSize: '12px' }}>Advanced stats are computed for single regular seasons; pick a season.</p>}
      {rows.length ? <SortTable cols={cols} rows={rows} initial={mode === 'adv' ? (season === 'career' ? 7 : 6) : mode === 'shoot' ? 6 : season === 'career' ? 9 : 8} /> : <p style={muted}>No stats for this selection yet.</p>}
    </>
  );
}

function TeamStats({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam } = vm.ctx, seasons = useSeasons(vm);
  const [season, setSeason] = useState(gm.Y), [mode, setMode] = useState<'pg' | 'opp' | 'adv'>('pg');
  const adv = useMemo(() => seasonAdvanced(gm, s, season).teams, [season, s.day]);
  const src = season === gm.Y ? s.tstats || {} : (s.tstatsHist || {})[season] || {};
  const rec = (tid: number) => { if (season === gm.Y) return [T[tid].w, T[tid].l]; const h = ((s.teamHist || {})[tid] || []).find((x: any) => x.season === season); return h ? [h.w, h.l] : [0, 0]; };
  const rows = T.filter(t => src[t.tid]?.gp).map(t => ({ key: t.tid, t, x: src[t.tid], a: adv[t.tid], rec: rec(t.tid) }));
  const name = (r: any) => <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{logo(r.t.tid, 18)}<Link onClick={() => openTeam(r.t.tid)}>{r.t.region} {r.t.name}</Link></span>;
  const g = (k: string) => (r: any) => r.x[k] / r.x.gp, p = (m: string, a: string) => (r: any) => pct(r.x[m], r.x[a]);
  const base: any[] = [['Team', '', name], ['W', '', (r: any) => r.rec[0], 0], ['L', '', (r: any) => r.rec[1], 0]];
  const cols: any[] = mode === 'pg' ? [...base, ['Pts', '', g('pts')], ['FG%', '', p('fgm', 'fga')], ['3PM', '', g('tpm')], ['3P%', '', p('tpm', 'tpa')], ['FT%', '', p('ftm', 'fta')], ['Orb', '', g('orb')], ['Drb', '', g('drb')], ['Reb', '', (r: any) => (r.x.orb + r.x.drb) / r.x.gp], ['Ast', '', g('ast')], ['Stl', '', g('stl')], ['Blk', '', g('blk')], ['TOV', '', g('tov')], ['PF', '', g('pf')]]
    : mode === 'opp' ? [...base, ['Opp Pts', '', g('oPts')], ['Opp FG%', '', p('oFgm', 'oFga')], ['Opp 3P%', '', p('oTpm', 'oTpa')], ['Opp FT%', '', p('oFtm', 'oFta')], ['Opp Orb', '', g('oOrb')], ['Opp Drb', '', g('oDrb')], ['Opp TOV', '', g('oTov')], ['Margin', 'Point differential per game', (r: any) => (r.x.pts - r.x.oPts) / r.x.gp]]
    : [...base, ['ORtg', 'Points per 100 possessions', (r: any) => r.a?.ortg], ['DRtg', 'Points allowed per 100', (r: any) => r.a?.drtg], ['Net', '', (r: any) => (r.a ? r.a.ortg - r.a.drtg : null)], ['Pace', 'Possessions per 48', (r: any) => r.a?.pace], ['eFG%', '', (r: any) => pct(r.x.fgm + 0.5 * r.x.tpm, r.x.fga)], ['TOV%', '', (r: any) => pct(r.x.tov, r.x.fga + 0.44 * r.x.fta + r.x.tov)], ['ORB%', '', (r: any) => pct(r.x.orb, r.x.orb + r.x.oDrb)], ['FT/FGA', '', (r: any) => (r.x.fga ? r.x.ftm / r.x.fga : null), 3], ['Opp eFG%', '', (r: any) => pct(r.x.oFgm + 0.5 * r.x.oTpm, r.x.oFga)], ['Opp TOV%', '', (r: any) => pct(r.x.oTov, r.x.oFga + 0.44 * r.x.oFta + r.x.oTov)], ['DRB%', '', (r: any) => pct(r.x.drb, r.x.drb + r.x.oOrb)], ['3PAr', '', (r: any) => (r.x.fga ? r.x.tpa / r.x.fga : null), 3]];
  return (
    <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
        <select className="input" style={{ width: 'auto' }} value={season} onChange={e => setSeason(+e.target.value)}>{seasons.map(y => <option key={y} value={y}>{lbl(y)}</option>)}</select>
        <Seg<any> value={mode} options={[['pg', 'Per game'], ['opp', 'Opponents'], ['adv', 'Advanced & Four Factors']]} onChange={setMode} />
      </div>
      {rows.length ? <SortTable cols={cols} rows={rows} initial={1} limit={40} /> : <p style={muted}>No team stats for this season{season < gm.Y ? ' (seasons before this save kept team totals aren’t available)' : ' yet'}.</p>}
    </>
  );
}

function History({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P;
  const race = useMemo(() => (s.phase === 'regular' && (s.games || []).length > 30 && !(s.awards || {})[gm.Y] ? computeAwards(gm, s) : null), [s.day]);
  const nm = (x: any) => (x && P[x.pid] ? <Link onClick={() => open(x.pid)}>{P[x.pid].name}</Link> : '—');
  const tm = (tid: number | null | undefined) => (tid != null && T[tid] ? <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>{logo(tid, 16)}<Link onClick={() => openTeam(tid)}>{T[tid].region} {T[tid].name}</Link></span> : '—');
  const seasons = [...new Set([...(s.history || []).map((h: any) => h.year), ...Object.keys(s.awards || {}).map(Number)])].sort((a, b) => b - a);
  const best = (y: number) => { const hs = Object.entries((s.history || []).find((h: any) => h.year === y)?.teams || {}) as [string, any][]; const b = hs.filter(([, v]) => v.w != null).sort((a, b) => b[1].w - a[1].w)[0]; if (b) return [+b[0], b[1].w + '–' + b[1].l] as [number, string];
    const th = T.map(t => [t.tid, ((s.teamHist || {})[t.tid] || []).find((x: any) => x.season === y)] as [number, any]).filter(x => x[1]).sort((a, b) => b[1].w - a[1].w)[0]; return th ? [th[0], th[1].w + '–' + th[1].l] as [number, string] : null; };
  const A = ['mvp', 'dpoy', 'roy', 'smoy', 'mip'], AL = { mvp: 'MVP', dpoy: 'Defensive POY', roy: 'Rookie of the Year', smoy: 'Sixth Man', mip: 'Most Improved' } as any;
  return (
    <>
      {race && <section style={{ marginBottom: 20 }}>
        <h4 style={ruleH4}>{lbl(gm.Y)} award race (if the season ended today)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, fontSize: '12.5px' }}>
          {A.map(k => <div key={k}><b>{AL[k]}</b>{(race[k] || []).slice(0, 3).map((x: any, i: number) => <div key={i}>{i + 1}. {nm(x)} <span style={muted}>{T[x.tid]?.abbr}</span></div>)}</div>)}
        </div>
      </section>}
      <h4 style={ruleH4}>Season by season</h4>
      {seasons.length === 0 && <p style={muted}>No completed seasons yet. Champions and award winners appear here as seasons finish.</p>}
      <div style={{ overflowX: 'auto' }}>
        <table className="table" style={{ fontSize: '12.5px', minWidth: 1100 }}>
          <thead><tr>{['Season', 'Champion', 'Runner-up', 'Finals MVP', 'MVP', 'Defensive POY', 'Rookie of the Year', 'Sixth Man', 'Most Improved', 'Coach of the Year', 'Best record'].map(h => <th key={h} style={{ padding: '5px 6px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>)}</tr></thead>
          <tbody>{seasons.map(y => { const h = (s.history || []).find((x: any) => x.year === y), aw = (s.awards || {})[y] || {}, b = best(y); return (
            <tr key={y}>
              <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{lbl(y)}{y === gm.Y && !h ? ' (in progress)' : ''}</td>
              <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{h ? tm(h.champ) : '—'}</td>
              <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{h ? tm(h.runner) : '—'}</td>
              <td style={{ padding: '4px 6px' }}>{h?.fmvp != null ? nm({ pid: h.fmvp }) : aw.fmvp ? nm(aw.fmvp) : '—'}</td>
              {A.map(k => <td key={k} style={{ padding: '4px 6px' }}>{nm(aw[k]?.[0])}</td>)}
              <td style={{ padding: '4px 6px' }}>{aw.coy?.[0] ? aw.coy[0].name + (T[aw.coy[0].tid] ? ' (' + T[aw.coy[0].tid].abbr + ')' : '') : '—'}</td>
              <td style={{ padding: '4px 6px', whiteSpace: 'nowrap' }}>{b ? <>{tm(b[0])} <span style={muted}>{b[1]}</span></> : '—'}</td>
            </tr>); })}</tbody>
        </table>
      </div>
      <p style={{ ...muted, fontSize: '12px' }}>All-League, All-Defensive and All-Rookie teams and every custom award are on the Awards page; inductees are in the Hall of Fame.</p>
    </>
  );
}
