import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { VM } from '../vm';

/** The live draft stays beside the board, using the same pick owners and actions as trades. */
export function DraftPickOrder({ vm }: { vm: VM }) {
  const { s } = vm.ctx;
  const [fullOrder, setFullOrder] = useState(false);
  const completedList = useRef<HTMLOListElement>(null);
  const upcomingSection = useRef<HTMLDetailsElement>(null);
  const order = vm.dr.order || [];
  const completed = order.filter((pick: any) => pick.pid);
  const current = order.find((pick: any) => pick.onClock);
  const upcoming = order.filter((pick: any) => !pick.pid && !pick.onClock);
  const remaining = order.filter((pick: any) => pick.mine && !pick.pid);
  const lastSelection = completed.at(-1)?.pid;
  useEffect(() => {
    const list = completedList.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [lastSelection, s.dClass]);
  const toggleFullOrder = () => {
    setFullOrder(value => !value);
    if (upcomingSection.current) upcomingSection.current.open = true;
  };

  const tradeActions = (pick: any) =>
    pick.canTrade && (
      <details className="draft-pick-actions">
        <summary aria-label={'Trade options for pick ' + pick.n}>
          Trade options <ChevronDown size={12} aria-hidden="true" />
        </summary>
        <div className="draft-clock-actions">
          <button type="button" className="btn btn-secondary" onClick={pick.tradePick}>
            {pick.tradeLbl}
          </button>
          <button type="button" className="btn btn-ghost" onClick={pick.proposeTrade}>
            Propose trade
          </button>
        </div>
      </details>
    );

  const pickRow = (pick: any) => (
    <li key={pick.n} className="draft-pick-item" data-pick-number={pick.n}>
      <span className={'draft-pick-number' + (pick.mine ? ' draft-your-pick' : '')}>
        {pick.n}
        <small>R{pick.n > s.teams.length ? 2 : 1}</small>
      </span>
      <div className="draft-pick-body">
        <div className="draft-pick-team">
          {pick.logoLg || pick.logo}
          <button type="button" className="btn btn-ghost" onClick={pick.openT} title={pick.team}>
            {pick.team}
          </button>
        </div>
        {(pick.via || pick.mine) && (
          <div className="draft-pick-meta">
            {pick.via}
            {pick.via && pick.mine ? ' · ' : ''}
            {pick.mine && <span className="draft-your-pick">Your pick</span>}
          </div>
        )}
        {pick.pid && (
          <>
            <button type="button" className="btn btn-ghost draft-picked-player" data-pid={pick.pid} onClick={pick.openP}>
              {pick.who}
            </button>
            <div className="draft-pick-meta">{pick.pmeta}</div>
          </>
        )}
        {tradeActions(pick)}
      </div>
    </li>
  );

  return (
    <aside className="draft-pick-sidebar" aria-label="Drafted players and pick order">
      <div className="draft-sidebar-heading">
        <h2>{vm.dr.isFuture ? 'Your picks' : 'Pick order'}</h2>
        {vm.dr.isCurrent && upcoming.length > 6 && (
          <button
            type="button"
            className="btn btn-ghost"
            aria-pressed={fullOrder}
            aria-controls="draft-upcoming-picks"
            onClick={toggleFullOrder}
          >
            {fullOrder ? 'Compact order' : 'Full order'}
          </button>
        )}
      </div>
      {vm.dr.isCurrent && (
        <>
          <section className={'draft-clock' + (vm.dr.mineClock ? ' draft-clock-mine' : '')} aria-label="Draft status">
            {current && (
              <div className="draft-kicker">
                Round {current.n > s.teams.length ? 2 : 1} · Pick {current.n}
              </div>
            )}
            <strong>
              {current
                ? vm.dr.mineClock
                  ? 'You’re on the clock'
                  : 'On the clock'
                : vm.dr.done && s.phase === 'draft'
                  ? 'Draft complete'
                  : vm.dr.status}
            </strong>
            {current && (
              <div className="draft-pick-team draft-current-team">
                {current.logoLg || current.logo}
                <button type="button" className="btn btn-ghost" onClick={current.openT}>
                  {current.team}
                </button>
              </div>
            )}
            <p className="draft-muted">{vm.dr.sub}</p>
            <div className="draft-clock-actions">
              {current?.canTrade && (
                <>
                  <button type="button" className="btn btn-secondary" onClick={current.tradePick}>
                    {current.tradeLbl}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={current.proposeTrade}>
                    Propose trade
                  </button>
                </>
              )}
              <details className="draft-sim">
                <summary className="btn btn-secondary">Simulate ▾</summary>
                <div className="draft-sim-menu">
                  <button type="button" className="btn btn-ghost" onClick={vm.simOne} disabled={vm.dr.noSimMine}>
                    Sim one pick
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={vm.simToMine} disabled={vm.dr.noSimMine}>
                    Sim to my pick
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={vm.simAll} disabled={vm.dr.done}>
                    Auto-draft the rest
                  </button>
                </div>
              </details>
            </div>
          </section>
          <details className="draft-pick-section" open>
            <summary>
              <span>
                Already drafted <span className="draft-muted">{completed.length}</span>
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            {completed.length ? (
              <ol className="draft-pick-list draft-completed-list" aria-label="Completed selections" ref={completedList}>
                {completed.map(pickRow)}
              </ol>
            ) : (
              <p className="draft-pick-empty draft-muted">No selections yet.</p>
            )}
          </details>
          <details className="draft-pick-section" open ref={upcomingSection}>
            <summary>
              <span>
                Up next <span className="draft-muted">{upcoming.length}</span>
              </span>
              <ChevronDown size={14} aria-hidden="true" />
            </summary>
            <ol id="draft-upcoming-picks" className="draft-pick-list" aria-label="Upcoming selections">
              {(fullOrder ? upcoming : upcoming.slice(0, 6)).map(pickRow)}
            </ol>
            {!upcoming.length && <p className="draft-pick-empty draft-muted">All selections are in.</p>}
            {upcoming.length > 6 && (
              <button type="button" className="btn btn-ghost draft-order-more" onClick={toggleFullOrder}>
                {fullOrder ? 'Show fewer picks' : 'Show all ' + upcoming.length + ' upcoming picks'}
              </button>
            )}
          </details>
          <div className="draft-remaining-picks">
            <span className="draft-muted">Your remaining picks</span>
            <strong>{remaining.length ? remaining.map((pick: any) => '#' + pick.n).join(' · ') : 'None'}</strong>
          </div>
        </>
      )}
      {vm.dr.isFuture && (
        <>
          <div className="draft-kicker">{s.dClass} class · Early look</div>
          {(vm.dr.myFuture || []).map((pick: any, index: number) => (
            <div key={index} className="draft-future-pick">
              <strong>{pick.label}</strong>
              <p className="draft-muted">{pick.proj}</p>
              <div className="draft-clock-actions">
                {pick.tradePick && (
                  <button type="button" className="btn btn-secondary" onClick={pick.tradePick}>
                    Trade pick
                  </button>
                )}
                {pick.proposeTrade && (
                  <button type="button" className="btn btn-ghost" onClick={pick.proposeTrade}>
                    Propose trade
                  </button>
                )}
              </div>
            </div>
          ))}
          <p className="draft-board-note">{vm.dr.scoutLine}</p>
        </>
      )}
    </aside>
  );
}
