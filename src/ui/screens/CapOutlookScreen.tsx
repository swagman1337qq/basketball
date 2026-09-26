// Salary cap outlook: the real cap since 1984-85 and the projected cap every season for
// the next 500 years, which the league follows. Chart on a log scale, table by decade.
import { useState } from 'react';
import type { VM } from '../vm';
import { CAP_HISTORY, capProjection, fmtMoney } from '../../engine/capModel';
import { muted, ruleH4, Seg } from '../kit';

export function CapOutlookScreen({ vm }: { vm: VM }) {
  const { gm } = vm.ctx, Y = gm.Y;
  const proj = capProjection();
  const [range, setRange] = useState<'50' | '100' | '500'>('50');
  const [decade, setDecade] = useState<number>(Math.floor(Y / 10) * 10);
  const horizon = range === '50' ? 2076 : range === '100' ? 2126 : 2526;
  const pts: [number, number, boolean][] = [...CAP_HISTORY.map(([y, c]) => [y, c, true] as [number, number, boolean]), ...proj.filter(x => x.season <= horizon).map(x => [x.season, x.cap, false] as [number, number, boolean])];
  const W = 900, H = 260, x0 = 1985, x1 = horizon, lmin = Math.log10(3), lmax = Math.log10(Math.max(...pts.map(p => p[1])) * 1.2);
  const X = (y: number) => 40 + ((y - x0) / (x1 - x0)) * (W - 60), Yp = (c: number) => H - 24 - ((Math.log10(c) - lmin) / (lmax - lmin)) * (H - 40);
  const line = (ps: [number, number, boolean][]) => ps.map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ' ' + Yp(p[1]).toFixed(1)).join(' ');
  const hist = pts.filter(p => p[2]), fut = [pts.filter(p => p[2]).slice(-1)[0], ...pts.filter(p => !p[2])];
  const ticks = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9].filter(t => Math.log10(t) >= lmin && Math.log10(t) <= lmax);
  const cur = proj.find(x => x.season === Y), next = proj.find(x => x.season === Y + 1);
  const decades = [...new Set(proj.map(x => Math.floor(x.season / 10) * 10))];
  const avg = (a: number, b: number) => { const xs = proj.filter(x => x.season >= a && x.season <= b); return xs.length > 1 ? (Math.pow(xs[xs.length - 1].cap / xs[0].cap, 1 / (xs.length - 1)) - 1) * 100 : 0; };
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '24px', marginBottom: '20px' }}>
        {[['This season', cur ? fmtMoney(cur.cap) : fmtMoney(gm.CAP), cur ? (cur.growth >= 0 ? '+' : '') + cur.growth + '% ' + (cur.note || '') : ''], ['Next season', next ? fmtMoney(next.cap) : '—', next ? (next.growth >= 0 ? '+' : '') + next.growth + '% ' + (next.note || '') : ''], ['Next 10 years', (avg(Y, Y + 10) >= 0 ? '+' : '') + avg(Y, Y + 10).toFixed(2) + '% / yr', 'Average growth'], ['Long run (2200+)', '+' + avg(2200, 2526).toFixed(2) + '% / yr', 'Inflation plus modest real growth']].map(([k, v, sub]) => (
          <div key={k} style={{ borderTop: '1px solid var(--color-text)', paddingTop: '8px' }}><div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.1em', textTransform: 'uppercase' }}>{k}</div><div style={{ fontFamily: 'var(--font-heading)', fontSize: '30px' }}>{v}</div><div style={{ ...muted, fontSize: '12px' }}>{sub}</div></div>
        ))}
      </div>
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h4 style={{ ...ruleH4, flex: 1, marginRight: '12px' }}>Salary cap, 1984-85 to {horizon - 1}–{String(horizon).slice(2)} (log scale)</h4><Seg<'50' | '100' | '500'> value={range} options={[['50', '50 years'], ['100', '100 years'], ['500', '500 years']]} onChange={setRange} /></div>
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: W }} role="img" aria-label="Salary cap history and projection">
          {ticks.map(t => <g key={t}><line x1={40} x2={W - 20} y1={Yp(t)} y2={Yp(t)} stroke="var(--color-divider)" /><text x={36} y={Yp(t) + 4} textAnchor="end" fontSize="10" fill="var(--color-neutral-600)">{fmtMoney(t)}</text></g>)}
          <line x1={X(Y)} x2={X(Y)} y1={10} y2={H - 24} stroke="var(--color-accent)" strokeDasharray="4 4" />
          <text x={X(Y) + 4} y={20} fontSize="10" fill="var(--color-accent-700)">now</text>
          <path d={line(hist)} fill="none" stroke="var(--color-text)" strokeWidth="2" />
          <path d={line(fut)} fill="none" stroke="var(--gm-good)" strokeWidth="2" strokeDasharray="5 3" />
          {[1985, 2000, 2026, ...(horizon > 2100 ? [2100] : []), ...(horizon > 2200 ? [2200, 2300, 2400] : []), horizon].map(y => <text key={y} x={X(y)} y={H - 6} fontSize="10" textAnchor="middle" fill="var(--color-neutral-600)">{y}</text>)}
        </svg>
        <p style={{ ...muted, fontSize: '12px', margin: '4px 0 18px' }}>Solid: the real cap. Dashed: the projection this league follows. Each season’s growth = inflation (2.3%) + real revenue growth that fades as the league matures + new national media deals every 11 years (next in 2036-37, spread over three seasons by the CBA’s 10% yearly limit) − a soft final year before each deal + recessions about once a decade and the odd boom. Everything tied to the cap (tax line, aprons, exceptions, max and min salaries) moves with it; league revenue grows with it too.</p>
      </section>
      <section>
        <h4 style={ruleH4}>Every season</h4>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '10px' }}>
          {decades.map(d => <button key={d} onClick={() => setDecade(d)} className="btn btn-ghost" style={{ fontSize: '11.5px', padding: '2px 7px', boxShadow: decade === d ? 'inset 0 0 0 1px var(--color-accent)' : 'none' }}>{d}s</button>)}
        </div>
        <table className="table" style={{ fontSize: '12.5px', maxWidth: '760px' }}>
          <thead><tr><th style={{ padding: '5px 8px' }}>Season</th><th style={{ padding: '5px 8px', textAlign: 'right' }}>Change</th><th style={{ padding: '5px 8px', textAlign: 'right' }}>Salary cap</th><th style={{ padding: '5px 8px' }}>Why</th></tr></thead>
          <tbody>
            {decade < 2030 && CAP_HISTORY.filter(([y]) => Math.floor(y / 10) * 10 === decade || (decade === 2020 && y >= 2020)).map(([y, c], i, arr) => { const prev = CAP_HISTORY.find(h => h[0] === y - 1); const g = prev ? (c / prev[1] - 1) * 100 : 0; void arr; void i; return <tr key={'h' + y}><td style={{ padding: '4px 8px' }}>{y - 1}–{String(y).slice(2)}</td><td style={{ padding: '4px 8px', textAlign: 'right', color: g < 0 ? 'var(--gm-bad)' : undefined }}>{prev ? (g >= 0 ? '+' : '') + g.toFixed(1) + '%' : ''}</td><td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtMoney(c)}</td><td style={{ padding: '4px 8px', ...muted }}>Actual</td></tr>; })}
            {proj.filter(x => Math.floor(x.season / 10) * 10 === decade).map(x => (
              <tr key={x.season} style={{ background: x.season === Y ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : undefined }}>
                <td style={{ padding: '4px 8px' }}>{x.season - 1}–{String(x.season).slice(2)}{x.season === Y ? ' · now' : ''}</td>
                <td style={{ padding: '4px 8px', textAlign: 'right', color: x.growth < 0 ? 'var(--gm-bad)' : x.growth >= 8 ? 'var(--gm-good)' : undefined }}>{x.growth >= 0 ? '+' : ''}{x.growth.toFixed(2)}%</td>
                <td style={{ padding: '4px 8px', textAlign: 'right' }}>{fmtMoney(x.cap)}</td>
                <td style={{ padding: '4px 8px', ...muted }}>{x.note || (x.season < Y ? 'Applied' : 'Projected')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
