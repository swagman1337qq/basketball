// Season awards: individual honors with the top of the voting, and the All-League teams.
import { useState } from 'react';
import type { VM } from '../vm';
import { h4Style, Kicker, Link, muted, Seg } from '../kit';
import { awardDefs, runVote, VOTERS } from '../../engine/awards';

const INDIV: [string, string][] = [['mvp', 'Most Valuable Player'], ['dpoy', 'Defensive Player of the Year'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man of the Year'], ['mip', 'Most Improved Player']];

export function AwardsScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open, openTeam } = vm.ctx;
  const P = gm.db.P;
  const seasons = Object.keys(s.awards || {}).map(Number).sort((a, b) => b - a);
  const [pick, setPick] = useState<number | null>(null);
  const [openV, setOpenV] = useState<Record<string, boolean>>({});
  const yr = pick && seasons.includes(pick) ? pick : seasons[0];
  if (!yr) return <p style={{ ...muted, fontStyle: 'italic' }}>Awards are voted when the regular season ends. Finish the {gm.seasonLbl()} regular season to see the first winners.</p>;
  const a = s.awards[yr], defs = awardDefs(s);
  const lbl = y => y - 1 + '–' + String(y).slice(2);
  // The full vote: first-place votes, points and share (older seasons are re-voted from their stored scores).
  const Voting = ({ list, k, name }: { list: any[]; k: string; name: (x: any) => any }) => {
    const rows = list.length && list[0].pts == null && list[0].score != null ? runVote<any>(list, k, yr) : list, max = rows[0]?.pts || 1;
    if (!rows.length || rows[0].pts == null) return <div style={{ ...muted, fontSize: '12px' }}>No vote recorded.</div>;
    return (
      <table className="table" style={{ fontSize: '12px', marginTop: 4 }}>
        <thead><tr><th style={{ padding: '3px 6px' }}>#</th><th style={{ padding: '3px 6px' }}>Candidate</th><th style={{ padding: '3px 6px', textAlign: 'right' }} title={'First-place votes (of ' + VOTERS + ')'}>1st</th><th style={{ padding: '3px 6px', textAlign: 'right' }}>Pts</th><th style={{ padding: '3px 6px' }}>Share</th></tr></thead>
        <tbody>{rows.map((x, i) => (
          <tr key={i}><td style={{ padding: '3px 6px', color: 'var(--color-neutral-600)' }}>{i + 1}</td><td style={{ padding: '3px 6px' }}>{name(x)}</td><td style={{ padding: '3px 6px', textAlign: 'right' }}>{x.first}</td><td style={{ padding: '3px 6px', textAlign: 'right', fontWeight: i === 0 ? 600 : 400 }}>{x.pts}</td>
            <td style={{ padding: '3px 6px', minWidth: 90 }}><div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><div style={{ flex: 1, height: 6, background: 'var(--color-neutral-100)', borderRadius: 3 }}><div style={{ width: (x.pts / max * 100) + '%', height: 6, background: i === 0 ? 'var(--color-accent)' : 'var(--color-neutral-500)', borderRadius: 3 }} /></div><span style={{ width: 38, textAlign: 'right' }}>{(x.share * 100).toFixed(1)}%</span></div></td></tr>
        ))}</tbody>
      </table>
    );
  };
  const Card = ({ k, title, entries, hint }: { k: string; title: string; entries?: any[]; hint?: string }) => {
    const list = entries || a[k] || [], w = list[0];
    return (
      <section className="card" style={{ padding: '14px 16px', gap: '8px' }}>
        <div title={hint}><Kicker accent>{title}</Kicker></div>
        {w ? (
          <>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="gm-face" style={{ width: 40, height: 60, flex: 'none', overflow: 'hidden' }}>{gm.faceEl(w.pid, w.tid)}</div>
              <div style={{ minWidth: 0 }}>
                <Link onClick={() => open(w.pid)} style={{ fontFamily: 'var(--font-heading)', fontSize: '21px', fontWeight: 600, lineHeight: 1.1 }}>{P[w.pid].name}</Link>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', ...muted }}>{logo(w.tid, 14)}{T[w.tid] ? T[w.tid].region + ' ' + T[w.tid].name : 'Free agent'} · {P[w.pid].pos}</div>
                <div style={{ fontSize: '12px' }}>{w.line}</div>
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--color-divider)', paddingTop: '6px', fontSize: '12px' }}>
              {openV[k] ? <Voting list={list} k={k.toUpperCase()} name={x => <><Link onClick={() => open(x.pid)}>{P[x.pid].name}</Link> <span style={muted}>{T[x.tid]?.abbr}</span></>} /> : list.slice(1, 5).map((x, i) => (
                <div key={x.pid} style={{ display: 'flex', gap: '8px', padding: '1px 0' }}>
                  <span style={{ width: '14px', color: 'var(--color-neutral-600)' }}>{i + 2}</span>
                  <Link onClick={() => open(x.pid)}>{P[x.pid].name}</Link>
                  <span style={{ ...muted, marginLeft: 'auto' }}>{x.pts != null ? x.pts + ' pts' : T[x.tid]?.abbr}</span>
                </div>
              ))}
              <button className="btn btn-ghost" onClick={() => setOpenV(o => ({ ...o, [k]: !o[k] }))} style={{ fontSize: '12px', padding: '2px 0', marginTop: 4 }}>{openV[k] ? 'Hide the voting' : 'Show the voting' + (w.pts != null ? ' · ' + w.first + ' of ' + VOTERS + ' first-place votes' : '')}</button>
            </div>
          </>
        ) : <p style={{ ...muted, margin: 0, fontStyle: 'italic' }}>{k === 'mip' || k === 'MIP' || k === 'LIP' ? 'Not awarded: it needs a previous league season to compare against.' : 'No eligible players.'}</p>}
      </section>
    );
  };
  const TeamTable = ({ title, teams }: { title: string; teams: number[][] }) => (
    <section>
      <h4 style={h4Style}>{title}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(' + teams.length + ',minmax(0,1fr))', gap: '18px' }}>
        {teams.map((tm, i) => (
          <div key={i}>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', borderBottom: '1px solid var(--color-text)', paddingBottom: '2px', marginBottom: '4px' }}>{['First', 'Second', 'Third'][i]} team</div>
            {tm.map(pid => { const tid = (P[pid].stats || []).filter(r => r.season === yr && !r.po).slice(-1)[0]?.tid; return (
              <div key={pid} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <span style={{ width: '22px', fontSize: '11px', color: 'var(--color-neutral-600)' }}>{P[pid].pos}</span>
                {logo(tid, 16)}
                <Link onClick={() => open(pid)}>{P[pid].name}</Link>
              </div>
            ); })}
          </div>
        ))}
      </div>
    </section>
  );
  return (
    <>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <Seg<number> value={yr} options={seasons.map(y => [y, lbl(y)] as [number, string])} onChange={v => setPick(v)} />
        <span style={{ ...muted, fontSize: '12px' }}>{a.list ? 'Voted by formula (hover a title to see it; edit them in Settings → Award formulas). Most awards need 65 games.' : 'Individual awards and All-League teams need 58 of 82 games played.'}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: '18px', marginBottom: '26px' }}>
        {a.list ? (a.defs || []).filter(d => !d.numTeams && !d.statRange).map(d => <Card key={d.shortName} k={d.shortName} title={d.name} entries={a.list[d.shortName]} hint={defs.find(x => x.shortName === d.shortName)?.formula} />) : INDIV.map(([k, t]) => <Card key={k} k={k} title={t} />)}
        <section className="card" style={{ padding: '14px 16px', gap: '8px' }}>
          <Kicker accent>Coach of the Year</Kicker>
          {a.coy.slice(0, 3).map((c, i) => (
            <div key={c.tid} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '2px 0', borderBottom: i ? '1px solid var(--color-divider)' : 'none' }}>
              {logo(c.tid, i ? 16 : 34)}
              <div>
                <div style={{ fontFamily: i ? 'inherit' : 'var(--font-heading)', fontSize: i ? '13px' : '19px', fontWeight: i ? 400 : 600 }}>{c.name}</div>
                <div style={{ fontSize: '12px', ...muted }}><Link onClick={() => openTeam(c.tid)}>{T[c.tid].abbr}</Link> · {c.line}{c.pts != null ? ' · ' + c.pts + ' pts' : ''}</div>
              </div>
            </div>
          ))}
          {a.coy[0]?.pts != null && <button className="btn btn-ghost" onClick={() => setOpenV(o => ({ ...o, COY: !o.COY }))} style={{ fontSize: '12px', padding: '2px 0', marginTop: 4 }}>{openV.COY ? 'Hide the voting' : 'Show the voting · ' + a.coy[0].first + ' of ' + VOTERS + ' first-place votes'}</button>}
          {openV.COY && <Voting list={a.coy} k="COY" name={x => <>{x.name} <span style={muted}>{T[x.tid]?.abbr}</span></>} />}
        </section>
        {Object.entries(a.sfmvp || {}).filter(([, e]) => e).map(([c, e]: any) => (
          <section key={c} className="card" style={{ padding: '14px 16px', gap: '8px', flexDirection: 'row', alignItems: 'center' }}>
            {logo(e.tid, 34)}
            <div><Kicker accent>{c} Finals MVP</Kicker><Link onClick={() => open(e.pid)} style={{ fontFamily: 'var(--font-heading)', fontSize: '19px', fontWeight: 600 }}>{P[e.pid].name}</Link><div style={{ fontSize: '12px' }}>{e.line}</div></div>
          </section>
        ))}
        {a.fmvp && (
          <section className="card" style={{ padding: '14px 16px', gap: '8px', gridColumn: 'span 3', flexDirection: 'row', alignItems: 'center' }}>
            {logo(a.fmvp.tid, 40)}
            <div>
              <Kicker accent>Finals MVP</Kicker>
              <Link onClick={() => open(a.fmvp.pid)} style={{ fontFamily: 'var(--font-heading)', fontSize: '21px', fontWeight: 600 }}>{P[a.fmvp.pid].name}</Link>
              <div style={{ fontSize: '12px' }}>{a.fmvp.line}</div>
            </div>
          </section>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <TeamTable title="All-League" teams={a.allLeague} />
        <div style={{ display: 'grid', gridTemplateColumns: (a.teams?.ALR?.length || 1) > 1 ? 'minmax(0,1fr) minmax(0,1fr)' : 'minmax(0,2fr) minmax(0,1fr)', gap: '24px' }}>
          <TeamTable title="All-Defensive" teams={a.allDef} />
          <TeamTable title="All-Rookie" teams={a.teams?.ALR || [a.allRookie]} />
        </div>
      </div>
    </>
  );
}
