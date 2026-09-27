// God Mode card library: player cards you can build from scratch (a blank template), fill from any
// player, edit field by field with a live overall and badges, save, download, and apply to a
// player. Cards live in the save (s.cards); the ready-made ones are ordinary editable cards.
import { useState } from 'react';
import type { VM } from '../vm';
import { Combo, CountryPicker, FtInInput, muted, NumInput, ruleH4 } from '../kit';
import { applyCard, BLANK_CARD, exportCard, PRESET_CARDS } from '../../engine/playerCard';
import { badgesOf, ovrExact } from '../../engine/ratings';
import { RNAME } from '../../engine/progress';
import { TRAITS } from '../../engine/traits';

const RKEYS = Object.keys(RNAME);
const POS = ['PG', 'SG', 'G', 'GF', 'SF', 'F', 'PF', 'FC', 'C'];
const GRP: Record<string, string> = { PG: 'G', SG: 'G', G: 'G', GF: 'W', SF: 'W', F: 'W', PF: 'B', FC: 'B', C: 'B' };
const MOTS = ['Winning', 'Money', 'Fame', 'Loyalty', 'Playing time'];
const TENDS: [string, string][] = [['rim', 'At the rim'], ['mid', 'Mid-range'], ['c3', 'Corner threes'], ['atb', 'Above-the-break threes'], ['draw', 'Draws fouls'], ['tov', 'Turnovers']];
const inchesOf = (h: string) => { const m = String(h || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; };
const fmtH = (i: number) => Math.floor(i / 12) + '′' + (i % 12) + '″';
const clone = (x: any) => JSON.parse(JSON.stringify(x));
const newId = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

// The library in the save: seeded with the ready-made cards the first time.
export function cardsOf(s: any): { id: string; card: any }[] {
  return s.cards || PRESET_CARDS.map((x, i) => ({ id: 'preset' + i, card: { ...clone(x.card), label: x.label } }));
}

// Everyone in the league (rosters, free agents, overseas, prospects), for "New card from any player".
let OPTS: { key: number; list: any[] } | null = null;
const playerOpts = (gm: any, s: any) => {
  const key = (s.gv || 0) * 1000 + s.day;
  if (OPTS && OPTS.key === key) return OPTS.list;
  const tidOf: Record<number, string> = {}; Object.keys(s.rosters).forEach(t => s.rosters[t].forEach((id: number) => (tidOf[id] = s.teams[+t].abbr)));
  const list = (Object.values(gm.db.P) as any[]).filter(q => q.r && !q.gone && !q.retired).sort((a, b) => b.ovr - a.ovr).map(q => ({ v: q.name, sub: q.pos + ' · ' + (tidOf[q.id] || (q.cls ? 'Class of ' + q.cls : 'FA')) + ' · ' + q.ovr, id: q.id }));
  OPTS = { key, list }; return list;
};

export function CardLibrary({ vm, p }: { vm: VM; p: any }) {
  const { gm, s } = vm.ctx, C = gm.db.C, lib = cardsOf(s);
  const [who, setWho] = useState(''), [sel, setSel] = useState(''), [draft, setDraft] = useState<any>(null), [msg, setMsg] = useState(''), [paste, setPaste] = useState('');
  const saveLib = (next: { id: string; card: any }[]) => gm.setState({ cards: next });
  const undo = s.cardUndo && s.cardUndo.pid === p.id ? s.cardUndo : null;
  const say = (m: string) => setMsg(m);

  const apply = (card: any, label: string) => {
    const before = { ...exportCard(p), _gem: p.gem, _rx: p.rx, _px: p.px }, err = applyCard(p, card, C);
    if (err) return say('✗ ' + err);
    gm.resetFace(p.id); gm.setState(st => ({ gv: (st.gv || 0) + 1, cardUndo: { pid: p.id, prev: before } })); gm.enforceRetirement();
    say('✓ Applied ' + label + ' to this player: ' + p.name + ', ' + p.ovr + ' overall / ' + p.pot + ' potential.');
  };
  const open = (id: string, card: any) => { setSel(id); setDraft(clone(card)); setMsg(''); };
  const saveDraft = () => {
    if (!draft) return;
    const label = draft.label || draft.name || 'Untitled card', i = lib.findIndex(x => x.id === sel);
    const next = i >= 0 ? lib.map(x => (x.id === sel ? { id: sel, card: { ...clone(draft), label } } : x)) : [...lib, { id: sel || newId(), card: { ...clone(draft), label } }];
    saveLib(next); if (i < 0 && !sel) setSel(next[next.length - 1].id); say('✓ Saved “' + label + '”.');
  };
  const download = (card: any) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(card, null, 2)], { type: 'application/json' })); a.download = String(card.label || card.name || 'card').replace(/[^\w]+/g, '_') + '.json'; a.click(); };
  const importText = (t: string, from: string) => { try { const c = JSON.parse(t); if (!c?.r) return say('✗ That isn’t a player card (it needs his ratings, "r").'); open(newId(), { ...c, label: c.label || c.name || from }); say('Opened ' + from + ' as a new card: edit it, then Save or Apply.'); } catch { say('✗ That isn’t valid JSON.'); } };

  // Live preview of the draft: overall and badges from its ratings.
  const prev = draft ? (() => { const q: any = { r: draft.r, grp: GRP[draft.pos] || 'W', hgt: draft.hgt, wing: draft.wing, pers: draft.pers || {}, intg: draft.intg || {} }; return { ovr: Math.round(ovrExact(q)), badges: badgesOf(q) }; })() : null;
  const set = (f: (d: any) => void) => setDraft((d: any) => { const n = clone(d); f(n); return n; });
  const grid = { display: 'grid', gridTemplateColumns: '130px minmax(0,1fr)', gap: '6px 10px', alignItems: 'center' } as const;
  const rgrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: '6px 12px' } as const;

  return (<>
    <h4 style={ruleH4}>Player cards</h4>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      <select className="input" value={sel && lib.some(x => x.id === sel) ? sel : ''} onChange={e => { const x = lib.find(c => c.id === e.target.value); if (x) open(x.id, x.card); }} style={{ width: 'auto', maxWidth: 260 }}>
        <option value="">Your cards ({lib.length})…</option>{lib.map(x => <option key={x.id} value={x.id}>{x.card.label || x.card.name}</option>)}
      </select>
      <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => { open(newId(), clone(BLANK_CARD)); say('New blank card: fill it in, then Save or Apply.'); }}>New blank card</button>
      <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => { open(newId(), { ...exportCard(p), label: p.name }); say('Filled a new card from ' + p.name + '. Edit it, then Save.'); }} title="A new card with this player’s current build">New card from this player</button>
      <Combo value={who} options={playerOpts(gm, s)} placeholder="New card from any player…" width={220} onChange={setWho}
        onPick={o => { const q = gm.db.P[(o as any).id]; setWho(''); if (q) { open(newId(), { ...exportCard(q), label: q.name }); say('Filled a new card from ' + q.name + '. Edit it, then Save or Apply.'); } }} />
      <label className="btn btn-ghost" style={{ fontSize: '12px', cursor: 'pointer' }}>Import file…<input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={async e => { const f = e.target.files?.[0]; if (f) importText(await f.text(), f.name.replace(/\.json$/, '')); e.target.value = ''; }} /></label>
      {undo && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => { applyCard(p, undo.prev, C); gm.resetFace(p.id); gm.setState(st => ({ gv: (st.gv || 0) + 1, cardUndo: null })); say('Undone: ' + p.name + ' is back to his old build.'); }}>Undo last apply</button>}
    </div>
    <textarea className="input" value={paste} onChange={e => setPaste(e.target.value)} placeholder="…or paste a card’s JSON here" rows={paste ? 5 : 1} style={{ width: '100%', marginTop: 6, fontFamily: 'monospace', fontSize: '11.5px' }} />
    {paste.trim() && <button className="btn btn-secondary" style={{ fontSize: '12px', marginTop: 4 }} onClick={() => { importText(paste, 'Pasted card'); setPaste(''); }}>Open pasted card</button>}
    {msg && <div style={{ fontSize: '12px', marginTop: 4, color: msg.startsWith('✗') ? 'var(--gm-bad)' : msg.startsWith('✓') ? 'var(--gm-good)' : undefined }}>{msg}</div>}

    {draft && prev && <div className="card" style={{ padding: '10px 12px', marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <input className="input" value={draft.label ?? ''} placeholder="Card name (e.g. Rookie Luka)" onChange={e => set(d => { d.label = e.target.value; })} style={{ flex: 1, minWidth: 160, fontWeight: 600 }} />
        <span style={{ fontSize: '13px' }}>Overall <b style={{ color: vm.ctx.tone(prev.ovr) }}>{prev.ovr}</b> · Potential <b>{Math.max(prev.ovr, draft.pot ?? prev.ovr)}</b></span>
      </div>
      <div style={{ fontSize: '12px', ...muted }}>{prev.badges.length ? 'Badges: ' + prev.badges.map(b => b.name + ' (' + b.tierName + ')').join(', ') : 'No badges at these ratings.'}</div>

      <div style={grid}>
        <span style={muted}>Name</span>
        <span style={{ display: 'flex', gap: 6 }}><input className="input" value={draft.first ?? ''} placeholder="First" onChange={e => set(d => { d.first = e.target.value; d.name = (d.first + ' ' + (d.last || '')).trim(); })} style={{ flex: 1, minWidth: 0 }} /><input className="input" value={draft.last ?? ''} placeholder="Last" onChange={e => set(d => { d.last = e.target.value; d.name = ((d.first || '') + ' ' + d.last).trim(); })} style={{ flex: 1, minWidth: 0 }} /></span>
        <span style={muted}>Position · age</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><select className="input" value={draft.pos || 'SF'} onChange={e => set(d => { d.pos = e.target.value; })} style={{ width: 'auto' }}>{POS.map(x => <option key={x}>{x}</option>)}</select><NumInput value={draft.age ?? 19} min={15} max={45} onValue={v => set(d => { d.age = v; delete d.dob; })} width={70} suffix="years" /></span>
        <span style={muted}>Height · weight</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><FtInInput inches={inchesOf(draft.hgt)} min={66} max={91} onValue={v => set(d => { d.hgt = fmtH(v); })} /><NumInput value={draft.wt ?? 210} min={150} max={320} onValue={v => set(d => { d.wt = v; })} width={70} suffix="lb" /></span>
        <span style={muted}>Wingspan</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><FtInInput inches={draft.wing ?? inchesOf(draft.hgt) + 4} min={inchesOf(draft.hgt) - 8} max={inchesOf(draft.hgt) + 14} onValue={v => set(d => { d.wing = v; })} /><span style={{ ...muted, fontSize: '12px' }}>{((draft.wing ?? inchesOf(draft.hgt) + 4) - inchesOf(draft.hgt) >= 0 ? '+' : '') + ((draft.wing ?? inchesOf(draft.hgt) + 4) - inchesOf(draft.hgt))}″ vs height</span></span>
        <span style={muted}>Country · city</span>
        <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><CountryPicker C={C} value={draft.rep || 'US'} onPick={c => set(d => { d.rep = c; d.born = c; d.raised = c; d.her = c; delete d.heritage; if (c !== 'US') delete d.state; })} width={170} /><input className="input" value={draft.city ?? ''} placeholder="City" onChange={e => set(d => { d.city = e.target.value; })} style={{ flex: 1, minWidth: 100 }} /></span>
      </div>

      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>Ratings</div>
      <div style={rgrid}>{RKEYS.map(k => <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '12.5px' }}><span style={muted}>{RNAME[k]}</span><NumInput value={draft.r?.[k] ?? 50} min={1} max={100} onValue={v => set(d => { d.r = { ...(d.r || {}), [k]: v }; })} width={62} /></label>)}</div>
      <div style={rgrid}>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '12.5px' }}><span style={muted}>Potential</span><NumInput value={draft.pot ?? 60} min={1} max={100} onValue={v => set(d => { d.pot = v; })} width={62} /></label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '12.5px' }}><span style={muted}>Feel</span><NumInput value={draft.intg?.feel ?? 50} min={1} max={99} onValue={v => set(d => { d.intg = { ...(d.intg || {}), feel: v }; })} width={62} /></label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '12.5px' }}><span style={muted}>Poise</span><NumInput value={draft.intg?.poise ?? 50} min={1} max={99} onValue={v => set(d => { d.intg = { ...(d.intg || {}), poise: v }; })} width={62} /></label>
        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '12.5px' }}><span style={muted}>Work ethic</span><NumInput value={draft.pers?.work ?? 50} min={0} max={100} onValue={v => set(d => { d.pers = { ...(d.pers || {}), work: v }; })} width={62} /></label>
      </div>

      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>Personality</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="input" value={draft.pers?.mot || 'Winning'} onChange={e => set(d => { d.pers = { ...(d.pers || {}), mot: e.target.value }; })} style={{ width: 'auto' }} title="What he wants most">{MOTS.map(m => <option key={m}>{m}</option>)}</select>
        {TRAITS.map(t => { const on = !!draft.pers?.[t.k]; return <button key={t.k} title={t.desc} className={on ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: '11.5px', padding: '2px 8px' }} onClick={() => set(d => { d.pers = { ...(d.pers || {}), [t.k]: !on }; })}>{on ? '✓ ' : ''}{t.label}</button>; })}
      </div>

      <div style={{ fontWeight: 600, fontSize: '12.5px' }}>Shot tendencies <span style={{ ...muted, fontWeight: 400 }}>(100% = what his ratings suggest)</span></div>
      <div style={rgrid}>{TENDS.map(([k, l]) => <label key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, fontSize: '12.5px' }}><span style={muted}>{l}</span><NumInput value={Math.round((draft.tend?.[k] ?? 1) * 100)} min={20} max={300} step={5} onValue={v => set(d => { d.tend = { ...(d.tend || {}), [k]: v / 100 }; if (v === 100) delete d.tend[k]; })} width={62} suffix="%" /></label>)}</div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={() => apply(draft, '“' + (draft.label || draft.name || 'this card') + '”')}>Apply to {p.name}</button>
        <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={saveDraft}>Save card</button>
        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => { const id = newId(); saveLib([...lib, { id, card: { ...clone(draft), label: (draft.label || draft.name || 'Card') + ' (copy)' } }]); open(id, { ...draft, label: (draft.label || draft.name || 'Card') + ' (copy)' }); say('✓ Duplicated.'); }}>Duplicate</button>
        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => download({ ...draft, card: 1 })}>Download</button>
        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => { navigator.clipboard?.writeText(JSON.stringify(draft, null, 2)).then(() => say('✓ Copied the card’s JSON.'), () => say('✗ Couldn’t copy; use Download.')); }}>Copy JSON</button>
        {lib.some(x => x.id === sel) && <button className="btn btn-ghost" style={{ fontSize: '12px', color: 'var(--gm-bad)' }} onClick={() => { if (!confirm('Delete this card?')) return; saveLib(lib.filter(x => x.id !== sel)); setDraft(null); setSel(''); say('Deleted.'); }}>Delete</button>}
        <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => { setDraft(null); setSel(''); }}>Close</button>
      </div>
    </div>}
    <p style={{ ...muted, fontSize: '11.5px' }}>A card is a whole build: name, bio, ratings, potential, intangibles, personality and shot tendencies. Applying one keeps the player’s team, contract, stats and history; his overall comes from the ratings. Edits aren’t kept until you press Save card.</p>
  </>);
}
