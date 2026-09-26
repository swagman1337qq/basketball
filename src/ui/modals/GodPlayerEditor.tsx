// God Mode player editor, part two: bio (first/last names in Romanized and native
// script, date of birth, height, weight, wingspan), psychology, fatigue, specific
// injuries and a custom headshot. The player's ID and past-season stats stay locked.
import { useState } from 'react';
import type { VM } from '../vm';
import { processImage } from '../upload';
import { CountryPicker, muted, NumInput, ruleH4 } from '../kit';
import { namePools } from '../../data/world';
import { allPools, groupsOf, randomName } from '../../data/heritage';

const CJK = /[぀-ヿ㐀-鿿가-힯]/;
const INJ: [string, number, boolean, boolean][] = [['Bruised knee', 2, false, true], ['Ankle sprain', 5, false, false], ['Hamstring strain', 10, false, false], ['Broken wrist', 25, false, false], ['Torn ACL', 90, true, false], ['Achilles rupture', 110, true, false]];
const inchesOf = (h: string) => { const m = String(h || '').match(/(\d+)\D+(\d+)/); return m ? +m[1] * 12 + +m[2] : 78; };
const fmtH = (i: number) => Math.floor(i / 12) + '′' + (i % 12) + '″';
const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function GodPlayerEditor({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, p = gm.db.P[s.pid];
  const [err, setErr] = useState('');
  const [originSel, setOrigin] = useState<string | null>(null), [bg, setBg] = useState('');
  if (!p) return null;
  const mut = (f: (p: any) => void) => { f(p); gm.setState(st => ({ gv: (st.gv || 0) + 1 })); gm.enforceRetirement(); };
  const C = gm.db.C, lf = p.familyFirst ?? !!allPools()[C[p.rep]?.pool]?.lf;
  const parts = String(p.name).split(' '), first = p.first ?? (lf ? parts.slice(1).join(' ') : parts[0]), last = p.last ?? (lf ? parts[0] : parts.slice(1).join(' '));
  const origin = originSel ?? p.rep;
  const undo = s.nameUndo && s.nameUndo.pid === p.id ? s.nameUndo : null;
  const reroll = (code: string) => { const prev = { pid: p.id, name: p.name, native: p.native, first: p.first, last: p.last, nativeFirst: p.nativeFirst, nativeLast: p.nativeLast, familyFirst: p.familyFirst, race: p.race, heritage: p.heritage, her: p.her, born: p.born, raised: p.raised, city: p.city, elig: p.elig }; const { race, heritage, ...nm } = randomName(code, Math.random, bg || undefined); Object.assign(p, nm, { race, heritage, her: code });
    // His hometown moves with him: born and raised in that country, citizen by birth.
    const cities = C[code]?.cities || []; if (cities.length) p.city = cities[Math.floor(Math.random() * cities.length)]; p.born = code; p.raised = code; if (!(p.elig || []).some((e: any) => e.c === code)) p.elig = [{ c: code, why: 'citizen by birth' }, ...(p.elig || [])]; gm.resetFace(p.id); gm.setState(st => ({ gv: (st.gv || 0) + 1, nameUndo: prev })); };
  const doUndo = () => { if (!undo) return; const { pid, ...rest } = undo; Object.keys(rest).forEach(k => (rest[k] === undefined ? delete p[k] : (p[k] = rest[k]))); if (rest.her) gm.resetFace(pid); gm.setState({ nameUndo: null, gv: (s.gv || 0) + 1 }); };
  const nat = p.native || '', cjk = CJK.test(nat);
  const nFirst = p.nativeFirst ?? (cjk ? nat.slice(1) : nat.split(' ')[0] || ''), nLast = p.nativeLast ?? (cjk ? nat.slice(0, 1) : nat.split(' ').slice(1).join(' '));
  const setNames = (f: string, l: string, nf: string, nl: string) => mut(q => { q.first = f; q.last = l; q.name = (lf ? l + ' ' + f : f + ' ' + l).trim(); q.nativeFirst = nf; q.nativeLast = nl; q.native = CJK.test(nf + nl) ? nl + nf : (nf + ' ' + nl).trim(); });
  const hIn = inchesOf(p.hgt), wing = p.wing ?? hIn + 3 + (p.id % 4);
  const dob = p.dob || (gm.Y - 1 - p.age) + '-' + String(1 + (p.id % 12)).padStart(2, '0') + '-' + String(1 + (p.id % 28)).padStart(2, '0');
  const num = (label: string, v: number, mn: number, mx: number, set: (v: number) => void, fmt?: (v: number) => string, unit?: string) => (
    <>
      <span style={muted}>{label}</span>
      <NumInput value={v} min={mn} max={mx} step={1} onValue={set} suffix={(unit ? unit : '') + (fmt ? (unit ? ' · ' : '') + fmt(v) : '') || mn + '–' + mx} />
    </>
  );
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
          <span style={muted}>First name</span><input className="input" value={first} onChange={e => setNames(e.target.value, last, nFirst, nLast)} />
          <span style={muted}>Last name</span><input className="input" value={last} onChange={e => setNames(first, e.target.value, nFirst, nLast)} />
          <span style={muted}>Native first</span><input className="input" value={nFirst} placeholder="e.g. 伟 or Никола" onChange={e => setNames(first, last, e.target.value, nLast)} />
          <span style={muted}>Native last</span><input className="input" value={nLast} placeholder="e.g. 陈 or Јокић" onChange={e => setNames(first, last, nFirst, e.target.value)} />
          <span style={muted}>Date of birth</span>
          <input className="input" type="date" value={dob} onChange={e => { const v = e.target.value; if (!/^\d{4}-\d\d-\d\d$/.test(v)) return; mut(q => { q.dob = v; const y = +v.slice(0, 4), md = v.slice(5); q.age = cl(gm.Y - 1 - y - (md > '10-01' ? 1 : 0), 16, 45); if (q.age >= 29) q.pot = Math.max(q.ovr, Math.min(q.pot, q.ovr + 2)); }); }} />
          {num('Height', hIn, 66, 91, v => mut(q => { const d = v - inchesOf(q.hgt); q.hgt = fmtH(v); q.r.hgt = cl(q.r.hgt + d * 4, 4, 100); }), fmtH, 'inches')}
          {num('Weight', p.wt, 150, 320, v => mut(q => { const d = v - q.wt; q.wt = v; q.r.stre = cl(Math.round(q.r.stre + d / 4), 4, 100); q.r.spd = cl(Math.round(q.r.spd - d / 8), 4, 100); }), undefined, 'lb')}
          {num('Wingspan', wing, hIn - 8, hIn + 14, v => mut(q => { q.wing = v; }), v => fmtH(v) + ' (' + (v - hIn >= 0 ? '+' : '−') + Math.abs(v - hIn) + '″ vs height)', 'inches')}
          <span style={muted}>Hometown</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="input" value={p.city || ''} onChange={e => mut(q => { q.city = e.target.value; })} placeholder="City" style={{ flex: 1, minWidth: 120 }} />
            <CountryPicker C={C} value={p.born} onPick={c => mut(q => { q.born = c; if (!(q.elig || []).some((e: any) => e.c === c) && C[c]?.soli) q.elig = [...(q.elig || []), { c, why: 'born there' }]; })} width={170} />
            <button className="btn btn-ghost" title="A random city in that country" onClick={() => mut(q => { const cs = C[q.born]?.cities || []; if (cs.length) q.city = cs[Math.floor(Math.random() * cs.length)]; })} style={{ fontSize: '12px' }}>🎲</button>
          </span>
          {p.from && <><span style={muted}>{p.cls ? 'Playing for' : 'Came from'}</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="input" value={p.from.team || ''} onChange={e => mut(q => { q.from = { ...q.from, team: e.target.value }; })} placeholder="Team or school" style={{ flex: 1, minWidth: 120 }} />
            <input className="input" value={p.from.lg || ''} onChange={e => mut(q => { q.from = { ...q.from, lg: e.target.value }; })} placeholder="League" style={{ width: 110 }} />
            <CountryPicker C={C} value={p.from.country} onPick={c => mut(q => { q.from = { ...q.from, country: c }; })} width={150} />
            <button className="btn btn-ghost" title="A random team for where he grew up (college, club or school)" onClick={() => mut(q => { q.from = gm.pipe(q.raised || q.born, q.cls || 0); })} style={{ fontSize: '12px' }}>🎲</button>
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
        <h4 style={ruleH4}>Psychology</h4>
        <div style={grid}>
          {num('Work ethic', p.pers.work ?? 50, 0, 100, v => mut(q => (q.pers.work = v)))}
          {num('Loyalty', p.pers.loyalty ?? (p.pers.mot === 'Loyalty' ? 75 : 45), 0, 100, v => mut(q => (q.pers.loyalty = v)))}
          {num('Ambition', p.pers.ambition ?? (p.pers.mot === 'Money' || p.pers.mot === 'Fame' ? 75 : 45), 0, 100, v => mut(q => (q.pers.ambition = v)))}
          {num('Morale', p.moodAdj || 0, -30, 30, v => mut(q => (q.moodAdj = v)), undefined, '−30 to +30')}
          {num('Confidence', Math.round(p.conf ?? 50), 5, 95, v => mut(q => (q.conf = v)))}
        </div>
        <p style={{ ...muted, fontSize: '11.5px' }}>Work ethic scales monthly growth (±15%); loyalty vs ambition decides draft-night heists; morale shifts happiness; confidence nudges shooting and the adjustment period.</p>
        <h4 style={{ ...ruleH4, marginTop: '18px' }}>Status</h4>
        <div style={grid}>
          {num('Fatigue', Math.round(p.fat || 0), 0, 100, v => mut(q => (q.fat = v)))}
          <span style={muted}>Injury</span>
          <span style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <select className="input" value="" onChange={e => { const x = INJ.find(i => i[0] === e.target.value); if (x) mut(q => { q.inj = { name: x[0], games: x[1], major: x[2] || undefined, dtd: x[3] || undefined }; (q.injHist = q.injHist || []).push({ name: x[0], games: x[1], season: gm.seasonLbl(), god: true }); }); }}>
              <option value="">Trigger an injury…</option>{INJ.map(i => <option key={i[0]} value={i[0]}>{i[0]} ({i[1]}g{i[2] ? ', major' : i[3] ? ', day-to-day' : ''})</option>)}
            </select>
            {p.inj && <button className="btn btn-secondary" style={{ fontSize: '12px' }} onClick={() => mut(q => { delete q.inj; })}>Heal now</button>}
          </span>
        </div>
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
