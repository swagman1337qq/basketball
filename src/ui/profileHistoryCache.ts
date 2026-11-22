import { sameBrowseRecord } from './simulationBrowseCopy';
import type { StatsContext } from './profileStatsProtocol';
import type { ProfileSeasonData } from './profileStatsData';

// Worker-only inputs. Keep one immutable historical projection, not a copy of
// every league calculation. Current seasons and current team records are absent.
function historicalInputs(context: StatsContext) {
  const year = context.year;
  const past = (map: any) => Object.fromEntries(Object.entries(map || {}).filter(([key]) => parseInt(key, 10) < year));
  const players: any[] = [];
  for (const [id, p] of Object.entries(context.players)) {
    const stats = (p.stats || []).filter((r: any) => r.season < year),
      ccp = past(p.ccpS);
    if (stats.length || Object.keys(ccp).length) players.push([id, p.id, p.age, p.pos, p.gone, p.retired?.season, stats, ccp, past(p.dkS)]);
  }
  return {
    year,
    firstSeason: context.firstSeason,
    gv: context.state.gv,
    teams: context.state.teams.map(t => t.tid),
    players,
    totals: past(context.state.tstatsHist),
    rapm: past(context.rapm),
    records: Object.fromEntries(
      Object.entries(context.state.teamHist || {}).map(([id, rows]: [string, any]) => [
        id,
        rows.filter((r: any) => r.season < year).map((r: any) => [r.season, r.w, r.l]),
      ]),
    ),
  };
}

export class ProfileHistoryCache {
  private inputs?: ReturnType<typeof historicalInputs>;
  private checked?: StatsContext;
  private rows = new Map<string, ProfileSeasonData>();
  prepare(context: StatsContext) {
    if (this.checked === context) return;
    const inputs = historicalInputs(context);
    if (!this.inputs || !sameBrowseRecord(this.inputs, inputs)) {
      this.rows.clear();
      this.inputs = inputs;
    }
    this.checked = context;
  }
  releaseContext() {
    // Retain only historical inputs and small display results while paused.
    this.checked = undefined;
  }
  private key(pid: number, year: number, po: boolean, ccp: boolean) {
    return [pid, year, +po, +ccp].join(':');
  }
  get(pid: number, year: number, po: boolean, ccp: boolean) {
    return this.checked && year < this.checked.year ? this.rows.get(this.key(pid, year, po, ccp)) : undefined;
  }
  remember(pid: number, year: number, po: boolean, ccp: boolean, value: ProfileSeasonData) {
    if (!this.checked || year >= this.checked.year) return;
    const key = this.key(pid, year, po, ccp),
      copy = structuredClone(value);
    for (const object of [copy.advanced, copy.pg, copy.tot]) if (object && typeof object === 'object') Object.freeze(object);
    Object.freeze(copy);
    if (!this.rows.has(key) && this.rows.size >= 512) this.rows.delete(this.rows.keys().next().value!);
    this.rows.set(key, copy);
  }
}
