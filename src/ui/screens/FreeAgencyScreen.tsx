import type { VM } from '../vm';
import { CapBar } from '../CapBar';
import { useState } from 'react';
import { Seg, usePaged, PN } from '../kit';
import { BadgeChip, MiniBadges } from '../BadgeChip';
import { knownBadges } from '../../engine/scoutReport';
import { TraitFilter, byTrait } from '../TraitFilter';
import { useSearchFilter } from '../SearchFilter';
import { Link, muted } from '../kit';
import { Game } from '../../engine/Game';
import { useScoutSelect } from '../ScoutSelect';
import { exceptionsOf, nums, rosterMax, seasonMax, stdIds, teamSalary, TWO_WAY_MAX, twoWayIds } from '../../engine/cba';
import { pendingQOs } from '../../engine/cbaFlow';
import { fmtMoney as fmtM } from '../../engine/capModel';
import { faAdvice, type FaAdvice } from '../../engine/assistants';

// "Minneapolis Marauders signed Emmitt Fountain · $4.03M × 2 yrs through 2029 (bi-annual exception)" → "signed Emmitt
// Fountain · $4.03M × 2 yrs" (the team's abbreviation goes before it; the full line is the tooltip)
const shortSigning = (t: string) =>
  String(t || '')
    .replace(/^.*? (signed|re-signed|matched|kept) /, '$1 ')
    .replace(/ through \d{4}/, '')
    .replace(/ \([^)]*\)/g, '');

