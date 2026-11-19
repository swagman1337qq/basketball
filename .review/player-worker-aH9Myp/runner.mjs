var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/db/saveSummary.ts
function saveSummary(row) {
  const s = row.data?.state;
  const spectator = !!s?.spectator;
  const source = spectator ? void 0 : s?.teams?.[s.me ?? 0] || s?.teams?.[0];
  const team = source && Object.fromEntries(["tid", "region", "name", "abbr", "colors", "logoImg", "logoStyle", "icon"].map((k) => [k, source[k]]));
  const year = Number(s?.season);
  const pick = s?.phase === "draft" ? s.picks?.[s.pi ?? 0] : void 0;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    summary: row.summary,
    preview: {
      team,
      spectator,
      teamName: spectator ? "Spectator league" : team ? team.region + " " + team.name : "Saved league",
      season: Number.isFinite(year) ? year - 1 + "\u2013" + String(year).slice(2) : "League",
      phase: pick ? "Draft \xB7 Pick " + pick.n : PHASE[s?.phase] || s?.phase || "Saved league",
      managed: s?.managed?.length || (spectator ? 0 : 1)
    }
  };
}
var PHASE;
var init_saveSummary = __esm({
  "src/db/saveSummary.ts"() {
    "use strict";
    PHASE = {
      regular: "Regular season",
      playin: "Play-in",
      playoffs: "Playoffs",
      lottery: "Lottery",
      draft: "Draft",
      preFA: "Pre-free agency",
      fa: "Free agency",
      preseason: "Preseason"
    };
  }
});

// src/engine/cooperative.ts
var init_cooperative = __esm({
  "src/engine/cooperative.ts"() {
    "use strict";
  }
});

// src/db/playerArchive.ts
function storageRevision() {
  return Array.from(crypto.getRandomValues(new Uint32Array(4)), (n) => n.toString(16).padStart(8, "0")).join("");
}
function rememberRowRevision(row, revision) {
  ROW_REVISIONS.set(row, revision);
}
var StaleSaveError, isStaleSave, ROW_REVISIONS;
var init_playerArchive = __esm({
  "src/db/playerArchive.ts"() {
    "use strict";
    init_cooperative();
    StaleSaveError = class extends Error {
      constructor() {
        super("This league was saved in another session. Reload the league before saving again.");
        this.name = "StaleSaveError";
      }
    };
    isStaleSave = (error) => error?.name === "StaleSaveError";
    ROW_REVISIONS = /* @__PURE__ */ new WeakMap();
  }
});

