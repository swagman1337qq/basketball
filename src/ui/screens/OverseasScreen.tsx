// Overseas market: drafted (or declared-and-undrafted) players abroad, with their stats,
// a league-strength translation to the NBA, and buyout negotiations with their clubs.
import { useState } from 'react';
import type { VM } from '../vm';
import { BUYOUT_EXEMPT, leagueStr, negotiateBuyout, translation } from '../../engine/overseas';
import { Link, muted, td, th } from '../kit';

export function OverseasScreen({ vm }: { vm: VM }) {
  const { gm, s, open, money } = vm.ctx;
  const P = gm.db.P;
  const [neg, setNeg] = useState<{ pid: number; offer: number; pick: boolean; msg?: string } | null>(null);
  const rows = (vm.ovRows || []) as any[];
  return (
    <>
      <p style={{ margin: '0 0 6px', ...muted }}>
        Only players who were drafted, or declared and went undrafted, appear here; prospects who never declared go through the draft. Heavy minutes abroad grow a player’s hidden confidence and skills.
      </p>
      <p style={{ margin: '0 0 14px', ...muted, fontSize: '12px' }}>
        Returning players go through a league adjustment period of about 15 games (shorter for confident players), cut faster by 24+ minute nights and a Coaching budget of $25M or more. Up to {money(BUYOUT_EXEMPT)} of a buyout is exempt; the rest counts against your cap.
      </p>
      <table className="table" style={{ fontSize: '13px' }}>
        <thead>
          <tr><th style={th()}>Player</th><th style={th()}>Club · league strength</th><th style={th()}>Abroad this season</th><th style={th()}>Projected NBA translation</th><th style={th('right')}>Rating</th><th style={th()}>Contract</th><th style={th('right')}>Asking</th><th style={th()}></th></tr>
        </thead>
        <tbody>
          {rows.map(r => { const p = P[r.id], a = p.abroad, tr = translation(gm, s, p), buy = a.clause === 'Buyout', walked = a.walked === gm.Y; return (
            <tr key={r.id}>
              <td style={td()}>
                <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  <img src={r.flag} alt="" style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }} />
                  <Link onClick={() => open(r.id)} style={{ color: 'var(--color-accent-700)' }}>{r.name}</Link>
                  <span style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>{r.pos} · {r.age} · {r.drafted}</span>
                </span>
                {p.overseasArc?.from && <div style={{ fontSize: '11px', color: 'var(--gm-good)' }}>Redemption arc: left {p.overseasArc.from} in {p.overseasArc.left} at {p.overseasArc.ovr}</div>}
              </td>
              <td style={td()}>{r.club} <div style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>{r.lg} · {r.clubC} · ×{leagueStr(a.lg).toFixed(2)}</div></td>
              <td style={td('left', { fontSize: '12px' })}>{r.line}</td>
              <td style={td('left', { fontSize: '12px' })}>{tr.pts} pts · {tr.reb} reb · {tr.ast} ast<div style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>in ~20 minutes</div></td>
              <td style={td('right', { fontWeight: 600 })}>{tr.lo}–{tr.hi}<div style={{ fontSize: '11px', fontWeight: 400, color: 'var(--color-neutral-600)' }}>±{tr.margin}</div></td>
              <td style={td('left', { fontSize: '12px' })}>{a.clause}: {money(a.fee)}<div style={{ color: 'var(--color-neutral-600)' }}>{a.fee > BUYOUT_EXEMPT ? money(a.fee - BUYOUT_EXEMPT) + ' counts against the cap' : 'No cap hit'}</div></td>
              <td style={td('right')}>{r.ask}</td>
              <td style={td('right')}>
                {buy ? (
                  <button className="btn btn-secondary" disabled={walked} onClick={() => setNeg({ pid: r.id, offer: +(a.fee * 0.7).toFixed(2), pick: false })} style={{ fontSize: '12px', padding: '3px 10px', whiteSpace: 'nowrap' }}>{walked ? 'Talks ended' : 'Negotiate buyout'}</button>
                ) : (
                  <button className="btn btn-primary" onClick={r.sign} disabled={r.cant} style={{ fontSize: '12px', padding: '3px 12px' }}>Sign</button>
                )}
              </td>
            </tr>
          ); })}
        </tbody>
      </table>
      {neg && (() => { const p = P[neg.pid], a = p.abroad; if (!a) return null; return (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'color-mix(in srgb, var(--color-neutral-900) 45%, transparent)', zIndex: 20 }} onClick={() => setNeg(null)}>
          <div className="dialog" onClick={e => e.stopPropagation()}>
            <div className="dialog-title">Buyout talks with {a.club}</div>
            <div className="dialog-body">
              {p.name}’s contract has a buyout. The club is asking {money(a.fee)}. Make an offer; you can sweeten it with a second-round pick. Three rejected offers and they walk away for the season.
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0 6px' }}>
                <input type="range" min={0.1} max={Math.max(0.2, a.fee)} step={0.05} value={neg.offer} onChange={e => setNeg({ ...neg, offer: +e.target.value, msg: undefined })} style={{ flex: 1 }} />
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', minWidth: '70px', textAlign: 'right' }}>{money(neg.offer)}</span>
              </div>
              <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12.5px' }}><input type="checkbox" checked={neg.pick} onChange={e => setNeg({ ...neg, pick: e.target.checked })} /> Include a second-round pick</label>
              <div style={{ fontSize: '12px', ...muted, marginTop: '6px' }}>Cap hit from this buyout: {neg.offer > BUYOUT_EXEMPT ? money(neg.offer - BUYOUT_EXEMPT) : 'none'}</div>
              {neg.msg && <div style={{ marginTop: '8px', fontWeight: 600 }}>{neg.msg}</div>}
            </div>
            <div className="dialog-actions">
              <button className="btn btn-secondary" onClick={() => setNeg(null)}>Close</button>
              {a.clause === 'Buyout' && a.walked !== gm.Y && <button className="btn btn-primary" onClick={() => { const r = negotiateBuyout(gm, neg.pid, neg.offer, neg.pick); setNeg({ ...neg, msg: r?.msg }); }}>Make offer</button>}
            </div>
          </div>
        </div>
      ); })()}
    </>
  );
}
