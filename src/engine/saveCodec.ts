// A compact save file (2026-10-22). A long league is mostly lists of small records that repeat the same
// property names on every entry: every player's stat lines, transactions and injury history, his ratings
// history, the league log, and the name-only records of players who never played. In the save file only,
// each such list is stored as one key list plus rows of values (about half the size); ratings snapshots
// store their ratings in a fixed order. Game.toSave encodes, Game.load decodes before anything else
// runs, so the game itself always sees the usual objects. Saves without it load as they are.
//
// Table form: { $t: [keys], v: [[values]] }. A missing value is stored as null and left out again on load,
// a real null as { $n: 1 }, and trailing missing values are dropped.

type Row = Record<string, any>;
const plain = (o: any) => !!o && typeof o === 'object' && !Array.isArray(o);
const isTab = (x: any) => plain(x) && Array.isArray(x.v) && (Array.isArray(x.$t) || typeof x.$k === 'number');
const NUL = { $n: 1 }, isNul = (v: any) => plain(v) && v.$n === 1 && Object.keys(v).length === 1;

// While a save is encoded or decoded, the key lists are shared: each distinct list is stored once in the
// save (db.$keys) and a table names it by number ({ $k: n, v }) instead of repeating it ({ $t: keys, v }).
let REG: { at: Map<string, number>; lists: string[][] } | null = null;
export function encTable(arr: any): any {
  if (!Array.isArray(arr) || arr.length < 2 || !arr.every(plain)) return arr;
  const keys: string[] = [], at = new Map<string, number>();
  for (const o of arr) for (const k in o) if (!at.has(k)) { at.set(k, keys.length); keys.push(k); }
  const v = arr.map((o: Row) => { const row: any[] = new Array(keys.length).fill(null); let last = -1;
    for (const k in o) { const i = at.get(k)!; if (o[k] !== undefined) { row[i] = o[k] === null ? NUL : o[k]; if (i > last) last = i; } }
    row.length = last + 1; return row; });
  if (!REG) return { $t: keys, v };
  const sig = keys.join('\u0001'); let n = REG.at.get(sig); if (n == null) { n = REG.lists.length; REG.lists.push(keys); REG.at.set(sig, n); }
  return { $k: n, v };
}
export function decTable(x: any): any {
  if (!plain(x) || !Array.isArray(x.v) || !(Array.isArray(x.$t) || (typeof x.$k === 'number' && REG))) return x;
  const K: string[] = Array.isArray(x.$t) ? x.$t : REG!.lists[x.$k];
  return x.v.map((row: any[]) => { const o: Row = {}; for (let i = 0; i < row.length; i++) { const v = row[i]; if (v !== null && v !== undefined) o[K[i]] = isNul(v) ? null : v; } return o; });
}

// A ratings snapshot ({ ovr, ovrI, pot, r: {...} }): its ratings as an array in RK order.
function encSnap(sn: any, RK: string[]) {
  if (!plain(sn) || !plain(sn.r)) return sn;
  const ks = Object.keys(sn.r); if (ks.length !== RK.length || !RK.every(k => typeof sn.r[k] === 'number')) return sn;
  return { ...sn, r: RK.map(k => sn.r[k]) };
}
function decSnap(sn: any, RK: string[]) { return plain(sn) && Array.isArray(sn.r) ? { ...sn, r: Object.fromEntries(RK.map((k, i) => [k, sn.r[i]])) } : sn; }
function mapRh(rh: any, f: (sn: any) => any) {
  if (!plain(rh)) return rh;
  const out: any = {}; for (const y in rh) { const h = rh[y]; out[y] = plain(h) ? { ...h, ...(h.o ? { o: f(h.o) } : {}), ...(h.e ? { e: f(h.e) } : {}) } : h; } return out;
}

