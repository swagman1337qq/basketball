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
    MX: c('Mexico', 'mx', { brown: .85, white: .15 }, 'es', ['Mexico City', 'Monterrey', 'Guadalajara'], { soli: 1 }),
    DO: c('Dominican Republic', 'do', { brown: .6, black: .4 }, 'es', ['Santo Domingo', 'Santiago de los Caballeros']),
    PR: c('Puerto Rico', 'pr', { brown: .6, black: .25, white: .15 }, 'es', ['San Juan', 'Bayamón', 'Ponce'], { soli: 1 }),
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
    ML: c('Mali', 'ml', B, 'sn', ['Bamako', 'Kayes']),
    CM: c('Cameroon', 'cm', B, 'cm', ['Yaoundé', 'Douala', 'Bafoussam']),
    CD: c('DR Congo', 'cd', B, 'cm', ['Kinshasa', 'Lubumbashi']),
    SS: c('South Sudan', 'ss', B, 'ss', ['Juba', 'Wau', 'Malakal']),
    KE: c('Kenya', 'ke', B, 'ss', ['Nairobi', 'Kakuma']),
    AO: c('Angola', 'ao', B, 'pt', ['Luanda', 'Benguela', 'Lobito']),
    CI: c('Côte d’Ivoire', 'ci', B, 'fr', ['Abidjan', 'Bouaké', 'Yamoussoukro']),
    JM: c('Jamaica', 'jm', B, 'us', ['Kingston', 'Montego Bay', 'Spanish Town']),
    VE: c('Venezuela', 've', { brown: .7, white: .2, black: .1 }, 'es', ['Caracas', 'Barquisimeto', 'Maracaibo', 'Valencia']),
    UY: c('Uruguay', 'uy', { white: .85, brown: .15 }, 'es', ['Montevideo', 'Salto', 'Paysandú']),
    AU: c('Australia', 'au', { white: .8, black: .15, brown: .05 }, 'au', ['Melbourne', 'Sydney', 'Perth', 'Brisbane', 'Adelaide', 'Canberra']),
    NZ: c('New Zealand', 'nz', { white: .6, brown: .4 }, 'au', ['Auckland', 'Wellington', 'Christchurch']),
    CN: c('China', 'cn', A, 'cn', ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Ürümqi', 'Qingdao']),
    JP: c('Japan', 'jp', A, 'jp', ['Tokyo', 'Osaka', 'Toyama', 'Sendai']),
    KR: c('South Korea', 'kr', A, 'kr', ['Seoul', 'Busan', 'Incheon']),
    PH: c('Philippines', 'ph', { asian: .6, brown: .4 }, 'ph', ['Manila', 'Cebu City', 'Quezon City'])
  };
}

