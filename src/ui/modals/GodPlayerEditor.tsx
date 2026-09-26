// God Mode player editor, part two: bio (first/last names in Romanized and native
// script, date of birth, height, weight, wingspan), psychology, fatigue, specific
// injuries and a custom headshot. The player's ID and past-season stats stay locked.
import { useState } from 'react';
import type { VM } from '../vm';
import { processImage } from '../upload';
import { Combo, CountryPicker, Dice, muted, NumInput, ruleH4 } from '../kit';
import { namePools } from '../../data/world';
import { randomTeamIn } from '../../data/randomTeam';
import { leaguesIn } from '../../data/leagues';
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
  // "Playing for": the leagues in his country (top tier first), then the teams in the chosen
  // league, or every team in the country when the league is blank or typed by hand.
  const lgs = p.from ? leaguesIn(p.from.country || p.raised || p.born) : [], curL = lgs.find(x => x.lg === p.from?.lg);
  const teamOpts = curL ? curL.teams.map(t => ({ v: t })) : lgs.flatMap(x => x.teams.map(t => ({ v: t, sub: x.lg })));
  const C = gm.db.C, lf = p.familyFirst ?? !!allPools()[C[p.rep]?.pool]?.lf;
  const parts = String(p.name).split(' '), first = p.first ?? (lf ? parts.slice(1).join(' ') : parts[0]), last = p.last ?? (lf ? parts[0] : parts.slice(1).join(' '));
  const origin = originSel ?? p.rep;
  const undo = s.nameUndo && s.nameUndo.pid === p.id ? s.nameUndo : null;
  const reroll = (code: string) => { const prev = { pid: p.id, name: p.name, native: p.native, first: p.first, last: p.last, nativeFirst: p.nativeFirst, nativeLast: p.nativeLast, familyFirst: p.familyFirst, race: p.race, heritage: p.heritage, her: p.her, born: p.born, raised: p.raised, city: p.city, elig: p.elig }; const { race, heritage, ...nm } = randomName(code, Math.random, bg || undefined); Object.assign(p, nm, { race, heritage, her: code });
    // His hometown moves with him (eligibility is left alone: edit it on the profile).
    const cities = C[code]?.cities || []; if (cities.length) p.city = cities[Math.floor(Math.random() * cities.length)]; p.born = code; p.raised = code; gm.resetFace(p.id); gm.setState(st => ({ gv: (st.gv || 0) + 1, nameUndo: prev })); };
  const doUndo = () => { if (!undo) return; const { pid, ...rest } = undo; Object.keys(rest).forEach(k => (rest[k] === undefined ? delete p[k] : (p[k] = rest[k]))); if (rest.her) gm.resetFace(pid); gm.setState({ nameUndo: null, gv: (s.gv || 0) + 1 }); };
  const nat = p.native || '', cjk = CJK.test(nat);
  const nFirst = p.nativeFirst ?? (cjk ? nat.slice(1) : nat.split(' ')[0] || ''), nLast = p.nativeLast ?? (cjk ? nat.slice(0, 1) : nat.split(' ').slice(1).join(' '));
  const setNames = (f: string, l: string, nf: string, nl: string) => mut(q => { q.first = f; q.last = l; q.name = (lf ? l + ' ' + f : f + ' ' + l).trim(); q.nativeFirst = nf; q.nativeLast = nl; q.native = CJK.test(nf + nl) ? nl + nf : (nf + ' ' + nl).trim(); });
  const hIn = inchesOf(p.hgt), wing = p.wing ?? hIn + 3 + (p.id % 4);
  const dob = p.dob || (gm.Y - 1 - p.age) + '-' + String(1 + (p.id % 12)).padStart(2, '0') + '-' + String(1 + (p.id % 28)).padStart(2, '0');
  const num = (label: string, v: number, mn: number, mx: number, set: (v: number) => void, fmt?: (v: number) => string, unit?: string, rand?: () => number) => (
    <>
      <span style={muted}>{label}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}><NumInput value={v} min={mn} max={mx} step={1} onValue={set} suffix={(unit ? unit : '') + (fmt ? (unit ? ' · ' : '') + fmt(v) : '') || mn + '–' + mx} />{rand && <Dice onClick={() => set(rand())} title={'Random ' + label.toLowerCase()} />}</span>
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
          <span style={muted}>First name</span>{inRow(<input className="input" value={first} onChange={e => setNames(e.target.value, last, nFirst, nLast)} style={{ flex: 1, minWidth: 0 }} />, () => { const r = RN(); setNames(r.first, last, r.nativeFirst || nFirst, nLast); }, 'A random first name from the country above')}
          <span style={muted}>Last name</span>{inRow(<input className="input" value={last} onChange={e => setNames(first, e.target.value, nFirst, nLast)} style={{ flex: 1, minWidth: 0 }} />, () => { const r = RN(); setNames(first, r.last, nFirst, r.nativeLast || nLast); }, 'A random last name from the country above')}
          <span style={muted}>Native first</span>{inRow(<input className="input" value={nFirst} placeholder="e.g. 伟 or Никола" onChange={e => setNames(first, last, e.target.value, nLast)} style={{ flex: 1, minWidth: 0 }} />, () => setNames(first, last, RN().nativeFirst || '', nLast), 'A random native-script first name (countries with their own script)')}
          <span style={muted}>Native last</span>{inRow(<input className="input" value={nLast} placeholder="e.g. 陈 or Јокић" onChange={e => setNames(first, last, nFirst, e.target.value)} style={{ flex: 1, minWidth: 0 }} />, () => setNames(first, last, nFirst, RN().nativeLast || ''), 'A random native-script last name (countries with their own script)')}
          <span style={muted}>Date of birth</span>
          {inRow(<input className="input" type="date" style={{ flex: 1, minWidth: 0 }} value={dob} onChange={e => { const v = e.target.value; if (!/^\d{4}-\d\d-\d\d$/.test(v)) return; mut(q => { q.dob = v; const y = +v.slice(0, 4), md = v.slice(5); q.age = cl(gm.Y - 1 - y - (md > '10-01' ? 1 : 0), 16, 45); if (q.age >= 29) q.pot = Math.max(q.ovr, Math.min(q.pot, q.ovr + 2)); }); }} />, () => { const age = 19 + Math.floor(Math.random() * 17), y = gm.Y - 1 - age, m = 1 + Math.floor(Math.random() * 12), d = 1 + Math.floor(Math.random() * 28); const v = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0'); const e = { target: { value: v } }; { const v = e.target.value; if (!/^\d{4}-\d\d-\d\d$/.test(v)) return; mut(q => { q.dob = v; const y = +v.slice(0, 4), md = v.slice(5); q.age = cl(gm.Y - 1 - y - (md > '10-01' ? 1 : 0), 16, 45); if (q.age >= 29) q.pot = Math.max(q.ovr, Math.min(q.pot, q.ovr + 2)); }); } }, 'A random birthday (age 19–35)')}
          {num('Height', hIn, 66, 91, v => mut(q => { const d = v - inchesOf(q.hgt); q.hgt = fmtH(v); q.r.hgt = cl(q.r.hgt + d * 4, 4, 100); }), fmtH, 'inches', () => (p.grp === 'G' ? 72 + Math.floor(Math.random() * 7) : p.grp === 'W' ? 76 + Math.floor(Math.random() * 6) : 80 + Math.floor(Math.random() * 7)))}
          {num('Weight', p.wt, 150, 320, v => mut(q => { const d = v - q.wt; q.wt = v; q.r.stre = cl(Math.round(q.r.stre + d / 4), 4, 100); q.r.spd = cl(Math.round(q.r.spd - d / 8), 4, 100); }), undefined, 'lb', () => Math.round(hIn * 2.9 - 5 + Math.random() * 25))}
          {num('Wingspan', wing, hIn - 8, hIn + 14, v => mut(q => { q.wing = v; }), v => fmtH(v) + ' (' + (v - hIn >= 0 ? '+' : '−') + Math.abs(v - hIn) + '″ vs height)', 'inches', () => hIn + Math.round(Math.max(-6, Math.min(12, (Math.random() + Math.random() + Math.random() - 1.5) * 6 + 3.8))))}
          <span style={muted}>Hometown</span>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <input className="input" value={p.city || ''} onChange={e => mut(q => { q.city = e.target.value; })} placeholder="City" style={{ flex: 1, minWidth: 120 }} />
            <CountryPicker C={C} value={p.born} onPick={c => mut(q => { q.born = c; })} width={170} />
            <button className="btn btn-ghost" title="A random city in that country" onClick={() => mut(q => { const cs = C[q.born]?.cities || []; if (cs.length) q.city = cs[Math.floor(Math.random() * cs.length)]; })} style={{ fontSize: '12px' }}>🎲</button>
          </span>
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
