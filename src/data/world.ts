import { NATIONS } from './nations';
// World data: countries, name pools, clubs, scouting regions and roster roles.
// Ported from the Claude Design prototype (GM App.dc.html).

let nativeMapCache: any = null;

export function countries() {
  const W = { white: 1 }, B = { black: 1 }, A = { asian: 1 };
  const c = (n, iso, race, pool, cities, x?): any => ({ n, iso, race, pool, cities, ...(x || {}) });
  return {
    US: c('United States', 'us', { black: .62, white: .3, brown: .08 }, 'us', ['Atlanta', 'Chicago', 'Houston', 'Los Angeles', 'Philadelphia', 'Detroit', 'Oakland', 'Baltimore', 'Memphis', 'Indianapolis', 'Queens', 'Dallas'], { soli: 1 }),
    CA: c('Canada', 'ca', { black: .5, white: .4, brown: .1 }, 'us', ['Toronto', 'Montreal', 'Mississauga', 'Brampton', 'Vancouver', 'Hamilton'], { soli: 1 }),
    BS: c('Bahamas', 'bs', B, 'us', ['Nassau', 'Freeport']),
    BR: c('Brazil', 'br', { brown: .5, black: .3, white: .2 }, 'pt', ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Belo Horizonte', 'Franca'], { soli: 1 }),
    AR: c('Argentina', 'ar', { white: .8, brown: .2 }, 'es', ['Buenos Aires', 'Córdoba', 'Rosario', 'Bahía Blanca'], { soli: 1 }),
    MX: c('Mexico', 'mx', { brown: .85, white: .15 }, 'la', ['Mexico City', 'Monterrey', 'Guadalajara'], { soli: 1 }),
    DO: c('Dominican Republic', 'do', { brown: .6, black: .4 }, 'la', ['Santo Domingo', 'Santiago de los Caballeros']),
    PR: c('Puerto Rico', 'pr', { brown: .6, black: .25, white: .15 }, 'la', ['San Juan', 'Bayamón', 'Ponce'], { soli: 1 }),
    FR: c('France', 'fr', { white: .45, black: .5, brown: .05 }, 'fr', ['Paris', 'Lyon', 'Le Mans', 'Strasbourg', 'Villeurbanne', 'Nanterre'], { eu: 1 }),
    ES: c('Spain', 'es', { white: .9, black: .1 }, 'es', ['Madrid', 'Barcelona', 'Málaga', 'Valencia', 'Badalona'], { eu: 1 }),
    DE: c('Germany', 'de', { white: .75, black: .25 }, 'de', ['Berlin', 'Munich', 'Hamburg', 'Bamberg', 'Ulm'], { eu: 1 }),
    IT: c('Italy', 'it', { white: .9, black: .1 }, 'it', ['Milan', 'Bologna', 'Rome', 'Treviso', 'Varese'], { eu: 1 }),
    GR: c('Greece', 'gr', { white: .92, black: .08 }, 'gr', ['Athens', 'Thessaloniki', 'Piraeus', 'Patras'], { eu: 1 }),
    RS: c('Serbia', 'rs', W, 'rs', ['Belgrade', 'Novi Sad', 'Niš', 'Sombor'], { eu: 1 }),
    HR: c('Croatia', 'hr', W, 'hr', ['Zagreb', 'Split', 'Zadar', 'Šibenik'], { eu: 1 }),
    SI: c('Slovenia', 'si', W, 'si', ['Ljubljana', 'Maribor', 'Koper'], { eu: 1 }),
    ME: c('Montenegro', 'me', W, 'rs', ['Podgorica', 'Nikšić'], { eu: 1 }),
    BA: c('Bosnia and Herzegovina', 'ba', W, 'rs', ['Sarajevo', 'Mostar', 'Tuzla'], { eu: 1 }),
    LT: c('Lithuania', 'lt', W, 'lt', ['Kaunas', 'Vilnius', 'Klaipėda', 'Šiauliai'], { eu: 1 }),
    LV: c('Latvia', 'lv', W, 'lv', ['Riga', 'Liepāja', 'Ventspils'], { eu: 1 }),
    FI: c('Finland', 'fi', W, 'fi', ['Helsinki', 'Espoo', 'Tampere'], { eu: 1 }),
    TR: c('Türkiye', 'tr', { white: .85, brown: .15 }, 'tr', ['Istanbul', 'Ankara', 'Izmir', 'Bursa'], { eu: 1 }),
    IL: c('Israel', 'il', { white: .9, black: .1 }, 'il', ['Tel Aviv', 'Jerusalem', 'Haifa', 'Herzliya'], { eu: 1 }),
    GE: c('Georgia', 'ge', W, 'ge', ['Tbilisi', 'Kutaisi', 'Batumi'], { eu: 1 }),
    GB: c('Great Britain', 'gb', { white: .55, black: .45 }, 'au', ['London', 'Manchester', 'Leicester'], { eu: 1 }),
    NG: c('Nigeria', 'ng', B, 'ng', ['Lagos', 'Abuja', 'Ibadan', 'Enugu']),
    SN: c('Senegal', 'sn', B, 'sn', ['Dakar', 'Thiès', 'Saint-Louis']),
    ML: c('Mali', 'ml', B, 'ml', ['Bamako', 'Kayes']),
    CM: c('Cameroon', 'cm', B, 'cm', ['Yaoundé', 'Douala', 'Bafoussam']),
    CD: c('DR Congo', 'cd', B, 'cd', ['Kinshasa', 'Lubumbashi']),
    SS: c('South Sudan', 'ss', B, 'ss', ['Juba', 'Wau', 'Malakal']),
    KE: c('Kenya', 'ke', B, 'ke', ['Nairobi', 'Kakuma']),
    AO: c('Angola', 'ao', B, 'ao', ['Luanda', 'Benguela', 'Lobito']),
    CI: c('Côte d’Ivoire', 'ci', B, 'ci', ['Abidjan', 'Bouaké', 'Yamoussoukro']),
    JM: c('Jamaica', 'jm', B, 'jm', ['Kingston', 'Montego Bay', 'Spanish Town']),
    VE: c('Venezuela', 've', { brown: .7, white: .2, black: .1 }, 'la', ['Caracas', 'Barquisimeto', 'Maracaibo', 'Valencia']),
    UY: c('Uruguay', 'uy', { white: .85, brown: .15 }, 'es', ['Montevideo', 'Salto', 'Paysandú']),
    AU: c('Australia', 'au', { white: .8, black: .15, brown: .05 }, 'au', ['Melbourne', 'Sydney', 'Perth', 'Brisbane', 'Adelaide', 'Canberra']),
    NZ: c('New Zealand', 'nz', { white: .6, brown: .4 }, 'au', ['Auckland', 'Wellington', 'Christchurch']),
    CN: c('China', 'cn', A, 'cn', ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Ürümqi', 'Qingdao']),
    JP: c('Japan', 'jp', A, 'jp', ['Tokyo', 'Osaka', 'Toyama', 'Sendai']),
    KR: c('South Korea', 'kr', A, 'kr', ['Seoul', 'Busan', 'Incheon']),
    PH: c('Philippines', 'ph', { asian: .6, brown: .4 }, 'ph', ['Manila', 'Cebu City', 'Quezon City']),
    ...moreCountries()
  };
}
// The rest of the world (nations.ts): look = the population groups' races by share.
function moreCountries() {
  const out: Record<string, any> = {};
  NATIONS.forEach(([code, n, , cities, spec, x]) => {
    const single = spec.length === 2 && !Array.isArray(spec[1]), gs: any[] = single ? [[n, 1, spec[0], spec[0], spec[1]]] : spec as any[];
    const race: Record<string, number> = {}, tot = gs.reduce((a, q) => a + q[1], 0);
    gs.forEach(q => Object.entries(q[4] as Record<string, number>).forEach(([k, v]) => (race[k] = (race[k] || 0) + v * q[1] / tot)));
    const lp = gs[0][3], pool = Array.isArray(lp) ? lp[0] : lp;
    out[code] = { n, iso: code.toLowerCase(), race, pool, cities, ...(x || {}) };
  });
  return out;
}

export function namePools() {
  return {
    us: { f: ['Marcus', 'Devin', 'Andre', 'Julian', 'Tyrese', 'Malik', 'Isaiah', 'Cole', 'Jalen', 'Darius', 'Keenan', 'Rashad', 'Elijah', 'Grant', 'Caleb', 'Xavier', 'Dante', 'Quincy', 'Jonah', 'Amir', 'Tobias', 'Reggie', 'Silas', 'Brandon', 'Wes', 'Jordan', 'Myles', 'Cam', 'Trey', 'Donovan', 'Austin', 'Kobe', 'Terrence', 'Zion', 'Garrett', 'Derrick'], l: ['Hale', 'Brennan', 'Whitfield', 'Harlow', 'Pruitt', 'Vance', 'Crowder', 'Ashby', 'Ridley', 'Marsh', 'Tillman', 'Greer', 'Holloway', 'Draper', 'Quarles', 'Abernathy', 'Mercer', 'Stroud', 'Farrow', 'Calloway', 'Renner', 'Bishop', 'Hollis', 'Lyle', 'Sykes', 'Blackwood', 'Tennant', 'Washington', 'Jefferson', 'Coleman', 'Brooks', 'Bryant', 'Hayes', 'Simmons', 'Porter', 'Walker', 'Reed', 'Fields', 'Dawson', 'Mitchell'] },
    pt: { f: ['Bruno', 'Lucas', 'Gabriel', 'Rafael', 'Thiago', 'Mateus', 'Vitor', 'Caio', 'Yago', 'Henrique', 'Leonardo'], l: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rocha', 'Barbosa', 'Carvalho'] },
    es: { f: ['Sergio', 'Pablo', 'Alejandro', 'Juan', 'Diego', 'Santiago', 'Nicolás', 'Facundo', 'Mateo', 'Iker', 'Álvaro', 'Hugo', 'Leandro', 'Gonzalo'], l: ['García', 'Fernández', 'López', 'Martínez', 'Navarro', 'Ruiz', 'Herrera', 'Vázquez', 'Castro', 'Romero', 'Delgado', 'Aguirre', 'Medina', 'Soto'] },
    fr: { f: ['Théo', 'Hugo', 'Mathis', 'Killian', 'Yanis', 'Lucas', 'Enzo', 'Louis', 'Adam', 'Nolan', 'Nathan', 'Maxime', 'Arthur', 'Axel', 'Victor', 'Timothé'], l: ['Martin', 'Bernard', 'Dubois', 'Lefèvre', 'Moreau', 'Laurent', 'Petit', 'Durand', 'Leroy', 'Roux', 'Fournier', 'Girard', 'Fontaine', 'Bonnet', 'Lambert', 'Mercier'] },
    de: { f: ['Maximilian', 'Jonas', 'Leon', 'Tim', 'Moritz', 'Niklas', 'Justus', 'Isaac', 'Lukas', 'Felix', 'Johannes'], l: ['Müller', 'Schmidt', 'Wagner', 'Becker', 'Hoffmann', 'Weber', 'Koch', 'Richter', 'Braun', 'Krüger', 'Schulz'] },
    it: { f: ['Matteo', 'Alessandro', 'Lorenzo', 'Simone', 'Nicolò', 'Gabriele', 'Achille', 'Davide', 'Riccardo'], l: ['Rossi', 'Bianchi', 'Ricci', 'Marino', 'Greco', 'Conti', 'Gallo', 'Fontana', 'Moretti', 'Esposito'] },
    gr: { f: ['Giorgos', 'Nikos', 'Kostas', 'Dimitris', 'Vasilis', 'Thanasis', 'Panagiotis', 'Yannis', 'Michalis'], l: ['Papadopoulos', 'Georgiou', 'Antonopoulos', 'Nikolaidis', 'Vlachos', 'Karras', 'Pappas', 'Dimitriou', 'Katsaros'] },
    rs: { f: ['Nikola', 'Luka', 'Bogdan', 'Marko', 'Stefan', 'Vasilije', 'Uroš', 'Nemanja', 'Aleksa', 'Filip', 'Dušan', 'Mihailo', 'Ognjen'], l: ['Petrović', 'Marković', 'Jovanović', 'Nikolić', 'Ilić', 'Popović', 'Savić', 'Kovačević', 'Stojanović', 'Lazić', 'Đorđević', 'Milić', 'Vuković'] },
    hr: { f: ['Ivan', 'Mario', 'Dario', 'Luka', 'Ante', 'Roko', 'Karlo', 'Toni'], l: ['Horvat', 'Babić', 'Marić', 'Knežević', 'Perić', 'Jurić', 'Matić', 'Pavlović'] },
    si: { f: ['Žiga', 'Klemen', 'Luka', 'Jaka', 'Rok', 'Nejc', 'Aljaž'], l: ['Novak', 'Horvat', 'Krajnc', 'Zupan', 'Kovač', 'Mlakar', 'Vidmar'] },
    lt: { f: ['Mantas', 'Tomas', 'Domantas', 'Rokas', 'Lukas', 'Arnas', 'Ignas', 'Deividas', 'Marius'], l: ['Kazlauskas', 'Jankauskas', 'Petrauskas', 'Vaitkus', 'Stankevičius', 'Žukauskas', 'Butkus', 'Paulauskas'] },
    lv: { f: ['Kristaps', 'Rodions', 'Artūrs', 'Dāvis', 'Rihards', 'Kārlis'], l: ['Bērziņš', 'Kalniņš', 'Ozols', 'Liepiņš', 'Krūmiņš', 'Zariņš'] },
    fi: { f: ['Mikael', 'Elias', 'Onni', 'Sasu', 'Lauri', 'Eetu'], l: ['Virtanen', 'Korhonen', 'Nieminen', 'Mäkinen', 'Hämäläinen', 'Laine'] },
    tr: { f: ['Emre', 'Mehmet', 'Alperen', 'Ömer', 'Kerem', 'Berk', 'Tarık', 'Sertaç'], l: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Aydın', 'Öztürk', 'Arslan'] },
    il: { f: ['Yam', 'Omri', 'Tamir', 'Itay', 'Noam', 'Ben', 'Roman', 'Guy'], l: ['Cohen', 'Levy', 'Peretz', 'Mizrahi', 'Friedman', 'Katz', 'Ben-David', 'Shapiro'] },
    ge: { f: ['Giorgi', 'Tornike', 'Goga', 'Sandro', 'Levan', 'Luka'], l: ['Beridze', 'Kapanadze', 'Gelashvili', 'Lomidze', 'Tsiklauri', 'Chkheidze'] },
    ng: { f: ['Chidi', 'Emeka', 'Obinna', 'Tunde', 'Chukwuma', 'Ikenna', 'Femi', 'Oluwaseun', 'Uchenna', 'Babatunde', 'Precious'], l: ['Okafor', 'Adeyemi', 'Okonkwo', 'Nwosu', 'Balogun', 'Eze', 'Onyeka', 'Adebayo', 'Olawale', 'Chukwu', 'Achiuwa'] },
    sn: { f: ['Mamadou', 'Cheikh', 'Ousmane', 'Ibrahima', 'Moussa', 'Abdoulaye', 'Babacar', 'Pape', 'Amadou'], l: ['Diop', 'Ndiaye', 'Fall', 'Sow', 'Diallo', 'Gueye', 'Sarr', 'Faye', 'Kanté', 'Keita'] },
    cm: { f: ['Pascal', 'Christian', 'Yannick', 'Landry', 'Ulrich', 'Joël', 'Arsène', 'Jean-Pierre'], l: ['Mbah', 'Ngando', 'Eyenga', 'Mbida', 'Fotso', 'Nkoulou', 'Tchoua', 'Kabongo'] },
    ss: { f: ['Deng', 'Majok', 'Bol', 'Akol', 'Garang', 'Mayen', 'Wal', 'Makur', 'Kuany'], l: ['Deng', 'Garang', 'Mayen', 'Akec', 'Chol', 'Maker', 'Kuol', 'Jok', 'Madut'] },
    au: { f: ['Josh', 'Jack', 'Mitch', 'Liam', 'Cooper', 'Tyson', 'Will', 'Harry', 'Lachlan', 'Callum', 'Oscar'], l: ['Smith', 'Kelly', 'Walsh', 'O\u2019Brien', 'Harris', 'McKenzie', 'Taylor', 'Ryan', 'Brooks', 'Fraser', 'Doyle'] },
    cn: { lf: 1, f: ['Haoran', 'Wei', 'Jun', 'Yuhang', 'Zhe', 'Rui', 'Ming', 'Kai', 'Jiahao', 'Tianyu', 'Hao', 'Lei', 'Qiang', 'Tao', 'Peng', 'Bo', 'Zhiwei', 'Junjie', 'Zixuan', 'Minghao', 'Chenyu', 'Bowen', 'Wenbo', 'Fei', 'Long', 'Yichen'], l: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Hu', 'Zhou', 'Xu', 'Sun', 'Guo', 'Huang', 'Wu', 'Zhu', 'Gao', 'Lin', 'He', 'Ma', 'Luo', 'Liang', 'Song', 'Zheng', 'Han', 'Tang', 'Feng', 'Cao', 'Deng', 'Xie'] },
    jp: { f: ['Yuta', 'Rui', 'Kai', 'Yuki', 'Haruto', 'Sora', 'Ren', 'Kota', 'Daiki', 'Yudai', 'Takumi', 'Shota', 'Kenta', 'Ryota', 'Sho', 'Makoto', 'Kazuki', 'Riku', 'Yuma'], l: ['Tanaka', 'Suzuki', 'Sato', 'Takahashi', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Watanabe', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu'] },
    kr: { lf: 1, f: ['Ji-hoon', 'Min-jun', 'Seung-woo', 'Hyun-woo', 'Do-yun', 'Jae-won', 'Ji-ho', 'Jun-seo', 'Seo-jun', 'Ye-jun', 'Si-woo', 'Dong-hyun', 'Sung-min', 'Hyun-jun', 'Jae-hyun', 'Tae-hoon', 'Min-seok'], l: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Cho', 'Jang', 'Lim', 'Han', 'Shin', 'Seo', 'Kwon', 'Song', 'Hwang', 'Ahn'] },
    ph: { f: ['Juan', 'Carlo', 'Kai', 'Jericho', 'Miguel', 'Paolo', 'Dwight'], l: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ramos', 'Mendoza', 'Tolentino'] },
    // Country-specific pools (common real given names and surnames).
    la: { f: ['José', 'Luis', 'Carlos', 'Jorge', 'Miguel', 'Ángel', 'Francisco', 'Jesús', 'Daniel', 'Andrés', 'Eduardo', 'Ricardo', 'Alejandro', 'Emmanuel'], l: ['Hernández', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Reyes', 'Ortiz'] },
    ml: { f: ['Mamadou', 'Moussa', 'Seydou', 'Boubacar', 'Souleymane', 'Adama', 'Oumar', 'Bakary', 'Modibo', 'Siaka'], l: ['Keïta', 'Traoré', 'Coulibaly', 'Diarra', 'Sissoko', 'Konaté', 'Doumbia', 'Maïga', 'Touré', 'Camara'] },
    cd: { f: ['Jonathan', 'Christian', 'Emmanuel', 'Patrick', 'Glody', 'Rodrigue', 'Merveille', 'Junior', 'Bienvenu', 'Exaucé'], l: ['Mukendi', 'Kabongo', 'Tshibangu', 'Ilunga', 'Mutombo', 'Kalala', 'Mbuyi', 'Lukusa', 'Kasongo', 'Nkulu'] },
    ke: { f: ['Brian', 'Kevin', 'Dennis', 'Collins', 'Victor', 'Tylor', 'Griffin', 'Felix', 'Ian', 'Allan'], l: ['Otieno', 'Odhiambo', 'Ochieng', 'Kiprop', 'Mutua', 'Kamau', 'Wanjala', 'Omondi', 'Kiplagat', 'Njoroge'] },
    ao: { f: ['Carlos', 'Edson', 'Yanick', 'Olímpio', 'Leonel', 'Gerson', 'Valdelício', 'Childe', 'Eduardo', 'Hermenegildo'], l: ['Morais', 'Gonçalves', 'Cipriano', 'Almeida', 'Fernandes', 'Mingas', 'Kiala', 'Neto', 'Dias', 'Lutonda'] },
    ci: { f: ['Koffi', 'Yao', 'Kouadio', 'Konan', 'Aboubakar', 'Sékou', 'Christian', 'Jean-Marc', 'Serge', 'Ismaël'], l: ['Kouassi', 'Koné', 'Ouattara', 'Bamba', 'Touré', 'N’Guessan', 'Kouamé', 'Konaté', 'Diabaté', 'Yao'] },
    jm: { f: ['Andre', 'Damian', 'Kemar', 'Romario', 'Shamar', 'Omar', 'Jevaughn', 'Tajay', 'Rushane', 'Nicholas'], l: ['Brown', 'Campbell', 'Williams', 'Clarke', 'Grant', 'Morgan', 'Reid', 'McKenzie', 'Francis', 'Gordon'] }
  };
}

export function clubs() {
  const E = 'EuroLeague';
  return {
    ES: [['Real Madrid', E], ['FC Barcelona', E], ['Valencia Basket', E], ['Unicaja Málaga', 'Liga ACB'], ['Joventut Badalona', 'Liga ACB']],
    GR: [['Olympiacos', E], ['Panathinaikos', E], ['PAOK', 'Greek Basket League'], ['AEK Athens', 'Greek Basket League']],
    TR: [['Fenerbahçe', E], ['Anadolu Efes', E], ['Beşiktaş', 'Basketbol Süper Ligi'], ['Türk Telekom', 'Basketbol Süper Ligi']],
    RS: [['Crvena zvezda', E], ['Partizan', E], ['Mega Basket', 'ABA League'], ['FMP Belgrade', 'ABA League']],
    LT: [['Žalgiris Kaunas', E], ['Rytas Vilnius', 'LKL'], ['Lietkabelis', 'LKL']],
    FR: [['Paris Basketball', E], ['ASVEL', E], ['AS Monaco', E], ['Le Mans Sarthe', 'LNB Élite'], ['Nanterre 92', 'LNB Élite'], ['Metropolitans 92', 'LNB Élite']],
    DE: [['Bayern Munich', E], ['ALBA Berlin', E], ['ratiopharm Ulm', 'BBL'], ['Bamberg Baskets', 'BBL']],
    IT: [['Olimpia Milano', E], ['Virtus Bologna', E], ['Reyer Venezia', 'Serie A'], ['Treviso Basket', 'Serie A']],
    IL: [['Maccabi Tel Aviv', E], ['Hapoel Tel Aviv', E], ['Hapoel Jerusalem', 'Israeli Premier League']],
    HR: [['Cibona', 'ABA League'], ['KK Split', 'ABA League'], ['KK Zadar', 'ABA League']],
    SI: [['Cedevita Olimpija', 'ABA League']], ME: [['Budućnost', 'ABA League']], BA: [['Igokea', 'ABA League']],
    LV: [['VEF Rīga', 'Latvian-Estonian League']], GE: [['Rustavi', 'Georgian Superleague']], FI: [['Helsinki Seagulls', 'Korisliiga']], GB: [['London Lions', 'Super League Basketball']],
    AU: [['Sydney Kings', 'NBL'], ['Melbourne United', 'NBL'], ['Perth Wildcats', 'NBL'], ['Brisbane Bullets', 'NBL'], ['Adelaide 36ers', 'NBL']], NZ: [['New Zealand Breakers', 'NBL']],
    CN: [['Guangdong Southern Tigers', 'CBA'], ['Shanghai Sharks', 'CBA'], ['Xinjiang Flying Tigers', 'CBA'], ['Fujian Sturgeons', 'CBA'], ['Beijing Ducks', 'CBA'], ['Liaoning Flying Leopards', 'CBA']],
    JP: [['Alvark Tokyo', 'B.League'], ['Chiba Jets', 'B.League'], ['Ryukyu Golden Kings', 'B.League']], KR: [['Seoul SK Knights', 'KBL']], PH: [['San Miguel Beermen', 'PBA']],
    BR: [['Flamengo', 'NBB'], ['Franca', 'NBB'], ['Minas', 'NBB']], AR: [['Quimsa', 'Liga Nacional'], ['Boca Juniors', 'Liga Nacional'], ['Instituto', 'Liga Nacional']], MX: [['Fuerza Regia', 'LNBP']],
    AO: [['Petro de Luanda', 'Basketball Africa League'], ['Primeiro de Agosto', 'Angolan Unitel League']],
    VE: [['Guaros de Lara', 'Superliga Venezuela'], ['Spartans Distrito Capital', 'Superliga Venezuela']],
    UY: [['Nacional', 'Liga Uruguaya'], ['Peñarol', 'Liga Uruguaya']],
  };
}

export function nativeMaps() {
  if (nativeMapCache) return nativeMapCache;
  const z = (k, v) => Object.fromEntries(k.map((x, i) => [x, v[i]]));
  const out = {
    cn: z(['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Hu', 'Zhou', 'Xu', 'Sun', 'Guo', 'Haoran', 'Wei', 'Jun', 'Yuhang', 'Zhe', 'Rui', 'Ming', 'Kai', 'Yiran', 'Zihan', 'Jiahao', 'Tianyu'], ['王', '李', '张', '刘', '陈', '杨', '赵', '胡', '周', '徐', '孙', '郭', '浩然', '伟', '俊', '宇航', '哲', '睿', '明', '凯', '一然', '子涵', '家豪', '天宇']),
    cnT: z(['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Hu', 'Zhou', 'Xu', 'Sun', 'Guo', 'Haoran', 'Wei', 'Jun', 'Yuhang', 'Zhe', 'Rui', 'Ming', 'Kai', 'Yiran', 'Zihan', 'Jiahao', 'Tianyu'], ['Wáng', 'Lǐ', 'Zhāng', 'Liú', 'Chén', 'Yáng', 'Zhào', 'Hú', 'Zhōu', 'Xú', 'Sūn', 'Guō', 'Hàorán', 'Wěi', 'Jùn', 'Yǔháng', 'Zhé', 'Ruì', 'Míng', 'Kǎi', 'Yīrán', 'Zǐhán', 'Jiāháo', 'Tiānyǔ']),
    kr: z(['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Ji-hoon', 'Min-jun', 'Seung-woo', 'Hyun-woo', 'Do-yun', 'Jae-won'], ['김', '이', '박', '최', '정', '강', '윤', '지훈', '민준', '승우', '현우', '도윤', '재원']),
    jp: z(['Tanaka', 'Suzuki', 'Sato', 'Takahashi', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Yuta', 'Rui', 'Kai', 'Yuki', 'Haruto', 'Sora', 'Ren', 'Kota'], ['田中', '鈴木', '佐藤', '高橋', '伊藤', '山本', '中村', '小林', '悠太', '塁', '海', '祐希', '陽翔', '空', '蓮', '康太']),
    gr: z(['Giorgos', 'Nikos', 'Kostas', 'Dimitris', 'Vasilis', 'Thanasis', 'Panagiotis', 'Yannis', 'Michalis', 'Papadopoulos', 'Georgiou', 'Antonopoulos', 'Nikolaidis', 'Vlachos', 'Karras', 'Pappas', 'Dimitriou', 'Katsaros'], ['Γιώργος', 'Νίκος', 'Κώστας', 'Δημήτρης', 'Βασίλης', 'Θανάσης', 'Παναγιώτης', 'Γιάννης', 'Μιχάλης', 'Παπαδόπουλος', 'Γεωργίου', 'Αντωνόπουλος', 'Νικολαΐδης', 'Βλάχος', 'Καρράς', 'Παππάς', 'Δημητρίου', 'Κατσαρός']),
    ge: z(['Giorgi', 'Tornike', 'Goga', 'Sandro', 'Levan', 'Luka', 'Beridze', 'Kapanadze', 'Gelashvili', 'Lomidze', 'Tsiklauri', 'Chkheidze'], ['გიორგი', 'თორნიკე', 'გოგა', 'სანდრო', 'ლევან', 'ლუკა', 'ბერიძე', 'კაპანაძე', 'გელაშვილი', 'ლომიძე', 'წიკლაური', 'ჩხეიძე']),
    il: z(['Yam', 'Omri', 'Tamir', 'Itay', 'Noam', 'Ben', 'Roman', 'Guy', 'Cohen', 'Levy', 'Peretz', 'Mizrahi', 'Friedman', 'Katz', 'Ben-David', 'Shapiro'], ['ים', 'עמרי', 'תמיר', 'איתי', 'נועם', 'בן', 'רומן', 'גיא', 'כהן', 'לוי', 'פרץ', 'מזרחי', 'פרידמן', 'כץ', 'בן דוד', 'שפירא'])
  };
  // More real names: hanzi with tone-marked pinyin, hangul, kanji.
  const add = (m, k, v) => Object.assign(m, z(k, v));
  add(out.cn, ['Huang', 'Wu', 'Zhu', 'Gao', 'Lin', 'He', 'Ma', 'Luo', 'Liang', 'Song', 'Zheng', 'Han', 'Tang', 'Feng', 'Cao', 'Deng', 'Xie', 'Hao', 'Lei', 'Qiang', 'Tao', 'Peng', 'Bo', 'Zhiwei', 'Junjie', 'Zixuan', 'Minghao', 'Chenyu', 'Bowen', 'Wenbo', 'Fei', 'Long', 'Yichen'],
    ['黄', '吴', '朱', '高', '林', '何', '马', '罗', '梁', '宋', '郑', '韩', '唐', '冯', '曹', '邓', '谢', '浩', '磊', '强', '涛', '鹏', '博', '志伟', '俊杰', '子轩', '明浩', '晨宇', '博文', '文博', '飞', '龙', '奕辰']);
  add(out.cnT, ['Huang', 'Wu', 'Zhu', 'Gao', 'Lin', 'He', 'Ma', 'Luo', 'Liang', 'Song', 'Zheng', 'Han', 'Tang', 'Feng', 'Cao', 'Deng', 'Xie', 'Hao', 'Lei', 'Qiang', 'Tao', 'Peng', 'Bo', 'Zhiwei', 'Junjie', 'Zixuan', 'Minghao', 'Chenyu', 'Bowen', 'Wenbo', 'Fei', 'Long', 'Yichen'],
    ['Huáng', 'Wú', 'Zhū', 'Gāo', 'Lín', 'Hé', 'Mǎ', 'Luó', 'Liáng', 'Sòng', 'Zhèng', 'Hán', 'Táng', 'Féng', 'Cáo', 'Dèng', 'Xiè', 'Hào', 'Lěi', 'Qiáng', 'Tāo', 'Péng', 'Bó', 'Zhìwěi', 'Jùnjié', 'Zǐxuān', 'Mínghào', 'Chényǔ', 'Bówén', 'Wénbó', 'Fēi', 'Lóng', 'Yìchén']);
  add(out.kr, ['Cho', 'Jang', 'Lim', 'Han', 'Shin', 'Seo', 'Kwon', 'Song', 'Hwang', 'Ahn', 'Ji-ho', 'Jun-seo', 'Seo-jun', 'Ye-jun', 'Si-woo', 'Dong-hyun', 'Sung-min', 'Hyun-jun', 'Jae-hyun', 'Tae-hoon', 'Min-seok'],
    ['조', '장', '임', '한', '신', '서', '권', '송', '황', '안', '지호', '준서', '서준', '예준', '시우', '동현', '성민', '현준', '재현', '태훈', '민석']);
  add(out.jp, ['Watanabe', 'Kato', 'Yoshida', 'Yamada', 'Sasaki', 'Matsumoto', 'Inoue', 'Kimura', 'Hayashi', 'Shimizu', 'Daiki', 'Yudai', 'Takumi', 'Shota', 'Kenta', 'Ryota', 'Sho', 'Makoto', 'Kazuki', 'Riku', 'Yuma'],
    ['渡辺', '加藤', '吉田', '山田', '佐々木', '松本', '井上', '木村', '林', '清水', '大輝', '雄大', '拓海', '翔太', '健太', '亮太', '翔', '誠', '和樹', '陸', '悠真']);
  return (nativeMapCache = out);
}

export function natDefault() { return { AO: 6, CI: 5, JM: 5, VE: 6, UY: 4, US: 3050, CA: 55, FR: 50, RS: 40, AU: 38, ES: 25, DE: 25, BR: 22, NG: 22, HR: 20, LT: 17, GR: 15, TR: 15, AR: 14, SI: 13, SN: 12, IT: 12, GB: 12, CD: 10, CM: 9, DO: 9, LV: 8, GE: 8, BS: 8, ME: 8, BA: 8, CN: 7, PR: 6, MX: 6, IL: 5, ML: 4, SS: 4, JP: 4, NZ: 4, FI: 3, PH: 2, KR: 1, KE: 1 }; }

export function regions() { const R: any = { NA: { name: 'North America', tier: 1, arche: 'Athletic wings, lead guards', c: ['US', 'CA', 'BS', 'PR', 'DO', 'MX'] }, WEU: { name: 'Western Europe', tier: 1, arche: 'Skilled bigs, 3-and-D wings', c: ['FR', 'ES', 'DE', 'IT', 'GB', 'FI'] }, BAL: { name: 'Balkans', tier: 1, arche: 'Playmaking bigs, shooters', c: ['RS', 'HR', 'SI', 'ME', 'BA'] }, EEU: { name: 'Baltics, Türkiye & Caucasus', tier: 2, arche: 'High-IQ forwards', c: ['LT', 'LV', 'TR', 'GE', 'IL'] }, AFR: { name: 'Africa', tier: 2, arche: 'Long, athletic rim protectors', c: ['NG', 'SN', 'ML', 'CM', 'CD', 'SS', 'KE'] }, OCE: { name: 'Oceania', tier: 2, arche: 'Tough two-way guards', c: ['AU', 'NZ'] }, SAM: { name: 'South America', tier: 3, arche: 'Physical forwards', c: ['BR', 'AR'] }, ASI: { name: 'East Asia & Pacific', tier: 3, arche: 'Shooters, tall centers', c: ['CN', 'JP', 'KR', 'PH'] }, EMG: { name: 'Emerging programs', tier: 4, arche: 'Raw, toolsy athletes; few pros', c: ['AO', 'CI', 'JM', 'VE', 'UY'] } }; NATIONS.forEach(([code, , reg]) => { if (R[reg] && !R[reg].c.includes(code)) R[reg].c.push(code); }); return R; }

export function regionOf(c) {
  const M = { Atlanta: 'Georgia', Chicago: 'Illinois', Houston: 'Texas', 'Los Angeles': 'California', Philadelphia: 'Pennsylvania', Detroit: 'Michigan', Oakland: 'California', Baltimore: 'Maryland', Memphis: 'Tennessee', Indianapolis: 'Indiana', Queens: 'New York', Dallas: 'Texas', Toronto: 'Ontario', Montreal: 'Quebec', Mississauga: 'Ontario', Brampton: 'Ontario', Vancouver: 'British Columbia', Hamilton: 'Ontario', 'São Paulo': 'São Paulo', 'Rio de Janeiro': 'Rio de Janeiro', 'Brasília': 'Federal District', 'Belo Horizonte': 'Minas Gerais', Franca: 'São Paulo', 'Córdoba': 'Córdoba Province', Rosario: 'Santa Fe', 'Bahía Blanca': 'Buenos Aires Province', Monterrey: 'Nuevo León', Guadalajara: 'Jalisco', 'Santo Domingo': 'Distrito Nacional', 'Santiago de los Caballeros': 'Santiago Province', Paris: 'Île-de-France', Lyon: 'Auvergne-Rhône-Alpes', 'Le Mans': 'Pays de la Loire', Strasbourg: 'Grand Est', Villeurbanne: 'Auvergne-Rhône-Alpes', Nanterre: 'Île-de-France', Madrid: 'Community of Madrid', Barcelona: 'Catalonia', 'Málaga': 'Andalusia', Valencia: 'Valencian Community', Badalona: 'Catalonia', Munich: 'Bavaria', Bamberg: 'Bavaria', Ulm: 'Baden-Württemberg', Milan: 'Lombardy', Bologna: 'Emilia-Romagna', Rome: 'Lazio', Treviso: 'Veneto', Varese: 'Lombardy', Athens: 'Attica', Thessaloniki: 'Central Macedonia', Piraeus: 'Attica', Patras: 'Western Greece', 'Novi Sad': 'Vojvodina', Sombor: 'Vojvodina', 'Niš': 'Nišava District', Split: 'Split-Dalmatia', Zadar: 'Zadar County', 'Šibenik': 'Šibenik-Knin County', Kaunas: 'Kaunas County', Vilnius: 'Vilnius County', 'Klaipėda': 'Klaipėda County', 'Šiauliai': 'Šiauliai County', Ankara: 'Ankara Province', Izmir: 'İzmir Province', Bursa: 'Bursa Province', 'Tel Aviv': 'Tel Aviv District', Jerusalem: 'Jerusalem District', Haifa: 'Haifa District', Herzliya: 'Tel Aviv District', Lagos: 'Lagos State', Abuja: 'Federal Capital Territory', Ibadan: 'Oyo State', Enugu: 'Enugu State', Dakar: 'Dakar Region', 'Thiès': 'Thiès Region', 'Saint-Louis': 'Saint-Louis Region', 'Yaoundé': 'Centre Region', Douala: 'Littoral Region', Bafoussam: 'West Region', Juba: 'Central Equatoria', Wau: 'Western Bahr el Ghazal', Malakal: 'Upper Nile', Nairobi: 'Nairobi County', Kakuma: 'Turkana County', Melbourne: 'Victoria', Sydney: 'New South Wales', Perth: 'Western Australia', Brisbane: 'Queensland', Adelaide: 'South Australia', Canberra: 'Australian Capital Territory', Auckland: 'Auckland', Wellington: 'Wellington', Christchurch: 'Canterbury', Guangzhou: 'Guangdong', Shenzhen: 'Guangdong', 'Ürümqi': 'Xinjiang Uyghur Autonomous Region', Qingdao: 'Shandong', Osaka: 'Osaka Prefecture', Toyama: 'Toyama Prefecture', Sendai: 'Miyagi Prefecture', Manila: 'Metro Manila', 'Cebu City': 'Cebu', 'Quezon City': 'Metro Manila', London: 'England', Manchester: 'England', Leicester: 'England', Tbilisi: '', Kutaisi: 'Imereti', Batumi: 'Adjara', Espoo: 'Uusimaa', Helsinki: 'Uusimaa', Tampere: 'Pirkanmaa', Maribor: 'Drava', Koper: 'Coastal–Karst', Mostar: 'Herzegovina-Neretva Canton', Tuzla: 'Tuzla Canton', Kayes: 'Kayes Region', Bamako: '', Lubumbashi: 'Haut-Katanga', 'Liepāja': 'Kurzeme', Ventspils: 'Kurzeme', Freeport: 'Grand Bahama', Nassau: 'New Providence', Bayamón: '', Ponce: '', Incheon: '', Busan: '' };
  return M[c] || '';
}

export function cyr(w) {
  const M = { a: 'а', b: 'б', c: 'ц', č: 'ч', ć: 'ћ', d: 'д', đ: 'ђ', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј', k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', r: 'р', s: 'с', š: 'ш', t: 'т', u: 'у', v: 'в', z: 'з', ž: 'ж' };
  let s = w.toLowerCase().replace(/lj/g, 'љ').replace(/nj/g, 'њ').replace(/dž/g, 'џ').split('').map(c => M[c] || c).join('');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function roleDefs(): any[] {
  return [
    ['Primary creator', 'Runs the offense off the dribble', 2, 3, v => v('drb') >= 62 && v('pss') >= 60],
    ['Floor spacer', 'A real threat from three', 4, 6, v => v('tp') >= 60],
    ['3-and-D wing', 'Hits open threes and guards wings', 3, 4, (v, p) => p.grp !== 'B' && v('tp') >= 54 && v('diq') >= 54],
    ['Point-of-attack defender', 'Pressures the ball handler', 2, 3, (v, p) => p.grp !== 'B' && v('diq') >= 58 && v('spd') >= 60],
    ['Slasher', 'Gets downhill and finishes', 2, 3, v => (v('spd') + v('jmp') + v('dnk')) / 3 >= 60],
    ['Rim protector', 'Anchors the paint on defense', 2, 3, (v, p) => p.grp === 'B' && v('hgt') >= 62 && v('diq') >= 52],
    ['Stretch big', 'A big who pulls centers out of the paint', 1, 2, (v, p) => p.grp === 'B' && v('tp') >= 48],
    ['Rebounder', 'Controls the glass', 2, 4, v => v('reb') >= 62],
    ['Connector', 'Makes the simple play at both ends', 2, 4, v => v('pss') >= 52 && v('oiq') >= 55 && v('diq') >= 50]
  ];
}

export const COLLEGES = ['Kentucky', 'Gonzaga', 'Duke', 'Villanova', 'Baylor', 'Arizona', 'UCLA', 'Kansas', 'Michigan State', 'Houston', 'Creighton', 'Purdue', 'Tennessee', 'Iowa State', 'Marquette', 'Alabama', 'UConn', 'North Carolina', 'Texas', 'Auburn', 'Saint Mary’s', 'Florida', 'Arkansas', 'Indiana', 'USC', 'Oregon', 'Virginia', 'Memphis'];

// [region, nickname, abbreviation, conference, division]. The user runs index 0.
export const TEAMS: [string, string, string, string, string][] = [['Baltimore', 'Crabs', 'BAL', 'East', 'Atlantic'], ['Hartford', 'Underwriters', 'HFD', 'East', 'Atlantic'], ['Brooklyn', 'Trolleys', 'BKN', 'East', 'Atlantic'], ['Newark', 'Bricks', 'NWK', 'East', 'Atlantic'], ['Providence', 'Jewelers', 'PRV', 'East', 'Atlantic'], ['Cleveland', 'Amps', 'CLE', 'East', 'Central'], ['Detroit', 'Motors', 'DET', 'East', 'Central'], ['Columbus', 'Explorers', 'CBS', 'East', 'Central'], ['Pittsburgh', 'Inclines', 'PIT', 'East', 'Central'], ['Cincinnati', 'Riverboats', 'CIN', 'East', 'Central'], ['Charlotte', 'Racers', 'CHA', 'East', 'Southeast'], ['Atlanta', 'Firebirds', 'ATL', 'East', 'Southeast'], ['Tampa', 'Corsairs', 'TPA', 'East', 'Southeast'], ['Raleigh', 'Oaks', 'RAL', 'East', 'Southeast'], ['Nashville', 'Sound', 'NSH', 'East', 'Southeast'], ['Seattle', 'Roasters', 'SEA', 'West', 'Northwest'], ['Portland', 'Lumberjacks', 'POR', 'West', 'Northwest'], ['Vancouver', 'Orcas', 'VAN', 'West', 'Northwest'], ['Salt Lake', 'Gulls', 'SLC', 'West', 'Northwest'], ['Denver', 'Altitude', 'DEN', 'West', 'Northwest'], ['San Diego', 'Surf', 'SD', 'West', 'Pacific'], ['Oakland', 'Redwoods', 'OAK', 'West', 'Pacific'], ['Las Vegas', 'High Rollers', 'LV', 'West', 'Pacific'], ['Sacramento', 'Prospectors', 'SAC', 'West', 'Pacific'], ['San Jose', 'Circuits', 'SJ', 'West', 'Pacific'], ['Austin', 'Bats', 'AUS', 'West', 'Southwest'], ['San Antonio', 'Vaqueros', 'SA', 'West', 'Southwest'], ['Phoenix', 'Saguaros', 'PHX', 'West', 'Southwest'], ['Kansas City', 'Pitmasters', 'KC', 'West', 'Southwest'], ['St. Louis', 'Arches', 'STL', 'West', 'Southwest']];
// San Jose and San Antonio replaced Honolulu and Albuquerque (metros under 1 million), which
// stay available for expansion in data/franchises.ts.
// Nicknames before the 2026 rename, for migrating saves whose teams kept the defaults.
export const OLD_NICKNAMES: Record<string, string> = {"BAL": "Tides", "HFD": "Kestrels", "BKN": "Ironworks", "NWK": "Comets", "PRV": "Anchors", "CLE": "Forge", "CBS": "Owls", "PIT": "Rivermen", "CIN": "Barons", "CHA": "Monarchs", "TPA": "Herons", "SEA": "Squall", "SLC": "Summit", "LV": "Jacks", "SAC": "Gold", "AUS": "Outlaws", "PHX": "Scorch", "KC": "Scouts"};
export const MARKETS = [1.0, .75, 1.45, 1.2, .75, .85, 1.05, .85, .9, .85, .95, 1.15, 1.0, .8, .9, 1.15, .9, 1.05, .8, 1.05, 1.1, 1.25, .95, .85, 1.1, 1.0, .95, 1.15, .85, .9];
export const OWNER_ARCHETYPES = ['Win-Now Spender', 'Frugal Profit-Seeker', 'Asset Hoarder', 'Hype Focus', 'Meddling Micromanager'];
export const OWNER_SURNAMES = ['Kessler', 'Whitmore', 'Draycott', 'Pemberton', 'Castellano', 'Hargrove', 'Lindgren', 'Okoro', 'Vasquez', 'Ashworth', 'Brandt', 'Galloway'];
export const RATING_KEYS = ['hgt', 'stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'oiq', 'diq', 'drb', 'pss', 'reb'];

// Expansion franchises join through Settings → League expansion. [region, nickname, abbr, conference, division, market]
export const EXPANSION: [string, string, string, string, string, number][] = [['Louisville', 'Thoroughbreds', 'LOU', 'East', 'Central', .75], ['Mexico City', 'Águilas', 'MEX', 'West', 'Southwest', 1.3]];

// Team identity: [primary, secondary] colors and the crest glyph (a Lucide icon name).
// Original marks for fictional clubs; the crest is drawn by ui/TeamLogo.tsx.
export const TEAM_STYLE: Record<string, { colors: [string, string]; icon: string }> = {
  BAL: { colors: ['#1d3557', '#a8dadc'], icon: 'Shell' },
  HFD: { colors: ['#8e3b1f', '#f1e3c8'], icon: 'Umbrella' },
  BKN: { colors: ['#2b2b2b', '#c9894f'], icon: 'TramFront' },
  NWK: { colors: ['#22254a', '#e7c46a'], icon: 'BrickWall' },
  PRV: { colors: ['#1f5f63', '#e9efe8'], icon: 'Gem' },
  CLE: { colors: ['#6b1d1d', '#f2a541'], icon: 'Speaker' },
  DET: { colors: ['#2f4a6b', '#d5d9de'], icon: 'Cog' },
  CBS: { colors: ['#2d4a36', '#d8c29a'], icon: 'Compass' },
  PIT: { colors: ['#1b1b1b', '#f0b429'], icon: 'CableCar' },
  CIN: { colors: ['#5e1f35', '#e0c07a'], icon: 'Sailboat' },
  CHA: { colors: ['#4b2a6b', '#e6c36a'], icon: 'Flag' },
  ATL: { colors: ['#a3222b', '#f6c453'], icon: 'Flame' },
  TPA: { colors: ['#1e6f5c', '#e8f3ec'], icon: 'Skull' },
  RAL: { colors: ['#35573a', '#e8dcc0'], icon: 'TreeDeciduous' },
  NSH: { colors: ['#2e3a78', '#f2a07b'], icon: 'Guitar' },
  SEA: { colors: ['#36475a', '#bfe3d0'], icon: 'Coffee' },
  POR: { colors: ['#8f2d25', '#f4e6cf'], icon: 'Axe' },
  VAN: { colors: ['#15191e', '#d3e6ef'], icon: 'Fish' },
  SLC: { colors: ['#1f3b63', '#eef2f5'], icon: 'Bird' },
  DEN: { colors: ['#2c5d8a', '#f2c14e'], icon: 'MountainSnow' },
  SD: { colors: ['#0f6e8c', '#f3dfb3'], icon: 'Sunset' },
  OAK: { colors: ['#7a3325', '#c9d6b5'], icon: 'TreePine' },
  LV: { colors: ['#1c1a1a', '#d4af37'], icon: 'Dice5' },
  SAC: { colors: ['#3a2f5b', '#d9a93a'], icon: 'Pickaxe' },
  SJ: { colors: ['#0b3d4f', '#7fd1c7'], icon: 'Cpu' },
  HNL: { colors: ['#127a7a', '#f7c8a3'], icon: 'TreePalm' },
  AUS: { colors: ['#a4521b', '#f3ece2'], icon: 'Moon' },
  SA: { colors: ['#5a2a1a', '#e8c07a'], icon: 'Star' },
  ABQ: { colors: ['#2a8c8c', '#f0d9b5'], icon: 'Wind' },
  PHX: { colors: ['#c1461d', '#fbe3c1'], icon: 'Sun' },
  KC: { colors: ['#1f2f4d', '#e4b363'], icon: 'Flame' },
  STL: { colors: ['#24457a', '#f08a74'], icon: 'Rainbow' },
  LOU: { colors: ['#4a1a2c', '#e9b7c1'], icon: 'Award' },
  MEX: { colors: ['#1f5e3a', '#f0e6d2'], icon: 'Feather' },
};
export const teamStyle = (abbr: string) => TEAM_STYLE[abbr] || { colors: ['#605d5d', '#eae7e7'] as [string, string], icon: 'Circle' };

// ── Procedural expansion franchises ─────────────────────────────────────────────
// Candidate cities (not already in the league) with conference, division, market size
// and a theme that drives the generated nickname, palette and crest.
export const EXPANSION_CITIES: [string, 'East' | 'West', string, number, string][] = [
  ['Louisville', 'East', 'Central', 0.75, 'river'], ['Chicago', 'East', 'Central', 1.5, 'city'], ['Toronto', 'East', 'Atlantic', 1.3, 'cold'], ['Montreal', 'East', 'Atlantic', 1.05, 'cold'],
  ['Boston', 'East', 'Atlantic', 1.3, 'coast'], ['Miami', 'East', 'Southeast', 1.15, 'coast'], ['Orlando', 'East', 'Southeast', 0.9, 'south'], ['Birmingham', 'East', 'Southeast', 0.7, 'city'],
  ['Buffalo', 'East', 'Central', 0.7, 'cold'], ['Milwaukee', 'East', 'Central', 0.75, 'cold'], ['New Orleans', 'East', 'Southeast', 0.8, 'river'], ['Norfolk', 'East', 'Southeast', 0.7, 'coast'],
  ['Mexico City', 'West', 'Southwest', 1.3, 'highland'], ['Houston', 'West', 'Southwest', 1.25, 'city'], ['Dallas', 'West', 'Southwest', 1.25, 'plains'], ['San Antonio', 'West', 'Southwest', 0.9, 'desert'],
  ['Minneapolis', 'West', 'Northwest', 0.95, 'cold'], ['Omaha', 'West', 'Northwest', 0.65, 'plains'], ['Calgary', 'West', 'Northwest', 0.8, 'mountain'], ['Los Angeles', 'West', 'Pacific', 1.6, 'coast'],
  ['Tucson', 'West', 'Pacific', 0.65, 'desert'], ['Boise', 'West', 'Northwest', 0.6, 'mountain'], ['Memphis', 'West', 'Southwest', 0.75, 'river'], ['Anchorage', 'West', 'Pacific', 0.55, 'cold'],
];
const THEME: Record<string, { names: string[]; hues: number[]; icons: string[] }> = {
  coast: { names: ['Mariners', 'Breakers', 'Gulls', 'Barracudas', 'Tritons', 'Current', 'Lighthouse', 'Tidewater'], hues: [200, 190, 215, 175], icons: ['Waves', 'Ship', 'Fish', 'Anchor'] },
  river: { names: ['Steamers', 'Rivercats', 'Paddlers', 'Ferrymen', 'Otters', 'Bargemen', 'Levee'], hues: [25, 205, 150, 40], icons: ['Ship', 'Waves', 'Anchor', 'Fish'] },
  plains: { names: ['Stampede', 'Bison', 'Twisters', 'Harvest', 'Wranglers', 'Drovers', 'Prairie'], hues: [30, 10, 45, 0], icons: ['Wind', 'TreeDeciduous', 'Sun', 'Star'] },
  mountain: { names: ['Peaks', 'Yetis', 'Ridgebacks', 'Glaciers', 'Condors', 'Timberline', 'Rockslide'], hues: [210, 160, 230, 190], icons: ['Mountain', 'MountainSnow', 'TreePine', 'Bird'] },
  cold: { names: ['Loons', 'Freeze', 'Icebreakers', 'Voyageurs', 'Blizzard', 'Huskies', 'Aurora'], hues: [220, 195, 260, 180], icons: ['Wind', 'MountainSnow', 'Moon', 'Sparkles'] },
  desert: { names: ['Sidewinders', 'Javelinas', 'Mirage', 'Scorpions', 'Vaqueros', 'Dust Devils', 'Solstice'], hues: [20, 35, 350, 15], icons: ['Sun', 'Sunset', 'Flame', 'Star'] },
  south: { names: ['Gators', 'Flamingos', 'Swamp Kings', 'Sunrays', 'Egrets', 'Cyclones'], hues: [130, 330, 45, 160], icons: ['Sun', 'Bird', 'TreePalm', 'Rainbow'] },
  highland: { names: ['Águilas', 'Jaguares', 'Volcanes', 'Charros', 'Serpientes', 'Soles'], hues: [140, 350, 30, 280], icons: ['Bird', 'Sun', 'Mountain', 'Crown'] },
  city: { names: ['Titans', 'Engineers', 'Skyline', 'Express', 'Generals', 'Foundry', 'Aviators', 'Monarchs'], hues: [0, 220, 270, 30], icons: ['Star', 'Crown', 'Cog', 'Gem'] },
};
const hsl2hex = (h: number, s: number, l: number) => { s /= 100; l /= 100; const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l), f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); return '#' + [f(0), f(8), f(4)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
// A new franchise for a city: nickname, abbreviation, a two-tone palette and a crest glyph.
export function genExpansionTeam(city: string, rnd: () => number = Math.random, taken: string[] = []) {
  const c = EXPANSION_CITIES.find(x => x[0] === city) || [city, 'East', 'Central', 0.8, 'city'] as any;
  const th = THEME[c[4]] || THEME.city, pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const hue = (pick(th.hues) + Math.round((rnd() - 0.5) * 24) + 360) % 360, dark = rnd() < 0.5;
  const c1 = hsl2hex(hue, 55 + rnd() * 25, dark ? 22 + rnd() * 10 : 40 + rnd() * 10), c2 = rnd() < 0.5 ? hsl2hex((hue + 180 + Math.round((rnd() - 0.5) * 60)) % 360, 70, 72) : hsl2hex(hue, 20, 92);
  let abbr = city.replace(/[^A-Za-z ]/g, '').split(' ').length > 1 ? city.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3) : city.slice(0, 3).toUpperCase();
  if (abbr.length < 3) abbr = (abbr + city.replace(/[^A-Za-z]/g, '').slice(1).toUpperCase()).slice(0, 3);
  for (let i = 0; taken.includes(abbr) && i < 5; i++) abbr = abbr.slice(0, 2) + String.fromCharCode(88 + i);
  return { region: city, name: pick(th.names), abbr, conf: c[1], div: c[2], mkt: c[3], colors: [c1, c2] as [string, string], icon: pick(th.icons) };
}
