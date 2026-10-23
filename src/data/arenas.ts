// Arenas and ticket prices from real life (2026-10-23).
//
// Capacity: each club plays in a building the size of the biggest indoor arena in its state (in its
// province for the Canadian cities, its country for the Mexican and European ones), basketball seating.
// Domed football stadiums don't count.
//
// Typical ticket price: for a city with an NBA team, that team's 2024–25 average ticket price
// (Sports Acquisition, from Barry's Tickets; Los Angeles averages the Lakers and the Clippers, the Bay
// Area cities use the Warriors). Elsewhere, the city's cost of living (C2ER composite where available,
// 100 = U.S. average). Both turn into the game's prices so that an average NBA ticket ($227) or an
// average-cost city (100) is $124. AI owners price around it for demand and winning (frontOffice.ts).

// The biggest indoor arena per state, province or country: [arena, seats].
export const ARENAS: Record<string, [string, number]> = {
  AL: ['Legacy Arena', 17000], AK: ['Sullivan Arena', 6290], AZ: ['Footprint Center', 17071], CA: ['Crypto.com Arena', 19079],
  CO: ['Ball Arena', 19520], CT: ['XL Center', 15564], DC: ['Capital One Arena', 20356], FL: ['Kaseya Center', 19600],
  GA: ['State Farm Arena', 17044], HI: ['Stan Sheriff Center', 10300], ID: ['ExtraMile Arena', 12480], IL: ['United Center', 20917],
  IN: ['Gainbridge Fieldhouse', 17274], KY: ['KFC Yum! Center', 22090], LA: ['Smoothie King Center', 16867], MA: ['TD Garden', 19156],
  MD: ['Xfinity Center', 17950], MI: ['Little Caesars Arena', 20332], MN: ['Target Center', 18978], MO: ['T-Mobile Center', 18972],
  NC: ['Dean E. Smith Center', 21750], NE: ['CHI Health Center', 17560], NJ: ['Prudential Center', 18711], NM: ['The Pit', 15411],
  NV: ['T-Mobile Arena', 20000], NY: ['Madison Square Garden', 19812], OH: ['Rocket Arena', 19432], OK: ['Paycom Center', 18203],
  OR: ['Moda Center', 19393], PA: ['Xfinity Mobile Arena', 20478], RI: ['Amica Mutual Pavilion', 12400], SD: ['Denny Sanford Premier Center', 12000],
  TN: ['Thompson–Boling Arena', 21678], TX: ['American Airlines Center', 19200], UT: ['Marriott Center', 18987], VA: ['John Paul Jones Arena', 14593],
  WA: ['Climate Pledge Arena', 18300], WI: ['Fiserv Forum', 17341],
  AB: ['Scotiabank Saddledome', 19289], BC: ['Rogers Arena', 19700], ON: ['Scotiabank Arena', 19800], QC: ['Bell Centre', 21105],
  MX: ['Arena CDMX', 22300], GB: ['The O2 Arena', 20000], DE: ['Lanxess Arena', 18500], ES: ['Palau Sant Jordi', 17960], FR: ['Accor Arena', 15600],
};

// Each city: [state (province or country), NBA average ticket price or 0, cost of living when it has no NBA team].
export const CITY_ECON: Record<string, [string, number, number?]> = {
  'Baltimore': ['MD', 0, 102], 'New York': ['NY', 432], 'Brooklyn': ['NY', 270], 'Minneapolis': ['MN', 155], 'Newark': ['NJ', 0, 121],
  'Philadelphia': ['PA', 250], 'Cleveland': ['OH', 185], 'Detroit': ['MI', 120], 'Chicago': ['IL', 255], 'Birmingham': ['AL', 0, 89],
  'Cincinnati': ['OH', 0, 92], 'Charlotte': ['NC', 140], 'Atlanta': ['GA', 190], 'Iŋaliq': ['AK', 0, 126], 'Anchorage': ['AK', 0, 126],
  'Richmond': ['VA', 0, 97], 'Nashville': ['TN', 0, 101], 'Seattle': ['WA', 0, 150], 'Portland': ['OR', 180], 'Vancouver': ['BC', 0, 135],
  'St. Louis': ['MO', 0, 89], 'Denver': ['CO', 225], 'San Diego': ['CA', 0, 144], 'Oakland': ['CA', 589], 'San Francisco': ['CA', 589],
  'Las Vegas': ['NV', 0, 104], 'Los Angeles': ['CA', 389], 'San Jose': ['CA', 0, 172], 'Austin': ['TX', 0, 97], 'San Antonio': ['TX', 115],
  'Wazíbló': ['SD', 0, 95], 'Dallas': ['TX', 240], 'Houston': ['TX', 200], 'Louisville': ['KY', 0, 92], 'Mexico City': ['MX', 0, 55],
  'Boston': ['MA', 410], 'Miami': ['FL', 260], 'Orlando': ['FL', 125], 'Tampa': ['FL', 0, 100], 'Jacksonville': ['FL', 0, 96],
  'Toronto': ['ON', 230], 'Ottawa': ['ON', 0, 100], 'Montreal': ['QC', 0, 95], 'Calgary': ['AB', 0, 105], 'Edmonton': ['AB', 0, 100],
  'Memphis': ['TN', 110], 'Milwaukee': ['WI', 210], 'New Orleans': ['LA', 160], 'Oklahoma City': ['OK', 135], 'Tulsa': ['OK', 0, 86],
  'Phoenix': ['AZ', 220], 'Tucson': ['AZ', 0, 95], 'Sacramento': ['CA', 165], 'Fresno': ['CA', 0, 110], 'Inland Empire': ['CA', 0, 115],
  'Salt Lake': ['UT', 130], 'Indianapolis': ['IN', 150], 'Washington': ['DC', 170], 'Pittsburgh': ['PA', 0, 93], 'Columbus': ['OH', 0, 92],
  'Buffalo': ['NY', 0, 96], 'Rochester': ['NY', 0, 95], 'Grand Rapids': ['MI', 0, 94], 'Kansas City': ['MO', 0, 93], 'Omaha': ['NE', 0, 92],
  'Hartford': ['CT', 0, 108], 'Providence': ['RI', 0, 110], 'Raleigh': ['NC', 0, 97], 'Norfolk': ['VA', 0, 98], 'Boise': ['ID', 0, 101],
  'Honolulu': ['HI', 0, 185], 'Albuquerque': ['NM', 0, 93], 'Guadalajara': ['MX', 0, 45], 'Monterrey': ['MX', 0, 50], 'Tijuana': ['MX', 0, 50],
  'London': ['GB', 0, 125], 'Berlin': ['DE', 0, 90], 'Madrid': ['ES', 0, 80], 'Paris': ['FR', 0, 110],
};

const NBA_AVG = 227, GAME_AVG = 124; // (124 keeps league-wide ticket money where it was before real prices)
// The arena a city's club plays in, or null for a city not in the table.
export const cityArena = (region: string) => { const c = CITY_ECON[region]; return c ? ARENAS[c[0]] || null : null; };
// A city's typical ticket price in the game; a city not in the table goes by its market size.
export function cityTicket(region: string, mkt = 1) {
  const c = CITY_ECON[region];
  if (!c) return Math.round(GAME_AVG * Math.pow(mkt || 1, 1.3));
  return Math.round(c[1] ? GAME_AVG * c[1] / NBA_AVG : GAME_AVG * (c[2] ?? 100) / 100);
}
