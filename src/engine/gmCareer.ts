// You, the GM: who you are (name, nationality, experience, headshot) and your contract.
// Experience sets your starting reputation, which is what owners pay for. What they
// actually offer depends on who they are: a frugal owner won't hand out a big deal even
// to a great GM, a win-now spender will pay whatever it takes to keep one. Extensions
// come from the owner when he's happy with you; ask when he isn't and he'll say no.
import type { Game } from './Game';
import { ownerReview, reputation } from './frontOffice';

export interface Experience { k: number; label: string; desc: string; rep: number; years: number; age: number }
export const EXPERIENCE: Experience[] = [
  { k: 0, label: 'No experience', desc: 'Your first job in a front office. Owners take a chance on you, on a short, cheap deal.', rep: 30, years: 2, age: 33 },
  { k: 1, label: 'Some experience', desc: 'A few years as an assistant GM or head of scouting.', rep: 40, years: 3, age: 38 },
  { k: 2, label: 'Experienced', desc: 'You’ve run a front office before, with mixed results.', rep: 52, years: 3, age: 45 },
  { k: 3, label: 'Veteran', desc: 'A long career with several playoff teams. Owners trust you.', rep: 64, years: 4, age: 51 },
  { k: 4, label: 'Proven winner', desc: 'You’ve built a champion. Owners call you first.', rep: 76, years: 4, age: 56 },
  { k: 5, label: 'Legendary executive', desc: 'A Hall of Fame résumé, the Jerry West / R.C. Buford tier. Every owner wants you, and pays like it.', rep: 88, years: 5, age: 62 },
];
export const RACES: [string, string][] = [['black', 'Black'], ['white', 'White'], ['asian', 'East Asian'], ['brown', 'Hispanic / Latino, Middle Eastern or South Asian']];

// How each kind of owner pays a GM.
export const GENEROSITY: Record<string, { mult: number; cap: number | null; raise: number; yrs: number; note: string }> = {
  'Win-Now Spender': { mult: 1.35, cap: null, raise: 1.6, yrs: 1, note: 'pays top dollar to keep a winner' },
  'Frugal Profit-Seeker': { mult: 0.7, cap: 4.5, raise: 1.1, yrs: -1, note: 'keeps GM pay low however well you do' },
  'Asset Hoarder': { mult: 0.95, cap: null, raise: 1.3, yrs: 1, note: 'prefers long, steady deals' },
  'Hype Focus': { mult: 1.15, cap: null, raise: 1.4, yrs: 0, note: 'pays for results people can see' },
  'Meddling Micromanager': { mult: 1.0, cap: null, raise: 1.25, yrs: -1, note: 'likes short leashes' },
};
const gen = (arch: string) => GENEROSITY[arch] || GENEROSITY['Meddling Micromanager'];
const r2 = (x: number) => Math.round(x * 100) / 100;

// Market salary ($M a year) for a GM with this reputation, from this owner, at this happiness.
export function gmSalary(rep: number, arch: string, happy = 60) {
  const G = gen(arch), v = (0.8 + Math.pow(rep / 30, 2)) * G.mult * (0.85 + happy / 400);
  return r2(G.cap != null ? Math.min(G.cap, v) : v);
}
export const expOf = (s: any) => EXPERIENCE[s.gm?.exp ?? 2];

// The contract you start a league with.
export function startingContract(g: Game, s: any, tid: number, exp: number) {
  const E = EXPERIENCE[exp] ?? EXPERIENCE[2], arch = s.teams[tid].arch, years = Math.max(2, E.years + Math.min(0, gen(arch).yrs));
  return { tid, years, salary: gmSalary(E.rep, arch), from: g.Y, thru: g.Y + years - 1 };
}
export function contractOf(g: Game, s: any) {
  const c = s.career?.contract;
  if (c && c.thru != null && s.teams[c.tid] && g.isUser(s, c.tid)) return c;
  if (c && c.years && c.from != null && s.teams[c.tid] && g.isUser(s, c.tid)) return { ...c, thru: c.from + c.years - 1 };
  return { ...startingContract(g, s, s.me, s.gm?.exp ?? 2), from: g.Y - 1, thru: g.Y + 1, assumed: true };
}

