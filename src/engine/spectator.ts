// Spectator Mode: you don't run a team. Every team belongs to the AI (s.managed is empty, so isUser is
// false for all of them) and runs on the same roster, trade, free agency, draft, lineup and
// development logic as any AI club. Nothing stops to ask you anything: notices, owner letters, offers
// and GM reviews are off. The season goes wherever you send it (a day, a week, the champion, the next
// opening night, several seasons), and you can take over any team at any time.
import type { Game } from './Game';
import { DAY } from './cba';
import { seasonReview } from './frontOffice';

const clubKeys = (g: Game): string[] => (g.constructor as any).CLUB_KEYS;

// Hand every team to the AI. Your clubs' front-office records (budget, scouts, staff, inbox...) are
// put aside: take one of those teams back and they return.
export function enterSpectator(g: Game) {
  g.setState((s: any) => {
    if (s.spectator) return null;
    const archive = { ...(s.clubArchive || {}), ...(s.clubs || {}) }, top: any = {};
    clubKeys(g).forEach(k => (top[k] = s[k])); archive[s.me] = top;
    const rosters = { ...s.rosters }; (s.managed || []).forEach((t: number) => { rosters[t] = rosters[t].slice().sort((a: number, b: number) => g.db.P[b].ovr - g.db.P[a].ovr);
      rosters[t].forEach((id: number) => { const p = g.db.P[id]; if (p) { delete p.dev; delete p.minMin; delete p.padding; p.protect = false; } }); });
    const had = (s.managed || []).map((t: number) => s.teams[t].abbr).join(' · ');
    return {
      spectator: true, managed: [], clubs: {}, clubArchive: archive, rosters, notices: [], dialog: null, letterOpen: null, letterUnread: null, gmOffer: null, unemployed: false,
      inOffers: [], offers: null, offerSheets: [], decide: {}, extPlan: [], offered: {}, gmSetup: false, tMine: [], tTheirs: [], tkMine: [], tkTheirs: [], tMsg: null, screen: 'dash', modal: false, teamModal: null, boxId: null,
      lgLog: [{ day: s.day, type: 'Career', teams: had, text: 'Spectator Mode: the AI runs every team' + (had && s.gm ? ' (' + s.gm.name + ' stepped away from the ' + had + ')' : '') }, ...(s.lgLog || [])],
    };
  });
}

// Leave Spectator Mode as the GM of `tid`. A team you ran before gets its front-office records back;
// a new one starts fresh. A league that began in Spectator Mode sets up your GM profile first. The
// owner doesn't judge you on a season you only joined (graceY: no firing at this season's review).
export function manageTeam(g: Game, tid: number) {
  if (g.spectating) g.stopSim();
  g.setState((s: any) => {
    if (!s.spectator || !s.teams[tid]) return null;
    const archive = { ...(s.clubArchive || {}) }, top: any = {};
    clubKeys(g).forEach(k => (top[k] = s[k])); archive[s.me] = top; // what's at the top level belongs to s.me
    const club = archive[tid] || g.defaultClub(1); delete archive[tid];
    const T = s.teams[tid], others = s.teams.filter((t: any) => t.tid !== tid);
    return {
      ...club, spectator: false, managed: [tid], me: tid, clubs: {}, clubArchive: archive, pid: s.rosters[tid][0], tTid: others[0]?.tid ?? 0, screen: 'dash', modal: false, teamModal: null,
      gmSetup: !s.gm, unemployed: false, gmOffer: null, notices: [], graceY: g.Y,
      lgLog: [{ day: s.day, type: 'Career', teams: T.abbr, text: (s.gm ? s.gm.name : 'A new GM') + ' took over the ' + T.region + ' ' + T.name }, ...(s.lgLog || [])],
    };
  });
}

// ── The driver ──
// Where to stop: a number of steps (a day, a play-in or playoff round, the next offseason event), a
// number of days (regular season), the end of the regular season, the end of the draft, the next
// opening night, or a number of seasons (each ends when a champion is crowned, so the standings,
// playoffs and awards are there to read).
export type SpecGoal = { steps?: number; days?: number; regEnd?: boolean; seasons?: number; draft?: boolean; opening?: boolean };
const crowned = (s: any) => s.phase === 'playoffs' && s.po && s.po.champ != null;
const draftDone = (s: any) => s.phase === 'draft' && s.pi >= (s.picks || []).length;

