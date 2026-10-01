// Leagues and their clubs, by country, for the God Mode "Playing for" picker: pick a league,
// then one of its teams (or type any league or team by hand). Real top divisions with their
// full club lists where we have them; clubs() in world.ts is merged in so nothing is missing.
import { clubs, COLLEGES } from './world';

// Teams in this season's EuroLeague.
export const EUROLEAGUE = ['Real Madrid', 'FC Barcelona', 'Baskonia', 'Valencia Basket', 'Olympiacos', 'Panathinaikos', 'Fenerbahçe', 'Anadolu Efes', 'Crvena zvezda', 'Partizan', 'Žalgiris Kaunas', 'Paris Basketball', 'ASVEL', 'AS Monaco', 'Bayern Munich', 'Olimpia Milano', 'Virtus Bologna', 'Maccabi Tel Aviv', 'Hapoel Tel Aviv'];

const MORE_COLLEGES = ['Syracuse', 'Louisville', 'Ohio State', 'Wisconsin', 'Illinois', 'Maryland', 'Texas Tech', 'Miami', 'Xavier', 'Providence', 'St. John’s', 'Georgetown', 'Seton Hall', 'Butler', 'San Diego State', 'BYU', 'Utah', 'Colorado', 'Oklahoma', 'Oklahoma State', 'LSU', 'Ole Miss', 'Mississippi State', 'Georgia', 'South Carolina', 'Missouri', 'Texas A&M', 'Vanderbilt', 'Wake Forest', 'NC State', 'Clemson', 'Florida State', 'Notre Dame', 'Pittsburgh', 'Stanford', 'California', 'Washington', 'Northwestern', 'Iowa', 'Minnesota', 'Nebraska', 'Rutgers', 'Penn State', 'Cincinnati', 'West Virginia', 'Kansas State', 'TCU', 'Dayton', 'VCU', 'Nevada', 'New Mexico', 'Florida Atlantic', 'Wichita State'];