// The free agency clock: where we are on the NBA calendar, how much of the market has signed,
// what happened since you last advanced, and the best players still out there.
function FATracker({ vm }: { vm: VM }) {
  const { gm, s, T, logo, open } = vm.ctx,
    P = gm.db.P;
  if (s.phase !== 'fa') return null;
  const fd = gm.faDayOf(s),
    END = Game.FA_END,
    date = gm.faDate(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const top: number[] = s.faTop || [],
    unsigned = new Set<number>(s.fa),
    signedTop = top.filter(id => !unsigned.has(id)).length;
  const since = s.faPrev ?? s.day,
    fromT = s.faStart ?? 0;
  const sign = (s.lgLog || []).filter((e: any) => e.type === 'Signing' && e.day >= fromT && (e.pids || []).length);
  const fresh = sign.filter((e: any) => e.day >= since),
    recent = (fresh.length ? fresh : sign).slice(0, 14);
  const best = s.fa
    .map((id: number) => P[id])
    .filter((p: any) => p && !p.retired)
    .sort((a: any, b: any) => b.ovr - a.ovr)
    .slice(0, 8);
  const marks: [number, string][] = [
    [0, 'Jun 30 · open'],
    [15, 'Summer League'],
    [46, 'August'],
    [END, 'Sep 30 · training camp'],
  ];
  const bar = (
    <div style={{ position: 'relative', height: 30 }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 8,
          height: 6,
          borderRadius: 3,
          background: 'color-mix(in srgb, var(--color-text) 12%, transparent)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: (10 / END) * 100 + '%',
          width: (10 / END) * 100 + '%',
          top: 8,
          height: 6,
          background: 'color-mix(in srgb, var(--color-accent) 35%, transparent)',
        }}
        title="Summer League"
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          width: Math.min(100, (fd / END) * 100) + '%',
          top: 8,
          height: 6,
          borderRadius: 3,
          background: 'var(--color-accent)',
        }}
      />
      <div
        title="July 6: the moratorium ends and deals become official"
        style={{
          position: 'absolute',
          left: (6 / END) * 100 + '%',
          top: 4,
          width: 2,
          height: 14,
          background: 'var(--color-text)',
          opacity: 0.5,
        }}
      />
      {marks
        .filter(m => m[1])
        .map(([d, l]) => (
          <span
            key={d}
            style={{
              position: 'absolute',
              left: (d / END) * 100 + '%',
              top: 16,
              transform: d === END ? 'translateX(-100%)' : d ? 'translateX(-50%)' : undefined,
              fontSize: '10.5px',
              ...muted,
              whiteSpace: 'nowrap',
            }}
          >
            {l}
          </span>
        ))}
    </div>
  );
  if (vm.dense)
    // Hadrian's Lover: the date, the calendar bar and one line of signings (the table below is the best still available)
    return (
      <section style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: '4px 16px', flexWrap: 'wrap', alignItems: 'baseline', fontSize: '13px' }}>
          <b style={{ fontSize: '15px' }}>{date}</b>
          <span style={muted}>
            Day {fd} · {gm.faStage(fd)}
          </span>
          <span style={{ marginLeft: 'auto' }}>
            <b>{signedTop}</b> of the top {top.length} have signed · <b>{s.fa.length}</b> unsigned
          </span>
        </div>
        {bar}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '3px 16px',
            fontSize: '12px',
            padding: '6px 10px',
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <b>{fresh.length ? 'Since you last advanced' : 'Latest signings'}</b>
          {recent.length ? (
            recent.slice(0, 8).map((e: any, i: number) => (
              <span key={i} style={{ whiteSpace: 'nowrap' }} title={e.text}>
                <span style={muted}>{e.date || ''}</span> <b>{e.teams}</b> {shortSigning(e.text)}
              </span>
            ))
          ) : (
            <span style={muted}>Nobody has signed yet. Negotiations open tonight.</span>
          )}
          {(fresh.length || sign.length) > 8 && <span style={muted}>and {(fresh.length || sign.length) - 8} more</span>}
          <button
            className="btn btn-ghost"
            onClick={() => gm.setState({ screen: 'tx' })}
            style={{ marginLeft: 'auto', fontSize: '12px', padding: '0 4px' }}
          >
            All signings →
          </button>
        </div>
      </section>
    );
  return (
    <section className="card" style={{ padding: '12px 14px', gap: 10, marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>{date}</div>
          <div style={{ ...muted, fontSize: '12.5px' }}>
            Day {fd} of free agency · {gm.faStage(fd)}
          </div>
        </div>
        <div style={{ fontSize: '13px' }}>
          <b>{signedTop}</b> of the top {top.length} free agents have signed · <b>{s.fa.length}</b> players unsigned
        </div>
      </div>
      {bar}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 14 }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>
            {fresh.length ? fresh.length + ' signing' + (fresh.length === 1 ? '' : 's') + ' since you last advanced' : 'Latest signings'}
          </div>
          {recent.length ? (
            recent.map((e: any, i: number) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'baseline',
                  fontSize: '12.5px',
                  padding: '2px 0',
                  borderBottom: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)',
                }}
              >
                <span style={{ ...muted, fontSize: '11px', width: 44, flex: 'none' }}>{e.date || ''}</span>
                <span>{e.text}</span>
              </div>
            ))
          ) : (
            <div style={{ ...muted, fontSize: '12.5px' }}>Nobody has signed yet. Negotiations open tonight.</div>
          )}
        </div>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: 4 }}>Best still available</div>
          {best.map((p: any) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'baseline',
                fontSize: '12.5px',
                padding: '2px 0',
                borderBottom: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)',
              }}
            >
              <span style={{ fontWeight: 700, width: 22, color: vm.ctx.tone(p.ovr) }}>{p.ovr}</span>
              <Link pid={p.id} onClick={() => open(p.id)}>
                {p.name}
              </Link>
              <span style={{ ...muted, fontSize: '11.5px' }}>
                {p.pos} · {p.age}
                {p.birdTid != null && T[p.birdTid] ? ' · last with ' + T[p.birdTid].abbr : ''}
                {p.rfa ? (p.rfa.tid === vm.ctx.s.me ? ' · your QO' : ' · restricted') : ''}
                {p.ask ? ' · asking $' + p.ask.toFixed(1) + 'M' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// The filter bar: who you can sign right now, and ranges for age, overall, potential and asking
// price. Kept in the save (s.faF) so it survives leaving the screen; Reset clears everything.
type FaF = {
  can?: boolean;
  pos?: string;
  ageMin?: number;
  ageMax?: number;
  ovrMin?: number;
  ovrMax?: number;
  potMin?: number;
  potMax?: number;
  askMax?: number;
};
const POS_F: [string, string][] = [
  ['any', 'Any position'],
  ['G', 'Guards'],
  ['W', 'Wings'],
  ['B', 'Bigs'],
  ['PG', 'PG'],
  ['SG', 'SG'],
  ['SF', 'SF'],
  ['PF', 'PF'],
  ['C', 'C'],
];
function Range({
  label,
  lo,
  hi,
  onLo,
  onHi,
  step = 1,
  width = 54,
  loPh = 'min',
  hiPh = 'max',
}: {
  label: string;
  lo?: number;
  hi?: number;
  onLo?: (v?: number) => void;
  onHi: (v?: number) => void;
  step?: number;
  width?: number;
  loPh?: string;
  hiPh?: string;
}) {
  const num = (v: string) => (v.trim() === '' || !isFinite(+v) ? undefined : +v);
  const box = (v: number | undefined, ph: string, set: (v?: number) => void) => (
    <input
      className="input"
      type="number"
      step={step}
      value={v ?? ''}
      placeholder={ph}
      onChange={e => set(num(e.target.value))}
      style={{ width, padding: '3px 6px', fontSize: '12.5px' }}
    />
  );
  return (
    <label style={{ display: 'inline-flex', gap: 4, alignItems: 'center', fontSize: '12.5px' }}>
      {label}
      {onLo && box(lo, loPh, onLo)}
      {onLo && <span style={muted}>to</span>}
      {box(hi, hiPh, onHi)}
    </label>
  );
}

export function FreeAgencyScreen({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx,
    P = gm.db.P;
  const [f, setF] = useState<'all' | 'gl' | 'home'>('all'),
    [tk, setTk] = useState(''),
    [more, setMore] = useState(false), // Hadrian's Lover: the extra filters, folded away
    [tg, setTg] = useState(false); // Hadrian's Lover: only your targets (players on any shortlist)
  const listed = new Set<number>((s.lists || []).flatMap((l: any) => l.ids));
  const F: FaF = s.faF || {},
    setFF = (x: Partial<FaF>) => gm.setState(st => ({ faF: { ...(st.faF || {}), ...x } }));
  const inR = (v: number, lo?: number, hi?: number) => (lo == null || v >= lo) && (hi == null || v <= hi);
  const posOk = (p: any) =>
    !F.pos ||
    F.pos === 'any' ||
    (F.pos.length === 1
      ? P[p.id]?.grp === F.pos
      : p.pos === F.pos ||
        ({ GF: ['SG', 'SF'], FC: ['PF', 'C'], G: ['PG', 'SG'], F: ['SF', 'PF'] } as Record<string, string[]>)[p.pos]?.includes(F.pos));
  const all = vm.faRows || [];
  const sf = useSearchFilter();
  const rows = all
    .filter((p: any) => !tg || listed.has(p.id))
    .filter((p: any) => f === 'all' || (f === 'gl' ? !!p.glT : !p.glT))
    .filter(byTrait(vm, tk))
    .filter(sf.test)
    .filter(
      (p: any) =>
        (!F.can || !p.cant) &&
        posOk(p) &&
        inR(p.age, F.ageMin, F.ageMax) &&
        inR(p.ovr, F.ovrMin, F.ovrMax) &&
        inR(p.pot, F.potMin, F.potMax) &&
        (F.askMax == null || (p.ask ?? 0) <= F.askMax + 1e-9),
    );
  const nGl = all.filter((p: any) => p.glT).length,
    nCan = all.filter((p: any) => !p.cant).length;
  const active =
    f !== 'all' || tg || !!tk || sf.active || Object.entries(F).some(([k, v]) => v != null && v !== false && !(k === 'pos' && v === 'any'));
  const reset = () => {
    setF('all');
    setTg(false);
    setTk('');
    sf.clear();
    gm.setState({ faF: {} });
  };
  const ids = s.rosters[s.me] || [],
    lim = rosterMax(s),
    std = stdIds(gm, ids).length,
    tw = twoWayIds(gm, ids).length,
    inSeason = ['regular', 'playin', 'playoffs'].includes(s.phase);
  const qos = s.phase === 'fa' ? pendingQOs(gm, s, s.me) : [];
  // The assistant GM: press to highlight his picks (the rest dim); press again to turn it off.
  // The picks stay put while you page, sort or filter, until you turn him off.
  const adv: FaAdvice | null = s.faAsk || null,
    advPick = new Map((adv?.picks || []).map(x => [x.pid, x]));
  const toggleAsk = () => gm.setState(st => ({ faAsk: st.faAsk ? null : faAdvice(gm, st, st.me) }));
  const sc = useScoutSelect(
    vm,
    rows.map((p: any) => p.id),
  );
  const pg = usePaged(rows, 'free agents', 25);
  if (vm.dense)
    return (
      <FaDense
        vm={vm}
        all={all}
        rows={rows}
        pg={pg}
        sc={sc}
        sf={sf}
        F={F}
        setFF={setFF}
        f={f}
        setF={setF}
        tk={tk}
        setTk={setTk}
        more={more}
        setMore={setMore}
        tg={tg}
        setTg={setTg}
        listed={listed}
        nGl={nGl}
        nCan={nCan}
        active={active}
        reset={reset}
        adv={adv}
        advPick={advPick}
        toggleAsk={toggleAsk}
        std={std}
        tw={tw}
        lim={lim}
        qos={qos}
      />
    );
  return (
    <>
      <FATracker vm={vm} />
      <CapBar gm={vm.ctx.gm} s={vm.ctx.s} tid={vm.ctx.s.me} />
      {(vm.ctx.s.offerSheets || []).length > 0 && (
        <div
          style={{
            padding: '8px 12px',
            marginBottom: '12px',
            border: '1px solid var(--color-accent)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          <span style={{ flex: 1 }}>
            Another team signed one of your restricted free agents to an offer sheet. Match it or let him go in your Mailbox.
          </span>
          <button
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '4px 10px' }}
            onClick={() => vm.ctx.gm.setState({ screen: 'mail' })}
          >
            Open the Mailbox
          </button>
        </div>
      )}
      <div style={{ fontSize: '12.5px', margin: '0 0 8px', color: std > (inSeason ? 15 : 21) ? 'var(--gm-bad)' : undefined }}>
        <b>Your roster:</b> {std} of {lim} standard contracts
        {qos.length > 0 && (
          <b style={{ color: std + qos.length > seasonMax(vm.ctx.s) ? 'var(--gm-bad)' : 'var(--accent-ink)' }}>
            {' '}
            + {qos.length} qualifying offer{qos.length === 1 ? '' : 's'} out
          </b>
        )}
        {lim > 15 ? (
          <span style={muted}>
            {' '}
            (up to 21 in the offseason, including Exhibit 10 camp deals; cut to 15 by opening night
            {std > 15 ? ': ' + (std - 15) + ' to go' : ''})
          </span>
        ) : (
          <span style={muted}> (15 in season; a hardship exception can add a 16th when 4+ players are out)</span>
        )}{' '}
        · {tw} of 3 two-way
      </div>
      {qos.length > 0 &&
        (() => {
          const max = seasonMax(vm.ctx.s),
            tot = std + qos.length,
            over = tot - max;
          return (
            <div
              style={{
                padding: '8px 12px',
                margin: '0 0 10px',
                border: '1px solid ' + (over > 0 ? 'var(--gm-bad)' : 'var(--color-accent)'),
                borderRadius: 'var(--radius-md)',
                fontSize: '12.5px',
              }}
            >
              <b>Qualifying offers out ({qos.length}):</b>{' '}
              {qos.map((q: any, i: number) => (
                <span key={q.id}>
                  {i ? ', ' : ''}
                  <Link pid={q.id} onClick={() => vm.ctx.open(q.id)}>
                    {q.name}
                  </Link>{' '}
                  <span style={muted}>({fmtM(q.rfa.qo)})</span>
                </span>
              ))}
              . If no other team signs them by training camp, they take your offer (one year) and join your roster. With them you’d have{' '}
              <b>{tot}</b> standard contracts; opening night allows {max}
              {over > 0 ? (
                <b style={{ color: 'var(--gm-bad)' }}>: {over} too many, and cutting a player costs his guaranteed salary</b>
              ) : (
                ''
              )}
              . To take one back, renounce him on the <Link onClick={() => vm.ctx.gm.setState({ screen: 'capsheet' })}>Cap sheet</Link>{' '}
              (that also clears his cap hold and Bird rights).
            </div>
          );
        })()}
      <div className="card" style={{ padding: '10px 12px', margin: '0 0 10px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            className={F.can ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '12.5px' }}
            onClick={() => setFF({ can: true })}
            title="Only players you can sign right now: your cap room, an exception or his Bird rights reaches what he asks of you, and he’d sign on those terms (roster spots, hard caps and the two-way limit count too)"
          >
            Players you can sign now · {nCan}
          </button>
          <button
            className={!F.can ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '12.5px' }}
            onClick={() => setFF({ can: false })}
          >
            Show every player in free agency · {all.length}
          </button>
          <span style={{ flex: 1 }} />
          <button
            className={adv ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ fontSize: '12.5px', background: adv ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)' : undefined }}
            onClick={toggleAsk}
            aria-pressed={!!adv}
            title={adv ? 'Turn off the assistant GM’s picks' : 'Ask your assistant GM who to sign for the season'}
          >
            {adv ? '✓ Assistant GM’s picks · turn off' : 'Ask the assistant GM'}
          </button>
          <button className="btn btn-ghost" style={{ fontSize: '12.5px' }} disabled={!active} onClick={reset}>
            Reset all filters
          </button>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <Range label="Age" lo={F.ageMin} hi={F.ageMax} onLo={v => setFF({ ageMin: v })} onHi={v => setFF({ ageMax: v })} />
          <Range label="Overall" lo={F.ovrMin} hi={F.ovrMax} onLo={v => setFF({ ovrMin: v })} onHi={v => setFF({ ovrMax: v })} />
          <Range label="Potential" lo={F.potMin} hi={F.potMax} onLo={v => setFF({ potMin: v })} onHi={v => setFF({ potMax: v })} />
          <Range label="Asking up to $" hi={F.askMax} onHi={v => setFF({ askMax: v })} step={0.5} width={64} hiPh="M" />
          <select
            className="input"
            value={F.pos || 'any'}
            onChange={e => setFF({ pos: e.target.value })}
            style={{ padding: '3px 6px', fontSize: '12.5px', width: 'auto' }}
          >
            {POS_F.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Seg<'all' | 'gl' | 'home'>
            value={f}
            options={[
              ['all', 'All ' + all.length],
              ['gl', 'In the CCP ' + nGl],
              ['home', 'Unsigned ' + (all.length - nGl)],
            ]}
            onChange={setF}
          />
          <TraitFilter value={tk} onChange={setTk} />
          <span style={{ fontSize: '12px', color: 'var(--color-neutral-700)' }}>
            Ranges include both ends (Age 19 to 21 means 19, 20 and 21). CCP players are on standard CCP deals: any NBA team can call them
            up by signing them.
          </span>
        </div>
        {active && (
          <div style={{ ...muted, fontSize: '12px' }}>
            Showing {rows.length} of {all.length} free agents.
          </div>
        )}
      </div>
      {adv && (
        <div className="card" style={{ padding: '10px 12px', margin: '0 0 10px', borderLeft: '3px solid var(--color-accent)' }}>
          <div style={{ fontSize: '12.5px' }}>
            <b>{adv.by.name}</b> <span style={muted}>· {adv.by.role}</span>
          </div>
          <div style={{ fontSize: '12.5px', margin: '2px 0 6px' }}>“{adv.summary}”</div>
          {adv.picks.map(x => {
            const p = P[x.pid],
              gone = !(s.fa || []).includes(x.pid);
            return (
              <div
                key={x.pid}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline',
                  fontSize: '12.5px',
                  padding: '3px 0',
                  borderTop: '1px solid color-mix(in srgb, var(--color-divider) 50%, transparent)',
                  opacity: gone ? 0.5 : 1,
                }}
              >
                <span style={{ fontWeight: 700, width: 22, color: vm.ctx.tone(p.ovr) }}>{p.ovr}</span>
                <span style={{ whiteSpace: 'nowrap' }}>
                  <Link onClick={() => vm.ctx.open(x.pid)}>{p.name}</Link>{' '}
                  <span style={muted}>
                    {p.pos} · {p.age}
                  </span>
                  {x.kind === 'twoWay' && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        marginLeft: 6,
                        padding: '0 6px',
                        borderRadius: 999,
                        border: '1px solid #6b8fd6',
                        color: '#6b8fd6',
                      }}
                    >
                      two-way
                    </span>
                  )}
                </span>
                <span style={{ flex: 1 }}>{gone ? 'Signed elsewhere or with you.' : x.why}</span>
                {!gone && (
                  <button
                    className="btn btn-primary"
                    style={{ fontSize: '12px', padding: '2px 10px' }}
                    onClick={() => gm.setState({ dialog: { type: 'sign', pid: x.pid } })}
                  >
                    Sign
                  </button>
                )}
              </div>
            );
          })}
          <div style={{ ...muted, fontSize: '11.5px', marginTop: 4 }}>
            His picks are highlighted in the list below; everyone else is dimmed. Press the button again to turn this off.
          </div>
        </div>
      )}
      {sf.bar}
      {sc.bar()}
      {sc.Menu()}
      <table data-tour="fa-table" className="table" style={{ fontSize: '13px' }}>
        <thead>
          <tr>
            {sc.head()}
            {(vm.faCols || []).map((c: any, i: number) => (
              <th
                key={i}
                onClick={c.onClick}
                style={{
                  padding: '6px 8px',
                  textAlign: c.align,
                  cursor: 'pointer',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                  color: c.color,
                }}
              >
                {c.label}
                {c.arrow}
              </th>
            ))}
            <th style={{ padding: '6px 8px' }}>How you can sign him</th>
            <th style={{ padding: '6px 8px' }}></th>
          </tr>
        </thead>
        <tbody>
          {pg.rows.map((p: any, i: number) => (
            <tr
              key={i}
              {...sc.row(p.id)}
              style={{
                userSelect: 'none',
                background: sc.isSel(p.id) || advPick.has(p.id) ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined,
                boxShadow: advPick.has(p.id) ? 'inset 3px 0 0 var(--color-accent)' : undefined,
                opacity: adv && !advPick.has(p.id) ? 0.35 : 1,
                transition: 'opacity .15s',
              }}
            >
              {sc.cell(p.id)}
              <td style={{ padding: '4px 8px' }}>
                <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                  <img
                    src={p.flag}
                    alt=""
                    title={p.cname}
                    style={{ width: '16px', height: '11px', objectFit: 'cover', outline: '1px solid var(--color-divider)' }}
                  />
                  <button
                    className="hv6"
                    onClick={p.open}
                    title={p.name}
                    style={{ all: 'unset', cursor: 'pointer', color: 'var(--color-accent-700)', ...PN }}
                  >
                    {p.name}
                  </button>
                  {sc.tag(p.id)}
                  {vm.ctx.gm.db.P[p.id]?.rfa?.tid === vm.ctx.s.me && (
                    <span
                      title={
                        'You extended him a ' +
                        fmtM(vm.ctx.gm.db.P[p.id].rfa.qo) +
                        ' qualifying offer: unsigned at training camp, he takes it and joins your roster'
                      }
                      style={{
                        fontSize: '10.5px',
                        padding: '0 6px',
                        borderRadius: 999,
                        border: '1px solid var(--color-accent)',
                        color: 'var(--accent-ink)',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}
                    >
                      Your QO · {fmtM(vm.ctx.gm.db.P[p.id].rfa.qo)}
                    </span>
                  )}
                  {(p.topBadges || []).map((b: any) => (
                    <BadgeChip key={b.key} b={b} small />
                  ))}
                  {p.udT && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        padding: '0 6px',
                        borderRadius: 999,
                        border: '1px solid var(--color-divider)',
                        color: 'var(--color-neutral-700)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.udT}
                    </span>
                  )}
                  {advPick.has(p.id) && (
                    <span
                      title={advPick.get(p.id)!.why}
                      style={{
                        fontSize: '10.5px',
                        padding: '0 6px',
                        borderRadius: 999,
                        border: '1px solid var(--color-accent)',
                        color: 'var(--accent-ink)',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}
                    >
                      {advPick.get(p.id)!.kind === 'twoWay' ? 'Assistant: two-way' : 'Assistant pick'}
                    </span>
                  )}
                  {p.glT && (
                    <span
                      title={p.glLine}
                      style={{
                        fontSize: '10.5px',
                        padding: '0 6px',
                        borderRadius: 999,
                        border: '1px solid #6b8fd6',
                        color: '#6b8fd6',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      CCP · {p.glT}
                    </span>
                  )}
                </span>
              </td>
              <td style={{ padding: '4px 8px' }}>{p.pos}</td>
              <td title={p.lastTitle} style={{ padding: '4px 8px', whiteSpace: 'nowrap' }}>
                {p.lastAbbr ? (
                  <button
                    className="hv6"
                    onClick={p.lastOpen}
                    style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', gap: '5px', alignItems: 'center' }}
                  >
                    {p.lastLogo}
                    {p.lastAbbr}
                    {p.lastD && <span style={{ fontSize: '11px', color: 'var(--color-neutral-600)' }}>(drafted)</span>}
                  </button>
                ) : (
                  <span style={{ color: 'var(--color-neutral-600)' }}>—</span>
                )}
              </td>
              <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{p.age}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', color: p.tone, fontWeight: '600' }}>{p.ovr}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap', color: p.ptone }}>{p.pot}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{p.askS}</td>
              <td style={{ padding: '4px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>{p.exp}</td>
              <td style={{ padding: '4px 8px' }}>
                <span className="tag" style={{ background: p.moodBg, color: p.moodFg, padding: '1px 8px' }}>
                  {p.mood}
                </span>
              </td>
              <td style={{ padding: '4px 8px', fontSize: '12px' }}>{p.mot}</td>
              <td style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--color-neutral-700)' }}>{p.how}</td>
              <td style={{ padding: '3px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button className="btn btn-primary" onClick={p.sign} disabled={p.cant} style={{ fontSize: '12px', padding: '3px 12px' }}>
                  Sign
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {pg.pager}
      <p style={{ margin: '10px 0 0', color: 'var(--color-neutral-700)', fontSize: '12px' }}>{vm.faNote}</p>
    </>
  );
}

// ── Hadrian's Lover (Settings → Screen design): the same market, denser ──
// The money you sign with in one strip, filters on one line (the rest under More filters), one table:
// badges as three-letter chips, mood as an Interest bar, ask and end year together, where he'd slot on your
// roster (Role here), how you'd pay, and a ★ that puts him on a shortlist (Free agency targets).
const TARGETS = 'Free agency targets';
const INTEREST: Record<string, [number, string]> = {
  Eager: [88, 'var(--gm-good)'],
  Open: [60, 'var(--color-accent)'],
  Reluctant: [28, 'var(--gm-bad)'],
};
function FaDense(props: any) {
  const { vm, all, rows, pg, sc, sf, F, setFF, f, setF, tk, setTk, more, setMore, tg, setTg, listed, nGl, nCan, active, reset } = props,
    { adv, advPick, toggleAsk, std, tw, lim, qos } = props;
  const { gm, s, open } = vm.ctx,
    P = gm.db.P,
    N = nums(gm);
  const C: Record<string, any> = Object.fromEntries((vm.faCols || []).map((c: any) => [c.key, c]));
  // The money strip
  const sal = teamSalary(gm, s, s.me),
    room = Math.max(0, N.CAP - teamSalary(gm, s, s.me, { holds: true })),
    e = exceptionsOf(gm, s, s.me),
    mleUsed = e.used.includes('ntmle') || e.used.includes('tpmle'),
    bird = all.filter((p: any) => !p.cant && /Bird/.test(p.how || '')).length;
  const money: [string, string, string, string?][] = [
    ['Cap room', fmtM(room), 'counting cap holds', room > 0 ? 'var(--gm-good)' : undefined],
    [
      'Mid-level',
      mleUsed ? 'Used' : e.used.includes('cap') ? 'Gone' : fmtM(e.ntmle),
      mleUsed ? '' : e.used.includes('cap') ? 'room exception ' + fmtM(e.room) : 'taxpayer ' + fmtM(e.tpmle),
      mleUsed || e.used.includes('cap') ? 'var(--color-neutral-600)' : undefined,
    ],
    ['Bi-annual', e.used.includes('bae') ? 'Used' : fmtM(e.bae), '', e.used.includes('bae') ? 'var(--color-neutral-600)' : undefined],
    ['Bird rights', bird + ' player' + (bird === 1 ? '' : 's'), 're-sign over the cap'],
    ['Payroll', fmtM(sal), 'cap ' + fmtM(N.CAP) + ' · tax ' + fmtM(N.TAX), sal > N.TAX ? 'var(--gm-bad)' : undefined],
    [
      'Roster',
      std + ' of ' + lim + (qos.length ? ' + ' + qos.length + ' QO' : ''),
      lim > 15 ? seasonMax(s) + ' by opening night' : '',
      std + qos.length > seasonMax(s) && lim <= 15 ? 'var(--gm-bad)' : undefined,
    ],
    ['Two-way', tw + ' of ' + TWO_WAY_MAX, ''],
  ];
  const star = (id: number) =>
    gm.setState((st: any) => {
      const ls = st.lists || [];
      if (ls.some((l: any) => l.ids.includes(id)))
        return { lists: ls.map((l: any) => ({ ...l, ids: l.ids.filter((x: number) => x !== id) })) };
      const L = ls.find((l: any) => l.name === TARGETS);
      return {
        lists: L
          ? ls.map((l: any) => (l.id === L.id ? { ...l, ids: [...l.ids, id] } : l))
          : [...ls, { id: 'l' + Date.now(), name: TARGETS, ids: [id] }],
      };
    });
  const listName = (id: number) => (s.lists || []).find((l: any) => l.ids.includes(id))?.name;
  const nT = all.filter((p: any) => listed.has(p.id)).length;
  const pill = (on: boolean): React.CSSProperties => ({
    all: 'unset',
    cursor: 'pointer',
    fontSize: '12.5px',
    padding: '3px 11px',
    borderRadius: 999,
    border: '1px solid ' + (on ? 'var(--color-accent)' : 'var(--color-divider)'),
    background: on ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : undefined,
    color: on ? 'var(--color-accent-700)' : 'var(--color-text)',
    fontWeight: on ? 600 : 400,
  });
  const th = (k: string | null, label: string, left?: boolean) => {
    const c = k ? C[k] : null;
    return (
      <th
        onClick={c?.onClick}
        style={{
          padding: '5px 7px',
          textAlign: left ? 'left' : 'right',
          cursor: c ? 'pointer' : undefined,
          userSelect: 'none',
          whiteSpace: 'nowrap',
          color: c?.color,
        }}
      >
        {label}
        {c?.arrow}
      </th>
    );
  };
  const td: React.CSSProperties = { padding: '4px 7px', whiteSpace: 'nowrap', textAlign: 'right' },
    tl: React.CSSProperties = { ...td, textAlign: 'left' };
  const rangeTxt = [
    F.ageMin != null || F.ageMax != null ? 'Age ' + (F.ageMin ?? '…') + '–' + (F.ageMax ?? '…') : '',
    F.ovrMin != null || F.ovrMax != null ? 'Ovr ' + (F.ovrMin ?? '…') + '–' + (F.ovrMax ?? '…') : '',
    F.potMin != null || F.potMax != null ? 'Pot ' + (F.potMin ?? '…') + '–' + (F.potMax ?? '…') : '',
    F.askMax != null ? 'Ask ≤ $' + F.askMax + 'M' : '',
    F.pos && F.pos.length > 1 && F.pos !== 'any' ? F.pos : '',
    f === 'gl' ? 'In the CCP' : f === 'home' ? 'Not in the CCP' : '',
    tk ? 'Trait filter' : '',
  ].filter(Boolean);
  return (
    <>
      <FATracker vm={vm} />
      <section
        aria-label="Your money"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 0',
          padding: '8px 0',
          marginBottom: 10,
          border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-md)',
          background: 'color-mix(in srgb, var(--color-text) 3%, transparent)',
        }}
      >
        {money.map(([k, v, sub, c], i) => (
          <div
            key={k}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              padding: '0 14px',
              borderLeft: i ? '1px solid var(--color-divider)' : undefined,
            }}
          >
            <span style={{ ...muted, fontSize: '11.5px' }}>{k}</span>
            <b style={{ fontSize: '14px', color: c }}>{v}</b>
            {sub && <span style={{ ...muted, fontSize: '11px' }}>{sub}</span>}
          </div>
        ))}
      </section>
      {(s.offerSheets || []).length > 0 && (
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '12.5px', marginBottom: 8 }}>
          <b style={{ color: 'var(--accent-ink)' }}>An offer sheet is waiting on one of your restricted free agents.</b>
          <button
            className="btn btn-primary"
            style={{ fontSize: '12px', padding: '2px 10px' }}
            onClick={() => gm.setState({ screen: 'mail' })}
          >
            Answer it in the Mailbox
          </button>
        </div>
      )}
      {qos.length > 0 && (
        <div style={{ fontSize: '12.5px', marginBottom: 8 }}>
          <b>Qualifying offers out:</b>{' '}
          {qos.map((q: any, i: number) => (
            <span key={q.id}>
              {i ? ', ' : ''}
              <Link pid={q.id} onClick={() => open(q.id)}>
                {q.name}
              </Link>{' '}
              <span style={muted}>({fmtM(q.rfa.qo)})</span>
            </span>
          ))}
          <span style={muted}> · unsigned at camp, they take it and join you · with them </span>
          <b style={{ color: std + qos.length > seasonMax(s) ? 'var(--gm-bad)' : undefined }}>
            {std + qos.length} of {seasonMax(s)}
          </b>
          <span style={muted}> by opening night · take one back by renouncing him on the </span>
          <Link onClick={() => gm.setState({ screen: 'capsheet' })}>Cap sheet</Link>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
        <span style={{ display: 'inline-flex', gap: 6 }}>
          <button
            style={pill(!!F.can)}
            onClick={() => setFF({ can: true })}
            title="Only players you can sign right now: a way to pay him that reaches what he asks of you, on terms he'd take"
          >
            You can sign · {nCan}
          </button>
          <button style={pill(!F.can)} onClick={() => setFF({ can: false })}>
            Everyone · {all.length}
          </button>
          <button style={pill(tg)} onClick={() => setTg(!tg)} title="Players on any of your shortlists">
            ★ Targets · {nT}
          </button>
        </span>
        <span style={{ width: 1, height: 20, background: 'var(--color-divider)' }} />
        <span style={{ display: 'inline-flex', gap: 4 }}>
          {(
            [
              ['any', 'Any'],
              ['G', 'Guards'],
              ['W', 'Wings'],
              ['B', 'Bigs'],
            ] as [string, string][]
          ).map(([k, l]) => {
            const on = (F.pos || 'any') === k;
            return (
              <button
                key={k}
                className={on ? 'btn btn-primary' : 'btn btn-secondary'}
                style={{ fontSize: '12px', padding: '2px 9px' }}
                onClick={() => setFF({ pos: k })}
              >
                {l}
              </button>
            );
          })}
        </span>
        {rangeTxt.length > 0 && <span style={{ fontSize: '12px', color: 'var(--color-accent-700)' }}>{rangeTxt.join(' · ')}</span>}
        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '2px 9px' }} onClick={() => setMore(!more)}>
          More filters {more ? '▴' : '▾'}
        </button>
        {active && (
          <button className="btn btn-ghost" style={{ fontSize: '12px', padding: '2px 8px' }} onClick={reset}>
            Reset
          </button>
        )}
        <span style={{ flex: 1 }} />
        <button
          className={adv ? 'btn btn-primary' : 'btn btn-secondary'}
          style={{ fontSize: '12.5px', background: adv ? 'color-mix(in srgb, var(--color-accent) 22%, transparent)' : undefined }}
          onClick={toggleAsk}
          aria-pressed={!!adv}
          title={adv ? 'Turn off the assistant GM’s picks' : 'Ask your assistant GM who to sign for the season'}
        >
          {adv ? '✓ Assistant GM’s picks · turn off' : 'Ask the assistant GM'}
        </button>
      </div>
      {more && (
        <div
          style={{
            display: 'flex',
            gap: '8px 14px',
            alignItems: 'center',
            flexWrap: 'wrap',
            padding: '8px 10px',
            marginBottom: 8,
            border: '1px solid var(--color-divider)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Range label="Age" lo={F.ageMin} hi={F.ageMax} onLo={v => setFF({ ageMin: v })} onHi={v => setFF({ ageMax: v })} />
          <Range label="Overall" lo={F.ovrMin} hi={F.ovrMax} onLo={v => setFF({ ovrMin: v })} onHi={v => setFF({ ovrMax: v })} />
          <Range label="Potential" lo={F.potMin} hi={F.potMax} onLo={v => setFF({ potMin: v })} onHi={v => setFF({ potMax: v })} />
          <Range label="Asking up to $" hi={F.askMax} onHi={v => setFF({ askMax: v })} step={0.5} width={64} hiPh="M" />
          <select
            className="input"
            value={F.pos || 'any'}
            onChange={e => setFF({ pos: e.target.value })}
            style={{ padding: '3px 6px', fontSize: '12.5px', width: 'auto' }}
          >
            {POS_F.map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
          <Seg<'all' | 'gl' | 'home'>
            value={f}
            options={[
              ['all', 'All ' + all.length],
              ['gl', 'In the CCP ' + nGl],
              ['home', 'Unsigned ' + (all.length - nGl)],
            ]}
            onChange={setF}
          />
          <TraitFilter value={tk} onChange={setTk} />
          <div style={{ flexBasis: '100%' }}>{sf.bar}</div>
          <span style={{ ...muted, fontSize: '11.5px' }}>
            Ranges include both ends. CCP players are on CCP deals: any NBA team can call them up by signing them.
          </span>
        </div>
      )}
      {adv && (
        <div style={{ fontSize: '12.5px', margin: '0 0 8px', padding: '6px 10px', borderLeft: '3px solid var(--color-accent)' }}>
          <b>{adv.by.name}</b> <span style={muted}>({adv.by.role})</span>: “{adv.summary}”{' '}
          <span style={muted}>His picks are highlighted below.</span>
        </div>
      )}
      {active && (
        <div style={{ ...muted, fontSize: '12px', marginBottom: 4 }}>
          Showing {rows.length} of {all.length} free agents.
        </div>
      )}
      {sf.active && !more && sf.bar}
      {sc.bar(true)}
      {sc.Menu()}
      <div
        data-tour="fa-table"
        style={{
          width: 'fit-content',
          maxWidth: '100%',
          border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-md)',
          overflowX: 'auto',
        }}
      >
        <table style={{ borderCollapse: 'collapse', fontSize: '13px', fontVariantNumeric: 'tabular-nums' }}>
          <thead>
            <tr style={{ fontSize: '11.5px' }}>
              {sc.head()}
              <th style={{ width: 18 }} />
              {th('name', 'Player', true)}
              {th('pos', 'Pos', true)}
              {th('age', 'Age')}
              {th('ovr', 'Ovr')}
              {th('pot', 'Pot')}
              {th('last', 'Last', true)}
              {th('ask', 'Asking for')}
              {th('mood', 'Interest', true)}
              <th />
            </tr>
          </thead>
          <tbody>
            {pg.rows.map((p: any, i: number) => {
              const pp = P[p.id],
                on = listed.has(p.id),
                pick = advPick.get(p.id),
                [iw, ic] = INTEREST[pp.mood] || INTEREST.Open;
              return (
                <tr
                  key={p.id}
                  {...sc.row(p.id)}
                  style={{
                    userSelect: 'none',
                    borderTop: '1px solid var(--color-divider)',
                    background:
                      sc.isSel(p.id) || pick
                        ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)'
                        : i % 2
                          ? 'color-mix(in srgb, var(--color-text) 3%, transparent)'
                          : undefined,
                    boxShadow: pick ? 'inset 3px 0 0 var(--color-accent)' : undefined,
                    opacity: adv && !pick ? 0.35 : 1,
                  }}
                >
                  {sc.cell(p.id)}
                  <td style={{ ...tl, paddingRight: 0 }}>
                    <button
                      onClick={() => star(p.id)}
                      aria-pressed={on}
                      aria-label={(on ? 'Take ' : 'Add ') + p.name + (on ? ' off your shortlist' : ' to your targets')}
                      title={
                        on
                          ? 'On your shortlist “' + listName(p.id) + '”. Click to take him off.'
                          : 'Add to “' + TARGETS + '” (his moves show up in your Mailbox)'
                      }
                      style={{ all: 'unset', cursor: 'pointer', color: on ? 'var(--color-accent)' : 'var(--color-neutral-500)' }}
                    >
                      {on ? '★' : '☆'}
                    </button>
                  </td>
                  <td style={tl}>
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <img
                        src={p.flag}
                        alt=""
                        title={p.cname}
                        style={{ width: 16, height: 11, objectFit: 'cover', outline: '1px solid var(--color-divider)' }}
                      />
                      <button
                        className="hv6"
                        onClick={p.open}
                        title={p.name + (p.udT ? ' · ' + p.udT : '')}
                        style={{
                          all: 'unset',
                          cursor: 'pointer',
                          color: 'var(--color-accent-700)',
                          fontWeight: p.ovr >= 55 ? 600 : 400,
                          ...PN,
                        }}
                      >
                        {p.name}
                      </button>
                      {sc.tag(p.id)}
                      <MiniBadges list={knownBadges(gm, s, pp).list} />
                      {pp.rfa?.tid === s.me && (
                        <span
                          title={
                            'Your ' + fmtM(pp.rfa.qo) + ' qualifying offer: unsigned at training camp, he takes it and joins your roster'
                          }
                          style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-ink)' }}
                        >
                          QO
                        </span>
                      )}
                      {pp.rfa && pp.rfa.tid !== s.me && (
                        <span
                          title="Restricted free agent: his team can match an offer sheet"
                          style={{ fontSize: '10px', color: 'var(--color-neutral-600)' }}
                        >
                          RFA
                        </span>
                      )}
                      {p.glT && (
                        <span title={p.glLine} style={{ fontSize: '10px', color: '#6b8fd6' }}>
                          CCP
                        </span>
                      )}
                      {pick && (
                        <span title={pick.why} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-ink)' }}>
                          {pick.kind === 'twoWay' ? 'GM: two-way' : 'GM pick'}
                        </span>
                      )}
                    </span>
                  </td>
                  <td style={tl}>{p.pos}</td>
                  <td style={td}>{p.age}</td>
                  <td style={{ ...td, fontWeight: 700, color: p.tone }}>{p.ovr}</td>
                  <td style={{ ...td, color: p.ptone }}>{p.pot}</td>
                  <td title={p.lastTitle} style={tl}>
                    {p.lastAbbr ? (
                      <button
                        className="hv6"
                        onClick={p.lastOpen}
                        style={{ all: 'unset', cursor: 'pointer', display: 'inline-flex', gap: 5, alignItems: 'center' }}
                      >
                        {p.lastLogo}
                        {p.lastAbbr}
                        {p.lastD && <span style={{ fontSize: '10.5px' }}>(drafted)</span>}
                      </button>
                    ) : (
                      <span style={{ color: 'var(--color-neutral-600)' }}>—</span>
                    )}
                  </td>
                  <td style={td} title={'A year, through ' + pp.exp + (pp.rfa ? ' · restricted free agent' : '')}>
                    {fmtM(p.ask)} <span style={{ fontSize: '11.5px' }}>· {pp.exp}</span>
                  </td>
                  <td style={tl} title={pp.mood + ' about your team · wants ' + String(p.mot).toLowerCase()}>
                    <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                      <span
                        style={{
                          width: 40,
                          height: 5,
                          borderRadius: 3,
                          background: 'var(--color-divider)',
                          position: 'relative',
                          display: 'inline-block',
                        }}
                      >
                        <span
                          style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: iw + '%', borderRadius: 3, background: ic }}
                        />
                      </span>
                      <span style={{ fontSize: '12px', color: ic }}>{pp.mood}</span>
                    </span>
                  </td>
                  <td style={{ ...td, padding: '3px 7px' }} title={p.how}>
                    <button
                      className="btn btn-primary"
                      onClick={p.sign}
                      disabled={p.cant}
                      title={p.how}
                      style={{ fontSize: '12px', padding: '2px 12px' }}
                    >
                      Sign
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pg.pager}
      <p style={{ margin: '8px 0 0', ...muted, fontSize: '11.5px' }}>
        Badges: hover the chips for names. Interest is his mood about your team (hover for what he wants). Asking for: the yearly salary he
        wants from you and the year it runs through. Hover Sign to see how you'd pay him (or why you can't). ★ puts him on a shortlist.{' '}
        {vm.faNote}
      </p>
    </>
  );
}
