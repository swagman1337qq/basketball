// Where the league's cities are, for the conferences: every team west of Lebanon, Kansas (the
// geographic center of the contiguous United States) plays in the West, every team east of it in
// the East. When that leaves one conference bigger, the team nearest the line in the bigger one
// moves across, one at a time, until the two are even (one apart with an odd number of teams).
// Longitude is measured the short way round from Lebanon, so Honolulu, Anchorage and Little
// Diomede are west and London, Paris, Madrid and Berlin east. Cities the table doesn't know (a club
// made up in the expansion screen) keep the conference they were given.
export const LEBANON_KS: [number, number] = [39.81, -98.56];

// [city, latitude, longitude]: league cities, the franchise database, the expansion city list, and
// a few more a made-up club might use.
const CITIES: [string, number, number][] = [
  ['Baltimore', 39.29, -76.61], ['New York', 40.71, -74.01], ['Brooklyn', 40.68, -73.94], ['Newark', 40.74, -74.17], ['Philadelphia', 39.95, -75.17],
  ['Cleveland', 41.5, -81.69], ['Detroit', 42.33, -83.05], ['Chicago', 41.88, -87.63], ['Birmingham', 33.52, -86.8], ['Cincinnati', 39.1, -84.51],
  ['Charlotte', 35.23, -80.84], ['Atlanta', 33.75, -84.39], ['Iŋaliq', 65.76, -168.95], ['Little Diomede', 65.76, -168.95], ['Richmond', 37.54, -77.44],
  ['Nashville', 36.16, -86.78], ['Seattle', 47.61, -122.33], ['Portland', 45.52, -122.68], ['Vancouver', 49.28, -123.12], ['St. Louis', 38.63, -90.2],
  ['Denver', 39.74, -104.99], ['San Diego', 32.72, -117.16], ['Oakland', 37.8, -122.27], ['Las Vegas', 36.17, -115.14], ['Los Angeles', 34.05, -118.24],
  ['San Jose', 37.34, -121.89], ['Austin', 30.27, -97.74], ['San Antonio', 29.42, -98.49], ['Wazíbló', 43.03, -102.56], ['Pine Ridge', 43.03, -102.56],
  ['Dallas', 32.78, -96.8], ['Houston', 29.76, -95.37], ['Minneapolis', 44.98, -93.27], ['Louisville', 38.25, -85.76], ['Mexico City', 19.43, -99.13],
  ['Toronto', 43.65, -79.38], ['Montreal', 45.5, -73.57], ['Boston', 42.36, -71.06], ['Miami', 25.76, -80.19], ['Orlando', 28.54, -81.38],
  ['Pittsburgh', 40.44, -79.99], ['Buffalo', 42.89, -78.88], ['Milwaukee', 43.04, -87.91], ['New Orleans', 29.95, -90.07], ['Norfolk', 36.85, -76.29],
  ['Omaha', 41.26, -95.93], ['Calgary', 51.05, -114.07], ['Tucson', 32.22, -110.97], ['Boise', 43.62, -116.2], ['Memphis', 35.15, -90.05],
  ['Anchorage', 61.22, -149.9], ['Washington', 38.91, -77.04], ['Jacksonville', 30.33, -81.66], ['Indianapolis', 39.77, -86.16], ['Rochester', 43.16, -77.61],
  ['Raleigh', 35.78, -78.64], ['Ottawa', 45.42, -75.7], ['Grand Rapids', 42.96, -85.67], ['London', 51.51, -0.13], ['Paris', 48.86, 2.35],
  ['Madrid', 40.42, -3.7], ['Berlin', 52.52, 13.4], ['Hartford', 41.77, -72.67], ['Providence', 41.82, -71.41], ['Columbus', 39.96, -83.0],
  ['Tampa', 27.95, -82.46], ['Phoenix', 33.45, -112.07], ['Sacramento', 38.58, -121.49], ['Kansas City', 39.1, -94.58], ['Inland Empire', 33.98, -117.38],
  ['San Francisco', 37.77, -122.42], ['Salt Lake', 40.76, -111.89], ['Salt Lake City', 40.76, -111.89], ['Oklahoma City', 35.47, -97.52], ['Tulsa', 36.15, -95.99],
  ['Fresno', 36.74, -119.79], ['Edmonton', 53.55, -113.49], ['Guadalajara', 20.66, -103.35], ['Monterrey', 25.69, -100.32], ['Tijuana', 32.51, -117.04],
  ['Honolulu', 21.31, -157.86], ['Albuquerque', 35.08, -106.65],
  // More cities a made-up club might be from.
  ['Winnipeg', 49.9, -97.14], ['Quebec City', 46.81, -71.21], ['Halifax', 44.65, -63.57], ['Spokane', 47.66, -117.43], ['El Paso', 31.76, -106.49],
  ['Wichita', 37.69, -97.34], ['Des Moines', 41.59, -93.62], ['Virginia Beach', 36.85, -75.98], ['Puebla', 19.04, -98.21], ['San Juan', 18.47, -66.11],
  ['Havana', 23.11, -82.37], ['Tokyo', 35.68, 139.69], ['Seoul', 37.57, 126.98], ['Shanghai', 31.23, 121.47], ['Beijing', 39.9, 116.4],
  ['Manila', 14.6, 120.98], ['Sydney', -33.87, 151.21], ['Melbourne', -37.81, 144.96], ['Rome', 41.9, 12.5], ['Barcelona', 41.39, 2.17],
  ['Milan', 45.46, 9.19], ['Athens', 37.98, 23.73], ['Istanbul', 41.01, 28.98], ['Belgrade', 44.79, 20.45], ['Lagos', 6.52, 3.38],
];
const norm = (s: string) => s.replace(/ŋ/g, 'ng').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');
const LL = new Map<string, [number, number]>(CITIES.map(([c, la, lo]) => [norm(c), [la, lo]]));
export const cityLL = (region?: string): [number, number] | undefined => (region ? LL.get(norm(region)) : undefined);
// Degrees east of Lebanon, Kansas, the short way round (−180 to 180): negative is the West.
export const eastOf = (lon: number) => ((lon - LEBANON_KS[1] + 540) % 360) - 180;
export const sideOf = (region?: string): 'East' | 'West' | null => { const ll = cityLL(region); return ll ? (eastOf(ll[1]) >= 0 ? 'East' : 'West') : null; };

