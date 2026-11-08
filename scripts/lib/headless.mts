// Headless leagues for the test and fitting scripts: a seeded league with the AI running every team, a regular
// season, and an offseason (play-in, playoffs, review, lottery, draft, free agency, opening night).
import { Game } from '../../src/engine/Game';
import { seasonMax } from '../../src/engine/cba';
import { seasonReview } from '../../src/engine/frontOffice';
import { mulberry32 } from '../../src/engine/rng';

export function newLeague(seed: number): any {
  Math.random = mulberry32(seed);
  const g: any = Game.create(seed, [0]);
  g.setState({
    easy: { lineup: true, tactics: true, cap: true, fa: true, draft: true, fire: true, scouting: true, injuries: true },
    ownerFiring: false,
    gmSetup: false,
  });
  return g;
}
export const clr = (g: any) =>
  g.setState({ mailRead: g.state.mailSeq || 0, letterUnread: null, letterOpen: null, notices: [], dialog: null });
export const rostered = (g: any) => (Object.values(g.state.rosters).flat() as number[]).map(id => g.db.P[id]).filter(Boolean);

export async function playRegular(g: any) {
  for (let i = 0; i < 400; i++) {
    clr(g);
    const d0 = g.state.day;
    await g.sim(200);
    if (g.state.day === d0 || g.state.phase !== 'regular') break;
  }
}

// From the end of the regular season to the next opening night, every decision left to the AI.
export function offseason(g: any) {
  const P = g.db.P;
  clr(g);
  g.startPlayin();
  clr(g);
  g.simPlayin();
  clr(g);
  g.simPlayin();
  clr(g);
  g.startPlayoffs();
  for (let i = 0; i < 60 && g.state.phase === 'playoffs'; i++) {
    clr(g);
    g.simPo('all');
  }
  g.setState({ letterOpen: null });
  if (g.state.phase === 'playoffs' || g.state.phase === 'review') {
    clr(g);
    try {
      seasonReview(g);
    } catch {
      /* the review needs a GM; spectating leagues skip it */
    }
  }
  clr(g);
  g.runLottery();
  for (let i = 0; i < 200 && g.state.phase === 'draft' && g.state.pi < g.state.picks.length; i++) {
    clr(g);
    const pi0 = g.state.pi;
    g.aiDraft(false);
    if (g.state.pi === pi0) {
      const taken = new Set(g.state.picks.map((x: any) => x.pid));
      const best = g.db.cls[g.Y]
        .filter((id: number) => !taken.has(id))
        .sort((a: number, b: number) => (g.db.rank[a] ?? 999) - (g.db.rank[b] ?? 999))[0];
      g.draftPick(best);
      if (g.state.pi === pi0) break;
    }
  }
  clr(g);
  g.startPreFA();
  clr(g);
  g.startFA();
  for (let d = 0; d < 6; d++) {
    clr(g);
    g.advanceFA(5);
  }
  for (let i = 0; i < 6 && g.state.phase === 'fa'; i++) {
    g.setState({ offerSheets: [], agentCalls: [] });
    clr(g);
    g.startPreseason();
  }
  clr(g);
  g.startSeason();
  if (g.state.phase !== 'regular') {
    const me = g.state.me;
    g.setState((st: any) => ({
      rosters: {
        ...st.rosters,
        [me]: st.rosters[me]
          .slice()
          .sort((a: number, b: number) => P[b].ovr - P[a].ovr)
          .slice(0, seasonMax(st)),
      },
    }));
    clr(g);
    g.startSeason();
  }
}
