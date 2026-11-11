import { useState, type ReactNode } from 'react';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { godBtn, PN } from '../kit';
import { CapBar } from '../CapBar';
import { describeContract } from '../../engine/cba';
import './TradeBoard.css';

const POS_ORDER = ['PG', 'G', 'SG', 'GF', 'SF', 'F', 'PF', 'FC', 'C'];
const FITS: Record<string, string[]> = {
  PG: ['PG', 'G'],
  SG: ['SG', 'G', 'GF'],
  SF: ['SF', 'GF', 'F'],
  PF: ['PF', 'F', 'FC'],
  C: ['C', 'FC'],
};
const perOf = (p: any): number | null => (p.gp > 0 && Number.isFinite(p.per) ? p.per : null);
const sortKeys = {
  name: (p: any) => byLast(p),
  pos: (p: any) => POS_ORDER.indexOf(p.pos),
  age: (p: any) => p.age,
  ovr: (p: any) => p.ovr,
  pot: (p: any) => p.pot,
  salary: (p: any) => p.amt,
  per: perOf,
};

function PositionFilter({ value, set, rows }: { value: string; set: (value: string) => void; rows: any[] }) {
  return (
    <div className="trade-board-filters" role="group" aria-label="Filter by position">
      {['All', 'PG', 'SG', 'SF', 'PF', 'C'].map(pos => (
        <button
          key={pos}
          type="button"
          className={value === pos ? 'btn btn-primary' : 'btn btn-ghost'}
          aria-pressed={value === pos}
          onClick={() => set(pos)}
        >
          {pos}{' '}
          <span className="trade-board-muted">{pos === 'All' ? rows.length : rows.filter(p => FITS[pos].includes(p.pos)).length}</span>
        </button>
      ))}
    </div>
  );
}

