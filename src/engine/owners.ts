// Who the owners are: how they made the money to buy a team, what they're worth, when and how
// they got the team (bought, inherited, a founding partner, a local group), written to fit their
// personality (the owner type that sets their demands). Most bios come from one of about forty
// backgrounds, never two the same in a league, stored on the team so they never change; four
// owners are written by hand, and one of them isn't a person at all. God Mode can rewrite any of it.
import type { Game } from './Game';
import { teamValue } from './frontOffice';

export type OwnerKind = 'fan' | 'passionate' | 'profit' | 'fund';
export const KIND_LABEL: Record<OwnerKind, string> = { fan: 'Fan first', passionate: 'Passionate', profit: 'Profit first', fund: 'Institutional investor' };
export const KIND_DESC: Record<OwnerKind, string> = { fan: 'Enormously rich and a lifelong fan: community, players and fans before profit.', passionate: 'Rich enough to own a team, and it means everything to them.', profit: 'Owns the team as an investment. Basketball is a line on a balance sheet.', fund: 'An investment fund: patient, cautious, and answerable to its beneficiaries.' };

// The hand-written owners: where they start, their type, their fortune ($B).
export const NAMED_OWNERS = [
  { key: 'mac', owner: 'Panny “Mac-Pan” Macquiao', abbr: 'CHI', arch: 'Hype Focus', kind: 'passionate' as OwnerKind, worth: 12 },
  { key: 'mao', owner: 'Mao Ying', abbr: 'LA', arch: 'Win-Now Spender', kind: 'fan' as OwnerKind, worth: 90 },
  { key: 'jush', owner: 'Tanner Matthews', abbr: 'NY', arch: 'Frugal Profit-Seeker', kind: 'profit' as OwnerKind, worth: 9 },
  { key: 'fund', owner: 'Aurelian Public Investment Fund', abbr: 'VAN', arch: 'Asset Hoarder', kind: 'fund' as OwnerKind, worth: 640 },
];

// New leagues (and older saves, except the teams you run): put the named owners in place.
export function placeNamedOwners(teams: any[], skip: (tid: number) => boolean = () => false) {
  NAMED_OWNERS.forEach(n => { const t = teams.find(x => x.abbr === n.abbr) || null; if (!t || skip(t.tid) || teams.some(x => x.owner === n.owner)) return; t.owner = n.owner; t.arch = n.arch; t.ownerKey = n.key; });
}

const hash = (str: string) => { let h = 2166136261; for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h >>> 0; };
const pickH = <T,>(a: T[], seed: number, salt: number) => a[(seed >>> (salt % 24)) % a.length];
const bil = (x: number) => (x >= 100 ? Math.round(x) : x >= 10 ? x.toFixed(0) : x.toFixed(1)).toString().replace(/\.0$/, '');
const money = (m: number) => (m >= 1000 ? '$' + (m / 1000).toFixed(2).replace(/0$/, '').replace(/\.0$/, '') + ' billion' : '$' + Math.round(m) + ' million');

