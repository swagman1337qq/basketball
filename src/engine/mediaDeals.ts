// Local TV and sponsorship deals (2026-10-26). Every club has a multi-year local TV deal (a regional sports
// network, free over-the-air TV or its own streaming service) and a lead sponsor (the name on the jersey patch
// and the biggest partners). Each deal pays a fee that rises a fixed amount every season (3–5%) until it ends;
// then the club renews, takes a cut, or signs with someone new. The new fee follows the club's market
// (data/cityRevenue.ts, the real 2024-25 figures), the salary cap at the time, how the club has been doing and
// how much local TV and sponsors are paying league-wide (db.tvMkt, db.spMkt: they drift, and local TV can
// crash, as when the regional cable networks collapsed). All partner names are made up.
import type { Game } from './Game';
import { fmtMoney } from './capModel';
import { cityRev } from '../data/cityRevenue';

export interface Deal { name: string; kind?: 'rsn' | 'ota' | 'stream'; fee: number; raise: number; from: number; to: number }

const NETS = ['Pinnacle Sports Network', 'Crestline Sports', 'Summit Sports Net', 'Harborview Sports', 'Keystone Sports Network', 'Lakeshore Sports', 'Frontier Sports Network', 'Meridian Sports', 'Northstar Sports', 'Canyon Sports Network', 'Bayline Sports', 'Prairie Sports Net', 'Ridgeway Sports', 'Gateway Sports Network'];
const OTA = ['Channel 7', 'Channel 11', 'Channel 4', 'Channel 9', 'Channel 13', 'Channel 2', 'Channel 5', 'Channel 8'];
export const SPONSORS = ['Northwind Bank', 'Halcyon Air', 'Brightpath Mobile', 'Verdant Energy', 'Copperline Insurance', 'Kestrel Motors', 'Alder Health', 'Bluewave Cloud', 'Summit Credit Union', 'Ironleaf Coffee',
  'Polaris Freight', 'Juniper Pay', 'Meridian Hotels', 'Saltmarsh Brewing', 'Cobalt Fiber', 'Ember Grill', 'Redcliff Rail', 'Tidewater Cruises', 'Quartzline Software', 'Orchard Grocers', 'Lumen Solar',
  'Vantage Wireless', 'Granite Tire', 'Sparrow Sportswear', 'Harbor Light Bank', 'Peregrine Airlines', 'Foxglove Cosmetics', 'Atlas Home Goods', 'Driftwood Rideshare', 'Silverpine Realty',
  'Clearwater Bottling', 'Monarch Pizza', 'Topaz Streaming', 'Blackrock Trucks', 'Willow Telecom', 'Crescent Casinos', 'Nimbus Robotics', 'Marigold Foods', 'Starling Payments', 'Thunderbird Gas'];
// Clubs that moved to free over-the-air TV in real life (their local TV numbers are lower).
const OTA_CITIES = new Set(['Phoenix', 'Portland', 'Dallas', 'Salt Lake', 'New Orleans']);

const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const pick = <T,>(a: T[], r: () => number) => a[Math.floor(r() * a.length)];
const lfOf = (g: Game) => g.CAP / 165;
const tvName = (T: any, kind: string, r: () => number) => (kind === 'ota' ? pick(OTA, r) : kind === 'stream' ? T.name + '+' : pick(NETS, r));
const KIND_LABEL: Record<string, string> = { rsn: 'regional sports network', ota: 'free over-the-air TV', stream: 'the club’s own streaming' };
const usedSponsors = (teams: any[]) => new Set(teams.map(t => t.spon?.name).filter(Boolean));

// Every club without deals gets them (new leagues, older saves, expansion clubs), part-way through.
export function ensureDeals(g: Game, teams: any[], r: () => number = Math.random) {
  const Y = g.Y, lf = lfOf(g); let changed = false;
  teams.forEach(T => {
    if (T.tv && T.spon) return; changed = true;
    const [lm, sp] = cityRev(T.region, T.mkt);
    if (!T.tv) { const kind = OTA_CITIES.has(T.region) ? 'ota' : r() < 0.08 ? 'stream' : 'rsn', len = T.region === 'Los Angeles' ? 20 : 4 + Math.floor(r() * 9), done = Math.floor(r() * len);
      T.tv = { name: tvName(T, kind, r), kind, fee: +((T.lmRev ?? lm) * lf).toFixed(1), raise: +(0.03 + r() * 0.02).toFixed(3), from: Y - done, to: Y - done + len - 1 } as Deal; }
    if (!T.spon) { const used = usedSponsors(teams), free = SPONSORS.filter(n => !used.has(n)), len = 2 + Math.floor(r() * 5), done = Math.floor(r() * len);
      T.spon = { name: free.length ? pick(free, r) : pick(SPONSORS, r), fee: +((T.spRev ?? sp) * lf).toFixed(1), raise: +(0.03 + r() * 0.02).toFixed(3), from: Y - done, to: Y - done + len - 1 } as Deal; }
  });
  return changed;
}

