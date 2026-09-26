// The tutorial: a small coach card that walks a newcomer through the game one idea at a
// time. It only starts when you press Tutorial, and first asks: quick tour, in-depth tour
// (every tab and rule), or no thanks. Easy-mode automation is offered at the end. Each step takes
// you to the right screen and lights up what it's talking about, so there's little to read.
import { useEffect } from 'react';
import type { VM } from './vm';
import { EASY } from '../engine/easy';
import { nums } from '../engine/cba';
import { fmtMoney } from '../engine/capModel';

interface Step { title: string; lines: string[]; screen?: string; target?: string; big?: string; easy?: boolean; section?: string; player?: boolean }

// The quick tour: the dozen ideas you need to play.
function quickSteps(vm: VM): Step[] {
  const { gm, s, T } = vm.ctx, N = nums(gm), me = T[s.me], M = fmtMoney;
  return [
    { section: 'Basics', title: 'Welcome, General Manager', lines: ['You run the ' + me.region + ' ' + me.name + '.', 'Win games, grow your players, keep the owner happy.'], big: '🏀' },
    { section: 'Basics', title: 'Basketball in 20 seconds', lines: ['Five players per side. A basket is 2 points, 3 from behind the arc, 1 for a free throw.', 'Most points after 48 minutes wins.'], big: '2 · 3 · 1' },
    { section: 'Basics', title: 'Your players', lines: ['OVR = how good he is now. POT = how good he could become. Both out of 100.', 'The green block marks your five starters.'], screen: 'roster', target: 'roster-table' },
    { section: 'Basics', title: 'Minutes and lineup', lines: ['Drag players up or down, or let your assistant coaches decide.'], screen: 'roster', target: 'advice' },
    { section: 'Season', title: 'Playing games', lines: ['Play a day, a week or a month at a time. 82 games, then the playoffs.', 'Click any step in this bar (Play-in, Playoffs, Lottery…) to see it as if the season ended today.'], target: 'phase' },
    { section: 'Season', title: 'Making the playoffs', lines: ['Top 6 in each conference go straight in. 7th to 10th play a mini play-in.'], screen: 'standings' },
    { section: 'Money', title: 'The salary cap', lines: ['Every team has a spending line: ' + M(N.CAP) + ' this season.', 'Under it you can sign anyone. Over it you need special exceptions.'], screen: 'roster', target: 'capbar' },
    { section: 'Money', title: 'Tax and aprons', lines: ['Past ' + M(N.TAX) + ' the owner pays a luxury tax.', 'Past the aprons (' + M(N.AP1) + ', ' + M(N.AP2) + ') your options shrink.'], screen: 'roster', target: 'capbar' },
    { section: 'Money', title: 'Your own players are special', lines: ['“Bird rights”: you can always re-sign your own players, even over the cap.'], big: '♻' },
    { section: 'Building', title: 'Signing free agents', lines: ['Unsigned players live here. Press Sign and the dialog tells you if he’ll say yes.'], screen: 'fa', target: 'fa-table' },
    { section: 'Building', title: 'Trades', lines: ['Pick players on each side. The meter shows if they’d accept; the league checks salaries match.'], screen: 'trade' },
    { section: 'Building', title: 'The draft lottery', lines: ['Teams that miss the playoffs get lottery balls for the top young players.', 'Losing on purpose doesn’t pay: the three worst teams get fewer balls.'], screen: 'lottery' },
    { section: 'Building', title: 'The draft', lines: ['Then each team picks a player. Scouting reports tell you who’s worth it.'], screen: 'draft' },
    { section: 'Your job', title: 'The owner', lines: ['After each season the owner writes you a letter. Miss his goals too often and you’re fired.'], screen: 'owner' },
    { section: 'Your job', title: 'Your contract', lines: ['You’re on a contract too. A happy owner offers an extension; an unhappy one lets it run out.'], screen: 'career' },
  ];
}

