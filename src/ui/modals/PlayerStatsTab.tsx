// Stats tab: everything a player has put up, laid out like Basketball-Reference. Traditional
// numbers by season (per game, per 36 or totals; regular season or playoffs; NBA or CCP) with a
// row per team in traded seasons, league leaders in bold, an Awards column, career and
// per-team career lines; shooting efficiency and all five shot zones, advanced stats, and splits.
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import type { VM } from '../vm';
import { muted, ruleH4, Seg } from '../kit';
import { ccpAdvanced, seasonAdvanced } from '../../engine/advanced';
import { roundStat, seasonLeaders, statVal } from '../../engine/leaders';
import { allStarsOf } from '../../engine/allStar';
import { awardTags } from '../awardTags';
import { fiveZones, LEAGUE_ZONE } from './ProfileExtras';

type Mode = 'pg' | 'p36' | 'tot';
const f1 = (x: number) => (isFinite(x) ? x.toFixed(1) : '—');
const pct = (m: number, a: number) => (a ? ((100 * m) / a).toFixed(1) : '—');
const TH = ({ children, l, t }: { children: ReactNode; l?: boolean; t?: string }) => <th title={t} style={{ padding: '5px 7px', textAlign: l ? 'left' : 'right', whiteSpace: 'nowrap' }}>{children}</th>;
const TD = ({ children, l, b, c }: { children: ReactNode; l?: boolean; b?: boolean; c?: string }) => <td style={{ padding: '4px 7px', textAlign: l ? 'left' : 'right', whiteSpace: 'nowrap', fontWeight: b ? 700 : undefined, color: c, fontVariantNumeric: 'tabular-nums' }}>{children}</td>;
const Wrap = ({ children }: { children: ReactNode }) => <div style={{ overflowX: 'auto', marginBottom: 6 }}><table className="table" style={{ fontSize: '12.5px', minWidth: '100%' }}>{children}</table></div>;

