import atl from '../assets/team-logos/atl-vintage.webp';
import aus from '../assets/team-logos/aus-vintage.webp';
import bal from '../assets/team-logos/bal-vintage.webp';
import chi from '../assets/team-logos/chi-vintage.webp';
import cin from '../assets/team-logos/cin-vintage.webp';
import dal from '../assets/team-logos/dal-vintage.webp';
import den from '../assets/team-logos/den-vintage.webp';
import hou from '../assets/team-logos/hou-vintage.webp';
import inl from '../assets/team-logos/inl-vintage.webp';
import lv from '../assets/team-logos/lv-vintage.webp';
import min from '../assets/team-logos/min-vintage.webp';
import ny from '../assets/team-logos/ny-vintage.webp';
import nwk from '../assets/team-logos/nwk-vintage.webp';
import por from '../assets/team-logos/por-vintage.webp';
import ric from '../assets/team-logos/ric-vintage.webp';
import sea from '../assets/team-logos/sea-vintage.webp';
import stl from '../assets/team-logos/stl-vintage.webp';

/** The 17 logo concepts selected by the user on November 13, 2026. */
export const APPROVED_TEAM_LOGOS: Record<string, { src: string; label: string; choice: number }> = {
  ATL: { src: atl, label: 'Atlanta Snowplows', choice: 2 },
  AUS: { src: aus, label: 'Austin Vampires', choice: 2 },
  BAL: { src: bal, label: 'Baltimore Camels', choice: 3 },
  CHI: { src: chi, label: 'Chicago Sloths', choice: 3 },
  CIN: { src: cin, label: 'Cincinnati Narwhals', choice: 2 },
  DAL: { src: dal, label: 'Dallas Lariats', choice: 3 },
  DEN: { src: den, label: 'Denver Deep', choice: 2 },
  HOU: { src: hou, label: 'Houston Caribou', choice: 2 },
  INL: { src: inl, label: 'Iŋaliq Ivories', choice: 1 },
  LV: { src: lv, label: 'Las Vegas Neon', choice: 3 },
  MIN: { src: min, label: 'Minneapolis Marauders', choice: 3 },
  NY: { src: ny, label: 'New York Hermits', choice: 3 },
  NWK: { src: nwk, label: 'Newark Navigators', choice: 2 },
  POR: { src: por, label: 'Portland Pines', choice: 3 },
  RIC: { src: ric, label: 'Richmond Opossums', choice: 2 },
  SEA: { src: sea, label: 'Seattle Scorpions', choice: 1 },
  STL: { src: stl, label: 'St. Louis Puffins', choice: 2 },
};
