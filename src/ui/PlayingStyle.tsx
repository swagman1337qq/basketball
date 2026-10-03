// A player's playing style (tendencies.ts): the NBA's own tracked categories (advanced stats, player
// tracking, play types, shot zones) in their NBA units, with the change since last summer and, where
// the game records the real thing, this season's actual number. Behavior, not ability.
import type { Game } from '../engine/Game';
import { ensureTen, expUsg, styleLine, TEN_DESC, TEN_KEYS, TEN_LABEL, tenFmt, tenUnit, type TenKey } from '../engine/tendencies';
import { muted, ruleH4 } from './kit';

export function PlayingStyle({ p, gm }: { p: any; gm: Game }) {
  const t = ensureTen(p); if (!t) return null;
  const prev = p.tenPrev || null, roles = gm.rolesOf(p), norms = gm.db.norms;
  const tot = gm.seasonTotals(p, gm.Y), live = tot && tot.gp >= 5 && tot.fga >= 20;
  const val = (k: TenKey, sc: number) => (k === 'usage' ? expUsg(p, norms, roles, sc) : tenUnit(k, sc));
  const fmt = (k: TenKey, v: number) => (k === 'usage' ? v.toFixed(1) + '% of plays' : tenFmt(k, v));
  const actual: Partial<Record<TenKey, string>> = live ? { usage: gm.usgOf(tot).toFixed(1) + '%', three: Math.round(100 * tot.tpa / tot.fga) + '%', mid: Math.round(100 * (tot.ma || 0) / tot.fga) + '%' } : {};
  return (
    <div>
      <h4 style={{ ...ruleH4, marginTop: '14px' }}>Playing style</h4>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>{styleLine(p)} His tendencies, in the NBA's own tracking categories: they drift toward what his skills, role and team ask of him, a bit each month and more each summer.{p.tenLock ? ' Locked in God Mode: they don’t change.' : ''}</p>
      {TEN_KEYS.map(k => { const sc = t[k], v = val(k, sc), d = prev && prev[k] != null ? sc - prev[k] : 0, c = sc >= 65 ? 'var(--color-accent-700)' : sc <= 35 ? 'var(--color-neutral-600)' : 'var(--color-text)';
        return (
          <div key={k} title={TEN_DESC[k]} style={{ display: 'grid', gridTemplateColumns: '132px minmax(0,1fr) 118px 34px', gap: '8px', alignItems: 'center', padding: '2px 0', fontSize: '12.5px' }}>
            <span style={k === 'usage' ? { fontWeight: 600 } : undefined}>{TEN_LABEL[k]}</span>
            <div style={{ position: 'relative', height: 7, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)', borderRadius: 4 }}>
              <div style={{ height: 7, width: Math.round(sc) + '%', background: c, borderRadius: 4, opacity: 0.8 }} />
              <div title="League typical" style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'color-mix(in srgb, var(--color-text) 40%, transparent)' }} />
            </div>
            <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b style={{ color: c }}>{fmt(k, v)}</b>{actual[k] && <span title="This season, actual" style={{ ...muted, fontSize: '11px', display: 'block' }}>this season {actual[k]}</span>}</span>
            <span title={prev ? 'Since last summer' : ''} style={{ fontSize: '11px', fontWeight: 700, color: d >= 1 ? 'var(--gm-good)' : d <= -1 ? 'var(--gm-bad)' : 'var(--color-neutral-600)' }}>{prev && Math.abs(d) >= 1 ? (d > 0 ? '▲' : '▼') : ''}</span>
          </div>); })}
      <p style={{ ...muted, fontSize: '11px', margin: '4px 0 0' }}>Hover a row for the NBA's definition. The line marks a league-typical rotation player.</p>
    </div>
  );
}
