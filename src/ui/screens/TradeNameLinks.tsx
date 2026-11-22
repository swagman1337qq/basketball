import { useMemo, type ReactNode } from 'react';
import type { VM } from '../vm';
import { entityNameIndex } from '../entityNameIndex';

type Target = { kind: 'player' | 'team'; id: number; name: string };
export type TradeText = (value: string | null | undefined) => ReactNode;

/** Names in trade explanations retain their text and open the same pages as roster links. */
export function useTradeNameLinks(vm: VM): TradeText {
  const { gm, s } = vm.ctx;
  const index = useMemo(() => {
    const targets = new Map<string, Target | null>();
    const add = (name: string, target: Target) => {
      if (!name) return;
      const previous = targets.get(name);
      // Shared city names and duplicate player names cannot identify one profile by themselves.
      targets.set(name, previous === undefined || (previous?.kind === target.kind && previous.id === target.id) ? target : null);
    };
    for (const team of s.teams) {
      const name = team.region + ' ' + team.name;
      const target: Target = { kind: 'team', id: team.tid, name };
      for (const alias of [name, team.abbr, team.region, team.name]) add(alias, target);
    }
    for (const player of Object.values(gm.db.P) as any[]) {
      if (!player.gone) add(player.name, { kind: 'player', id: player.id, name: player.name });
    }
    const names = [...targets.keys()].filter(name => targets.get(name)).sort((a, b) => b.length - a.length);
    return { targets, find: entityNameIndex(names) };
  }, [gm, gm.saveVersion, s.teams]);

  return value => {
    if (!value) return value;
    const parts: ReactNode[] = [];
    let end = 0;
    for (const match of index.find(value)) {
      const start = match.start;
      if (start > end) parts.push(value.slice(end, start));
      const target = index.targets.get(match.name)!;
      parts.push(
        <button
          data-simulation-browse
          key={start}
          type="button"
          className="trade-entity-link"
          data-pid={target.kind === 'player' ? target.id : undefined}
          data-team-id={target.kind === 'team' ? target.id : undefined}
          title={'Open ' + target.name}
          onClick={event => {
            event.stopPropagation();
            if (target.kind === 'player') vm.ctx.open(target.id);
            else vm.ctx.openTeam(target.id);
          }}
        >
          {match.name}
        </button>,
      );
      end = start + match.name.length;
    }
    if (end === 0) return value;
    if (end < value.length) parts.push(value.slice(end));
    return parts;
  };
}
