// Coming back from injury (2026-11-22). A player back from an injury that cost him RAMP_MIN games or more
// (not a day-to-day knock), during the season, plays on a minutes limit that rises over a few games: 18 the first
// night, up toward a full load, over 2 to 8 games (about one for every six he missed). While it lasts he's more
// likely to get hurt again; a better medical staff (the Health budget) takes some of that off. On a team you run you
// can lift the limit (Morale & form on his profile): he plays his full minutes, at twice the extra risk.
// p.ramp = { k: games to full, g: games played since he came back, m: games he missed, lift?: true }.
// Cheap: one check per player per game day (injTick) and per player per game (simTeam's minutes targets).
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const RAMP_MIN = 10;
export interface Ramp {
  k: number;
  g: number;
  m: number;
  lift?: boolean;
}
// He's back: a limit if the injury was long enough.
export function startRamp(p: any, missed: number) {
  if (!(missed >= RAMP_MIN)) return;
  p.ramp = { k: cl(Math.round(missed / 6), 2, 8), g: 0, m: missed } as Ramp;
}
// Tonight's limit (minutes): 18 the first game, rising to 34 by the last; none once lifted.
export const rampCap = (p: any): number => (p?.ramp && !p.ramp.lift ? 18 + Math.round((p.ramp.g / p.ramp.k) * 16) : Infinity);
// His injury risk while the limit lasts: ×(1 + 0.6 × hb), ×(1 + 1.2 × hb) if lifted; hb is the medical staff's
// factor (1 for a typical Health budget, lower for a better one).
export const rampRisk = (p: any, hb: number): number => (p?.ramp ? 1 + (p.ramp.lift ? 1.2 : 0.6) * hb : 1);
// A game played on the way back.
export function rampTick(p: any) {
  const r: Ramp | undefined = p?.ramp;
  if (!r) return;
  r.g++;
  if (r.g >= r.k) delete p.ramp;
}
// Your call: lift the limit (or put it back).
export function liftRamp(p: any, lift: boolean) {
  if (!p?.ramp) return;
  if (lift) p.ramp.lift = true;
  else delete p.ramp.lift;
}
export const rampLine = (p: any): string => {
  const r: Ramp | undefined = p?.ramp;
  if (!r) return '';
  const left = r.k - r.g;
  return r.lift
    ? 'Back from injury (' + r.m + ' games missed): you lifted his minutes limit; a higher risk of getting hurt again'
    : 'Back from injury (' +
        r.m +
        ' games missed): minutes limit ' +
        rampCap(p) +
        ' next game, full in ' +
        left +
        ' game' +
        (left === 1 ? '' : 's');
};
