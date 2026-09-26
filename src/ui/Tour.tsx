// The tutorial: a small coach card that walks a newcomer through the game one idea at a
// time. It only starts when you press Tutorial; Skip ends it at any step. Each step takes
// you to the right screen and lights up what it's talking about, so there's little to read.
import { useEffect } from 'react';
import type { VM } from './vm';
import { EASY } from '../engine/easy';
import { nums } from '../engine/cba';
import { fmtMoney } from '../engine/capModel';

interface Step { title: string; lines: string[]; screen?: string; target?: string; big?: string; easy?: boolean }

export function tourSteps(vm: VM): Step[] {
  const { gm, s, T } = vm.ctx, N = nums(gm), me = T[s.me], M = fmtMoney;
  return [
    { title: 'Welcome, General Manager', lines: ['You run the ' + me.region + ' ' + me.name + '.', 'Win games, grow your players, keep the owner happy.'], big: '🏀', easy: true },
    { title: 'Basketball in 20 seconds', lines: ['Five players per side. A basket is 2 points, 3 from behind the arc, 1 for a free throw.', 'Most points after 48 minutes wins.'], big: '2 · 3 · 1' },
    { title: 'Your players', lines: ['OVR = how good he is now. POT = how good he could become. Both out of 100.', 'The green block marks your five starters.'], screen: 'roster', target: 'roster-table' },
    { title: 'Minutes and lineup', lines: ['Drag players up or down, or let your assistant coaches decide.'], screen: 'roster', target: 'advice' },
    { title: 'Playing games', lines: ['Play a day, a week or a month at a time. 82 games, then the playoffs.'], target: 'phase' },
    { title: 'Making the playoffs', lines: ['Top 6 in each conference go straight in. 7th to 10th play a mini play-in.'], screen: 'standings' },
    { title: 'The salary cap', lines: ['Every team has a spending line: ' + M(N.CAP) + ' this season.', 'Under it you can sign anyone. Over it you need special exceptions.'], screen: 'roster', target: 'capbar' },
    { title: 'Tax and aprons', lines: ['Past ' + M(N.TAX) + ' the owner pays a luxury tax.', 'Past the aprons (' + M(N.AP1) + ', ' + M(N.AP2) + ') your options shrink.'], screen: 'roster', target: 'capbar' },
    { title: 'Your own players are special', lines: ['“Bird rights”: you can always re-sign your own players, even over the cap.'], big: '♻' },
    { title: 'Signing free agents', lines: ['Unsigned players live here. Press Sign and the dialog tells you if he’ll say yes.'], screen: 'fa', target: 'fa-table' },
    { title: 'Trades', lines: ['Pick players on each side. The meter shows if they’d accept; the league checks salaries match.'], screen: 'trade' },
    { title: 'The draft', lines: ['Every June the worst teams get the best chance at the top young players.', 'Scouting reports tell you who’s worth it.'], screen: 'draft' },
    { title: 'Money and contracts, all in one place', lines: ['The Cap sheet shows every contract and has a plain-English rulebook at the bottom.'], screen: 'capsheet' },
    { title: 'The owner', lines: ['After each season the owner writes you a letter. Miss his goals too often and you’re fired.'], screen: 'owner' },
    { title: 'You’re ready', lines: ['Press Play a week and see how your team does. Tutorial is always in the menu.'], big: '✓', target: 'phase' },
  ];
}

export function TourOverlay({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, steps = tourSteps(vm), i = Math.min(s.tour ?? 0, steps.length - 1), st = steps[i];
  useEffect(() => {
    if (st.screen && s.screen !== st.screen) gm.setState({ screen: st.screen, modal: false, teamModal: null, listModal: null });
  }, [i]);
  useEffect(() => {
    const t = setTimeout(() => { document.querySelectorAll('.tour-hl').forEach(e => e.classList.remove('tour-hl')); if (!st.target) return; const el = document.querySelector('[data-tour="' + st.target + '"]'); if (el) { el.classList.add('tour-hl'); el.scrollIntoView({ block: 'center', behavior: 'smooth' }); } }, 120);
    return () => { clearTimeout(t); document.querySelectorAll('.tour-hl').forEach(e => e.classList.remove('tour-hl')); };
  }, [i, s.screen]);
  const go = (k: number) => gm.setState({ tour: k });
  const end = () => gm.setState({ tour: null });
  return (
    <div role="dialog" aria-label="Tutorial" style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 900, width: 'min(380px, calc(100vw - 40px))', background: 'var(--color-bg)', border: '2px solid var(--color-accent)', borderRadius: 'var(--radius-lg)', boxShadow: '0 12px 32px rgba(0,0,0,.35)', padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ display: 'flex', gap: 3, flex: 1 }}>{steps.map((_, k) => <span key={k} onClick={() => go(k)} style={{ cursor: 'pointer', height: 4, flex: 1, borderRadius: 2, background: k <= i ? 'var(--color-accent)' : 'var(--color-neutral-200, #8884)' }} />)}</div>
        <button className="btn btn-ghost" onClick={end} style={{ fontSize: '12px', padding: '2px 8px' }}>Skip tutorial</button>
      </div>
      {st.big && <div style={{ fontSize: '30px', textAlign: 'center', fontFamily: 'var(--font-heading)', margin: '2px 0' }}>{st.big}</div>}
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', margin: '2px 0 4px' }}>{st.title}</div>
      {st.lines.map((l, k) => <p key={k} style={{ margin: '0 0 4px', fontSize: '14px', lineHeight: 1.45 }}>{l}</p>)}
      {st.easy && <div style={{ marginTop: 8 }}><div style={{ fontSize: '13px', fontWeight: 600, marginBottom: 4 }}>Want help? Tick anything you’d like handled for you (you can change this later in Settings):</div><EasyToggles vm={vm} compact /></div>}
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
