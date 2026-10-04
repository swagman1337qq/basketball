// Spectator Mode's dashboard: the league at a glance while the AI runs every team. The sim controls,
// the champion, both conferences' standings with the playoff and play-in lines, the leaders, who's
// hurt, the latest moves and every champion so far; and the way back to running a team.
import { useMemo } from 'react';
import type { VM } from '../vm';
import { Kicker, Link, muted } from '../kit';
import { leaderBoards } from '../../engine/leaders';

const card = { border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)', padding: '12px 14px' } as const;
const BOARDS = [{ id: 'pts', k: 'pts' }, { id: 'trb', k: 'trb' }, { id: 'ast', k: 'ast' }, { id: 'stl', k: 'stl' }, { id: 'blk', k: 'blk' }];
const BOARD_LABEL: Record<string, string> = { pts: 'Points', trb: 'Rebounds', ast: 'Assists', stl: 'Steals', blk: 'Blocks' };
const MOVES = new Set(['Trade', 'Signing', 'Release', 'Draft', 'Career', 'Team']);

export function SpectatorDashboard({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx, P = gm.db.P, spec = vm.spec, G: any = gm;
  const started = T.some((t: any) => t.w + t.l > 0), y = started ? gm.Y : gm.Y - 1;
  const boards = useMemo(() => (y >= (gm.db.firstSeason || 2027) ? leaderBoards(gm, s, y, 'pg', BOARDS as any, 5) : {}), [y, s.day, s.phase]);
  const byPct = (a: any, b: any) => gm.pct(b) - gm.pct(a) || b.w - a.w;
  const confs = ['East', 'West'].map(c => ({ c, rows: T.filter((t: any) => t.conf === c).sort(byPct) }));
  const injured = Object.keys(s.rosters).flatMap(k => (s.rosters[k] || []).map((id: number) => ({ id, tid: +k }))).filter(x => P[x.id]?.inj && !P[x.id].inj.dtd)
    .map(x => ({ ...x, p: P[x.id], left: G.injLeft?.(P[x.id], s)?.games ?? 0 })).sort((a, b) => b.left - a.left || b.p.ovr - a.p.ovr).slice(0, 12);
  const moves = (s.lgLog || []).filter((e: any) => MOVES.has(e.type)).slice(0, 14);
  const champ = s.phase === 'playoffs' && s.po?.champ != null ? s.po.champ : null, hist = s.history || [];
  const fmvp = champ != null && hist[0]?.year === gm.Y && hist[0].fmvp != null ? { pid: hist[0].fmvp } : null;
  return (
    <>
      <section style={{ ...card, marginBottom: '18px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <Kicker accent>Spectator Mode</Kicker>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', lineHeight: 1.15, margin: '2px 0 4px' }}>The AI runs all {T.length} teams</div>
          <div style={{ ...muted, fontSize: '12.5px' }}>Every roster, trade, signing, draft pick and lineup is the AI's, with nothing stopping to ask you. Sim as far as you like from the season bar or below; Stop pauses at any moment, and you can take over any team.</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch', minWidth: '210px' }}>
          {spec.running
            ? <><div style={{ fontSize: '13px' }}>{spec.label}…</div><button className="btn btn-secondary" onClick={spec.stop}>■ Stop</button></>
            : <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{(spec.actions || []).slice(0, 3).map((a: any, i: number) => <button key={i} className={'btn ' + (i === 0 ? 'btn-primary' : 'btn-secondary')} disabled={a.dis} onClick={a.go} style={{ fontSize: '12.5px' }}>{a.label}</button>)}</div>}
          <button className="btn btn-ghost" onClick={spec.pick} disabled={spec.running} style={{ fontSize: '12.5px' }}>Manage a team…</button>
        </div>
      </section>

      {champ != null && (
        <section style={{ ...card, marginBottom: '18px', display: 'flex', gap: '14px', alignItems: 'center', borderColor: 'var(--color-accent)' }}>
          {logo(champ, 48)}
          <div><Kicker accent>{gm.seasonLbl()} champions</Kicker>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', lineHeight: 1.1 }}><Link onClick={() => openTeam(champ)}>{T[champ].region} {T[champ].name}</Link></div>
            <div style={{ ...muted, fontSize: '12.5px' }}>Beat the {T[s.po.runner].region} {T[s.po.runner].name} in the Finals{fmvp ? <> · Finals MVP <Link onClick={() => open(fmvp.pid)}>{P[fmvp.pid]?.name}</Link></> : null}</div></div>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginBottom: '18px' }}>
        {confs.map(({ c, rows }) => (
          <section key={c} style={card}>
            <Kicker>{c}ern Conference</Kicker>
            <table className="table" style={{ fontSize: '12.5px', width: '100%' }}><tbody>
              {rows.map((t: any, i: number) => (
                <tr key={t.tid} style={{ borderTop: i === 6 || i === 10 ? '2px solid var(--color-divider)' : undefined }}>
                  <td style={{ width: 22, ...muted }}>{i + 1}</td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{logo(t.tid, 16)}<Link onClick={() => openTeam(t.tid)}>{t.region} {t.name}</Link></span></td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{t.w}–{t.l}</td>
                  <td style={{ textAlign: 'right', width: 70, fontSize: '11px', ...muted }}>{i < 6 ? 'playoffs' : i < 10 ? 'play-in' : ''}</td>
                </tr>))}
            </tbody></table>
          </section>))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginBottom: '18px' }}>
        <section style={card}>
          <Kicker>League leaders{y !== gm.Y ? ' · ' + (y - 1) + '–' + String(y).slice(2) : ''}</Kicker>
          {!Object.keys(boards).length ? <p style={{ ...muted, fontSize: '12.5px' }}>Leaders appear once games are played.</p> :
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px 16px' }}>
              {BOARDS.map(b => (
                <div key={b.id}><div style={{ fontSize: '11px', fontWeight: 600, marginBottom: 2 }}>{BOARD_LABEL[b.id]}</div>
                  {((boards as any)[b.id] || []).map((r: any) => <div key={r.pid} style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: '12px' }}><Link onClick={() => open(r.pid)} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{P[r.pid]?.name}</Link><span>{r.v.toFixed(1)}</span></div>)}
                </div>))}
            </div>}
          <div style={{ marginTop: 8 }}><Link onClick={() => gm.setState({ screen: 'leaders' })}>All leaders →</Link> · <Link onClick={() => gm.setState({ screen: 'awards' })}>Awards →</Link> · <Link onClick={() => gm.setState({ screen: 'stats' })}>Stats →</Link></div>
        </section>
        <section style={card}>
          <Kicker>Injuries</Kicker>
          {!injured.length ? <p style={{ ...muted, fontSize: '12.5px' }}>Nobody is out right now.</p> :
            <table className="table" style={{ fontSize: '12px', width: '100%' }}><tbody>
              {injured.map(x => <tr key={x.id}><td><Link onClick={() => open(x.id)}>{x.p.name}</Link> <span style={muted}>{T[x.tid].abbr}</span></td><td style={muted}>{x.p.inj.name}</td><td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{gm.injText(x.p, true)}</td></tr>)}
            </tbody></table>}
        </section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
        <section style={card}>
          <Kicker>Latest moves</Kicker>
          {!moves.length ? <p style={{ ...muted, fontSize: '12.5px' }}>No moves yet.</p> :
            moves.map((e: any, i: number) => <div key={i} style={{ fontSize: '12px', padding: '3px 0', borderTop: i ? '1px solid var(--color-divider)' : undefined }}><span style={{ ...muted, marginRight: 6 }}>{e.type}</span>{e.text}</div>)}
          <div style={{ marginTop: 8 }}><Link onClick={() => gm.setState({ screen: 'tx' })}>All transactions →</Link> · <Link onClick={() => gm.setState({ screen: 'draft' })}>Draft →</Link></div>
        </section>
        <section style={card}>
          <Kicker>Champions</Kicker>
          {!hist.length ? <p style={{ ...muted, fontSize: '12.5px' }}>No champion crowned yet in this league.</p> :
            <table className="table" style={{ fontSize: '12.5px', width: '100%' }}><tbody>
              {hist.slice(0, 12).map((h: any) => <tr key={h.season}><td style={{ whiteSpace: 'nowrap', ...muted }}>{h.season}</td><td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{logo(h.champ, 16)}<Link onClick={() => openTeam(h.champ)}>{T[h.champ].region} {T[h.champ].name}</Link></span></td><td style={{ ...muted, textAlign: 'right' }}>over {T[h.runner].abbr}</td></tr>)}
            </tbody></table>}
          <div style={{ marginTop: 8 }}><Link onClick={() => gm.setState({ screen: 'playoffs' })}>Playoffs →</Link> · <Link onClick={() => gm.setState({ screen: 'standings' })}>Standings →</Link> · <Link onClick={() => gm.setState({ screen: 'hof' })}>Hall of Fame →</Link></div>
        </section>
      </div>
    </>
  );
}