export interface GMOffer { tid: number; years: number; salary: number; kind: 'expiring' | 'early'; season: number; quote: string; base?: { years: number; salary: number }; counters?: number; final?: boolean; reply?: string }

// What the owner does about your contract at season's end (deterministic, so the letter and
// the review agree): offer an extension, or let it run out.
export function contractDecision(g: Game, s: any, tid: number): { offer: GMOffer | null; expiring: boolean; left: number; text: string } {
  const c = contractOf(g, s), T = s.teams[tid], arch = T.arch, G = gen(arch), Y = g.Y;
  if (c.tid !== tid) return { offer: null, expiring: false, left: 0, text: '' };
  const left = c.thru - Y, sec = ownerReview(g, s, tid).sec, rep = reputation(s), safe = s.ownerFiring === false || s.god || s.easy?.fire;
  const make = (kind: GMOffer['kind']): GMOffer => {
    const yrs = Math.max(1, Math.min(5, (sec >= 85 ? 4 : sec >= 65 ? 3 : 2) + G.yrs));
    let sal = gmSalary(rep, arch, sec);
    sal = Math.min(sal, r2(c.salary * G.raise)); // how far each owner will go past what you make now
    if (G.cap != null) sal = Math.min(sal, G.cap);
    if (sec < 55) sal = Math.min(sal, c.salary);
    sal = Math.max(sal, r2(c.salary * (sec < 55 ? 0.9 : 1)));
    const big = sal >= c.salary * 1.25, q = arch === 'Frugal Profit-Seeker' ? (sec >= 70 ? 'You’ve done good work, and I want you back. But I don’t pay front-office salaries like a big market does. This is my number.' : 'I’ll keep you, on terms that make sense for my books.')
      : arch === 'Win-Now Spender' && big ? 'You win, I pay. Simple as that. Here’s a deal that says how much I want you here.'
      : sec >= 80 ? 'I want you running this team for a long time. Let’s get it done now.' : 'I’d like you to stay. Here’s what I can offer.';
    return { tid, years: yrs, salary: r2(sal), kind, season: Y, quote: q };
  };
  if (left <= 0) {
    if (sec >= 45 || safe) { const o = make('expiring'); return { offer: o, expiring: true, left, text: 'Your contract is up. I’m offering you ' + o.years + ' more year' + (o.years === 1 ? '' : 's') + ' at $' + o.salary.toFixed(2) + 'M a season. ' + o.quote }; }
    return { offer: null, expiring: true, left, text: 'Your contract is up, and I won’t be renewing it. I’ll be looking for a new GM.' };
  }
  if (left === 1 && sec >= 70) { const o = make('early'); return { offer: o, expiring: false, left, text: 'You have one year left, and I don’t want to let it get that close. I’m offering an extension: ' + o.years + ' more year' + (o.years === 1 ? '' : 's') + ' at $' + o.salary.toFixed(2) + 'M a season.' }; }
  return { offer: null, expiring: false, left, text: 'Your contract runs through the ' + (c.thru - 1) + '–' + String(c.thru).slice(2) + ' season (' + left + ' more season' + (left === 1 ? '' : 's') + ').' };
}

// You ask for an extension (once a season).
export function askExtension(g: Game) {
  g.setState(s => {
    if (s.gmAsk === g.Y || s.gmOffer) return null;
    const c = contractOf(g, s), tid = c.tid, T = s.teams[tid], sec = ownerReview(g, s, tid).sec, left = c.thru - g.Y, arch = T.arch;
    let reply: string, offer: GMOffer | null = null;
    if (left >= 3) reply = 'You have ' + left + ' seasons left. We’ll talk when it’s closer.';
    else if (sec < 60) reply = arch === 'Meddling Micromanager' ? 'An extension? Win me some games first, then we’ll talk.' : 'Not now. Show me more this season and ask me again.';
    else { const d = contractDecision(g, { ...s, career: { ...(s.career || {}), contract: { ...c, thru: g.Y } } }, tid); offer = d.offer && { ...d.offer, kind: 'early' }; reply = offer ? offer.quote : 'Not now.'; }
    return { gmAsk: g.Y, gmOffer: offer, news: [{ day: s.day, season: g.Y, kind: 'review', tid, who: T.owner, role: 'Owner, ' + T.abbr, quote: reply }, ...(s.news || [])], gmReply: reply };
  });
}

