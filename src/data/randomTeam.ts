import { clubs, COLLEGES, IVY_LEAGUE } from './world';

// A random team in a given country: its pro clubs (or their U18 sides for prospects still
// in school), American colleges and high schools, or a local academy where there's no pro league.
export function randomTeamIn(C: any, country: string, young: boolean) {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)], cc = clubs()[country];
  if (country === 'US') return young ? { team: pick(C.US.cities) + ' ' + pick(['Prep', 'Academy', 'Christian', 'High']), lg: 'High school', country } : { team: pick(Math.random() < 0.03 ? IVY_LEAGUE : COLLEGES), lg: 'NCAA', country };
  if (cc && cc.length) { const k = pick(cc); return young ? { team: k[0] + ' U18', lg: 'Junior', country } : { team: k[0], lg: k[1], country }; }
  const city = pick(C[country]?.cities || ['National']);
  return { team: city + ' ' + pick(['Basketball Academy', 'Sports School', 'Basketball Club']), lg: young ? 'Junior' : 'Domestic league', country };
}