// Where an owner grew up, from the roots of the surname (every generated owner has an American
// first name, so they're Americans, raised where those communities live), and what the business
// was, matching how the sale was announced.
const HOMES: Record<string, string[]> = {
  anglo: ['a small town in Ohio', 'suburban Dallas', 'Greenwich, Connecticut', 'Charlotte, North Carolina', 'Omaha, Nebraska', 'a farm in Iowa', 'Scottsdale, Arizona', 'Nashville, Tennessee', 'Boise, Idaho', 'Richmond, Virginia'],
  southern: ['rural Georgia', 'Birmingham, Alabama', 'Memphis, Tennessee', 'Jackson, Mississippi', 'Greenville, South Carolina'],
  jewish: ['Brooklyn, New York', 'Shaker Heights, Ohio', 'Skokie, Illinois', 'the Upper West Side of Manhattan', 'Great Neck, New York', 'Squirrel Hill in Pittsburgh'],
  german: ['Milwaukee, Wisconsin', 'Cincinnati, Ohio', 'Fredericksburg, Texas', 'St. Louis, Missouri'],
  nordic: ['Minneapolis, Minnesota', 'a farm in North Dakota', 'the Ballard neighborhood of Seattle', 'Duluth, Minnesota', 'Madison, Wisconsin'],
  italian: ['South Philadelphia', 'Staten Island, New York', 'the North End of Boston', 'Providence, Rhode Island', 'Newark, New Jersey', 'The Hill in St. Louis'],
  hispanic: ['East Los Angeles', 'San Antonio, Texas', 'El Paso, Texas', 'Miami, Florida', 'Albuquerque, New Mexico', 'Phoenix, Arizona', 'the Bronx, New York'],
  filipino: ['Daly City, California', 'Honolulu, Hawaii', 'San Diego, California', 'Jersey City, New Jersey'],
  nigerian: ['Houston, Texas, in a Nigerian immigrant family', 'Silver Spring, Maryland, in a Nigerian immigrant family', 'Atlanta, Georgia, in a Nigerian immigrant family', 'Dallas, Texas, in a Nigerian immigrant family'],
  japanese: ['Honolulu, Hawaii', 'Torrance, California', 'Seattle, Washington', 'San Jose, California', 'Sacramento, California'],
  southafrican: ['Atlanta, Georgia, in a South African immigrant family', 'Washington, D.C., in a family of South African exiles', 'Houston, Texas, in a South African immigrant family'],
  french: ['New Orleans, Louisiana', 'Lafayette, Louisiana', 'Baton Rouge, Louisiana', 'Lowell, Massachusetts'],
  polish: ['the Avondale neighborhood of Chicago', 'Hamtramck, Michigan', 'Buffalo, New York', 'Milwaukee, Wisconsin'],
  hungarian: ['Cleveland, Ohio', 'New Brunswick, New Jersey', 'Toledo, Ohio'],
  irish: ['South Boston', 'Scranton, Pennsylvania', 'Queens, New York', 'Chicago’s South Side'],
};
const ROOTS: Record<string, string> = {
  Kessler: 'jewish', Rosenthal: 'jewish', Brandt: 'german', Lindgren: 'nordic', Lindqvist: 'nordic', Halvorsen: 'nordic',
  Castellano: 'italian', Mancuso: 'italian', Esposito: 'italian', Vasquez: 'hispanic', Castellanos: 'hispanic', Villanueva: 'filipino',
  Okoro: 'nigerian', Oyelaran: 'nigerian', Adebayo: 'nigerian', Nakashima: 'japanese', Mbeki: 'southafrican', Delacroix: 'french', Duquesne: 'french',
  Kowalczyk: 'polish', Szabo: 'hungarian', Abernathy: 'southern', Hollister: 'southern', Wexford: 'irish', Galloway: 'irish',
};

// ── Where the money came from ─────────────────────────────────────────────────────
// Every generated owner has a background: how the fortune was made and how the team was
// acquired (bought, inherited, a founding partner from the expansion days, a local group),
// closed by a line that fits the owner's kind. No two owners in a league share one; it's stored
// on the team (ownerBg) so a bio never changes, and a buyer's background matches how the sale
// was announced. Every company, network and label named here is made up.
type Acq = 'bought' | 'inherited' | 'founding' | 'group';
interface Ctx { name: string; first: string; last: string; home: string; team: string; city: string; yr: number; P: string; W: string; y1: number; old: number; famYr: number; famP: string; inhYr: number }
export interface OwnerBg { key: string; label: string; who: string; kinds: OwnerKind[]; worth: [number, number]; acq?: Acq; body: (c: Ctx) => string }