// src/engine/saveCodec.ts
function encTable(arr) {
  if (!Array.isArray(arr) || arr.length < 2 || !arr.every(plain)) return arr;
  const keys = [], at = /* @__PURE__ */ new Map();
  for (const o of arr)
    for (const k in o)
      if (!at.has(k)) {
        at.set(k, keys.length);
        keys.push(k);
      }
  const v = arr.map((o) => {
    const row = new Array(keys.length).fill(null);
    let last = -1;
    for (const k in o) {
      const i = at.get(k);
      if (o[k] !== void 0) {
        row[i] = o[k] === null ? NUL : o[k];
        if (i > last) last = i;
      }
    }
    row.length = last + 1;
    return row;
  });
  if (!REG) return { $t: keys, v };
  const sig = keys.join("");
  let n = REG.at.get(sig);
  if (n == null) {
    n = REG.lists.length;
    REG.lists.push(keys);
    REG.at.set(sig, n);
  }
  return { $k: n, v };
}
function decTable(x) {
  if (!plain(x) || !Array.isArray(x.v) || !(Array.isArray(x.$t) || typeof x.$k === "number" && REG)) return x;
  const K = Array.isArray(x.$t) ? x.$t : REG.lists[x.$k];
  return x.v.map((row) => {
    const o = {};
    for (let i = 0; i < row.length; i++) {
      const v = row[i];
      if (v !== null && v !== void 0) o[K[i]] = isNul(v) ? null : v;
    }
    return o;
  });
}
function encSnap(sn, RK) {
  if (!plain(sn) || !plain(sn.r)) return sn;
  const ks = Object.keys(sn.r);
  if (ks.length !== RK.length || !RK.every((k) => typeof sn.r[k] === "number")) return sn;
  return { ...sn, r: RK.map((k) => sn.r[k]) };
}
function decSnap(sn, RK) {
  return plain(sn) && Array.isArray(sn.r) ? { ...sn, r: Object.fromEntries(RK.map((k, i) => [k, sn.r[i]])) } : sn;
}
function mapRh(rh, f) {
  if (!plain(rh)) return rh;
  const out = {};
  for (const y in rh) {
    const h = rh[y];
    out[y] = plain(h) ? { ...h, ...h.o ? { o: f(h.o) } : {}, ...h.e ? { e: f(h.e) } : {} } : h;
  }
  return out;
}
function encRhRetired(rh) {
  if (!plain(rh)) return rh;
  const rows = [];
  for (const y in rh) {
    const h = rh[y];
    if (!plain(h) || h.e || h.o != null && (!plain(h.o) || h.o.r || !Object.keys(h.o).length || Object.keys(h.o).some((k) => !RH_O.includes(k))) || Object.keys(h).some((k) => !["o", "mv", "why"].includes(k)))
      return rh;
    rows.push({ y: +y, ...h.o || {}, ...h.mv ? { mv: encMv(h.mv) } : {}, ...h.why ? { why: h.why } : {} });
  }
  return rows.length > 1 ? { $y: encTable(rows) } : rh;
}
function decRhRetired(x) {
  if (!plain(x) || !x.$y) return x;
  const out = {};
  for (const r of decTable(x.$y)) {
    const { y, mv, why, ...o } = r;
    out[y] = { ...Object.keys(o).length ? { o } : {}, ...mv != null ? { mv: decMv(mv) } : {}, ...why ? { why } : {} };
  }
  return out;
}
function flatten(p) {
  const o = {};
  for (const k in p) {
    const v = p[k];
    if (FLAT.includes(k) && plain(v) && !isTab(v) && Object.keys(v).length && Object.keys(v).every((sk) => !sk.includes(".") && !plain(v[sk])))
      for (const sk in v) o[k + "." + sk] = v[sk];
    else o[k] = v;
  }
  return o;
}
function unflatten(o) {
  const p = {};
  for (const k in o) {
    const i = k.indexOf(".");
    if (i < 0) p[k] = o[k];
    else {
      const a = k.slice(0, i);
      (p[a] = plain(p[a]) ? p[a] : {})[k.slice(i + 1)] = o[k];
    }
  }
  return p;
}
function encodeDb(db3, RK) {
  REG = { at: /* @__PURE__ */ new Map(), lists: [] };
  try {
    return encodeDb1(db3, RK);
  } finally {
    REG = null;
  }
}
function attachSavedPlayers(db3, players, RK) {
  const encoded = encodeDb({ P: players }, RK), lists = encoded.$keys.slice();
  const at = new Map(lists.map((keys, i) => [JSON.stringify(keys), i]));
  const rebase = (value) => {
    if (Array.isArray(value)) return value.map(rebase);
    if (!plain(value)) return value;
    const out = {};
    for (const key of Object.keys(value)) out[key] = rebase(value[key]);
    if (isTab(value) && typeof value.$k === "number") {
      const keys = db3.$keys?.[value.$k];
      if (!keys) throw Error("Invalid saved world table.");
      const signature = JSON.stringify(keys);
      let index = at.get(signature);
      if (index === void 0) {
        index = lists.length;
        lists.push(keys);
        at.set(signature, index);
      }
      out.$k = index;
    }
    return out;
  };
  const { $ret, $gone, $keys, ...rest } = db3, deep = {};
  for (const key of DEEP_DB) if (db3[key] != null) deep[key] = rebase(db3[key]);
  return {
    ...rest,
    ...deep,
    P: encoded.P,
    $keys: lists,
    ...encoded.$gone ? { $gone: encoded.$gone } : {},
    ...encoded.$ret ? { $ret: encoded.$ret } : {}
  };
}
function encodeDb1(db3, RK) {
  const P = {}, gone = [], ret = [];
  for (const id in db3.P) {
    const p = db3.P[id];
    if (p?.gone && !p.r && !(p.stats || []).length) {
      gone.push(p);
      continue;
    }
    let q = p;
    for (const k of LISTS)
      if (Array.isArray(p[k]) && p[k].length > 1) {
        if (q === p) q = { ...p };
        q[k] = encTable(p[k]);
      }
    if (p.rh) {
      if (q === p) q = { ...p };
      q.rh = p.retired ? encRhRetired(p.rh) : mapRh(p.rh, (sn) => encSnap(sn, RK));
    }
    if (p.retired && !p.gone && p.id != null) ret.push(flatten(q));
    else P[id] = q;
  }
  const $gone = gone.length ? encTable(gone.map(flatten)) : void 0, $ret = ret.length ? encTable(ret) : void 0, deep = {};
  for (const k of DEEP_DB) if (db3[k] != null) deep[k] = deepEnc(db3[k]);
  return { ...db3, ...deep, P, $c: 1, $rk: RK, $keys: REG.lists, ...$gone ? { $gone } : {}, ...$ret ? { $ret } : {} };
}
function decodeDb(db3) {
  if (!db3?.$c) return db3;
  REG = { at: /* @__PURE__ */ new Map(), lists: db3.$keys || [] };
  try {
    return decodeDb1(db3);
  } finally {
    REG = null;
  }
}
function decodeDb1(db3) {
  const RK = db3.$rk, P = {};
  const one = (p) => {
    let q = p;
    for (const k of LISTS)
      if (isTab(p[k])) {
        if (q === p) q = { ...p };
        q[k] = decTable(p[k]);
      }
    if (p.rh) {
      if (q === p) q = { ...p };
      q.rh = plain(p.rh) && p.rh.$y ? decRhRetired(p.rh) : mapRh(p.rh, (sn) => decSnap(sn, RK));
    }
    return q;
  };
  for (const id in db3.P) P[id] = one(db3.P[id]);
  const R = db3.$ret ? decTable(db3.$ret) : [];
  if (Array.isArray(R))
    for (const f of R) {
      const p = one(unflatten(f));
      if (p?.id != null) P[p.id] = p;
    }
  const G = db3.$gone ? decTable(db3.$gone) : [];
  if (Array.isArray(G))
    for (const f of G) {
      const p = unflatten(f);
      if (p?.id != null) P[p.id] = p;
    }
  const { $c, $rk, $gone, $ret, $keys, ...rest } = db3;
  void $c;
  void $rk;
  void $gone;
  void $ret;
  void $keys;
  for (const k of DEEP_DB) if (rest[k] != null) rest[k] = deepDec(rest[k]);
  return { ...rest, P };
}
function deepEnc(x) {
  if (Array.isArray(x)) {
    const a = x.map(deepEnc);
    return a.length > 1 && a.every((o2) => plain(o2) && !isTab(o2) && !o2.$o) ? encTable(a) : a;
  }
  if (!plain(x)) return x;
  const ks = Object.keys(x), o = {};
  for (const k of ks) o[k] = deepEnc(x[k]);
  if (ks.length > 1 && ks.every((k) => plain(o[k]) && !isTab(o[k]) && !o[k].$o)) return { $o: ks, t: encTable(ks.map((k) => o[k])) };
  return o;
}
function deepDec(x) {
  if (Array.isArray(x)) return x.map(deepDec);
  if (!plain(x)) return x;
  if (isTab(x)) return decTable(x).map(deepDec);
  if (Array.isArray(x.$o) && isTab(x.t) && Object.keys(x).length === 2) {
    const rows = decTable(x.t), o2 = {};
    x.$o.forEach((k, i) => o2[k] = deepDec(rows[i]));
    return o2;
  }
  const o = {};
  for (const k in x) o[k] = deepDec(x[k]);
  return o;
}
function encodeState(s) {
  REG = { at: /* @__PURE__ */ new Map(), lists: [] };
  try {
    const o = { ...s, $c: 1 };
    if (Array.isArray(s.lgLog) && s.lgLog.length > 1) o.lgLog = encTable(s.lgLog);
    for (const k of DEEP_STATE) if (s[k] != null) o[k] = deepEnc(s[k]);
    o.$keys = REG.lists;
    return o;
  } finally {
    REG = null;
  }
}
var plain, isTab, NUL, isNul, REG, RH_O, encMv, decMv, FLAT, LISTS, DEEP_STATE, DEEP_DB;
var init_saveCodec = __esm({
  "src/engine/saveCodec.ts"() {
    "use strict";
    plain = (o) => !!o && typeof o === "object" && !Array.isArray(o);
    isTab = (x) => plain(x) && Array.isArray(x.v) && (Array.isArray(x.$t) || typeof x.$k === "number");
    NUL = { $n: 1 };
    isNul = (v) => plain(v) && v.$n === 1 && Object.keys(v).length === 1;
    REG = null;
    RH_O = ["ovr", "ovrI", "pot"];
    encMv = (mv) => Array.isArray(mv) && mv.every((m) => Array.isArray(m) && m.length === 2 && /^[a-z]+$/i.test(m[0]) && typeof m[1] === "number") ? mv.map((m) => m[0] + m[1]).join(",") : mv;
    decMv = (x) => typeof x === "string" ? x ? x.split(",").map((t) => {
      const m = /^([a-z]+)(.*)$/i.exec(t);
      return [m[1], +m[2]];
    }) : [] : x;
    FLAT = ["pers", "r", "ten", "intg", "retired", "from", "dr", "injSum"];
    LISTS = ["stats", "tx", "injHist"];
    DEEP_STATE = ["awards", "tstatsHist", "history", "teamHist"];
    DEEP_DB = ["preds"];
  }
});

