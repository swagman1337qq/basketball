// Team crest: a roundel in the club's colors around a line-drawn glyph.
// Original marks for the league's fictional clubs (glyphs from Lucide, ISC license).
import { Anchor, Anvil, Award, Axe, Bird, Castle, Circle, CloudRainWind, Cog, Compass, Crown, Feather, Fish, Flame, Gem, Guitar, Hammer, Moon, Mountain, MountainSnow, Origami, Rainbow, Ship, Spade, Sparkles, Star, Sun, Sunset, TreeDeciduous, TreePalm, TreePine, Waves, Wind, type LucideIcon } from 'lucide-react';

const GLYPHS: Record<string, LucideIcon> = { Anchor, Anvil, Award, Axe, Bird, Castle, Circle, CloudRainWind, Cog, Compass, Crown, Feather, Fish, Flame, Gem, Guitar, Hammer, Moon, Mountain, MountainSnow, Origami, Rainbow, Ship, Spade, Sparkles, Star, Sun, Sunset, TreeDeciduous, TreePalm, TreePine, Waves, Wind };

export interface CrestTeam { region?: string; name?: string; abbr?: string; colors?: [string, string]; icon?: string }

export function TeamLogo({ team, size = 20 }: { team: CrestTeam | undefined; size?: number }) {
  if (!team) return null;
  const Glyph = GLYPHS[team.icon || ''] || Circle;
  const [c1, c2] = team.colors || ['#605d5d', '#eae7e7'];
  const small = size < 28;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={(team.region ? team.region + ' ' + team.name : team.abbr) + ' logo'} style={{ display: 'block', flex: 'none' }}>
      <circle cx="50" cy="50" r="47" fill={c1} stroke={c2} strokeWidth={small ? 4 : 3} />
      {!small && <circle cx="50" cy="50" r="39.5" fill="none" stroke={c2} strokeWidth="1.2" opacity=".6" />}
      <Glyph x={small ? 22 : 26} y={small ? 22 : 26} width={small ? 56 : 48} height={small ? 56 : 48} color={c2} strokeWidth={small ? 2.4 : 1.8} />
    </svg>
  );
}