// Pick the team to run: Spectator Mode ends and you're its GM from this moment.
export function SpectatorPicker({ vm }: { vm: VM }) {
  const { gm, s, T, logo } = vm.ctx;
  const close = () => gm.setState({ specPick: false });
  const rows = T.slice().sort((a: any, b: any) => (a.region + a.name).localeCompare(b.region + b.name));
  return (
    <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--color-bg)', borderRadius: 'var(--radius-md)', maxWidth: 760, width: '100%', maxHeight: '85vh', overflowY: 'auto', padding: '16px 18px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', flex: 1 }}>Manage a team</div>
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
        </div>
        <p style={{ ...muted, fontSize: '12.5px', margin: '0 0 10px' }}>Spectator Mode ends and you take over as GM, right where the season is ({gm.seasonLbl()} {s.phase === 'regular' ? 'regular season' : s.phase === 'fa' ? 'free agency' : s.phase}). Everything the AI did stays. You can go back to spectating from Settings.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
          {rows.map((t: any) => (
            <button key={t.tid} className="hv2" onClick={() => { gm.manageTeam(t.tid); }} style={{ all: 'unset', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
              {logo(t.tid, 26)}<span style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: 600, fontSize: '13px' }}>{t.region} {t.name}</span><span style={{ ...muted, fontSize: '11.5px' }}>{t.w}–{t.l} · {t.conf}</span></span>
            </button>))}
        </div>
      </div>
    </div>
  );
}
