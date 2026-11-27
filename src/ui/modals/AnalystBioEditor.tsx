// God Mode: edit an analyst (analystEditing.ts). On the analyst's profile, Overview tab.
import { useState } from 'react';
import type { Game } from '../../engine/Game';
import type { Analyst } from '../../engine/analytics';
import { FACE_LOOKS, faceSvg } from '../../engine/faces';
import { readIllustration, rerollPersonFace, setIllustration } from '../../engine/illustratedPortraits';
import { newFullPortrait } from '../../engine/fullPortraits';
import { CountryPicker, Dice, godBox, godBtn, godText, muted, NumInput } from '../kit';
import { CoachFace, coachFaceData } from '../CoachFace';
import { FaceEditor } from './FaceEditor';
import { randomCoachCountry, randomCoachName } from '../coachEditing';
import { ANALYST_FACE_ID, analystBioDraft, analystMinExp, saveAnalystBio, type EditableAnalyst } from '../analystEditing';

const BIG = Number.MAX_SAFE_INTEGER; // God Mode: no limit on how far out a contract runs

export function AnalystBioEditor({ gm, analyst, onSave }: { gm: Game; analyst: Analyst; onSave: () => void }) {
  const a = analyst as EditableAnalyst;
  const [draft, setDraft] = useState(() => analystBioDraft(gm, a));
  const [message, setMessage] = useState('');
  const [faceDraft, setFaceDraft] = useState<any>(null);
  const [, redrawFace] = useState(0);
  if (!gm.state.god) return null;
  const hired = a.tid != null && !a.ret,
    minExp = analystMinExp(gm);
  // The face as CoachFace draws it (its own id range), with the draft's look.
  const preview: any = { ...a, ...draft, id: ANALYST_FACE_ID + a.id, born: gm.Y - draft.age, bioFace: true };
  const changeAppearance = (patch: { fem?: boolean; race?: string }) => {
    const current = readIllustration(draft.faceX?.illustration),
      next = { ...draft, ...patch };
    if (current?.enabled) {
      const face = coachFaceData(gm, { ...preview, ...patch, faceX: undefined }, draft.age);
      setIllustration(next, newFullPortrait(face, face.seed, 'staff'));
    } else if (patch.fem !== undefined) next.faceX = undefined;
    setDraft(next);
  };
  return (
    <section style={{ ...godBox, padding: 12, marginTop: 16 }} aria-label="God Mode analyst editor">
      <h4 style={{ margin: '0 0 10px', ...godText }}>Edit analyst · God Mode</h4>
      <fieldset
        className="god-zone"
        disabled={!!faceDraft}
        style={{
          border: 0,
          padding: 0,
          margin: 0,
          minWidth: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 12,
        }}
      >
        <div>
          <label htmlFor={'analyst-name-' + a.id}>Name</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              id={'analyst-name-' + a.id}
              aria-label="Analyst name"
              value={draft.name}
              maxLength={100}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              style={{ width: '100%', minWidth: 0, flex: 1 }}
            />
            <Dice
              title="Randomize analyst name"
              onClick={() => setDraft({ ...draft, name: randomCoachName(draft.nat, draft.fem, draft.name) })}
            />
          </div>
        </div>
        <label>
          Age
          <br />
          <NumInput value={draft.age} min={18} max={100} width={80} onValue={age => setDraft({ ...draft, age })} />
        </label>
        <label>
          Gender
          <br />
          <select
            aria-label="Analyst gender"
            value={draft.fem ? 'woman' : 'man'}
            onChange={e => changeAppearance({ fem: e.target.value === 'woman' })}
          >
            <option value="man">Man</option>
            <option value="woman">Woman</option>
          </select>
        </label>
        <label>
          Race / appearance
          <br />
          <select aria-label="Analyst race / appearance" value={draft.race} onChange={e => changeAppearance({ race: e.target.value })}>
            {FACE_LOOKS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div>
          Nationality
          <br />
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <CountryPicker C={gm.db.C} value={draft.nat} onPick={nat => setDraft({ ...draft, nat })} width="100%" />
            </div>
            <Dice title="Randomize analyst country" onClick={() => setDraft({ ...draft, nat: randomCoachCountry(gm.db.C, draft.nat) })} />
          </div>
        </div>
        <label>
          Years in analytics
          <br />
          <NumInput value={draft.years} min={0} max={100} width={80} onValue={years => setDraft({ ...draft, years })} />
        </label>
        {hired && (
          <label>
            Annual salary
            <br />
            <NumInput
              value={draft.amt}
              min={0}
              max={1000}
              step={0.01}
              width={100}
              suffix="$M"
              onValue={amt => setDraft({ ...draft, amt })}
            />
          </label>
        )}
        {hired && (
          <label>
            Contract end season
            <br />
            <NumInput value={draft.exp} min={minExp} max={BIG} width={100} onValue={exp => setDraft({ ...draft, exp })} />
          </label>
        )}
      </fieldset>
      <div className="god-zone" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
        <CoachFace gm={gm} c={preview} age={draft.age} size={72} />
        <button className="btn btn-secondary" disabled={!!faceDraft} onClick={() => setFaceDraft(structuredClone(preview))}>
          Edit face
        </button>
        <button
          className="btn btn-secondary"
          disabled={!!faceDraft}
          onClick={() => {
            const next = structuredClone(draft);
            rerollPersonFace(next, Math.floor(Math.random() * 1e9), 'staff');
            setDraft(next);
          }}
        >
          🎲 Randomize face
        </button>
      </div>
      {faceDraft && (
        <FaceEditor
          p={faceDraft}
          context="staff"
          gm={{
            face: () => coachFaceData(gm, faceDraft, gm.Y - faceDraft.born),
            faceEl: () => faceSvg(coachFaceData(gm, faceDraft, gm.Y - faceDraft.born), ['#2f3136', '#d8d4cc'], undefined, 'staff'),
            resetFace: () => {},
            setState: () => redrawFace(n => n + 1),
          }}
          onClose={() => {
            setDraft({
              ...draft,
              race: faceDraft.race,
              faceSeed: faceDraft.faceSeed,
              faceX: faceDraft.faceX ? structuredClone(faceDraft.faceX) : undefined,
            });
            setFaceDraft(null);
          }}
        />
      )}
      {hired && (
        <div className="god-zone" style={{ marginTop: 12 }}>
          <label>
            <input
              type="checkbox"
              checked={!!draft.next}
              onChange={e =>
                setDraft({ ...draft, next: e.target.checked ? { start: draft.exp + 1, exp: draft.exp + 3, amt: draft.amt } : null })
              }
            />{' '}
            Signed extension
          </label>
          {draft.next && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
              <label>
                Extension salary
                <br />
                <NumInput
                  value={draft.next.amt}
                  min={0}
                  max={1000}
                  step={0.01}
                  width={100}
                  suffix="$M"
                  onValue={amt => setDraft({ ...draft, next: { ...draft.next!, amt } })}
                />
              </label>
              <label>
                Extension starts
                <br />
                <NumInput
                  value={draft.next.start}
                  min={minExp}
                  max={BIG}
                  width={100}
                  onValue={start => setDraft({ ...draft, next: { ...draft.next!, start } })}
                />
              </label>
              <label>
                Extension ends
                <br />
                <NumInput
                  value={draft.next.exp}
                  min={minExp}
                  max={BIG}
                  width={100}
                  onValue={exp => setDraft({ ...draft, next: { ...draft.next!, exp } })}
                />
              </label>
            </div>
          )}
        </div>
      )}
      <p style={{ margin: '10px 0 0', fontSize: '12px', ...muted }}>
        {hired
          ? 'Contracts can run as far out as you like (a deal through 3000 is fine). A contract ends on June 30 of its last season.'
          : 'Not in a department: hire them on the Staff screen to set a contract.'}
      </p>
      <div className="god-zone" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <button
          className="btn btn-secondary"
          style={godBtn}
          disabled={!!faceDraft}
          onClick={() => {
            const error = saveAnalystBio(gm, a.id, draft);
            setMessage(error || 'Changes saved.');
            if (!error) {
              setDraft(analystBioDraft(gm, a));
              onSave();
            }
          }}
        >
          Save changes
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setDraft(analystBioDraft(gm, a));
            setFaceDraft(null);
            setMessage('');
          }}
        >
          Reset
        </button>
        <span role="status" style={muted}>
          {message}
        </span>
      </div>
    </section>
  );
}