export const LEAGUES: Record<string, Record<string, string[]>> = {
  US: {
    NCAA: [...COLLEGES, ...MORE_COLLEGES].sort(),
    'High school': ['Montverde Academy', 'IMG Academy', 'Oak Hill Academy', 'Sierra Canyon', 'Link Academy', 'Prolific Prep', 'Brewster Academy', 'Columbus (FL)', 'La Lumiere', 'Wasatch Academy', 'AZ Compass Prep', 'Sunrise Christian Academy', 'Mater Dei', 'Duncanville', 'DeMatha Catholic', 'Paul VI', 'Archbishop Stepinac', 'Harvard-Westlake', 'Dynamic Prep', 'Long Island Lutheran'],
    'Overtime Elite': ['City Reapers', 'YNG Dreamerz', 'Cold Hearts', 'Blue Checks', 'Diamond Doves', 'Jelly Fam', 'RWE', 'Fear of God Athletics'],
  },
  CA: {
    CEBL: ['Brampton Honey Badgers', 'Calgary Surge', 'Edmonton Stingers', 'Montreal Alliance', 'Niagara River Lions', 'Ottawa BlackJacks', 'Saskatchewan Rattlers', 'Scarborough Shooting Stars', 'Vancouver Bandits', 'Winnipeg Sea Bears'],
    'U Sports': ['Carleton Ravens', 'UBC Thunderbirds', 'McGill Redbirds', 'TMU Bold', 'Laval Rouge et Or', 'Queen’s Gaels', 'Ottawa Gee-Gees', 'Alberta Golden Bears', 'Western Mustangs', 'Brock Badgers'],
    'Prep school': ['Orangeville Prep', 'Athlete Institute', 'Crestwood Prep', 'Canada Topflight Academy', 'Fort Erie International Academy', 'Uplay Canada'],
  },
  ES: {
    'Liga ACB': ['Real Madrid', 'FC Barcelona', 'Valencia Basket', 'Unicaja Málaga', 'Baskonia', 'Joventut Badalona', 'La Laguna Tenerife', 'Gran Canaria', 'UCAM Murcia', 'BAXI Manresa', 'Casademont Zaragoza', 'Bàsquet Girona', 'Río Breogán', 'MoraBanc Andorra', 'Covirán Granada', 'Hiopos Lleida', 'Surne Bilbao Basket', 'Leyma Coruña'],
    'Primera FEB': ['Estudiantes', 'Fuenlabrada', 'Real Betis', 'Obradoiro', 'Palencia', 'Burgos', 'Gipuzkoa Basket', 'Valladolid', 'Ourense'],
  },
  FR: {
    'LNB Élite': ['Paris Basketball', 'ASVEL', 'AS Monaco', 'Le Mans Sarthe', 'Nanterre 92', 'Metropolitans 92', 'JL Bourg', 'Strasbourg SIG', 'Cholet Basket', 'Limoges CSP', 'Élan Chalon', 'BCM Gravelines-Dunkerque', 'ESSM Le Portel', 'Saint-Quentin', 'JDA Dijon', 'ADA Blois'],
    'Pro B': ['Orléans Loiret', 'Roanne', 'Pau-Lacq-Orthez', 'Rouen Métropole', 'Nancy', 'Évreux', 'Boulazac', 'Fos Provence', 'Champagne Basket', 'Antibes Sharks'],
  },
  DE: { BBL: ['Bayern Munich', 'ALBA Berlin', 'ratiopharm Ulm', 'Bamberg Baskets', 'Telekom Baskets Bonn', 'Niners Chemnitz', 'MHP Riesen Ludwigsburg', 'Würzburg Baskets', 'Rostock Seawolves', 'Veolia Towers Hamburg', 'Löwen Braunschweig', 'Syntainics MBC', 'Skyliners Frankfurt', 'EWE Baskets Oldenburg', 'MLP Academics Heidelberg', 'Rasta Vechta', 'Medi Bayreuth', 'BG Göttingen'] },
  IT: { 'Serie A': ['Olimpia Milano', 'Virtus Bologna', 'Reyer Venezia', 'Treviso Basket', 'Dinamo Sassari', 'Pallacanestro Trieste', 'Derthona Tortona', 'Pallacanestro Varese', 'Aquila Trento', 'Napoli Basket', 'Germani Brescia', 'Vanoli Cremona', 'Pallacanestro Reggiana', 'Scafati', 'Trapani Shark', 'Pistoia'] },
  GR: { 'Greek Basket League': ['Olympiacos', 'Panathinaikos', 'PAOK', 'AEK Athens', 'Aris Thessaloniki', 'Peristeri', 'Promitheas Patras', 'Kolossos Rhodes', 'Lavrio', 'Karditsa', 'Maroussi', 'Panionios'] },
  TR: { 'Basketbol Süper Ligi': ['Fenerbahçe', 'Anadolu Efes', 'Beşiktaş', 'Türk Telekom', 'Galatasaray', 'Pınar Karşıyaka', 'Tofaş', 'Darüşşafaka', 'Bahçeşehir Koleji', 'Manisa Basket', 'Büyükçekmece', 'Aliağa Petkimspor', 'Merkezefendi', 'Bursaspor', 'Trabzonspor'] },
  LT: { LKL: ['Žalgiris Kaunas', 'Rytas Vilnius', 'Lietkabelis', 'Neptūnas Klaipėda', 'Juventus Utena', 'Šiauliai', 'Nevėžis Kėdainiai', 'Wolves Vilnius', 'Jonava', 'Gargždai'] },
  RS: { 'ABA League': ['Crvena zvezda', 'Partizan', 'Mega Basket', 'FMP Belgrade', 'Borac Čačak', 'Spartak Subotica'], KLS: ['Vojvodina', 'Dynamic', 'Zlatibor', 'Sloboda Užice', 'Metalac Valjevo', 'OKK Beograd'] },
  HR: { 'ABA League': ['Cibona', 'KK Split', 'KK Zadar'], 'Premijer liga': ['Cibona', 'KK Split', 'KK Zadar', 'Cedevita Junior', 'Dubrava', 'Alkar Sinj', 'GKK Šibenka'] },
  SI: { 'ABA League': ['Cedevita Olimpija', 'Krka'], 'Slovenian League': ['Cedevita Olimpija', 'Krka', 'Helios Suns', 'Šentjur', 'Rogaška'] },
  ME: { 'ABA League': ['Budućnost', 'SC Derby', 'Mornar Bar'] },
  BA: { 'ABA League': ['Igokea', 'Borac Banja Luka'], 'Bosnian League': ['Igokea', 'Borac Banja Luka', 'Široki', 'Bosna', 'Sloboda Tuzla'] },
  IL: { 'Israeli Premier League': ['Maccabi Tel Aviv', 'Hapoel Tel Aviv', 'Hapoel Jerusalem', 'Hapoel Holon', 'Bnei Herzliya', 'Maccabi Ra’anana', 'Hapoel Be’er Sheva', 'Ironi Kiryat Ata', 'Hapoel Galil Elyon', 'Maccabi Rishon LeZion', 'Ironi Ness Ziona', 'Elitzur Netanya'] },
  LV: { 'Latvian-Estonian League': ['VEF Rīga', 'Rīgas Zeļļi', 'Ventspils', 'Valmiera', 'Liepāja', 'Ogre', 'Jēkabpils'] },
  GE: { 'Georgian Superleague': ['Rustavi', 'Dinamo Tbilisi', 'TSU Tbilisi', 'Kutaisi', 'Vera Tbilisi', 'Batumi'] },
  FI: { Korisliiga: ['Helsinki Seagulls', 'Kataja', 'Karhu Kauhajoki', 'Tampereen Pyrintö', 'Salon Vilpas', 'Lapuan Korikobrat', 'Bisons Loimaa', 'Kouvot', 'KTP Kotka', 'Tapiolan Honka', 'BC Nokia'] },
  GB: { 'Super League Basketball': ['London Lions', 'Leicester Riders', 'Sheffield Sharks', 'Bristol Flyers', 'Newcastle Eagles', 'Cheshire Phoenix', 'Caledonia Gladiators', 'Surrey 89ers', 'Manchester Basketball'] },
  AU: { NBL: ['Sydney Kings', 'Melbourne United', 'Perth Wildcats', 'Brisbane Bullets', 'Adelaide 36ers', 'Illawarra Hawks', 'South East Melbourne Phoenix', 'Cairns Taipans', 'Tasmania JackJumpers'], NBL1: ['Frankston Blues', 'Knox Raiders', 'Norths Bears', 'Perry Lakes Hawks', 'Southern Districts Spartans', 'Canberra Gunners', 'Sturt Sabres', 'Ipswich Force'] },
  NZ: { NBL: ['New Zealand Breakers'], 'NZ National Basketball League': ['Auckland Tuatara', 'Canterbury Rams', 'Wellington Saints', 'Otago Nuggets', 'Taranaki Airs', 'Nelson Giants', 'Manawatu Jets', 'Southland Sharks', 'Hawke’s Bay Hawks', 'Franklin Bulls'] },
  JP: { 'B.League': ['Alvark Tokyo', 'Chiba Jets', 'Ryukyu Golden Kings', 'Utsunomiya Brex', 'Kawasaki Brave Thunders', 'Yokohama B-Corsairs', 'Sunrockers Shibuya', 'Levanga Hokkaido', 'Sendai 89ers', 'Akita Northern Happinets', 'Ibaraki Robots', 'Gunma Crane Thunders', 'Koshigaya Alphas', 'San-en NeoPhoenix', 'Seahorses Mikawa', 'Nagoya Diamond Dolphins', 'FE Nagoya', 'Shiga Lakes', 'Kyoto Hannaryz', 'Osaka Evessa', 'Shimane Susanoo Magic', 'Hiroshima Dragonflies', 'Saga Ballooners', 'Toyama Grouses'] },
  KR: { KBL: ['Seoul SK Knights', 'Seoul Samsung Thunders', 'Changwon LG Sakers', 'Suwon KT Sonicboom', 'Anyang Jung Kwan Jang Red Boosters', 'Busan KCC Egis', 'Wonju DB Promy', 'Ulsan Hyundai Mobis Phoebus', 'Goyang Sono Skygunners', 'Daegu KOGAS Pegasus'] },
  PH: { PBA: ['San Miguel Beermen', 'Barangay Ginebra San Miguel', 'TNT Tropang Giga', 'Magnolia Hotshots', 'Meralco Bolts', 'Rain or Shine Elasto Painters', 'NLEX Road Warriors', 'Converge FiberXers', 'Phoenix Fuel Masters', 'NorthPort Batang Pier', 'Blackwater Bossing', 'Terrafirma Dyip'], UAAP: ['Ateneo', 'La Salle', 'UP', 'UST', 'FEU', 'NU', 'Adamson', 'UE'] },
  BR: { NBB: ['Flamengo', 'Franca', 'Minas', 'Paulistano', 'Pinheiros', 'Corinthians', 'São Paulo', 'Bauru', 'Brasília', 'Caxias do Sul', 'Pato Basquete', 'Unifacisa', 'Mogi', 'Fortaleza Basquete Cearense', 'Vasco da Gama'] },
  AR: { 'Liga Nacional': ['Quimsa', 'Boca Juniors', 'Instituto', 'Obras Sanitarias', 'San Lorenzo', 'Peñarol Mar del Plata', 'Regatas Corrientes', 'Ferro Carril Oeste', 'Gimnasia Comodoro', 'Platense', 'Oberá', 'Atenas de Córdoba', 'Olímpico La Banda', 'Argentino de Junín', 'Riachuelo', 'Independiente de Oliva', 'Zárate', 'Unión de Santa Fe'] },
  MX: { LNBP: ['Fuerza Regia', 'Astros de Jalisco', 'Diablos Rojos del México', 'Halcones de Xalapa', 'Soles de Mexicali', 'Libertadores de Querétaro', 'Panteras de Aguascalientes', 'Mineros de Zacatecas', 'Abejas de León', 'Dorados de Chihuahua', 'Correcaminos UAT', 'Santos del Potosí'] },
  PR: { BSN: ['Cangrejeros de Santurce', 'Capitanes de Arecibo', 'Vaqueros de Bayamón', 'Leones de Ponce', 'Atléticos de San Germán', 'Piratas de Quebradillas', 'Mets de Guaynabo', 'Criollos de Caguas', 'Santeros de Aguada', 'Osos de Manatí', 'Indios de Mayagüez', 'Gigantes de Carolina'] },
  DO: { 'LNB Dominicana': ['Leones de Santo Domingo', 'Metros de Santiago', 'Titanes del Distrito Nacional', 'Reales de La Vega', 'Indios de San Francisco de Macorís', 'Cañeros del Este', 'Marineros de Puerto Plata', 'Soles de Santo Domingo Este'] },
  CN: { CBA: [] },
  RU: { 'VTB United League': ['CSKA Moscow', 'Zenit Saint Petersburg', 'UNICS Kazan', 'Lokomotiv Kuban', 'Parma Perm', 'Avtodor Saratov', 'Pari Nizhny Novgorod', 'Samara', 'Enisey Krasnoyarsk', 'MBA-MAI Moscow', 'Uralmash Yekaterinburg'], 'Super League 1': ['Novosibirsk', 'Spartak-Primorye Vladivostok', 'Irkut Irkutsk', 'Temp-SUMZ Revda', 'Chelyabinsk'] },
  BY: { 'VTB United League': ['Minsk'], 'Belarusian Premier League': ['Minsk', 'Borisfen Mogilev', 'Grodno-93', 'Rubon Vitebsk'] },
  KZ: { 'Kazakhstan National League': ['Astana', 'Barsy Atyrau', 'Kaspiy Aktau'] },
  UA: { 'Ukrainian Superleague': ['Prometey', 'Budivelnyk Kyiv', 'Kyiv-Basket', 'Dnipro', 'Khimik Yuzhne', 'Cherkaski Mavpy', 'Kharkivski Sokoly', 'Zaporizhzhia'] },
  PL: { 'Orlen Basket Liga': ['Śląsk Wrocław', 'Legia Warsaw', 'Trefl Sopot', 'King Szczecin', 'Anwil Włocławek', 'Stal Ostrów Wielkopolski', 'Arka Gdynia', 'Zastal Zielona Góra', 'Start Lublin', 'MKS Dąbrowa Górnicza', 'Czarni Słupsk', 'Górnik Wałbrzych'] },
  CZ: { 'Czech NBL': ['ERA Nymburk', 'BK Opava', 'BK Pardubice', 'NH Ostrava', 'USK Praha', 'Basket Brno', 'BK Děčín', 'BC Kolín', 'Ústí nad Labem'] },
  HU: { 'NB I/A': ['Falco Szombathely', 'Szolnoki Olajbányász', 'Alba Fehérvár', 'Egis Körmend', 'Atomerőmű Paks', 'Kecskemét', 'Sopron KC', 'Zalaegerszeg', 'DEAC'] },
  RO: { 'Liga Națională': ['U-BT Cluj-Napoca', 'CSM Oradea', 'Rapid București', 'FC Argeș Pitești', 'CSO Voluntari', 'SCM Craiova', 'Dinamo București', 'CSM Constanța'] },
  BG: { 'NBL Bulgaria': ['Levski Sofia', 'Rilski Sportist', 'Balkan Botevgrad', 'Spartak Pleven', 'Beroe', 'Academic Plovdiv', 'Cherno More', 'Shumen'] },
  MK: { 'Macedonian First League': ['Rabotnički', 'MZT Skopje', 'Pelister', 'Kumanovo', 'TFT Skopje'] },
  AT: { 'Basketball Superliga': ['Kapfenberg Bulls', 'BC Vienna', 'Gmunden Swans', 'Oberwart Gunners', 'Klosterneuburg Dukes', 'Traiskirchen Lions'] },
  EE: { 'Latvian-Estonian League': ['Kalev/Cramo', 'Tartu Ülikool', 'Pärnu Sadam', 'Rapla', 'Viimsi'] },
  BE: { 'BNXT League': ['Filou Oostende', 'Antwerp Giants', 'Spirou Charleroi', 'Mons-Hainaut', 'Liège Basket', 'Limburg United', 'Kangoeroes Mechelen', 'Brussels Basketball', 'Leuven Bears'] },
  NL: { 'BNXT League': ['Heroes Den Bosch', 'ZZ Leiden', 'Donar Groningen', 'Landstede Hammers', 'Feyenoord', 'BAL Weert', 'Yoast United', 'Den Helder Suns'] },
  PT: { 'Liga Betclic': ['Benfica', 'FC Porto', 'Sporting CP', 'Oliveirense', 'Imortal', 'Ovarense', 'Galitos Barreiro', 'Esgueira'] },
  DK: { Basketligaen: ['Bakken Bears', 'Svendborg Rabbits', 'Horsens IC', 'Copenhagen', 'Randers Cimbria', 'Team FOG Næstved'] },
  SE: { Basketligan: ['Norrköping Dolphins', 'Södertälje Kings', 'BC Luleå', 'Borås Basket', 'Uppsala Basket', 'Jämtland Basket', 'Köping Stars', 'Norrort'] },
  VE: { 'Superliga Venezuela': ['Guaros de Lara', 'Spartans Distrito Capital', 'Trotamundos de Carabobo', 'Cocodrilos de Caracas', 'Marinos de Anzoátegui', 'Gaiteros del Zulia', 'Bucaneros de La Guaira'] },
  UY: { 'Liga Uruguaya': ['Nacional', 'Peñarol', 'Aguada', 'Defensor Sporting', 'Hebraica Macabi', 'Trouville', 'Biguá', 'Malvín', 'Goes'] },
  LB: { 'Lebanese Basketball League': ['Al Riyadi Beirut', 'Sagesse', 'Homenetmen Beirut', 'Beirut Club', 'Antranik', 'Champville'] },
  IR: { 'Iranian Super League': ['Shahrdari Gorgan', 'Zob Ahan Isfahan', 'Mahram Tehran', 'Chemidor Qom', 'Naft Abadan'] },
  TW: { TPBL: ['Kaohsiung Aquas', 'New Taipei Kings', 'Formosa Dreamers', 'New Taipei CTBC DEA', 'Taichung Suns', 'Taoyuan Leopards', 'Taipei Taishin Mars'], 'P. League+': ['Taipei Fubon Braves', 'Taoyuan Pauian Pilots', 'Hsinchu Toplus Lioneers', 'Kaohsiung 17LIVE Steelers'] },
  EG: { 'Egyptian Super League': ['Al Ahly', 'Zamalek', 'Al Ittihad Alexandria', 'Gezira', 'Smouha'] },
  TN: { 'Championnat Pro A': ['US Monastir', 'Club Africain', 'Ezzahra Sports', 'ES Radès', 'Étoile du Sahel'] },
  MA: { 'Division Excellence': ['FUS Rabat', 'AS Salé', 'Wydad Casablanca', 'Raja Casablanca'] },
  NG: { 'Nigerian Premier League': ['Rivers Hoopers', 'Kwara Falcons', 'Kano Pillars', 'Gombe Bulls'] },
  SN: { 'Nationale 1': ['AS Douanes', 'ASC Ville de Dakar', 'DUC Dakar', 'Jeanne d’Arc', 'US Rail'] },
  RW: { 'Rwanda Basketball League': ['APR', 'REG', 'Patriots', 'Espoir', 'Kepler'] },
  CM: { 'Elite Messieurs': ['FAP Yaoundé', 'Mindef Yaoundé', 'Condor Yaoundé'] },
  AO: { 'Angolan Unitel League': ['Petro de Luanda', 'Primeiro de Agosto', 'Interclube', 'ASA', 'Sporting de Luanda', 'Marinha'] },
};

