// "Marshall, Texas, United States": city, then the U.S. state (picked in the editor, or known
// for the big cities), then the country.
import { regionOf } from './world';
export function hometownOf(p: any, C: any): string {
  const region = p.state || regionOf(p.city) || '';
  return [p.city, region, C[p.born]?.n].filter(Boolean).join(', ');
}
