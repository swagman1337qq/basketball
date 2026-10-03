// God Mode player editor, part two: bio (first/last names in Romanized and native
// script, date of birth, height, weight, wingspan), psychology, fatigue, specific
// injuries and a custom headshot. The player's ID and past-season stats stay locked.
import { useEffect, useState } from 'react';
import { liftCeil, refreshPot } from '../../engine/potential';
import type { VM } from '../vm';
import { processImage } from '../upload';
import { Combo, CountryPicker, Dice, FtInInput, muted, NumInput, ruleH4 } from '../kit';
import { namePools, regionOf } from '../../data/world';
import { US_STATES } from '../../data/usStates';
import { hometownOf } from '../../data/hometown';
import { GOD_PINK, godText } from '../kit';
import { randomTeamIn } from '../../data/randomTeam';
import { setRating, setWing, wngOf } from '../../engine/ratings';
import { leaguesIn } from '../../data/leagues';
import { syncOvr } from '../../engine/ratings';
import { refreshElig } from '../../engine/eligibility';
import { ensureTen, expUsg, TEN_KEYS, TEN_LABEL, tenScore, tenSuffix, tenUnit, usageScoreFor, ZONE_TEN, zoneScoreFor, zoneShares, jumpShares, jumpScoreFor, type TenKey, type ZoneTen } from '../../engine/tendencies';
import { allPools, applyNativeMix, groupsOf, heritageLabel, NATIVE_MIX, randomName } from '../../data/heritage';

