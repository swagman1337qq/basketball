// A player's playing style (tendencies.ts), the way the NBA reports it: his usage rate; where his shots
// come from (shooting by zone, adding up to 100% of his shots); how he creates his jump shots (catch &
// shoot, pull-up, stepback, fadeaway, adding up to 100% of his jumpers); and his free throw rate. With
// the change since last summer and, where the box score keeps it, this season's actual number.
// Behavior, not ability.
import type { Game } from '../engine/Game';
import { CRE_TEN, ensureTen, expUsg, styleLine, TEN_DESC, TEN_LABEL, tenUnit, typShare, ZONE_TEN, type TenKey } from '../engine/tendencies';
import { muted, ruleH4 } from './kit';

const GROUP: Partial<Record<TenKey, string>> = { usage: 'Shot volume', ra: 'Where his shots come from (% of his shots)', cns: 'How he creates his jump shots (% of his jumpers)', ftr: 'Getting to the line' };
const ORDER: TenKey[] = ['usage', ...ZONE_TEN, ...CRE_TEN, 'ftr'];

export function PlayingStyle({ p, gm }: { p: any; gm: Game }) {
  const t = ensureTen(p); if (!t) return null;
  const prev = p.tenPrev && p.tenPrev.step != null ? p.tenPrev : null, roles = gm.rolesOf(p), norms = gm.db.norms;
  const tot = gm.seasonTotals(p, gm.Y), live = tot && tot.gp >= 5 && tot.fga >= 20, share = (x: number, of: number) => (of > 0 ? Math.round((100 * x) / of) + '%' : '—');
  const jumpers = live ? (tot.qa || 0) + (tot.ua || 0) + (tot.sa || 0) + (tot.da || 0) : 0;
  // This season's real numbers, where the box score keeps them (paint split from 2026-10, creation from 2026-10-08).
  const actual: Partial<Record<TenKey, string>> = live ? { usage: gm.usgOf(tot).toFixed(1) + '%', ra: share(tot.ra || 0, tot.fga), ...(tot.ka != null ? { paint: share(tot.ka, tot.fga), mid: share((tot.ma || 0) - tot.ka, tot.fga) } : {}), c3: share(tot.ca || 0, tot.fga), atb: share(tot.ba || 0, tot.fga),
    ...(jumpers >= 20 ? { cns: share(tot.qa || 0, jumpers), pullup: share(tot.ua || 0, jumpers), step: share(tot.sa || 0, jumpers), fade: share(tot.da || 0, jumpers) } : {}), ftr: (tot.fta / tot.fga).toFixed(3).replace(/^0/, '') } : {};
  const isScore = (k: TenKey) => k === 'usage' || k === 'ftr';
  return (
    <div>
      <h4 style={{ ...ruleH4, marginTop: '14px' }}>Playing style</h4>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>{styleLine(p)} His shot tendencies, the way the NBA reports them: they drift toward what his skills, role and team ask of him, a bit each month and more each summer.{p.tenLock ? ' Locked in God Mode: they don’t change.' : ''}</p>
      {ORDER.map(k => {
        const v = t[k] ?? 0, typ = isScore(k) ? 50 : typShare(k as any), d = prev && prev[k] != null ? v - prev[k] : 0;
        const hi = isScore(k) ? v >= 65 : v >= typ * 1.5 && v >= 8, lo = isScore(k) ? v <= 35 : v <= typ * 0.5, c = hi ? 'var(--color-accent-700)' : lo ? 'var(--color-neutral-600)' : 'var(--color-text)';
        const text = k === 'usage' ? expUsg(p, norms, roles).toFixed(1) + '% of plays' : k === 'ftr' ? tenUnit('ftr', v).toFixed(3).replace(/^0/, '') + ' FTA per FGA' : (Math.round(v * 10) / 10) + '%';
        const width = isScore(k) ? v : Math.min(100, v), mark = isScore(k) ? 50 : Math.min(100, typ);
        return (
          <div key={k}>
            {GROUP[k] && <div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', margin: k === 'usage' ? '2px 0 1px' : '7px 0 1px' }}>{GROUP[k]}</div>}
            <div title={TEN_DESC[k]} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 118px 34px', gap: '8px', alignItems: 'center', padding: '2px 0', fontSize: '12.5px' }}>
              <span style={k === 'usage' ? { fontWeight: 600 } : undefined}>{TEN_LABEL[k]}</span>
              <div style={{ position: 'relative', height: 7, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)', borderRadius: 4 }}>
                <div style={{ height: 7, width: Math.round(width) + '%', background: c, borderRadius: 4, opacity: 0.8 }} />
                <div title={'League typical' + (isScore(k) ? '' : ': ' + typ + '%')} style={{ position: 'absolute', left: mark + '%', top: -2, bottom: -2, width: 1, background: 'color-mix(in srgb, var(--color-text) 40%, transparent)' }} />
              </div>
              <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b style={{ color: c }}>{text}</b>{actual[k] && <span title="This season, actual" style={{ ...muted, fontSize: '11px', display: 'block' }}>this season {actual[k]}</span>}</span>
              <span title={prev ? 'Since last summer' : ''} style={{ fontSize: '11px', fontWeight: 700, color: d >= 1 ? 'var(--gm-good)' : d <= -1 ? 'var(--gm-bad)' : 'var(--color-neutral-600)' }}>{prev && Math.abs(d) >= 1 ? (d > 0 ? '▲' : '▼') : ''}</span>
            </div>
          </div>); })}
      <p style={{ ...muted, fontSize: '11px', margin: '4px 0 0' }}>Hover a row for the NBA's definition. The line marks the league's typical share (for usage and free throws, a typical rotation player). His zones add up to 100% of his shots, and his four ways of creating add up to 100% of his jump shots (mid-range and threes).</p>
    </div>
  );
}
