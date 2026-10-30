import type { VM } from '../vm';
import { GOD_PINK, PN } from '../kit';
import { Fragment, useMemo, useState } from 'react';
import { classStats } from '../../engine/amateurStats';
import { TraitFilter, byTrait } from '../TraitFilter';
import { muted, Seg, usePaged } from '../kit';
import { MockDrafts } from './MockDrafts';
import { useScoutSelect } from '../ScoutSelect';

// Small buttons on each pick: trade for it / trade it, or open a trade with its owner.
const pickBtn = { fontSize: "11px", padding: "2px 8px", minHeight: 0, lineHeight: 1.5 } as const;

export function DraftScreen({ vm }: { vm: VM }) {
  const [tk, setTk] = useState(''), [view, setView] = useState<'board' | 'mock'>('board'), [stMode, setStMode] = useState<'' | 'trad' | 'adv'>(''), stats = !!stMode;
  // College / club stats on the board (2026-10-30): each prospect's latest season he played, traditional or advanced, in place of where he plays and his height.
  const { gm, s } = vm.ctx, cls = s.dClass, clsIds: number[] = (gm.db.cls?.[cls] || []);
  const am = useMemo(() => (stats ? classStats(gm, cls, clsIds, s.gv || 0) : {}), [stats, gm, cls, clsIds.length, s.gv, gm.Y]);
  const last = (id: number) => (am[id] || []).filter((x: any) => x.gp > 0).slice(-1)[0];
  const snap = (p: any) => { const x = last(p.id), d = x?.disp; if (!x) return <><b>{p.name}</b><div style={{ color: 'var(--color-neutral-600)' }}>No college or club season yet.</div></>;
    const pg = (v: number) => (v / d.gp).toFixed(1), pc = (m: number, a: number) => (a ? ((100 * m) / a).toFixed(1) : '—');
    const cells: [string, string][] = [['G', String(d.gp)], ['MPG', x.mpg.toFixed(1)], ['PTS', pg(d.pts)], ['REB', pg(d.orb + d.drb)], ['AST', pg(d.ast)], ['STL', pg(d.stl)], ['BLK', pg(d.blk)], ['TOV', pg(d.tov)], ['FG%', pc(d.fgm, d.fga)], ['3P%', pc(d.tpm, d.tpa)], ['FT%', pc(d.ftm, d.fta)]];
    return <><b>{p.name}</b><div style={{ color: 'var(--color-neutral-600)', margin: '1px 0 6px' }}>{(x.season - 1) + '–' + String(x.season).slice(2)} · {x.team} · {x.level} · age {x.age}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, auto)', gap: '2px 10px' }}>{cells.map(([k, v]) => <div key={k}><div style={{ color: 'var(--color-neutral-600)', fontSize: '10.5px' }}>{k}</div><div style={{ fontVariantNumeric: 'tabular-nums' }}>{v}</div></div>)}</div></>; };
  const f1 = (x: number, d = 1) => (x == null || !isFinite(x) ? '—' : x.toFixed(d)), pct = (m: number, a: number) => (a ? (100 * m) / a : NaN);
  // [label, tooltip, value, decimals]: a column sorts by its value (a prospect with none goes last).
  const TRAD: [string, string, (x: any) => number, number?][] = [['PPG', 'Points per game', x => x.disp.pts / x.disp.gp], ['RPG', 'Rebounds per game', x => (x.disp.orb + x.disp.drb) / x.disp.gp], ['APG', 'Assists per game', x => x.disp.ast / x.disp.gp],
    ['SPG', 'Steals per game', x => x.disp.stl / x.disp.gp], ['BPG', 'Blocks per game', x => x.disp.blk / x.disp.gp], ['FG%', 'Field goal %', x => pct(x.disp.fgm, x.disp.fga)], ['3P%', 'Three-point %', x => pct(x.disp.tpm, x.disp.tpa)],
    ['FT%', 'Free-throw %', x => pct(x.disp.ftm, x.disp.fta)], ['PER', 'Player efficiency rating', x => x.adv?.per]];
  // Advanced stats, a page at a time (‹ ›): every one the game keeps for an amateur season, PER aside (it's with the traditional ones).
  const A = (k: string) => (x: any) => x.adv?.[k];
  const ADV_PAGES: [string, [string, string, (x: any) => number, number?][]][] = [
    ['Scoring', [['TS%', 'True shooting %', A('tsp')], ['eFG%', 'Effective field goal %', A('efg')], ['3PAr', 'Share of shots from three', A('tpar'), 3], ['FTr', 'Free throws per shot', A('ftr'), 3], ['USG%', 'Usage: share of his team’s plays he finishes while on the floor', A('usgp')],
      ['AST%', 'Share of teammates’ baskets he assisted while on the floor', A('astp')], ['TOV%', 'Turnovers per 100 plays', A('tovp')], ['ORtg', 'Offensive rating: points produced per 100 possessions', A('ortg'), 0]]],
    ['Rebounding and defense', [['ORB%', 'Offensive rebound %', A('orbp')], ['DRB%', 'Defensive rebound %', A('drbp')], ['TRB%', 'Total rebound %', A('trbp')], ['STL%', 'Steals per 100 opponent possessions', A('stlp')], ['BLK%', 'Share of opponents’ twos he blocked', A('blkp')],
      ['DRtg', 'Defensive rating', A('drtg'), 0], ['OWS', 'Offensive win shares', A('ows')], ['DWS', 'Defensive win shares', A('dws')]]],
    ['Impact', [['WS', 'Win shares', A('ws')], ['WS/40', 'Win shares per 40 minutes', A('ws40'), 3], ['OBPM', 'Offensive box plus-minus (the class average is 0)', A('obpm')], ['DBPM', 'Defensive box plus-minus', A('dbpm')], ['BPM', 'Box plus-minus', A('bpm')],
      ['EWA', 'Estimated wins added', A('ewa')], ['EPM', 'EPM estimate (box score: no lineup data for amateurs)', A('epm')], ['LEBRON', 'LEBRON estimate (box score)', A('lebron')], ['DARKO', 'DARKO estimate (box score)', A('darko')]]]];
  const [advPg, setAdvPg] = useState(0), ADV = ADV_PAGES[advPg][1];
  const turn = (d: number) => { const n = (advPg + d + ADV_PAGES.length) % ADV_PAGES.length; setAdvPg(n); setStSort(cur => (cur && ADV_PAGES[n][1].some(c => c[0] === cur[0]) ? cur : null)); };
  const ST = stMode === 'adv' ? ADV : TRAD, pickMode = (m: 'trad' | 'adv') => { setStSort(null); setStMode(cur => (cur === m ? '' : m)); };
  const [stSort, setStSort] = useState<[string, number] | null>(null); // a college stat column to sort by (best first), or the board's own sort
  const stVal = (id: number, k: string) => { const x = last(id), c = ST.find(t => t[0] === k); const v = x && c ? c[2](x) : NaN; return v == null || !isFinite(v) ? null : v; };
  const sortSt = (k: string) => setStSort(cur => (cur && cur[0] === k ? [k, -cur[1]] : [k, -1]));
  const cols = (vm.draftCols || []).filter((c: any) => !stats || (c.key !== 'fromT' && c.key !== 'hgt'));
  const rows0 = (vm.draftRows || []).filter(byTrait(vm, tk));
  const boardRows = stats && stSort ? rows0.slice().sort((a: any, b: any) => { const x = stVal(a.id, stSort[0]), y = stVal(b.id, stSort[0]); return x == null ? (y == null ? 0 : 1) : y == null ? -1 : stSort[1] < 0 ? y - x : x - y; }) : rows0, sc = useScoutSelect(vm, boardRows.map((p: any) => p.id));
  const pg = usePaged(boardRows, 'prospects', 30);
  const head = (
      <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "14px", flexWrap: "wrap" }}>
        <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden", flex: "none" }}>
          {(vm.dClasses || []).map((sg: any, i: number) => (
            <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", whiteSpace: "nowrap", color: sg.color, boxShadow: sg.ring }}>
              {sg.label}
            </button>
          ))}
        </div>
        {(vm.pastDrafts || []).length > 0 && <select className="input" value={vm.dr.past ? vm.ctx.s.dClass : ''} onChange={e => e.target.value && vm.ctx.gm.setState({ dClass: +e.target.value, adv: {} })} style={{ width: 'auto', fontSize: '13px', minHeight: 32 }} title="Every draft held in this league: who went where, and how they turned out">
          <option value="">Past drafts…</option>{vm.pastDrafts.map((y: number) => <option key={y} value={y}>{y} draft</option>)}
        </select>}
        <div style={{ flex: "1", color: vm.ctx.s.god ? GOD_PINK : "var(--color-neutral-700)", fontSize: "12px" }}>
          {vm.dr.classNote}
        </div>
        {!!vm.dr.isCurrent && (<>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary" onClick={vm.askScouts} disabled={vm.dr.noAdvice} style={{ whiteSpace: "nowrap" }}>
              Ask scouts
            </button>
            <button className="btn btn-secondary" onClick={vm.askAgm} disabled={vm.dr.noAdvice} style={{ whiteSpace: "nowrap" }}>
              Ask assistant GM
            </button>
          </div>
        </>)}
      </div>
  );
  if (vm.dr.past) return <>{head}<PastDraft vm={vm} /></>;
  return (
    <>
      {head}
      {!!vm.dr.isCurrent && (<>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "10px 14px", border: vm.dr.mineClock ? "3px solid var(--gm-good)" : "1px solid var(--color-text)" /* another team on the clock: white */, borderRadius: "var(--radius-md)", background: vm.dr.mineClock ? "color-mix(in srgb, var(--gm-good) 10%, transparent)" : undefined }}>
          <div style={{ flex: "1" }}>
            <span style={{ fontFamily: "var(--font-heading)", fontSize: "19px", fontWeight: "600" }}>
              {vm.dr.status}
            </span>
            {" "}
            <span style={{ color: "var(--color-neutral-700)", marginLeft: "8px" }}>
              {vm.dr.sub}
            </span>
          </div>
          <button className="btn btn-secondary" onClick={vm.simOne} disabled={vm.dr.noSimMine} title="The team on the clock makes its pick" style={{ whiteSpace: "nowrap", flex: "none" }}>
            Sim one pick
          </button>
          <button className="btn btn-secondary" onClick={vm.simToMine} disabled={vm.dr.noSimMine} style={{ whiteSpace: "nowrap", flex: "none" }}>
            Sim to my pick
          </button>
          <button className="btn btn-secondary" onClick={vm.simAll} disabled={vm.dr.done} style={{ whiteSpace: "nowrap", flex: "none" }}>
            Auto-draft the rest
          </button>
        </div>
      </>)}
      {!!vm.dr.hasAdvice && (<>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "16px", marginBottom: "18px" }}>
          {(vm.dr.advice || []).map((a: any, i: number) => (
            <div key={i} className="card" style={{ padding: "14px 16px" }}>
              <div className="card-kicker" style={{ color: "var(--color-accent-700)" }}>
                {a.who}
              </div>
              <button className="hv1" onClick={a.open} style={{ all: "unset", cursor: "pointer", fontFamily: "var(--font-heading)", fontSize: "22px", fontWeight: "600", lineHeight: "1.1" }}>
                {a.name}
              </button>
              <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                {a.meta}
              </div>
              <p style={{ margin: "4px 0 0", textAlign: "justify", hyphens: "auto" }}>
                {a.why}
              </p>
              {!!a.canDraft && (<>
                <div>
                  <button className="btn btn-primary" onClick={a.draft} style={{ fontSize: "13px" }}>
                    Draft {a.name}
                  </button>
                </div>
              </>)}
            </div>
          ))}
        </div>
      </>)}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(280px,320px) minmax(0,1fr)", gap: "28px", alignItems: "start" }}>
        <section>
          {!!vm.dr.isCurrent && (<>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              First round
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "calc(100vh - 260px)", overflowY: "auto", paddingRight: "4px" }}>
              {(vm.dr.order || []).map((o: any, i: number) => (
                <div key={i} ref={o.onClock ? (el => { const box = el?.parentElement; if (el && box && box.dataset.at !== String(o.n)) { box.dataset.at = String(o.n); box.scrollTop = el.offsetTop - box.offsetTop - 90; } }) : undefined} style={{ display: "grid", gridTemplateColumns: "30px 30px minmax(0,1fr)", gap: "10px", alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-md)", border: o.onClock && o.mine ? "3px solid var(--gm-good)" : o.onClock ? "2px solid var(--color-text)" : o.mine ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)", borderLeft: o.onClock && o.mine ? "8px solid var(--gm-good)" : o.mine ? "6px solid var(--color-accent)" : undefined, background: o.onClock && o.mine ? "color-mix(in srgb, var(--gm-good) 16%, transparent)" : o.onClock ? "var(--color-accent-100)" : o.mine ? "color-mix(in srgb, var(--color-accent) 18%, transparent)" : "transparent", boxShadow: o.mine ? "0 0 0 1px color-mix(in srgb, var(--color-accent) 40%, transparent), 0 2px 10px color-mix(in srgb, var(--color-accent) 25%, transparent)" : undefined }}>
                  <span style={{ fontFamily: "var(--font-heading)", fontSize: "20px", textAlign: "right", color: o.onClock ? "var(--color-accent-700)" : "var(--color-neutral-600)" }}>{o.n}</span>
                  <button onClick={o.openT} title={o.team} style={{ all: "unset", cursor: "pointer" }}>{o.logoLg}</button>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", gap: "6px", alignItems: "baseline", fontSize: "13px", color: o.mine ? "var(--color-accent-700)" : "var(--color-text)", fontWeight: o.mine ? 600 : 400 }}>
                      <button className="hv4" onClick={o.openT} style={{ all: "unset", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.team}</button>
                      {o.via && <span style={{ fontSize: "11px", color: "var(--color-neutral-600)", whiteSpace: "nowrap" }}>{o.via}</span>}
                      {o.mine && <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: ".08em", padding: "1px 6px", borderRadius: 3, background: "var(--color-accent)", color: "var(--color-bg)", whiteSpace: "nowrap" }}>YOUR PICK</span>}
                    </div>
                    {o.pid ? (
                      <div style={{ fontSize: "12.5px", lineHeight: 1.35 }}>
                        <button className="hv1" onClick={o.openP} style={{ all: "unset", cursor: "pointer", fontWeight: 600 }}>{o.who}</button>
                        <div style={{ fontSize: "11.5px", color: "var(--color-neutral-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.pmeta}</div>
                      </div>
                    ) : (
                      <div style={{ fontSize: "12px", fontStyle: "italic", fontWeight: o.onClock && o.mine ? 700 : undefined, color: o.onClock && o.mine ? "var(--gm-good)" : o.onClock ? "var(--color-accent-700)" : "var(--color-neutral-600)" }}>{o.onClock ? (o.mine ? "You’re on the clock" : "On the clock") : "Pick " + o.n}</div>
                    )}
                    {o.canTrade && (
                      <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap" }}>
                        <button className="btn btn-secondary" onClick={o.tradePick} style={pickBtn}>{o.tradeLbl}</button>
                        <button className="btn btn-ghost" onClick={o.proposeTrade} style={pickBtn}>Propose trade</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>)}
          {!!vm.dr.isFuture && (<>
            <h4 style={{ margin: "0 0 4px", fontSize: "19px" }}>
              Your picks
            </h4>
            {(vm.dr.myFuture || []).map((k: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", padding: "4px 2px", borderBottom: "1px solid var(--color-divider)" }}>
                <span>
                  {k.label}
                </span>
                <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                  <span style={{ color: "var(--color-neutral-700)" }}>{k.proj}</span>
                  {k.tradePick && <button className="btn btn-secondary" onClick={k.tradePick} style={pickBtn}>Trade pick</button>}
                  {k.proposeTrade && <button className="btn btn-ghost" onClick={k.proposeTrade} style={pickBtn}>Propose trade</button>}
                </span>
              </div>
            ))}
            <p style={{ margin: "10px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
              {vm.dr.scoutLine}
            </p>
          </>)}
        </section>
        <section>
          {!!vm.dr.isCurrent && <div style={{ marginBottom: "10px" }}><Seg<"board" | "mock"> value={view} options={[["board", "Big board"], ["mock", "Mock drafts"]]} onChange={setView} /></div>}
          {view === "mock" && vm.dr.isCurrent ? <MockDrafts vm={vm} /> : (<>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "0 0 8px" }}><TraitFilter value={tk} onChange={setTk} />{([["trad", "Show traditional stats", "Points, rebounds, assists, steals, blocks, shooting and PER"], ["adv", "Show advanced stats", "Every advanced stat, a set at a time (‹ › to turn): scoring, rebounding and defense, impact"]] as const).map(([m, label, what]) => <button key={m} className={stMode === m ? "btn btn-primary" : "btn btn-secondary"} onClick={() => pickMode(m)} title={what + ": each prospect's latest season, in place of where he plays and his height" + (stMode === m ? " (click again to hide)" : "")} style={{ fontSize: "12.5px" }}>{label}</button>)}{stMode === 'adv' && <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12.5px" }}><button className="btn btn-ghost" onClick={() => turn(-1)} title="Previous set" style={{ padding: "2px 8px", minHeight: 0 }}>‹</button><span style={{ display: "inline-grid", whiteSpace: "nowrap", textAlign: "center" }}>{ADV_PAGES.map(([name], i) => <span key={name} aria-hidden={i !== advPg} style={{ gridArea: "1 / 1", visibility: i === advPg ? "visible" : "hidden" }}>{name} <span style={{ color: "var(--color-neutral-600)" }}>{i + 1}/{ADV_PAGES.length}</span></span>)}</span><button className="btn btn-ghost" onClick={() => turn(1)} title="Next set" style={{ padding: "2px 8px", minHeight: 0 }}>›</button></span>}</div>
          {sc.bar()}{sc.Menu()}
          <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                {sc.head()}
                {cols.map((c: any, i: number) => (<Fragment key={i}>
                  <th onClick={() => { setStSort(null); c.onClick(); }} style={{ padding: "6px 8px", textAlign: c.align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: stats && stSort ? "color-mix(in srgb, var(--color-text) 60%, transparent)" : c.color }}>
                    {c.label}{stats && stSort ? "" : c.arrow}
                  </th>
                  {stats && c.key === 'age' && ST.map(([h, t]) => { const on = stSort?.[0] === h; return <th key={h} title={t + ' (click to sort)'} onClick={() => sortSt(h)} style={{ padding: "6px 4px", textAlign: "right", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", color: on ? "var(--color-accent-700)" : "color-mix(in srgb, var(--color-text) 60%, transparent)" }}>{h}{on ? (stSort![1] < 0 ? ' ↓' : ' ↑') : ''}</th>; })}</Fragment>
                ))}
                <th style={{ padding: "6px 8px" }}></th>
              </tr>
            </thead>
            <tbody>
              {pg.rows.map((p: any, i: number) => (
                <tr key={i} onContextMenu={sc.onContext(p.id)} style={{ background: sc.isSel(p.id) ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined }}>
                  {sc.cell(p.id)}
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap", color: "var(--color-neutral-700)" }}>
                    {p.rank}
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    <span style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                      <img src={p.flag} alt="" title={p.cname} style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)", ...PN }}>
                        {p.name}
                      </button>
                      {sc.tag(p.id)}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px" }}>
                    {p.pos}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.age}
                  </td>
                  {stats ? ST.map(([h, , fn, dg]) => { const x = last(p.id); return <td key={h} style={{ padding: "4px 4px", textAlign: "right", whiteSpace: "nowrap", fontWeight: stSort?.[0] === h ? 600 : undefined }}>{x ? f1(fn(x), dg ?? 1) : '—'}</td>; }) : (<>
                  <td style={{ padding: "4px 8px" }}>
                    {p.fromT}{" "}
                    <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                      {p.fromL}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.hgt}
                  </td></>)}
                  <td style={{ padding: "4px 8px", textAlign: "right", color: p.tone, fontWeight: "600", whiteSpace: "nowrap" }}>
                    {p.ovrS}
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", color: p.ptone, fontWeight: "600", whiteSpace: "nowrap" }}>
                    {p.potS}
                  </td>
                  <td style={{ padding: "3px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {!!p.showDraft && (<>
                      <button className="btn btn-primary" onClick={p.draft} disabled={p.cant} style={{ fontSize: "12px", padding: "3px 12px" }}>
                        Draft
                      </button>
                    </>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {pg.pager}
          </>)}
        </section>
      </div>
    </>
  );
}

// A past draft: every pick in order, who made it, how he rated that night, how his game carried
// over at his first camp, and how he's turned out (rating now, career numbers, where he is).
function PastDraft({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P, year = s.dClass, [sortK, setSortK] = useState<'n' | 'now' | 'pts'>('n');
  const used = Object.entries((gm.db as any).pickUsed || {}).filter(([k]) => k.startsWith(year + '-')).map(([k, v]: any) => ({ ...v, rd: +k.split('-')[1], orig: +k.split('-')[2] }));
  const career = (p: any) => { const rows = (p.stats || []).filter((r: any) => !r.po), g = rows.reduce((a: number, r: any) => a + (r.gp || 0), 0), sum = (k: string) => rows.reduce((a: number, r: any) => a + (r[k] || 0), 0); return { g, pts: g ? sum('pts') / g : 0, reb: g ? (sum('orb') + sum('drb')) / g : 0, ast: g ? sum('ast') / g : 0, seasons: new Set(rows.map((r: any) => r.season)).size }; };
  const where = (p: any) => { if (p.retired) return p.gone ? 'Left the league' : 'Retired' + (p.retired.season ? ' (' + p.retired.season + ')' : ''); const t = gm.tidOf(s.rosters, p.id); if (t >= 0) return T[t].abbr; if ((s.overseas || []).includes(p.id)) return 'Overseas'; if ((s.fa || []).includes(p.id)) return 'Free agent'; return '—'; };
  const rows = used.map(u => { const p = P[u.pid] || { name: '?', id: u.pid }, c = career(p); return { u, p, c, now: p.retired || p.gone ? -1 : p.ovr ?? -1 }; })
    .sort((a, b) => sortK === 'now' ? b.now - a.now : sortK === 'pts' ? b.c.pts * Math.min(1, b.c.g / 40) - a.c.pts * Math.min(1, a.c.g / 40) : a.u.n - b.u.n);
  if (!rows.length) return <p style={{ ...muted }}>No picks were recorded for the {year} draft.</p>;
  const active = rows.filter(r => r.now >= 0), best = active.slice().sort((a, b) => b.now - a.now)[0], steal = active.filter(r => r.u.n > 14).sort((a, b) => b.now - a.now)[0];
  const th = (k: typeof sortK | null, label: string, right = false) => <th style={{ padding: '6px 8px', textAlign: right ? 'right' : 'left', cursor: k ? 'pointer' : undefined, color: k && sortK === k ? 'var(--color-accent-700)' : undefined, whiteSpace: 'nowrap' }} onClick={k ? () => setSortK(k) : undefined}>{label}</th>;
  return (
    <section>
      <p style={{ margin: '0 0 10px', fontSize: '13px' }}>
        {best && <>Best of the class so far: <button className="hv1" onClick={() => open(best.p.id)} data-pid={best.p.id} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>{best.p.name}</button> (#{best.u.n}, now {best.now}). </>}
        {steal && steal !== best && <>Biggest steal: <button className="hv1" onClick={() => open(steal.p.id)} data-pid={steal.p.id} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>{steal.p.name}</button> (#{steal.u.n}, now {steal.now}).</>}
      </p>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead><tr>{th('n', 'Pick', true)}{th(null, 'Team')}{th(null, 'Player')}{th(null, 'From')}{th(null, 'Draft night', true)}{th(null, 'First camp', true)}{th('now', 'Now', true)}{th('pts', 'Career', true)}{th(null, 'Where now')}</tr></thead>
        <tbody>{rows.map(({ u, p, c, now }) => (
          <tr key={u.n} style={{ background: gm.isUser(s, u.tid) ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : undefined }}>
            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '16px' }}>{u.n}{u.rd === 2 && <span style={{ ...muted, fontSize: '10.5px' }}> (2nd)</span>}</td>
            <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{logo(u.tid, 16)}<button className="hv4" onClick={() => openTeam(u.tid)} style={{ all: 'unset', cursor: 'pointer' }}>{T[u.tid]?.abbr}</button>{u.orig !== u.tid && T[u.orig] && <span style={{ ...muted, fontSize: '11px' }}>via {T[u.orig].abbr}</span>}</span></td>
            <td style={{ padding: '5px 8px' }}><button className="hv1" onClick={() => open(p.id)} data-pid={p.id} title={p.name} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600, ...PN }}>{p.name}</button> <span style={{ ...muted, fontSize: '11.5px' }}>{p.pos}</span></td>
            <td style={{ padding: '5px 8px', fontSize: '12px', ...muted }}>{p.from?.team || ''}</td>
            <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{u.ovr != null ? u.ovr + ' / ' + u.pot : '—'}</td>
            <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap', color: p.dxDone ? (p.dxDone.to > p.dxDone.from + 2 ? 'var(--gm-good)' : p.dxDone.to < p.dxDone.from - 2 ? 'var(--gm-bad)' : undefined) : undefined }} title={p.dxDone ? 'At his first NBA camp his game carried over ' + (p.dxDone.to - p.dxDone.from >= 0 ? '+' : '') + (p.dxDone.to - p.dxDone.from) : 'Not in an NBA camp yet'}>{p.dxDone ? p.dxDone.from + ' → ' + p.dxDone.to : '—'}</td>
            <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>{now >= 0 ? now + ' / ' + p.pot : '—'}</td>
            <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{c.g ? c.g + ' G · ' + c.pts.toFixed(1) + ' / ' + c.reb.toFixed(1) + ' / ' + c.ast.toFixed(1) : <span style={muted}>no games</span>}</td>
            <td style={{ padding: '5px 8px', fontSize: '12.5px' }}>{where(p)}</td>
          </tr>))}</tbody>
      </table>
      <p style={{ ...muted, fontSize: '11.5px', marginTop: 6 }}>Draft night is how he rated then (true ratings, before camp). First camp is how his game carried over to the NBA. Career is points / rebounds / assists per game in the regular season. Click Pick, Now or Career to sort.</p>
    </section>
  );
}
