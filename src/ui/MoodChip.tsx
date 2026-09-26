// A player's mood with a hover card explaining why he feels that way.
import { HoverCard } from './HoverCard';

// Plain-language reasons for each mood factor (negative, positive).
const WHY: Record<string, [string, string]> = {
  'Team success': ['Wants to win: the losing is wearing on him', 'Loves that the team is winning'],
  'Coming off the bench': ['Thinks he should be starting', ''],
  'Starting role': ['', 'Happy with his starting role'],
  'Barely playing': ['Wants more minutes', ''],
  'Leading his own team': ['', 'Loves being the No. 1 option'],
  'Wants to be the No. 1 option': ['Wants to be the star of his own team', ''],
  'Wants the ball more': ['Wants more touches and shots', ''],
  'Feels underpaid': ['Wants more money: feels underpaid for what he does', ''],
  'Well paid': ['', 'Happy with his contract'],
  'No extension offered': ['Hasn’t been offered an extension', ''],
  'Market size': ['Wants to move to a bigger market', 'Enjoys the big-market spotlight'],
  'Years with the team': ['', 'Loyal: feels at home here'],
  'Recently extended': ['', 'Just got his extension'],
  'Incentive dispute with the front office': ['Upset about an incentive dispute with the front office', ''],
  'Front office backed him': ['', 'Feels backed by the front office'],
  'Consummate professional': ['', 'A pro: keeps his feelings in check'],
  'Team facilities': ['Unimpressed by the team facilities', 'Likes the lavish team facilities'],
  'Fan energy': ['Misses playing in front of a full building', 'Likes the energy from the fan base'],
};

// His priorities, most important first.
export function priorities(p: any) {
  if (!p?.pers) return [];
  const mot = String(p.pers.mot || 'Winning').toLowerCase(), loy = p.pers.loyalty ?? (p.pers.mot === 'Loyalty' ? 75 : 45), amb = p.pers.ambition ?? (p.pers.mot === 'Money' || p.pers.mot === 'Fame' ? 75 : 45);
  const rest = [loy >= 60 && 'loyalty', amb >= 65 && 'money', p.pers.alpha && 'being the star', 'winning', 'playing time', amb >= 55 && 'fame'].filter(Boolean) as string[];
  return [...new Set([mot, ...rest])].slice(0, 3);
}
// Where his motives pull against each other: short lines.
function tensions(p: any, fs: { n: string; v: number }[]) {
  if (!p) return [];
  const v = (n: string) => fs.find(f => f.n === n)?.v || 0, mot = p.pers?.mot;
  const winning = v('Team success'), paid = v('Feels underpaid'), star = v('Wants to be the No. 1 option'), market = v('Market size'), bench = v('Coming off the bench') + v('Barely playing');
  const out: string[] = [];
  if (star < 0) out.push(winning > 0 && mot === 'Winning' ? 'Wants to be the star ↔ values winning more, so he stays' : winning > 0 ? 'Wants to be the star ↔ winning keeps him patient' : 'Wants to be the star, and the losing makes it worse');
  if (mot === 'Winning' && paid < 0) out.push('Wants to win ↔ but not enough to take less money');
  if (market < 0) out.push(winning > 0 ? 'Wants a bigger market ↔ winning keeps him here' : 'Wants a bigger market');
  if (bench < 0 && winning > 0) out.push('Wants more minutes ↔ won’t rock the boat while winning');
  return out.slice(0, 2);
}

export function MoodChip({ label, color, factors, name, p }: { label: string; color: string; factors: any[]; name?: string; p?: any }) {
  const fs = (factors || []).map(f => (Array.isArray(f) ? { n: f[0], v: +f[1] } : { n: f.n, v: +f.v })).filter(f => f.v !== 0).sort((a, b) => a.v - b.v);
  const neg = fs.filter(f => f.v < 0), pos = fs.filter(f => f.v > 0).reverse();
  const txt = (f: any) => (WHY[f.n] ? WHY[f.n][f.v < 0 ? 0 : 1] : '') || f.n;
  return (
    <HoverCard width={270} anchor={<span style={{ color, cursor: 'help', borderBottom: '1px dotted currentColor', whiteSpace: 'nowrap' }}>{label}</span>}>
      <b style={{ display: 'block', marginBottom: '3px', color }}>{name ? name + ': ' : ''}{label}</b>
      {priorities(p).length > 0 && <span style={{ display: 'block', marginBottom: '4px' }}>Priorities: {priorities(p).join(', ')}</span>}
      {tensions(p, fs).map(t => <span key={t} style={{ display: 'block', color: 'var(--color-accent-800)', marginBottom: '2px' }}>{t}</span>)}
      {neg.length === 0 && pos.length === 0 && <span style={{ color: 'var(--color-neutral-700)' }}>Nothing on his mind.</span>}
      {neg.map(f => <span key={f.n} style={{ display: 'flex', gap: '6px', color: 'var(--gm-bad)' }}><span style={{ width: 26, textAlign: 'right', flex: 'none' }}>{f.v}</span><span>{txt(f)}</span></span>)}
      {pos.map(f => <span key={f.n} style={{ display: 'flex', gap: '6px', color: 'var(--gm-good)' }}><span style={{ width: 26, textAlign: 'right', flex: 'none' }}>+{f.v}</span><span>{txt(f)}</span></span>)}
    </HoverCard>
  );
}
