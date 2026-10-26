// Local revenue from real life (2026-10-26): each city's local media (TV and streaming rights) and
// sponsorship (naming rights, jersey patch, partners), in millions a season, as of 2024-25. Cities with an NBA
// team use that team's numbers; the rest go by market size. The game grows them with the salary cap each
// season (frontOffice.ts localOf), so they keep pace with the league as the years go on.
//
// Sources: Sportico ("How NBA Teams and Owners Make Their Money", 2025: Lakers' Spectrum deal about $200M a
// year, Knicks about $110M after MSG Networks' 28% cut, local media about 10% of league revenue; team revenue
// $301M (Grizzlies) to $833M (Warriors), $408M average), SBJ via MediaPost (Lakers about $185M), the Celtics'
// $70M (2023-24, with their NBC Sports Boston stake), Forbes / SponsorUnited (team sponsorship $1.62B in
// 2024-25, the Warriors over $200M) and GlobalData (jersey patches: the Knicks' $30M the largest). Most clubs'
// figures aren't published; those are estimates in line with these anchors, lower for the teams whose
// regional networks went bankrupt or that moved to free over-the-air TV. Los Angeles averages the Lakers and the
// Clippers; Oakland and San Francisco are the Warriors.

// [local media, sponsorship], $M a season (2024-25)
export const CITY_REV: Record<string, [number, number]> = {
  'New York': [110, 110], 'Los Angeles': [115, 95], 'Oakland': [50, 200], 'San Francisco': [50, 200], 'Boston': [70, 80], 'Chicago': [55, 70],
  'Philadelphia': [60, 70], 'Brooklyn': [50, 60], 'Toronto': [50, 70], 'Houston': [50, 60], 'Dallas': [20, 60], 'Miami': [30, 70],
  'Washington': [40, 45], 'Denver': [30, 50], 'Phoenix': [15, 55], 'Minneapolis': [25, 35], 'Cleveland': [30, 45], 'Detroit': [25, 40],
  'Atlanta': [30, 45], 'Charlotte': [20, 35], 'Portland': [10, 35], 'San Antonio': [15, 45], 'Sacramento': [25, 40], 'Milwaukee': [25, 50],
  'Orlando': [25, 35], 'Indianapolis': [25, 35], 'New Orleans': [18, 30], 'Oklahoma City': [20, 35], 'Memphis': [15, 30], 'Salt Lake': [15, 40],
};
// A city without an NBA team: by its market size (1 = an average market: $40M local media, $54M sponsorship, the
// league's averages; New York's 1.55 about $105M and $109M).
export const marketRev = (mkt: number): [number, number] => [Math.round(40 * Math.pow(mkt, 2.2)), Math.round(54 * Math.pow(mkt, 1.6))];
export const cityRev = (region: string, mkt = 1): [number, number] => CITY_REV[region] || marketRev(mkt || 1);