// A retired player's ratings history (prune.ts: each season's opening overall and potential, its biggest
// moves) as a table: { $y: table of { y, ovr, ovrI, pot, mv, why } }. Other shapes stay as they are.
const RH_O = ['ovr', 'ovrI', 'pot'];
// A season's biggest moves ([['ins', 1], ['dnk', -1.5]]) as 'ins1,dnk-1.5'.
const encMv = (mv: any) => Array.isArray(mv) && mv.every(m => Array.isArray(m) && m.length === 2 && /^[a-z]+$/i.test(m[0]) && typeof m[1] === 'number') ? mv.map(m => m[0] + m[1]).join(',') : mv;
const decMv = (x: any) => typeof x === 'string' ? (x ? x.split(',').map(t => { const m = /^([a-z]+)(.*)$/i.exec(t)!; return [m[1], +m[2]]; }) : []) : x;
function encRhRetired(rh: any) {
  if (!plain(rh)) return rh;
  const rows: any[] = [];
  for (const y in rh) { const h = rh[y]; // (a season before his debut can hold only notes, no snapshot)
    if (!plain(h) || h.e || (h.o != null && (!plain(h.o) || h.o.r || !Object.keys(h.o).length || Object.keys(h.o).some(k => !RH_O.includes(k)))) || Object.keys(h).some(k => !['o', 'mv', 'why'].includes(k))) return rh;
    rows.push({ y: +y, ...(h.o || {}), ...(h.mv ? { mv: encMv(h.mv) } : {}), ...(h.why ? { why: h.why } : {}) }); }
  return rows.length > 1 ? { $y: encTable(rows) } : rh;
}
function decRhRetired(x: any) {
  if (!plain(x) || !x.$y) return x;
  const out: any = {}; for (const r of decTable(x.$y)) { const { y, mv, why, ...o } = r; out[y] = { ...(Object.keys(o).length ? { o } : {}), ...(mv != null ? { mv: decMv(mv) } : {}), ...(why ? { why } : {}) }; } return out;
}
// Retired players' small nested records, stored as columns of the retired table ('pers.alpha', ...).
const FLAT = ['pers', 'r', 'ten', 'intg', 'retired', 'from', 'dr', 'injSum'];
function flatten(p: any) {
  const o: any = {};
  for (const k in p) { const v = p[k];
    if (FLAT.includes(k) && plain(v) && !isTab(v) && Object.keys(v).length && Object.keys(v).every(sk => !sk.includes('.') && !plain(v[sk]))) for (const sk in v) o[k + '.' + sk] = v[sk];
    else o[k] = v; }
  return o;
}
function unflatten(o: any) {
  const p: any = {};
  for (const k in o) { const i = k.indexOf('.'); if (i < 0) p[k] = o[k]; else { const a = k.slice(0, i); (p[a] = plain(p[a]) ? p[a] : {})[k.slice(i + 1)] = o[k]; } }
  return p;
}