export const OWNER_BGS: OwnerBg[] = [
  { key: 'cable', label: 'Founded a cable network', who: 'a media founder', kinds: ['passionate', 'fan'], worth: [1.4, 3.8],
    body: c => `${c.name} grew up in ${c.home}, one of eight children, and in ${c.y1} borrowed $15,000 to launch Crown Television Network, a cable channel made for Black audiences that the big networks had never bothered to serve. Two decades later ${c.first} sold it to a media conglomerate for about $3 billion and put the money into hotels, a bank and film production. In ${c.yr} ${c.first} became controlling owner of the ${c.team}, paying ${c.P} with a group of minority partners: a fortune built from nothing, and a seat at a table that had rarely made room for someone like ${c.last}.` },
  { key: 'ai', label: 'Ran an AI company, lives on the dividends', who: 'a retired tech CEO', kinds: ['fan', 'passionate'], worth: [70, 140],
    body: c => `${c.name} joined Cortex, then a forty-person artificial-intelligence lab, in ${c.y1} as its first salesperson, ran the business side through the years when nobody knew what the company would become, and became chief executive when the founders stepped back. By the time ${c.first} retired, the stake was worth tens of billions; the dividends alone now bring in about a billion dollars a year, and ${c.last} has never sold a share. In ${c.yr} ${c.first} paid ${c.P} for the ${c.team}, a record at the time, and has been the loudest person in the building ever since.` },
  { key: 'heirs', label: 'Inherited the team', who: 'a family trust', kinds: ['passionate', 'fan'], worth: [3, 7], acq: 'inherited',
    body: c => `The ${c.team} have been a family business since ${c.famYr}, when ${c.first}'s father, a chemistry professor who had made a fortune buying apartment buildings, bought the club, its arena and a minor-league hockey team in one deal for ${c.famP}. He turned games into a nightly show and the franchise into one of the most valuable in sports. When he died in ${c.inhYr}, the team passed to his six children in a trust, and ${c.first}, who had run the business side for a decade, took control. The siblings still own their shares, and they don't always agree.` },
  { key: 'founding', label: 'Founding partner (expansion era)', who: 'a founding partner', kinds: ['passionate', 'fan'], worth: [7, 14], acq: 'founding',
    body: c => `${c.name}'s father built Meridian Cruise Lines from two secondhand ships into the largest cruise company in the world, and in ${c.famYr} he was the lead investor when the ${c.team} joined the league as an expansion team, putting up most of the ${c.famP} entry fee. ${c.first} took over as managing partner in ${c.inhYr}, bought out the other founders, and has been at the center of every big decision since, from the new arena to the stars who came to play in it.` },
  { key: 'mortgage', label: 'Online mortgage lender', who: 'a mortgage-lending founder', kinds: ['passionate', 'fan'], worth: [10, 25],
    body: c => `${c.name} started Ridgeline Home Loans in ${c.y1} with a borrowed $5,000 and a used fax machine, and made it the country's biggest mortgage lender by putting the whole application online before anyone else did. Then ${c.first} spent billions buying up empty office towers in a downtown everyone had written off and filling them with jobs. Buying the ${c.team} in ${c.yr} for ${c.P} was part of the same plan: give ${c.city} a reason to come downtown.` },
  { key: 'software', label: 'Database software founder', who: 'a tech founder', kinds: ['fan', 'passionate', 'profit'], worth: [30, 110],
    body: c => `${c.name} dropped out of college, wrote the first version of Northgate's database software with two friends in ${c.y1}, and spent the next forty years turning Northgate into one of the largest software companies in the world. ${c.first} still owns about a quarter of it and is worth ${c.W}; the ${c.team}, bought in ${c.yr} for ${c.P}, came after years of courtside seats.` },
  { key: 'chips', label: 'Chip designer', who: 'a semiconductor founder', kinds: ['fan', 'passionate'], worth: [25, 90],
    body: c => `${c.name} co-founded Halcyon Semiconductor in ${c.y1} with two engineers at a booth in a roadside diner, and bet the company on graphics chips years before anyone knew what they'd be used for. When artificial intelligence took off, every data center in the world wanted Halcyon's chips, and ${c.first}'s stake made ${c.last} one of the richest people alive. Buying the ${c.team} in ${c.yr} for ${c.P} barely dented the fortune.` },
  { key: 'pe', label: 'Private-equity investor', who: 'a private-equity investor', kinds: ['profit'], worth: [5, 18],
    body: c => `${c.name} co-founded Ironbridge Capital, a private-equity firm, in ${c.y1}, and spent thirty years buying companies with borrowed money, cutting costs and selling them at a profit: supermarkets, software, dental chains, a ski resort. The ${c.team} were bought the same way in ${c.yr}: ${c.P}, much of it from the firm's partners and a loan against the team's own value.` },
  { key: 'hedge', label: 'Hedge-fund manager', who: 'a hedge-fund manager', kinds: ['profit', 'passionate'], worth: [8, 30],
    body: c => `${c.name} started the hedge fund Larkspur Partners in ${c.y1} after a decade trading bonds, and made its name with one famous bet against the housing market that paid billions when it collapsed. ${c.first} still runs money for pensions and endowments, and bought the ${c.team} in ${c.yr} for ${c.P}, sure that franchise values would keep climbing. So far, ${c.last} has been right.` },
  { key: 'realestate', label: 'Real-estate developer', who: 'a real-estate developer', kinds: ['profit', 'passionate'], worth: [4, 14],
    body: c => `${c.name} grew up in ${c.home}, the child of a contractor, and turned the family business into Stonegate Development, a builder of shopping centers, office parks and, lately, whole neighborhoods around new arenas. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P} with an eye on the land around the arena as much as the team itself.` },
  { key: 'grocery', label: 'Supermarket chain', who: 'a grocery-chain heir', kinds: ['passionate', 'fan', 'profit'], worth: [6, 16],
    body: c => `${c.name}'s grandfather opened a single grocery store in ${c.old} in ${c.home}; ${c.first}'s father grew it into Harvest Fair, a chain of 1,400 supermarkets across the South and Midwest. ${c.first} ran it for twenty years, sold a controlling stake to a private-equity firm, and kept enough to buy the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'electronics', label: 'Electronics retailer', who: 'a retail founder', kinds: ['passionate', 'profit'], worth: [5, 18],
    body: c => `${c.name} opened a single stereo shop in ${c.y1} in ${c.home}, and grew it into Voltline, a chain of electronics superstores, then made a second fortune selling televisions, headphones and laptops under the store's own brand. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'athlete', label: 'Former NBA star', who: 'a former NBA star', kinds: ['passionate', 'fan'], worth: [2, 4.5],
    body: c => `${c.name} played fourteen seasons in the league, made six All-Star teams and won two championships, and made far more off the court than on it: ${c.first}'s signature shoe still sells hundreds of millions of dollars a year. After retiring, ${c.first} bought a small stake in the ${c.team}, then became controlling owner in ${c.yr}, paying ${c.P} with a group of partners. ${c.last} sits in on scouting meetings and doesn't pretend otherwise.` },
  { key: 'music', label: 'Music mogul', who: 'a music mogul', kinds: ['passionate', 'fan'], worth: [2.5, 6],
    body: c => `${c.name} grew up in ${c.home}, sold mixtapes out of the trunk of a car, and built Lockstep Records into one of the biggest labels of the last thirty years. The real money came later: a streaming service, a cognac brand, a sports agency and stakes in a dozen startups. In ${c.yr} ${c.first} led a group that bought the ${c.team} for ${c.P}, and the courtside seats have been the hardest ticket in town ever since.` },
  { key: 'streaming', label: 'Streaming service co-founder', who: 'a media executive', kinds: ['passionate', 'profit', 'fan'], worth: [6, 20],
    body: c => `${c.name} co-founded Reelhouse in ${c.y1}, a movies-by-mail company that became one of the world's biggest streaming services, and has sold off most of the stake over the years. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P} and runs the franchise like a studio: big stars, a big show and a lot of data.` },
  { key: 'fintech', label: 'Payments company founder', who: 'a fintech founder', kinds: ['passionate', 'profit', 'fan'], worth: [6, 25],
    body: c => `${c.name} founded Paywise in ${c.y1} to let small shops take card payments on a phone; twenty years later it processes a big slice of the world's online spending. Almost all of ${c.first}'s ${c.W} is Paywise stock. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'crypto', label: 'Crypto exchange founder', who: 'a cryptocurrency founder', kinds: ['passionate', 'profit'], worth: [3, 14],
    body: c => `${c.name} started a cryptocurrency exchange in ${c.y1}, when most people thought bitcoin was a joke, and rode it to a fortune that has swung by tens of billions in a single year. On paper ${c.first} is worth ${c.W} today. Buying the ${c.team} in ${c.yr} for ${c.P} was, ${c.last} says, a way to own something that doesn't crash.` },
  { key: 'betting', label: 'Sports-betting app founder', who: 'a sports-betting founder', kinds: ['passionate', 'profit'], worth: [3, 9],
    body: c => `${c.name} built Clutchline, a fantasy-sports app that became one of the country's biggest sports-betting companies once betting was legalized state by state. The league made ${c.first} sell the stake before buying the ${c.team} in ${c.yr} for ${c.P}; ${c.last} still knows the point spread of every game.` },
  { key: 'fastfood', label: 'Restaurant franchisee', who: 'a restaurant franchisee', kinds: ['passionate', 'fan', 'profit'], worth: [2.5, 6],
    body: c => `At twenty-three, ${c.name} bought a single burger franchise in ${c.home}. Today ${c.first} owns more than 1,200 restaurants across eleven chains, the biggest franchisee in the country. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'cars', label: 'Car dealerships', who: 'an auto-dealership magnate', kinds: ['passionate', 'profit'], worth: [2.5, 7],
    body: c => `As a teenager, ${c.name} sold used cars on a gravel lot in ${c.home}. Today ${c.first} owns more than 150 dealerships across nine states, plus the finance company that writes the loans. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}; every player gets a car, and every car comes from ${c.last}.` },
  { key: 'beverage', label: 'Beer and beverage distributor', who: 'a beverage distributor', kinds: ['passionate', 'profit', 'fan'], worth: [3, 9],
    body: c => `${c.name}'s family has distributed beer since ${c.old}, all around ${c.home}. ${c.first} turned the warehouse business into one of the country's biggest beverage distributors, then bought early into an energy-drink brand that went global. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'insurance', label: 'Insurance company heir', who: 'an insurance heir', kinds: ['profit', 'passionate'], worth: [5, 14],
    body: c => `${c.name} is the third generation to run Keystone Mutual, the insurance company ${c.first}'s grandfather started in ${c.old} to cover farm equipment; it now insures millions of homes and cars. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}, the first time the family had put money into anything it couldn't model.` },
  { key: 'retailheir', label: 'Discount-store heir', who: 'a retail heir', kinds: ['passionate', 'profit'], worth: [15, 50],
    body: c => `${c.name}'s mother was one of four children of the man who built Valuemart, the discount-store chain in nearly every American town, and ${c.first} inherited a slice of the family's shares worth ${c.W}. The money has gone into sports: the ${c.team}, bought in ${c.yr} for ${c.P}, sit alongside a soccer club and a stake in a racetrack.` },
  { key: 'sportsco', label: 'Sports empire', who: 'a sports-and-entertainment investment group', kinds: ['profit'], worth: [8, 20],
    body: c => `${c.name} owns teams in four leagues, two stadiums, a regional sports network and a ticketing company, and has never been accused of letting sentiment get in the way of a deal. The ${c.team}, bought in ${c.yr} for ${c.P}, are one piece of the portfolio, valued and managed alongside the rest.` },
  { key: 'telecom', label: 'Cable and wireless', who: 'a telecom executive', kinds: ['profit', 'passionate'], worth: [8, 25],
    body: c => `${c.name} bought a struggling cable company in ${c.y1} in ${c.home}, merged it with dozens of others and ended up running Arcline, one of the country's biggest broadband and wireless providers. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}, and the games air on Arcline's own sports channel.` },
  { key: 'aviation', label: 'Aircraft leasing', who: 'an aviation investor', kinds: ['profit', 'passionate'], worth: [4, 12],
    body: c => `${c.name} started out in ${c.y1} leasing two used jets to a regional airline and built Skyward Leasing into one of the world's biggest aircraft lessors, with more than 1,000 planes flying for airlines on six continents. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'health', label: 'Hospital chain founder', who: 'a health-care founder', kinds: ['fan', 'passionate', 'profit'], worth: [4, 12],
    body: c => `${c.name}, once an emergency-room doctor, founded Bluestone Health in ${c.y1} with three clinics in ${c.home}; it now runs more than 180 hospitals. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}, and the team's medical staff is the best funded in the league.` },
  { key: 'games', label: 'Video-game studio founder', who: 'a video-game founder', kinds: ['passionate', 'fan'], worth: [4, 15],
    body: c => `${c.name} co-founded Pixelforge in a dorm room in ${c.y1}; its online shooter became one of the most played games in the world, and selling the studio to a global tech giant made ${c.first} a billionaire at thirty-four. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P} and built the most advanced analytics department in the league.` },
  { key: 'beauty', label: 'Beauty brand founder', who: 'a consumer-brands founder', kinds: ['passionate', 'fan'], worth: [3, 8],
    body: c => `${c.name} started Lumière Beauty in ${c.y1} by selling skin care on a home-shopping channel, and turned it into a global brand sold in 90 countries. ${c.first} sold half of it to a French cosmetics group for a fortune and bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'construction', label: 'Cement and construction', who: 'an industrial heir', kinds: ['profit', 'passionate'], worth: [4, 12],
    body: c => `${c.name} runs Granite & Sons, the cement and construction company ${c.first}'s great-grandfather founded in ${c.old}; it has poured the concrete for highways, dams and half the arenas in the country, the ${c.team}'s included. ${c.first} bought the team itself in ${c.yr} for ${c.P}.` },
  { key: 'grain', label: 'Grain-trading dynasty', who: 'a family investment office', kinds: ['profit'], worth: [8, 25],
    body: c => `${c.name} is the quiet head of one of the largest private companies in the world, a grain-trading and food-processing firm the family has owned since ${c.old}. The family doesn't give interviews and rarely gives numbers; the ${c.team}, bought in ${c.yr} for ${c.P}, are its only public holding.` },
  { key: 'ecommerce', label: 'E-commerce founder', who: 'a tech founder', kinds: ['passionate', 'profit', 'fan'], worth: [10, 45],
    body: c => `${c.name} started an online store out of a garage in ${c.y1}, selling discount furniture, and grew it into Shopvale, one of the biggest e-commerce companies in the country. ${c.first} owns about a sixth of it and is worth ${c.W}; the ${c.team} were bought in ${c.yr} for ${c.P}.` },
  { key: 'cyber', label: 'Cybersecurity founder', who: 'a tech founder', kinds: ['passionate', 'profit'], worth: [5, 15],
    body: c => `${c.name} spent a decade hunting hackers for the government, then founded Sentinel Logic in ${c.y1}; it now protects most of the country's biggest companies, and its stock made ${c.first} worth ${c.W}. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'film', label: 'Film producer', who: 'a film producer', kinds: ['passionate', 'fan'], worth: [2.5, 6],
    body: c => `${c.name} produced a string of blockbuster action movies, then built Westlight Studios into one of the last big independent studios in Hollywood. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P} and treats every home game like an opening night.` },
  { key: 'group', label: 'Leads a local ownership group', who: 'a local investor group', kinds: ['passionate', 'fan', 'profit'], worth: [1.5, 4], acq: 'group',
    body: c => `${c.name} leads a group of twenty-two local investors (doctors, car dealers, a former mayor and two former players) who bought the ${c.team} in ${c.yr} for ${c.P} to stop an out-of-town buyer from moving the team. ${c.first}, who made a fortune in commercial insurance, holds the biggest share and makes the calls.` },
  { key: 'oil', label: 'Oil and gas', who: 'an energy executive', kinds: ['profit', 'passionate'], worth: [5, 20],
    body: c => `${c.name} drilled a first well with borrowed equipment in West Texas in ${c.y1}, and made a fortune when fracking opened up shale fields everyone else had given up on. ${c.first} sold the company near the top of the market and bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'pharma', label: 'Generic drug maker', who: 'a pharmaceutical founder', kinds: ['profit', 'passionate'], worth: [4, 14],
    body: c => `${c.name} founded Corvel Pharmaceuticals in ${c.y1} to make cheap generic versions of drugs that had come off patent, and built it into one of the biggest generic-drug makers in the world. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'logistics', label: 'Trucking and logistics', who: 'a logistics magnate', kinds: ['profit', 'passionate'], worth: [4, 12],
    body: c => `${c.name} started with one truck in ${c.y1} in ${c.home}, and built Atlas Freight into a logistics company with 20,000 trucks, rail terminals and warehouses in every state. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P}.` },
  { key: 'minority', label: 'Longtime minority partner', who: 'a former minority partner', kinds: ['passionate', 'profit'], worth: [3, 9],
    body: c => `${c.name} bought a 5% stake in the ${c.team} in ${c.y1} with money made in commercial real estate, sat on the board for years, and bought out the controlling owner in ${c.yr} for ${c.P}. Nobody in the organization knows the franchise better, and ${c.first} has opinions about everything.` },
  { key: 'vc', label: 'Venture capitalist', who: 'a venture capitalist', kinds: ['passionate', 'fan'], worth: [3, 10],
    body: c => `${c.name} made a fortune as a venture capitalist, backing hundreds of startups and a handful of giants, and in ${c.yr} paid ${c.P} for the ${c.team}, a record price that the rest of the league laughed at. The laughing stopped: ${c.first} brought Silicon Valley thinking to a sleepy franchise, from analytics to a new arena, and the team is worth many times that today.` },
  { key: 'casino', label: 'Casino resorts', who: 'a hospitality magnate', kinds: ['passionate', 'profit'], worth: [4, 25],
    body: c => `${c.name} built Silverline Resorts from a single motel-casino in Reno into a chain of resorts on three continents. ${c.first} bought the ${c.team} in ${c.yr} for ${c.P} and runs game nights like a show on the Strip: lights, music and celebrities courtside.` },
];
const BG: Record<string, OwnerBg> = Object.fromEntries(OWNER_BGS.map(b => [b.key, b]));
const FOR_SALE = OWNER_BGS.filter(b => !b.acq || b.acq === 'bought' || b.acq === 'group');
const EXPANSION_YEARS = [1966, 1967, 1968, 1970, 1974, 1980, 1988, 1989, 1995];

// A closing line in the owner's own spirit.
const CLOSE: Record<OwnerKind, ((c: Ctx) => string)[]> = {
  fan: [c => `${c.last}'s promise: the players, the staff and the fans come first, ${c.city} gets a team it can be proud of, and the profits come last, if at all.`,
    c => `Money is not the point. Winning, and doing right by ${c.city}, is: cheap seats in every section, new courts in every neighborhood, and a payroll as high as it takes.`],
  passionate: [c => `A lifelong fan, ${c.first} sits courtside most nights, takes every loss personally and expects the same from the front office.`,
    c => `${c.last} is loud, emotional and involved: expect calls after bad losses, and a lot of opinions.`],
  profit: [c => `The team is run like everything else ${c.first} owns: turn a profit, stay out of the luxury tax, and don't give away anything of value.`,
    c => `${c.last} reads the team's books the way other owners watch film: every contract is a liability, every draft pick an asset, and every dollar over budget a problem.`],
  fund: [() => ''],
};

