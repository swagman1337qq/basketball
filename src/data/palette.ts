// Team colors, 2026-10 repaint: bright and colorful, but each pair goes together (a strong main color
// and an accent that suits it, no neon-on-neon clashes), the 30 teams look different from each other,
// and the colors come from the nickname.
export const LOUD_COLORS: Record<string, [string, string]> = {
  BAL: ['#c8873a', '#12808a'],  // camel tan and oasis teal
  NY: ['#2d5bd7', '#ffb703'],   // royal blue and a hermit's lantern
  NWK: ['#c9a227', '#22223b'],  // a gold monocle and tuxedo midnight
  PHI: ['#5f7a94', '#7ed957'],  // koala grey and eucalyptus
  CLE: ['#ef476f', '#06d6a0'],  // watermelon and mint beach parasols
  DET: ['#8b4513', '#f4c95d'],  // oxcart brown and wheat
  CHI: ['#8cc63f', '#f1e3c6'],  // moss green and sloth-fur cream
  BHM: ['#f25c05', '#2f3540'],  // molten steel and cast iron
  CIN: ['#48cae4', '#023e7d'],  // arctic cyan and the deep sea
  CHA: ['#00a6a6', '#ff7b54'],  // bohemian teal and coral
  ATL: ['#ffd000', '#22252a'],  // snowplow yellow and asphalt
  INL: ['#0b2545', '#f1e9d2'],  // Arctic navy and walrus ivory (its own crest)
  RIC: ['#e34234', '#1a1a1d'],  // vermilion and black lacquer armor
  NSH: ['#0e4d64', '#e6af2e'],  // library teal and brass reading lamps
  SEA: ['#39d98a', '#141414'],  // venom green and black scorpion
  POR: ['#1f9d55', '#f2e8cf'],  // pine green and Mount Hood snow
  VAN: ['#4ea8de', '#f9c74f'],  // cloudless sky and sun
  STL: ['#ffa62b', '#2b2d42'],  // puffin-beak orange and black
  DEN: ['#0077b6', '#ffd166'],  // ocean blue and an anglerfish's light
  SD: ['#c9184a', '#fff1d0'],   // cranberry knit and cream
  OAK: ['#6a1b9a', '#ffc72c'],  // baron purple and gold
  LV: ['#7b1e3a', '#f4a300'],   // maroon and saffron monks' robes
  LA: ['#b388eb', '#ffd23f'],   // lavender sunset and sunshine
  SJ: ['#7fd1b9', '#1d1d1d'],   // vintage typewriter mint and ink
  AUS: ['#5e548e', '#f4acb7'],  // quiet dusk violet and soft pink
  SA: ['#7da0fa', '#0b132b'],   // frost blue and night
  WAZ: ['#c8102e', '#ffc72c'],  // star-quilt red and gold (its own crest)
  DAL: ['#ffa6c9', '#00798c'],  // axolotl pink and deep teal
  HOU: ['#457b9d', '#f4a261'],  // tundra blue and caribou antler
  MIN: ['#9b2226', '#e9d8a6'],  // marauder red and bone
  BKN: ['#f7e733', '#2b2b2b'],  // squares: yellow and black (expansion)
};
// The palette before (2026-09), to spot saves still wearing it.
// Team colors, 2026-09 repaint: louder. Fifteen teams wear loud, neon-bright colors, three wear
// deliberately ugly ones, and the rest are brighter takes on classic sports palettes.
// Ugly #1 uses Pantone 448 C ("opaque couché", #4a412a), the drab brown-green picked in a 2012
// study for Australia's plain cigarette packs as the world's least appealing color.
export const LOUD_V2: Record<string, [string, string]> = {
  // Loud
  LV: ['#ff1493', '#111111'],   // Vegas neon: hot pink on black
  CHA: ['#7b2cf5', '#39ff14'],  // purple and neon green
  SJ: ['#00e5ff', '#ff00a8'],   // electric cyan and magenta
  TPA: ['#ff6a00', '#00c2b8'],  // neon orange and teal
  INL: ['#0b2545', '#f1e9d2'],  // Arctic navy and walrus ivory
  WAZ: ['#c8102e', '#ffc72c'],  // star-quilt red and gold
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
export const PALETTE_V = 3;