// The in-depth tour: every tab, and every rule the game uses.
function deepSteps(vm: VM): Step[] {
  const { gm, s, T } = vm.ctx, N = nums(gm), me = T[s.me], M = fmtMoney, multi = s.managed.length > 1 || s.god;
  return [
    { section: 'Basics', title: 'Welcome, General Manager', lines: ['You are the GM and head coach of the ' + me.region + ' ' + me.name + '.', 'This tour visits every tab and explains every rule. Skip any time; the menu’s Tutorial button brings it back.'], big: '🏀' },
    { section: 'Basics', title: 'Basketball in 20 seconds', lines: ['Five players per side. 2 points a basket, 3 from behind the arc, 1 a free throw. Most points after 48 minutes wins.', 'Positions: PG and SG are guards (handle, shoot), SF and PF forwards, C the center (rebounds, blocks).'], big: '2 · 3 · 1' },
    { section: 'Basics', title: 'The season bar', lines: ['Regular season → Play-in → Playoffs → Lottery → Draft → Free agency → Preseason.', 'Buttons on the right move time forward. Click any step to see it (mid-season: as if the season ended today).'], target: 'phase' },
    { section: 'Basics', title: 'The menu', lines: ['Tabs are grouped: League, Team, Management. “« Collapse” shrinks the menu to labeled icons.', 'The search box at the top finds any player in the world.'] },

    { section: 'League tabs', title: 'Dashboard', lines: ['Your next game, the standings around you, news, and your inbox.', 'The inbox is where the owner and players ask you to decide things (bonuses, payroll orders). Answer them.'], screen: 'dash' },
    ...(multi ? [{ section: 'League tabs', title: 'My teams', lines: ['You can run more than one club. Switch between them here or with the team picker under your team name.'], screen: 'teams' }] : []),
    { section: 'League tabs', title: 'Standings', lines: ['Win percentage decides seeding. Solid line: top 6 go straight to the playoffs. Dashed line: 7–10 go to the play-in.', 'Switch between conference and division views. The West is always on the left.'], screen: 'standings' },
    { section: 'League tabs', title: 'Schedule', lines: ['Your 82 games: results so far and who’s next, home or away.'], screen: 'schedule' },
    { section: 'League tabs', title: 'Transactions', lines: ['Every signing, trade, release, award and firing in the league, with a filter.'], screen: 'tx' },
    { section: 'League tabs', title: 'Play-in', lines: ['7 hosts 8: the winner is the 7 seed. 9 hosts 10: the loser is out.', 'The loser of 7 v 8 then hosts the winner of 9 v 10 for the 8 seed.'], screen: 'playin' },
    { section: 'League tabs', title: 'Playoffs', lines: ['Four best-of-7 rounds in each conference, then the Finals. Home court: 2-2-1-1-1 to the better seed.'], screen: 'playoffs' },
    { section: 'League tabs', title: 'The draft lottery (2027 rules)', lines: ['16 teams, 37 balls: 3 for teams that missed the play-in, 2 for the three worst teams and the 9/10 play-in seeds, 1 for 7 v 8 losers.', 'All 16 picks are drawn. The worst three can’t fall below 12th. No team’s own pick can be No. 1 two years running.'], screen: 'lottery' },
    { section: 'League tabs', title: 'Awards', lines: ['MVP, Defensive Player, Rookie, Sixth Man, Most Improved, Coach of the Year and the All-League teams, voted after game 82.'], screen: 'awards' },
    { section: 'League tabs', title: 'Hall of Fame', lines: ['Great careers are inducted after retirement: titles, awards and career numbers all count.'], screen: 'hof' },
    { section: 'League tabs', title: 'Stats', lines: ['Players (every season, basic and advanced), teams, league averages, and league history: champions, runners-up and awards.'], screen: 'stats' },
    { section: 'League tabs', title: 'Cap outlook', lines: ['The real salary cap since 1984–85 and the projected cap for every future season. The cap grows up to 10% a year.'], screen: 'caps' },
    { section: 'League tabs', title: 'Settings', lines: ['Layout and light/dark theme, Easy mode (automation), God Mode (edit anything, see true ratings), owner firing on/off.', 'Also: a mandatory retirement age, league expansion, and saving your league to a file.'], screen: 'settings' },
    { section: 'League tabs', title: 'Press room', lines: ['What owners and GMs around the league say on the record: reviews, hirings, firings, trades.'], screen: 'press' },

    { section: 'Your team', title: 'Roster', lines: ['The header: record, rank, team rating, point margin (MOV), average age, roster spots, payroll, cap and profit.', 'Green block = starter. Drag rows to change the order; the numbers are jersey numbers.'], screen: 'roster', target: 'roster-table' },
    { section: 'Your team', title: 'Minutes', lines: ['Type minutes per player (the team always plays 240). “Keep sorted” reorders by rating; “Reset playing time” goes back to automatic.', '“Play through injuries” lets hurt players play; they perform worse and risk more.'], screen: 'roster', target: 'roster-table' },
    { section: 'Your team', title: 'Ask your assistants', lines: ['One click: your staff suggests starters and who should play less. Apply it or ignore it.'], screen: 'roster', target: 'advice' },
    { section: 'Your team', title: 'Roster rules', lines: ['15 standard contracts during the season (21 allowed in the offseason), at least 14, plus up to 3 two-way players.'], screen: 'roster', target: 'capbar' },
    { section: 'Your team', title: 'A player’s page', lines: ['Click any name. OVR and POT (out of 100), every rating, stats by season, contract, family, and a scouting report.'], player: true },
    { section: 'Your team', title: 'Badges', lines: ['Badges are special skills (a deadeye shooter, a lockdown defender…). They change how he plays in games.', 'Hover a badge to read what it does.'], player: true },
    { section: 'Your team', title: 'Personality', lines: ['Traits like Egotistic, Legacy-driven, Team player or Selfish change how a player feels and plays. Hover one to read it; click it to find others.', 'For players you don’t have, it’s what your scouts tell you. You find out for sure once he’s yours.'], player: true },
    { section: 'Your team', title: 'Player happiness (mood)', lines: ['Hover the mood chip: his priorities (money, winning, playing time, loyalty, fame) and the + / − reasons.', 'Happy players re-sign and take less. Unhappy ones ask out and walk in free agency.'], player: true },
    { section: 'Your team', title: 'Depth chart', lines: ['Your five positions and who backs up each one, with a warning when someone plays out of position.'], screen: 'depth' },
    { section: 'Your team', title: 'Development', lines: ['Ratings change every month. Young players (under 25) grow toward POT; over 30 they decline.', 'A bigger coaching budget and real minutes (here or in the G League) help them grow.'], screen: 'dev' },
    { section: 'Your team', title: 'Tactics', lines: ['Pace, offense (inside, perimeter, pace-and-space…) and defense (drop, switch, aggressive).', 'The “roster fit” number says how well the settings suit your players.'], screen: 'tactics' },
    { section: 'Your team', title: 'Finances', lines: ['Money in: tickets, TV and sponsors. Money out: salaries, luxury tax and your budget.', 'Budgets: Coaching (growth), Health (injuries), Facilities (slow build, players and fans like it), Scouting (accuracy). Ticket price trades money for full seats.'], screen: 'fin' },

    { section: 'The salary cap', title: 'The cap', lines: ['The cap this season is ' + M(N.CAP) + '. It’s a “soft” cap: under it, sign anyone with the room you have.', 'Over it you can still add players, but only through exceptions and trades.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'The luxury tax', lines: ['Payroll above ' + M(N.TAX) + ' makes the owner pay a tax on every dollar over, at rising rates.', 'Pay it three seasons in four and you’re a “repeater”: the rates jump.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'The first apron', lines: ['Above ' + M(N.AP1) + ': only the smaller taxpayer mid-level exception, and in trades you can’t take back more salary than you send.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'The second apron', lines: ['Above ' + M(N.AP2) + ': no mid-level at all, no combining salaries in trades, your pick seven years out is frozen.', 'Three seasons of five above it and your first-round pick moves to the end of the round.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Bird rights', lines: ['Re-sign your own free agents over the cap. Full Bird after 3 seasons with you (up to the max), Early Bird after 2, Non-Bird after 1.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Exceptions', lines: ['Mid-level (' + M(N.NTMLE) + ', smaller for taxpayers), bi-annual, room exception, minimum contracts, disabled-player exception.', 'Traded player exceptions: send out more salary than you take back and you keep the difference for a year.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Options', lines: ['Player option: the player decides whether to stay for the last year. Team option: you decide.', 'Rookie deals have team options in years 3 and 4. Decide before free agency.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Restricted free agents', lines: ['Offer your young player a qualifying offer and he becomes “restricted”: other teams can offer him a deal, and you get to match it.', 'Answer offer sheets on the Cap sheet before preseason.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Bonuses (incentives)', lines: ['Add bonuses to a contract: points per game, games played, playoffs, All-League…', '“Likely” bonuses (he hit it last season) count against the cap. “Unlikely” ones don’t, which is how teams squeeze in extra pay.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Special contracts', lines: ['Two-way (3 per team, NBA and G League, up to 50 games), Exhibit 10 (training camp; a bonus if he joins your G League team), 10-day deals (from January).', 'Maximums rise with years in the league; MVPs and All-League players can earn the “supermax”.'], screen: 'capsheet' },
    { section: 'The salary cap', title: 'Releasing players', lines: ['Waive a player and you still owe his salary: it stays on your cap as “dead money”, or spread over more years with the stretch provision.'], screen: 'capsheet' },

    { section: 'Building the team', title: 'Trade', lines: ['Pick players and draft picks on both sides. The meter shows how close they are to saying yes.', 'Each AI team has a plan (contending, rebuilding, in between) and values players and picks differently.'], screen: 'trade' },
    { section: 'Building the team', title: 'Trade rules', lines: ['Salaries must match (roughly 125% plus a cushion when over the cap), newly signed players can’t be traded for a while, and trades stop at the deadline in February.'], screen: 'trade' },
    { section: 'Building the team', title: 'Free agency', lines: ['Opens July 1. Each player has an asking price and decides on money, winning, role and market size.', 'Tags show who’s playing in the G League and who went undrafted. Their price drops the longer they wait.'], screen: 'fa', target: 'fa-table' },
    { section: 'Building the team', title: 'The G League', lines: ['Every NBA team has a minor-league affiliate. Unsigned players can play there ($' + '40,500 a season) and you can call them up by signing them.', 'Your two-way players split time there. Minutes there help young players grow.'], screen: 'fa' },
    { section: 'Building the team', title: 'Draft', lines: ['Two rounds, 60 picks. The big board shows your scouts’ estimates (±, narrower with a bigger scouting budget).', 'Your scouts and assistant GM suggest picks. Undrafted players become free agents.'], screen: 'draft' },
    { section: 'Building the team', title: 'Shortlist', lines: ['Your watchlists: add players from anywhere and track them in one place.'], screen: 'short' },
    { section: 'Building the team', title: 'Scouting', lines: ['Send scouts to regions of the world. Their reports get more detailed the longer they watch a player.', 'Every player you’ve scouted has a full report: measurements, grades, strengths, weaknesses and a comparison.'], screen: 'scouting' },
    { section: 'Building the team', title: 'Overseas', lines: ['Hundreds of players in leagues abroad (Spain, Türkiye, Greece, Australia, China…). Their stats are translated to NBA terms.', 'To sign one, you pay his club a buyout (up to $0.85M doesn’t count against the cap). You can also send a struggling player abroad to rebuild his confidence.'], screen: 'overseas' },

    { section: 'Your job', title: 'The owner', lines: ['Your boss. Each owner has a personality, written demands, a payroll ceiling and a job-security score.', 'Break his written conditions and you can be fired at the end of the season.'], screen: 'owner' },
    { section: 'Your job', title: 'Owner personalities', lines: ['Win-Now Spender: wants a contender and pays. Frugal Profit-Seeker: wants a profit, no tax. Asset Hoarder: protect the picks and youth.', 'Hype Focus: full arena and a star. Meddling Micromanager: signs off on trades and wants his favorite player to start.'], screen: 'owner' },
    { section: 'Your job', title: 'Payroll orders and the letter', lines: ['Over the owner’s ceiling, he orders you to cut payroll by the deadline, or he sells players himself.', 'After the playoffs he writes you a letter: what went right, what went wrong, and your future.'], screen: 'owner' },
    { section: 'Your job', title: 'Your career and contract', lines: ['Reputation comes from your experience and your record. Owners with openings hire based on it.', 'Your contract has years and a salary. Cheap owners pay little even to winners; generous owners pay big to keep a great GM.'], screen: 'career' },
    { section: 'Your job', title: 'Extensions and the job market', lines: ['A happy owner offers an extension; ask him yourself once a season. If your deal runs out and he’s unhappy, you’re out.', 'After each season, jobs open around the league. Apply, or wait for offers.'], screen: 'career' },
  ];
}

const END = (vm: VM): Step => ({ section: 'Finish', title: 'Want some help?', lines: ['Tick anything you’d like handled for you. You can say no to all of it, and change it later in Settings.'], easy: true });

export function tourSteps(vm: VM, mode: string = vm.ctx.s.tourMode || 'quick'): Step[] {
  return [...(mode === 'deep' ? deepSteps(vm) : quickSteps(vm)), END(vm), { section: 'Finish', title: 'You’re ready', lines: ['Press Play a week and see how your team does. Tutorial is always in the menu.'], big: '✓', target: 'phase' }];
}

// The first card: quick tour, the whole thing, or no thanks.
function Chooser({ vm }: { vm: VM }) {
  const { gm } = vm.ctx, q = tourSteps(vm, 'quick').length, d = tourSteps(vm, 'deep').length;
  const pick = (m: string) => gm.setState({ tourMode: m, tour: 0 });
  const opt = (m: string, h: string, sub: string) => <button className="btn btn-secondary" onClick={() => pick(m)} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', marginBottom: 6 }}><b>{h}</b><span style={{ display: 'block', fontSize: '12px', color: 'var(--color-neutral-700)', fontWeight: 400 }}>{sub}</span></button>;
  return (
    <div role="dialog" aria-label="Tutorial" style={cardStyle}>
      <div style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 4px' }}>How much do you want to learn?</div>
      <p style={{ margin: '0 0 10px', fontSize: '13.5px' }}>Pick a tour. You can stop at any point.</p>
      {opt('quick', 'Quick tour', q + ' short steps: just enough to start playing.')}
      {opt('deep', 'In-depth tour', d + ' steps: every tab and every rule, from the second apron to the G League.')}
      <button className="btn btn-ghost" onClick={() => gm.setState({ tour: null, tourMode: null })} style={{ width: '100%' }}>No thanks</button>
    </div>
  );
}
const cardStyle = { position: 'fixed', right: 20, bottom: 20, zIndex: 900, width: 'min(400px, calc(100vw - 40px))', background: 'var(--color-bg)', border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 32px rgba(0,0,0,.35)', padding: '14px 16px' } as const;

export function TourOverlay({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx;
  const steps = tourSteps(vm), i = Math.min(s.tour ?? 0, steps.length - 1), st = steps[i];
  useEffect(() => {
    if (!s.tourMode) return;
    if (st.player) { const pid = (s.rosters[s.me] || [])[0]; if (pid != null && !(s.modal && s.pid === pid)) gm.setState({ modal: true, pid, ptab: 'overview', teamModal: null, listModal: null }); return; }
    if (st.screen && (s.screen !== st.screen || s.modal || s.teamModal != null)) gm.setState({ screen: st.screen, modal: false, teamModal: null, listModal: null });
  }, [i, s.tourMode]);
  useEffect(() => {
    const t = setTimeout(() => { document.querySelectorAll('.tour-hl').forEach(e => e.classList.remove('tour-hl')); if (!st.target) return; const el = document.querySelector('[data-tour="' + st.target + '"]'); if (el) { el.classList.add('tour-hl'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 120);
    return () => { clearTimeout(t); document.querySelectorAll('.tour-hl').forEach(e => e.classList.remove('tour-hl')); };
  }, [i, s.screen, s.tourMode]);
  if (!s.tourMode) return <Chooser vm={vm} />;
  const go = (k: number) => gm.setState({ tour: k });
  const end = () => gm.setState({ tour: null, tourMode: null });
  const sections = [...new Set(steps.map(x => x.section))];
  return (
    <div role="dialog" aria-label="Tutorial" style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <select className="input" value={st.section} onChange={e => go(steps.findIndex(x => x.section === e.target.value))} title="Jump to a section" style={{ fontSize: '12px', padding: '2px 6px', minHeight: 26, flex: 1, minWidth: 0 }}>
          {sections.map(x => <option key={x} value={x}>{x}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={end} style={{ fontSize: '12px', padding: '2px 8px' }}>Skip tutorial</button>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--color-neutral-200, #8884)', marginBottom: 8 }}><div style={{ height: 4, borderRadius: 2, width: ((i + 1) / steps.length * 100) + '%', background: 'var(--color-accent)' }} /></div>
      {st.big && <div style={{ fontSize: '30px', textAlign: 'center', margin: '2px 0' }}>{st.big}</div>}
      <div style={{ fontSize: '19px', fontWeight: 600, margin: '2px 0 4px' }}>{st.title}</div>
      {st.lines.map((l, k) => <p key={k} style={{ margin: '0 0 5px', fontSize: '14px', lineHeight: 1.45 }}>{l}</p>)}
      {st.easy && <div style={{ marginTop: 8 }}><EasyToggles vm={vm} compact /></div>}
      <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--color-neutral-600)', flex: 1 }}>{i + 1} of {steps.length}</span>
        {i > 0 && <button className="btn btn-secondary" onClick={() => go(i - 1)} style={{ fontSize: '13px' }}>Back</button>}
        {i < steps.length - 1 ? <button className="btn btn-primary" onClick={() => go(i + 1)} style={{ fontSize: '13px' }}>Next</button> : <button className="btn btn-primary" onClick={end} style={{ fontSize: '13px' }}>Let’s play</button>}
      </div>
    </div>
  );
}

export function EasyToggles({ vm, compact }: { vm: VM; compact?: boolean }) {
  const { gm, s } = vm.ctx, e = s.easy || {};
  const set = (k: string, v: boolean) => gm.setState(st => ({ easy: { ...(st.easy || {}), [k]: v }, ...(k === 'fire' ? { ownerFiring: !v } : {}) }));
  const all = EASY.every(([k]) => e[k]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: compact ? '1fr' : 'repeat(auto-fill,minmax(280px,1fr))', gap: compact ? 2 : 8 }}>
      {EASY.map(([k, label, desc]) => (
        <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', fontSize: compact ? '13px' : '13.5px', padding: compact ? '1px 0' : '6px 8px', border: compact ? 'none' : '1px solid var(--color-divider)', borderRadius: 'var(--radius-sm)' }}>
          <input type="checkbox" checked={!!e[k]} onChange={ev => set(k, ev.target.checked)} style={{ marginTop: 3 }} />
          <span>{label}{!compact && <span style={{ display: 'block', fontSize: '12px', color: 'var(--color-neutral-700)' }}>{desc}</span>}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: compact ? 4 : 0 }}>
        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => EASY.forEach(([k]) => set(k, !all))}>{all ? 'Turn all off' : 'Turn all on'}</button>
      </div>
    </div>
  );
}
