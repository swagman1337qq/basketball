import { Fragment, useEffect, useRef } from 'react';
import { ChevronsLeft } from 'lucide-react';
import type { VM } from '../vm';
import { inkOn } from '../kit';

/** Completed, current and upcoming selections share one continuous pick order. */
export function DraftPickOrder({ vm, onCollapse }: { vm: VM; onCollapse?: () => void }) {
  const { s } = vm.ctx;
  const orderList = useRef<HTMLOListElement>(null);
  const order = vm.dr.order || [];
  const current = order.find((pick: any) => pick.onClock);
  const remaining = order.filter((pick: any) => pick.mine && !pick.pid);
  const lastSelection = order.filter((pick: any) => pick.pid).at(-1)?.n;
  useEffect(() => {
    const list = orderList.current;
    if (!list) return;
    const target = list.querySelector<HTMLElement>('[data-pick-number="' + (current?.n ?? lastSelection) + '"]');
    list.scrollTop = target
      ? Math.max(0, list.scrollTop + target.getBoundingClientRect().top - list.getBoundingClientRect().top - list.clientHeight / 3)
      : 0;
  }, [current?.n, lastSelection, s.dClass]);

  const tradeButtons = (pick: any) => (
    <div className="draft-pick-actions draft-clock-actions">
      <button type="button" className="btn btn-secondary" onClick={pick.tradePick}>
        {pick.tradeLbl}
      </button>
      <button type="button" className="btn btn-ghost" onClick={pick.proposeTrade}>
        Propose trade
      </button>
    </div>
  );
  const tradeActions = (pick: any) =>
    pick.canTrade &&
    (!pick.mine && !pick.pid ? (
      <div className="draft-pick-actions draft-clock-actions">
        <button type="button" className="btn btn-secondary" onClick={pick.tradePick}>
          Trade pick
        </button>
      </div>
    ) : (
      tradeButtons(pick)
    ));

  const pickRow = (pick: any) => {
    const round = pick.n > s.teams.length ? 2 : 1;
    const userClock = pick.onClock && pick.mine;
    return (
      <li
        className="draft-pick-item"
        data-pick-number={pick.n}
        data-on-clock={!!pick.onClock}
        data-user-pick={!!pick.mine}
        aria-current={pick.onClock ? 'step' : undefined}
        style={userClock ? { background: pick.primaryColor, color: inkOn(pick.primaryColor) } : undefined}
      >
        <span className={'draft-pick-number' + (pick.mine ? ' draft-your-pick' : '')}>
          {round}-{pick.n - (round - 1) * s.teams.length}
        </span>
        <div className="draft-pick-owner">
          <div className="draft-pick-team">
            {pick.logo}
            <button type="button" className="btn btn-ghost" onClick={pick.openT} title={pick.team} aria-label={pick.team}>
              {pick.abbr}
            </button>
          </div>
          {pick.via && <div className="draft-pick-meta">{pick.via}</div>}
          {pick.mine && <div className="draft-pick-meta draft-your-pick">Your pick</div>}
        </div>
        <div className="draft-pick-body">
          {pick.pid ? (
            <>
              <button type="button" className="btn btn-ghost draft-picked-player" data-pid={pick.pid} onClick={pick.openP}>
                {pick.who}
              </button>
              <div className="draft-pick-meta">{pick.pmeta}</div>
            </>
          ) : pick.onClock ? (
            <strong className="draft-pick-clock-label">{pick.mine ? 'You’re on the clock' : 'On the clock'}</strong>
          ) : (
            <span className="draft-muted">—</span>
          )}
          {tradeActions(pick)}
        </div>
      </li>
    );
  };

  return (
    <aside className="draft-pick-sidebar" aria-label="Drafted players and pick order">
      <div className="draft-sidebar-heading">
        <h2>{vm.dr.isFuture ? 'Your picks' : 'Pick order'}</h2>
        {onCollapse && (
          <button
            type="button"
            className="btn btn-ghost draft-order-collapse"
            onClick={onCollapse}
            aria-label="Collapse pick order"
            aria-expanded={true}
            aria-controls="draft-pick-panel"
          >
            <ChevronsLeft size={18} aria-hidden="true" />
          </button>
        )}
      </div>
      {vm.dr.isCurrent && (
        <>
          <div className="draft-pick-columns" aria-hidden="true">
            <span>Pick</span>
            <span>Team</span>
            <span>Selection</span>
          </div>
          <ol className="draft-pick-list" aria-label="Draft pick order" ref={orderList}>
            {order.map((pick: any, index: number) => {
              const round = pick.n > s.teams.length ? 2 : 1;
              const previousRound = index > 0 ? (order[index - 1].n > s.teams.length ? 2 : 1) : null;
              return (
                <Fragment key={pick.n}>
                  {round !== previousRound && <li className="draft-round-divider">{round === 1 ? '1st round' : '2nd round'}</li>}
                  {pickRow(pick)}
                </Fragment>
              );
            })}
          </ol>
          <div className="draft-remaining-picks">
            {vm.dr.done && s.phase === 'draft' && (
              <strong className="draft-complete-status" role="status">
                Draft complete
              </strong>
            )}
            <span className="draft-muted">Your remaining picks</span>
            <strong>{remaining.length ? remaining.map((pick: any) => '#' + pick.n).join(' · ') : 'None'}</strong>
          </div>
        </>
      )}
      {vm.dr.isFuture && (
        <>
          <div className="draft-kicker">{s.dClass} class · Early look</div>
          <div className="draft-future-pick-list">
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
          </div>
          <p className="draft-board-note">{vm.dr.scoutLine}</p>
        </>
      )}
    </aside>
  );
}
