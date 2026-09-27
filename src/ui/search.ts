// The search bar finds anything: players by name, and groups of players by country or nationality
// ("china", "chinese"), heritage or tribe ("native", "navajo", "mixed"), college or former club, and
// position; also teams and screens.
import { heritageLabel } from '../data/heritage';

export const fold = (x: string) => String(x || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Nationality words, so "chinese" finds China and "greek" finds Greece.
const DEMONYM: Record<string, string> = {
  US: 'American', XN: 'Native American Indigenous Tribal', CA: 'Canadian', BS: 'Bahamian', BR: 'Brazilian', AR: 'Argentine Argentinian', MX: 'Mexican', DO: 'Dominican', PR: 'Puerto Rican', FR: 'French',
  ES: 'Spanish', DE: 'German', IT: 'Italian', GR: 'Greek', RS: 'Serbian', HR: 'Croatian', SI: 'Slovenian', ME: 'Montenegrin', BA: 'Bosnian', LT: 'Lithuanian', LV: 'Latvian', FI: 'Finnish',
  TR: 'Turkish Turkey', IL: 'Israeli', GE: 'Georgian', GB: 'British English Scottish Welsh UK United Kingdom England', NG: 'Nigerian', SN: 'Senegalese', ML: 'Malian', CM: 'Cameroonian', CD: 'Congolese Congo',
  SS: 'South Sudanese', KE: 'Kenyan', AO: 'Angolan', CI: 'Ivorian Ivory Coast', JM: 'Jamaican', VE: 'Venezuelan', UY: 'Uruguayan', AU: 'Australian Aussie', NZ: 'Kiwi', CN: 'Chinese',
  JP: 'Japanese', KR: 'Korean', PH: 'Filipino Philippine', TW: 'Taiwanese', VN: 'Vietnamese', IN: 'Indian', PK: 'Pakistani', IR: 'Iranian Persian', LB: 'Lebanese', JO: 'Jordanian', EG: 'Egyptian',
  MA: 'Moroccan', TN: 'Tunisian', DZ: 'Algerian', GH: 'Ghanaian', CV: 'Cape Verdean Cabo Verdean', SD: 'Sudanese', ET: 'Ethiopian', SO: 'Somali', UG: 'Ugandan', TZ: 'Tanzanian', ZA: 'South African',
  RU: 'Russian', UA: 'Ukrainian', PL: 'Polish', CZ: 'Czech', SK: 'Slovak', HU: 'Hungarian', RO: 'Romanian', BG: 'Bulgarian', MK: 'Macedonian', AL: 'Albanian', XK: 'Kosovar', AT: 'Austrian',
  CH: 'Swiss', NL: 'Dutch Holland', BE: 'Belgian', SE: 'Swedish', NO: 'Norwegian', DK: 'Danish', IS: 'Icelandic', EE: 'Estonian', PT: 'Portuguese', IE: 'Irish', HT: 'Haitian', CU: 'Cuban',
  CO: 'Colombian', CL: 'Chilean', PE: 'Peruvian', EC: 'Ecuadorian', PA: 'Panamanian', BB: 'Barbadian Bajan', TT: 'Trinidadian', ID: 'Indonesian', TH: 'Thai', MN: 'Mongolian', KZ: 'Kazakh',
};
const POS: Record<string, string> = { pg: 'PG', 'point guard': 'PG', sg: 'SG', 'shooting guard': 'SG', sf: 'SF', 'small forward': 'SF', pf: 'PF', 'power forward': 'PF', c: 'C', center: 'C', centre: 'C', gf: 'GF', fc: 'FC' };
const POS_NAME: Record<string, string> = { PG: 'Point guards', SG: 'Shooting guards', SF: 'Small forwards', PF: 'Power forwards', C: 'Centers', GF: 'Guard-forwards', FC: 'Forward-centers' };

// Players a group search covers (the same set its list shows): active players and draft prospects.
export function groupFilter(q: any, C: any): (p: any) => boolean {
  if (q.kind === 'country') return p => p.rep === q.code || p.born === q.code || p.her === q.code;
  if (q.kind === 'pos') return p => p.pos === q.pos;
  const f = fold(q.text);
  return p => fold(heritageLabel(p, C)).includes(f);
}
export function groupTitle(q: any, C: any): string {
  if (q.kind === 'country') return C[q.code]?.n || q.code;
  if (q.kind === 'pos') return POS_NAME[q.pos] || q.pos;
  return 'Heritage: “' + q.text + '”';
}

export function searchAll(o: { q: string; P: any; C: any; T: any[]; tidOf: any; nav: any[]; flag: (c: string) => string; open: (id: number) => any; openTeam: (tid: number) => any; openList: (l: any) => () => void; teamLogo: (tid: number) => any; Y: number }) {
  const { P, C, T, tidOf } = o, fq = fold(o.q.trim());
  if (fq.length < 2) return [];
  const all = (Object.values(P) as any[]).filter(p => !p.gone);
  const active = all.filter(p => tidOf[p.id] !== undefined || (p.cls && p.cls >= o.Y));
  const out: any[] = [];
  // Players by name (or native-script name).
  const byName = all.filter(p => fold(p.name).includes(fq) || (p.native || '').includes(o.q.trim()))
    .sort((a, b) => (fold(b.name).startsWith(fq) ? 1 : 0) - (fold(a.name).startsWith(fq) ? 1 : 0) || (b.retired ? 0 : 1) - (a.retired ? 0 : 1) || b.ovr - a.ovr).slice(0, 5); // the dropdown shows the top 5 names
  byName.forEach(p => { const t = tidOf[p.id]; out.push({ sec: 'Players', name: p.name, flag: o.flag(p.rep), meta: p.pos + ' · ' + (p.retired ? 'Retired' : t >= 0 ? T[t].abbr : t === -1 ? 'FA' : t === -2 ? 'Overseas' : p.cls ? 'Class of ' + p.cls : '—') + ' · ' + p.ovr, open: o.open(p.id) }); });
  // Countries and nationalities; then heritage and tribes ("navajo", "mixed", "han") when that finds
  // players the countries didn't. The best match shows its top 5 players; the others link to a list.
  const words = (c: string) => fold(C[c].n + ' ' + (DEMONYM[c] || '') + ' ' + c).split(/\s+/);
  const codes = Object.keys(C).filter(c => fq.length >= 3 ? words(c).some(w => w.startsWith(fq)) || fold(C[c].n).includes(fq) : fold(c) === fq || fold(C[c].n).startsWith(fq));
  const groups: any[] = [], covered = new Set<number>();
  codes.forEach(c => { const q = { kind: 'country', code: c }, ps = active.filter(groupFilter(q, C)); if (!ps.length) return; ps.forEach(p => covered.add(p.id));
    groups.push({ q, ps, title: C[c].n + ' players', flag: o.flag(c), exact: words(c).includes(fq) || fold(C[c].n) === fq }); });
  if (fq.length >= 3) { const q = { kind: 'her', text: o.q.trim() }, ps = active.filter(groupFilter(q, C));
    if (ps.some(p => !covered.has(p.id))) groups.push({ q, ps, title: 'Heritage: ' + o.q.trim(), flag: o.flag(ps[0].her), exact: false }); }
  groups.sort((a, b) => (b.exact ? 1 : 0) - (a.exact ? 1 : 0) || b.ps.length - a.ps.length);
  const tag = (p: any) => { const t = tidOf[p.id]; return p.pos + ' · ' + (t >= 0 ? T[t].abbr : t === -1 ? 'FA' : t === -2 ? 'Overseas' : p.cls ? 'Class of ' + p.cls : '—') + ' · ' + p.ovr; };
  groups.slice(0, 4).forEach((gr, k) => {
    const sec = k === 0 ? gr.title : 'More groups', list = o.openList({ type: 'group', q: gr.q });
    if (k === 0) [...gr.ps].sort((a, b) => b.ovr - a.ovr).slice(0, 5).forEach(p => { if (!byName.includes(p)) out.push({ sec, name: p.name, flag: o.flag(p.rep), meta: tag(p), open: o.open(p.id) }); });
    out.push({ sec, name: k === 0 ? 'See all ' + gr.ps.length + ' →' : gr.title, flag: k === 0 ? '' : gr.flag, meta: k === 0 ? '' : gr.ps.length + ' players', open: list, strong: k === 0 });
  });
  // Positions.
  const pos = POS[fq]; if (pos) { const q = { kind: 'pos', pos }; out.push({ sec: 'Positions', name: POS_NAME[pos], meta: active.filter(groupFilter(q, C)).length + ' players', open: o.openList({ type: 'group', q }) }); }
  // Teams.
  T.filter(t => fold(t.region + ' ' + t.name).includes(fq) || fold(t.abbr) === fq).slice(0, 3).forEach(t => out.push({ sec: 'Teams', name: t.region + ' ' + t.name, logo: o.teamLogo(t.tid), meta: t.w + '–' + t.l, open: o.openTeam(t.tid) }));
  // Colleges and former clubs.
  if (fq.length >= 3) { const froms = new Map<string, any>(); all.forEach(p => { const f = p.from; if (f?.team && fold(f.team).includes(fq)) { const e = froms.get(f.team) || { lg: f.lg, n: 0 }; e.n++; froms.set(f.team, e); } });
    [...froms.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 3).forEach(([team, e]) => out.push({ sec: 'Colleges & clubs', name: team, meta: (e.lg ? e.lg + ' · ' : '') + e.n + ' players', open: o.openList({ type: 'from', team, lg: e.lg }) })); }
  // Screens.
  o.nav.filter(n => fold(n.label).includes(fq)).slice(0, 3).forEach(n => out.push({ sec: 'Screens', name: n.label, meta: n.grp, open: n.go }));
  return out;
}
