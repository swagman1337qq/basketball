// Settings → Award formulas: edit each award's formula (checked as you type), import a
// Basketball GM award-settings JSON, export, or go back to the defaults. Changes apply
// to the next vote; past seasons' awards stay as they were.
import { useState } from 'react';
import type { VM } from '../vm';
import { DEFAULT_AWARDS, type AwardDef } from '../../data/awardDefs';
import { awardDefs } from '../../engine/awards';
import { compileFormula } from '../../engine/formula';
import { muted } from '../kit';

const VARS = 'pts trb ast stl blk tov pf orb drb fga (per game) · gp gs min · per ewa ws ows dws ws48 bpm obpm dbpm vorp · tsp efg usgp astp orbp drbp trbp stlp blkp tovp · ortg drtg pm100 onOff100 · winp teamWs seasonFraction · numWon.X numWonConsecutive.X · series awards: gmsc pm won';
const check = (f: string) => { try { compileFormula(f); return ''; } catch (e: any) { return e.message; } };

export function AwardFormulas({ vm }: { vm: VM }) {
  const { gm, s } = vm.ctx, defs = awardDefs(s), custom = !!(s.awardDefs && s.awardDefs.length);
  const [open, setOpen] = useState(false), [draft, setDraft] = useState<Record<string, string>>({}), [msg, setMsg] = useState('');
  const save = (list: AwardDef[]) => gm.setState({ awardDefs: list });
  const setF = (sn: string, f: string) => { setDraft({ ...draft, [sn]: f }); if (!check(f)) save(defs.map(d => (d.shortName === sn ? { ...d, formula: f } : d))); };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      const j = JSON.parse((await file.text()).replace(/^﻿/, ''));
      const list: AwardDef[] = Array.isArray(j) ? j : j.gameAttributes?.awards || j.awards;
      if (!Array.isArray(list) || !list.length) throw new Error('No "awards" list in that file.');
      const bad = list.find(d => !d.shortName || !d.name || typeof d.formula !== 'string' || check(d.formula));
      if (bad) throw new Error('“' + (bad.name || bad.shortName || '?') + '” has an invalid formula: ' + check(bad.formula || ''));
      save(list); setDraft({}); setMsg('Imported ' + list.length + ' awards. They apply from the next vote.');
    } catch (e: any) { setMsg('Import failed: ' + e.message); }
  };
  const exportFile = () => { const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 73, gameAttributes: { awards: defs } }, null, 2)], { type: 'application/json' })); const a = document.createElement('a'); a.href = url; a.download = 'award_settings.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  return (
    <div style={{ padding: '12px 0', borderBottom: '1px solid var(--color-divider)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '180px minmax(0,1fr) auto', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 600 }}>Award formulas</div>
        <div>
          <div>{defs.length} awards · {custom ? 'custom set' : 'default set'}</div>
          <div style={{ fontSize: '12px', ...muted }}>Basketball GM format. Changes apply to the next vote; past seasons keep their winners.</div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-secondary" onClick={() => setOpen(!open)} style={{ whiteSpace: 'nowrap' }}>{open ? 'Hide' : 'Edit'}</button>
          <label className="btn btn-secondary" style={{ whiteSpace: 'nowrap', cursor: 'pointer' }}>Import<input type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={e => importFile(e.target.files?.[0])} /></label>
          <button className="btn btn-secondary" onClick={exportFile}>Export</button>
          {custom && <button className="btn btn-ghost" onClick={() => { gm.setState({ awardDefs: null }); setDraft({}); setMsg('Back to the default formulas.'); }}>Reset</button>}
        </div>
      </div>
      {msg && <p style={{ fontSize: '12px', margin: '8px 0 0', color: msg.startsWith('Import failed') ? 'var(--gm-bad)' : 'var(--gm-good)' }}>{msg}</p>}
      {open && (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <p style={{ fontSize: '12px', ...muted, margin: 0 }}>Variables: {VARS}. Functions: max, min, abs, sqrt. Scores at or below −1000 mean “not eligible”.</p>
          {defs.map(d => { const f = draft[d.shortName] ?? d.formula, err = check(f); const DEF = DEFAULT_AWARDS.find(x => x.shortName === d.shortName); return (
            <div key={d.shortName}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '13px' }}>
                <b>{d.name}</b><span style={{ ...muted, fontSize: '11.5px' }}>{d.shortName}{d.rookie ? ' · rookies' : ''}{d.bench ? ' · bench' : ''}{d.mip ? ' · vs last season' : ''}{d.numTeams ? ' · ' + d.numTeams + ' teams' : ''}{d.statRange === -1 ? ' · Finals' : d.statRange === -2 ? ' · conference finals' : ''}</span>
                {DEF && DEF.formula !== f && <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '0 6px', marginLeft: 'auto' }} onClick={() => setF(d.shortName, DEF.formula)}>Restore default</button>}
              </div>
              <textarea className="input" spellCheck={false} value={f} onChange={e => setF(d.shortName, e.target.value)} style={{ minHeight: Math.min(170, 30 + 18 * Math.ceil(f.length / 105)) + 'px', fontFamily: 'ui-monospace, monospace', fontSize: '12px', borderColor: err ? 'var(--gm-bad)' : undefined }} />
              {err && <div style={{ color: 'var(--gm-bad)', fontSize: '11.5px' }}>{err} (not saved)</div>}
            </div>
          ); })}
        </div>
      )}
    </div>
  );
}
