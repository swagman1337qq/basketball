// Career & job market: your record as GM & head coach, reputation, open jobs,
// applications and offers. Accept a job to add that club (or leave your current one).
import { useState } from 'react';
import type { VM } from '../vm';
import { acceptJob, applyForJob, reputation } from '../../engine/frontOffice';
import { EXPERIENCE, GENEROSITY, answerOffer, askExtension, contractOf } from '../../engine/gmCareer';
import { Headshot } from '../modals/GMSetupModal';
import { h4Style, Kicker, Link, muted, ruleH4, Stat, td, th } from '../kit';

export function CareerScreen({ vm }: { vm: VM }) {
  const { gm, s, T, logo, openTeam, money } = vm.ctx;
  const c = s.career || { seasons: [] }, rep = reputation(s), jobs = s.jobs;
  const [opt, setOpt] = useState<Record<string, number>>({});
  const seasons = (c.seasons || []).slice().reverse();
  const titles = (c.seasons || []).filter(x => x.fin === 'Won the title').length;
  const w = (c.seasons || []).reduce((a, x) => a + x.w, 0), l = (c.seasons || []).reduce((a, x) => a + x.l, 0);
  const inSeason = ['regular', 'playin', 'playoffs'].includes(s.phase);
  return (
    <>
      {s.unemployed && (
        <section className="card" style={{ padding: '14px 16px', marginBottom: '20px', borderColor: 'var(--gm-bad)' }}>
          <Kicker>Out of work</Kicker>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px' }}>{s.walkedFrom != null ? 'You walked away from the ' + T[s.walkedFrom].name + '.' : (c.seasons || []).slice(-1)[0]?.expired ? 'Your contract wasn’t renewed.' : 'You were fired.'}</div>
          <p style={{ ...muted, margin: 0 }}>The league won’t move on until you take a job. Apply below or accept an offer; the season resumes with your new club.</p>
        </section>
      )}
      {(() => {
        const k = contractOf(gm, s), kt = T[k.tid], left = k.thru - gm.Y, o = s.gmOffer, G = GENEROSITY[kt.arch], yr = (y: number) => (y - 1) + '–' + String(y).slice(2);
        return (
          <section className="card" style={{ padding: '14px 16px', marginBottom: '22px', display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {s.gm && <Headshot gm={s.gm} size={72} />}
            <div style={{ flex: 1, minWidth: 240 }}>
              <Kicker>{s.gm ? s.gm.name + ' · ' + gm.db.C[s.gm.nat].n + ' · ' + EXPERIENCE[s.gm.exp].label : 'Your contract'}</Kicker>
              <div style={{ fontSize: '20px', fontWeight: 600, margin: '2px 0' }}>{s.unemployed ? 'No contract' : '$' + k.salary.toFixed(2) + 'M a season with the ' + kt.name + ', through ' + yr(k.thru)}</div>
              {!s.unemployed && <div style={{ ...muted, fontSize: '12.5px' }}>{left > 0 ? left + ' more season' + (left === 1 ? '' : 's') + ' after this one.' : 'This is the final season of your deal.'} {kt.owner} is a {kt.arch} and {G.note}.{k.assumed ? ' (Terms estimated for a league started before GM contracts.)' : ''}</div>}
              {o && (
                <div style={{ marginTop: 10, padding: '10px 12px', border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 600 }}>{T[o.tid].owner} offers {o.kind === 'expiring' ? 'a new deal' : 'an extension'}: {o.years} year{o.years === 1 ? '' : 's'} at ${o.salary.toFixed(2)}M a season</div>
                  <div style={{ ...muted, fontSize: '12.5px', margin: '2px 0 8px' }}>“{o.quote}”{o.kind === 'expiring' ? ' Your deal is up: decline and you leave the team. Answer before free agency opens.' : ' Decline and your current deal stays as it is.'}</div>
                  <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-primary" onClick={() => answerOffer(gm, true)}>Accept</button><button className="btn btn-secondary" onClick={() => answerOffer(gm, false)}>{o.kind === 'expiring' ? 'Decline and leave' : 'Decline'}</button></div>
                </div>
              )}
              {!o && !s.unemployed && (
                <div style={{ marginTop: 8, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <button className="btn btn-secondary" disabled={s.gmAsk === gm.Y} onClick={() => askExtension(gm)} style={{ fontSize: '12.5px' }}>Ask {kt.owner} for an extension</button>
                  <span style={{ ...muted, fontSize: '12px' }}>{s.gmAsk === gm.Y ? (s.gmReply ? '“' + s.gmReply + '”' : 'You’ve asked this season.') : 'Once a season. The owner says yes only when he’s happy (job security 60+) and your deal has 2 or fewer seasons left.'}</span>
                </div>
              )}
            </div>
          </section>
        );
      })()}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '24px', marginBottom: '26px' }}>
        <Stat label="Reputation" value={rep} sub={rep >= 70 ? 'In demand' : rep >= 50 ? 'Respected' : rep >= 35 ? 'Unproven' : 'Damaged'} />
        <Stat label="Career record" value={w + '–' + l} sub={(c.seasons || []).length + ' seasons'} />
        <Stat label="Titles" value={titles} sub={(c.coy || 0) + '× Coach of the Year'} />
        <Stat label="Times fired" value={c.fired || 0} sub={(c.seasons || []).filter(x => x.expired).length + ' contract' + ((c.seasons || []).filter(x => x.expired).length === 1 ? '' : 's') + ' not renewed'} />
      </div>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 22px' }}>
        Reputation starts from your experience and blends toward your record as seasons pass: 50 + (career win% − .500) × 120 + 8 per title + 2 per playoff trip + 4 per Coach of the Year − 12 per firing, capped 0–100. Owners with openings hire when your reputation clears what their roster and market demand.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,1fr)', gap: '32px', alignItems: 'start' }}>
        <section>
          <h4 style={ruleH4}>Job market</h4>
          {!jobs ? (
            <p style={{ ...muted, fontStyle: 'italic' }}>{inSeason ? 'Owners make changes after the season. Openings and offers appear here when you end the season.' : 'The market has closed for this offseason.'}</p>
          ) : (
            <>
              <h4 style={{ ...h4Style, fontSize: '16px', marginTop: '8px' }}>Offers</h4>
              {jobs.offers.length === 0 && <p style={{ ...muted, fontStyle: 'italic', margin: '0 0 12px' }}>No offers yet. Apply for an opening below.</p>}
              {jobs.offers.map(o => { const t = T[o.tid], k = opt[o.id] ?? 1; return (
                <div key={o.id} className="card" style={{ padding: '12px 14px', marginBottom: '10px', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    {logo(o.tid, 36)}
                    <div style={{ flex: 1 }}>
                      <Link onClick={() => openTeam(o.tid)} style={{ fontFamily: 'var(--font-heading)', fontSize: '19px', fontWeight: 600 }}>{t.region} {t.name}</Link>
                      <div style={{ ...muted, fontSize: '12px' }}>{t.w}–{t.l} · Owner {t.owner} ({t.arch}) · {o.from === 'poach' ? 'Wants to poach you' : o.from === 'applied' ? 'After your interview' : 'Open job'}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px' }}>{o.note}</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {o.options.map((x, i) => (
                      <button key={i} className="btn btn-ghost" onClick={() => setOpt({ ...opt, [o.id]: i })} style={{ fontSize: '12px', padding: '4px 10px', boxShadow: k === i ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}>{x.years} yrs · {money(x.salary)}/yr</button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-primary" style={{ fontSize: '13px' }} onClick={() => acceptJob(gm, o.id, k, true)}>{s.unemployed ? 'Accept' : 'Accept and leave ' + T[s.me].abbr}</button>
                    {!s.unemployed && <button className="btn btn-secondary" style={{ fontSize: '13px' }} onClick={() => acceptJob(gm, o.id, k, false)}>Accept and run both</button>}
                  </div>
                </div>
              ); })}
              <h4 style={{ ...h4Style, fontSize: '16px', marginTop: '14px' }}>Openings</h4>
              {jobs.vacancies.length === 0 && <p style={{ ...muted, fontStyle: 'italic' }}>Nobody was fired this offseason.</p>}
              {jobs.vacancies.map(v => { const a = jobs.applied?.[v.tid], t = T[v.tid]; return (
                <div key={v.tid} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-divider)' }}>
                  {logo(v.tid, 22)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link onClick={() => openTeam(v.tid)}>{t.region} {t.name}</Link>
                    <div style={{ ...muted, fontSize: '11.5px' }}>{v.reason} · {t.arch}</div>
                  </div>
                  {gm.isUser(s, v.tid) ? <span style={muted}>Yours</span> : a ? <span style={{ fontSize: '12px', color: a === 'offer' ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{a === 'offer' ? 'Offer made' : 'Turned down'}</span> : <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '3px 10px' }} onClick={() => applyForJob(gm, v.tid)}>Apply</button>}
                </div>
              ); })}
            </>
          )}
        </section>
        <section>
          <h4 style={ruleH4}>Season by season</h4>
          {seasons.length === 0 ? <p style={{ ...muted, fontStyle: 'italic' }}>Your first review comes at the end of the {gm.seasonLbl()} season.</p> : (
            <table className="table" style={{ fontSize: '12.5px' }}>
              <thead><tr><th style={th()}>Season</th><th style={th()}>Team</th><th style={th('right')}>W–L</th><th style={th()}>Finish</th><th style={th('right')}>Security</th></tr></thead>
              <tbody>
                {seasons.map((x, i) => (
                  <tr key={i}>
                    <td style={td()}>{x.season - 1}–{String(x.season).slice(2)}</td>
                    <td style={td()}><span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>{logo(x.tid, 16)}{T[x.tid].abbr}</span></td>
                    <td style={td('right')}>{x.w}–{x.l}</td>
                    <td style={td()}>{x.fin}{x.fired ? <span style={{ color: 'var(--gm-bad)' }}> · fired</span> : null}</td>
                    <td style={td('right')}>{x.sec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </>
  );
}
