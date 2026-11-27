// Retirement uses the season actually played, across every NBA team, rather than
// an age/overall cutoff. These reads never alter stat rows or player ratings.
export function retirementProduction(p: any, season: number) {
  const t: Record<string, number> = {};
  for (const r of p.stats || []) {
    if (r.season !== season || r.po) continue;
    for (const k of ['gp', 'min', 'pts', 'fgm', 'fga', 'ftm', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'pf', 'tov'])
      t[k] = (t[k] || 0) + (Number.isFinite(r[k]) ? r[k] : 0);
  }
  const gp = t.gp || 0,
    mpg = gp ? t.min / gp : 0,
    score = gp
      ? ((t.pts || 0) +
          0.4 * (t.fgm || 0) -
          0.7 * (t.fga || 0) -
          0.4 * ((t.fta || 0) - (t.ftm || 0)) +
          0.7 * (t.orb || 0) +
          0.3 * (t.drb || 0) +
          (t.stl || 0) +
          0.7 * (t.ast || 0) +
          0.7 * (t.blk || 0) -
          0.4 * (t.pf || 0) -
          (t.tov || 0)) /
        gp
      : 0,
    // A useful regular role, with shot attempts/misses, turnovers, defense and
    // playmaking included. A one-game scoring burst cannot qualify.
    useful = gp >= 12 && t.min >= 300 && mpg >= 15 && score >= 5 && score / mpg >= 0.18,
    strong = useful && mpg >= 24 && score >= 10;
  return { gp, mpg, score, useful, strong };
}

export function retirementChance(p: any, season: number, rostered: boolean) {
  const age = p.age || 0;
  if (age < 32 || p.retired || p.gone) return 0;
  const r = retirementProduction(p, season),
    late = Math.max(0, age - 38);
  // Rare voluntary exits remain possible. Being productive never triggers an
  // automatic retirement, even past forty or after a low overall read.
  if (r.strong) return Math.min(0.04, (age < 35 ? 0.001 : 0.005) + late * 0.002);
  if (r.useful) return Math.min(0.08, (age < 35 ? 0.002 : 0.012) + late * 0.004);
  // A contract/rotation-quality skill set is evidence of a remaining market,
  // including a good player whose last season was lost to injury.
  const ovr = Number.isFinite(p.ovr) ? p.ovr : 0;
  if (ovr >= 55) return Math.min(0.18, (age < 35 ? 0.002 : 0.025) + late * 0.015);
  if (age < 35) return rostered ? 0.005 : 0.02;
  const decline = Math.max(0, Math.min(1, (52 - ovr) / 18));
  return Math.min(0.95, (rostered ? 0.06 : 0.2) + decline * (rostered ? 0.3 : 0.5) + late * 0.035);
}

// Give a productive unsigned veteran the next season's signing window. If he
// then spends a year without playing, the old line no longer protects him.
export function keepFreeAgent(p: any, season: number) {
  return !!(
    p.rfa ||
    p.age < 24 ||
    (p.ovr >= 43 && p.age < 31) ||
    (p.ovr >= 48 && p.age < 34) ||
    p.ovr >= 55 ||
    retirementProduction(p, season).useful
  );
}
