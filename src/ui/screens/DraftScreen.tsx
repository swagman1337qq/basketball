import type { VM } from '../vm';
import { GOD_PINK } from '../kit';
import { useState } from 'react';
import { TraitFilter, byTrait } from '../TraitFilter';
import { muted, Seg, usePaged } from '../kit';
import { MockDrafts } from './MockDrafts';
import { useScoutSelect } from '../ScoutSelect';

// Small buttons on each pick: trade for it / trade it, or open a trade with its owner.
const pickBtn = { fontSize: "11px", padding: "2px 8px", minHeight: 0, lineHeight: 1.5 } as const;

export function DraftScreen({ vm }: { vm: VM }) {
  const [tk, setTk] = useState(''), [view, setView] = useState<'board' | 'mock'>('board');
  const boardRows = (vm.draftRows || []).filter(byTrait(vm, tk)), sc = useScoutSelect(vm, boardRows.map((p: any) => p.id));
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", padding: "10px 14px", border: vm.dr.mineClock ? "3px solid var(--gm-good)" : "1px solid var(--color-accent)", borderRadius: "var(--radius-md)", background: vm.dr.mineClock ? "color-mix(in srgb, var(--gm-good) 10%, transparent)" : undefined }}>
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
                <div key={i} ref={o.onClock ? (el => { const box = el?.parentElement; if (el && box && box.dataset.at !== String(o.n)) { box.dataset.at = String(o.n); box.scrollTop = el.offsetTop - box.offsetTop - 90; } }) : undefined} style={{ display: "grid", gridTemplateColumns: "30px 30px minmax(0,1fr)", gap: "10px", alignItems: "center", padding: "8px 10px", borderRadius: "var(--radius-md)", border: o.onClock && o.mine ? "3px solid var(--gm-good)" : o.onClock ? "2px solid var(--color-accent)" : o.mine ? "2px solid var(--color-accent)" : "1px solid var(--color-divider)", borderLeft: o.onClock && o.mine ? "8px solid var(--gm-good)" : o.mine ? "6px solid var(--color-accent)" : undefined, background: o.onClock && o.mine ? "color-mix(in srgb, var(--gm-good) 16%, transparent)" : o.onClock ? "var(--color-accent-100)" : o.mine ? "color-mix(in srgb, var(--color-accent) 18%, transparent)" : "transparent", boxShadow: o.mine ? "0 0 0 1px color-mix(in srgb, var(--color-accent) 40%, transparent), 0 2px 10px color-mix(in srgb, var(--color-accent) 25%, transparent)" : undefined }}>
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
          <div style={{ display: "flex", gap: "10px", alignItems: "center", margin: "0 0 8px" }}><TraitFilter value={tk} onChange={setTk} /></div>
          {sc.bar()}{sc.Menu()}
          <table className="table" style={{ fontSize: "13px" }}>
            <thead>
              <tr>
                {sc.head()}
                {(vm.draftCols || []).map((c: any, i: number) => (
                  <th key={i} onClick={c.onClick} style={{ padding: "6px 8px", textAlign: c.align, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", color: c.color }}>
                    {c.label}{c.arrow}
                  </th>
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
                      <button className="hv6" onClick={p.open} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
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
                  <td style={{ padding: "4px 8px" }}>
                    {p.fromT}{" "}
                    <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                      {p.fromL}
                    </span>
                  </td>
                  <td style={{ padding: "4px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {p.hgt}
                  </td>
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
        {best && <>Best of the class so far: <button className="hv1" onClick={() => open(best.p.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>{best.p.name}</button> (#{best.u.n}, now {best.now}). </>}
        {steal && steal !== best && <>Biggest steal: <button className="hv1" onClick={() => open(steal.p.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>{steal.p.name}</button> (#{steal.u.n}, now {steal.now}).</>}
      </p>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead><tr>{th('n', 'Pick', true)}{th(null, 'Team')}{th(null, 'Player')}{th(null, 'From')}{th(null, 'Draft night', true)}{th(null, 'First camp', true)}{th('now', 'Now', true)}{th('pts', 'Career', true)}{th(null, 'Where now')}</tr></thead>
        <tbody>{rows.map(({ u, p, c, now }) => (
          <tr key={u.n} style={{ background: gm.isUser(s, u.tid) ? 'color-mix(in srgb, var(--color-accent) 8%, transparent)' : undefined }}>
            <td style={{ padding: '5px 8px', textAlign: 'right', fontFamily: 'var(--font-heading)', fontSize: '16px' }}>{u.n}{u.rd === 2 && <span style={{ ...muted, fontSize: '10.5px' }}> (2nd)</span>}</td>
            <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}><span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>{logo(u.tid, 16)}<button className="hv4" onClick={() => openTeam(u.tid)} style={{ all: 'unset', cursor: 'pointer' }}>{T[u.tid]?.abbr}</button>{u.orig !== u.tid && T[u.orig] && <span style={{ ...muted, fontSize: '11px' }}>via {T[u.orig].abbr}</span>}</span></td>
            <td style={{ padding: '5px 8px' }}><button className="hv1" onClick={() => open(p.id)} style={{ all: 'unset', cursor: 'pointer', fontWeight: 600 }}>{p.name}</button> <span style={{ ...muted, fontSize: '11.5px' }}>{p.pos}</span></td>
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