export const CONF_DIVS: Record<'East' | 'West', string[]> = { East: ['Atlantic', 'Central', 'Southeast'], West: ['Northwest', 'Pacific', 'Southwest'] };
// Where each division sits when it has no members yet to measure from.
const DIV_HOME: Record<string, [number, number]> = { Atlantic: [41, -74], Central: [42, -86], Southeast: [33, -83], Northwest: [46, -115], Pacific: [36, -120], Southwest: [32, -100] };
const dist = (a: [number, number], b: [number, number]) => { const k = Math.cos(((a[0] + b[0]) / 2) * Math.PI / 180), dl = Math.abs(a[1] - b[1]) % 360, dlon = Math.min(dl, 360 - dl) * k; return Math.hypot(a[0] - b[0], dlon); };
// The nearest division in a conference to a city (for the franchise database).
export const nearestDiv = (conf: 'East' | 'West', region?: string) => { const ll = cityLL(region); return ll ? CONF_DIVS[conf].slice().sort((x, y) => dist(ll, DIV_HOME[x]) - dist(ll, DIV_HOME[y]))[0] : CONF_DIVS[conf][1]; };

// Conferences and divisions for a league's teams, in the same order. Divisions stay as they are; a
// team that changes conference (or has no division in its conference) joins the nearest division
// there that isn't full, measured from where its teams are.
export function realign(teams: { region?: string; conf?: string; div?: string }[]): { conf: 'East' | 'West'; div: string }[] {
  const ll = teams.map(t => cityLL(t.region));
  const conf = teams.map((t, i): 'East' | 'West' => (ll[i] ? (eastOf(ll[i]![1]) >= 0 ? 'East' : 'West') : t.conf === 'West' ? 'West' : 'East'));
  for (let guard = 0; guard < teams.length; guard++) {
    const nE = conf.filter(c => c === 'East').length, nW = conf.length - nE;
    if (Math.abs(nE - nW) <= 1) break;
    const big = nE > nW ? 'East' : 'West';
    let best = -1, bd = Infinity;
    conf.forEach((c, i) => { if (c !== big || !ll[i]) return; const d = Math.abs(eastOf(ll[i]![1])); if (d < bd) { bd = d; best = i; } });
    if (best < 0) break;
    conf[best] = big === 'East' ? 'West' : 'East';
  }
  const div = teams.map((t, i) => (t.div && CONF_DIVS[conf[i]].includes(t.div) ? t.div : null));
  teams.forEach((_, i) => {
    if (div[i]) return;
    const c = conf[i], n = conf.filter(x => x === c).length, cap = Math.ceil(n / 3);
    const size = (d: string) => div.filter((x, j) => x === d && conf[j] === c).length;
    const centre = (d: string): [number, number] => { const m = div.map((x, j) => (x === d && conf[j] === c ? ll[j] : undefined)).filter(Boolean) as [number, number][]; return m.length ? [m.reduce((a, p) => a + p[0], 0) / m.length, m.reduce((a, p) => a + p[1], 0) / m.length] : DIV_HOME[d]; };
    const open = CONF_DIVS[c].filter(d => size(d) < cap), pool = open.length ? open : CONF_DIVS[c];
    div[i] = ll[i] ? pool.slice().sort((x, y) => dist(ll[i]!, centre(x)) - dist(ll[i]!, centre(y)))[0] : pool.slice().sort((x, y) => size(x) - size(y))[0];
  });
  return conf.map((c, i) => ({ conf: c, div: div[i]! }));
}