// Fan first, passionate or profit first, from the owner type (a hand-set kind wins).
export function kindOf(t: any, h = hash(t.owner + '|' + t.abbr)): OwnerKind {
  if (t.ownerKind) return t.ownerKind;
  const named = NAMED_OWNERS.find(n => n.owner === t.owner); if (named) return named.kind;
  return t.arch === 'Frugal Profit-Seeker' || (t.arch === 'Asset Hoarder' && h % 3 !== 0) ? 'profit' : t.arch === 'Win-Now Spender' && h % 2 === 0 ? 'fan' : 'passionate';
}

// Backgrounds for every club: hand-set or stored ones first, then the rest by a hash of the owner's
// name, never two the same. A buyer from a sale in this league gets one that fits the announcement.
function assignBgs(teams: any[]): Record<number, string> {
  const out: Record<number, string> = {}, used = new Set<string>();
  teams.forEach(t => { if (t.ownerBg && BG[t.ownerBg]) { out[t.tid] = t.ownerBg; used.add(t.ownerBg); } });
  teams.forEach(t => {
    if (out[t.tid] || NAMED_OWNERS.some(n => n.owner === t.owner)) return;
    const h = hash(t.owner + '|' + t.abbr), kind = kindOf(t, h), sale = [...(t.sales || [])].reverse().find((x: any) => x.to === t.owner);
    const base = sale ? FOR_SALE : OWNER_BGS, free = base.filter(b => !used.has(b.key));
    const fit = sale ? free.filter(b => b.who === sale.who) : [];
    const pool = fit.length ? fit : free.filter(b => b.kinds.includes(kind)).length ? free.filter(b => b.kinds.includes(kind)) : free.length ? free : base;
    const b = pool[h % pool.length]; out[t.tid] = b.key; used.add(b.key);
  });
  return out;
}
let bgCache = { k: '', m: {} as Record<number, string> };
export function bgOf(s: any, tid: number): OwnerBg | null {
  const t = s.teams[tid]; if (!t || NAMED_OWNERS.some(n => n.owner === t.owner)) return null;
  const k = s.teams.map((x: any) => x.owner + '|' + (x.ownerBg || '') + '|' + (x.ownerKind || '') + '|' + x.arch + '|' + (x.sales || []).length).join(';');
  if (bgCache.k !== k) bgCache = { k, m: assignBgs(s.teams) };
  return BG[bgCache.m[tid]] || null;
}
// Store every club's background on the team, so later sales can't reshuffle anyone else's.
export function stampOwnerBgs(teams: any[]) { const m = assignBgs(teams); return teams.map(t => (m[t.tid] && t.ownerBg !== m[t.tid] ? { ...t, ownerBg: m[t.tid] } : t)); }
// A new buyer's background: one nobody in the league has, that fits the owner's kind.
export function saleBg(s: any, tid: number, kind: OwnerKind, rnd: () => number = Math.random): OwnerBg {
  const used = new Set(s.teams.filter((t: any) => t.tid !== tid).map((t: any) => bgOf(s, t.tid)?.key).filter(Boolean));
  const free = FOR_SALE.filter(b => !used.has(b.key)), fit = free.filter(b => b.kinds.includes(kind));
  const pool = fit.length ? fit : free.length ? free : FOR_SALE;
  return pool[Math.floor(rnd() * pool.length)];
}
export const bgByKey = (k: string) => BG[k] || null;