const uniq = (a: string[]) => [...new Set(a)];

// How high each league sits (1 = the top level a player can play at outside the NBA).
// Leagues not named here are their country's top division (tier 1).
const TIER: Record<string, number> = {
  EuroLeague: 1, 'Primera FEB': 2, 'Pro B': 2, KLS: 2, 'Premijer liga': 2, 'Slovenian League': 2, 'Bosnian League': 2,
  NBL1: 2, 'NZ National Basketball League': 2, 'Overtime Elite': 2, 'U Sports': 2, UAAP: 2, 'Angolan Unitel League': 2,
  'Domestic league': 2, 'Super League 1': 2, 'Belarusian Premier League': 2, 'P. League+': 1, 'High school': 3, 'Prep school': 3, Junior: 4,
};
export const tierOf = (lg: string) => TIER[lg] ?? 1;

// The leagues in a country, each with its teams. Young (still in school) players get the
// junior sides too.
export function leaguesIn(country: string): { lg: string; teams: string[]; tier: number }[] {
  const base = LEAGUES[country] || {}, cc = (clubs() as Record<string, string[][]>)[country] || [];
  const out: Record<string, string[]> = {};
  for (const [lg, ts] of Object.entries(base)) out[lg] = ts.slice();
  // Merge the clubs the game already generates players for.
  for (const [team, lg] of cc) { const home = lg === 'EuroLeague' ? Object.keys(out).find(k => k !== 'EuroLeague') || 'Domestic league' : lg; out[home] = uniq([...(out[home] || []), team]); }
  const all = uniq(Object.values(out).flat());
  const el = EUROLEAGUE.filter(t => all.includes(t) || cc.some(k => k[0] === t && k[1] === 'EuroLeague'));
  const list = [...(el.length ? [{ lg: 'EuroLeague', teams: el }] : []), ...Object.entries(out).filter(([, ts]) => ts.length).map(([lg, teams]) => ({ lg, teams }))];
  // Junior sides of the domestic clubs (the U18 teams prospects play for).
  if (country !== 'US') { const pro = uniq(list.filter(x => x.lg !== 'EuroLeague' && tierOf(x.lg) < 3).flatMap(x => x.teams)); if (pro.length) list.push({ lg: 'Junior', teams: pro.map(t => t + ' U18') }); }
  // Top tier first, then down (the order within a tier is the order above).
  return list.map((x, i) => ({ ...x, tier: tierOf(x.lg), i })).sort((a, b) => a.tier - b.tier || a.i - b.i).map(({ i, ...x }) => x);
}