// src/db/playerRecords.ts
function validManifest(manifest) {
  return manifest?.version === 1 && typeof manifest.revision === "string" && typeof manifest.encoded === "boolean" && Array.isArray(manifest.ratingKeys) && manifest.ratingKeys.every((key) => typeof key === "string") && Array.isArray(manifest.keys) && manifest.keys.every((key) => typeof key === "string") && new Set(manifest.keys).size === manifest.keys.length;
}
function preparePlayers(row, batch) {
  const source = row.data.db;
  if (source.$playersArchive) throw Error("A partial player archive cannot replace a complete saved league.");
  const records = batch?.records ?? Object.entries(decodeDb(source).P || {}).map(([pid, player]) => ({ pid, player }));
  const keys = batch?.keys ?? records.map((item) => item.pid), ratingKeys = source.$rk || [];
  const wanted = new Set(keys);
  if (wanted.size !== keys.length || keys.some((key) => typeof key !== "string")) throw Error("Invalid player list.");
  const written = /* @__PURE__ */ new Set();
  for (const item of records) {
    if (!wanted.has(item.pid) || written.has(item.pid)) throw Error("Invalid player snapshot.");
    written.add(item.pid);
  }
  const manifest = { version: 1, keys, revision: batch?.revision ?? storageRevision(), encoded: !!source.$c, ratingKeys };
  const { $ret, $gone, ...rest } = source;
  const db3 = { ...rest, P: {}, $playersArchive: manifest };
  const rows = records.map(
    ({ pid, player }) => manifest.encoded ? { saveId: row.id, pid, payload: encodeDb({ P: { [pid]: player } }, ratingKeys) } : { saveId: row.id, pid, raw: player }
  );
  return { manifest, db: db3, rows };
}
async function writePlayers(table, saveId, previous, prepared, batch) {
  if (batch && revisionOf(previous) !== batch.expectedRevision) throw new StaleSaveError();
  const existing = await table.where("saveId").equals(saveId).primaryKeys();
  const available = /* @__PURE__ */ new Set([...existing.map((key) => key[1]), ...prepared.rows.map((item) => item.pid)]);
  if (prepared.manifest.keys.some((pid) => !available.has(pid))) throw Error("A complete player snapshot is required.");
  if (prepared.rows.length) await table.bulkPut(prepared.rows);
  const wanted = new Set(prepared.manifest.keys), removed = existing.filter((key) => !wanted.has(key[1]));
  if (removed.length) await table.bulkDelete(removed);
}
async function hydratePlayers(row, table) {
  const manifest = playerManifest(row);
  if (!manifest) return row;
  if (!validManifest(manifest)) throw Error("The saved player archive is invalid.");
  const stored = await table.bulkGet(manifest.keys.map((pid) => [row.id, pid]));
  if (stored.some((item) => !item)) throw Error("The saved player archive is incomplete. No partial league was opened or exported.");
  const entries = stored.map((item, i) => {
    const pid = manifest.keys[i], decoded = Object.hasOwn(item, "raw") ? { [pid]: item.raw } : decodeDb(item.payload)?.P;
    if (item.saveId !== row.id || item.pid !== pid || !decoded || !Object.hasOwn(decoded, pid) || Object.keys(decoded).length !== 1)
      throw Error("The saved player archive does not match this league.");
    return [pid, decoded[pid]];
  });
  const { $playersArchive, ...main } = row.data.db;
  const players = Object.fromEntries(entries);
  return {
    ...row,
    data: { ...row.data, db: manifest.encoded ? attachSavedPlayers(main, players, manifest.ratingKeys) : { ...main, P: players } }
  };
}
var playerManifest, revisionOf;
var init_playerRecords = __esm({
  "src/db/playerRecords.ts"() {
    "use strict";
    init_saveCodec();
    init_playerArchive();
    playerManifest = (row) => row?.data.db.$playersArchive;
    revisionOf = (row) => playerManifest(row)?.revision ?? null;
  }
});

