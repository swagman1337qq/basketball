// Reproduce a named card's held-out before/after comparison using the current
// engine. Example: node --import tsx scripts/cardAccuracy.mts 36 80
// The optional second argument replaces games per NBA world. College cards use
// the recorded held-out identity set. No save is opened or modified.
import fs from 'node:fs';
import { evaluateCard } from './cardAccuracyHarness.mts';
import { applyCard } from '../src/engine/playerCard';
import { seasonLine } from '../src/engine/amateurStats';

const audit = JSON.parse(fs.readFileSync(new URL('../docs/PLAYER_CARD_REFINEMENT_2026-11-27.json', import.meta.url), 'utf8'));
const index = Number(process.argv[2] ?? 36),
  record = audit.cards.find((x: any) => x.index === index);
if (!record) throw new Error('Choose a reviewed card index from 0 through 36.');
const options = record.revised.validation.options,
  college = record.revised.historical.league === 'NCAA';
const compare = (card: any) => {
  if (!college)
    return evaluateCard(card, {
      minutes: record.reference.target.min,
      games: Number(process.argv[3] ?? options.games),
      seeds: options.seeds,
      offset: options.offset,
      rank: record.reference.target.min >= 30 ? 1 : record.reference.target.min >= 22 ? 3 : 7,
      details: false,
      advanced: false,
    });
  const school = { 19: 'Kansas', 22: 'UNLV', 23: 'North Carolina' }[index],
    sums: Record<string, number> = {};
  const n = options.identities,
    startId = options.startId;
  for (let id = startId; id < startId + n; id++) {
    const p: any = { id, age: card.age, r: {}, intg: { feel: 50, poise: 50 }, pers: {}, pot: card.pot, from: { lg: 'NCAA', team: school } };
    const error = applyCard(p, card, {});
    if (error) throw new Error(error);
    // A draft-night college reference ends in the named draft year.
    const year = Number(record.revised.historical.season.slice(0, 4)) + 1;
    const line = seasonLine(p, year, 0).disp;
    for (const [k, v] of Object.entries(line)) if (typeof v === 'number') sums[k] = (sums[k] || 0) + v;
  }
  const rates = Object.fromEntries(
    ['pts', 'fga', 'tpa', 'fta', 'orb', 'drb', 'ast', 'stl', 'blk', 'tov', 'pf'].map(k => [k, (sums[k] / sums.min) * 40]),
  );
  return {
    identities: n,
    startId,
    minutesPerIdentity: sums.min / n,
    per40: { ...rates, reb: rates.orb + rates.drb },
    fg: sums.fgm / sums.fga,
    tp: sums.tpa ? sums.tpm / sums.tpa : 0,
    ft: sums.ftm / sums.fta,
  };
};
console.log(
  JSON.stringify(
    {
      index,
      label: record.label,
      options,
      reference: record.reference.target,
      previous: compare(record.previous),
      revised: compare(record.revised),
    },
    null,
    2,
  ),
);
