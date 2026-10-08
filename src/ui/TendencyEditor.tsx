// God Mode: edit a playing style the way the NBA reports it (tendencies.ts). Usage rate as USG%; where his
// shots come from as % of his shots and how he creates his jump shots as % of his jumpers, each group
// adding up to 100% (change one and the others make room in proportion); free throw rate as free throw
// attempts per 100 shots. Used by the player editor and the card editor.
import type { Game } from '../engine/Game';
import { CRE_TEN, expUsg, setShare, TEN_DESC, TEN_LABEL, tenScore, tenUnit, typShare, usageScoreFor, ZONE_TEN, type CreTen, type ZoneTen } from '../engine/tendencies';
import { muted, NumInput } from './kit';

// `auto`: what the game's AI would set for him (tendencies.ts targetTen: his ratings, personality, age and role),
// for the Auto button.
export function TendencyEditor({ p, gm, onTen, auto }: { p: any; gm: Game; onTen: (ten: Record<string, number>) => void; auto?: () => Record<string, number> }) {
  const t = p.ten || {}, roles = gm.rolesOf(p), norms = gm.db.norms;
  const head = (txt: string) => <div style={{ ...muted, fontSize: '10.5px', letterSpacing: '.08em', textTransform: 'uppercase', margin: '8px 0 2px' }}>{txt}</div>;
  const row = (key: string, label: string, v: number, lo: number, hi: number, set: (v: number) => void, suffix: string, note: string, desc?: string) => (
    <label key={key} title={desc} style={{ display: 'grid', gridTemplateColumns: '150px auto minmax(0,1fr)', gap: 8, alignItems: 'center', fontSize: '13px', padding: '2px 0' }}>
      <span>{label}</span><NumInput value={v} min={lo} max={Math.max(lo + 1, hi)} onValue={set} width={64} suffix={suffix} /><span style={{ ...muted, fontSize: '11.5px' }}>{note}</span>
    </label>);
  const share = (k: ZoneTen | CreTen) => row(k, TEN_LABEL[k], Math.round(t[k] ?? 0), 0, 100, v => onTen(setShare(t, k, v)), '%', 'typical ' + typShare(k) + '%', TEN_DESC[k]);
  const total = (keys: readonly string[]) => <div style={{ ...muted, fontSize: '11.5px', paddingLeft: 158 }}>Total {Math.round(keys.reduce((a, k) => a + (t[k] ?? 0), 0))}% · change one and the others make room</div>;
  const uLo = Math.ceil(expUsg(p, norms, roles, 2)), uHi = Math.floor(expUsg(p, norms, roles, 98));
  const fLo = Math.ceil(tenUnit('ftr', 2) * 100), fHi = Math.floor(tenUnit('ftr', 98) * 100);
  return (
    <div>
      {auto && <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '2px 0 4px' }}>
        <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '2px 10px' }} onClick={() => onTen(auto())} title="Set every number to what fits him now: his ratings, personality, age and role on his team">Auto (let the AI set them)</button>
        <span style={{ ...muted, fontSize: '11.5px' }}>What the game would pick for him from his ratings, personality, age and role.</span>
      </div>}
      {head('Shot volume')}
      {row('usage', 'Usage rate', Math.round(expUsg(p, norms, roles)), uLo, uHi, v => onTen({ ...t, usage: usageScoreFor(p, norms, roles, v) }), '% USG', 'typical 20% (his game sets his range: ' + uLo + '–' + uHi + ')', TEN_DESC.usage)}
      {head('Where his shots come from (% of his shots)')}
      {ZONE_TEN.map(share)}{total(ZONE_TEN)}
      {head('How he creates his jump shots (% of his jumpers)')}
      {CRE_TEN.map(share)}{total(CRE_TEN)}
      {head('Getting to the line')}
      {row('ftr', 'Free throw rate', Math.round(tenUnit('ftr', t.ftr ?? 50) * 100), fLo, fHi, v => onTen({ ...t, ftr: tenScore('ftr', v / 100) }), 'FTA per 100 FGA', 'typical 25', TEN_DESC.ftr)}
    </div>);
}
