# Team identities — November 13, 2026

All 30 league teams now use their selected vintage artwork: 29 illustrations in the shared approved-logo registry, plus the separately approved Los Angeles Stars artwork. Selected images take precedence over saved logo-image/style overrides at every shared logo placement, including old save previews. Full-size source artwork and prompts are archived under `.review/vintage-logos`, `.review/vintage-round-two`, `.review/vintage-round-three` and `.review/san-diego-options`. Production WebP copies preserve the chosen composition and fit without cropping.

## Selected concepts

| Team                  | Selected concept |
| --------------------- | ---------------- |
| Atlanta Snowplows     | 2                |
| Austin Vampires       | 2                |
| Baltimore Camels      | 3                |
| Chicago Sloths        | 3                |
| Cincinnati Narwhals   | 2                |
| Dallas Lariats        | 3                |
| Denver Deep           | 2                |
| Houston Caribou       | 2                |
| Iŋaliq Ivories        | 1                |
| Las Vegas Neon        | 3                |
| Minneapolis Marauders | 3                |
| New York Hermits      | 3                |
| Newark Navigators     | 2                |
| Portland Pines        | 3                |
| Richmond Opossums     | 2                |
| Seattle Scorpions     | 1                |
| St. Louis Puffins     | 2                |
| Charlotte Racers      | 3                |
| Cleveland Cyclones    | 1                |
| Nashville Owls        | 1                |
| Oakland Panthers      | 1                |
| Philadelphia Liberty  | 1                |
| Birmingham Vulcans    | 2                |
| Wazíbló Dragoons      | 1                |
| Detroit Groove        | 1 — Heritage     |
| San Antonio Valor     | 2 — Signature    |
| San Jose Electric     | 1 — Heritage     |
| Vancouver Cascades    | 1 — Heritage     |
| San Diego Hawks       | 3 — Dynamic      |

Birmingham uses the selected Roman-god #2 composition with one hammer raised in his anatomical right hand and his left hand gripping the anvil. Wazíbló uses the Oglala Lakota rider with both hands on the reins and no basketball.

The final four choices use the exact `vintage-round-three` sources: `det_groove_more-1.png`, `sa_valor_alamo-2.png`, `sj_electric_coil-1.png` and `van_cascades-1.png`. The San Jose filename is a legacy label: its selected artwork has small lightning bolts, with no coil E. Detroit has the mirrored disco ball and colorful lights; Valor uses the Alamo façade; Cascades uses waterfalls and forest.

San Diego uses the exact `.review/san-diego-options/sd_hawks-3.png` source: the red-tailed hawk with spread wings, a rusty red tail and a basketball in its talons. The production asset is `src/assets/team-logos/sd-vintage.webp`. No new artwork was generated or creatively edited during implementation; the approved original was only resized and encoded for the game.

## Confirmed names

Philadelphia Liberty, Cleveland Cyclones, Detroit Groove, Nashville Owls, Oakland Panthers, Charlotte Racers, San Jose Electric, San Antonio Valor, Vancouver Cascades and San Diego Hawks. New leagues use these names. Existing saves using prior defaults update the live team and matching historical standings; custom names remain unchanged. San Diego accepts both the Seals and the older Mittens defaults, including matching historical standings. Existing interface palettes are preserved; the approved artwork retains its own illustrated colors.

## Rollout status

All selected identities are implemented. San Diego's unselected Sea Lions, Bobcats and Towhees alternatives remain preview artwork; they do not create additional teams or alter the chosen Hawks identity.
