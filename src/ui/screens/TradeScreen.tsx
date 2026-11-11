import type { VM } from '../vm';
import { TradeBoard } from './TradeBoard';

const TONE: Record<string, string> = { good: 'var(--gm-good)', ok: 'var(--color-accent-700)', bad: 'var(--gm-bad)' };
function AdviceBox({ a }: { a: any }) {
  if (!a) return null;
  return (
    <div
      style={{
        marginTop: 8,
        padding: '8px 10px',
        borderLeft: '3px solid ' + TONE[a.tone],
        background: 'color-mix(in srgb, ' + TONE[a.tone] + ' 7%, transparent)',
        borderRadius: 4,
      }}
    >
      <div style={{ fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>
        Assistant GM
      </div>
      <div style={{ fontWeight: 600, color: TONE[a.tone], margin: '2px 0 4px' }}>“{a.head}”</div>
      {a.lines.map((l: string, i: number) => (
        <div key={i} style={{ fontSize: '12px', color: 'var(--color-neutral-800)' }}>
          · {l}
        </div>
      ))}
    </div>
  );
}

export function TradeScreen({ vm }: { vm: VM }) {
  const arrowBtn = { minWidth: 30, padding: '2px 8px', fontSize: '20px', lineHeight: 1 } as const;
  const O = vm.offersV;
  const side = (label: string, rows: any[]) => (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: '10.5px',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          color: 'var(--color-neutral-700)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      {rows.map((r: any, i: number) => (
        <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid var(--color-divider)' }}>
          {r.open ? (
            <button
              className="hv6"
              onClick={r.open}
              style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)', fontWeight: 600 }}
            >
              {r.name}
            </button>
          ) : (
            <b>{r.name}</b>
          )}
          <span style={{ color: 'var(--color-neutral-700)', fontSize: '12px', marginLeft: 8 }}>{r.sub}</span>
        </div>
      ))}
      {!rows.length && <div style={{ color: 'var(--color-neutral-700)', fontSize: '12.5px' }}>Nothing</div>}
    </div>
  );
  return (
    <>
      {vm.inOffersV.count > 0 && !O && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            marginBottom: 10,
            padding: '8px 12px',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <span>📞 {vm.inOffersV.count === 1 ? 'A team has' : vm.inOffersV.count + ' teams have'} called with a trade offer.</span>
          <button className="btn btn-primary" onClick={vm.inOffersV.open} style={{ marginLeft: 'auto', fontSize: '12.5px' }}>
            Offers to you ({vm.inOffersV.count})
          </button>
        </div>
      )}
      {!!O && (
        <section
          style={{
            marginBottom: 18,
            padding: '12px 14px',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-md)',
            background: 'color-mix(in srgb, var(--color-accent) 6%, transparent)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
            <b style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>{O.title}</b>
            <span style={{ color: 'var(--color-neutral-700)', fontSize: '12.5px' }}>
              {O.loading ? '' : O.empty ? '0 offers' : O.count + (O.count === 1 ? ' offer' : ' offers')}
            </span>
            <button className="btn btn-ghost" onClick={O.close} style={{ marginLeft: 'auto', fontSize: '12px' }}>
              Close
            </button>
          </div>
          {O.loading ? (
            <p style={{ margin: 0, color: 'var(--color-neutral-700)' }}>📞 Calling around the league…</p>
          ) : O.empty ? (
            <p style={{ margin: 0, color: 'var(--color-neutral-700)' }}>{O.emptyMsg}</p>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <button className="btn btn-ghost" onClick={O.prev} aria-label="Previous offer" style={arrowBtn}>
                  ‹
                </button>
                {O.logo}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600 }}>{O.team}</div>
                  <div style={{ color: 'var(--color-neutral-700)', fontSize: '12px' }}>
                    {O.strat}
                    {O.strat ? ' · ' : ''}GM {O.gm}
                    {O.note && !/^Option/.test(O.note) ? ' · ' + O.note : ''}
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: 'var(--color-neutral-700)', fontSize: '12.5px', whiteSpace: 'nowrap' }}>
                  {O.pos} of {O.count}
                </span>
                <button className="btn btn-ghost" onClick={O.next} aria-label="Next offer" style={arrowBtn}>
                  ›
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 24, marginBottom: 12 }}>
                {side('You get', O.get || [])}
                {side('You send', O.send || [])}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={O.accept}>
                  Accept
                </button>
                <button className="btn btn-secondary" onClick={O.decline}>
                  Decline
                </button>
                <button className="btn btn-ghost" onClick={O.negotiate} title="Load this offer into the trade builder to change it">
                  Negotiate…
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={O.askAdvice}
                  title="Your assistant GM's take on this offer"
                  style={{ marginLeft: 'auto' }}
                >
                  🧠 {O.adviceOn ? 'Hide advice' : 'Ask for advice'}
                </button>
              </div>
              <AdviceBox a={O.advice} />
            </>
          )}
        </section>
      )}
      <TradeBoard vm={vm} advice={<AdviceBox a={vm.tr.advice} />} />
    </>
  );
}