// The league's mood for local TV and sponsorship money, once a year: a slow drift around normal; local TV
// can crash (about one season in 25, a quarter off) and climbs back over the years after.
function stepMarkets(g: Game) {
  const d: any = g.db, n = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
  d.tvMkt = cl((d.tvMkt ?? 1) * Math.exp(0.05 * n()) * (Math.random() < 0.04 ? 0.75 : 1) + 0.1 * (1 - (d.tvMkt ?? 1)), 0.5, 1.5);
  d.spMkt = cl((d.spMkt ?? 1) * Math.exp(0.035 * n()) + 0.1 * (1 - (d.spMkt ?? 1)), 0.7, 1.4);
}

const lbl = (y: number) => (y - 1) + '–' + String(y).slice(2);
// A new league year (Game.startFA): every deal still running gets its raise; deals that ran out are renewed or
// replaced. Returns the clubs and one Mailbox note listing every change (yours first), or none.
export function dealsYearTurn(g: Game, s: any, Y: number): { teams: any[]; notice?: any } {
  stepMarkets(g);
  const lf = lfOf(g), d: any = g.db, teams = s.teams.map((t: any) => ({ ...t, tv: t.tv ? { ...t.tv } : t.tv, spon: t.spon ? { ...t.spon } : t.spon }));
  ensureDeals(g, teams);
  const mine: string[] = [], rest: string[] = [];
  const say = (T: any, line: string) => (g.isUser(s, T.tid) ? mine : rest).push(line);
  teams.forEach((T: any) => {
    const wp = T.w + T.l > 0 ? T.w / (T.w + T.l) : 0.5, [lm, sp] = cityRev(T.region, T.mkt), club = T.region + ' ' + T.name;
    // Local TV
    if (Y <= T.tv.to) T.tv.fee = +(T.tv.fee * (1 + T.tv.raise)).toFixed(1);
    else {
      const old = T.tv, len = 3 + Math.floor(Math.random() * 8), target = lm * lf * (d.tvMkt ?? 1) * (0.85 + 0.3 * wp) * (0.9 + Math.random() * 0.2);
      // A big drop in what a regional network will pay sends some clubs to free TV or their own streaming.
      let kind = old.kind || 'rsn', fee = target;
      if (kind === 'rsn' && target < old.fee * 0.8 && Math.random() < 0.5) { kind = Math.random() < 0.7 ? 'ota' : 'stream'; fee = target * 0.9; }
      const same = kind === old.kind && Math.random() < 0.65, name = same ? old.name : tvName(T, kind, Math.random);
      T.tv = { name, kind, fee: +fee.toFixed(1), raise: +(0.03 + Math.random() * 0.02).toFixed(3), from: Y, to: Y + len - 1 };
      const ch = fee / old.fee - 1, how = kind !== old.kind ? (kind === 'ota' ? 'moves to free over-the-air TV with ' : 'launches its own streaming service, ') + name : same ? 'renews with ' + name : 'signs with ' + name + ' (leaving ' + old.name + ')';
      say(T, club + ' ' + how + ': ' + fmtMoney(fee) + ' a year (' + (ch >= 0 ? 'up ' : 'down ') + Math.round(Math.abs(ch) * 100) + '%), ' + Math.round(T.tv.raise * 100) + '% raises, through ' + lbl(T.tv.to) + '.');
    }
    // Lead sponsor
    if (Y <= T.spon.to) T.spon.fee = +(T.spon.fee * (1 + T.spon.raise)).toFixed(1);
    else {
      const old = T.spon, len = 2 + Math.floor(Math.random() * 5), fee = sp * lf * (d.spMkt ?? 1) * (0.85 + 0.3 * wp) * (0.9 + Math.random() * 0.2);
      const same = Math.random() < 0.55, used = usedSponsors(teams), free = SPONSORS.filter(n => !used.has(n)), name = same || !free.length ? old.name : pick(free, Math.random);
      T.spon = { name, fee: +fee.toFixed(1), raise: +(0.03 + Math.random() * 0.02).toFixed(3), from: Y, to: Y + len - 1 };
      const ch = fee / old.fee - 1;
      say(T, club + (name === old.name ? ' renews its lead sponsor, ' + name : ' signs ' + name + ' as lead sponsor (replacing ' + old.name + ')') + ': ' + fmtMoney(fee) + ' a year (' + (ch >= 0 ? 'up ' : 'down ') + Math.round(Math.abs(ch) * 100) + '%), through ' + lbl(T.spon.to) + '.');
    }
  });
  if (!mine.length && !rest.length) return { teams };
  const lines = [...(mine.length ? ['Yours:', ...mine] : []), ...(rest.length ? [(mine.length ? 'Around the league:' : 'Around the league (none of yours this year):'), ...rest] : [])];
  return { teams, notice: { tone: 'info', title: lbl(Y) + ' local TV and sponsorship deals', lines } };
}

// One line for the Finances screen.
export const dealLine = (x: Deal | undefined, kindLabel = false) => (x ? x.name + (kindLabel && x.kind ? ' (' + KIND_LABEL[x.kind] + ')' : '') + ' · ' + fmtMoney(x.fee) + ' a year · ' + Math.round(x.raise * 100) + '% raises · through ' + lbl(x.to) : '—');
