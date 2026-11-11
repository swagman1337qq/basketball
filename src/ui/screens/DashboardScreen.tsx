import { PN } from '../kit';
import type { VM } from '../vm';
import { financesOf } from '../../engine/frontOffice';
import { fmtMoney } from '../../engine/capModel';

export function DashboardScreen({ vm }: { vm: VM }) {
  if (vm.dense) return <DashboardDense vm={vm} />;
  return (
    <>
      {!!vm.hasProg && (
        <>
          <section className="card" style={{ padding: '14px 16px', marginBottom: '22px' }}>
            <div className="card-kicker" style={{ color: 'var(--color-accent-700)' }}>
              Offseason development
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '4px 24px' }}>
              {(vm.progRows || []).map((r: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '3px 0',
                    borderBottom: '1px solid var(--color-divider)',
                  }}
                >
                  <button className="hv1" onClick={r.open} title={r.name} style={{ all: 'unset', cursor: 'pointer', ...PN }}>
                    {r.name}
                  </button>
                  <span>
                    {r.from} → {r.to} <span style={{ color: r.color, fontWeight: '600', marginLeft: '4px' }}>{r.d}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '24px', marginBottom: '26px' }}>
        {(vm.dashStats || []).map((st: any, i: number) => (
          <div key={i} style={{ borderTop: '1px solid var(--color-text)', paddingTop: '8px' }}>
            <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
              {st.label}
            </div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', lineHeight: '1.05' }}>{st.value}</div>
            <div style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{st.sub}</div>
          </div>
        ))}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.05fr) minmax(0,1fr) minmax(0,1.1fr)', gap: '28px', alignItems: 'start' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="card" style={{ gap: '12px', padding: '16px' }}>
            <div className="card-kicker" style={{ color: 'var(--color-accent-700)' }}>
              Next game · {vm.next.when}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ flex: '1' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '30px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {vm.next.myLogo}
                  {vm.myAbbr}
                </div>
                <div style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{vm.next.myRec}</div>
              </div>
              <div style={{ fontStyle: 'italic', color: 'var(--color-neutral-600)' }}>{vm.next.vs}</div>
              <div style={{ flex: '1', textAlign: 'right' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '30px',
                    lineHeight: '1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '10px',
                  }}
                >
                  <button className="hv4" onClick={vm.next.openT} style={{ all: 'unset', cursor: 'pointer' }}>
                    {vm.next.abbr}
                  </button>
                  {vm.next.logo}
                </div>
                <div style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{vm.next.oppRec}</div>
              </div>
            </div>
            <div
              style={{
                color: 'var(--color-neutral-700)',
                fontSize: '12px',
                borderTop: '1px solid var(--color-divider)',
                paddingTop: '8px',
              }}
            >
              {vm.next.line}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="btn btn-primary" onClick={vm.watch1} style={{ flex: '1' }}>
                Watch game
              </button>
              <button className="btn btn-secondary" onClick={vm.quick1} style={{ whiteSpace: 'nowrap', flex: 'none' }}>
                Quick sim
              </button>
              <button className="btn btn-secondary" onClick={vm.play7} style={{ whiteSpace: 'nowrap', flex: 'none' }}>
                Week
              </button>
            </div>
          </section>
          <section>
            <h4 style={{ margin: '0 0 4px', fontSize: '19px' }}>Recent results</h4>
            <table className="table" style={{ fontSize: '13px' }}>
              <tbody>
                {(vm.results || []).map((r: any, i: number) => (
                  <tr key={i}>
                    <td style={{ padding: '5px 8px', color: 'var(--color-neutral-700)' }}>{r.date}</td>
                    <td style={{ padding: '5px 8px' }}>
                      <button
                        className="hv4"
                        onClick={r.openT}
                        style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                      >
                        {r.logo}
                        {r.opp}
                      </button>
                    </td>
                    <td style={{ padding: '5px 8px', color: r.color, fontWeight: '600' }}>{r.wl}</td>
                    <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r.openBox ? (
                        <button
                          className="hv4"
                          onClick={r.openBox}
                          title="Box score"
                          style={{ all: 'unset', cursor: 'pointer', textDecoration: 'underline dotted', textUnderlineOffset: 3 }}
                        >
                          {r.score}
                        </button>
                      ) : (
                        <span title="No box score: played before box scores were added">{r.score}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section>
            <h4 style={{ margin: '0 0 4px', fontSize: '19px' }}>Team leaders</h4>
            {(vm.leaders || []).map((l: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '10px',
                  padding: '7px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <div
                  style={{
                    width: '34px',
                    fontSize: '10.5px',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: 'var(--color-neutral-700)',
                  }}
                >
                  {l.label}
                </div>
                <button
                  className="hv4"
                  onClick={l.open}
                  title={l.name}
                  style={{ all: 'unset', cursor: 'pointer', flex: '1', ...PN, maxWidth: 'none', minWidth: 0 }}
                >
                  {l.name}
                </button>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', lineHeight: '1' }}>{l.value}</div>
              </div>
            ))}
          </section>
          <section>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '19px' }}>Starting five</h4>
              <button className="btn btn-ghost" onClick={vm.goRoster} style={{ fontSize: '13px', whiteSpace: 'nowrap', flex: 'none' }}>
                Set lineup
              </button>
            </div>
            {(vm.lineup || []).map((p: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '2px 0',
                  borderBottom: '1px solid var(--color-divider)',
                }}
              >
                <div className="gm-face" style={{ width: '26px', height: '39px', flex: 'none', overflow: 'hidden' }}>
                  {p.face}
                </div>
                <div style={{ width: '28px', color: 'var(--color-neutral-700)' }}>{p.pos}</div>
                <img
                  src={p.flag}
                  alt=""
                  title={p.cname}
                  style={{ width: '16px', height: '11px', objectFit: 'cover', outline: '1px solid var(--color-divider)' }}
                />
                <button
                  className="hv4"
                  onClick={p.open}
                  title={p.name}
                  style={{ all: 'unset', cursor: 'pointer', flex: '1', ...PN, maxWidth: 'none', minWidth: 0 }}
                >
                  {p.name}
                </button>
                <div style={{ color: p.tone, fontWeight: '600' }}>{p.ovr}</div>
              </div>
            ))}
          </section>
        </div>
        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <h4 style={{ margin: '0 0 4px', fontSize: '19px' }}>{vm.confName}</h4>
            <button className="btn btn-ghost" onClick={vm.goStandings} style={{ fontSize: '13px', whiteSpace: 'nowrap', flex: 'none' }}>
              Standings
            </button>
          </div>
          <table className="table" style={{ fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ padding: '6px 8px' }}>#</th>
                <th style={{ padding: '6px 8px' }}>Team</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>W–L</th>
                <th style={{ padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>GB</th>
              </tr>
            </thead>
            <tbody>
              {(vm.confMini || []).map((t: any, i: number) => (
                <tr key={i} style={{ background: t.bg }}>
                  <td style={{ padding: '5px 8px', color: 'var(--color-neutral-700)', borderBottom: t.line }}>{t.seed}</td>
                  <td style={{ padding: '5px 8px', fontWeight: t.fw, borderBottom: t.line }}>
                    <button
                      className="hv4"
                      onClick={t.openT}
                      style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      {t.logo}
                      {t.name}
                    </button>
                  </td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', whiteSpace: 'nowrap', borderBottom: t.line }}>{t.rec}</td>
                  <td
                    style={{
                      padding: '5px 8px',
                      textAlign: 'right',
                      whiteSpace: 'nowrap',
                      color: 'var(--color-neutral-700)',
                      borderBottom: t.line,
                    }}
                  >
                    {t.gb}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}

// Hadrian's Lover (2026-11-11, Settings → Screen design): the same Dashboard, denser. One summary strip with the next game,
// what's waiting in the Mailbox, the rotation with this season's numbers, and the conference, with no large tiles.
const box: React.CSSProperties = { border: '1px solid var(--color-divider)', borderRadius: 'var(--radius-md)' };
const th: React.CSSProperties = { padding: '5px 8px', fontSize: '11.5px', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' };
const tc: React.CSSProperties = {
  padding: '4px 8px',
  borderTop: '1px solid var(--color-divider)',
  textAlign: 'right',
  whiteSpace: 'nowrap',
};
const stripe = (i: number) => (i % 2 ? 'color-mix(in srgb, var(--color-text) 3%, transparent)' : undefined);
const kick: React.CSSProperties = { margin: '0 0 4px', fontSize: '14px', fontWeight: 600 };

function DashboardDense({ vm }: { vm: VM }) {
  const { gm, s, open } = vm.ctx,
    P = gm.db.P,
    me = s.me;
  const fin = financesOf(gm, s, me),
    games = (s.games || []).filter((x: any) => !x.po && (x.h === me || x.a === me)),
    mov = games.length ? games.reduce((a: number, x: any) => a + (x.h === me ? x.hp - x.ap : x.ap - x.hp), 0) / games.length : null;
  const ids: number[] = (s.rosters[me] || []).filter((id: number) => P[id] && P[id].ctype !== 'twoWay' && P[id].ctype !== 'ex10');
  const rot = ids.slice(0, 8);
  const unread = (s.mail || [])
    .filter((m: any) => (m.seq || 0) > (s.mailRead || 0) && typeof m.title === 'string')
    .sort((a: any, b: any) => (b.seq || 0) - (a.seq || 0))
    .slice(0, 3);
  const stats = vm.dashStats || [];
  return (
    <>
      {!!vm.hasProg && (
        <section style={{ ...box, padding: '8px 12px', marginBottom: 12 }}>
          <div style={{ ...kick, fontSize: '13px', color: 'var(--color-accent-700)' }}>Offseason development</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: '0 20px', fontSize: '12.5px' }}>
            {(vm.progRows || []).map((r: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                <button className="hv1" onClick={r.open} title={r.name} style={{ all: 'unset', cursor: 'pointer', ...PN }}>
                  {r.name}
                </button>
                <span>
                  {r.from} → {r.to} <b style={{ color: r.color }}>{r.d}</b>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      <section
        style={{
          ...box,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px 28px',
          alignItems: 'center',
          padding: '10px 14px',
          marginBottom: 10,
          background: 'color-mix(in srgb, var(--color-text) 3%, transparent)',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '3px 16px', fontSize: '13px', flex: '1 1 520px' }}>
          {stats.map((st: any, i: number) => (
            <span key={i} style={{ display: 'contents' }}>
              <span style={{ color: 'var(--color-neutral-700)' }}>{st.label}</span>
              <span>
                <b>{st.value}</b> <span style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>{st.sub}</span>
              </span>
            </span>
          ))}
          {mov != null && (
            <span style={{ display: 'contents' }}>
              <span style={{ color: 'var(--color-neutral-700)' }}>MOV</span>
              <b style={{ color: mov >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>
                {mov >= 0 ? '+' : ''}
                {mov.toFixed(1)}
              </b>
            </span>
          )}
          <span style={{ display: 'contents' }}>
            <span style={{ color: 'var(--color-neutral-700)' }}>Profit</span>
            <b style={{ color: fin.net >= 0 ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{fmtMoney(fin.net)}</b>
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            paddingLeft: 18,
            borderLeft: '1px solid var(--color-divider)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>Next · {vm.next.when}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              {vm.next.vs}{' '}
              <button className="hv4" onClick={vm.next.openT} style={{ all: 'unset', cursor: 'pointer' }}>
                {vm.next.abbr}
              </button>
              {vm.next.smLogo || vm.next.logo}
              <span style={{ color: 'var(--color-neutral-700)', fontWeight: 400, fontSize: '12px' }}>{vm.next.oppRec}</span>
            </span>
          </div>
          <button className="btn btn-primary" onClick={vm.watch1} style={{ fontSize: '12.5px', padding: '4px 12px' }}>
            Watch
          </button>
          <button className="btn btn-secondary" onClick={vm.quick1} style={{ fontSize: '12.5px', padding: '4px 10px' }}>
            Quick sim
          </button>
          <button className="btn btn-secondary" onClick={vm.play7} style={{ fontSize: '12.5px', padding: '4px 10px' }}>
            Week
          </button>
        </div>
      </section>
      {vm.mailNew > 0 && (
        <section
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '4px 14px',
            padding: '7px 12px',
            marginBottom: 12,
            border: '1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)',
            background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
          }}
        >
          <button
            onClick={() => vm.goTo('mail')}
            style={{ all: 'unset', cursor: 'pointer', fontWeight: 600, color: 'var(--color-accent-700)' }}
          >
            {vm.mailNew} new in your Mailbox
          </button>
          {unread.map((m: any) => (
            <button
              key={m.id}
              className="hv4"
              onClick={() => vm.goTo('mail')}
              style={{ all: 'unset', cursor: 'pointer', ...PN, maxWidth: '42ch' }}
              title={m.title}
            >
              {m.title}
            </button>
          ))}
        </section>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <h4 style={kick}>Rotation</h4>
              <button className="btn btn-ghost" onClick={vm.goRoster} style={{ fontSize: '12.5px', padding: '0 4px' }}>
                Roster →
              </button>
            </div>
            <div style={{ ...box, overflowX: 'auto' }}>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontVariantNumeric: 'tabular-nums', minWidth: 480 }}
              >
                <thead>
                  <tr style={{ color: 'var(--color-neutral-700)' }}>
                    <th style={{ width: 5, padding: 0 }} />
                    <th style={{ ...th, textAlign: 'left' }}>Player</th>
                    <th style={{ ...th, textAlign: 'left' }}>Pos</th>
                    <th style={th}>Ovr</th>
                    <th style={th}>Min</th>
                    <th style={th}>Pts</th>
                    <th style={th}>Reb</th>
                    <th style={th}>Ast</th>
                    <th style={th}>PER</th>
                  </tr>
                </thead>
                <tbody>
                  {rot.map((id, i) => {
                    const p = P[id],
                      start = i < 5;
                    return (
                      <tr
                        key={id}
                        style={{ background: stripe(i), borderBottom: i === 4 ? '2px solid var(--color-neutral-500)' : undefined }}
                      >
                        <td
                          style={{
                            padding: 0,
                            background: start ? 'var(--gm-good)' : 'var(--color-neutral-400)',
                            opacity: p.inj && !p.inj.dtd ? 0.4 : 1,
                          }}
                        />
                        <td style={{ ...tc, textAlign: 'left' }}>
                          <button
                            className="hv4"
                            onClick={() => open(id)}
                            style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)', fontWeight: start ? 600 : 400 }}
                          >
                            {p.name}
                          </button>
                          {p.inj && (
                            <span style={{ marginLeft: 6, fontSize: '11px', color: 'var(--gm-bad)' }} title={p.inj.name}>
                              {p.inj.dtd ? 'DTD' : 'Out ' + gm.injText(p, true)}
                            </span>
                          )}
                        </td>
                        <td style={{ ...tc, textAlign: 'left' }}>{p.pos}</td>
                        <td style={{ ...tc, fontWeight: 600, color: vm.ctx.tone(p.ovr) }}>{p.ovr}</td>
                        <td style={tc}>{(p.min || 0).toFixed(1)}</td>
                        <td style={tc}>{(p.pts || 0).toFixed(1)}</td>
                        <td style={tc}>{(p.reb || 0).toFixed(1)}</td>
                        <td style={tc}>{(p.ast || 0).toFixed(1)}</td>
                        <td style={tc}>{(p.per || 0).toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <section style={{ flex: '1 1 250px', minWidth: 0 }}>
              <h4 style={kick}>Recent results</h4>
              <div style={{ ...box, fontVariantNumeric: 'tabular-nums', fontSize: '13px' }}>
                {(vm.results || []).map((r: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'center',
                      padding: '4px 10px',
                      borderTop: i ? '1px solid var(--color-divider)' : undefined,
                      background: stripe(i),
                    }}
                  >
                    <span style={{ color: 'var(--color-neutral-700)', width: 46 }}>{r.date}</span>
                    <button
                      className="hv4"
                      onClick={r.openT}
                      style={{ all: 'unset', cursor: 'pointer', flex: 1, display: 'inline-flex', gap: 6, alignItems: 'center' }}
                    >
                      {r.logo}
                      {r.opp}
                    </button>
                    <b style={{ color: r.color, width: 14 }}>{r.wl}</b>
                    {r.openBox ? (
                      <button className="hv4" onClick={r.openBox} title="Box score" style={{ all: 'unset', cursor: 'pointer' }}>
                        {r.score}
                      </button>
                    ) : (
                      <span>{r.score}</span>
                    )}
                  </div>
                ))}
                {!(vm.results || []).length && <div style={{ padding: '6px 10px', color: 'var(--color-neutral-700)' }}>No games yet.</div>}
              </div>
            </section>
            <section style={{ flex: '1 1 250px', minWidth: 0 }}>
              <h4 style={kick}>Team leaders</h4>
              <div style={{ ...box, fontSize: '13px' }}>
                {(vm.leaders || []).map((l: any, i: number) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      padding: '4px 10px',
                      borderTop: i ? '1px solid var(--color-divider)' : undefined,
                      background: stripe(i),
                    }}
                  >
                    <span style={{ color: 'var(--color-neutral-700)', width: 34 }}>{l.label}</span>
                    <button
                      className="hv4"
                      onClick={l.open}
                      style={{ all: 'unset', cursor: 'pointer', flex: 1, color: 'var(--color-accent-700)', ...PN, maxWidth: 'none' }}
                    >
                      {l.name}
                    </button>
                    <b>{l.value}</b>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
        <section style={{ flex: '1 1 300px', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <h4 style={kick}>{vm.confName}</h4>
            <button className="btn btn-ghost" onClick={vm.goStandings} style={{ fontSize: '12.5px', padding: '0 4px' }}>
              Standings →
            </button>
          </div>
          <div style={{ ...box, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr style={{ color: 'var(--color-neutral-700)' }}>
                  <th style={{ ...th, textAlign: 'left' }}>#</th>
                  <th style={{ ...th, textAlign: 'left' }}>Team</th>
                  <th style={th}>W–L</th>
                  <th style={th}>GB</th>
                </tr>
              </thead>
              <tbody>
                {(vm.confMini || []).map((t: any, i: number) => (
                  <tr key={i} style={{ background: t.bg || stripe(i) }}>
                    <td style={{ ...tc, textAlign: 'left', color: 'var(--color-neutral-700)', borderBottom: t.line }}>{t.seed}</td>
                    <td style={{ ...tc, textAlign: 'left', fontWeight: t.fw, borderBottom: t.line }}>
                      <button
                        className="hv4"
                        onClick={t.openT}
                        style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      >
                        {t.logo}
                        {t.name}
                      </button>
                    </td>
                    <td style={{ ...tc, borderBottom: t.line }}>{t.rec}</td>
                    <td style={{ ...tc, color: 'var(--color-neutral-700)', borderBottom: t.line }}>{t.gb}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
