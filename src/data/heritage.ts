// Heritage groups: who lives in each country, by population share, and what their
// names look like. A generated player from a country is drawn from these groups by
// population share (if 1% of a country has Nigerian roots, about 1 in 100 of its
// players will), and the group sets his first-name pool, surname pool, native script
// and appearance together: a Greek of Nigerian descent can be "Giannis Antetokounmpo",
// a Frenchman of Congolese descent "Victor Wembanyama".
//
// Shares are rounded from national censuses and official estimates (2011–2023). France
// doesn't collect ethnic data, so its shares are commonly cited estimates. Exceptions:
// the United States and Canada use the mix of their NBA players (about 74% African
// American, 13.5% white, 10.5% multiracial, 1.6% Hispanic and 0.4% Asian American among
// U.S.-born players), not the census. Every other country and territory is in nations.ts.
import { cyr, namePools, nativeMaps } from './world';
import { MORE, NEW_POOLS } from './names';
import { CN_SURNAMES, NATIONS, TW_POOL } from './nations';
import { VN_GIVEN, VN_NATIVE, VN_SURNAME_LIST, VN_SURNAME_WEIGHT, vietnameseName } from './vietnamese';

type Race = Record<string, number>;
export interface Group { k: string; w: number; f: string | string[]; l: string | string[]; race: Race }
const W: Race = { white: 1 }, B: Race = { black: 1 }, A: Race = { asian: 1 }, Br: Race = { brown: 1 };
const g = (k: string, w: number, f: string | string[], l: string | string[], race: Race): Group => ({ k, w, f, l, race });