// One step from wherever the season is: games in the regular season (up to `days`), a round of the
// play-in or playoffs, the next offseason event. False when nothing moved.
async function step(g: Game, days: number): Promise<boolean> {
  const s: any = g.state, v = g.version, G: any = g.constructor;
  if (s.phase === 'regular') {
    if (g.gamesPlayed(s) < 82) await g.sim(Math.max(1, days)); else g.startPlayin();
  } else if (s.phase === 'playin') { if (g.playinPending(s.playin).length) g.simPlayin(); else g.startPlayoffs(); }
  else if (s.phase === 'playoffs') { if (!crowned(s)) g.simPo('round'); else seasonReview(g); }
  else if (s.phase === 'lottery') g.runLottery();
  else if (s.phase === 'draft') { if (!draftDone(s)) g.aiDraft(false); else if (!s.preFA) g.startPreFA(); else g.startFA(); }
  else if (s.phase === 'fa') { if (g.faDayOf(s) < G.FA_END) g.advanceFA(Math.min(15, G.FA_END - g.faDayOf(s))); else g.startPreseason(); }
  else if (s.phase === 'preseason') g.startSeason();
  if (g.state.notices?.length || g.state.letterOpen || g.state.letterUnread) g.setState({ notices: [], letterOpen: null, letterUnread: null }); // nothing waits on you
  return g.version !== v;
}

// Run the season toward `goal`, stoppable at any moment (the Stop button). The screen redraws a few
// times a second while it runs.
export async function spectate(g: Game, goal: SpecGoal) {
  if (!g.state.spectator || g.spectating || g.busy) return;
  g.spectating = true; g.specStop = false;
  const s0: any = g.state, start = { day: s0.day, gp: g.gamesPlayed(s0) };
  let seasons = 0, steps = 0, wasCrowned = crowned(s0), guard = 0;
  const label = goal.steps ? 'Simulating' : goal.seasons ? (goal.seasons === 1 ? 'Simulating to the champion' : 'Simulating ' + goal.seasons + ' seasons') : goal.opening ? 'Simulating to opening night' : goal.draft ? 'Simulating through the draft' : goal.regEnd ? 'Simulating to the end of the regular season' : 'Simulating';
  g.specLabel = label;
  const show = () => { const s: any = g.state; if (!s.simming || s.simming.label !== label) g.setState({ simming: { left: 0, label, seasons: goal.seasons ? goal.seasons - seasons : 0 } }); };
  try {
    while (!g.specStop && guard++ < 2000) {
      const s: any = g.state;
      if (goal.days != null && (s.phase !== 'regular' || g.gamesPlayed(s) >= 82 || s.day - start.day >= goal.days)) break;
      if (goal.regEnd && s.phase === 'regular' && g.gamesPlayed(s) >= 82) break;
      if (goal.regEnd && s.phase !== 'regular') break;
      if (goal.steps != null && steps >= goal.steps) break;
      if (goal.draft && draftDone(s)) break;
      if (goal.opening && s.phase === 'regular' && g.gamesPlayed(s) === 0 && s !== s0) break;
      if (goal.seasons && seasons >= goal.seasons) break;
      show();
      const days = goal.steps != null ? 1 : goal.days != null ? goal.days - (s.day - start.day) : 82;
      const moved = await step(g, days); steps++;
      if (!moved) break; // nothing could move: stop rather than spin
      const c = crowned(g.state); if (c && !wasCrowned) seasons++; wasCrowned = c;
      await new Promise(r => setTimeout(r, 0));
    }
  } finally {
    g.spectating = false; g.specLabel = '';
    if (g.state.simming) g.setState({ simming: null });
  }
}
// The regular-season day the trade deadline falls on (for "to the trade deadline").
export const deadlineDay = () => DAY.TRADE_DEADLINE;
