import { useState } from 'react';
import type { Game } from '../../engine/Game';
import { ROLE_LABEL, ROLE_ORDER, type Coach, type CoachRole } from '../../engine/staff';
import { firstSeason } from '../../engine/contracts';
import { FACE_LOOKS, faceSvg } from '../../engine/faces';
import { coachBioDraft, saveCoachBio, randomCoachName, randomCoachCountry, type EditableCoach } from '../coachEditing';
import { CountryPicker, Dice, godBox, godBtn, muted, NumInput } from '../kit';
import { CoachFace, coachFaceData } from '../CoachFace';
import { FaceEditor } from './FaceEditor';
import {
  chooseIllustration,
  illustrationDefaults,
  readIllustration,
  rerollPersonFace,
  setIllustration,
} from '../../engine/illustratedPortraits';
import { newFullPortrait } from '../../engine/fullPortraits';

export function CoachBioEditor({ gm, coach, onSave }: { gm: Game; coach: Coach; onSave: () => void }) {
  const [draft, setDraft] = useState(() => coachBioDraft(gm, coach));
  const [message, setMessage] = useState('');
  const [faceDraft, setFaceDraft] = useState<EditableCoach | null>(null);
  const [, redrawFace] = useState(0);
  if (!gm.state.god) return null;
  const preview: EditableCoach = { ...coach, ...draft, born: gm.Y - draft.age, bioFace: true, next: draft.next || undefined };
  const changeAppearance = (patch: { fem?: boolean; race?: string }) => {
    const current = readIllustration(draft.faceX?.illustration),
      next = { ...draft, ...patch };
    if (current?.enabled) {
      const face = coachFaceData(gm, { ...preview, ...patch, faceX: undefined }, draft.age);
      setIllustration(
        next,
        current.v === 2 ? newFullPortrait(face, face.seed, 'staff') : illustrationDefaults(chooseIllustration(face, 'staff')),
      );
    } else if (patch.fem !== undefined) next.faceX = undefined;
    setDraft(next);
  };
  return (
    <section style={{ ...godBox, padding: 12, marginTop: 16 }} aria-label="God Mode staff editor">
      <h4 style={{ margin: '0 0 10px' }}>Edit staff · God Mode</h4>
      <fieldset
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
          <label htmlFor={'coach-name-' + coach.id}>Name</label>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              id={'coach-name-' + coach.id}
              aria-label="Staff name"
              value={draft.name}
              maxLength={100}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              style={{ width: '100%', minWidth: 0, flex: 1 }}
            />
            <Dice
              title="Randomize staff name"
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
            aria-label="Staff gender"
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
          <select aria-label="Staff race / appearance" value={draft.race} onChange={e => changeAppearance({ race: e.target.value })}>
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
            <Dice title="Randomize staff country" onClick={() => setDraft({ ...draft, nat: randomCoachCountry(gm.db.C, draft.nat) })} />
          </div>
        </div>
        {coach.play.k !== 'none' && (
          <label>
            Playing college/team
            <br />
            <input
              aria-label="Playing college/team"
              value={draft.where}
              maxLength={120}
              onChange={e => setDraft({ ...draft, where: e.target.value })}
              style={{ width: '100%' }}
            />
          </label>
        )}
        <label>
          Reputation
          <br />
          <NumInput value={draft.rep} min={0} max={100} width={80} onValue={rep => setDraft({ ...draft, rep })} />
        </label>
        <label>
          Coaching experience (years)
          <br />
          <NumInput value={draft.years} min={0} max={100} width={80} onValue={years => setDraft({ ...draft, years })} />
        </label>
        <label>
          Coaching team
          <br />
          <select
            aria-label="Coaching team"
            value={draft.tid ?? ''}
            style={{ width: '100%' }}
            onChange={e => {
              const tid = e.target.value === '' ? null : Number(e.target.value);
              setDraft(
                tid == null
                  ? { ...draft, tid, amt: 0, exp: 0, next: null }
                  : { ...draft, tid, exp: Math.max(draft.exp, firstSeason(gm, gm.state)) },
              );
            }}
          >
            <option value="">Available / no team</option>
            {[...gm.state.teams]
              .sort((a, b) => (a.region + ' ' + a.name).localeCompare(b.region + ' ' + b.name))
              .map(t => (
                <option key={t.tid} value={t.tid}>
                  {t.region} {t.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Coaching role
          <br />
          <select aria-label="Coaching role" value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as CoachRole })}>
            {ROLE_ORDER.map(role => (
              <option key={role} value={role}>
                {ROLE_LABEL[role]}
              </option>
            ))}
          </select>
        </label>
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
            disabled={draft.tid == null}
            onValue={amt => setDraft({ ...draft, amt })}
          />
        </label>
        <label>
          Contract end season
          <br />
          <NumInput
            value={draft.tid == null ? gm.Y : draft.exp}
            min={gm.Y}
            max={gm.Y + 100}
            width={100}
            disabled={draft.tid == null}
            onValue={exp => setDraft({ ...draft, exp })}
          />
        </label>
      </fieldset>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 14 }}>
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
            faceEl: () => faceSvg(coachFaceData(gm, faceDraft, gm.Y - faceDraft.born), ['#2f3136', '#d8d4cc']),
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
      {draft.tid != null && (
        <div style={{ marginTop: 12 }}>
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
                  min={gm.Y}
                  max={gm.Y + 100}
                  width={100}
                  onValue={start => setDraft({ ...draft, next: { ...draft.next!, start } })}
                />
              </label>
              <label>
                Extension ends
                <br />
                <NumInput
                  value={draft.next.exp}
                  min={gm.Y}
                  max={gm.Y + 100}
                  width={100}
                  onValue={exp => setDraft({ ...draft, next: { ...draft.next!, exp } })}
                />
              </label>
            </div>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <button
          className="btn btn-secondary"
          style={godBtn}
          disabled={!!faceDraft}
          onClick={() => {
            const error = saveCoachBio(gm, coach.id, draft);
            setMessage(error || 'Changes saved.');
            if (!error) {
              setDraft(coachBioDraft(gm, coach));
              onSave();
            }
          }}
        >
          Save changes
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setDraft(coachBioDraft(gm, coach));
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
