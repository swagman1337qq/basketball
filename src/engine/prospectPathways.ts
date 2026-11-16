// Design weights for generated backgrounds, not estimates of real enrollment shares.
// College recruitment is separate from birthplace, heritage and national-team eligibility.
export function collegeRouteChance(home: string, countries: Record<string, any>): number {
  if (['US', 'XN', 'CA', 'BS'].includes(home)) return 1;
  if (['AU', 'NZ'].includes(home)) return 0.6;
  if (['NG', 'SN', 'CM', 'ML', 'CD', 'SS', 'KE', 'AO', 'CI'].includes(home)) return 0.6;
  return countries[home]?.eu ? 0.4 : 0.45;
}

export function youthBackground(home: string, countries: Record<string, any>, clubRows: string[][], rnd: () => number) {
  const pick = <T>(rows: T[]) => rows[Math.floor(rnd() * rows.length)];
  if (clubRows.length) return { team: pick(clubRows)[0] + ' U18', lg: 'Junior', country: home };
  const city = pick(countries[home]?.cities || countries.US.cities);
  if (home !== 'US' && home !== 'XN') {
    return {
      team: city + (['CA', 'BS'].includes(home) ? ' Secondary' : ' Basketball Academy'),
      lg: ['CA', 'BS'].includes(home) ? 'High school' : 'Junior',
      country: home,
    };
  }
  return { team: city + ' ' + pick(['Prep', 'Academy', 'Christian', 'High']), lg: 'High school', country: 'US' };
}
