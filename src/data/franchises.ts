// Ready-made franchises for expansion: each nods to what its city is known for, with
// colors, a crest glyph and the metro-area population (millions; latest census estimates:
// U.S. Census Bureau 2023 metro estimates, Statistics Canada, INEGI 2020, Eurostat).
// Cities under 1 million are kept (flagged) so you can still add them if you want.
export interface Franchise { region: string; name: string; abbr: string; conf: 'East' | 'West'; div: string; colors: [string, string]; icon: string; pop: number; known: string; mkt?: number }

export const FRANCHISES: Franchise[] = [
  // ── East ──
  { region: 'Manhattan', name: 'Empires', abbr: 'MAN', conf: 'East', div: 'Atlantic', colors: ['#1c2541', '#c9a227'], icon: 'Building2', pop: 19.5, known: 'The Empire State and the skyline', mkt: 1.55 },
  { region: 'Philadelphia', name: 'Bells', abbr: 'PHI', conf: 'East', div: 'Atlantic', colors: ['#3b2a1a', '#d9a441'], icon: 'Bell', pop: 6.2, known: 'The Liberty Bell' },
  { region: 'Washington', name: 'Monuments', abbr: 'WAS', conf: 'East', div: 'Southeast', colors: ['#1d2f55', '#e5e1d8'], icon: 'Landmark', pop: 6.3, known: 'The monuments on the National Mall' },
  { region: 'Boston', name: 'Colonials', abbr: 'BOS', conf: 'East', div: 'Atlantic', colors: ['#6b1e27', '#f0e2c4'], icon: 'Flag', pop: 4.9, known: 'Colonial history and the Freedom Trail' },
  { region: 'Miami', name: 'Flamingos', abbr: 'MIA', conf: 'East', div: 'Southeast', colors: ['#ef6f94', '#12b5b0'], icon: 'Bird', pop: 6.2, known: 'Art Deco, pink flamingos and South Beach' },
  { region: 'Orlando', name: 'Citrus', abbr: 'ORL', conf: 'East', div: 'Southeast', colors: ['#f28c1f', '#2f6b3b'], icon: 'Citrus', pop: 2.8, known: 'The orange groves Central Florida grew up on' },
  { region: 'Jacksonville', name: 'Navigators', abbr: 'JAX', conf: 'East', div: 'Southeast', colors: ['#12355b', '#8fd3e8'], icon: 'Compass', pop: 1.7, known: 'Its naval bases and the St. Johns River' },
  { region: 'Chicago', name: 'Gales', abbr: 'CHI', conf: 'East', div: 'Central', colors: ['#16324f', '#9bc0e3'], icon: 'Wind', pop: 9.3, known: 'The Windy City' },
  { region: 'Indianapolis', name: 'Crossroads', abbr: 'IND', conf: 'East', div: 'Central', colors: ['#20315f', '#e2b43b'], icon: 'Trophy', pop: 2.1, known: 'The Crossroads of America and the Indy 500' },
  { region: 'Milwaukee', name: 'Brewmasters', abbr: 'MKE', conf: 'East', div: 'Central', colors: ['#6a3b16', '#f2c14e'], icon: 'Beer', pop: 1.56, known: 'Its brewing history' },
  { region: 'Louisville', name: 'Thoroughbreds', abbr: 'LOU', conf: 'East', div: 'Central', colors: ['#5c1a2e', '#d4b16a'], icon: 'Trophy', pop: 1.36, known: 'The Kentucky Derby' },
  { region: 'Buffalo', name: 'Falls', abbr: 'BUF', conf: 'East', div: 'Atlantic', colors: ['#1e4d6b', '#bfe6f0'], icon: 'Droplets', pop: 1.16, known: 'Niagara Falls next door' },
  { region: 'Rochester', name: 'Shutters', abbr: 'ROC', conf: 'East', div: 'Atlantic', colors: ['#b8860b', '#1f1f1f'], icon: 'Camera', pop: 1.06, known: 'The birthplace of the Kodak camera' },
  { region: 'Richmond', name: 'Rapids', abbr: 'RIC', conf: 'East', div: 'Southeast', colors: ['#264653', '#e9c46a'], icon: 'Waves', pop: 1.33, known: 'Whitewater on the James River, downtown' },
  { region: 'Norfolk', name: 'Shipwrights', abbr: 'NOR', conf: 'East', div: 'Southeast', colors: ['#0d2c4a', '#c5a15a'], icon: 'ShipWheel', pop: 1.79, known: 'Shipbuilding and the world’s largest naval base' },
  { region: 'Birmingham', name: 'Vulcans', abbr: 'BHM', conf: 'East', div: 'Southeast', colors: ['#7a2e14', '#f0a13a'], icon: 'Hammer', pop: 1.18, known: 'Steel, the Magic City and its Vulcan statue' },
  { region: 'Memphis', name: 'Blues', abbr: 'MEM', conf: 'East', div: 'Southeast', colors: ['#1b3a6b', '#79a7d8'], icon: 'Music', pop: 1.33, known: 'Beale Street and the blues' },
  { region: 'Toronto', name: 'Towers', abbr: 'TOR', conf: 'East', div: 'Atlantic', colors: ['#24292e', '#d6452b'], icon: 'TowerControl', pop: 6.7, known: 'The CN Tower' },
  { region: 'Montreal', name: 'Voyageurs', abbr: 'MTL', conf: 'East', div: 'Atlantic', colors: ['#20306b', '#d73b3e'], icon: 'Compass', pop: 4.3, known: 'The fur-trade canoeists who opened the continent' },
  { region: 'Ottawa', name: 'Skaters', abbr: 'OTT', conf: 'East', div: 'Atlantic', colors: ['#7a1f2b', '#d9e6ef'], icon: 'Snowflake', pop: 1.5, known: 'Skating the frozen Rideau Canal' },
  { region: 'Grand Rapids', name: 'Craftsmen', abbr: 'GRR', conf: 'East', div: 'Central', colors: ['#4b3621', '#d9b48f'], icon: 'Armchair', pop: 1.1, known: 'Furniture City' },
  { region: 'London', name: 'Beefeaters', abbr: 'LDN', conf: 'East', div: 'Atlantic', colors: ['#8c1c13', '#e6c229'], icon: 'Crown', pop: 14.8, known: 'The Tower of London guards' },
  { region: 'Paris', name: 'Lumières', abbr: 'PAR', conf: 'East', div: 'Atlantic', colors: ['#12264f', '#f2d479'], icon: 'Sparkles', pop: 12.3, known: 'The City of Light' },
  { region: 'Madrid', name: 'Osos', abbr: 'MAD', conf: 'East', div: 'Atlantic', colors: ['#a3162e', '#f3d9a4'], icon: 'Castle', pop: 6.9, known: 'The bear on the city’s coat of arms' },
  { region: 'Berlin', name: 'Gatekeepers', abbr: 'BER', conf: 'East', div: 'Central', colors: ['#222222', '#d4af37'], icon: 'Landmark', pop: 6.2, known: 'The Brandenburg Gate' },
  { region: 'New Orleans', name: 'Second Liners', abbr: 'NOL', conf: 'East', div: 'Southeast', colors: ['#4b2e83', '#d4af37'], icon: 'Music', pop: 0.96, known: 'Jazz funerals and second-line parades' },
  // ── West ──
  { region: 'Los Angeles', name: 'Marquees', abbr: 'LA', conf: 'West', div: 'Pacific', colors: ['#2b1a4f', '#f4c542'], icon: 'Clapperboard', pop: 12.8, known: 'Hollywood premieres', mkt: 1.5 },
  { region: 'Inland Empire', name: 'Groves', abbr: 'IE', conf: 'West', div: 'Pacific', colors: ['#2e6b30', '#f39a1e'], icon: 'Citrus', pop: 4.7, known: 'The citrus groves of Riverside' },
  { region: 'San Francisco', name: 'Fog', abbr: 'SF', conf: 'West', div: 'Pacific', colors: ['#8b2a1f', '#cfd8dc'], icon: 'CloudFog', pop: 4.6, known: 'Karl the Fog and the Golden Gate' },
  { region: 'Salt Lake', name: 'Gulls', abbr: 'SLC', conf: 'West', div: 'Northwest', colors: ['#1f3b63', '#eef2f5'], icon: 'Bird', pop: 1.3, known: 'The California gulls of the Great Salt Lake', mkt: .8 },
  { region: 'Houston', name: 'Orbit', abbr: 'HOU', conf: 'West', div: 'Southwest', colors: ['#141d3b', '#f26b21'], icon: 'Rocket', pop: 7.5, known: 'Mission Control and the space program' },
  { region: 'Oklahoma City', name: 'Twisters', abbr: 'OKC', conf: 'West', div: 'Southwest', colors: ['#3f4b5a', '#f4a259'], icon: 'Tornado', pop: 1.48, known: 'Tornado Alley' },
  { region: 'Tulsa', name: 'Gushers', abbr: 'TUL', conf: 'West', div: 'Southwest', colors: ['#161616', '#e0b04a'], icon: 'Fuel', pop: 1.03, known: 'The Oil Capital of the World and Route 66' },
  { region: 'Tucson', name: 'Stargazers', abbr: 'TUC', conf: 'West', div: 'Southwest', colors: ['#1a1446', '#e98a4f'], icon: 'Telescope', pop: 1.07, known: 'Dark skies and its observatories' },
  { region: 'Fresno', name: 'Harvesters', abbr: 'FRE', conf: 'West', div: 'Pacific', colors: ['#5a3d74', '#a7c957'], icon: 'Grape', pop: 1.18, known: 'The Central Valley’s raisin and grape harvest' },
  { region: 'Minneapolis', name: 'Loons', abbr: 'MIN', conf: 'West', div: 'Northwest', colors: ['#16323b', '#9ed8db'], icon: 'Bird', pop: 3.7, known: 'Ten thousand lakes and the state bird' },
  { region: 'Calgary', name: 'Stampede', abbr: 'CGY', conf: 'West', div: 'Northwest', colors: ['#8a1c1c', '#f2c14e'], icon: 'Star', pop: 1.6, known: 'The Calgary Stampede rodeo' },
  { region: 'Edmonton', name: 'Roughnecks', abbr: 'EDM', conf: 'West', div: 'Northwest', colors: ['#16325c', '#f08a24'], icon: 'Drill', pop: 1.5, known: 'The oil sands workers' },
  { region: 'Mexico City', name: 'Águilas', abbr: 'MEX', conf: 'West', div: 'Southwest', colors: ['#0b5d3b', '#d4af37'], icon: 'Bird', pop: 22.3, known: 'The eagle on the cactus of the city’s founding', mkt: 1.3 },
  { region: 'Guadalajara', name: 'Mariachis', abbr: 'GDL', conf: 'West', div: 'Southwest', colors: ['#1a1a1a', '#c9a227'], icon: 'Guitar', pop: 5.3, known: 'The birthplace of mariachi' },
  { region: 'Monterrey', name: 'Montañeses', abbr: 'MTY', conf: 'West', div: 'Southwest', colors: ['#27496d', '#dfe7ec'], icon: 'Mountain', pop: 5.3, known: 'Cerro de la Silla and the Sierra Madre' },
  { region: 'Tijuana', name: 'Fronterizos', abbr: 'TIJ', conf: 'West', div: 'Pacific', colors: ['#b0302b', '#f2e6c9'], icon: 'Sun', pop: 2.2, known: 'The busiest border city in the world' },
  { region: 'Omaha', name: 'Stockyards', abbr: 'OMA', conf: 'West', div: 'Northwest', colors: ['#5b3a1e', '#e2c290'], icon: 'Wheat', pop: 0.98, known: 'Its stockyards and steak' },
  { region: 'Honolulu', name: 'Waves', abbr: 'HNL', conf: 'West', div: 'Pacific', colors: ['#127a7a', '#f7c8a3'], icon: 'TreePalm', pop: 0.99, known: 'Waikiki, the birthplace of modern surfing' },
  { region: 'Albuquerque', name: 'Roadrunners', abbr: 'ABQ', conf: 'West', div: 'Southwest', colors: ['#b5412a', '#f2d49b'], icon: 'Sun', pop: 0.92, known: 'New Mexico’s state bird and the high desert' },
];

// Market size from metro population (a multiplier on revenue and free-agent appeal).
export const marketOf = (f: Franchise) => f.mkt ?? +Math.max(0.65, Math.min(1.45, 0.65 + Math.log10(Math.max(1, f.pop)) * 0.55)).toFixed(2);