export function namePools() {
  return {
    us: { f: ['Marcus', 'Devin', 'Andre', 'Julian', 'Tyrese', 'Malik', 'Isaiah', 'Cole', 'Jalen', 'Darius', 'Keenan', 'Rashad', 'Elijah', 'Grant', 'Caleb', 'Xavier', 'Dante', 'Quincy', 'Jonah', 'Amir', 'Tobias', 'Reggie', 'Silas', 'Brandon', 'Wes', 'Jordan', 'Myles', 'Cam', 'Trey', 'Donovan', 'Austin', 'Kobe', 'Terrence', 'Zion', 'Garrett', 'Derrick'], l: ['Hale', 'Brennan', 'Whitfield', 'Harlow', 'Pruitt', 'Vance', 'Crowder', 'Ashby', 'Ridley', 'Marsh', 'Tillman', 'Greer', 'Holloway', 'Draper', 'Quarles', 'Abernathy', 'Mercer', 'Stroud', 'Farrow', 'Calloway', 'Renner', 'Bishop', 'Hollis', 'Lyle', 'Sykes', 'Blackwood', 'Tennant', 'Washington', 'Jefferson', 'Coleman', 'Brooks', 'Bryant', 'Hayes', 'Simmons', 'Porter', 'Walker', 'Reed', 'Fields', 'Dawson', 'Mitchell'] },
    pt: { f: ['Bruno', 'Lucas', 'Gabriel', 'Rafael', 'Thiago', 'Mateus', 'Vitor', 'Caio', 'Yago', 'Henrique', 'Leonardo'], l: ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Almeida', 'Ferreira', 'Rocha', 'Barbosa', 'Carvalho'] },
    es: { f: ['Sergio', 'Pablo', 'Alejandro', 'Juan', 'Diego', 'Santiago', 'Nicolás', 'Facundo', 'Mateo', 'Iker', 'Álvaro', 'Hugo', 'Leandro', 'Gonzalo'], l: ['García', 'Fernández', 'López', 'Martínez', 'Navarro', 'Ruiz', 'Herrera', 'Vázquez', 'Castro', 'Romero', 'Delgado', 'Aguirre', 'Medina', 'Soto'] },
    fr: { f: ['Théo', 'Hugo', 'Mathis', 'Killian', 'Yanis', 'Moussa', 'Enzo', 'Bilal', 'Adam', 'Nolan', 'Sékou', 'Maxime', 'Ousmane', 'Axel'], l: ['Martin', 'Bernard', 'Dubois', 'Lefèvre', 'Moreau', 'Laurent', 'Diallo', 'Traoré', 'Camara', 'Kouassi', 'Fournier', 'Girard', 'Coulibaly', 'Bonnet'] },
    de: { f: ['Maximilian', 'Jonas', 'Leon', 'Tim', 'Moritz', 'Niklas', 'Justus', 'Isaac', 'Lukas', 'Felix', 'Johannes'], l: ['Müller', 'Schmidt', 'Wagner', 'Becker', 'Hoffmann', 'Weber', 'Koch', 'Richter', 'Braun', 'Krüger', 'Obi'] },
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
    cn: { lf: 1, f: ['Haoran', 'Wei', 'Jun', 'Yuhang', 'Zhe', 'Rui', 'Ming', 'Kai', 'Yiran', 'Zihan', 'Jiahao', 'Tianyu'], l: ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Hu', 'Zhou', 'Xu', 'Sun', 'Guo'] },
    jp: { f: ['Yuta', 'Rui', 'Kai', 'Yuki', 'Haruto', 'Sora', 'Ren', 'Kota'], l: ['Tanaka', 'Suzuki', 'Sato', 'Takahashi', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi'] },
    kr: { lf: 1, f: ['Ji-hoon', 'Min-jun', 'Seung-woo', 'Hyun-woo', 'Do-yun', 'Jae-won'], l: ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon'] },
    ph: { f: ['Juan', 'Carlo', 'Kai', 'Jericho', 'Miguel', 'Paolo', 'Dwight'], l: ['Santos', 'Reyes', 'Cruz', 'Bautista', 'Ramos', 'Mendoza', 'Tolentino'] }
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
  return nativeMapCache = {
    cn: z(['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Hu', 'Zhou', 'Xu', 'Sun', 'Guo', 'Haoran', 'Wei', 'Jun', 'Yuhang', 'Zhe', 'Rui', 'Ming', 'Kai', 'Yiran', 'Zihan', 'Jiahao', 'Tianyu'], ['王', '李', '张', '刘', '陈', '杨', '赵', '胡', '周', '徐', '孙', '郭', '浩然', '伟', '俊', '宇航', '哲', '睿', '明', '凯', '一然', '子涵', '家豪', '天宇']),
    cnT: z(['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Zhao', 'Hu', 'Zhou', 'Xu', 'Sun', 'Guo', 'Haoran', 'Wei', 'Jun', 'Yuhang', 'Zhe', 'Rui', 'Ming', 'Kai', 'Yiran', 'Zihan', 'Jiahao', 'Tianyu'], ['Wáng', 'Lǐ', 'Zhāng', 'Liú', 'Chén', 'Yáng', 'Zhào', 'Hú', 'Zhōu', 'Xú', 'Sūn', 'Guō', 'Hàorán', 'Wěi', 'Jùn', 'Yǔháng', 'Zhé', 'Ruì', 'Míng', 'Kǎi', 'Yīrán', 'Zǐhán', 'Jiāháo', 'Tiānyǔ']),
    kr: z(['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Yoon', 'Ji-hoon', 'Min-jun', 'Seung-woo', 'Hyun-woo', 'Do-yun', 'Jae-won'], ['김', '이', '박', '최', '정', '강', '윤', '지훈', '민준', '승우', '현우', '도윤', '재원']),
    jp: z(['Tanaka', 'Suzuki', 'Sato', 'Takahashi', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Yuta', 'Rui', 'Kai', 'Yuki', 'Haruto', 'Sora', 'Ren', 'Kota'], ['田中', '鈴木', '佐藤', '高橋', '伊藤', '山本', '中村', '小林', '悠太', '塁', '海', '勇気', '陽翔', '空', '蓮', '康太']),
    gr: z(['Giorgos', 'Nikos', 'Kostas', 'Dimitris', 'Vasilis', 'Thanasis', 'Panagiotis', 'Yannis', 'Michalis', 'Papadopoulos', 'Georgiou', 'Antonopoulos', 'Nikolaidis', 'Vlachos', 'Karras', 'Pappas', 'Dimitriou', 'Katsaros'], ['Γιώργος', 'Νίκος', 'Κώστας', 'Δημήτρης', 'Βασίλης', 'Θανάσης', 'Παναγιώτης', 'Γιάννης', 'Μιχάλης', 'Παπαδόπουλος', 'Γεωργίου', 'Αντωνόπουλος', 'Νικολαΐδης', 'Βλάχος', 'Καρράς', 'Παππάς', 'Δημητρίου', 'Κατσαρός']),
    ge: z(['Giorgi', 'Tornike', 'Goga', 'Sandro', 'Levan', 'Luka', 'Beridze', 'Kapanadze', 'Gelashvili', 'Lomidze', 'Tsiklauri', 'Chkheidze'], ['გიორგი', 'თორნიკე', 'გოგა', 'სანდრო', 'ლევან', 'ლუკა', 'ბერიძე', 'კაპანაძე', 'გელაშვილი', 'ლომიძე', 'წიკლაური', 'ჩხეიძე']),
    il: z(['Yam', 'Omri', 'Tamir', 'Itay', 'Noam', 'Ben', 'Roman', 'Guy', 'Cohen', 'Levy', 'Peretz', 'Mizrahi', 'Friedman', 'Katz', 'Ben-David', 'Shapiro'], ['ים', 'עמרי', 'תמיר', 'איתי', 'נועם', 'בן', 'רומן', 'גיא', 'כהן', 'לוי', 'פרץ', 'מזרחי', 'פרידמן', 'כץ', 'בן דוד', 'שפירא'])
  };
}

export function natDefault() { return { AO: 6, CI: 5, JM: 5, VE: 6, UY: 4, US: 3050, CA: 55, FR: 50, RS: 40, AU: 38, ES: 25, DE: 25, BR: 22, NG: 22, HR: 20, LT: 17, GR: 15, TR: 15, AR: 14, SI: 13, SN: 12, IT: 12, GB: 12, CD: 10, CM: 9, DO: 9, LV: 8, GE: 8, BS: 8, ME: 8, BA: 8, CN: 7, PR: 6, MX: 6, IL: 5, ML: 4, SS: 4, JP: 4, NZ: 4, FI: 3, PH: 2, KR: 1, KE: 1 }; }

export function regions() { return { NA: { name: 'North America', tier: 1, arche: 'Athletic wings, lead guards', c: ['US', 'CA', 'BS', 'PR', 'DO', 'MX'] }, WEU: { name: 'Western Europe', tier: 1, arche: 'Skilled bigs, 3-and-D wings', c: ['FR', 'ES', 'DE', 'IT', 'GB', 'FI'] }, BAL: { name: 'Balkans', tier: 1, arche: 'Playmaking bigs, shooters', c: ['RS', 'HR', 'SI', 'ME', 'BA'] }, EEU: { name: 'Baltics, Türkiye & Caucasus', tier: 2, arche: 'High-IQ forwards', c: ['LT', 'LV', 'TR', 'GE', 'IL'] }, AFR: { name: 'Africa', tier: 2, arche: 'Long, athletic rim protectors', c: ['NG', 'SN', 'ML', 'CM', 'CD', 'SS', 'KE'] }, OCE: { name: 'Oceania', tier: 2, arche: 'Tough two-way guards', c: ['AU', 'NZ'] }, SAM: { name: 'South America', tier: 3, arche: 'Physical forwards', c: ['BR', 'AR'] }, ASI: { name: 'East Asia & Pacific', tier: 3, arche: 'Shooters, tall centers', c: ['CN', 'JP', 'KR', 'PH'] }, EMG: { name: 'Emerging programs', tier: 4, arche: 'Raw, toolsy athletes; few pros', c: ['AO', 'CI', 'JM', 'VE', 'UY'] } }; }

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
export const TEAMS: [string, string, string, string, string][] = [['Baltimore', 'Tides', 'BAL', 'East', 'Atlantic'], ['Hartford', 'Kestrels', 'HFD', 'East', 'Atlantic'], ['Brooklyn', 'Ironworks', 'BKN', 'East', 'Atlantic'], ['Newark', 'Comets', 'NWK', 'East', 'Atlantic'], ['Providence', 'Anchors', 'PRV', 'East', 'Atlantic'], ['Cleveland', 'Forge', 'CLE', 'East', 'Central'], ['Detroit', 'Motors', 'DET', 'East', 'Central'], ['Columbus', 'Owls', 'CBS', 'East', 'Central'], ['Pittsburgh', 'Rivermen', 'PIT', 'East', 'Central'], ['Cincinnati', 'Barons', 'CIN', 'East', 'Central'], ['Charlotte', 'Monarchs', 'CHA', 'East', 'Southeast'], ['Atlanta', 'Firebirds', 'ATL', 'East', 'Southeast'], ['Tampa', 'Herons', 'TPA', 'East', 'Southeast'], ['Raleigh', 'Oaks', 'RAL', 'East', 'Southeast'], ['Nashville', 'Sound', 'NSH', 'East', 'Southeast'], ['Seattle', 'Squall', 'SEA', 'West', 'Northwest'], ['Portland', 'Lumberjacks', 'POR', 'West', 'Northwest'], ['Vancouver', 'Orcas', 'VAN', 'West', 'Northwest'], ['Salt Lake', 'Summit', 'SLC', 'West', 'Northwest'], ['Denver', 'Altitude', 'DEN', 'West', 'Northwest'], ['San Diego', 'Surf', 'SD', 'West', 'Pacific'], ['Oakland', 'Redwoods', 'OAK', 'West', 'Pacific'], ['Las Vegas', 'Jacks', 'LV', 'West', 'Pacific'], ['Sacramento', 'Gold', 'SAC', 'West', 'Pacific'], ['Honolulu', 'Waves', 'HNL', 'West', 'Pacific'], ['Austin', 'Outlaws', 'AUS', 'West', 'Southwest'], ['Albuquerque', 'Roadrunners', 'ABQ', 'West', 'Southwest'], ['Phoenix', 'Scorch', 'PHX', 'West', 'Southwest'], ['Kansas City', 'Scouts', 'KC', 'West', 'Southwest'], ['St. Louis', 'Arches', 'STL', 'West', 'Southwest']];
export const MARKETS = [1.0, .75, 1.45, 1.2, .75, .85, 1.05, .85, .9, .85, .95, 1.15, 1.0, .8, .9, 1.15, .9, 1.05, .8, 1.05, 1.1, 1.25, .95, .85, .7, 1.0, .7, 1.15, .85, .9];
export const OWNER_ARCHETYPES = ['Win-Now Spender', 'Frugal Profit-Seeker', 'Asset Hoarder', 'Hype Focus', 'Meddling Micromanager'];
export const OWNER_SURNAMES = ['Kessler', 'Whitmore', 'Draycott', 'Pemberton', 'Castellano', 'Hargrove', 'Lindgren', 'Okoro', 'Vasquez', 'Ashworth', 'Brandt', 'Galloway'];
export const RATING_KEYS = ['hgt', 'stre', 'spd', 'jmp', 'endu', 'ins', 'dnk', 'ft', 'fg', 'tp', 'oiq', 'diq', 'drb', 'pss', 'reb'];

// Expansion franchises join through Settings → League expansion. [region, nickname, abbr, conference, division, market]
export const EXPANSION: [string, string, string, string, string, number][] = [['Louisville', 'Thoroughbreds', 'LOU', 'East', 'Central', .75], ['Mexico City', 'Águilas', 'MEX', 'West', 'Southwest', 1.3]];

// Team identity: [primary, secondary] colors and the crest glyph (a Lucide icon name).
// Original marks for fictional clubs; the crest is drawn by ui/TeamLogo.tsx.
export const TEAM_STYLE: Record<string, { colors: [string, string]; icon: string }> = {
  BAL: { colors: ['#1d3557', '#a8dadc'], icon: 'Waves' },
  HFD: { colors: ['#8e3b1f', '#f1e3c8'], icon: 'Bird' },
  BKN: { colors: ['#2b2b2b', '#c9894f'], icon: 'Anvil' },
  NWK: { colors: ['#22254a', '#e7c46a'], icon: 'Sparkles' },
  PRV: { colors: ['#1f5f63', '#e9efe8'], icon: 'Anchor' },
  CLE: { colors: ['#6b1d1d', '#f2a541'], icon: 'Hammer' },
  DET: { colors: ['#2f4a6b', '#d5d9de'], icon: 'Cog' },
  CBS: { colors: ['#2d4a36', '#d8c29a'], icon: 'Moon' },
  PIT: { colors: ['#1b1b1b', '#f0b429'], icon: 'Ship' },
  CIN: { colors: ['#5e1f35', '#e0c07a'], icon: 'Castle' },
  CHA: { colors: ['#4b2a6b', '#e6c36a'], icon: 'Crown' },
  ATL: { colors: ['#a3222b', '#f6c453'], icon: 'Flame' },
  TPA: { colors: ['#1e6f5c', '#e8f3ec'], icon: 'Origami' },
  RAL: { colors: ['#35573a', '#e8dcc0'], icon: 'TreeDeciduous' },
  NSH: { colors: ['#2e3a78', '#f2a07b'], icon: 'Guitar' },
  SEA: { colors: ['#36475a', '#bfe3d0'], icon: 'CloudRainWind' },
  POR: { colors: ['#8f2d25', '#f4e6cf'], icon: 'Axe' },
  VAN: { colors: ['#15191e', '#d3e6ef'], icon: 'Fish' },
  SLC: { colors: ['#1f3b63', '#eef2f5'], icon: 'Mountain' },
  DEN: { colors: ['#2c5d8a', '#f2c14e'], icon: 'MountainSnow' },
  SD: { colors: ['#0f6e8c', '#f3dfb3'], icon: 'Sunset' },
  OAK: { colors: ['#7a3325', '#c9d6b5'], icon: 'TreePine' },
  LV: { colors: ['#1c1a1a', '#d4af37'], icon: 'Spade' },
  SAC: { colors: ['#3a2f5b', '#d9a93a'], icon: 'Gem' },
  HNL: { colors: ['#127a7a', '#f7c8a3'], icon: 'TreePalm' },
  AUS: { colors: ['#a4521b', '#f3ece2'], icon: 'Star' },
  ABQ: { colors: ['#2a8c8c', '#f0d9b5'], icon: 'Wind' },
  PHX: { colors: ['#c1461d', '#fbe3c1'], icon: 'Sun' },
  KC: { colors: ['#1f2f4d', '#e4b363'], icon: 'Compass' },
  STL: { colors: ['#24457a', '#f08a74'], icon: 'Rainbow' },
  LOU: { colors: ['#4a1a2c', '#e9b7c1'], icon: 'Award' },
  MEX: { colors: ['#1f5e3a', '#f0e6d2'], icon: 'Feather' },
};
export const teamStyle = (abbr: string) => TEAM_STYLE[abbr] || { colors: ['#605d5d', '#eae7e7'] as [string, string], icon: 'Circle' };
