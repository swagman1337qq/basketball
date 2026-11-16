import { useState } from 'react';
import type { Game } from '../../engine/Game';
import type { Coach } from '../../engine/staff';
import { FACE_LOOKS } from '../../engine/faces';
import { coachBioDraft, saveCoachBio } from '../coachEditing';
import { CountryPicker, godBox, godBtn, muted, NumInput } from '../kit';

export function CoachBioEditor({ gm, coach, onSave }: { gm: Game; coach: Coach; onSave: () => void }) {
  const [draft, setDraft] = useState(() => coachBioDraft(gm, coach));
  const [message, setMessage] = useState('');
  if (!gm.state.god) return null;
  return (
    <section style={{ ...godBox, padding: 12, marginTop: 16 }} aria-label="God Mode staff editor">
      <h4 style={{ margin: '0 0 10px' }}>Edit staff · God Mode</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 12 }}>
        <label>
          Name
          <br />
          <input
            aria-label="Staff name"
            value={draft.name}
            maxLength={100}
            onChange={e => setDraft({ ...draft, name: e.target.value })}
            style={{ width: '100%' }}
          />
        </label>
        <label>
          Age
          <br />
          <NumInput value={draft.age} min={18} max={100} width={80} onValue={age => setDraft({ ...draft, age })} />
        </label>
        <label>
          Race / appearance
          <br />
          <select aria-label="Staff race / appearance" value={draft.race} onChange={e => setDraft({ ...draft, race: e.target.value })}>
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
          <CountryPicker C={gm.db.C} value={draft.nat} onPick={nat => setDraft({ ...draft, nat })} width="100%" />
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
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 12 }}>
        <button
          className="btn btn-secondary"
          style={godBtn}
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