const LISTS = ['stats', 'tx', 'injHist'];
// The save's db: players' lists in table form; retired players (flattened) and the never-played (gone)
// ones as one table each.
export function encodeDb(db: any, RK: string[]) {
  REG = { at: new Map(), lists: [] };
  try { return encodeDb1(db, RK); } finally { REG = null; }
}
function encodeDb1(db: any, RK: string[]) {
  const P: any = {}, gone: any[] = [], ret: any[] = [];
  for (const id in db.P) {
    const p = db.P[id];
    if (p?.gone && !p.r && !(p.stats || []).length) { gone.push(p); continue; }
    let q = p;
    for (const k of LISTS) if (Array.isArray(p[k]) && p[k].length > 1) { if (q === p) q = { ...p }; q[k] = encTable(p[k]); }
    if (p.rh) { if (q === p) q = { ...p }; q.rh = p.retired ? encRhRetired(p.rh) : mapRh(p.rh, sn => encSnap(sn, RK)); }
    if (p.retired && !p.gone && p.id != null) ret.push(flatten(q)); else P[id] = q;
  }
  const $gone = gone.length ? encTable(gone.map(flatten)) : undefined, $ret = ret.length ? encTable(ret) : undefined, deep: any = {};
  for (const k of DEEP_DB) if (db[k] != null) deep[k] = deepEnc(db[k]);
  return { ...db, ...deep, P, $c: 1, $rk: RK, $keys: REG!.lists, ...($gone ? { $gone } : {}), ...($ret ? { $ret } : {}) };
}
export function decodeDb(db: any) {
  if (!db?.$c) return db;
  REG = { at: new Map(), lists: db.$keys || [] };
  try { return decodeDb1(db); } finally { REG = null; }
}
function decodeDb1(db: any) {
  const RK: string[] = db.$rk, P: any = {};
  const one = (p: any) => { let q = p;
    for (const k of LISTS) if (isTab(p[k])) { if (q === p) q = { ...p }; q[k] = decTable(p[k]); }
    if (p.rh) { if (q === p) q = { ...p }; q.rh = plain(p.rh) && p.rh.$y ? decRhRetired(p.rh) : mapRh(p.rh, sn => decSnap(sn, RK)); }
    return q; };
  for (const id in db.P) P[id] = one(db.P[id]);
  const R = db.$ret ? decTable(db.$ret) : []; if (Array.isArray(R)) for (const f of R) { const p = one(unflatten(f)); if (p?.id != null) P[p.id] = p; }
  const G = db.$gone ? decTable(db.$gone) : []; if (Array.isArray(G)) for (const f of G) { const p = unflatten(f); if (p?.id != null) P[p.id] = p; }
  const { $c, $rk, $gone, $ret, $keys, ...rest } = db; void $c; void $rk; void $gone; void $ret; void $keys;
  for (const k of DEEP_DB) if (rest[k] != null) rest[k] = deepDec(rest[k]);
  return { ...rest, P };
}
// Season-by-season records (award voting, team stats, history pages, media predictions) in table form all
// the way down: a list of records becomes a table, and so does an object whose values are all records
// (teams by id, say): { $o: [its keys], t: table }.
function deepEnc(x: any): any {
  if (Array.isArray(x)) { const a = x.map(deepEnc); return a.length > 1 && a.every(o => plain(o) && !isTab(o) && !o.$o) ? encTable(a) : a; }
  if (!plain(x)) return x;
  const ks = Object.keys(x), o: any = {}; for (const k of ks) o[k] = deepEnc(x[k]);
  if (ks.length > 1 && ks.every(k => plain(o[k]) && !isTab(o[k]) && !o[k].$o)) return { $o: ks, t: encTable(ks.map(k => o[k])) };
  return o;
}
function deepDec(x: any): any {
  if (Array.isArray(x)) return x.map(deepDec);
  if (!plain(x)) return x;
  if (isTab(x)) return decTable(x).map(deepDec);
  if (Array.isArray(x.$o) && isTab(x.t) && Object.keys(x).length === 2) { const rows = decTable(x.t), o: any = {}; x.$o.forEach((k: string, i: number) => (o[k] = deepDec(rows[i]))); return o; }
  const o: any = {}; for (const k in x) o[k] = deepDec(x[k]); return o;
}
const DEEP_STATE = ['awards', 'tstatsHist', 'history', 'teamHist'], DEEP_DB = ['preds'];

// The save's state: the league log and the season records in table form.
export function encodeState(s: any) {
  REG = { at: new Map(), lists: [] };
  try { const o: any = { ...s, $c: 1 }; if (Array.isArray(s.lgLog) && s.lgLog.length > 1) o.lgLog = encTable(s.lgLog); for (const k of DEEP_STATE) if (s[k] != null) o[k] = deepEnc(s[k]); o.$keys = REG.lists; return o; }
  finally { REG = null; }
}
export function decodeState(s: any) {
  if (!s) return s;
  if (!s.$c) return plain(s.lgLog) && isTab(s.lgLog) ? { ...s, lgLog: decTable(s.lgLog) } : s; // compact saves from before the season records were
  REG = { at: new Map(), lists: s.$keys || [] };
  try { const { $c, $keys, ...o } = s; void $c; void $keys; if (isTab(o.lgLog)) o.lgLog = decTable(o.lgLog); for (const k of DEEP_STATE) if (o[k] != null) o[k] = deepDec(o[k]); return o; }
  finally { REG = null; }
}