const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const INJ: [string, number, boolean, boolean][] = [['Bruised knee', 2, false, true], ['Ankle sprain', 5, false, false], ['Hamstring strain', 10, false, false], ['Broken wrist', 25, false, false], ['Torn ACL', 90, true, false], ['Achilles rupture', 110, true, false]];
const inchesOf = (h: string) => { const m = String(h || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; };
const fmtH = (i: number) => Math.floor(i / 12) + '′' + (i % 12) + '″';
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// U.S. hometowns: the City and State fields filter each other. A state narrows the city list to
// its towns (still searchable); a known town narrows the state list to the states that have one
// (Plano → Illinois, Texas; New York → New York). No state, or an unknown town: everything.
let US_ALL: { v: string; sub: string }[] | null = null, US_IDX: Map<string, string[]> | null = null;
const usAll = (all: Record<string, string>) => {
  if (!US_ALL) { US_ALL = US_STATES.flatMap(([k, n]) => (all[k] || '').split('|').filter(Boolean).map(v => ({ v, sub: n })));
    US_IDX = new Map(); US_ALL.forEach(o => { const k = o.v.toLowerCase(); US_IDX!.set(k, [...(US_IDX!.get(k) || []), o.sub]); }); }
  return US_ALL;
};
const validState = (st?: string) => US_STATES.find(s => s[1].toLowerCase() === String(st || '').trim().toLowerCase())?.[1];
const usCityOpts = (all: Record<string, string> | null, state?: string) => { if (!all) return []; const A = usAll(all), st = validState(state); return st ? A.filter(o => o.sub === st) : A; };
// Towns matching what was typed: exact names first, else names starting with it, else containing it.
const matchTowns = (all: Record<string, string>, text: string, state?: string) => {
  const A = usAll(all).filter(o => !state || o.sub === state), x = text.trim().toLowerCase(); if (!x) return [];
  const ex = A.filter(o => o.v.toLowerCase() === x); if (ex.length) return ex;
  const pre = A.filter(o => o.v.toLowerCase().startsWith(x)); return pre.length ? pre : A.filter(o => o.v.toLowerCase().includes(x));
};
const usStateOpts = (all: Record<string, string> | null, city?: string) => {
  const names = US_STATES.map(s => s[1]); if (!all || !city?.trim()) return names.map(v => ({ v }));
  const m = matchTowns(all, city); if (!m.length) return names.map(v => ({ v }));
  const exact = m[0].v.toLowerCase() === city.trim().toLowerCase(), cnt = new Map<string, number>(); m.forEach(o => cnt.set(o.sub, (cnt.get(o.sub) || 0) + 1));
  return names.filter(n => cnt.has(n)).map(v => ({ v, sub: exact ? 'has a ' + m[0].v : cnt.get(v) + ' town' + (cnt.get(v) === 1 ? '' : 's') + ' like “' + city.trim() + '”' }));
};
// Fill in the blank half at random. A town with no state: one of the states that has it (Plano →
// Illinois, Kentucky or Texas); a partial name ("Plan") becomes a real town that matches. A state
// with no town: a random town there; with a partial town, a matching town in that state.
const fillUS = (all: Record<string, string>, q: any, from: 'city' | 'state' = 'city') => {
  const city = String(q.city || '').trim(), st = validState(q.state), rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  if (st) q.state = st;
  if (!city) { if (st) { const code = US_STATES.find(s => s[1] === st)![0], list = (all[code] || '').split('|').filter(Boolean); if (list.length) q.city = rnd(list); } return; }
  const m = matchTowns(all, city, st);
  if (!m.length) { // not a town we know there: keep a typed town, but a new state gets one of its own towns
    if (from === 'state' && st && matchTowns(all, city).length) { const code = US_STATES.find(s => s[1] === st)![0], list = (all[code] || '').split('|').filter(Boolean); if (list.length) q.city = rnd(list); }
    return; }
  if (st && m.some(o => o.v.toLowerCase() === city.toLowerCase())) return; // already a real town in his state
  const o = rnd(m); q.city = o.v; q.state = o.sub;
};
const LOOKS: [string, string][] = [['black', 'Darker skin'], ['brown', 'Medium skin'], ['white', 'Lighter skin'], ['asian', 'East Asian features']];
// A look for a heritage group, drawn by the group's mix (e.g. { brown: .6, white: .4 }).
const pickRace = (r: Record<string, number>) => { const ks = Object.keys(r); let x = Math.random() * ks.reduce((a, k) => a + r[k], 0); for (const k of ks) if ((x -= r[k]) < 0) return k; return ks[0] || 'brown'; };

export function GodPlayerEditor({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, p = gm.db.P[s.pid];
  const [err, setErr] = useState('');
  const [originSel, setOrigin] = useState<string | null>(null), [bg, setBg] = useState('');
  const [usCities, setUsCities] = useState<Record<string, string> | null>(null);
  useEffect(() => { if (p?.born === 'US' && !usCities) import('../../data/usCities').then(m => setUsCities(m.US_CITIES)); }, [p?.born, usCities]);
  if (!p) return null;
  // Changing where he was born or raised, or his heritage, redoes his national-team eligibility.
  const mut = (f: (p: any) => void) => { const k0 = p.born + '|' + p.raised + '|' + p.her; f(p); liftCeil(p); refreshPot(p); if (k0 !== p.born + '|' + p.raised + '|' + p.her) refreshElig(p, C); gm.setState(st => ({ gv: (st.gv || 0) + 1 })); gm.enforceRetirement(); };
  // "Playing for": the leagues in his country (top tier first), then the teams in the chosen
  // league, or every team in the country when the league is blank or typed by hand.
  const lgs = p.from ? leaguesIn(p.from.country || p.raised || p.born) : [], curL = lgs.find(x => x.lg === p.from?.lg);
  const teamOpts = curL ? curL.teams.map(t => ({ v: t })) : lgs.flatMap(x => x.teams.map(t => ({ v: t, sub: x.lg })));
  const C = gm.db.C, lf = p.familyFirst ?? !!allPools()[C[p.rep]?.pool]?.lf;
  const parts = String(p.name).split(' '), first = p.first ?? (lf ? parts.slice(1).join(' ') : parts[0]), last = p.last ?? (lf ? parts[0] : parts.slice(1).join(' '));
  const origin = originSel ?? p.rep;
  const undo = s.nameUndo && s.nameUndo.pid === p.id ? s.nameUndo : null;
  const reroll = (code: string) => { const prev = { pid: p.id, name: p.name, native: p.native, first: p.first, last: p.last, nativeFirst: p.nativeFirst, nativeLast: p.nativeLast, familyFirst: p.familyFirst, race: p.race, heritage: p.heritage, mix: p.mix, tribe2: p.tribe2, her: p.her, born: p.born, raised: p.raised, city: p.city, elig: p.elig }; const { race, heritage, ...nm } = randomName(code, Math.random, bg || undefined); Object.assign(p, nm, { race, heritage, her: code }); delete p.mix; delete p.tribe2;
    // His hometown moves with him (eligibility is left alone: edit it on the profile).
    const cities = C[code]?.cities || []; if (cities.length) p.city = cities[Math.floor(Math.random() * cities.length)]; p.born = code; p.raised = code; refreshElig(p, C); gm.resetFace(p.id); gm.setState(st => ({ gv: (st.gv || 0) + 1, nameUndo: prev })); };
  const doUndo = () => { if (!undo) return; const { pid, ...rest } = undo; Object.keys(rest).forEach(k => (rest[k] === undefined ? delete p[k] : (p[k] = rest[k]))); if (rest.her) gm.resetFace(pid); gm.setState({ nameUndo: null, gv: (s.gv || 0) + 1 }); };
  const nat = p.native || '', cjk = CJK.test(nat);
  const nFirst = p.nativeFirst ?? (cjk ? nat.slice(1) : nat.split(' ')[0] || ''), nLast = p.nativeLast ?? (cjk ? nat.slice(0, 1) : nat.split(' ').slice(1).join(' '));
  const setNames = (f: string, l: string, nf: string, nl: string) => mut(q => { q.first = f; q.last = l; q.name = (lf ? l + ' ' + f : f + ' ' + l).trim(); q.nativeFirst = nf; q.nativeLast = nl; q.native = CJK.test(nf + nl) ? nl + nf : (nf + ' ' + nl).trim(); });
  const hIn = inchesOf(p.hgt), wing = p.wing ?? hIn + 3 + (p.id % 4);
  const dob = p.dob || (gm.Y - 1 - p.age) + '-' + String(1 + (p.id % 12)).padStart(2, '0') + '-' + String(1 + (p.id % 28)).padStart(2, '0');
  const num = (label: string, v: number, mn: number, mx: number, set: (v: number) => void, fmt?: (v: number) => string, unit?: string, rand?: () => number) => (
    <>
      <span style={muted}>{label}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><NumInput value={v} min={mn} max={mx} step={1} onValue={set} suffix={unit === 'inches' ? 'in' : (unit ? unit : '') + (fmt ? (unit ? ' · ' : '') + fmt(v) : '') || mn + '–' + mx} />{unit === 'inches' && <><FtInInput inches={v} min={mn} max={mx} onValue={set} />{fmt && label !== 'Height' && <span style={{ ...muted, fontSize: '12px', whiteSpace: 'nowrap' }}>{fmt(v).replace(/^\S+ /, '')}</span>}</>}{rand && <Dice onClick={() => set(rand())} title={'Random ' + label.toLowerCase()} />}</span>
    </>
  );
  const RN = () => randomName(origin, Math.random, bg || undefined);
  const inRow = (input: any, onDice: () => void, title: string) => <span style={{ display: 'flex', gap: 6 }}>{input}<Dice onClick={onDice} title={title} /></span>;
  const grid = { display: 'grid', gridTemplateColumns: '120px minmax(0,1fr)', gap: '8px 12px', alignItems: 'center' } as const;
  const upload = async (f?: File) => { if (!f) return; setErr(''); try { const url = await processImage(f, 160, 240, 'image/jpeg'); mut(q => (q.faceImg = url)); } catch (e: any) { setErr(e.message); } };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '36px', alignItems: 'start', marginTop: '26px' }}>
      <section>
        <h4 style={ruleH4}>Biography</h4>
        <div style={grid}>
          <span style={muted}>Random name</span>
          <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <CountryPicker C={C} value={origin} onPick={c => { setOrigin(c); setBg(''); }} width={190} />
            <select className="input" value={bg} onChange={e => setBg(e.target.value)} style={{ flex: 1, minWidth: '150px' }} title="Heritage within the country">
              <option value="">Any background (by population)</option>
              {(() => { const gs = groupsOf(origin), tot = gs.reduce((a, x) => a + x.w, 0); return gs.map(x => <option key={x.k} value={x.k}>{x.k} · {(100 * x.w / tot).toFixed(x.w / tot < 0.01 ? 2 : 1)}%</option>); })()}
            </select>
            <button className="btn btn-secondary" onClick={() => reroll(origin)} style={{ fontSize: '12px', whiteSpace: 'nowrap' }} title="A real name from that country, with the native script where it has one">🎲 Generate</button>
            {undo && <button className="btn btn-ghost" onClick={doUndo} style={{ fontSize: '12px' }}>Undo ({undo.name})</button>}
          </span>
          <span style={muted}>Heritage</span>
          <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <CountryPicker C={C} value={p.her || p.rep} onPick={c => mut(q => { const gs = groupsOf(c); q.her = c; delete q.mix; delete q.tribe2; if (gs.length) { const g0 = [...gs].sort((a, b) => b.w - a.w)[0]; q.heritage = g0.k; q.race = pickRace(g0.race); } else q.heritage = C[c]?.n || c; gm.resetFace(q.id); })} width={190} />
            {groupsOf(p.her || p.rep).length > 0 && p.her !== 'XN'
              ? <select className="input" value={p.heritage || ''} onChange={e => mut(q => { const g0 = groupsOf(q.her || q.rep).find(x => x.k === e.target.value); q.her = q.her || q.rep; q.heritage = e.target.value; if (g0) q.race = pickRace(g0.race); gm.resetFace(q.id); })} style={{ flex: 1, minWidth: '150px' }} title="Background within that heritage">
                  {!groupsOf(p.her || p.rep).some(x => x.k === p.heritage) && <option value={p.heritage || ''}>{p.heritage || '—'}</option>}
                  {groupsOf(p.her || p.rep).map(x => <option key={x.k} value={x.k}>{x.k}</option>)}
                </select>
              : p.her !== 'XN' && <input className="input" value={p.heritage || ''} onChange={e => mut(q => { q.her = q.her || q.rep; q.heritage = e.target.value; })} placeholder="Background (e.g. Yoruba, Irish)" style={{ flex: 1, minWidth: '150px' }} />}
          </span>
          <span style={muted}>Look</span>
          <span style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
            <select className="input" value={p.race || 'brown'} onChange={e => mut(q => { q.race = e.target.value; gm.resetFace(q.id); })} style={{ width: 'auto' }} title="Skin tone and features of his headshot">
              {LOOKS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            <span style={{ ...muted, fontSize: '12px' }}>{heritageLabel(p, C) || 'No heritage set'}</span>
          </span>
          {p.her === 'XN' && <>
            <span style={muted}>Tribal nations</span>
            <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <select className="input" value={p.heritage || ''} onChange={e => mut(q => { q.heritage = e.target.value; if (q.tribe2 === q.heritage) delete q.tribe2; })} style={{ flex: 1, minWidth: '130px' }} title="His tribal nation">{groupsOf('XN').map(x => <option key={x.k} value={x.k}>{x.k}</option>)}</select>
              <select className="input" value={p.tribe2 || ''} onChange={e => mut(q => { if (e.target.value) q.tribe2 = e.target.value; else delete q.tribe2; })} style={{ flex: 1, minWidth: '130px' }} title="A second tribal nation (one from each parent)"><option value="">No second nation</option>{groupsOf('XN').filter(x => x.k !== p.heritage).map(x => <option key={x.k} value={x.k}>& {x.k}</option>)}</select>
            </span>
            <span style={muted}>Mixed race</span>
            <select className="input" value={p.mix || ''} onChange={e => mut(q => { const v = e.target.value; applyNativeMix(q, v, Math.random, false); if (!v) q.race = 'brown'; gm.resetFace(q.id); })} title="One parent Native American, the other…"><option value="">No: Native American</option>{Object.keys(NATIVE_MIX).map(k => <option key={k} value={k}>Native American & {k}</option>)}</select>
          </>}
          <span style={muted}>First name</span>{inRow(<input className="input" value={first} onChange={e => setNames(e.target.value, last, nFirst, nLast)} style={{ flex: 1, minWidth: 0 }} />, () => { const r = RN(); setNames(r.first, last, r.nativeFirst || nFirst, nLast); }, 'A random first name from the country above')}
          <span style={muted}>Last name</span>{inRow(<input className="input" value={last} onChange={e => setNames(first, e.target.value, nFirst, nLast)} style={{ flex: 1, minWidth: 0 }} />, () => { const r = RN(); setNames(first, r.last, nFirst, r.nativeLast || nLast); }, 'A random last name from the country above')}
          <span style={muted}>Native first</span>{inRow(<input className="input" value={nFirst} placeholder="e.g. 伟 or Никола" onChange={e => setNames(first, last, e.target.value, nLast)} style={{ flex: 1, minWidth: 0 }} />, () => setNames(first, last, RN().nativeFirst || '', nLast), 'A random native-script first name (countries with their own script)')}
          <span style={muted}>Native last</span>{inRow(<input className="input" value={nLast} placeholder="e.g. 陈 or Јокић" onChange={e => setNames(first, last, nFirst, e.target.value)} style={{ flex: 1, minWidth: 0 }} />, () => setNames(first, last, nFirst, RN().nativeLast || ''), 'A random native-script last name (countries with their own script)')}
          <span style={muted}>Date of birth</span>
          {inRow(<input className="input" type="date" style={{ flex: 1, minWidth: 0 }} value={dob} onChange={e => { const v = e.target.value; if (!/^\d{4}-\d\d-\d\d$/.test(v)) return; mut(q => { q.dob = v; const y = +v.slice(0, 4), md = v.slice(5); q.age = cl(gm.Y - 1 - y - (md > '10-01' ? 1 : 0), 16, 45); }); }} />, () => { const age = 19 + Math.floor(Math.random() * 17), y = gm.Y - 1 - age, m = 1 + Math.floor(Math.random() * 12), d = 1 + Math.floor(Math.random() * 28); const v = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); const e = { target: { value: v } }; { const v = e.target.value; if (!/^\d{4}-\d\d-\d\d$/.test(v)) return; mut(q => { q.dob = v; const y = +v.slice(0, 4), md = v.slice(5); q.age = cl(gm.Y - 1 - y - (md > '10-01' ? 1 : 0), 16, 45); }); } }, 'A random birthday (age 19–35)')}
          <span style={muted}>Position</span>
          {inRow(<select className="input" value={vm.pl.ed.posV} onChange={vm.pl.ed.setPos} style={{ flex: 1, minWidth: 0 }}>{(vm.pl.ed.posOpts || []).map((o: any) => <option key={o.v} value={o.v}>{o.label}</option>)}</select>, () => { const o = vm.pl.ed.posOpts || []; vm.pl.ed.setPos({ target: { value: o[Math.floor(Math.random() * o.length)].v } }); }, 'A random position')}
          <span style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--color-neutral-700)', margin: '-2px 0 4px' }} title={vm.pl.ed.posRec?.why}>Recommended: <b style={{ color: 'var(--color-accent-700)' }}>{vm.pl.ed.posRec?.label}</b> <span>({vm.pl.ed.posRec?.why})</span>{!vm.pl.ed.posRec?.same && <button className="btn btn-ghost" onClick={vm.pl.ed.posRec?.use} style={{ fontSize: '11.5px', padding: '1px 8px', marginLeft: 6 }}>Use</button>}</span>
          {num('Height', hIn, 66, 91, v => mut(q => { const d = v - inchesOf(q.hgt); if (!d) return; q.hgt = fmtH(v); setRating(q, 'hgt', cl(q.r.hgt + d * 4, 4, 100)); if (q.wing != null) q.wing += d; }), fmtH, 'inches', () => (p.grp === 'G' ? 72 + Math.floor(Math.random() * 7) : p.grp === 'W' ? 76 + Math.floor(Math.random() * 6) : 80 + Math.floor(Math.random() * 7)))}
          {num('Weight', p.wt, 150, 320, v => mut(q => { const d = v - q.wt; q.wt = v; q.r.stre = cl(Math.round(q.r.stre + d / 4), 4, 100); q.r.spd = cl(Math.round(q.r.spd - d / 8), 4, 100); syncOvr(q, true); }), undefined, 'lb', () => Math.round(hIn * 2.9 - 5 + Math.random() * 25))}
          {num('Wingspan', wing, hIn - 8, hIn + 14, v => mut(q => setWing(q, v)), v => fmtH(v) + ' (' + (v - hIn >= 0 ? '+' : '−') + Math.abs(v - hIn) + '″ vs height) · rating ' + wngOf(v, hIn), 'inches', () => hIn + Math.round(Math.max(-6, Math.min(12, (Math.random() + Math.random() + Math.random() - 1.5) * 6 + 3.8))))}
          <span style={muted}>Hometown</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {p.born === 'US'
              ? <Combo value={p.city || ''} options={usCityOpts(usCities, p.state ?? regionOf(p.city))} placeholder={usCities ? 'City (type to search every U.S. town)' : 'City (loading U.S. towns…)'} width={230}
                  onChange={v => mut(q => { q.city = v; })} onPick={o => mut(q => { q.city = o.v; if (o.sub) q.state = o.sub; })} onCommit={() => usCities && mut(q => fillUS(usCities, q))} />
              : <input className="input" value={p.city || ''} onChange={e => mut(q => { q.city = e.target.value; })} placeholder="City" style={{ flex: 1, minWidth: 120 }} />}
            {p.born === 'US' && <Combo value={p.state ?? regionOf(p.city) ?? ''} options={usStateOpts(usCities, p.city)} placeholder="State" width={160}
              onChange={v => mut(q => { const ok = validState(v); if (!v.trim()) delete q.state; else q.state = ok || v; })} onPick={o => mut(q => { q.state = o.v; if (usCities) fillUS(usCities, q, 'state'); })} onCommit={() => usCities && mut(q => fillUS(usCities, q, 'state'))} />}
            {p.born === 'US' && validState(p.state) && <button className="btn btn-ghost" style={{ fontSize: '11.5px', padding: '1px 6px' }} title="Search towns in every state again" onClick={() => mut(q => { delete q.state; })}>Any state</button>}
            <CountryPicker C={C} value={p.born} onPick={c => mut(q => { q.born = c; if (c !== 'US') delete q.state; })} width={170} />
            <button className="btn btn-ghost" title={p.born === 'US' ? 'A random town (in the state picked, or anywhere)' : 'A random city in that country'} onClick={() => mut(q => {
              if (q.born === 'US' && usCities) { const st = US_STATES.find(s => s[1] === q.state), code = st ? st[0] : US_STATES[Math.floor(Math.random() * US_STATES.length)][0], list = usCities[code].split('|'); q.city = list[Math.floor(Math.random() * list.length)]; q.state = US_STATES.find(s => s[0] === code)![1]; return; }
              const cs = C[q.born]?.cities || []; if (cs.length) { q.city = cs[Math.floor(Math.random() * cs.length)]; if (q.born === 'US') q.state = regionOf(q.city) || undefined; } })} style={{ fontSize: '12px' }}>🎲</button>
          </span>
          <span style={{ gridColumn: '2', ...muted, fontSize: '12px', marginTop: -4 }}>Shows as: {hometownOf(p, C)}</span>
          {p.from && <><span style={muted}>{p.cls ? 'Playing for' : 'Came from'}</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <CountryPicker C={C} value={p.from.country} onPick={c => mut(q => { q.from = { team: '', lg: '', country: c }; })} width={150} />
            <Combo value={p.from.lg || ''} options={lgs.map(x => ({ v: x.lg, sub: 'Tier ' + x.tier + ' · ' + x.teams.length + ' teams' }))} placeholder="League" width={170}
              onChange={v => mut(q => { q.from = { ...q.from, lg: v }; })}
              onPick={o => mut(q => { const L = lgs.find(x => x.lg === o.v); q.from = { ...q.from, lg: o.v, team: L && !L.teams.includes(q.from.team) ? '' : q.from.team }; })} />
            <Combo value={p.from.team || ''} options={teamOpts} placeholder="Team or school" width={200}
              onChange={v => mut(q => { q.from = { ...q.from, team: v }; })}
              onPick={o => mut(q => { q.from = { ...q.from, team: o.v, lg: o.sub || q.from.lg }; })} />
            <button className="btn btn-ghost" title="A random team in the country selected here (club, college or school)" onClick={() => mut(q => { q.from = randomTeamIn(C, q.from?.country || q.raised || q.born, q.cls && q.cls > gm.Y); })} style={{ fontSize: '12px' }}>🎲</button>
          </span></>}
        </div>
        <p style={{ ...muted, fontSize: '11.5px' }}>Box scores and play-by-play use the Romanized name; rosters and the profile header also show the native script. Height and weight nudge the related ratings. Wingspan is its own measurement: longer arms help contests, blocks, rebounds and steals. The team a prospect plays for decides which region’s scout covers him.</p>
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Headshot</h4>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="gm-face" style={{ width: 64, height: 96, overflow: 'hidden', flex: 'none', borderRadius: 'var(--radius-sm)' }}>{gm.faceEl(p.id, -1)}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button className="btn btn-secondary" onClick={() => mut(q => { q.faceSeed = Math.floor(Math.random() * 1e9); delete q.faceImg; gm.resetFace(q.id); })} style={{ fontSize: '12px' }}>🎲 New face</button>
            <label className="btn btn-secondary" style={{ fontSize: '12px', cursor: 'pointer' }}>Upload JPG/PNG<input type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={e => upload(e.target.files?.[0])} /></label>
            {p.faceImg && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => mut(q => delete q.faceImg)}>Use the generated face</button>}
            <span style={{ ...muted, fontSize: '11px' }}>Cropped to 2:3 and resized to 160×240.</span>
            {err && <span style={{ color: 'var(--gm-bad)', fontSize: '12px' }}>{err}</span>}
          </div>
        </div>
      </section>
      <section>
        <h4 style={ruleH4}>Player cards</h4>
        <button className="btn btn-secondary" style={{ fontSize: '12px', borderColor: GOD_PINK, color: GOD_PINK }} onClick={() => vm.ctx.gm.setState(st => ({ cardFrom: { pid: p.id, screen: st.screen, ptab: st.ptab || 'edit', name: p.name }, screen: 'cards', cardTarget: p.id, modal: false, teamModal: null }))}>Open Player cards for {p.name} →</button>
        <p style={{ ...muted, fontSize: '11.5px' }}>Build, save and apply whole player builds in the Player cards tab (Management, God Mode only).</p>
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Psychology</h4>
        <div style={grid}>
          {num('Work ethic', p.pers.work ?? 50, 0, 100, v => mut(q => (q.pers.work = v)))}
          {num('Loyalty', p.pers.loyalty ?? (p.pers.mot === 'Loyalty' ? 75 : 45), 0, 100, v => mut(q => (q.pers.loyalty = v)))}
          {num('Ambition', p.pers.ambition ?? (p.pers.mot === 'Money' || p.pers.mot === 'Fame' ? 75 : 45), 0, 100, v => mut(q => (q.pers.ambition = v)))}
          {num('Morale', p.moodAdj || 0, -30, 30, v => mut(q => (q.moodAdj = v)), undefined, '−30 to +30')}
          {num('Confidence', Math.round(p.conf ?? 50), 5, 95, v => mut(q => (q.conf = v)))}
        </div>
        <p style={{ ...muted, fontSize: '11.5px' }}>Work ethic scales growth (about ±20%) and slows aging; loyalty vs ambition decides draft-night heists; morale shifts happiness; confidence nudges shooting and the adjustment period.</p>
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Happiness</h4>
        {(() => { const tid = Number(Object.keys(s.rosters).find(k => s.rosters[k].includes(p.id))), has = !isNaN(tid) && s.teams[tid];
          const cur = has ? gm.moodOf(p, s.rosters[tid].indexOf(p.id), s, tid).hap : null;
          return (<div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', fontSize: '13px' }}>
            <input type="range" min={0} max={100} value={p.hapGod ?? cur ?? 55} onChange={e => mut(q => (q.hapGod = +e.target.value))} style={{ width: 200, accentColor: GOD_PINK }} />
            <b style={{ minWidth: 34 }}>{p.hapGod ?? cur ?? '—'}</b>
            <button className="btn btn-ghost" style={{ fontSize: '12px', ...godText }} onClick={() => mut(q => (q.hapGod = 90))}>Make happy</button>
            {p.hapGod != null && <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={() => mut(q => { delete q.hapGod; })}>Back to normal</button>}
            <span style={{ ...muted, fontSize: '11.5px', flexBasis: '100%' }}>{p.hapGod != null ? 'Fixed at ' + p.hapGod + ' until you set it back to normal (it ignores role, winning and pay).' : 'Now ' + (cur ?? '—') + ', worked out from his role, winning, pay and personality. Move the slider to fix it at a value.'} 80+ thrilled · 62+ content · 45+ neutral · 30+ frustrated · below 30 wants out.</span>
          </div>); })()}
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Status</h4>
        <div style={grid}>
          {num('Fatigue', Math.round(p.fat || 0), 0, 100, v => mut(q => (q.fat = v)))}
          <span style={muted}>Injury</span>
          <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <select className="input" value="" onChange={e => { const x = INJ.find(i => i[0] === e.target.value); if (x) mut(q => { q.inj = { name: x[0], games: x[1], major: x[2] || undefined, dtd: x[3] || undefined }; (q.injHist = q.injHist || []).push({ name: x[0], games: x[1], season: gm.seasonLbl(), god: true }); }); }}>
              <option value="">Trigger an injury…</option>{INJ.map(i => <option key={i[0]} value={i[0]}>{i[0]} ({i[1]}g{i[2] ? ', major' : i[3] ? ', day-to-day' : ''})</option>)}
            </select>
            {p.inj && <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => mut(q => { delete q.inj; delete q.preInj; })}>Heal now</button>}
          </span>
        </div>
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Playing style</h4>
        <div style={grid}>
          {TEN_KEYS.map(k => { const sc = ensureTen(p)?.[k] ?? 50, roles = gm.rolesOf(p), norms = gm.db.norms;
            if (k === 'usage') { const lo = Math.ceil(expUsg(p, norms, roles, 2)), hi = Math.floor(expUsg(p, norms, roles, 98)); return num('Usage rate', Math.round(expUsg(p, norms, roles, sc)), lo, hi, v => mut(q => { ensureTen(q); q.ten = { ...q.ten, usage: usageScoreFor(q, norms, roles, v) }; }), undefined, '% (USG%)'); }
            if ((ZONE_TEN as readonly string[]).includes(k)) { const z = k as ZoneTen, lo = Math.ceil(zoneShares(p, norms, roles, { [z]: 2 })[z]), hi = Math.floor(zoneShares(p, norms, roles, { [z]: 98 })[z]); return num(TEN_LABEL[k], Math.round(zoneShares(p, norms, roles)[z]), lo, Math.max(lo + 1, hi), v => mut(q => { ensureTen(q); q.ten = { ...q.ten, [z]: zoneScoreFor(q, norms, roles, z, v) }; }), undefined, '% of shots'); } // a zone's share of his shots (the others make room)
            if (k === 'cns' || k === 'pullup') { const lo = Math.ceil(jumpShares(p, norms, roles, { [k]: 2 })[k]), hi = Math.floor(jumpShares(p, norms, roles, { [k]: 98 })[k]); return num(TEN_LABEL[k], Math.round(jumpShares(p, norms, roles)[k]), lo, Math.max(lo + 1, hi), v => mut(q => { ensureTen(q); q.ten = { ...q.ten, [k]: jumpScoreFor(q, norms, roles, k, v) }; }), undefined, '% of shots'); } // a share of his jump shots (the other makes room)
            if (k === 'ftr') { const lo = Math.ceil(tenUnit('ftr', 2) * 100), hi = Math.floor(tenUnit('ftr', 98) * 100); return num(TEN_LABEL[k], Math.round(tenUnit('ftr', sc) * 100), lo, hi, v => mut(q => { ensureTen(q); q.ten = { ...q.ten, ftr: tenScore('ftr', v / 100) }; }), undefined, 'FTA per 100 FGA'); }
            const u = k as Exclude<TenKey, 'usage'>, lo = Math.ceil(tenUnit(u, 2)), hi = Math.floor(tenUnit(u, 98)); return num(TEN_LABEL[k], Math.round(tenUnit(u, sc)), lo, Math.max(lo + 1, hi), v => mut(q => { ensureTen(q); q.ten = { ...q.ten, [k]: tenScore(u, v) }; }), undefined, tenSuffix(u)); })}
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '12.5px', margin: '6px 0' }}><input type="checkbox" checked={!!p.tenLock} onChange={e => mut(q => { if (e.target.checked) q.tenLock = true; else delete q.tenLock; })} /> Lock his tendencies (they stop evolving)</label>
        <p style={{ ...muted, fontSize: '11.5px' }}>The shot categories the NBA tracks, in its units: usage rate (USG%); shooting by zone (restricted area, in the paint outside it, mid-range, corner three, above the break three), as shares of his shots that always add up to 100%; catch-and-shoot and pull-up jumpers as shares of his shots; and free throw rate (free throw attempts per 100 field goal attempts). They evolve on their own toward what his skills, role and team ask of him (a bigger step each summer); his ratings still decide whether the shots go in.</p>
        <ContractEditor vm={vm} p={p} mut={mut} grid={grid} />
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Locked</h4>
        <div style={{ fontSize: '12px', ...muted }}>
          <div>Player ID #{p.id}: permanent, so saves can’t be corrupted.</div>
          <div>{(p.stats || []).filter(r => r.season < gm.Y).length} past-season stat lines: read-only. Edits apply to the current and future seasons.</div>
          <div>Engine formulas (Four Factors tiebreaker, usage gatekeeper, bell-curve mean) can’t be edited.</div>
        </div>
      </section>
    </div>
  );
}

