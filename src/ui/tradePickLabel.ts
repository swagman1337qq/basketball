import type { Game } from '../engine/Game';

// Only draft-night slots are final. Match the original team and round, even after a trade.
export function tradePickLabel(gm: Game, asset: any) {
  const s = gm.state,
    label = gm.pickLabel(asset, s.teams);
  if (s.phase !== 'draft' || asset.yr !== gm.Y || gm.draftRights(asset, s)) return label;
  const pick = s.picks.find(p => p.orig === asset.orig && (p.rd || 1) === asset.rd && !p.pid);
  if (!pick || !Number.isInteger(pick.n) || pick.n < 1) return label;
  const n = pick.n,
    suffix = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th',
    prefix = asset.yr + ' ' + (asset.rd === 1 ? '1st' : '2nd');
  return label.replace(prefix, prefix + ' (' + n + suffix + ')');
}
