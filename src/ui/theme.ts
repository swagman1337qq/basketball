// Classical design system, dark variant. Accent text (links, buttons, labels: --accent-ink and the
// accent 600–900 shades) is white in dark mode, easier to read than gold; gold stays for lines and fills.
// Classical design system, dark variant. The light theme is the stylesheet's own
// :root tokens; dark overrides them on the app root at runtime (HANDOFF.md §1).
export const DARK: Record<string, string> = {"--color-bg":"#181716","--color-surface":"#211f1e","--color-text":"#ebe7e1","--color-divider":"rgba(235,231,225,.13)","--color-neutral-100":"#262423","--color-neutral-200":"#2f2d2c","--color-neutral-300":"#3d3a39","--color-neutral-400":"#57534f","--color-neutral-500":"#7a7572","--color-neutral-600":"#9d9894","--color-neutral-700":"#bdb8b3","--color-neutral-800":"#d8d3ce","--color-neutral-900":"#efebe6","--color-accent":"#c99a4f","--color-accent-100":"#33291a","--color-accent-200":"#4a3a20","--color-accent-300":"#6b5227","--color-accent-400":"#a37a3a","--color-accent-600":"#ffffff","--color-accent-700":"#f4f1ec","--color-accent-800":"#f4f1ec","--color-accent-900":"#ffffff","--accent-ink":"#f4f1ec","--shadow-md":"0 3px 12px rgba(0,0,0,.5)","--shadow-lg":"0 16px 40px rgba(0,0,0,.6)"};

export function applyTheme(el: HTMLElement | null, dark: boolean, team?: [string, string]) {
  if (!el) return;
  if (team) { el.style.setProperty('--team-1', team[0]); el.style.setProperty('--team-2', team[1]); }
  el.style.setProperty('--gm-elite', dark ? 'oklch(0.86 0.14 85)' : 'var(--color-accent-700)');
  Object.keys(DARK).forEach(k => (dark ? el.style.setProperty(k, DARK[k]) : el.style.removeProperty(k)));
  // Data colours: neon green for growth and wins, soft red for decline, injuries and losses.
  el.style.setProperty('--gm-good', dark ? 'oklch(0.87 0.22 145)' : 'oklch(0.52 0.16 148)');
  el.style.setProperty('--gm-bad', dark ? 'oklch(0.72 0.14 25)' : 'oklch(0.52 0.16 25)');
  // Rating scale (Overall / Potential rings): purple superstar, bright green All-Star, green starter,
  // plain rotation player, orange bench, red below that.
  const RT = dark ? ['oklch(0.76 0.17 305)', 'oklch(0.87 0.22 145)', 'oklch(0.80 0.12 155)', 'var(--color-text)', 'oklch(0.80 0.14 65)', 'oklch(0.70 0.16 25)']
    : ['oklch(0.50 0.20 305)', 'oklch(0.52 0.17 148)', 'oklch(0.58 0.11 158)', 'var(--color-text)', 'oklch(0.60 0.15 55)', 'oklch(0.52 0.18 25)'];
  RT.forEach((c, i) => el.style.setProperty('--rt-' + i, c));
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