// God Mode contract editor: type, salary, length, raises, option, trade kicker, no-trade
// clause, extension and asking price. No CBA checks: God Mode can write any deal.
const CTYPES: [string, string][] = [['standard', 'Veteran (standard)'], ['min', 'Minimum'], ['max', 'Max'], ['rookie', 'Rookie scale'], ['twoWay', 'Two-way'], ['ex10', 'Exhibit 10'], ['tenDay', '10-day'], ['hardship', 'Hardship']];
function ContractEditor({ vm, p, mut, grid }: { vm: VM; p: any; mut: (f: (p: any) => void) => void; grid: any }) {
  const { gm, s } = vm.ctx, Y = gm.Y, lbl = (y: number) => y - 1 + '–' + String(y).slice(2);
  const tid = Object.keys(s.rosters).map(Number).find(t => (s.rosters[t] || []).includes(p.id)), fa = (s.fa || []).includes(p.id);
  const ctype = p.ctype === 'rookie' || p.rookieScale ? 'rookie' : CTYPES.some(c => c[0] === p.ctype) ? p.ctype : 'standard';
  const setType = (v: string) => mut(q => {
    const was = q.ctype; q.ctype = v;
    if (v === 'rookie') q.rookieScale = true; else delete q.rookieScale;
    if (v === 'twoWay') { q.capOverride = 0; q.twoWay = { tid: tid ?? q.twoWay?.tid ?? -1, games: q.twoWay?.games || 0 }; } else { delete q.twoWay; if (was === 'twoWay') delete q.capOverride; }
    if (v === 'tenDay' || v === 'hardship') q.tenDay = { tid: tid ?? -1, start: s.day || 0 }; else delete q.tenDay;
  });
  const years: number[] = []; for (let y = Y; y <= Math.max(p.exp || Y, Y) + (p.ext ? p.ext.yrs : 0); y++) years.push(y);
  return (<>
    <h4 style={{ ...ruleH4, marginTop: '18px' }}>Contract</h4>
    <div style={grid}>
      <span style={muted}>Status</span>
      <span style={{ fontSize: '12.5px' }}>{tid != null && tid >= 0 ? 'Under contract with ' + s.teams[tid].region + ' ' + s.teams[tid].name : fa ? 'Free agent' : p.abroad ? 'Playing overseas' : p.cls ? 'Draft prospect' : 'Unsigned'}</span>
      <span style={muted}>Type</span>
      <select className="input" value={ctype} onChange={e => setType(e.target.value)} style={{ width: 'auto', justifySelf: 'start' }}>{CTYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <span style={muted}>Salary {lbl(Y)}</span>
      <NumInput value={+(p.amt || 0)} min={0} max={150} step={0.01} width={90} onValue={v => mut(q => { q.amt = v; })} suffix="$M" />
      <span style={muted}>Runs through</span>
      <select className="input" value={Math.max(p.exp || Y, Y)} onChange={e => mut(q => { q.exp = +e.target.value; if (q.opt) q.opt = { ...q.opt, season: q.exp }; })} style={{ width: 'auto', justifySelf: 'start' }}>
        {Array.from({ length: 7 }, (_, k) => Y + k).map(y => <option key={y} value={y}>{lbl(y)} ({y - Y + 1} season{y === Y ? '' : 's'})</option>)}
      </select>
      <span style={muted}>Annual raise</span>
      <NumInput value={Math.round((p.raise || 0) * 1000) / 10} min={0} max={10} step={0.5} width={70} onValue={v => mut(q => { q.raise = v / 100; })} suffix="%" />
      <span style={muted}>Option</span>
      <select className="input" value={p.opt?.kind || 'none'} disabled={(p.exp || Y) <= Y} onChange={e => mut(q => { if (e.target.value === 'none') delete q.opt; else q.opt = { kind: e.target.value, season: q.exp }; })} style={{ width: 'auto', justifySelf: 'start' }}>
        <option value="none">None</option><option value="player">Player option (final season)</option><option value="team">Team option (final season)</option>
      </select>
      <span style={muted}>Trade kicker</span>
      <NumInput value={Math.round((p.kicker || 0) * 100)} min={0} max={15} step={1} width={70} onValue={v => mut(q => { q.kicker = v / 100; })} suffix="%" />
      <span style={muted}>No-trade clause</span>
      <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '12.5px' }}><input type="checkbox" checked={!!p.ntc} onChange={e => mut(q => { q.ntc = e.target.checked; })} /> He must approve any trade</label>
      <span style={muted}>Cap hit</span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '12.5px' }}>
        <NumInput value={p.capOverride ?? +(gm.capHit(p) - (p.inc || []).filter((x: any) => x.likely).reduce((a: number, x: any) => a + x.amt, 0)).toFixed(2)} min={0} max={150} step={0.01} width={90} onValue={v => mut(q => { q.capOverride = v; })} suffix="$M" />
        {p.capOverride != null && ctype !== 'twoWay' && <button className="btn btn-ghost" style={{ fontSize: '11.5px', padding: '1px 6px' }} onClick={() => mut(q => { delete q.capOverride; })} title="Count his salary again">Use salary</button>}
      </span>
      {p.ext && <><span style={muted}>Extension</span>
        <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '12.5px' }}>
          <NumInput value={p.ext.amt} min={0} max={150} step={0.01} width={90} onValue={v => mut(q => { q.ext = { ...q.ext, amt: v }; })} suffix="$M" />
          <NumInput value={p.ext.yrs} min={1} max={5} step={1} width={60} onValue={v => mut(q => { q.ext = { ...q.ext, yrs: v }; })} suffix="yrs" />
          <button className="btn btn-ghost" style={{ fontSize: '11.5px', padding: '1px 6px' }} onClick={() => mut(q => { delete q.ext; })}>Remove</button>
        </span></>}
      <span style={muted}>Asking price</span>
      <span style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '12.5px' }}><NumInput value={+(p.ask || 0)} min={0} max={150} step={0.01} width={90} onValue={v => mut(q => { q.ask = v; })} suffix="$M" /><span style={muted}>{fa ? 'what he wants per year as a free agent' : 'his price when he next hits free agency'}</span></span>
    </div>
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '12px', marginTop: 8 }}>
      {years.map(y => { const v = gm.salAt(p, y); return <span key={y} style={{ padding: '2px 8px', border: '1px solid var(--color-divider)', borderRadius: 6, color: p.opt?.season === y ? 'var(--color-accent-700)' : undefined }} title={p.opt?.season === y ? (p.opt.kind === 'player' ? 'Player' : 'Team') + ' option' : y > p.exp ? 'Extension' : ''}>{lbl(y)} · ${v.toFixed(2)}M{p.opt?.season === y ? ' (' + (p.opt.kind === 'player' ? 'PO' : 'TO') + ')' : ''}</span>; })}
    </div>
    <p style={{ ...muted, fontSize: '11.5px' }}>God Mode skips the CBA: any salary, length or clause is allowed. Changes count right away on the cap sheet, in trades and in payroll.</p>
  </>);
}
