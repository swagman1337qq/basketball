// A card for a game or series your team is in: a light wash of your team's main color (and a border in it)
// instead of the gold accent. `null` when none of the teams is yours.
export function mineTint(T: any[], isMine: (tid: number) => boolean, ...tids: (number | null | undefined)[]): { border: string; background: string } | null {
  const tid = tids.find(t => t != null && isMine(t)); if (tid == null) return null;
  const c = T[tid]?.colors?.[0] || 'var(--color-accent)';
  return { border: '1px solid color-mix(in srgb, ' + c + ' 60%, transparent)', background: 'color-mix(in srgb, ' + c + ' 16%, var(--color-bg))' };
}
