// The Continental Championship Pathway (CCP): the league's development league (the NBA G League
// equivalent). Its clubs play in the most remote places in the U.S. and Canada. Every NBA club has
// one affiliate; one club is independent. Spares are used by expansion teams.
export interface CcpClub { key: string; city: string; where: string; name: string; abbr: string; icon: string; colors: [string, string]; note: string }

export const CCP_CLUBS: CcpClub[] = [
  { key: 'utq', city: 'Utqiaġvik', where: 'Alaska', name: 'Polar Nights', abbr: 'UTQ', icon: 'Moon', colors: ['#10233f', '#9fd3ff'], note: 'The northernmost town in the U.S. The sun doesn’t rise for 65 days every winter.' },
  { key: 'nom', city: 'Nome', where: 'Alaska', name: 'Mushers', abbr: 'NOM', icon: 'Snowflake', colors: ['#7a1c1c', '#f2e8d5'], note: 'The finish line of the Iditarod. No road connects it to the rest of Alaska.' },
  { key: 'adk', city: 'Adak', where: 'Alaska', name: 'Williwaws', abbr: 'ADK', icon: 'Wind', colors: ['#2f4858', '#b8d8d8'], note: 'The westernmost town in the U.S., out on the Aleutian chain, named for its violent mountain winds. About 170 people.' },
  { key: 'dut', city: 'Dutch Harbor', where: 'Alaska', name: 'Crabbers', abbr: 'DUT', icon: 'Anchor', colors: ['#c0392b', '#1b2a3a'], note: 'Home port of the Bering Sea crab fleet.' },
  { key: 'ddh', city: 'Deadhorse', where: 'Alaska', name: 'Roughnecks', abbr: 'DDH', icon: 'Drill', colors: ['#222222', '#f2b134'], note: 'An oil-field camp at the end of the Dalton Highway on the Arctic Ocean, with no permanent residents.' },
  { key: 'chk', city: 'Chicken', where: 'Alaska', name: 'Ptarmigans', abbr: 'CHK', icon: 'Bird', colors: ['#8a5a2b', '#f6e7c8'], note: 'Named Chicken because the founders couldn’t spell ptarmigan. About 10 people live there.' },
  { key: 'wht', city: 'Whittier', where: 'Alaska', name: 'Tunnel Rats', abbr: 'WHT', icon: 'TramFront', colors: ['#3d3d6b', '#e6c86e'], note: 'Almost the whole town lives in one 14-story building, reached by a one-lane tunnel that closes at night.' },
  { key: 'stp', city: 'St. Paul Island', where: 'Alaska', name: 'Fur Seals', abbr: 'STP', icon: 'Fish', colors: ['#264653', '#e9c46a'], note: 'A speck in the Bering Sea with the world’s largest northern fur seal colony.' },
  { key: 'dio', city: 'Little Diomede', where: 'Alaska', name: 'Date Liners', abbr: 'DIO', icon: 'Sunset', colors: ['#4a2c6d', '#f7a072'], note: '2.4 miles from Russia across the International Date Line: from shore you can see tomorrow.' },
  { key: 'alt', city: 'Alert', where: 'Nunavut', name: 'Sentinels', abbr: 'ALT', icon: 'TowerControl', colors: ['#b71c1c', '#fafafa'], note: 'The northernmost permanently inhabited place on Earth, 817 km from the North Pole.' },
  { key: 'gri', city: 'Grise Fiord', where: 'Nunavut', name: 'Walruses', abbr: 'GRI', icon: 'MountainSnow', colors: ['#5d4037', '#cfd8dc'], note: 'Canada’s northernmost civilian community, about 150 people.' },
  { key: 'res', city: 'Resolute', where: 'Nunavut', name: 'Magnetics', abbr: 'RES', icon: 'Compass', colors: ['#283593', '#ff8a65'], note: 'Near the north magnetic pole, where compasses stop making sense.' },
  { key: 'iqa', city: 'Iqaluit', where: 'Nunavut', name: 'Auroras', abbr: 'IQA', icon: 'Sparkles', colors: ['#0d3b2e', '#7cf2c4'], note: 'The capital of Nunavut, with no road in or out.' },
  { key: 'tuk', city: 'Tuktoyaktuk', where: 'Northwest Territories', name: 'Pingos', abbr: 'TUK', icon: 'Mountain', colors: ['#37474f', '#80deea'], note: 'On the Arctic Ocean beside the pingos, hills with a core of solid ice.' },
  { key: 'inu', city: 'Inuvik', where: 'Northwest Territories', name: 'Ice Truckers', abbr: 'INU', icon: 'Castle', colors: ['#1a237e', '#e0e0e0'], note: 'Once reached in winter only by an ice road over the frozen Mackenzie River; home of the Igloo Church.' },
  { key: 'chu', city: 'Churchill', where: 'Manitoba', name: 'Polar Bears', abbr: 'CHU', icon: 'Snowflake', colors: ['#f5f5f5', '#1e88e5'], note: 'The polar bear capital of the world, reachable only by train or plane.' },
  { key: 'daw', city: 'Dawson City', where: 'Yukon', name: 'Sourtoes', abbr: 'DAW', icon: 'Beer', colors: ['#6d4c41', '#ffd54f'], note: 'Klondike gold-rush town and home of the Sourtoe Cocktail, served with a real mummified toe.' },
  { key: 'olc', city: 'Old Crow', where: 'Yukon', name: 'Caribou', abbr: 'OLC', icon: 'Feather', colors: ['#3e2723', '#bcaaa4'], note: 'The Yukon’s only fly-in community, north of the Arctic Circle.' },
  { key: 'nai', city: 'Nain', where: 'Labrador', name: 'Icebergs', abbr: 'NAI', icon: 'Waves', colors: ['#01579b', '#b3e5fc'], note: 'Labrador’s northernmost town: by boat or plane only.' },
  { key: 'fog', city: 'Fogo Island', where: 'Newfoundland', name: 'Flat Earthers', abbr: 'FOG', icon: 'Circle', colors: ['#004d40', '#ffcc80'], note: 'Brimstone Head here is said to be one of the four corners of the flat Earth.' },
  { key: 'hai', city: 'Haida Gwaii', where: 'British Columbia', name: 'Ravens', abbr: 'HAI', icon: 'Bird', colors: ['#212121', '#e53935'], note: 'Islands at the edge of the continental shelf, an eight-hour ferry from the mainland.' },
  { key: 'fch', city: 'Fort Chipewyan', where: 'Alberta', name: 'Voyageurs', abbr: 'FCH', icon: 'Sailboat', colors: ['#4e342e', '#ffb74d'], note: 'Alberta’s oldest settlement. In winter the only road in is made of ice.' },
  { key: 'ptr', city: 'Point Roberts', where: 'Washington', name: 'Exclaves', abbr: 'PTR', icon: 'Flag', colors: ['#0d47a1', '#ef5350'], note: 'A U.S. town you can only drive to by going through Canada.' },
  { key: 'nwa', city: 'Northwest Angle', where: 'Minnesota', name: 'Walleyes', abbr: 'NWA', icon: 'Fish', colors: ['#1b5e20', '#fdd835'], note: 'The only part of the lower 48 north of the 49th parallel, reached through Canada or across Lake of the Woods.' },
  { key: 'sup', city: 'Supai', where: 'Arizona', name: 'Mule Train', abbr: 'SUP', icon: 'Sunset', colors: ['#bf360c', '#4dd0e1'], note: 'At the bottom of the Grand Canyon, where the mail still arrives by mule.' },
  { key: 'mon', city: 'Monowi', where: 'Nebraska', name: 'Ones', abbr: 'MON', icon: 'Star', colors: ['#5d4037', '#ffe082'], note: 'Population 1: its one resident is the mayor, the clerk and the bartender.' },
  { key: 'tan', city: 'Tangier Island', where: 'Virginia', name: 'Soft Shells', abbr: 'TAN', icon: 'Shell', colors: ['#006064', '#ffab91'], note: 'A shrinking Chesapeake island where people still speak a centuries-old English dialect.' },
  { key: 'ocr', city: 'Ocracoke', where: 'North Carolina', name: 'Blackbeards', abbr: 'OCR', icon: 'Skull', colors: ['#111111', '#d4af37'], note: 'Where Blackbeard was killed in 1718. Ferry only.' },
  { key: 'bvi', city: 'Beaver Island', where: 'Michigan', name: 'Kings', abbr: 'BVI', icon: 'Crown', colors: ['#4a148c', '#ffd740'], note: 'Once ruled by a self-proclaimed king. Ferry or small plane only.' },
  { key: 'han', city: 'Hāna', where: 'Hawaii', name: 'Switchbacks', abbr: 'HAN', icon: 'TreePalm', colors: ['#00695c', '#ffca28'], note: 'At the end of a road with 620 curves and 59 bridges.' },
  { key: 'ter', city: 'Terlingua', where: 'Texas', name: 'Chili Heads', abbr: 'TER', icon: 'Flame', colors: ['#b71c1c', '#ffcc80'], note: 'A Big Bend ghost town that hosts a world chili championship.' },
  { key: 'cen', city: 'Centralia', where: 'Pennsylvania', name: 'Smolder', abbr: 'CEN', icon: 'CloudFog', colors: ['#424242', '#ff7043'], note: 'A ghost town with a coal-seam fire that has burned underground since 1962.' },
  { key: 'dvl', city: 'Death Valley', where: 'California', name: 'Scorchers', abbr: 'DVL', icon: 'Sun', colors: ['#e65100', '#fff3e0'], note: 'The hottest place on Earth (134°F) and 282 feet below sea level.' },
  { key: 'jar', city: 'Jarbidge', where: 'Nevada', name: 'Stagecoach Robbers', abbr: 'JAR', icon: 'Pickaxe', colors: ['#6d4c41', '#b0bec5'], note: 'Gold-rush town and site of the last stagecoach robbery in the U.S., 1916.' },
];

// Which club is each NBA team's affiliate (by NBA abbreviation). Teams not listed get a spare.
export const CCP_AFFIL: Record<string, string> = {
  BAL: 'tuk', NY: 'iqa', BKN: 'gri', NWK: 'nai', PHI: 'cen', CLE: 'bvi', DET: 'nwa', CHI: 'chu', PIT: 'res', CIN: 'mon',
  CHA: 'ocr', ATL: 'olc', TPA: 'fog', RIC: 'tan', NSH: 'inu',
  SEA: 'ptr', POR: 'hai', VAN: 'daw', STL: 'utq', DEN: 'chk', SD: 'han', OAK: 'adk', LV: 'jar', LA: 'dvl', SJ: 'wht',
  AUS: 'ter', SA: 'stp', PHX: 'sup', DAL: 'nom', HOU: 'ddh',
};
export const CCP_INDEPENDENT = 'alt';
export const CCP_SPARES = ['dut', 'dio', 'fch'];
export const ccpClub = (key: string) => CCP_CLUBS.find(c => c.key === key);
