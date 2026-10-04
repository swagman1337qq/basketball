// Your own menu: the order of the tabs and which section each sits in (Team, Management, League),
// set by dragging them in the sidebar (or with the arrows in Arrange mode). A preference of this
// browser, so it applies to every league; tabs the game adds later appear at the end of their
// default section until you move them.
export interface NavLayout { order: string[]; grp: Record<string, string> }
const KEY = 'bm.navLayout';
const EMPTY: NavLayout = { order: [], grp: {} };

export function loadNav(): NavLayout {
  try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && Array.isArray(v.order) && v.grp && typeof v.grp === 'object') return v; } catch { /* private window, blocked storage */ }
  return EMPTY;
}
function saveNav(l: NavLayout | null) { try { if (l) localStorage.setItem(KEY, JSON.stringify(l)); else localStorage.removeItem(KEY); } catch { /* ignore */ } }
export const navCustom = (l: NavLayout) => l.order.length > 0 || Object.keys(l.grp).length > 0;

// The menu items in your order, each in your chosen section. `groups` fixes the section order.
export function applyNav<T extends { key: string; grp: string }>(items: T[], l: NavLayout, groups: string[], keepGroups = false): T[] {
  const idx = new Map(l.order.map((k, i) => [k, i]));
  const out = items.map((n, i) => ({ n: keepGroups || !l.grp[n.key] || !groups.includes(l.grp[n.key]) ? n : { ...n, grp: l.grp[n.key] }, i }));
  // Known tabs in your order; a tab you never placed keeps its default spot relative to the rest.
  return out.sort((a, b) => groups.indexOf(a.n.grp) - groups.indexOf(b.n.grp) || (idx.get(a.n.key) ?? 1e4 + a.i) - (idx.get(b.n.key) ?? 1e4 + b.i)).map(x => x.n);
}

// Move `key` into section `toGrp`, before `before` (or to the end of that section).
export function moveNav(items: { key: string; grp: string }[], key: string, toGrp: string, before: string | null) {
  if (key === before) return;
  const cur = loadNav(), list = items.map(n => ({ key: n.key, grp: n.key === key ? toGrp : n.grp })).filter(n => n.key !== key);
  let at = before ? list.findIndex(n => n.key === before) : -1;
  if (at < 0) { const last = list.map(n => n.grp).lastIndexOf(toGrp); at = last < 0 ? list.length : last + 1; }
  list.splice(at, 0, { key, grp: toGrp });
  saveNav({ order: list.map(n => n.key), grp: { ...cur.grp, ...Object.fromEntries(list.map(n => [n.key, n.grp])) } });
}

// One step up or down (Arrange mode); past the top or bottom of a section it joins the next one.
export function stepNav(items: { key: string; grp: string }[], key: string, dir: -1 | 1, groups: string[]) {
  const i = items.findIndex(n => n.key === key); if (i < 0) return;
  const n = items[i], j = i + dir, nb = items[j];
  if (nb && nb.grp === n.grp) { moveNav(items, key, n.grp, dir < 0 ? nb.key : items[j + 1]?.grp === n.grp ? items[j + 1].key : null); return; }
  const gi = groups.indexOf(n.grp) + dir; if (gi < 0 || gi >= groups.length) return;
  const g = groups[gi], first = items.find(x => x.grp === g);
  moveNav(items, key, g, dir < 0 ? null : first ? first.key : null); // up: to the end of the section above; down: to the top of the one below
}

export function resetNav() { saveNav(null); }
