// A player's playing style (tendencies.ts): the NBA's own tracked shot categories (usage rate, shooting
// by zone, catch & shoot and pull-up shooting, free throw rate) in their NBA units, with the change
// since last summer and, where the game records the real thing, this season's actual number.
// Behavior, not ability.
import type { Game } from '../engine/Game';
import { ensureTen, expUsg, jumpShares, styleLine, TEN_DESC, TEN_KEYS, TEN_LABEL, tenFmt, tenUnit, ZONE_TEN, zoneShares, type TenKey, type ZoneTen } from '../engine/tendencies';
import { muted, ruleH4 } from './kit';

const GROUP: Partial<Record<TenKey, string>> = { usage: 'Shot volume', ra: 'Where his shots come from (shooting by zone)', cns: 'How he gets them (shot dashboard)', ftr: 'Getting to the line' };
const isZone = (k: TenKey): k is ZoneTen => (ZONE_TEN as readonly string[]).includes(k);

export function PlayingStyle({ p, gm }: { p: any; gm: Game }) {
  const t = ensureTen(p); if (!t) return null;
  const prev = p.tenPrev || null, roles = gm.rolesOf(p), norms = gm.db.norms, zs = zoneShares(p, norms, roles), js = jumpShares(p, norms, roles);
  const tot = gm.seasonTotals(p, gm.Y), live = tot && tot.gp >= 5 && tot.fga >= 20, share = (x: number) => Math.round((100 * x) / tot.fga) + '%';
  const val = (k: TenKey) => (k === 'usage' ? expUsg(p, norms, roles) : isZone(k) ? zs[k] : k === 'cns' || k === 'pullup' ? js[k] : tenUnit(k, t[k]));
  const fmt = (k: TenKey, v: number) => (k === 'usage' ? v.toFixed(1) + '% of plays' : isZone(k) || k === 'cns' || k === 'pullup' ? Math.round(v) + '% of shots' : tenFmt(k, v));
  // This season's real numbers, where the box score keeps them (the paint split is kept from 2026-10 on).
  const actual: Partial<Record<TenKey, string>> = live ? { usage: gm.usgOf(tot).toFixed(1) + '%', ra: share(tot.ra || 0), ...(tot.ka != null ? { paint: share(tot.ka), mid: share((tot.ma || 0) - tot.ka) } : {}), c3: share(tot.ca || 0), atb: share(tot.ba || 0), ftr: (tot.fta / tot.fga).toFixed(3).replace(/^0/, '') } : {};
  return (
    <div>
      <h4 style={{ ...ruleH4, marginTop: '14px' }}>Playing style</h4>
      <p style={{ ...muted, fontSize: '12px', margin: '0 0 6px' }}>{styleLine(p)} His shot tendencies, in the NBA's own categories: they drift toward what his skills, role and team ask of him, a bit each month and more each summer.{p.tenLock ? ' Locked in God Mode: they don’t change.' : ''}</p>
      {TEN_KEYS.map(k => { const sc = t[k], v = val(k), d = prev && prev[k] != null ? sc - prev[k] : 0, c = sc >= 65 ? 'var(--color-accent-700)' : sc <= 35 ? 'var(--color-neutral-600)' : 'var(--color-text)';
        return (
          <div key={k}>
            {GROUP[k] && <div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', margin: k === 'usage' ? '2px 0 1px' : '7px 0 1px' }}>{GROUP[k]}</div>}
            <div title={TEN_DESC[k]} style={{ display: 'grid', gridTemplateColumns: '150px minmax(0,1fr) 118px 34px', gap: '8px', alignItems: 'center', padding: '2px 0', fontSize: '12.5px' }}>
              <span style={k === 'usage' ? { fontWeight: 600 } : undefined}>{TEN_LABEL[k]}</span>
              <div style={{ position: 'relative', height: 7, background: 'color-mix(in srgb, var(--color-text) 12%, transparent)', borderRadius: 4 }}>
                <div style={{ height: 7, width: Math.round(sc) + '%', background: c, borderRadius: 4, opacity: 0.8 }} />
                <div title="League typical" style={{ position: 'absolute', left: '50%', top: -2, bottom: -2, width: 1, background: 'color-mix(in srgb, var(--color-text) 40%, transparent)' }} />
              </div>
              <span style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><b style={{ color: c }}>{fmt(k, v)}</b>{actual[k] && <span title="This season, actual" style={{ ...muted, fontSize: '11px', display: 'block' }}>this season {actual[k]}</span>}</span>
              <span title={prev ? 'Since last summer' : ''} style={{ fontSize: '11px', fontWeight: 700, color: d >= 1 ? 'var(--gm-good)' : d <= -1 ? 'var(--gm-bad)' : 'var(--color-neutral-600)' }}>{prev && Math.abs(d) >= 1 ? (d > 0 ? '▲' : '▼') : ''}</span>
            </div>
          </div>); })}
      <p style={{ ...muted, fontSize: '11px', margin: '4px 0 0' }}>Hover a row for the NBA's definition. The line marks a league-typical rotation player; his zones always add up to 100% of his shots.</p>
    </div>
  );
}