// src/db/boxArchive.ts
function rememberBoxVersion(box, version) {
  VERSIONS.set(box, version);
}
function boxVersion(box) {
  if (isBoxReference(box)) return box.$detailRef.version ?? null;
  if (!VERSIONS.has(box)) {
    const bytes = new Uint32Array(4);
    globalThis.crypto.getRandomValues(bytes);
    VERSIONS.set(box, Array.from(bytes, (n) => n.toString(16).padStart(8, "0")).join(""));
  }
  return VERSIONS.get(box);
}
function boxSummary(box, saveId, bid, version = isBoxReference(box) ? box.$detailRef.version ?? null : boxVersion(box)) {
  const { details, $detailRef, ...summary } = box;
  return { ...summary, $detailRef: { saveId, bid, version } };
}
function validBoxReference(box, saveId, bid) {
  return isBoxReference(box) && !!box.$detailRef && typeof box.$detailRef === "object" && box.$detailRef.saveId === saveId && box.$detailRef.bid === bid && (box.$detailRef.version == null || typeof box.$detailRef.version === "string") && !("details" in box);
}
function rememberBoxArchive(saveId, boxes) {
  STORED.set(boxes, { saveId, refs: new Map(Object.entries(boxes)) });
}
var VERSIONS, isBoxReference, STORED;
var init_boxArchive = __esm({
  "src/db/boxArchive.ts"() {
    "use strict";
    VERSIONS = /* @__PURE__ */ new WeakMap();
    isBoxReference = (box) => !!box && Object.prototype.hasOwnProperty.call(box, "$detailRef");
    STORED = /* @__PURE__ */ new WeakMap();
  }
});

