import type { MouseEvent } from 'react';
import { ChevronUp } from 'lucide-react';
import type { VM } from '../vm';
import type { Report } from '../../engine/scoutReport';

export type DraftStatCell = { label: string; description: string; value: string };

export function DraftProspectCard({
  vm,
  player,
  report,
  season,
  values,
  advanced,
  onCollapse,
  onShortlist,
}: {
  vm: VM;
  player: any;
  report: Report;
  season: any;
  values: DraftStatCell[];
  advanced: boolean;
  onCollapse: () => void;
  onShortlist: (e: MouseEvent) => void;
}) {
  const { gm, s } = vm.ctx;
  const listed = (s.lists || []).some((list: any) => list.ids.includes(player.id));
  return (
    <div className="draft-prospect-card">
      <button
        type="button"
        className="btn btn-ghost draft-card-collapse"
        onClick={onCollapse}
        aria-label={'Collapse prospect card for ' + player.name}
        aria-expanded="true"
        aria-controls={'draft-card-' + s.dClass + '-' + player.id}
        title="Collapse prospect card"
      >
        <ChevronUp size={18} aria-hidden="true" />
      </button>
      <div className="draft-card-columns">
        <div>
          <div className="draft-card-player">
            <div className="draft-card-face" aria-hidden="true">
              {gm.faceEl(player.id, -1)}
            </div>
            <div>
              <div className="draft-kicker">Prospect · #{player.rank} on the board</div>
              <h3>{player.name}</h3>
              <div className="draft-muted">
                {player.pos} · Age {player.age} · {player.hgt}
                {player.wt ? ' · ' + player.wt + ' lb' : ''}
              </div>
            </div>
          </div>
          <div className="draft-muted">
            {player.fromT} · {player.fromL}
          </div>
          <div className="draft-card-ratings">
            <div>
              <strong style={{ color: player.tone }}>{player.ovrS}</strong>
              <span>Overall {s.god ? 'rating' : 'estimate'}</span>
            </div>
            <div>
              <strong style={{ color: player.ptone }}>{player.potS}</strong>
              <span>Potential {s.god ? 'rating' : 'estimate'}</span>
            </div>
          </div>
          <p className="draft-muted draft-card-confidence">{vm.dr.classNote}</p>
          <div className="draft-card-report">
            <p>{report.overview}</p>
            {report.weaknesses.length > 0 && (
              <p>
                <span className="draft-muted">To watch: </span>
                {report.weaknesses.slice(0, 2).join(' ')}
              </p>
            )}
          </div>
        </div>
        <div>
          <div className="draft-card-stat-heading">
            <strong>{advanced ? 'Advanced stats' : 'Latest college / club season'}</strong>
            {season && (
              <span className="draft-muted">
                {season.season - 1}–{String(season.season).slice(2)}
              </span>
            )}
          </div>
          {season ? (
            <>
              <div className="draft-muted">
                {season.team} · {season.level}
              </div>
              <div className="draft-card-stats">
                {values.map(cell => (
                  <div key={cell.label} title={cell.description}>
                    <strong>{cell.value}</strong>
                    <span>{cell.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="draft-muted">No college or club season yet.</p>
          )}
          <div className="draft-card-role">
            <div className="draft-kicker">Projection</div>
            <p>{report.projection}</p>
          </div>
        </div>
      </div>
      <div className="draft-card-actions">
        <div className="draft-card-links">
          <button type="button" className="btn btn-ghost" onClick={player.open}>
            Full profile ↗
          </button>
          <button type="button" className="btn btn-ghost" onClick={onShortlist}>
            {listed ? '★' : '☆'} Shortlist / scout
          </button>
        </div>
        {player.showDraft && (
          <button type="button" className="btn btn-primary" disabled={player.cant} onClick={player.draft}>
            Draft {player.name.split(' ')[0]}
          </button>
        )}
      </div>
    </div>
  );
}