// Extra name pools used by the groups (common, real given names and surnames).
export const EXTRA_POOLS: Record<string, { f: string[]; l: string[]; lf?: number }> = {
  gb: { f: ['Harry', 'Oliver', 'Jack', 'George', 'Charlie', 'Thomas', 'James', 'William', 'Joshua', 'Callum', 'Jamie', 'Ben'], l: ['Smith', 'Jones', 'Taylor', 'Brown', 'Williams', 'Wilson', 'Johnson', 'Davies', 'Evans', 'Thomas', 'Roberts', 'Walker', 'Wright', 'Hughes'] },
  rp: { f: ['Facundo', 'Nicolás', 'Santiago', 'Gonzalo', 'Leandro', 'Mateo', 'Agustín', 'Luciano', 'Tomás', 'Lautaro', 'Federico', 'Juan Pablo'], l: ['González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'Pérez', 'Gómez', 'Sosa', 'Álvarez', 'Romero', 'Benítez', 'Acosta'] },
  qc: { f: ['Olivier', 'Samuel', 'Félix', 'Mathieu', 'Alexandre', 'Gabriel', 'Étienne', 'Louis-Philippe', 'Maxime', 'Jérémie'], l: ['Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Pelletier'] },
  in: { f: ['Arjun', 'Rohan', 'Rahul', 'Karan', 'Vikram', 'Aditya', 'Siddharth', 'Nikhil', 'Aarav', 'Varun'], l: ['Patel', 'Sharma', 'Gupta', 'Reddy', 'Iyer', 'Nair', 'Shah', 'Mehta', 'Rao', 'Desai'] },
  pa: { f: ['Jaskaran', 'Harpreet', 'Gurpreet', 'Amrit', 'Navdeep', 'Manpreet', 'Jaspreet', 'Karanvir', 'Arshdeep', 'Simran'], l: ['Singh', 'Gill', 'Sandhu', 'Sidhu', 'Dhillon', 'Grewal', 'Brar', 'Bains', 'Randhawa', 'Mann'] },
  pk: { f: ['Mohammed', 'Ali', 'Hamza', 'Bilal', 'Usman', 'Zain', 'Imran', 'Adeel', 'Faisal', 'Rizwan'], l: ['Khan', 'Hussain', 'Ahmed', 'Akhtar', 'Iqbal', 'Rahman', 'Butt', 'Malik', 'Chaudhry', 'Mahmood'] },
  cnC: { f: ['Kevin', 'Jason', 'Michael', 'Ryan', 'Brandon', 'Justin', 'Eric', 'Andrew', 'Jeremy', 'Daniel'], l: ['Wong', 'Chan', 'Lee', 'Lam', 'Cheung', 'Leung', 'Ho', 'Ng', 'Chow', 'Yip', 'Lin', 'Chen'] },
  cnP: { f: [], l: ['Chen', 'Hu', 'Zhou', 'Wang', 'Lin', 'Zhang', 'Ye', 'Jin', 'Xu', 'Wu'] },
  mg: { f: ['Karim', 'Mehdi', 'Nabil', 'Yassine', 'Sofiane', 'Rachid', 'Amine', 'Bilal', 'Walid', 'Nassim', 'Youssef', 'Hamza'], l: ['Benali', 'Bouzid', 'Mansouri', 'Belkacem', 'Cherif', 'Amrani', 'Ziani', 'Brahimi', 'Benkhalifa', 'El Idrissi', 'Bennani', 'Ouali'] },
  lev: { f: ['Karim', 'Rami', 'Elie', 'Georges', 'Omar', 'Nader', 'Fadi', 'Tarek', 'Ziad', 'Charbel'], l: ['Haddad', 'Khoury', 'Saad', 'Nasser', 'Hanna', 'Aoun', 'Khalil', 'Mansour', 'Karam', 'Saliba'] },
  ail: { f: ['Mohammad', 'Ahmad', 'Ali', 'Omar', 'Yousef', 'Khaled', 'Amir', 'Rami', 'Karim', 'Hassan'], l: ['Khoury', 'Haddad', 'Mansour', 'Nasser', 'Saleh', 'Hamdan', 'Jabareen', 'Zoabi', 'Masarwa', 'Ghanem'] },
  ht: { f: ['Jean', 'Pierre', 'Jean-Robert', 'Wilner', 'Frantz', 'Stanley', 'Kervens', 'Jameson', 'Wesley', 'Ricardo'], l: ['Jean-Baptiste', 'Pierre', 'Joseph', 'Charles', 'Louis', 'Étienne', 'Désir', 'Saint-Fleur', 'Jean-Louis', 'Dorvil'] },
  fc: { f: ['Rodrigue', 'Mickaël', 'Johan', 'Kévin', 'Steeve', 'Jérôme', 'Florent', 'Wilfried', 'Ludovic', 'Teddy'], l: ['Beaubois', 'Pietrus', 'Césaire', 'Saint-Louis', 'Hilaire', 'Lubin', 'Nérée', 'Célestine', 'Bellance', 'Zamor'] },
  bah: { f: [], l: ['Rolle', 'Ferguson', 'Knowles', 'Pinder', 'Bethel', 'Munroe', 'Cartwright', 'Bain', 'Hield', 'Ayton', 'Rahming', 'Moss'] },
  vn: { f: [], l: ['Nguyen', 'Tran', 'Le', 'Pham', 'Huynh', 'Vo', 'Dang', 'Bui', 'Do', 'Ho'] },
  ro: { f: ['Andrei', 'Alexandru', 'Mihai', 'Ionuț', 'Florin', 'Adrian', 'Cristian', 'Vlad', 'Ștefan', 'Bogdan'], l: ['Popescu', 'Ionescu', 'Popa', 'Dumitru', 'Stan', 'Stoica', 'Gheorghe', 'Rusu', 'Munteanu', 'Constantin'] },
  al: { f: ['Ardit', 'Arben', 'Klodian', 'Endri', 'Erion', 'Gentian', 'Besnik', 'Dritan', 'Kristi', 'Elton'], l: ['Hoxha', 'Shehu', 'Krasniqi', 'Gashi', 'Berisha', 'Leka', 'Dervishi', 'Kola', 'Çela', 'Duka'] },
  hu: { f: ['Ádám', 'Bence', 'Máté', 'Dávid', 'Levente', 'Balázs', 'Gergő', 'Zoltán', 'Norbert', 'Krisztián'], l: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas'] },
  bs: { f: ['Amar', 'Adnan', 'Emir', 'Haris', 'Kenan', 'Edin', 'Tarik', 'Mirza', 'Armin', 'Džanan'], l: ['Hodžić', 'Mehmedović', 'Hadžić', 'Delić', 'Begić', 'Hasanović', 'Omerović', 'Salihović', 'Musić', 'Sulejmanović'] },
  pl: { f: ['Jakub', 'Kacper', 'Mateusz', 'Szymon', 'Filip', 'Michał', 'Bartosz', 'Piotr', 'Tomasz', 'Łukasz'], l: ['Kowalski', 'Nowak', 'Wiśniewski', 'Lewandowski', 'Wójcik', 'Kamiński', 'Zieliński', 'Szymański', 'Woźniak', 'Dąbrowski'] },
  se: { f: ['Oskar', 'Emil', 'William', 'Anton', 'Viktor', 'Axel', 'Johan', 'Kasper', 'Filip', 'Jesper'], l: ['Johansson', 'Andersson', 'Lindqvist', 'Nyström', 'Holmberg', 'Lindholm', 'Sundström', 'Eriksson', 'Wikström', 'Forsman'] },
  so: { f: ['Abdi', 'Mohamed', 'Ahmed', 'Hassan', 'Abdirahman', 'Yusuf', 'Abdullahi', 'Mahad', 'Liban', 'Ayanle'], l: ['Ali', 'Hussein', 'Farah', 'Warsame', 'Abdullahi', 'Osman', 'Jama', 'Mohamud', 'Hirsi', 'Aden'] },
  ru: { f: ['Dmitri', 'Aleksei', 'Sergei', 'Nikita', 'Artyom', 'Maksim', 'Andrei', 'Kirill', 'Yegor', 'Mikhail'], l: ['Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Volkov', 'Petrov', 'Morozov', 'Fyodorov', 'Kozlov'] },
  mi: { f: ['Tane', 'Wiremu', 'Hemi', 'Rawiri', 'Nikau', 'Manaia', 'Tamati', 'Kauri', 'Ihaia', 'Mikaere'], l: ['Ngata', 'Parata', 'Tipene', 'Te Rangi', 'Paewai', 'Tuhiwai', 'Kereama', 'Waititi', 'Pōmare', 'Tapsell'] },
  pi: { f: ['Sione', 'Tevita', 'Iosefa', 'Viliami', 'Pita', 'Malakai', 'Semisi', 'Losi', 'Tavita', 'Afa'], l: ['Fifita', 'Tuilagi', 'Taufa', 'Leota', 'Faleolo', 'Fonoti', 'Havili', 'Tupou', 'Vaipulu', 'Seumalo'] },
  yo: { f: ['Tunde', 'Femi', 'Oluwaseun', 'Kayode', 'Segun', 'Adebayo', 'Ayodele', 'Babatunde', 'Damilola', 'Olumide'], l: ['Adeyemi', 'Balogun', 'Olawale', 'Adebayo', 'Ogunleye', 'Oladipo', 'Afolabi', 'Akinola', 'Ogundipe', 'Adewale'] },
  ig: { f: ['Chidi', 'Emeka', 'Obinna', 'Chukwuma', 'Ikenna', 'Nnamdi', 'Chinedu', 'Uchenna', 'Ifeanyi', 'Kelechi'], l: ['Okafor', 'Okonkwo', 'Nwosu', 'Eze', 'Chukwu', 'Okeke', 'Obi', 'Nwachukwu', 'Anunoby', 'Okoro'] },
  ha: { f: ['Abubakar', 'Musa', 'Sani', 'Ibrahim', 'Umar', 'Aminu', 'Bashir', 'Yusuf', 'Nasiru', 'Kabiru'], l: ['Bello', 'Abdullahi', 'Musa', 'Garba', 'Lawal', 'Sule', 'Danjuma', 'Haruna', 'Usman', 'Aliyu'] },
  ak: { f: ['Koffi', 'Yao', 'Kouadio', 'Konan', 'Kouamé', 'Serge', 'Christian', 'Jean-Marc', 'Hervé', 'Arsène'], l: ['Kouassi', 'N’Guessan', 'Kouamé', 'Yao', 'Konan', 'Kouadio', 'Brou', 'Aka', 'Kouakou', 'Amani'] },
  mn: { f: ['Aboubakar', 'Sékou', 'Ismaël', 'Moussa', 'Lassina', 'Souleymane', 'Adama', 'Bakary', 'Drissa', 'Mamadou'], l: ['Koné', 'Ouattara', 'Bamba', 'Touré', 'Diabaté', 'Konaté', 'Traoré', 'Coulibaly', 'Cissé', 'Doumbia'] },
  nu: { f: ['Gatluak', 'Gatwech', 'Gatkuoth', 'Chuol', 'Riek', 'Ruot', 'Tut', 'Puok', 'Nyuon', 'Buom'], l: ['Gatluak', 'Gatwech', 'Gatkuoth', 'Chuol', 'Riek', 'Ruot', 'Tut', 'Puok', 'Nyuon', 'Buom'] },
  az: { f: ['Elvin', 'Rashad', 'Orkhan', 'Farid', 'Ramil', 'Tural', 'Kamran', 'Emin', 'Nijat', 'Samir'], l: ['Aliyev', 'Mammadov', 'Huseynov', 'Hasanov', 'Guliyev', 'Ismayilov', 'Abbasov', 'Babayev', 'Rzayev', 'Jafarov'] },
  am: { f: ['Aram', 'Armen', 'Tigran', 'Davit', 'Narek', 'Levon', 'Gor', 'Hayk', 'Vahe', 'Karen'], l: ['Sargsyan', 'Hakobyan', 'Grigoryan', 'Petrosyan', 'Harutyunyan', 'Karapetyan', 'Hovhannisyan', 'Vardanyan', 'Gasparyan', 'Avetisyan'] },
  ku: { f: ['Baran', 'Rojhat', 'Serhat', 'Dilovan', 'Welat', 'Azad', 'Berzan', 'Zana', 'Rênas', 'Hozan'], l: [] },
  fch: { f: ['Kevin', 'Jerome', 'Joshua', 'Andrei', 'Mark', 'Justin', 'Paolo', 'Ryan'], l: ['Tan', 'Lim', 'Chua', 'Go', 'Uy', 'Sy', 'Ong', 'Co', 'Yap', 'Dy'] },
  eth: { f: [], l: ['Tesfaye', 'Mekonen', 'Alemu', 'Kebede', 'Worku', 'Admasu', 'Tadesse', 'Ayalew', 'Getachew', 'Mengistu'] },
  // China's minorities with their own naming traditions, romanized as pinyin of the
  // standard Chinese transcription (how CBA rosters and the Chinese press write them).
  ug: { f: ['Abudushalamu', 'Abudurexiti', 'Maimaiti', 'Aili', 'Yusufu', 'Aisikaer', 'Kuerban', 'Nuermaimaiti', 'Abulimiti', 'Tuerxun', 'Aierken', 'Aikebaier'], l: ['Abudurexiti', 'Maimaiti', 'Aili', 'Yusufu', 'Aisikaer', 'Kuerban', 'Abulimiti', 'Tuerxun', 'Aierken', 'Aikebaier'] },
  mgl: { f: ['Bateer', 'Mengke', 'Bayaer', 'Eerdun', 'Chaolu', 'Wuliji', 'Suhe', 'Nashun', 'Baoyin'], l: ['Bateer', 'Mengke', 'Bayaer', 'Eerdun', 'Chaolu', 'Wuliji', 'Suhe', 'Nashun', 'Baoyin'] },
  bo: { f: ['Zhaxi', 'Ciren', 'Danzeng', 'Luosang', 'Gesang', 'Pingcuo', 'Suolang', 'Dawa', 'Nima', 'Baima'], l: ['Duoji', 'Luobu', 'Ciren', 'Nima', 'Dawa', 'Pingcuo', 'Zhaxi', 'Suolang', 'Danzeng', 'Gesang'] },
};

const zip = (k: string[], v: string[]) => Object.fromEntries(k.map((x, i) => [x, v[i]]));
export const EXTRA_NATIVE: Record<string, Record<string, string>> = {
  ug: zip(['Abudushalamu', 'Abudurexiti', 'Maimaiti', 'Aili', 'Yusufu', 'Aisikaer', 'Kuerban', 'Nuermaimaiti', 'Abulimiti', 'Tuerxun', 'Aierken', 'Aikebaier'], ['阿不都沙拉木', '阿不都热西提', '买买提', '艾力', '玉素甫', '艾斯卡尔', '库尔班', '努尔买买提', '阿不力米提', '吐尔逊', '艾尔肯', '艾克拜尔']),
  mgl: zip(['Bateer', 'Mengke', 'Bayaer', 'Eerdun', 'Chaolu', 'Wuliji', 'Suhe', 'Nashun', 'Baoyin'], ['巴特尔', '蒙克', '巴雅尔', '额尔敦', '朝鲁', '乌力吉', '苏和', '那顺', '宝音']),
  bo: zip(['Zhaxi', 'Ciren', 'Danzeng', 'Luosang', 'Gesang', 'Pingcuo', 'Suolang', 'Dawa', 'Nima', 'Baima', 'Duoji', 'Luobu'], ['扎西', '次仁', '丹增', '洛桑', '格桑', '平措', '索朗', '达瓦', '尼玛', '白玛', '多吉', '罗布']),
  ail: zip(['Mohammad', 'Ahmad', 'Ali', 'Omar', 'Yousef', 'Khaled', 'Amir', 'Rami', 'Karim', 'Hassan', 'Khoury', 'Haddad', 'Mansour', 'Nasser', 'Saleh', 'Hamdan', 'Jabareen', 'Zoabi', 'Masarwa', 'Ghanem'], ['محمد', 'أحمد', 'علي', 'عمر', 'يوسف', 'خالد', 'أمير', 'رامي', 'كريم', 'حسن', 'خوري', 'حداد', 'منصور', 'ناصر', 'صالح', 'حمدان', 'جبارين', 'زعبي', 'مصاروة', 'غانم']),
  ru: zip(['Dmitri', 'Aleksei', 'Sergei', 'Nikita', 'Artyom', 'Maksim', 'Andrei', 'Kirill', 'Yegor', 'Mikhail', 'Ivanov', 'Smirnov', 'Kuznetsov', 'Popov', 'Sokolov', 'Volkov', 'Petrov', 'Morozov', 'Fyodorov', 'Kozlov'], ['Дмитрий', 'Алексей', 'Сергей', 'Никита', 'Артём', 'Максим', 'Андрей', 'Кирилл', 'Егор', 'Михаил', 'Иванов', 'Смирнов', 'Кузнецов', 'Попов', 'Соколов', 'Волков', 'Петров', 'Морозов', 'Фёдоров', 'Козлов']),
};

const AFR = ['yo', 'ig', 'ha', 'cm', 'cd', 'sn', 'ml', 'ak', 'mn'];
// Population groups per country (weights are population shares; they needn't sum to 1).
export const GROUPS: Record<string, Group[]> = {
  US: [g('African American', .74, 'usb', 'usb', B), g('White', .135, 'usw', 'usw', W), g('Multiracial', .105, ['usb', 'usw'], ['usb', 'usw'], { black: .55, white: .3, brown: .15 }), g('Hispanic', .016, 'hus', 'hus', { brown: .8, white: .2 }), g('Asian American', .004, ['cnC', 'usw'], ['cnC', 'vn', 'fch', 'kr'], A)],
  CA: [g('Black Canadian', .50, ['usb', 'jm'], ['jm', 'usb', 'ht', 'so', 'yo', 'ig'], B), g('English Canadian', .30, 'usw', ['usw', 'gb'], W), g('French Canadian', .10, 'qc', 'qc', W), g('South Asian', .04, ['in', 'pa'], ['in', 'pa'], Br), g('Asian', .03, 'cnC', 'cnC', A), g('Filipino', .015, ['ph', 'usw'], 'ph', { brown: .6, asian: .4 }), g('Indigenous', .015, 'usw', ['usw', 'qc'], Br)],
  BS: [g('Bahamian', .90, 'us', ['bah', 'us'], B), g('White Bahamian', .05, 'us', ['bah', 'us'], W), g('Haitian', .05, 'ht', 'ht', B)],
  BR: [g('Pardo', .453, 'pt', 'pt', Br), g('White (Portuguese roots)', .33, 'pt', 'pt', W), g('White (Italian roots)', .105, 'pt', 'it', W), g('Black', .102, 'pt', 'pt', B), g('Indigenous', .006, 'pt', 'pt', Br), g('Japanese Brazilian', .004, 'pt', 'jp', A)],
  AR: [g('Spanish roots', .45, 'rp', 'rp', W), g('Italian roots', .40, 'rp', 'it', W), g('Mestizo', .10, 'rp', 'rp', Br), g('Syrian-Lebanese', .03, 'rp', 'lev', { white: .5, brown: .5 }), g('Indigenous', .02, 'rp', 'rp', Br)],
  MX: [g('Mestizo', .62, 'la', 'la', Br), g('Indigenous', .21, 'la', 'la', Br), g('White', .15, 'la', 'la', W), g('Afro-Mexican', .02, 'la', 'la', B)],
  DO: [g('Mixed', .73, 'la', 'la', Br), g('White', .14, 'la', 'la', W), g('Black', .08, 'la', 'la', B), g('Haitian', .05, 'ht', 'ht', B)],
  PR: [g('Mixed', .76, 'la', 'la', Br), g('White', .17, 'la', 'la', W), g('Black', .07, 'la', 'la', B)],
  VE: [g('Mestizo', .52, 'la', 'la', Br), g('White', .40, 'la', 'la', W), g('Italian Venezuelan', .03, 'la', 'it', W), g('Afro-Venezuelan', .03, 'la', 'la', B), g('Indigenous', .02, 'la', 'la', Br)],
  UY: [g('Spanish roots', .55, 'rp', 'rp', W), g('Italian roots', .33, 'rp', 'it', W), g('Mestizo', .08, 'rp', 'rp', Br), g('Afro-Uruguayan', .04, 'rp', 'rp', B)],
  FR: [g('European', .82, 'fr', 'fr', W), g('North African', .08, ['fr', 'mg'], 'mg', Br), g('Sub-Saharan African', .035, 'fr', AFR, B), g('Caribbean (Antilles)', .02, 'fc', 'fc', { black: .8, brown: .2 }), g('Asian', .02, 'fr', ['vn', 'cnC'], A), g('Turkish', .01, ['fr', 'tr'], 'tr', { white: .5, brown: .5 }), g('Portuguese', .015, ['fr', 'pt'], 'pt', W)],
  ES: [g('Spanish', .84, 'es', 'es', W), g('Latin American', .08, 'la', 'la', { brown: .6, white: .4 }), g('Moroccan', .025, 'mg', 'mg', Br), g('Romanian', .02, 'ro', 'ro', W), g('Sub-Saharan African', .01, ['es', 'fr'], ['cd', 'cm', 'sn', 'yo'], B), g('Other European', .025, ['it', 'de', 'fr'], ['it', 'de', 'fr'], W)],
  DE: [g('German', .72, 'de', 'de', W), g('Turkish', .034, ['de', 'tr'], 'tr', { brown: .6, white: .4 }), g('Polish', .026, ['de', 'pl'], 'pl', W), g('Russian German', .025, ['de', 'ru'], 'de', W), g('Former Yugoslav', .025, ['rs', 'hr', 'bs'], ['rs', 'hr', 'bs'], W), g('Syrian & Arab', .015, 'lev', 'lev', Br), g('Romanian', .012, 'ro', 'ro', W), g('Italian', .01, ['de', 'it'], 'it', W), g('Afro-German', .01, 'de', ['de', 'de', 'yo', 'ig', 'cm', 'ak'], { black: .6, brown: .4 }), g('Greek', .005, ['de', 'gr'], 'gr', W)],
  IT: [g('Italian', .90, 'it', 'it', W), g('Romanian', .018, 'ro', 'ro', W), g('Albanian', .012, ['it', 'al'], 'al', W), g('Moroccan', .008, 'mg', 'mg', Br), g('African Italian', .01, 'it', ['sn', 'yo', 'ig', 'ak', 'cm'], B), g('Chinese Italian', .005, 'it', 'cnP', A), g('Former Yugoslav', .01, ['rs', 'hr', 'bs'], ['rs', 'hr', 'bs'], W)],
  GR: [g('Greek', .91, 'gr', 'gr', W), g('Albanian', .05, ['gr', 'al'], 'al', W), g('Other Balkan & Eastern European', .02, ['ro', 'ru'], ['ro', 'ru'], W), g('African Greek', .005, 'gr', ['yo', 'ig', 'ha', 'cm', 'sn'], B), g('Georgian', .005, 'ge', 'ge', W), g('South Asian & Middle Eastern', .01, ['pk', 'lev'], ['pk', 'lev'], Br)],
  RS: [g('Serb', .81, 'rs', 'rs', W), g('Hungarian', .025, 'hu', 'hu', W), g('Bosniak', .022, 'bs', 'bs', W), g('Roma', .018, 'rs', 'rs', Br), g('Croat', .006, 'hr', 'hr', W), g('Albanian', .006, 'al', 'al', W)],
  HR: [g('Croat', .916, 'hr', 'hr', W), g('Serb', .032, 'rs', 'rs', W), g('Bosniak', .006, 'bs', 'bs', W), g('Roma', .004, 'hr', 'hr', Br), g('Hungarian', .003, 'hu', 'hu', W), g('Italian', .003, 'it', 'it', W), g('Albanian', .003, 'al', 'al', W)],
  SI: [g('Slovene', .83, 'si', 'si', W), g('Serb', .02, 'rs', 'rs', W), g('Croat', .018, 'hr', 'hr', W), g('Bosniak', .016, 'bs', 'bs', W)],
  ME: [g('Montenegrin', .41, 'rs', 'rs', W), g('Serb', .33, 'rs', 'rs', W), g('Bosniak & Muslim', .154, 'bs', 'bs', W), g('Albanian', .049, 'al', 'al', W), g('Croat', .009, 'hr', 'hr', W)],
  BA: [g('Bosniak', .50, 'bs', 'bs', W), g('Serb', .31, 'rs', 'rs', W), g('Croat', .154, 'hr', 'hr', W)],
  LT: [g('Lithuanian', .846, 'lt', 'lt', W), g('Polish', .065, 'pl', 'pl', W), g('Russian', .05, 'ru', 'ru', W)],
  LV: [g('Latvian', .63, 'lv', 'lv', W), g('Russian', .24, 'ru', 'ru', W), g('Belarusian & Ukrainian', .05, 'ru', 'ru', W), g('Polish', .02, 'pl', 'pl', W)],
  FI: [g('Finnish', .87, 'fi', 'fi', W), g('Swedish-speaking', .05, 'se', 'se', W), g('Russian', .015, 'ru', 'ru', W), g('Arab & Kurdish', .01, ['lev', 'ku'], 'lev', Br), g('Somali', .004, 'so', 'so', B)],
  TR: [g('Turkish', .75, 'tr', 'tr', W), g('Kurdish', .18, ['ku', 'tr'], 'tr', { white: .6, brown: .4 }), g('Arab', .02, ['lev', 'tr'], 'tr', Br)],
  IL: [g('Jewish', .712, 'il', 'il', W), g('Ethiopian Israeli', .018, 'il', 'eth', B), g('Arab', .21, 'ail', 'ail', Br)],
  GE: [g('Georgian', .868, 'ge', 'ge', W), g('Azerbaijani', .063, 'az', 'az', W), g('Armenian', .045, 'am', 'am', W)],
  GB: [g('White British', .744, 'gb', 'gb', W), g('Polish', .025, ['gb', 'pl'], 'pl', W), g('Romanian', .015, 'ro', 'ro', W), g('Italian', .01, ['gb', 'it'], 'it', W), g('Indian', .031, ['gb', 'in'], ['in', 'pa'], Br), g('Pakistani & Bangladeshi', .038, 'pk', 'pk', Br), g('Chinese', .007, 'cnC', 'cnC', A), g('Black African', .025, ['gb', 'yo', 'ig'], ['yo', 'ig', 'ha', 'ak', 'so'], B), g('Black Caribbean', .01, 'jm', 'jm', B), g('Mixed', .029, 'gb', 'gb', { black: .5, white: .3, brown: .2 }), g('Arab', .006, 'lev', 'lev', Br)],
  NG: [g('Hausa-Fulani', .30, 'ha', 'ha', B), g('Yoruba', .155, 'yo', 'yo', B), g('Igbo', .152, 'ig', 'ig', B)],
  SN: [g('Senegalese', 1, 'sn', 'sn', B)], ML: [g('Malian', 1, 'ml', 'ml', B)], CM: [g('Cameroonian', 1, 'cm', 'cm', B)], CD: [g('Congolese', 1, 'cd', 'cd', B)],
  SS: [g('Dinka', .36, 'ss', 'ss', B), g('Nuer', .16, 'nu', 'nu', B)],
  KE: [g('Kenyan', .94, 'ke', 'ke', B), g('Somali Kenyan', .06, 'so', 'so', B)],
  AO: [g('Angolan', .96, 'ao', 'ao', B), g('Mestiço', .03, 'ao', 'ao', Br), g('European', .01, 'pt', 'pt', W)],
  CI: [g('Akan', .45, 'ak', 'ak', B), g('Mandé & Gur', .55, 'mn', 'mn', B)],
  JM: [g('Black Jamaican', .92, 'jm', 'jm', B), g('Mixed', .06, 'jm', 'jm', Br), g('Indo-Jamaican', .008, 'jm', 'in', Br), g('Chinese Jamaican', .002, 'jm', 'cnC', A)],
  AU: [g('Anglo-Celtic', .76, 'au', 'au', W), g('Italian', .044, 'au', 'it', W), g('Greek', .017, ['au', 'gr'], 'gr', W), g('Chinese', .055, 'au', 'cnC', A), g('Indian', .031, ['au', 'in'], ['in', 'pa'], Br), g('Vietnamese', .013, 'au', 'vn', A), g('Filipino', .012, 'au', 'ph', { brown: .6, asian: .4 }), g('Lebanese', .01, ['au', 'lev'], 'lev', Br), g('Aboriginal & Torres Strait Islander', .032, 'au', 'au', { brown: .5, black: .5 }), g('Pacific Islander', .01, 'pi', 'pi', Br), g('South Sudanese', .002, 'ss', 'ss', B)],
  NZ: [g('European', .676, 'au', 'au', W), g('Māori', .178, ['mi', 'au'], ['mi', 'au'], Br), g('Pacific', .089, 'pi', 'pi', Br), g('Chinese', .05, 'au', 'cnC', A), g('Indian', .047, ['au', 'in'], ['in', 'pa'], Br), g('Filipino', .015, 'au', 'ph', { brown: .6, asian: .4 })],
  CN: [g('Han', .911, 'cn', 'cn', A), g('Zhuang, Hui, Manchu & others', .071, 'cn', 'cn', A), g('Uyghur', .0083, 'ug', 'ug', { brown: .5, asian: .3, white: .2 }), g('Tibetan', .005, 'bo', 'bo', A), g('Mongol', .0045, 'mgl', 'mgl', A)],
  JP: [g('Japanese', .976, 'jp', 'jp', A), g('Mixed heritage', .02, 'jp', 'jp', { black: .5, white: .5 }), g('Korean & Chinese Japanese', .004, 'jp', 'jp', A)],
  KR: [g('Korean', .985, 'kr', 'kr', A), g('Multicultural', .015, 'kr', 'kr', { asian: .6, white: .2, black: .2 })],
  PH: [g('Filipino', .98, 'ph', 'ph', { brown: .7, asian: .3 }), g('Chinese Filipino', .015, 'fch', 'fch', A)],
};

NATIONS.forEach(([code, name, , , spec]) => {
  const single = spec.length === 2 && !Array.isArray(spec[1]);
  GROUPS[code] = single ? [g(name, 1, spec[0] as any, spec[0] as any, spec[1] as Race)] : (spec as any[]).map(x => g(x[0], x[1], x[2], x[3], x[4]));
});

// Every name pool (base, heritage extras, new pools and additions), native-script maps,
// and frequency weights (Chinese and Taiwanese surnames), built once.
let POOLS: any = null, NATIVE: any = null;
const WEIGHT: Record<string, Record<string, number>> = {};
export function allPools(): Record<string, { f: string[]; l: string[]; lf?: number }> { build(); return POOLS; }
export function allNative() { build(); return NATIVE; }
function build() {
  if (POOLS) return;
  const base: any = { ...namePools(), ...EXTRA_POOLS }, nm: any = { ...nativeMaps(), ...EXTRA_NATIVE };
  POOLS = {}; Object.keys(base).forEach(k => (POOLS[k] = { ...base[k], f: [...base[k].f], l: [...base[k].l] }));
  NATIVE = {}; Object.keys(nm).forEach(k => (NATIVE[k] = { ...nm[k] }));
  const add = (k: string, side: 'f' | 'l', entries: string[] = []) => { const p = (POOLS[k] = POOLS[k] || { f: [], l: [] });
    entries.forEach(e => { const [lat, nat, tone] = e.split('|'); if (!p[side].includes(lat)) p[side].push(lat); if (nat) (NATIVE[k] = NATIVE[k] || {})[lat] = nat; if (tone) NATIVE.cnT[lat] = tone; }); };
  Object.entries(NEW_POOLS).forEach(([k, v]) => { add(k, 'f', v.f); add(k, 'l', v.l); if (v.lf) POOLS[k].lf = 1; });
  Object.entries(MORE).forEach(([k, v]) => { add(k, 'f', v.f); add(k, 'l', v.l); });
  POOLS.cn.l = CN_SURNAMES.map(x => x[0]); CN_SURNAMES.forEach(([k, h, t]) => { NATIVE.cn[k] = h; NATIVE.cnT[k] = t; });
  WEIGHT.cn = Object.fromEntries(CN_SURNAMES.map(x => [x[0], x[3]]));
  // Vietnamese: weighted family names; full names (with middle names) come from vietnameseName().
  POOLS.vn = { ...(POOLS.vn || {}), f: VN_GIVEN.map(e => e.split('|')[0]), l: VN_SURNAME_LIST.slice() }; WEIGHT.vn = VN_SURNAME_WEIGHT; NATIVE.vn = { ...(NATIVE.vn || {}), ...VN_NATIVE };
  POOLS.tw = { lf: 1, f: [], l: [] }; add('tw', 'f', TW_POOL.f); add('tw', 'l', TW_POOL.l.map(x => x[0])); WEIGHT.tw = Object.fromEntries(TW_POOL.l.map(([e, w]) => [e.split('|')[0], w]));
}

export function groupsOf(country: string): Group[] { return GROUPS[country] || []; }
export function pickGroup(country: string, rnd: () => number = Math.random): Group | null {
  const gs = groupsOf(country); if (!gs.length) return null;
  const tot = gs.reduce((a, x) => a + x.w, 0); let r = rnd() * tot;
  for (const x of gs) { if ((r -= x.w) < 0) return x; }
  return gs[gs.length - 1];
}

const FAMILY_FIRST = new Set(['cn', 'kr', 'tw', 'kp', 'kh', 'vn']);
const CYR_COUNTRIES = ['RS', 'ME', 'BA'];

// A name (Romanized + native script) and a look from a heritage group.
export function nameFromGroup(country: string, grp: Group, rnd: () => number = Math.random) {
  const NP: any = allPools(), NM: any = allNative();
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];
  const pool = (x: string | string[]) => (Array.isArray(x) ? pick(x) : x);
  let fp = pool(grp.f), lp = pool(grp.l);
  if (!NP[fp]?.f?.length) fp = NP[lp]?.f?.length ? lp : 'us';
  if (!NP[lp]?.l?.length) lp = NP[fp]?.l?.length ? fp : 'us';
  // Surnames by frequency where we have it (Chinese, Taiwanese), otherwise uniformly.
  const pickL = () => { const w = WEIGHT[lp], a = NP[lp].l as string[]; if (!w) return pick(a); let r = rnd() * a.reduce((t, x) => t + (w[x] || 0.05), 0); for (const x of a) { if ((r -= w[x] || 0.05) < 0) return x; } return a[a.length - 1]; };
  const f = pick(NP[fp].f) as string; let l = pickL();
  for (let i = 0; l === f && i < 5; i++) l = pickL();
  const same = fp === lp;
  let first = f, last = l, nativeFirst = '', nativeLast = '', sep = ' ';
  if (same && fp === 'vn') { const v = vietnameseName(rnd); first = v.first; last = v.last; nativeFirst = v.nativeFirst; nativeLast = v.nativeLast; }
  else if (same && fp === 'cn') { first = NM.cnT[f] || f; last = NM.cnT[l] || l; nativeFirst = NM.cn[f] || ''; nativeLast = NM.cn[l] || ''; }
  else if (same && fp === 'rs' && CYR_COUNTRIES.includes(country)) { nativeFirst = cyr(f); nativeLast = cyr(l); }
  else if (same && NM[fp] && fp !== 'rs') { nativeFirst = NM[fp][f] || ''; nativeLast = NM[fp][l] || ''; }
  // Pool keys that disambiguate same-spelled surnames (e.g. Xu许) display as plain Latin.
  first = first.replace(/[^\x00-\u024f\u1e00-\u1eff' ’-]+$/u, ''); last = last.replace(/[^\x00-\u024f\u1e00-\u1eff' ’-]+$/u, '');
  if (fp === 'ug' || fp === 'mgl') sep = '·'; else if (fp === 'bo') sep = '';
  const familyFirst = same && FAMILY_FIRST.has(fp);
  const name = familyFirst ? last + ' ' + first : first + ' ' + last;
  const cjkFamily = same && ['cn', 'kr', 'jp', 'tw', 'kp', 'vn'].includes(fp), spaced = fp === 'jp' || fp === 'vn';
  const native = !nativeFirst || !nativeLast ? '' : cjkFamily ? nativeLast + (spaced ? ' ' : '') + nativeFirst : nativeFirst + sep + nativeLast;
  const ks = Object.keys(grp.race); let r = rnd() * ks.reduce((a, k) => a + grp.race[k], 0), race = ks[0];
  for (const k of ks) { if ((r -= grp.race[k]) < 0) { race = k; break; } }
  const nOrder = cjkFamily ? (spaced ? 'lf ' : 'lf') : 'fl';
  return { first, last, name, native, nativeFirst: native ? nativeFirst : '', nativeLast: native ? nativeLast : '', familyFirst, race, heritage: grp.k, nOrder, nSep: sep };
}

// A random real name for a country: a heritage group drawn by population share (or the
// one asked for), then a name and look from it.
export function randomName(country: string, rnd: () => number = Math.random, groupKey?: string) {
  const grp = (groupKey && groupsOf(country).find(x => x.k === groupKey)) || pickGroup(country, rnd) || g('Default', 1, 'us', 'us', B);
  return nameFromGroup(country, grp, rnd);
}
