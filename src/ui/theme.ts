// Classical design system, dark variant. The light theme is the stylesheet's own
// :root tokens; dark overrides them on the app root at runtime (HANDOFF.md §1).
export const DARK: Record<string, string> = {"--color-bg":"#181716","--color-surface":"#211f1e","--color-text":"#ebe7e1","--color-divider":"rgba(235,231,225,.13)","--color-neutral-100":"#262423","--color-neutral-200":"#2f2d2c","--color-neutral-300":"#3d3a39","--color-neutral-400":"#57534f","--color-neutral-500":"#7a7572","--color-neutral-600":"#9d9894","--color-neutral-700":"#bdb8b3","--color-neutral-800":"#d8d3ce","--color-neutral-900":"#efebe6","--color-accent":"#c99a4f","--color-accent-100":"#33291a","--color-accent-200":"#4a3a20","--color-accent-300":"#6b5227","--color-accent-400":"#a37a3a","--color-accent-600":"#e1ad66","--color-accent-700":"#e8bb7c","--color-accent-800":"#f5d09a","--color-accent-900":"#ffe3bf","--shadow-md":"0 3px 12px rgba(0,0,0,.5)","--shadow-lg":"0 16px 40px rgba(0,0,0,.6)"};

export function applyTheme(el: HTMLElement | null, dark: boolean) {
  if (!el) return;
  Object.keys(DARK).forEach(k => (dark ? el.style.setProperty(k, DARK[k]) : el.style.removeProperty(k)));
  el.style.setProperty('--gm-good', dark ? 'oklch(0.8 0.15 150)' : 'oklch(0.5 0.13 150)');
  el.style.setProperty('--gm-bad', dark ? 'oklch(0.72 0.14 25)' : 'oklch(0.52 0.16 25)');
  el.style.colorScheme = dark ? 'dark' : 'light';
  document.body.style.background = dark ? DARK['--color-bg'] : '';
}

const THEME_KEY = 'front-office:theme';
export function lastTheme(): 'dark' | 'light' {
  try { return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; }
}
export function rememberTheme(t: 'dark' | 'light') {
  try { localStorage.setItem(THEME_KEY, t); } catch { /* storage unavailable */ }
}
