// Who the owners are: how they made the money to buy a team, what they're worth, when they
// bought in and for how much, written to fit their personality (the owner type that sets their
// demands). Most bios are generated from the team and the owner's name, so they never change;
// four owners are written by hand, and one of them isn't a person at all.
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

export interface OwnerProfile { name: string; kind: OwnerKind; kindLabel: string; kindDesc: string; worth: number; worthLabel: string; year: number; price: number; priceLabel: string; bio: string }

export function ownerProfile(g: Game, s: any, tid: number): OwnerProfile {
  const t = s.teams[tid], name = t.owner, h = hash(name + '|' + t.abbr), team = t.region + ' ' + t.name, first = name.split(' ')[0], last = name.split(' ').slice(-1)[0];
  const named = NAMED_OWNERS.find(n => n.owner === name);
  const kind: OwnerKind = named ? named.kind : t.arch === 'Frugal Profit-Seeker' || (t.arch === 'Asset Hoarder' && h % 3 !== 0) ? 'profit' : t.arch === 'Win-Now Spender' && h % 2 === 0 ? 'fan' : 'passionate';
  // When and for how much: a sale in this league, or a purchase before it began (values grow ~17% a year).
  const sale = [...(t.sales || [])].reverse().find((x: any) => x.to === name);
  const year = sale ? sale.season - 1 : 2008 + (h % 16), price = sale ? sale.price : Math.round(teamValue(g, s, tid) * Math.pow(1.17, year - g.Y) / 10) * 10;
  const worth = named ? named.worth : kind === 'fan' ? 40 + (h % 70) : kind === 'profit' ? 8 + (h % 30) : 4 + (h % 14) + (price / 1000) * 0.8;
  const P = money(price), yr = String(year);
  const src = pickH(['renewable energy', 'cloud software', 'logistics and shipping', 'semiconductors', 'a chain of grocery stores', 'commercial real estate', 'medical devices', 'a streaming platform', 'private credit', 'consumer electronics', 'pharmaceuticals', 'a trucking empire'], h, 3);
  const home = pickH(['a small town in Ohio', 'Queens, New York', 'Monterrey, Mexico', 'rural Georgia', 'Lagos, Nigeria', 'the outskirts of Manila', 'Detroit', 'a farm in Iowa', 'São Paulo', 'East Oakland', 'Busan, South Korea', 'Warsaw'], h, 7);
  let bio = '';
  if (named?.key === 'mac') bio = `${name} made his first fortune with his fists, in a legendary boxing career that took him from nothing to world titles in eight weight classes. When he hung up the gloves he turned to business, investing across industries and continents and building a vast portfolio. His best bet by far was MADtv: by 2026 it had grown into a global entertainment powerhouse behind almost every major show and film in the world, and it made him about $5 billion on its own. Today he's worth an estimated $${bil(worth)} billion. A basketball fanatic his whole life, Macquiao finally lived out his dream in ${yr}, buying the ${team} for ${P}. He's back in professional sports, not as a fighter but as an owner, and he wants a show: a full arena and a star to sell it.`;
  else if (named?.key === 'mao') bio = `${name} grew up in Nanping, China, in a family that struggled to make ends meet: his father worked as a laborer and his mother as a maid, and neither had much chance at an education. Mao fell in love with basketball early, but at 6′0″ and with his family counting every coin, he chose college over chasing the game. He went on to build a $${bil(worth)} billion fortune in renewable energy, becoming one of the most successful entrepreneurs in the world, and he has put billions back into the community that raised him. The love of the game never left. When he bought the ${team} for ${P} in ${yr}, he promised more than a profitable franchise: he pledged to invest in the city, look after his employees and players, listen to the fans, and build a place where people come before profits and everyone is proud to wear the jersey.`;
  else if (named?.key === 'jush') bio = `${name} leveraged his connection to his father-in-law’s presidency to gain access to powerful political and financial circles. Using his influence and privileged knowledge, he profited from wars, famine and the destruction of communities, amassing a $${bil(worth)} billion fortune at the expense of others. In ${yr} he bought the ${team} for ${P}, not out of any love for basketball but as another investment vehicle to expand his empire. To him the franchise is a financial asset, not a community institution.`;
  else if (named?.key === 'fund') bio = `The ${name} manages the retirement savings of nine million teachers, nurses, firefighters and bus drivers, about $${bil(worth)} billion in all, spread across airports, pipelines, office towers and, since ${yr}, the ${team}, which it bought for ${P} as a long-term, low-risk holding. There's no owner in a courtside seat: a board of trustees and a team of analysts decide, by committee, and they answer to the pensioners. That makes it the most patient owner in the league and the most careful. It will not trade away the future for a quick fix; draft picks and young players are assets to be protected, and every big decision needs a model to back it up.`;
  else if (kind === 'fan') bio = pickH([
    `${name} grew up in ${home}, the child of parents who worked two jobs each, and learned the game on a cracked outdoor court. College, not basketball, was the way out: ${first} went on to build a $${bil(worth)} billion fortune in ${src}, and has quietly given much of it back. Buying the ${team} in ${yr} for ${P} was a childhood dream come true. ${last}'s promise: the players, the staff and the fans come first, the city gets a team it can be proud of, and the profits come last, if at all.`,
    `${name} is one of the richest people on the planet, worth about $${bil(worth)} billion from ${src}, and one of the most devoted fans in the league. ${first} bought the ${team} in ${yr} for ${P} and runs them like a public trust: cheap seats in every section, new courts in every neighborhood, and a payroll as high as it takes to win. Money is not the point; winning, and doing right by the city, is.`,
  ], h, 11);
  else if (kind === 'passionate') bio = pickH([
    `${name} came from ${home} and made a fortune, about $${bil(worth)} billion, in ${src}. That is a lot of money, but not a lot by the standards of this league, and buying the ${team} in ${yr} for ${P} took most of it. ${first} did it anyway: a lifelong fan, ${last} sits courtside most nights, takes every loss personally and expects the same from the front office.`,
    `${name} built ${src} into a $${bil(worth)} billion fortune the hard way, and never stopped being a fan. When the ${team} came up for sale in ${yr}, ${first} stretched to pay ${P} and hasn't looked back. ${last} is loud, emotional and involved: expect calls after bad losses, and a lot of opinions.`,
  ], h, 13);
  else bio = pickH([
    `${name} made about $${bil(worth)} billion in ${src} by buying businesses cheap, cutting costs and selling them high. The ${team} (bought in ${yr} for ${P}) is run the same way: a trophy asset whose value keeps climbing whether or not it wins. ${first} rarely goes to games. The numbers matter: turn a profit, stay out of the luxury tax, and don't give away anything of value.`,
    `${name} is a financier, worth about $${bil(worth)} billion from ${src}, who bought the ${team} in ${yr} for ${P} because NBA franchises have been one of the best investments in the world. Basketball is secondary. ${last} reads the team's books the way other owners watch film: every contract is a liability, every draft pick an asset, and every dollar over budget a problem.`,
  ], h, 17);
  return { name, kind, kindLabel: KIND_LABEL[kind], kindDesc: KIND_DESC[kind], worth, worthLabel: kind === 'fund' ? '$' + bil(worth) + 'B under management' : '$' + bil(worth) + 'B net worth', year, price, priceLabel: P, bio };
}
