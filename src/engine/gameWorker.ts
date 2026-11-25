// A background game player (2026-11-25, gamePool.ts): plays one game with the same engine the page uses (sim.ts
// GameSim) and sends back its result. It never sees the league: only the two teams as the page prepared them
// (Game.simTeam) and the league norms. Everything the result means (stats, records, injuries) is recorded by the page.
import { GameSim, type Norms, type SimTeam } from './sim';

export interface GameJob {
  id: number;
  home: SimTeam;
  away: SimTeam;
  norms: Norms;
}
// `at`: when it finished (epoch ms: timeOrigin + now, comparable across threads), so the page can tell whether the
// result had to wait for it (Game.runPooledDay).
export type GameReply = { id: number; res: any; at: number } | { id: number; error: string };

self.onmessage = (e: MessageEvent<GameJob>) => {
  const { id, home, away, norms } = e.data;
  try {
    const res = new GameSim(home, away, { record: true, norms }).run();
    (self as any).postMessage({ id, res, at: performance.timeOrigin + performance.now() } as GameReply);
  } catch (error) {
    (self as any).postMessage({ id, error: String((error as any)?.message || error) } as GameReply);
  }
};