// Accept or turn down the owner's offer.
export function answerOffer(g: Game, yes: boolean) {
  g.setState(s => {
    const o: GMOffer = s.gmOffer; if (!o) return null;
    const c = contractOf(g, s), T = s.teams[o.tid];
    if (yes) {
      const start = o.kind === 'expiring' ? g.Y + 1 : c.thru + 1;
      const contract = { tid: o.tid, years: o.years, salary: o.salary, from: start, thru: start + o.years - 1, signed: g.Y };
      return { gmOffer: null, career: { ...(s.career || {}), contract }, lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: 'You signed a ' + o.years + '-year extension with the ' + T.region + ' ' + T.name + ' ($' + o.salary.toFixed(2) + 'M a season, through ' + (contract.thru - 1) + '–' + String(contract.thru).slice(2) + ')' }, ...s.lgLog] };
    }
    if (o.kind === 'early') return { gmOffer: null, lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: 'You turned down an extension from ' + T.owner }, ...s.lgLog] };
    // Walking away from an expiring deal: you're on the market.
    return { gmOffer: null, unemployed: s.managed.length <= 1 ? true : s.unemployed, walkedFrom: o.tid, screen: 'career', lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: 'You turned down ' + T.owner + '’s offer and will leave the ' + T.region + ' ' + T.name }, ...s.lgLog] };
  });
}

// ── Negotiating: counter the owner's offer with the years and pay you want ────────────
// How far he'll go past his opening offer: happier owners (job security) and a bigger
// reputation buy more; each kind of owner bends differently (a win-now spender pays, a frugal
// one barely moves and keeps his cap, an asset hoarder likes long deals, a micromanager short ones).
export function ownerLimits(g: Game, s: any, o: GMOffer) {
  const T = s.teams[o.tid], arch = T.arch, G = gen(arch), sec = ownerReview(g, s, o.tid).sec, rep = reputation(s), b = o.base || { years: o.years, salary: o.salary };
  const lean = arch === 'Asset Hoarder' ? 1 : arch === 'Meddling Micromanager' || arch === 'Frugal Profit-Seeker' ? -1 : 0;
  const maxYears = Math.max(b.years, Math.min(5, b.years + (sec >= 80 ? 2 : sec >= 60 ? 1 : 0) + (rep >= 70 ? 1 : 0) + lean));
  const room = sec < 50 ? 0 : Math.min(0.4, Math.max(0, (sec - 45) / 250 + (rep - 50) / 300) * (G.raise - 1) / 0.3);
  // Past his opening length he wants a little off the yearly pay (not an asset hoarder, who wants the long deal).
  const maxSal = (years: number) => { let v = b.salary * (1 + room) * (years > b.years && arch !== 'Asset Hoarder' ? 1 - 0.03 * (years - b.years) : 1); if (G.cap != null) v = Math.min(v, Math.max(G.cap, b.salary)); return r2(Math.max(v, years <= b.years ? b.salary : 0)); };
  return { maxYears, maxSal, sec, rep, room };
}
export const MAX_COUNTERS = 2;

