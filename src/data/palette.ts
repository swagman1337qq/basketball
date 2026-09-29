// Team colors, 2026-09 repaint: louder. Fifteen teams wear loud, neon-bright colors, three wear
// deliberately ugly ones, and the rest are brighter takes on classic sports palettes.
// Ugly #1 uses Pantone 448 C ("opaque couché", #4a412a), the drab brown-green picked in a 2012
// study for Australia's plain cigarette packs as the world's least appealing color.
export const LOUD_COLORS: Record<string, [string, string]> = {
  // Loud
  LV: ['#ff1493', '#111111'],   // Vegas neon: hot pink on black
  CHA: ['#7b2cf5', '#39ff14'],  // purple and neon green
  SJ: ['#00e5ff', '#ff00a8'],   // electric cyan and magenta
  TPA: ['#ff6a00', '#00c2b8'],  // neon orange and teal
  AUS: ['#c6ff00', '#5b21b6'],  // acid lime and purple
  SD: ['#ff4f79', '#1de9e6'],   // hot coral and aqua
  PHX: ['#ff7a00', '#8a2be2'],  // sunburst orange and electric violet
  ATL: ['#ffd400', '#0047ff'],  // safety yellow and royal blue
  NSH: ['#ff3ea5', '#3cf2c0'],  // bubblegum and mint
  DEN: ['#6a00ff', '#f9ff00'],  // ultraviolet and highlighter yellow
  OAK: ['#00c853', '#ffc400'],  // kelly green and gold
  SEA: ['#39ff14', '#0b0b0b'],  // neon green on black
  VAN: ['#0066ff', '#ff8c00'],  // electric blue and orange
  BKN: ['#e8ff00', '#141414'],  // highlighter yellow on black
  DAL: ['#ff8fc7', '#00bfc8'],  // axolotl pink and turquoise
  // Ugly on purpose
  CIN: ['#4a412a', '#c9a227'],  // Pantone 448 C and mustard
  STL: ['#a95c68', '#bfd200'],  // puce and chartreuse slime
  RIC: ['#6b6b2a', '#b37ba4'],  // olive drab and dusty mauve
  // Brighter classics
  BAL: ['#5a2d82', '#ff8200'],
  NY: ['#0050b5', '#ff6b00'],
  NWK: ['#d5001c', '#ffc72c'],
  PHI: ['#e4002b', '#0057b8'],
  CLE: ['#9b0040', '#fdbb30'],
  DET: ['#1d60e0', '#e0263a'],
  CHI: ['#e0103f', '#111111'],
  BHM: ['#0b4fd9', '#ff7a1a'],  // cobalt blue and forge orange
  POR: ['#e03a3e', '#1a1a1a'],
  LA: ['#6a1fbf', '#ffc21a'],
  SA: ['#6cd4ff', '#0a1f44'],
  HOU: ['#e4002b', '#ffb81c'],
};
export const PALETTE_V = 2;
