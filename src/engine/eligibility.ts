// National-team eligibility, worked out from where he was born and raised and his heritage
// (the same rules as a new player: Game.genPlayer). Countries added by hand in God Mode stay.
const AUTO = new Set(['citizen by birth', 'born there', 'through parents', 'naturalized', 'U.S. citizen (tribal nation)']);
export function refreshElig(p: any, C: Record<string, any>) {
  const born = p.born || p.rep, her = p.her || born, raised = p.raised || born;
  const out: { c: string; why: string; manual?: boolean }[] = [], add = (c: string, why: string) => { if (c && C[c] && !out.some(e => e.c === c)) out.push({ c, why }); };
  if (her === 'XN') add('US', 'U.S. citizen (tribal nation)');
  else {
    if (born === her) add(born, 'citizen by birth'); else if (C[born]?.soli) add(born, 'born there');
    if (her !== born) add(her, 'through parents');
    if (raised !== born && raised !== her) add(raised, 'naturalized');
  }
  // Keep what was added by hand (or for a reason these rules don't produce, like grandparents).
  (p.elig || []).forEach((e: any) => { if ((e.manual || !AUTO.has(e.why)) && !out.some(x => x.c === e.c)) out.push(e); });
  if (!out.length) add(born, 'citizen by birth');
  p.elig = out;
  if (!out.some(e => e.c === p.rep)) p.rep = out.some(e => e.c === her) ? her : out[0].c;
}