export interface OwnerProfile { name: string; kind: OwnerKind; kindLabel: string; kindDesc: string; worth: number; worthLabel: string; year: number; price: number; priceLabel: string; bio: string; bg: string | null; bgLabel: string; acq: string; acqShort: string }
const NAMED_LABEL: Record<string, string> = { mac: 'Boxing champion turned media investor', mao: 'Renewable energy', jush: 'Political connections', fund: 'Public pension fund' };
const short = (m: number) => (m >= 1000 ? '$' + (m / 1000).toFixed(1).replace(/\.0$/, '') + 'B' : '$' + Math.round(m) + 'M');

export function ownerProfile(g: Game, s: any, tid: number): OwnerProfile {
  const t = s.teams[tid], name = t.owner, h = hash(name + '|' + t.abbr), team = t.region + ' ' + t.name, first = name.split(' ')[0], last = name.split(' ').slice(-1)[0];
  const named = NAMED_OWNERS.find(n => n.owner === name), kind = kindOf(t, h), bg = named ? null : bgOf(s, tid);
  // When and how: a sale in this league, or a story from before it began. Franchise values grew
  // about 17% a year since 2008 and about 10% a year before that.
  const sale = [...(t.sales || [])].reverse().find((x: any) => x.to === name);
  const acq: Acq = sale ? 'bought' : bg?.acq || 'bought';
  const famYr = acq === 'founding' ? pickH(EXPANSION_YEARS, h, 5) : 1972 + (h % 22), inhYr = acq === 'founding' ? famYr + 6 + (h % 9) : 2005 + ((h >>> 4) % 15);
  const priceAt = (y: number) => Math.max(5, Math.round(teamValue(g, s, tid) * Math.pow(1.17, Math.min(0, Math.max(y, 2008) - g.Y)) * Math.pow(1.1, Math.min(0, y - 2008)) / 5) * 5);
  const year = t.ownerYear ?? (sale ? sale.season - 1 : acq === 'inherited' ? inhYr : acq === 'founding' ? famYr : bg?.key === 'ai' || bg?.key === 'vc' ? 2010 + (h % 12) : 2008 + (h % 16));
  const famPrice = priceAt(famYr), price = t.ownerPrice ?? (sale ? sale.price : acq === 'inherited' || acq === 'founding' ? famPrice : priceAt(year));
  const genWorth = named ? named.worth : bg ? +(bg.worth[0] + (bg.worth[1] - bg.worth[0]) * (((h >>> 9) % 1000) / 1000)).toFixed(1) : kind === 'fan' ? 40 + (h % 70) : kind === 'profit' ? 8 + (h % 30) : 4 + (h % 14) + (price / 1000) * 0.8;
  const worth = t.ownerWorth ?? genWorth;
  const P = money(price), yr = String(year);
  const home = pickH(HOMES[ROOTS[last] || 'anglo'], h, 7); // where someone with his name plausibly grew up
  const c: Ctx = { name, first, last, home, team, city: t.region, yr: year, P, W: '$' + bil(worth) + ' billion', y1: bg?.key === 'minority' ? year - 6 - (h % 9) : Math.max(1962, year - 12 - ((h >>> 6) % 22)), old: 1905 + ((h >>> 3) % 40), famYr, famP: money(famPrice), inhYr };
  let bio = '';
  if (named?.key === 'mac') bio = `${name} made his first fortune with his fists, in a legendary boxing career that took him from nothing to world titles in eight weight classes. When he hung up the gloves he turned to business, investing across industries and continents and building a vast portfolio. His best bet by far was MADtv: by 2026 it had grown into a global entertainment powerhouse behind almost every major show and film in the world, and it made him about $5 billion on its own. Today he's worth an estimated ${bil(worth)} billion. A basketball fanatic his whole life, Macquiao finally lived out his dream in ${yr}, buying the ${team} for ${P}. He's back in professional sports, not as a fighter but as an owner, and he wants a show: a full arena and a star to sell it.`;
  else if (named?.key === 'mao') bio = `${name} grew up in Nanping, China, in a family that struggled to make ends meet: his father worked as a laborer and his mother as a maid, and neither had much chance at an education. Mao fell in love with basketball early, but at 6′0″ and with his family counting every coin, he chose college over chasing the game. He went on to build a ${bil(worth)} billion fortune in renewable energy, becoming one of the most successful entrepreneurs in the world, and he has put billions back into the community that raised him. The love of the game never left. When he bought the ${team} for ${P} in ${yr}, he promised more than a profitable franchise: he pledged to invest in the city, look after his employees and players, listen to the fans, and build a place where people come before profits and everyone is proud to wear the jersey.`;
  else if (named?.key === 'jush') bio = `${name} leveraged his connection to his father-in-law’s presidency to gain access to powerful political and financial circles. Using his influence and privileged knowledge, he profited from wars, famine and the destruction of communities, amassing a ${bil(worth)} billion fortune at the expense of others. In ${yr} he bought the ${team} for ${P}, not out of any love for basketball but as another investment vehicle to expand his empire. To him the franchise is a financial asset, not a community institution.`;
  else if (named?.key === 'fund') bio = `The ${name} manages the retirement savings of nine million teachers, nurses, firefighters and bus drivers, about ${bil(worth)} billion in all, spread across airports, pipelines, office towers and, since ${yr}, the ${team}, which it bought for ${P} as a long-term, low-risk holding. There's no owner in a courtside seat: a board of trustees and a team of analysts decide, by committee, and they answer to the pensioners. That makes it the most patient owner in the league and the most careful. It will not trade away the future for a quick fix; draft picks and young players are assets to be protected, and every big decision needs a model to back it up.`;
  if (!bio && bg) bio = (bg.body(c) + ' ' + pickH(CLOSE[kind] || CLOSE.passionate, h, 11)(c)).trim();
  if (t.ownerBio) bio = t.ownerBio; // written in God Mode
  const forced = sale?.forced ? ' (God Mode sale)' : '';
  const acqTxt = t.ownerYear != null || t.ownerPrice != null || acq === 'bought' || acq === 'group' ? 'bought the team in ' + year + ' for ' + P + forced
    : acq === 'inherited' ? 'inherited the team in ' + year + ' (the family bought it in ' + famYr + ' for ' + money(famPrice) + ')' : 'a founding partner since ' + famYr + ', in control since ' + inhYr;
  const acqShort = acqTxt.startsWith('bought') ? year + ' · ' + short(price) : acq === 'inherited' ? 'Inherited ' + year : 'Founder, ' + famYr;
  return { name, kind, kindLabel: KIND_LABEL[kind], kindDesc: KIND_DESC[kind], worth, worthLabel: kind === 'fund' ? '$' + bil(worth) + 'B under management' : '$' + bil(worth) + 'B net worth', year, price, priceLabel: P, bio,
    bg: bg?.key || null, bgLabel: named ? NAMED_LABEL[named.key] || '' : bg?.label || '', acq: acqTxt, acqShort };
}