// src/db/saves.ts
var saves_exports = {};
__export(saves_exports, {
  db: () => db,
  deleteSave: () => deleteSave,
  exportSave: () => exportSave,
  getSave: () => getSave,
  importSave: () => importSave,
  listSaves: () => listSaves,
  newSaveId: () => newSaveId,
  putSave: () => putSave,
  readSavedBox: () => readSavedBox,
  savedPlayerRevision: () => savedPlayerRevision,
  summarize: () => summarize
});
import Dexie from "dexie";
async function listSaves() {
  return db.saveIndex.orderBy("updatedAt").reverse().toArray();
}
async function hydrateSave(row) {
  const input = row.data.db.boxes || {};
  const manifest = row.data.db.$boxKeys || [];
  const keys = [.../* @__PURE__ */ new Set([...manifest, ...Object.keys(input)])];
  const boxes = { ...input };
  const needed = keys.filter((bid) => !input[bid] || isBoxReference(input[bid]));
  for (const bid of Object.keys(input))
    if (isBoxReference(input[bid]) && !validBoxReference(input[bid], row.id, bid))
      throw new Error("Game details belong to another saved league.");
  const stored = await db.boxes.bulkGet(needed.map((bid) => [row.id, bid]));
  if (stored.some((x) => !x || isBoxReference(x.box)))
    throw new Error("The saved game archive is incomplete. No partial export was created.");
  for (const item of stored) {
    const ref = input[item.bid];
    if (isBoxReference(ref) && (ref.$detailRef.version ?? null) !== (item.version ?? null))
      throw new Error("Saved game details changed in another session. Reload the league before exporting.");
    rememberBoxVersion(item.box, item.version ?? null);
    boxes[item.bid] = item.box;
  }
  const { $boxKeys, $boxHeads, ...rest } = row.data.db;
  rememberBoxArchive(row.id, boxes);
  return { ...row, data: { ...row.data, db: { ...rest, boxes } } };
}
function hasBoxSummaries(row) {
  const keys = row.data.db.$boxKeys;
  const boxes = row.data.db.boxes || {};
  return row.data.db.$boxHeads === 1 && !!keys && keys.length === Object.keys(boxes).length && keys.every((bid) => validBoxReference(boxes[bid], row.id, bid));
}
async function prepareLazySave(id) {
  return db.transaction("rw", db.saves, db.boxes, db.saveIndex, db.players, async () => {
    let row = await db.saves.get(id);
    if (!row || hasBoxSummaries(row)) return row;
    if (!row.data.db.$boxKeys) {
      await putSave(await hydratePlayers(row, db.players));
      return db.saves.get(id);
    }
    const keys = row.data.db.$boxKeys;
    const wanted = new Set(keys);
    const summaries = {};
    await db.boxes.where("saveId").equals(id).each((item) => {
      if (wanted.has(item.bid)) {
        if (isBoxReference(item.box)) throw new Error("The saved game archive is incomplete.");
        summaries[item.bid] = boxSummary(item.box, id, item.bid, item.version ?? null);
      }
    });
    if (Object.keys(summaries).length !== keys.length) throw new Error("The saved game archive is incomplete.");
    row = { ...row, data: { ...row.data, db: { ...row.data.db, boxes: summaries, $boxHeads: 1 } } };
    await db.saves.put(row);
    return row;
  });
}
async function getSave(id, options = {}) {
  let row = await db.saves.get(id);
  if (!row) return row;
  if (options.lazyBoxes) {
    if (!hasBoxSummaries(row)) {
      try {
        row = await prepareLazySave(id);
      } catch {
      }
    }
  } else if (!row.data.db.$boxKeys && Object.keys(row.data.db.boxes || {}).length) {
    try {
      await prepareLazySave(id);
    } catch {
    }
  }
  return db.transaction("r", db.saves, db.boxes, db.players, async () => {
    const current = await db.saves.get(id);
    if (!current) return current;
    let full = await hydratePlayers(current, db.players);
    if (options.lazyBoxes && hasBoxSummaries(full)) {
      const { $boxKeys, $boxHeads, ...rest } = full.data.db;
      full = { ...full, data: { ...full.data, db: rest } };
      rememberBoxArchive(id, rest.boxes || {});
    } else full = await hydrateSave(full);
    rememberRowRevision(full, revisionOf(current));
    return full;
  });
}
async function savedPlayerRevision(id) {
  return revisionOf(await db.saves.get(id));
}
async function readSavedBox(saveId, bid) {
  const item = await db.boxes.get([saveId, bid]);
  if (!item || isBoxReference(item.box)) throw new Error("This game\u2019s details could not be loaded. Please try again.");
  rememberBoxVersion(item.box, item.version ?? null);
  return item.box;
}
async function putSave(row, batch, playerBatch) {
  const prepared = preparePlayers(row, playerBatch);
  const boxes = row.data.db.boxes || {};
  const archive = batch ?? {
    keys: Object.keys(boxes),
    records: Object.entries(boxes).filter(([, box]) => !isBoxReference(box)).map(([bid, box]) => ({ bid, box, version: boxVersion(box) }))
  };
  for (const [bid, box] of Object.entries(boxes))
    if (isBoxReference(box) && !validBoxReference(box, row.id, bid)) throw new Error("Game details belong to another saved league.");
  if (archive.records.some((item) => isBoxReference(item.box))) throw new Error("A game summary cannot replace saved game details.");
  const summaries = {};
  const stored = { ...row, data: { ...row.data, db: { ...prepared.db, boxes: summaries, $boxKeys: archive.keys, $boxHeads: 1 } } };
  await db.transaction("rw", db.saves, db.boxes, db.saveIndex, db.players, async () => {
    const previous = await db.saves.get(row.id);
    if (playerBatch && revisionOf(previous) === playerBatch.revision) return;
    await writePlayers(db.players, row.id, previous, prepared, playerBatch);
    const expected = archive.references || Object.entries(boxes).filter(([, box]) => isBoxReference(box)).map(([bid, box]) => ({ bid, version: box.$detailRef.version ?? null }));
    const oldReferences = expected.filter((ref) => !validBoxReference(previous?.data.db.boxes?.[ref.bid], row.id, ref.bid));
    for (const ref of expected) {
      const header = previous?.data.db.boxes?.[ref.bid];
      if (validBoxReference(header, row.id, ref.bid) && (header.$detailRef.version ?? null) !== ref.version)
        throw new Error("Saved game details changed in another session. Reload the league before saving.");
    }
    for (let i = 0; i < oldReferences.length; i += 8) {
      const refs = oldReferences.slice(i, i + 8);
      const found = await db.boxes.bulkGet(refs.map((ref) => [row.id, ref.bid]));
      for (let j = 0; j < refs.length; j++)
        if (!found[j] || (found[j].version ?? null) !== refs[j].version)
          throw new Error("Saved game details changed or are unavailable. Reload the league before saving.");
    }
    if (archive.records.length)
      await db.boxes.bulkPut(
        archive.records.map((x) => ({ saveId: row.id, ...x, version: x.version === void 0 ? boxVersion(x.box) : x.version }))
      );
    const keep = new Set(archive.keys);
    const old = await db.boxes.where("saveId").equals(row.id).primaryKeys();
    const available = /* @__PURE__ */ new Set([...old.map((key) => key[1]), ...archive.records.map((x) => x.bid)]);
    if (archive.keys.some((bid) => !available.has(bid))) throw new Error("A full box-score snapshot is required.");
    const removed = old.filter((key) => !keep.has(key[1]));
    if (removed.length) await db.boxes.bulkDelete(removed);
    const written = new Map(archive.records.map((item) => [item.bid, item]));
    for (const bid of archive.keys) {
      const item = written.get(bid), box = item?.box || boxes[bid];
      if (box)
        summaries[bid] = boxSummary(
          box,
          row.id,
          bid,
          item ? item.version === void 0 ? boxVersion(box) : item.version : boxVersion(box)
        );
    }
    const prior = Object.keys(summaries).length < archive.keys.length ? previous || await db.saves.get(row.id) : void 0;
    for (const bid of archive.keys)
      if (!summaries[bid] && validBoxReference(prior?.data.db.boxes?.[bid], row.id, bid)) summaries[bid] = prior.data.db.boxes[bid];
    const missing = archive.keys.filter((bid) => !summaries[bid]);
    for (let i = 0; i < missing.length; i += 8) {
      const items = await db.boxes.bulkGet(missing.slice(i, i + 8).map((bid) => [row.id, bid]));
      for (const item of items) {
        if (!item || isBoxReference(item.box)) throw new Error("The saved game archive is incomplete.");
        summaries[item.bid] = boxSummary(item.box, row.id, item.bid, item.version ?? null);
      }
    }
    await db.saves.put(stored);
    await db.saveIndex.put(saveSummary(row));
  });
  rememberRowRevision(row, prepared.manifest.revision);
  if (!batch) rememberBoxArchive(row.id, boxes);
}
async function deleteSave(id) {
  await db.transaction("rw", db.saves, db.boxes, db.saveIndex, db.players, async () => {
    await db.players.where("saveId").equals(id).delete();
    await db.boxes.where("saveId").equals(id).delete();
    await db.saves.delete(id);
    await db.saveIndex.delete(id);
  });
}
function summarize(data) {
  const s = data.state, me = s.teams[s.me ?? 0] || s.teams[0];
  const PH = {
    regular: "Regular season",
    playin: "Play-in",
    playoffs: "Playoffs",
    lottery: "Lottery",
    draft: "Draft",
    fa: "Free agency",
    preseason: "Preseason"
  };
  return me.region + " " + me.name + " \xB7 " + (s.season - 1) + "\u2013" + String(s.season).slice(2) + " \xB7 " + me.w + "\u2013" + me.l + " \xB7 " + (PH[s.phase] || s.phase);
}
async function exportSave(row) {
  if (!("data" in row)) {
    const full = await getSave(row.id);
    if (!full) throw new Error("This saved league is no longer available.");
    row = full;
  }
  const snapshot = { ...row, data: structuredClone(row.data) };
  row = await db.transaction("r", db.boxes, db.players, async () => hydrateSave(await hydratePlayers(snapshot, db.players)));
  const body = JSON.stringify({ kind: FILE_KIND, version: 1, name: row.name, createdAt: row.createdAt, data: row.data });
  const url = URL.createObjectURL(new Blob([body], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = row.name.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").toLowerCase() + ".json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
async function importSave(file) {
  const json = JSON.parse(await file.text());
  if (json?.kind !== FILE_KIND || !json.data?.db || !json.data?.state) throw new Error("That file is not a Basketball Manager save.");
  if (json.data.db.$playersArchive) throw new Error("This file is missing player records. Export the complete league before importing it.");
  const importedBoxes = json.data.db.boxes || {};
  if (Object.values(importedBoxes).some(isBoxReference) || (json.data.db.$boxKeys || []).some((bid) => !importedBoxes[bid]))
    throw new Error("This file is missing game details. Export the complete league again before importing it.");
  const now = Date.now();
  const row = {
    id: newSaveId(),
    name: json.name || "Imported league",
    createdAt: json.createdAt || now,
    updatedAt: now,
    summary: summarize(json.data),
    data: json.data
  };
  await putSave(row);
  return row;
}
var SaveDB, db, newSaveId, FILE_KIND;
var init_saves = __esm({
  "src/db/saves.ts"() {
    "use strict";
    init_saveSummary();
    init_playerArchive();
    init_playerRecords();
    init_boxArchive();
    SaveDB = class extends Dexie {
      saves;
      saveIndex;
      boxes;
      players;
      meta;
      // shared across leagues: the player-card library (cards.ts)
      constructor() {
        super("front-office");
        this.version(1).stores({ saves: "id, updatedAt" });
        this.version(2).stores({ saves: "id, updatedAt", meta: "key" });
        this.version(3).stores({ saves: "id, updatedAt", meta: "key", boxes: "[saveId+bid], saveId" });
        this.version(4).stores({ saves: "id, updatedAt", meta: "key", boxes: "[saveId+bid], saveId", saveIndex: "id, updatedAt" }).upgrade(async (tx) => {
          const pending = [];
          await tx.table("saves").each((row) => {
            pending.push(tx.table("saveIndex").put(saveSummary(row)));
          });
          await Promise.all(pending);
        });
        this.version(5).stores({
          saves: "id, updatedAt",
          meta: "key",
          boxes: "[saveId+bid], saveId",
          saveIndex: "id, updatedAt",
          players: "[saveId+pid], saveId"
        });
      }
    };
    db = new SaveDB();
    newSaveId = () => "L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    FILE_KIND = "front-office-save";
  }
});

// src/db/saveWorker.ts
var saveWorker_exports = {};
var scope;
var init_saveWorker = __esm({
  "src/db/saveWorker.ts"() {
    init_saveCodec();
    init_saves();
    init_playerArchive();
    scope = self;
    scope.onmessage = async ({ data: job }) => {
      try {
        const data = { db: encodeDb(job.snapshot.db, job.ratingKeys), state: encodeState(job.snapshot.state) };
        await putSave({ ...job.meta, data }, job.archive, job.players);
        scope.postMessage({ id: job.id, ok: true });
      } catch (error) {
        scope.postMessage({ id: job.id, ok: false, error: error instanceof Error ? error.message : String(error), stale: isStaleSave(error) });
      }
    };
  }
});

// .review/player-worker-aH9Myp/runner.ts
import "fake-indexeddb/auto";
import { parentPort } from "node:worker_threads";
import Dexie2 from "dexie";
globalThis.self = globalThis;
globalThis.postMessage = (message) => parentPort.postMessage(message);
Dexie2.dependencies.indexedDB = globalThis.indexedDB;
Dexie2.dependencies.IDBKeyRange = globalThis.IDBKeyRange;
var { db: db2, getSave: getSave2 } = await Promise.resolve().then(() => (init_saves(), saves_exports));
var queue = Promise.resolve();
parentPort.on("message", (message) => {
  queue = queue.then(async () => {
    if (message.probe) {
      parentPort.postMessage({ id: message.id, probe: true, row: await getSave2(message.saveId) });
      return;
    }
    await self.onmessage({ data: message });
  }).catch((error) => parentPort.postMessage({ id: message.id, runnerError: String(error.stack) }));
});
await Promise.resolve().then(() => (init_saveWorker(), saveWorker_exports));
parentPort.postMessage({ ready: true });