function PlayerTable({
  rows,
  vm,
  tid,
  label,
  sort,
}: {
  rows: any[];
  vm: VM;
  tid: number;
  label: string;
  sort?: ReturnType<typeof useSort<any>>;
}) {
  const { gm, s } = vm.ctx;
  const firstSeason = gm.Y + (s.phase === 'fa' ? 1 : 0);
  return (
    <div className="trade-board-table-wrap">
      <table className="table trade-board-table" aria-label={label}>
        <thead>
          <tr>
            <th aria-label="Selected" />
            {sort ? sort.head('name', 'Player') : <th>Player</th>}
            {sort ? sort.head('salary', 'Salary', 'right') : <th className="trade-board-number">Salary</th>}
            {sort ? sort.head('per', 'PER', 'right') : <th className="trade-board-number">PER</th>}
            {sort ? sort.head('ovr', 'Ovr', 'right') : <th className="trade-board-number">Ovr</th>}
            {sort ? sort.head('pot', 'Pot', 'right') : <th className="trade-board-number">Pot</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(p => {
            const years = Math.max(0, (p.exp ?? firstSeason) - firstSeason + 1);
            const per = perOf(p);
            return (
              <tr key={p.id} data-player-id={p.id} onClick={p.toggle} className={p.mark ? 'trade-board-selected' : undefined}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={'Select ' + p.name}
                    checked={!!p.mark}
                    onClick={e => e.stopPropagation()}
                    onChange={p.toggle}
                  />
                </td>
                <td>
                  <div className="trade-board-player">
                    <span className="trade-board-face" aria-hidden="true">
                      {gm.faceEl(p.id, tid)}
                    </span>
                    <div className="trade-board-player-text">
                      <button
                        className="trade-board-name"
                        type="button"
                        style={PN}
                        title={p.name + ': open his profile'}
                        onClick={e => {
                          e.stopPropagation();
                          p.open();
                        }}
                      >
                        {p.name}
                      </button>
                      <span className="trade-board-sub">
                        {p.pos} · {p.age} years old{p.injTag ? ' · ' + p.injTag : ''}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="trade-board-number" title={describeContract(gm, p)}>
                  <span>{p.contract}</span>
                  <span className="trade-board-sub">
                    {p.ctype === 'tenDay'
                      ? '10-day'
                      : p.ctype === 'hardship'
                        ? 'Hardship'
                        : years
                          ? years + (years === 1 ? ' year' : ' years')
                          : 'Expiring'}
                    {p.ext ? ' + ' + p.ext.yrs + '-year ext.' : ''}
                    {p.opt ? ' · ' + (p.opt.kind === 'player' ? 'PO' : 'TO') : ''}
                  </span>
                </td>
                <td className="trade-board-number" title="Current regular-season PER">
                  {per == null ? '—' : per.toFixed(1)}
                </td>
                <td className="trade-board-number" style={{ color: p.tone }}>
                  {p.ovr}
                </td>
                <td className="trade-board-number" style={{ color: p.ptone }}>
                  {p.pot}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <p className="trade-board-empty">No players selected.</p>}
    </div>
  );
}

function PickTable({ rows, vm, incoming = false }: { rows: any[]; vm: VM; incoming?: boolean }) {
  return (
    <div className="trade-board-picks">
      {rows.map(k => (
        <div
          className={'trade-board-pick' + (k.mark ? ' trade-board-selected' : '')}
          key={(k.swap ? 'swap:' : 'pick:') + k.label}
          onClick={k.toggle}
        >
          <input
            type="checkbox"
            aria-label={'Select ' + k.label}
            checked={!!k.mark}
            onClick={e => e.stopPropagation()}
            onChange={k.toggle}
          />
          <div className="trade-board-pick-text">
            <span style={{ fontStyle: k.swap ? 'italic' : undefined }}>{k.label}</span>
            <span className="trade-board-sub">{k.proj}</span>
          </div>
          {k.prot && !incoming && (
            <select
              className="input"
              aria-label={'Protection for ' + k.label}
              value={k.prot.v}
              onClick={e => e.stopPropagation()}
              onChange={k.prot.set}
              title="If the pick lands inside the protection, its team keeps it and it rolls over (twice, then unprotected)."
            >
              {vm.protOpts.map(([value, label]: any) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}

export function TradeBoard({ vm, advice }: { vm: VM; advice: ReactNode }) {
  const mine = useSort<any>(vm.tMine || [], sortKeys);
  const theirs = useSort<any>(vm.tTheirs || [], sortKeys);
  const [posMine, setPosMine] = useState('All');
  const [posTheirs, setPosTheirs] = useState('All');
  const { gm, s } = vm.ctx;
  const teamOptions = vm.teamOptions || [];
  const cycle = (direction: number) => {
    const index = teamOptions.findIndex((t: any) => String(t.value) === String(vm.tTid));
    if (teamOptions.length)
      vm.pickTeam({ target: { value: teamOptions[(index + direction + teamOptions.length) % teamOptions.length].value } });
  };
  const sides = [
    {
      key: 'mine',
      tid: s.me,
      sourceTid: s.tTid,
      logo: vm.myLogoTr,
      title: vm.myName,
      sort: mine,
      position: posMine,
      setPosition: setPosMine,
      picks: vm.tMinePicks || [],
      incoming: theirs.rows.filter(p => p.mark),
      incomingPicks: (vm.tTheirPicks || []).filter((k: any) => k.mark),
      incomingSalary: vm.tr.in,
      outgoingSalary: vm.tr.out,
    },
    {
      key: 'theirs',
      tid: s.tTid,
      sourceTid: s.me,
      logo: vm.theirLogo,
      title: s.teams[s.tTid].region + ' ' + s.teams[s.tTid].name,
      sort: theirs,
      position: posTheirs,
      setPosition: setPosTheirs,
      picks: vm.tTheirPicks || [],
      incoming: mine.rows.filter(p => p.mark),
      incomingPicks: (vm.tMinePicks || []).filter((k: any) => k.mark),
      incomingSalary: vm.tr.out,
      outgoingSalary: vm.tr.in,
    },
  ];
  return (
    <section className="trade-board" aria-label="Trade builder">
      <CapBar gm={gm} s={s} tid={s.me} delta={vm.tr.delta} />
      <div className="trade-board-columns">
        {sides.map(side => (
          <section className="trade-board-column" key={side.key} aria-label={side.title}>
            <header className="trade-board-team">
              {side.logo}
              {side.key === 'mine' ? (
                <h3>{side.title}</h3>
              ) : (
                <div className="trade-board-partner">
                  <button className="btn btn-ghost" type="button" aria-label="Previous team" onClick={() => cycle(-1)}>
                    ‹
                  </button>
                  <select className="input" aria-label="Trade partner" value={vm.tTid} onChange={vm.pickTeam}>
                    {teamOptions.map((t: any) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <button className="btn btn-ghost" type="button" aria-label="Next team" onClick={() => cycle(1)}>
                    ›
                  </button>
                </div>
              )}
            </header>
            <section className="trade-board-incoming" aria-label={side.title + ' incoming assets'}>
              <div className="trade-board-section-title">
                <strong>Incoming</strong>
                <span>{side.incoming.length + side.incomingPicks.length} assets</span>
              </div>
              <div className="trade-board-incoming-content">
                {side.incoming.length > 0 && (
                  <PlayerTable rows={side.incoming} vm={vm} tid={side.sourceTid} label={side.title + ' incoming players'} />
                )}
                <PickTable rows={side.incomingPicks} vm={vm} incoming />
                {!side.incoming.length && !side.incomingPicks.length && (
                  <p className="trade-board-empty">Select players or picks from the other roster.</p>
                )}
              </div>
              <div className="trade-board-total">
                <strong>
                  Acquiring {side.incoming.length} {side.incoming.length === 1 ? 'player' : 'players'}
                  {side.incomingPicks.length > 0
                    ? ' + ' + side.incomingPicks.length + ' draft asset' + (side.incomingPicks.length > 1 ? 's' : '')
                    : ''}
                </strong>
                <strong>{side.incomingSalary}</strong>
              </div>
            </section>
            <section className="trade-board-roster">
              <div className="trade-board-section-title">
                <strong>{side.title} roster</strong>
                <span>{side.sort.rows.length} players</span>
              </div>
              <PositionFilter value={side.position} set={side.setPosition} rows={side.sort.rows} />
              <PlayerTable
                rows={side.sort.rows.filter(p => side.position === 'All' || FITS[side.position].includes(p.pos) || p.mark)}
                sort={side.sort}
                vm={vm}
                tid={side.tid}
                label={side.title + ' roster'}
              />
            </section>
            <section className="trade-board-pick-section">
              <div className="trade-board-section-title">
                <strong>Draft picks & swaps</strong>
              </div>
              <PickTable rows={side.picks} vm={vm} />
            </section>
            <footer className="trade-board-side-footer">
              <span>
                Sending {side.sort.rows.filter(p => p.mark).length} {side.sort.rows.filter(p => p.mark).length === 1 ? 'player' : 'players'}{' '}
                · {side.outgoingSalary}
              </span>
              {side.key === 'mine' ? (
                <button className="btn btn-secondary" type="button" onClick={vm.shopOffers} disabled={!vm.canShop}>
                  Ask for offers
                </button>
              ) : (
                <div className="trade-board-side-actions">
                  <button className="btn btn-ghost" type="button" onClick={vm.viewTradeTeam}>
                    View roster
                  </button>
                  <button className="btn btn-secondary" type="button" onClick={vm.askOffers} disabled={!vm.canAsk}>
                    Ask what they want
                  </button>
                </div>
              )}
            </footer>
          </section>
        ))}
      </div>
      <div className="trade-board-review">
        <div className="trade-board-checks">
          <span style={{ color: vm.tr.salColor }}>
            <strong>League office</strong> · {vm.tr.sal}
          </span>
          <span style={{ color: vm.tr.rosColor }}>{vm.tr.ros}</span>
        </div>
        <div className="trade-board-direction">
          <strong>{vm.tr.stratName}</strong>
          <span>{vm.tr.verdict}</span>
          <details>
            <summary>Team priorities</summary>
            <p>{vm.tr.stratDesc}</p>
          </details>
        </div>
        {advice}
        <div className="trade-board-actions">
          <button className="btn btn-primary" type="button" onClick={vm.propose} disabled={vm.tr.cantPropose}>
            Propose trade
          </button>
          <button className="btn btn-secondary" type="button" onClick={vm.balance} disabled={vm.tr.cantBalance}>
            What would it take?
          </button>
          <button className="btn btn-ghost" type="button" onClick={vm.tr.askAdvice} disabled={vm.tr.cantBalance}>
            {s.tAdvice ? 'Hide advice' : 'Ask for advice'}
          </button>
          <button className="btn btn-ghost" type="button" onClick={vm.clearTrade}>
            Clear
          </button>
          {!!vm.tr.god && (
            <button className="btn btn-secondary" type="button" onClick={vm.forceAccept} disabled={vm.tr.cantForce} style={godBtn}>
              ⚡ Force accept
            </button>
          )}
        </div>
        {vm.tr.hasMsg && (
          <div role="status" className="trade-board-message">
            {vm.tr.msg}
          </div>
        )}
      </div>
    </section>
  );
}