export function PlayerStatsTab({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, p = gm.db.P[s.pid];
  const [po, setPo] = useState(false), [mode, setMode] = useState<Mode>('pg'), [lgSel, setLg] = useState<'nba' | 'ccp'>('nba');
  const T = s.teams, hasCcp = !!p && Object.keys(p.ccpS || {}).length > 0, ccp = lgSel === 'ccp' && hasCcp;
  // CCP lines: p.ccpS["2027"] (regular season) and ["2027p"] (playoffs), one team a season.
  const ccpLine = (y: number) => p?.ccpS?.[y + (po ? 'p' : '')];
  const seasons = useMemo(() => (ccp ? Object.keys(p.ccpS || {}).filter(k => k.endsWith('p') === po).map(k => parseInt(k, 10)) : [...new Set((p?.stats || []).filter((r: any) => !!r.po === po).map((r: any) => r.season))]).sort((a: any, b: any) => a - b) as number[], [p, po, s.day, ccp]);
  // Advanced stats need every player's season (league context), regular season or playoffs.
  const adv = useMemo(() => { const out: Record<number, any> = {}; if (!p) return out; seasons.forEach(y => { try { out[y] = (ccp ? ccpAdvanced(gm, s, y, po) : seasonAdvanced(gm, s, y, po)).byPid[p.id]; } catch { /* old season without context */ } }); return out; }, [p, po, seasons.join(), s.day, ccp]);
  if (!p) return null;
  const lgSeg = (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {(['nba', 'ccp'] as const).map(k => { const dis = k === 'ccp' && !hasCcp, on = (k === 'ccp') === ccp; return (
        <button key={k} className={'btn ' + (on ? 'btn-primary' : 'btn-ghost')} disabled={dis} onClick={() => setLg(k)} title={dis ? 'He hasn’t played a CCP game' : k === 'ccp' ? 'His games in the CCP (the development league)' : 'His NBA games'} style={{ fontSize: '12px', padding: '3px 10px', opacity: dis ? 0.4 : 1 }}>{k === 'nba' ? 'NBA' : 'CCP'}</button>); })}
    </span>);
  const controls = (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
      {lgSeg}
      <Seg<string> value={po ? 'po' : 'rs'} options={[['rs', 'Regular season'], ['po', 'Playoffs']]} onChange={x => setPo(x === 'po')} />
      <Seg<Mode> value={mode} options={[['pg', 'Per game'], ['p36', 'Per 36 min'], ['tot', 'Totals']]} onChange={setMode} />
    </div>);
  if (!seasons.length) return <div>{controls}<p style={{ ...muted, fontStyle: 'italic' }}>No {po ? 'playoff' : ccp ? 'CCP' : 'NBA'} games yet.{po ? '' : ' Stats appear here once he plays.'}</p></div>;

  const sumRows = (rs: any[]) => { const t: any = {}; rs.forEach(r => Object.keys(r).forEach(k => { if (typeof r[k] === 'number' && k !== 'season' && k !== 'tid') t[k] = (t[k] || 0) + r[k]; })); return t; };
  const rowsOf = (y: number) => (p.stats || []).filter((r: any) => r.season === y && !!r.po === po);
  const lines = seasons.map(y => {
    if (ccp) { const c = ccpLine(y); return { y, t: c, teams: c?.team || '—', parts: [] as { team: string; t: any }[] }; }
    const rs = rowsOf(y), tids = [...new Set(rs.map((r: any) => r.tid))] as number[];
    return { y, t: gm.seasonTotals(p, y, po), teams: tids.length > 1 ? tids.length + 'TM' : T[tids[0]]?.abbr || '—', parts: tids.length > 1 ? tids.map(tid => ({ team: T[tid]?.abbr || '—', t: sumRows(rs.filter((r: any) => r.tid === tid)) })) : [] };
  });
  const career: any = {}; lines.forEach(({ t }) => Object.keys(t || {}).forEach(k => { if (typeof t[k] === 'number') career[k] = (career[k] || 0) + t[k]; }));
  // Career with each team (NBA): "DAL (7 Yrs)".
  const byTeam = ccp ? [] : ([...new Set((p.stats || []).filter((r: any) => !!r.po === po).map((r: any) => r.tid))] as number[]).map(tid => { const rs = (p.stats || []).filter((r: any) => !!r.po === po && r.tid === tid); return { tid, yrs: new Set(rs.map((r: any) => r.season)).size, t: sumRows(rs) }; }).filter(x => x.t.gp);
  const lbl = (y: number) => (y - 1) + '–' + String(y).slice(2), ageIn = (y: number) => p.age - (gm.Y - y);
  const v = (t: any, x: number) => (mode === 'tot' ? String(Math.round(x)) : mode === 'p36' ? f1(t.min ? (x / t.min) * 36 : 0) : f1(t.gp ? x / t.gp : 0));
  const tradRow = (t: any, first: ReactNode, team: string, age: ReactNode, bold = false) => (
    <tr>
      <TD l b={bold}>{first}</TD><TD l>{team}</TD><TD>{age}</TD><TD>{t.gp}</TD><TD>{t.gs ?? '—'}</TD><TD>{mode === 'tot' ? Math.round(t.min) : f1(t.gp ? t.min / t.gp : 0)}</TD>
      <TD b>{v(t, t.pts)}</TD><TD>{v(t, t.orb)}</TD><TD>{v(t, t.drb)}</TD><TD b>{v(t, t.orb + t.drb)}</TD><TD b>{v(t, t.ast)}</TD><TD>{v(t, t.stl)}</TD><TD>{v(t, t.blk)}</TD><TD>{v(t, t.tov)}</TD><TD>{v(t, t.pf || 0)}</TD>
      <TD>{v(t, t.fgm)}-{v(t, t.fga)}</TD><TD>{pct(t.fgm, t.fga)}</TD><TD>{v(t, t.tpm)}-{v(t, t.tpa)}</TD><TD>{pct(t.tpm, t.tpa)}</TD><TD>{v(t, t.ftm)}-{v(t, t.fta)}</TD><TD>{pct(t.ftm, t.fta)}</TD>
      <TD c={(t.pm || 0) >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)'}>{mode === 'tot' ? Math.round(t.pm || 0) : f1(t.gp ? (t.pm || 0) / t.gp : 0)}</TD>
    </tr>);
  const shootRow = (t: any, first: ReactNode, bold = false) => { const z = fiveZones(t), tsp = t.fga + t.fta ? (100 * t.pts) / (2 * (t.fga + 0.44 * t.fta)) : 0, efg = t.fga ? (100 * (t.fgm + 0.5 * t.tpm)) / t.fga : 0;
    return (<tr><TD l b={bold}>{first}</TD><TD b>{f1(tsp)}</TD><TD>{f1(efg)}</TD><TD>{t.fga ? (t.tpa / t.fga).toFixed(3) : '—'}</TD><TD>{t.fga ? (t.fta / t.fga).toFixed(3) : '—'}</TD>
      {z.map(([k, m, a], i) => <TD key={k} c={a >= 10 ? ((a ? m / a : 0) >= LEAGUE_ZONE[i] ? 'var(--gm-good)' : 'var(--gm-bad)') : undefined}>{pct(m, a)} <span style={{ ...muted, fontSize: '11px' }}>{t.fga ? Math.round((100 * a) / t.fga) + '%' : ''}</span></TD>)}</tr>); };
  const A = (x: any, k: string, d = 1) => (x && x[k] != null && isFinite(x[k]) ? (+x[k]).toFixed(d) : '—');
  const H: any = {}, R: any = {}; (p.stats || []).filter((r: any) => r.season === gm.Y && !r.po).forEach((r: any) => { Object.entries(r.h || {}).forEach(([k, x]) => (H[k] = (H[k] || 0) + (x as number))); Object.entries(r.a || {}).forEach(([k, x]) => (R[k] = (R[k] || 0) + (x as number))); });
  const split = (o: any, name: string) => o.gp ? (<tr><TD l>{name}</TD><TD>{o.gp}</TD><TD>{f1(o.min / o.gp)}</TD><TD b>{f1(o.pts / o.gp)}</TD><TD>{f1((o.orb + o.drb) / o.gp)}</TD><TD>{f1(o.ast / o.gp)}</TD><TD>{pct(o.fgm, o.fga)}</TD><TD>{pct(o.tpm, o.tpa)}</TD><TD>{pct(o.ftm, o.fta)}</TD><TD>{f1(o.tov / o.gp)}</TD></tr>) : null;

  // Basketball-Reference's main table. League leaders (NBA regular season, per game or totals) in bold.
  const lead = (y: number) => (!ccp && !po && mode !== 'p36' ? seasonLeaders(gm, s, y, mode === 'tot' ? 'tot' : 'pg') : null);
  const COLS: [string, string, string?][] = [['gp', 'G'], ['gs', 'GS'], ['min', 'MP'], ['fgm', 'FG'], ['fga', 'FGA'], ['fgp', 'FG%'], ['tpm', '3P'], ['tpa', '3PA'], ['tpp', '3P%'], ['twm', '2P'], ['twa', '2PA'], ['twp', '2P%'], ['efg', 'eFG%', 'Effective FG%: threes count 1.5 field goals'], ['ftm', 'FT'], ['fta', 'FTA'], ['ftp', 'FT%'], ['orb', 'ORB'], ['drb', 'DRB'], ['trb', 'TRB'], ['ast', 'AST'], ['stl', 'STL'], ['blk', 'BLK'], ['tov', 'TOV'], ['pf', 'PF'], ['pts', 'PTS']];
  const PCTK = new Set(['fgp', 'tpp', 'twp', 'efg', 'ftp']);
  const cell = (t: any, k: string, L: Record<string, number> | null, grey = false) => {
    const v = statVal(t, k, mode), txt = !isFinite(v) ? '' : PCTK.has(k) ? v.toFixed(3).replace(/^0/, '') : k === 'gp' || k === 'gs' || mode === 'tot' ? String(Math.round(v)) : v.toFixed(1);
    const b = !!L && L[k] != null && isFinite(v) && roundStat(k, v, mode === 'tot' ? 'tot' : 'pg') === L[k];
    return <td key={k} style={{ padding: '4px 6px', textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums', fontWeight: b ? 800 : undefined, color: grey ? 'var(--color-neutral-600)' : undefined }} title={b ? 'Led the league' : undefined}>{txt}</td>;
  };
  const Aw = ({ y }: { y: number }) => { if (ccp) return <td />; const tags = awardTags(s, p.id, y, po); return <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', fontSize: '11.5px' }}>{tags.map((a, i) => <span key={a.tag} title={a.name}>{i ? ', ' : ''}<span style={{ fontWeight: a.won ? 800 : undefined, color: 'var(--color-accent-700)' }}>{a.tag}</span></span>)}</td>; };
  const lgName = ccp ? 'CCP' : 'NBA', allStar = (y: number) => !ccp && !po && allStarsOf(s, y).includes(p.id);
  const bbRow = (key: string, first: ReactNode, age: ReactNode, team: string, t: any, y: number | null, opts: { grey?: boolean; bold?: boolean; top?: boolean } = {}) => (
    <tr key={key} style={{ borderTop: opts.top ? '2px solid var(--color-text)' : undefined, background: opts.bold ? 'var(--color-neutral-100)' : undefined }}>
      <td style={{ padding: '4px 6px', whiteSpace: 'nowrap', fontWeight: opts.bold ? 700 : undefined, color: opts.grey ? 'var(--color-neutral-600)' : undefined }}>{first}</td>
      <td style={{ padding: '4px 6px', textAlign: 'right', color: opts.grey ? 'var(--color-neutral-600)' : undefined }}>{age}</td>
      <td style={{ padding: '4px 6px', color: opts.grey ? 'var(--color-neutral-600)' : undefined }}>{team}</td>
      <td style={{ padding: '4px 6px', color: 'var(--color-neutral-600)' }}>{y != null ? lgName : ''}</td>
      <td style={{ padding: '4px 6px', color: opts.grey ? 'var(--color-neutral-600)' : undefined }}>{y != null ? p.pos : ''}</td>
      {COLS.map(([k]) => cell(t, k, y != null && !opts.grey ? lead(y) : null, opts.grey))}
      {y != null && !opts.grey ? <Aw y={y} /> : <td />}
    </tr>);
  const nYrs = seasons.length;
  return (
    <div>
      {controls}

      <h4 style={ruleH4}>{ccp ? 'CCP ' : ''}{po ? 'Playoffs ' : ''}{mode === 'tot' ? 'Totals' : mode === 'p36' ? 'Per 36 minutes' : 'Per game'}</h4>
      <Wrap>
        <thead><tr><TH l>Season</TH><TH>Age</TH><TH l>Team</TH><TH l>Lg</TH><TH l>Pos</TH>{COLS.map(([k, h, t]) => <TH key={k} t={t}>{h}</TH>)}<TH l>Awards</TH></tr></thead>
        <tbody>
          {lines.map(({ y, t, teams, parts }) => <Fragment key={y}>
            {bbRow('s' + y, <>{lbl(y)}{allStar(y) && <span title="All-Star" style={{ color: 'var(--gm-elite, var(--color-accent))', marginLeft: 3 }}>★</span>}</>, ageIn(y), teams, t, y)}
            {parts.map(x => bbRow('s' + y + x.team, lbl(y), ageIn(y), x.team, x.t, y, { grey: true }))}
          </Fragment>)}
          {nYrs > 1 && bbRow('car', nYrs + ' Yr' + (nYrs === 1 ? '' : 's'), '', '', career, null, { bold: true, top: true })}
          {byTeam.length > 1 && byTeam.map(x => bbRow('t' + x.tid, (T[x.tid]?.abbr || '—') + ' (' + x.yrs + ' Yr' + (x.yrs === 1 ? '' : 's') + ')', '', '', x.t, null, { bold: true }))}
        </tbody>
      </Wrap>
      <p style={{ ...muted, fontSize: '11px', margin: '0 0 6px' }}>{ccp ? 'His CCP games (the development league).' : <>Bold: led the league that season (per game with 70% of the games; percentages with 300 made field goals, 82 threes or 125 free throws over a full season). ★ All-Star. Awards: voting finish (MVP-4 = 4th in MVP voting; winners in bold), AS All-Star, NBA1–3 All-League, DEF All-Defensive, ROOK All-Rookie{po ? ', FMVP Finals MVP' : ''}.</>}</p>

      <h4 style={{ ...ruleH4, marginTop: 18 }}>Scoring and plus-minus</h4>
      <Wrap>
        <thead><tr><TH l>Season</TH><TH l>Team</TH><TH>Age</TH><TH>GP</TH><TH>GS</TH><TH>MIN</TH><TH>PTS</TH><TH>ORB</TH><TH>DRB</TH><TH>REB</TH><TH>AST</TH><TH>STL</TH><TH>BLK</TH><TH>TOV</TH><TH>PF</TH><TH>FG</TH><TH>FG%</TH><TH>3P</TH><TH>3P%</TH><TH>FT</TH><TH>FT%</TH><TH t="Plus-minus: points scored minus allowed while he was on the floor">+/-</TH></tr></thead>
        <tbody>{lines.map(({ y, t, teams }) => <Fragment key={y}>{tradRow(t, lbl(y), teams, ageIn(y))}</Fragment>)}{lines.length > 1 && tradRow(career, 'Career', '', '', true)}</tbody>
      </Wrap>

      <h4 style={{ ...ruleH4, marginTop: 18 }}>Shooting</h4>
      <p style={{ ...muted, fontSize: '11.5px', margin: '0 0 4px' }}>FG% by zone, with his share of shots from there. Green beats the league average for that zone (restricted area {Math.round(LEAGUE_ZONE[0] * 100)}%, paint {Math.round(LEAGUE_ZONE[1] * 100)}%, mid-range {Math.round(LEAGUE_ZONE[2] * 100)}%, corner 3 {Math.round(LEAGUE_ZONE[3] * 100)}%, above the break {Math.round(LEAGUE_ZONE[4] * 100)}%).</p>
      <Wrap>
        <thead><tr><TH l>Season</TH><TH t="True shooting: points per shooting possession, free throws included">TS%</TH><TH t="Effective FG%: threes count 1.5 field goals">eFG%</TH><TH t="Share of shots that are threes">3PAr</TH><TH t="Free throws per shot">FTr</TH><TH>Restricted area</TH><TH>Paint (non-RA)</TH><TH>Mid-range</TH><TH>Corner 3</TH><TH>Above the break 3</TH></tr></thead>
        <tbody>{lines.map(({ y, t }) => <Fragment key={y}>{shootRow(t, lbl(y))}</Fragment>)}{lines.length > 1 && shootRow(career, 'Career', true)}</tbody>
      </Wrap>

      {(<>
        <h4 style={{ ...ruleH4, marginTop: 18 }}>Advanced{po ? ' (playoffs)' : ''}</h4>
        <Wrap>
          <thead><tr><TH l>Season</TH><TH t="Player efficiency rating (15 is average)">PER</TH><TH t="Usage: share of team plays he ends while on the floor">USG%</TH><TH>AST%</TH><TH>TOV%</TH><TH>ORB%</TH><TH>DRB%</TH><TH>TRB%</TH><TH>STL%</TH><TH>BLK%</TH><TH t="Points produced per 100 possessions">ORtg</TH><TH t="Points allowed per 100 possessions">DRtg</TH><TH t="Offensive win shares">OWS</TH><TH t="Defensive win shares">DWS</TH><TH t="Win shares">WS</TH><TH>WS/48</TH><TH>OBPM</TH><TH>DBPM</TH><TH t="Box plus-minus: points per 100 over an average player">BPM</TH><TH t="Value over a replacement-level player">VORP</TH><TH t="Team net rating per 100 with him on the floor vs off">On/Off</TH></tr></thead>
          <tbody>{lines.map(({ y }) => { const x = adv[y]; return (<tr key={y}><TD l>{lbl(y)}</TD><TD b>{A(x, 'per')}</TD><TD>{A(x, 'usgp')}</TD><TD>{A(x, 'astp')}</TD><TD>{A(x, 'tovp')}</TD><TD>{A(x, 'orbp')}</TD><TD>{A(x, 'drbp')}</TD><TD>{A(x, 'trbp')}</TD><TD>{A(x, 'stlp')}</TD><TD>{A(x, 'blkp')}</TD><TD>{A(x, 'ortg', 0)}</TD><TD>{A(x, 'drtg', 0)}</TD><TD>{A(x, 'ows')}</TD><TD>{A(x, 'dws')}</TD><TD b>{A(x, 'ws')}</TD><TD>{A(x, 'ws48', 3)}</TD><TD>{A(x, 'obpm')}</TD><TD>{A(x, 'dbpm')}</TD><TD b>{A(x, 'bpm')}</TD><TD>{A(x, 'vorp')}</TD><TD>{A(x, 'onOff100')}</TD></tr>); })}</tbody>
        </Wrap>
        {!po && !ccp && (H.gp || R.gp) ? (<>
          <h4 style={{ ...ruleH4, marginTop: 18 }}>This season's splits</h4>
          <Wrap>
            <thead><tr><TH l>Split</TH><TH>GP</TH><TH>MIN</TH><TH>PTS</TH><TH>REB</TH><TH>AST</TH><TH>FG%</TH><TH>3P%</TH><TH>FT%</TH><TH>TOV</TH></tr></thead>
            <tbody>{split(H, 'Home')}{split(R, 'Road')}
              {(p.last5 || []).length > 0 && <tr><TD l>Last {(p.last5 || []).length} games</TD><TD>{(p.last5 || []).length}</TD><TD>{f1((p.last5 || []).reduce((a: number, x: any) => a + x.min, 0) / (p.last5 || []).length)}</TD><TD b>{f1((p.last5 || []).reduce((a: number, x: any) => a + x.pts, 0) / (p.last5 || []).length)}</TD><TD>{f1((p.last5 || []).reduce((a: number, x: any) => a + x.reb, 0) / (p.last5 || []).length)}</TD><TD>{f1((p.last5 || []).reduce((a: number, x: any) => a + x.ast, 0) / (p.last5 || []).length)}</TD><TD>—</TD><TD>—</TD><TD>—</TD><TD>—</TD></tr>}
            </tbody>
          </Wrap>
        </>) : null}
      </>)}
    </div>
  );
}