// Your counter-offer. Inside his limits he signs it on the spot; otherwise he comes back with his
// best (or, if you ask for far too much, only part of the way). After two counters his offer is
// final, and an early extension can be pulled off the table if you keep overreaching.
export function counterOffer(g: Game, years: number, salary: number) {
  g.setState(s => {
    const o: GMOffer = s.gmOffer; if (!o || o.final) return null;
    years = Math.max(1, Math.min(5, Math.round(years))); salary = r2(Math.max(0.1, salary));
    const T = s.teams[o.tid], arch = T.arch, L = ownerLimits(g, s, o), b = o.base || { years: o.years, salary: o.salary };
    const deal = (y: number, sal: number) => { const c = contractOf(g, s), start = o.kind === 'expiring' ? g.Y + 1 : c.thru + 1, contract = { tid: o.tid, years: y, salary: sal, from: start, thru: start + y - 1, signed: g.Y };
      return { gmOffer: null, gmNegot: { season: g.Y, text: T.owner + ' agreed: ' + y + ' year' + (y === 1 ? '' : 's') + ' at $' + sal.toFixed(2) + 'M a season. “Deal. Now let’s get back to work.”' }, career: { ...(s.career || {}), contract }, lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: 'You negotiated a ' + y + '-year ' + (o.kind === 'expiring' ? 'deal' : 'extension') + ' with the ' + T.region + ' ' + T.name + ' ($' + sal.toFixed(2) + 'M a season, through ' + (contract.thru - 1) + '–' + String(contract.thru).slice(2) + ')' }, ...s.lgLog] }; };
    if (s.god || (years <= L.maxYears && salary <= L.maxSal(years) + 0.005)) return deal(years, salary); // God Mode: your terms, signed
    const n = (o.counters || 0) + 1, cap = L.maxSal(Math.min(years, L.maxYears)), greedy = salary > cap * 1.3 || years > L.maxYears + 2;
    // Overreach twice on an extension he didn't have to offer, and he walks away from the table.
    if (greedy && n >= MAX_COUNTERS && o.kind === 'early') return { gmOffer: null, gmNegot: { season: g.Y, text: T.owner + ' pulled the offer: “Forget it. You’re under contract; we’ll revisit this another time.”' }, lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: T.owner + ' pulled his extension offer after your counter' }, ...s.lgLog] };
    const y2 = Math.min(years, L.maxYears), sal2 = greedy ? r2(b.salary + (L.maxSal(y2) - b.salary) / 2) : Math.min(salary, L.maxSal(y2)), final = n >= MAX_COUNTERS;
    const why = years > L.maxYears && salary > L.maxSal(y2) ? 'That’s too long and too much.' : years > L.maxYears ? (y2 === 1 ? 'One year is as far as I go.' : y2 + ' years is as long as I’ll go.') : 'I can’t pay that.';
    const tone = greedy ? (arch === 'Frugal Profit-Seeker' ? 'You know how I run this club. ' : 'Let’s be serious. ') : '';
    const moved = sal2 < salary, reply = tone + why + ' ' + (!moved ? 'Your number works for me, over ' + y2 + ' year' + (y2 === 1 ? '' : 's') + '.' : L.room === 0 && sal2 <= b.salary ? 'The money doesn’t move until the results do.' : arch === 'Win-Now Spender' && !greedy ? 'But I pay winners, so here’s my best.' : 'Here’s where I can be.') + (final ? ' That’s my final offer.' : '');
    return { gmOffer: { ...o, base: b, years: y2, salary: sal2, counters: n, final, reply, quote: reply }, news: [{ day: s.day, season: g.Y, kind: 'review', tid: o.tid, who: T.owner, role: 'Owner, ' + T.abbr, quote: reply }, ...(s.news || [])] };
  });
}

// Finishing the "Create your GM" step at the start of a league.
export interface GMProfile { name: string; nat: string; exp: number; race: string; seed: number; img?: string; familyFirst?: boolean }
// Countries whose names are written family name first (Nguyễn Văn Hùng, Wang Xiaoming, Kim Min-jun, Nagy László).
export const FAMILY_FIRST_NATS = ['VN', 'CN', 'TW', 'HK', 'MO', 'KR', 'KP', 'KH', 'HU', 'MN'];
export const isFamilyFirst = (gm: Partial<GMProfile> | null | undefined) => gm?.familyFirst ?? FAMILY_FIRST_NATS.includes(gm?.nat || '');
// What people call you: the given name. Vietnamese go by the last word (Hùng), others by
// everything after the family name.
export function givenName(gm: Partial<GMProfile> | null | undefined) {
  const parts = String(gm?.name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'GM';
  if (!isFamilyFirst(gm) || parts.length === 1) return parts[0];
  return gm?.nat === 'VN' ? parts[parts.length - 1] : parts.slice(1).join(' ');
}
export function finishGMSetup(g: Game, gm: GMProfile) {
  g.setState(s => {
    const E = EXPERIENCE[gm.exp] ?? EXPERIENCE[2];
    return { gm, gmSetup: false, career: { ...(s.career || { seasons: [] }), repBase: E.rep, contract: startingContract(g, s, s.me, gm.exp) } };
  });
}
// Your headshot: the same face generator as the players, aged by experience.
export const gmFaceInput = (gm: GMProfile) => ({ id: 900000 + (gm.seed % 90000), race: gm.race, age: (EXPERIENCE[gm.exp] ?? EXPERIENCE[2]).age });
