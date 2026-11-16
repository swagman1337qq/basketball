import { useState } from 'react';
import type { Game } from '../../engine/Game';
import { ROLE_LABEL, ROLE_ORDER, type Coach, type CoachRole } from '../../engine/staff';
import { firstSeason } from '../../engine/contracts';
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
      </div>
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
