import type { VM } from '../vm';
import { GOD_PINK, PN } from '../kit';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { classStats } from '../../engine/amateurStats';
import { TraitFilter, byTrait } from '../TraitFilter';
import { muted, Seg, usePaged } from '../kit';
import { MockDrafts } from './MockDrafts';
import { useScoutSelect } from '../ScoutSelect';
import { useSearchFilter } from '../SearchFilter';
import { LoadDraftClass } from '../LoadDraftClass';
import { scoutReport } from '../../engine/scoutReport';
import { DraftProspectCard } from './DraftProspectCard';
import { DraftRoomLayout } from './DraftRoomLayout';
import './DraftScreen.css';

// Small buttons on each pick: trade for it / trade it, or open a trade with its owner.

export function DraftScreen({ vm }: { vm: VM }) {
  const [confirmAutoDraft, setConfirmAutoDraft] = useState(false);
  const autoDraftDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (confirmAutoDraft && autoDraftDialog.current && !autoDraftDialog.current.open) autoDraftDialog.current.showModal();
  }, [confirmAutoDraft]);
  const [tk, setTk] = useState(''),
    [view, setView] = useState<'board' | 'mock'>('board'),
    [stMode, setStMode] = useState<'' | 'trad' | 'adv'>(''),
    stats = !!stMode;
  // College / club stats on the board (2026-10-30): each prospect's latest season he played, traditional or advanced, in place of where he plays and his height.
  const { gm, s } = vm.ctx,
    cls = s.dClass,
    clsIds: number[] = gm.db.cls?.[cls] || [];
  const [expanded, setExpanded] = useState<{ cls: number; id: number } | null>(null);
  const needAmateur = stats || expanded?.cls === cls;
  const am = useMemo(() => (needAmateur ? classStats(gm, cls, clsIds, s.gv || 0) : {}), [needAmateur, gm, cls, clsIds.length, s.gv, gm.Y]);
  const last = (id: number) => (am[id] || []).filter((x: any) => x.gp > 0).slice(-1)[0];
  // Where that season was played: the college or club, or just High School.
  const teamOf = (x: any) => (x.level === 'High school' ? 'High School' : x.team);
  const f1 = (x: number, d = 1) => (x == null || !isFinite(x) ? '—' : x.toFixed(d)),
    pct = (m: number, a: number) => (a ? (100 * m) / a : NaN);
  // [label, tooltip, value, decimals]: a column sorts by its value (a prospect with none goes last).
  const TRAD: [string, string, (x: any) => number, number?][] = [
    ['PPG', 'Points per game', x => x.disp.pts / x.disp.gp],
    ['RPG', 'Rebounds per game', x => (x.disp.orb + x.disp.drb) / x.disp.gp],
    ['APG', 'Assists per game', x => x.disp.ast / x.disp.gp],
    ['SPG', 'Steals per game', x => x.disp.stl / x.disp.gp],
    ['BPG', 'Blocks per game', x => x.disp.blk / x.disp.gp],
    ['FG%', 'Field goal %', x => pct(x.disp.fgm, x.disp.fga)],
    ['3P%', 'Three-point %', x => pct(x.disp.tpm, x.disp.tpa)],
    ['FT%', 'Free-throw %', x => pct(x.disp.ftm, x.disp.fta)],
    ['PER', 'Player efficiency rating', x => x.adv?.per],
  ];
  // Advanced stats, a page at a time (‹ ›): every one the game keeps for an amateur season, PER aside (it's with the traditional ones).
  const A = (k: string) => (x: any) => x.adv?.[k];
  const ADV_PAGES: [string, [string, string, (x: any) => number, number?][]][] = [
    [
      'Scoring',
      [
        ['TS%', 'True shooting %', A('tsp')],
        ['eFG%', 'Effective field goal %', A('efg')],
        ['3PAr', 'Share of shots from three', A('tpar'), 3],
        ['FTr', 'Free throws per shot', A('ftr'), 3],
        ['USG%', 'Usage: share of his team’s plays he finishes while on the floor', A('usgp')],
        ['AST%', 'Share of teammates’ baskets he assisted while on the floor', A('astp')],
        ['TOV%', 'Turnovers per 100 plays', A('tovp')],
        ['ORtg', 'Offensive rating: points produced per 100 possessions', A('ortg'), 0],
      ],
    ],
    [
      'Rebounding and defense',
      [
        ['ORB%', 'Offensive rebound %', A('orbp')],
        ['DRB%', 'Defensive rebound %', A('drbp')],
        ['TRB%', 'Total rebound %', A('trbp')],
        ['STL%', 'Steals per 100 opponent possessions', A('stlp')],
        ['BLK%', 'Share of opponents’ twos he blocked', A('blkp')],
        ['DRtg', 'Defensive rating', A('drtg'), 0],
        ['OWS', 'Offensive win shares', A('ows')],
        ['DWS', 'Defensive win shares', A('dws')],
      ],
    ],
    [
      'Impact',
      [
        ['WS', 'Win shares', A('ws')],
        ['WS/40', 'Win shares per 40 minutes', A('ws40'), 3],
        ['OBPM', 'Offensive box plus-minus (the class average is 0)', A('obpm')],
        ['DBPM', 'Defensive box plus-minus', A('dbpm')],
        ['BPM', 'Box plus-minus', A('bpm')],
        ['EWA', 'Estimated wins added', A('ewa')],
        ['EPM', 'EPM estimate (box score: no lineup data for amateurs)', A('epm')],
        ['LEBRON', 'LEBRON estimate (box score)', A('lebron')],
        ['DARKO', 'DARKO estimate (box score)', A('darko')],
      ],
    ],
  ];
  const [advPg, setAdvPg] = useState(0),
    ADV = ADV_PAGES[advPg][1];
  const turn = (d: number) => {
    const n = (advPg + d + ADV_PAGES.length) % ADV_PAGES.length;
    setAdvPg(n);
    setStSort(cur => (cur && ADV_PAGES[n][1].some(c => c[0] === cur[0]) ? cur : null));
  };
  // Minutes come first in both views (2026-10-30): how big a role the numbers came from.
  const MPG: [string, string, (x: any) => number, number?] = ['MPG', 'Minutes per game', x => x.mpg];
  const ST = [MPG, ...(stMode === 'adv' ? ADV : TRAD)],
    pickMode = (m: 'trad' | 'adv') => {
      setStSort(null);
      setStMode(cur => (cur === m ? '' : m));
    };
  const [stSort, setStSort] = useState<[string, number] | null>(null); // a college stat column to sort by (best first), or the board's own sort
  const stVal = (id: number, k: string) => {
    const x = last(id),
      c = ST.find(t => t[0] === k);
    const v = x && c ? c[2](x) : NaN;
    return v == null || !isFinite(v) ? null : v;
  };
  const sortSt = (k: string) => setStSort(cur => (cur && cur[0] === k ? [k, -cur[1]] : [k, -1]));
  const cols = (vm.draftCols || []).filter((c: any) =>
    (stats ? ['rank', 'name', 'age', 'ovr', 'pot'] : ['rank', 'name', 'age', 'hgt', 'ovr', 'pot']).includes(c.key),
  );
  const sf = useSearchFilter({ separateAge: true }),
    rows0 = (vm.draftRows || []).filter(byTrait(vm, tk)).filter(sf.test);
  const boardRows =
      stats && stSort
        ? rows0.slice().sort((a: any, b: any) => {
            const x = stVal(a.id, stSort[0]),
              y = stVal(b.id, stSort[0]);
            return x == null ? (y == null ? 0 : 1) : y == null ? -1 : stSort[1] < 0 ? y - x : x - y;
          })
        : rows0,
    sc = useScoutSelect(
      vm,
      boardRows.map((p: any) => p.id),
    );
  const pg = usePaged<any>(boardRows, 'prospects', 12, cls);
  const previewId = expanded?.cls === cls ? expanded?.id : undefined;
  const preview = previewId == null ? null : pg.rows.find((p: any) => p.id === previewId);
  const report = useMemo(() => (preview ? scoutReport(gm, s, preview.id) : null), [gm, s, preview?.id]);
  const head = (
    <div className="draft-heading">
      <div
        style={{
          display: 'inline-flex',
          border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          flex: 'none',
        }}
      >
        {(vm.dClasses || []).map((sg: any, i: number) => (
          <button
            key={i}
            onClick={sg.onClick}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '6px 14px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              color: sg.color,
              boxShadow: sg.ring,
            }}
          >
            {sg.label}
          </button>
        ))}
      </div>
      {(vm.pastDrafts || []).length > 0 && (
        <select
          className="input"
          value={vm.dr.past ? vm.ctx.s.dClass : ''}
          onChange={e => e.target.value && vm.ctx.gm.setState({ dClass: +e.target.value, adv: {} })}
          style={{ width: 'auto', fontSize: '13px', minHeight: 32 }}
          title="Every draft held in this league: who went where, and how they turned out"
        >
          <option value="">Past drafts…</option>
          {vm.pastDrafts.map((y: number) => (
            <option key={y} value={y}>
              {y} draft
            </option>
          ))}
        </select>
      )}
      <div style={{ flex: '1', color: vm.ctx.s.god ? GOD_PINK : 'var(--color-neutral-700)', fontSize: '12px' }}>{vm.dr.classNote}</div>
      {vm.ctx.s.god && (
        <LoadDraftClass
          gm={vm.ctx.gm}
          year={vm.ctx.s.dClass}
          canLoad={
            vm.ctx.s.dClass > vm.ctx.gm.Y ||
            (vm.ctx.s.dClass === vm.ctx.gm.Y &&
              !(vm.ctx.s.phase === 'draft' ? (vm.ctx.s.pi || 0) > 0 : ['preFA', 'fa', 'preseason'].includes(vm.ctx.s.phase)))
          }
        />
      )}
    </div>
  );
  if (vm.dr.past)
    return (
      <section className="draft-board">
        {head}
        <PastDraft vm={vm} />
      </section>
    );
  const showDraftAction = vm.dr.isCurrent;
  const columnCount = 1 + cols.length + (stats ? ST.length : 0) + (showDraftAction ? 1 : 0);
  const boardHead = (c: any) => (
    <th key={c.key} className={c.key === 'name' ? 'draft-name-cell' : 'draft-number' + (c.key === 'pot' ? ' draft-potential-cell' : '')}>
      <button
        type="button"
        title={'Sort by ' + c.label}
        onClick={() => {
          setStSort(null);
          c.onClick();
        }}
        style={{ color: stats && stSort ? undefined : c.color }}
      >
        {c.label}
        {stats && stSort ? '' : c.arrow}
      </button>
    </th>
  );
  const statHeads =
    stats &&
    ST.map(([h, t]) => (
      <th className="draft-number" key={h} title={t}>
        <button type="button" onClick={() => sortSt(h)} style={{ color: stSort?.[0] === h ? 'var(--color-accent-700)' : undefined }}>
          {h}
          {stSort?.[0] === h ? (stSort[1] < 0 ? ' ↓' : ' ↑') : ''}
        </button>
      </th>
    ));
  return (
    <section className="draft-board" aria-label="Draft board">
      {head}
      <DraftRoomLayout vm={vm}>
        <section className="draft-prospects" aria-label="Prospect workspace">
          {vm.dr.hasAdvice && (
            <div className="draft-advice">
              {(vm.dr.advice || []).map((a: any) => (
                <div key={a.who}>
                  <div className="draft-kicker">{a.who}</div>
                  <button type="button" className="btn btn-ghost" onClick={a.open}>
                    {a.name}
                  </button>
                  <div className="draft-muted">{a.meta}</div>
                  <p>{a.why}</p>
                  {a.canDraft && (
                    <button type="button" className="btn btn-primary" onClick={a.draft}>
                      Draft {a.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="draft-toolbar">
            {vm.dr.isCurrent ? (
              <Seg<'board' | 'mock'>
                value={view}
                options={[
                  ['board', 'Big board'],
                  ['mock', 'Mock drafts'],
                ]}
                onChange={setView}
              />
            ) : (
              <h3>Big board</h3>
            )}
            {vm.dr.isCurrent && (
              <div className="draft-clock-actions">
                <div className="draft-sim-actions" role="group" aria-label="Draft simulation">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={vm.simOne}
                    disabled={s.phase !== 'draft' || vm.dr.done || vm.dr.mineClock}
                  >
                    Sim one pick
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={vm.simToMine} disabled={vm.dr.noSimMine}>
                    Sim to your pick
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setConfirmAutoDraft(true)}
                    disabled={s.phase !== 'draft' || vm.dr.done}
                  >
                    Sim to end of draft
                  </button>
                </div>
                <button type="button" className="btn btn-secondary" onClick={vm.askScouts} disabled={vm.dr.noAdvice}>
                  Ask scouts
                </button>
                <button type="button" className="btn btn-secondary" onClick={vm.askAgm} disabled={vm.dr.noAdvice}>
                  Ask assistant GM
                </button>
              </div>
            )}
          </div>
          {view === 'mock' && vm.dr.isCurrent ? (
            <MockDrafts vm={vm} />
          ) : (
            <>
              <div className="draft-prospect-heading">
                <h2>Available prospects</h2>
                <span className="draft-muted">{boardRows.length} prospects</span>
              </div>
              <div className="draft-view-controls draft-stat-tabs">
                <button
                  type="button"
                  className={!stats ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => setStMode('')}
                  aria-pressed={!stats}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={stMode === 'trad' ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => pickMode('trad')}
                  aria-pressed={stMode === 'trad'}
                >
                  Show traditional stats
                </button>
                <button
                  type="button"
                  className={stMode === 'adv' ? 'btn btn-primary' : 'btn btn-secondary'}
                  onClick={() => pickMode('adv')}
                  aria-pressed={stMode === 'adv'}
                >
                  Show advanced stats
                </button>
                <label className="draft-extra-sort">
                  Sort
                  <select
                    className="input"
                    value=""
                    aria-label="Sort prospects"
                    onChange={e => {
                      const c = (vm.draftCols || []).find((c: any) => c.key === e.target.value);
                      if (c) {
                        setStSort(null);
                        c.onClick();
                      }
                    }}
                  >
                    <option value="">Choose column…</option>
                    {(vm.draftCols || []).map((c: any) => (
                      <option key={c.key} value={c.key}>
                        {c.label}
                        {c.arrow}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {stMode === 'adv' && (
                <div className="draft-stat-group" role="group" aria-label="Advanced stat group">
                  <button type="button" className="btn btn-ghost" aria-label="Previous stat group" onClick={() => turn(-1)}>
                    ‹
                  </button>
                  <span role="status" aria-live="polite">
                    {ADV_PAGES[advPg][0]}
                    <small>
                      {advPg + 1} / {ADV_PAGES.length}
                    </small>
                  </span>
                  <button type="button" className="btn btn-ghost" aria-label="Next stat group" onClick={() => turn(1)}>
                    ›
                  </button>
                </div>
              )}
              <div className="draft-age-filter">{sf.age}</div>
              <details className="draft-filters">
                <summary>Other filters{sf.otherActive || tk ? ' · active' : ''}</summary>
                <div className="draft-view-controls">
                  <TraitFilter value={tk} onChange={setTk} />
                </div>
                {sf.bar}
              </details>
              {sc.bar(true)}
              {sc.Menu()}
              <div className="draft-table-wrap">
                <table className="table draft-table" aria-label="Draft prospects">
                  <thead>
                    <tr>
                      {sc.head()}
                      {cols.map((c: any) => (
                        <Fragment key={c.key}>
                          {boardHead(c)}
                          {c.key === 'age' && statHeads}
                        </Fragment>
                      ))}
                      {showDraftAction && <th className="draft-action-cell">Draft</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {pg.rows.map((p: any) => {
                      const opened = preview?.id === p.id;
                      const x = last(p.id);
                      return (
                        <Fragment key={p.id}>
                          <tr
                            {...sc.row(p.id)}
                            data-prospect-id={p.id}
                            className={'draft-player-row' + (opened ? ' draft-previewed' : '')}
                            style={{ background: sc.isSel(p.id) && !opened ? 'var(--color-accent-100)' : undefined }}
                            onClick={e => {
                              if (
                                e.shiftKey ||
                                e.ctrlKey ||
                                e.metaKey ||
                                (e.target as HTMLElement).closest('a, button, input, select, textarea, label')
                              )
                                return;
                              setExpanded({ cls, id: p.id });
                            }}
                          >
                            {sc.cell(p.id)}
                            <td className="draft-number draft-muted">{p.rank}</td>
                            <td className="draft-name-cell">
                              <div className="draft-prospect-identity">
                                <span className="draft-prospect-face" aria-hidden="true">
                                  {gm.faceEl(p.id, -1)}
                                </span>
                                <div className="draft-prospect-name">
                                  <button
                                    id={'draft-name-' + p.id}
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ ...PN, padding: 0 }}
                                    onClick={p.open}
                                    data-pid={p.id}
                                  >
                                    {p.name}
                                  </button>{' '}
                                  {sc.tag(p.id)}
                                  <div className="draft-player-meta">
                                    {p.pos} · {stats && x ? teamOf(x) : p.fromT}
                                    <img
                                      src={p.flag}
                                      alt={p.cname}
                                      title={p.cname}
                                      style={{ width: 14, height: 10, objectFit: 'cover', marginLeft: 6 }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="draft-number" data-label="Age">
                              {p.age}
                            </td>
                            {stats ? (
                              ST.map(([h, , fn, dg]) => (
                                <td key={h} className="draft-number" style={{ fontWeight: stSort?.[0] === h ? 600 : undefined }}>
                                  {x ? f1(fn(x), dg ?? 1) : '—'}
                                </td>
                              ))
                            ) : (
                              <td className="draft-number">{p.hgt}</td>
                            )}
                            <td className="draft-number" style={{ color: p.tone, fontWeight: 600 }}>
                              {p.ovrS}
                            </td>
                            <td className="draft-number draft-potential-cell" style={{ color: p.ptone, fontWeight: 600 }}>
                              {p.potS}
                              <button
                                type="button"
                                className="btn btn-ghost draft-row-toggle"
                                aria-expanded={opened}
                                aria-controls={'draft-card-' + cls + '-' + p.id}
                                aria-label={(opened ? 'Collapse' : 'Expand') + ' scouting card for ' + p.name}
                                title={(opened ? 'Collapse' : 'Expand') + ' scouting card'}
                                onClick={() => setExpanded(opened ? null : { cls, id: p.id })}
                              >
                                {opened ? <ChevronUp size={18} aria-hidden="true" /> : <ChevronDown size={18} aria-hidden="true" />}
                              </button>
                            </td>
                            {showDraftAction && (
                              <td className="draft-action-cell">
                                <button
                                  type="button"
                                  className="btn btn-primary draft-row-draft"
                                  disabled={p.cant}
                                  aria-label={'Draft ' + p.name}
                                  title={p.cant ? 'Available when it is your turn to pick' : 'Draft ' + p.name}
                                  onClick={event => {
                                    event.stopPropagation();
                                    p.draft();
                                  }}
                                >
                                  Draft player
                                </button>
                              </td>
                            )}
                          </tr>
                          {opened && report && (
                            <tr className="draft-card-row">
                              <td colSpan={columnCount}>
                                <div id={'draft-card-' + cls + '-' + p.id} role="region" aria-label={p.name + ' prospect card'}>
                                  <DraftProspectCard
                                    vm={vm}
                                    player={p}
                                    report={report}
                                    season={x}
                                    advanced={stMode === 'adv'}
                                    values={(stats ? ST : [MPG, ...TRAD]).map(([label, description, fn, dg]) => ({
                                      label,
                                      description,
                                      value: x ? f1(fn(x), dg ?? 1) : '—',
                                    }))}
                                    onShortlist={sc.onContext(p.id)}
                                    onCollapse={() => {
                                      setExpanded(null);
                                      document.getElementById('draft-name-' + p.id)?.focus({ preventScroll: true });
                                    }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {stMode === 'adv' && advPg === 2 && (
                <p className="draft-board-note">EPM, LEBRON and DARKO are box-score estimates for amateur seasons.</p>
              )}
              <p className="draft-board-note">
                Click a player’s row or its corner arrow to open his prospect card. Names open full profiles. Use checkboxes or
                drag/shift-click to scout or shortlist several players.
              </p>
              {pg.pager}
            </>
          )}
        </section>
      </DraftRoomLayout>
      {confirmAutoDraft && (
        <dialog
          ref={autoDraftDialog}
          className="dialog draft-auto-confirm"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="draft-auto-confirm-question"
          onCancel={() => setConfirmAutoDraft(false)}
        >
          <h2 className="dialog-title" id="draft-auto-confirm-question">
            Are you sure you want to let the AI draft for you?
          </h2>
          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" autoFocus onClick={() => setConfirmAutoDraft(false)}>
              No
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={s.phase !== 'draft' || !vm.dr.isCurrent || vm.dr.done}
              onClick={() => {
                setConfirmAutoDraft(false);
                vm.simAll();
              }}
            >
              Yes
            </button>
          </div>
        </dialog>
      )}
    </section>
  );
}

// A past draft: every pick in order, who made it, how he rated that night, how his game carried
// over at his first camp, and how he's turned out (rating now, career numbers, where he is).
function PastDraft({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx,
    P = gm.db.P,
    year = s.dClass,
    [sortK, setSortK] = useState<'n' | 'now' | 'pts'>('n');
  const used = Object.entries((gm.db as any).pickUsed || {})
    .filter(([k]) => k.startsWith(year + '-'))
    .map(([k, v]: any) => ({ ...v, rd: +k.split('-')[1], orig: +k.split('-')[2] }));
  const career = (p: any) => {
    const rows = (p.stats || []).filter((r: any) => !r.po),
      g = rows.reduce((a: number, r: any) => a + (r.gp || 0), 0),
      sum = (k: string) => rows.reduce((a: number, r: any) => a + (r[k] || 0), 0);
    return {
      g,
      pts: g ? sum('pts') / g : 0,
      reb: g ? (sum('orb') + sum('drb')) / g : 0,
      ast: g ? sum('ast') / g : 0,
      seasons: new Set(rows.map((r: any) => r.season)).size,
    };
  };
  const where = (p: any) => {
    if (p.retired) return p.gone ? 'Left the league' : 'Retired' + (p.retired.season ? ' (' + p.retired.season + ')' : '');
    const t = gm.tidOf(s.rosters, p.id);
    if (t >= 0) return T[t].abbr;
    if ((s.overseas || []).includes(p.id)) return 'Overseas';
    if ((s.fa || []).includes(p.id)) return 'Free agent';
    return '—';
  };
  const rows = used
    .map(u => {
      const p = P[u.pid] || { name: '?', id: u.pid },
        c = career(p);
      return { u, p, c, now: p.retired || p.gone ? -1 : (p.ovr ?? -1) };
    })
    .sort((a, b) =>
      sortK === 'now'
        ? b.now - a.now
        : sortK === 'pts'
          ? b.c.pts * Math.min(1, b.c.g / 40) - a.c.pts * Math.min(1, a.c.g / 40)
          : a.u.n - b.u.n,
    );
  if (!rows.length) return <p style={{ ...muted }}>No picks were recorded for the {year} draft.</p>;
  const active = rows.filter(r => r.now >= 0),
    best = active.slice().sort((a, b) => b.now - a.now)[0],
    steal = active.filter(r => r.u.n > 14).sort((a, b) => b.now - a.now)[0];
  const th = (k: typeof sortK | null, label: string, right = false) => (
    <th
      style={{
        padding: '6px 8px',
        textAlign: right ? 'right' : 'left',
        cursor: k ? 'pointer' : undefined,
        color: k && sortK === k ? 'var(--color-accent-700)' : undefined,
        whiteSpace: 'nowrap',
      }}
      onClick={k ? () => setSortK(k) : undefined}
    >
      {label}
    </th>
  );
  return (
    <section>
      <p style={{ margin: '0 0 10px', fontSize: '13px' }}>
        {best && (
          <>
            Best of the class so far:{' '}
            <button
              className="hv1"
              onClick={() => open(best.p.id)}
              data-pid={best.p.id}
              style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}
            >
              {best.p.name}
            </button>{' '}
            (#{best.u.n}, now {best.now}).{' '}
          </>
        )}
        {steal && steal !== best && (
          <>
            Biggest steal:{' '}
            <button
              className="hv1"
              onClick={() => open(steal.p.id)}
              data-pid={steal.p.id}
              style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}
            >
              {steal.p.name}
            </button>{' '}
            (#{steal.u.n}, now {steal.now}).
          </>
        )}
      </p>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            {th('n', 'Pick', true)}
            {th(null, 'Team')}
            {th(null, 'Player')}
            {th(null, 'From')}
            {th(null, 'Draft night', true)}
            {th(null, 'First camp', true)}
            {th('now', 'Now', true)}
            {th('pts', 'Career', true)}
            {th(null, 'Where now')}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ u, p, c, now }) => (
            <tr
              key={u.n}
              style={{ background: gm.isUser(s, u.tid) ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : undefined }}
            >
              <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '16px' }}>
                {u.n}
                {u.rd === 2 && <span style={{ ...muted, fontSize: '10.5px' }}> (2nd)</span>}
              </td>
              <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                  {logo(u.tid, 16)}
                  <button className="hv4" onClick={() => openTeam(u.tid)} style={{ all: 'unset', cursor: 'pointer' }}>
                    {T[u.tid]?.abbr}
                  </button>
                  {u.orig !== u.tid && T[u.orig] && <span style={{ ...muted, fontSize: '11px' }}>via {T[u.orig].abbr}</span>}
                </span>
              </td>
              <td style={{ padding: '5px 8px' }}>
                <button
                  className="hv1"
                  onClick={() => open(p.id)}
                  data-pid={p.id}
                  title={p.name}
                  style={{ all: 'unset', cursor: 'pointer', fontWeight: 600, ...PN }}
                >
                  {p.name}
                </button>{' '}
                <span style={{ ...muted, fontSize: '11.5px' }}>{p.pos}</span>
              </td>
              <td style={{ padding: '5px 8px', fontSize: '12px', ...muted }}>{p.from?.team || ''}</td>
              <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {u.ovr != null ? u.ovr + ' / ' + u.pot : '—'}
              </td>
              <td
                style={{
                  padding: '5px 8px',
                  textAlign: 'right',
                  whiteSpace: 'nowrap',
                  color: p.dxDone
                    ? p.dxDone.to > p.dxDone.from + 2
                      ? 'var(--gm-good)'
                      : p.dxDone.to < p.dxDone.from - 2
                        ? 'var(--gm-bad)'
                        : undefined
                    : undefined,
                }}
                title={
                  p.dxDone
                    ? 'At his first NBA camp his game carried over ' +
                      (p.dxDone.to - p.dxDone.from >= 0 ? '+' : '') +
                      (p.dxDone.to - p.dxDone.from)
                    : 'Not in an NBA camp yet'
                }
              >
                {p.dxDone ? p.dxDone.from + ' → ' + p.dxDone.to : '—'}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {now >= 0 ? now + ' / ' + p.pot : '—'}
              </td>
              <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {c.g ? (
                  c.g + ' G · ' + c.pts.toFixed(1) + ' / ' + c.reb.toFixed(1) + ' / ' + c.ast.toFixed(1)
                ) : (
                  <span style={muted}>no games</span>
                )}
              </td>
              <td style={{ padding: '5px 8px', fontSize: '12.5px' }}>{where(p)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ ...muted, fontSize: '11.5px', marginTop: 6 }}>
        Draft night is how he rated then (true ratings, before camp). First camp is how his game carried over to the NBA. Career is points /
        rebounds / assists per game in the regular season. Click Pick, Now or Career to sort.
      </p>
    </section>
  );
}
