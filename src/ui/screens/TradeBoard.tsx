import { fmtMoney } from '../../engine/capModel';
import { teamRating } from '../../engine/ratings';
import { useState, type ReactNode } from 'react';
import type { VM } from '../vm';
import { byLast, useSort } from '../sortable';
import { godBtn, PN } from '../kit';
import { CapBar } from '../CapBar';
import { describeContract, teamSalary } from '../../engine/cba';
import { parseCmp } from '../SearchFilter';
import type { TradeText } from './TradeNameLinks';
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
  pos: (p: any) => {
    const index = POS_ORDER.indexOf(p.pos);
    return index < 0 ? null : POS_ORDER.length - index;
  },
  age: (p: any) => p.age,
  ovr: (p: any) => p.ovr,
  pot: (p: any) => p.pot,
  salary: (p: any) => p.amt,
  per: perOf,
  exp: p => p.exp,
  gp: p => p.gp || 0,
  min: p => (p.gp ? p.min : null),
  pts: p => (p.gp ? p.pts : null),
  reb: p => (p.gp ? p.reb : null),
  ast: p => (p.gp ? p.ast : null),
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
  emptyMessage = 'No players selected.',
}: {
  rows: any[];
  vm: VM;
  tid: number;
  label: string;
  sort?: ReturnType<typeof useSort<any>>;
  emptyMessage?: string;
}) {
  const { gm, s } = vm.ctx;
  const firstSeason = gm.Y + (s.phase === 'fa' ? 1 : 0);
  return (
    <div className="trade-board-table-wrap">
      <table className="table trade-board-table" aria-label={label}>
        <thead>
          <tr>
            <th aria-label="Selected" />
            <th aria-label="Exclude" title="Excluded from AI trade searches">
              X
            </th>
            {sort ? sort.head('name', 'Player') : <th>Player</th>}
            {sort ? sort.head('pos', 'Pos') : <th>Pos</th>}
            {sort ? sort.head('age', 'Age', 'right') : <th className="trade-board-number">Age</th>}
            {sort ? sort.head('ovr', 'Ovr', 'right') : <th className="trade-board-number">Ovr</th>}
            {sort ? sort.head('pot', 'Pot', 'right') : <th className="trade-board-number">Pot</th>}
            {sort ? sort.head('salary', 'Contract', 'right') : <th className="trade-board-number">Contract</th>}
            {[
              ['exp', 'Exp'],
              ['gp', 'G'],
              ['min', 'MP'],
              ['pts', 'PTS'],
              ['reb', 'TRB'],
              ['ast', 'AST'],
            ].map(([key, label]) => (sort ? sort.head(key, label, 'right') : <th key={key}>{label}</th>))}
            {sort ? sort.head('per', 'PER', 'right') : <th className="trade-board-number">PER</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map(p => {
            const years = Math.max(0, (p.exp ?? firstSeason) - firstSeason + 1);
            const per = perOf(p);
            return (
              <tr
                key={p.id}
                data-player-id={p.id}
                data-excluded={p.excluded || undefined}
                onClick={p.toggle}
                className={p.mark ? 'trade-board-selected' : undefined}
              >
                <td>
                  <input
                    type="checkbox"
                    aria-label={'Select ' + p.name}
                    checked={!!p.mark}
                    disabled={p.excluded}
                    onClick={e => e.stopPropagation()}
                    onChange={p.toggle}
                  />
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <input type="checkbox" aria-label={'Exclude ' + p.name} checked={!!p.excluded} onChange={p.exclude} />
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
                      {p.injTag && <span className="trade-board-sub">{p.injTag}</span>}
                    </div>
                  </div>
                </td>
                <td data-label="Pos">{p.pos}</td>
                <td className="trade-board-number" data-label="Age">
                  {p.age}
                </td>
                <td className="trade-board-number" style={{ color: p.tone }}>
                  {p.ovr}
                </td>
                <td className="trade-board-number" style={{ color: p.ptone }}>
                  {p.pot}
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
                <td className="trade-board-number">{p.exp ?? '—'}</td>
                <td className="trade-board-number">{p.gp || 0}</td>
                {['min', 'pts', 'reb', 'ast'].map(key => (
                  <td className="trade-board-number" key={key}>
                    {p.gp > 0 && Number.isFinite(p[key]) ? p[key].toFixed(1) : '—'}
                  </td>
                ))}
                <td className="trade-board-number" title="Current regular-season PER">
                  {per == null ? '—' : per.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && <p className="trade-board-empty">{emptyMessage}</p>}
    </div>
  );
}

function PickTable({ rows, vm, text, incoming = false }: { rows: any[]; vm: VM; text: TradeText; incoming?: boolean }) {
  return (
    <div className="trade-board-picks">
      {rows.map(k => (
        <div
          className={'trade-board-pick' + (k.mark ? ' trade-board-selected' : '')}
          key={k.id}
          data-pick-id={k.id}
          data-excluded={k.excluded || undefined}
          onClick={k.toggle}
        >
          <input
            type="checkbox"
            aria-label={'Select ' + k.label}
            checked={!!k.mark}
            disabled={k.excluded}
            onClick={e => e.stopPropagation()}
            onChange={k.toggle}
          />
          <input
            type="checkbox"
            aria-label={'Exclude ' + k.label}
            checked={!!k.excluded}
            onClick={e => e.stopPropagation()}
            onChange={k.exclude}
          />
          <div className="trade-board-pick-text">
            <span style={{ fontStyle: k.swap ? 'italic' : undefined }}>{text(k.label)}</span>
            <span className="trade-board-sub">{text(k.proj)}</span>
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

export function TradeBoard({ vm, advice, text }: { vm: VM; advice: ReactNode; text: TradeText }) {
  const mine = useSort<any>(vm.tMine || [], sortKeys),
    theirs = useSort<any>(vm.tTheirs || [], sortKeys);
  const [posMine, setPosMine] = useState('All'),
    [posTheirs, setPosTheirs] = useState('All');
  const [ageMine, setAgeMine] = useState(''),
    [ageTheirs, setAgeTheirs] = useState('');
  const [qMine, setQMine] = useState(''),
    [qTheirs, setQTheirs] = useState('');
  const { gm, s } = vm.ctx,
    teamOptions = vm.teamOptions || [];
  const cycle = (direction: number) => {
    const i = teamOptions.findIndex((t: any) => String(t.value) === String(vm.tTid));
    if (teamOptions.length)
      vm.pickTeam({ target: { value: teamOptions[(i + direction + teamOptions.length) % teamOptions.length].value } });
  };
  const sides = [
    {
      key: 'mine',
      tid: s.me,
      logo: vm.myLogoTr,
      title: vm.myName,
      sort: mine,
      pos: posMine,
      setPos: setPosMine,
      age: ageMine,
      setAge: setAgeMine,
      q: qMine,
      setQ: setQMine,
      picks: vm.tMinePicks || [],
      incoming: theirs.rows.filter(p => p.mark),
      incomingPicks: (vm.tTheirPicks || []).filter(k => k.mark),
      salary: vm.tr.in,
      out: vm.tr.out,
    },
    {
      key: 'theirs',
      tid: s.tTid,
      logo: vm.theirLogo,
      title: s.teams[s.tTid].region + ' ' + s.teams[s.tTid].name,
      sort: theirs,
      pos: posTheirs,
      setPos: setPosTheirs,
      age: ageTheirs,
      setAge: setAgeTheirs,
      q: qTheirs,
      setQ: setQTheirs,
      picks: vm.tTheirPicks || [],
      incoming: mine.rows.filter(p => p.mark),
      incomingPicks: (vm.tMinePicks || []).filter(k => k.mark),
      salary: vm.tr.out,
      out: vm.tr.in,
    },
  ].map(side => {
    const ageTest = parseCmp(side.age.replace(/[–—]/g, '-'));
    const ageRows = side.sort.rows.filter(p => typeof ageTest !== 'function' || ageTest(p.age));
    const fold = (v: string) =>
      v
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    return {
      ...side,
      ageRows,
      ageInvalid: ageTest === 'bad',
      filtered: side.pos !== 'All' || !!side.age.trim() || !!side.q.trim(),
      visible: ageRows.filter(p => (side.pos === 'All' || FITS[side.pos].includes(p.pos)) && fold(p.name).includes(fold(side.q.trim()))),
    };
  });
  return (
    <section className="trade-board" aria-label="Trade builder">
      <CapBar gm={gm} s={s} tid={s.me} delta={vm.tr.delta} />
      <div className="trade-board-workspace">
        <div className="trade-board-rosters">
          {sides.map(side => (
            <section className="trade-board-team-section" key={side.key} aria-label={side.title + ' roster and picks'}>
              <header className="trade-board-team">
                {side.logo}
                <h3>{text(side.title)}</h3>
                {side.key === 'theirs' && (
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
              <div className="trade-board-asset-columns">
                <section className="trade-board-roster" aria-label={side.title + ' players'}>
                  <div className="trade-board-roster-toolbar">
                    <input
                      className="input trade-board-search"
                      aria-label={side.title + ' search players'}
                      placeholder="Search players"
                      value={side.q}
                      onChange={e => side.setQ(e.target.value)}
                    />
                    <span className="trade-board-muted">
                      {side.filtered ? side.visible.length + ' / ' : ''}
                      {side.sort.rows.length} players · {side.sort.rows.filter(p => p.excluded).length} excluded
                    </span>
                  </div>
                  <details className="trade-board-filter-panel">
                    <summary>Filters{side.filtered ? ' · active' : ''}</summary>
                    <div className="trade-board-roster-filters">
                      <div className="trade-board-position-filter">
                        <span>Position</span>
                        <PositionFilter value={side.pos} set={side.setPos} rows={side.ageRows} />
                      </div>
                      <label className="trade-board-age-filter">
                        <span>Age</span>
                        <input
                          className="input"
                          aria-label={side.title + ' age filter'}
                          value={side.age}
                          placeholder="e.g. <=25"
                          aria-invalid={side.ageInvalid || undefined}
                          title="Age: 25, <=25, >=30 or 20-28"
                          onChange={e => side.setAge(e.target.value)}
                        />
                      </label>
                      {side.filtered && (
                        <button
                          className="btn btn-ghost trade-board-clear-filters"
                          type="button"
                          onClick={() => {
                            side.setPos('All');
                            side.setAge('');
                            side.setQ('');
                          }}
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </details>
                  <PlayerTable
                    rows={side.visible}
                    sort={side.sort}
                    vm={vm}
                    tid={side.tid}
                    label={side.title + ' roster'}
                    emptyMessage="No players match these filters."
                  />
                </section>
                <section className="trade-board-pick-section">
                  <div className="trade-board-section-title">
                    <strong>Draft picks & swaps</strong>
                    <span title="The second checkbox excludes the asset from AI trade searches">X = exclude</span>
                  </div>
                  <PickTable rows={side.picks} vm={vm} text={text} />
                </section>
              </div>
              <footer className="trade-board-side-footer">
                <span>
                  Sending {side.sort.rows.filter(p => p.mark).length} players · {side.out}
                </span>
                {side.key === 'theirs' && (
                  <button className="btn btn-ghost" type="button" onClick={vm.viewTradeTeam}>
                    View roster
                  </button>
                )}
              </footer>
            </section>
          ))}
        </div>
        <aside className="trade-board-sidebar" aria-label="Trade summary">
          {sides.map(side => {
            const outgoing = side.sort.rows.filter(p => p.mark).map(p => p.id),
              roster = s.rosters[side.tid] || [];
            const afterIds = [...roster.filter(id => !outgoing.includes(id)), ...side.incoming.map(p => p.id)];
            const before = teamRating(gm.db.P, roster),
              after = teamRating(gm.db.P, afterIds);
            const pay =
              teamSalary(gm, s, side.tid) -
              outgoing.reduce((sum, id) => sum + gm.capHit(gm.db.P[id]), 0) +
              side.incoming.reduce((sum, p) => sum + gm.capHit(p), 0);
            return (
              <section className="trade-board-incoming" key={side.key} aria-label={side.title + ' incoming assets'}>
                <h3>{text(side.title)} receive:</h3>
                <ul className="trade-board-summary-assets">
                  {side.incoming.map(p => (
                    <li key={p.id} data-player-id={p.id}>
                      <div>
                        <button type="button" className="trade-board-name" onClick={p.open}>
                          {p.name}
                        </button>
                        <span className="trade-board-sub">
                          {p.pos} · {p.contract} / {p.exp}
                        </span>
                      </div>
                      <button className="btn btn-ghost trade-board-remove" type="button" aria-label={'Remove ' + p.name} onClick={p.toggle}>
                        ×
                      </button>
                    </li>
                  ))}
                  {side.incomingPicks.map(k => (
                    <li key={k.id}>
                      <span>{text(k.label)}</span>
                      <button
                        className="btn btn-ghost trade-board-remove"
                        type="button"
                        aria-label={'Remove ' + k.label}
                        onClick={k.toggle}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {!side.incoming.length && !side.incomingPicks.length && <p className="trade-board-empty">No assets selected.</p>}
                <div className="trade-board-summary-finances">
                  <div>
                    <span>Total salary</span>
                    <strong>{side.salary}</strong>
                  </div>
                  <div>
                    <span>Payroll after trade</span>
                    <strong>{fmtMoney(pay)}</strong>
                  </div>
                  <div>
                    <span>Salary cap</span>
                    <span>{fmtMoney(gm.CAP)}</span>
                  </div>
                  <div>
                    <span>Team overall</span>
                    <span>
                      {Math.round(before)} →{' '}
                      <strong style={{ color: after >= before ? 'var(--gm-good)' : 'var(--gm-bad)' }}>{Math.round(after)}</strong>
                    </span>
                  </div>
                </div>
              </section>
            );
          })}
          <div className="trade-board-review">
            <div className="trade-board-checks">
              <div>
                <span>Salary rule</span>
                <strong style={{ color: vm.tr.salColor }}>{text(vm.tr.sal)}</strong>
              </div>
              <div>
                <span>Roster limits</span>
                <strong style={{ color: vm.tr.rosColor }}>{text(vm.tr.ros)}</strong>
              </div>
            </div>
            {vm.tr.hasMsg && (
              <div role="status" className="trade-board-message">
                {text(vm.tr.msg)}
              </div>
            )}
            <div className="trade-board-actions">
              <button className="btn btn-secondary trade-board-balance" type="button" onClick={vm.balance} disabled={vm.tr.cantBalance}>
                What would it take?
              </button>
              <button className="btn btn-primary" type="button" onClick={vm.propose} disabled={vm.tr.cantPropose}>
                Propose trade
              </button>
              <button className="btn btn-ghost" type="button" onClick={vm.clearTrade}>
                Clear
              </button>
              <button className="btn btn-secondary" type="button" onClick={vm.shopOffers} disabled={!vm.canShop}>
                Shop around league
              </button>
              <button className="btn btn-secondary" type="button" onClick={vm.askOffers} disabled={!vm.canAsk}>
                Ask what they want
              </button>
              <button className="btn btn-ghost" type="button" onClick={vm.tr.askAdvice} disabled={vm.tr.cantBalance}>
                {s.tAdvice ? 'Hide advice' : 'Ask for advice'}
              </button>
              {!!vm.tr.god && (
                <button
                  className="btn btn-secondary trade-board-force"
                  type="button"
                  onClick={vm.forceAccept}
                  disabled={vm.tr.cantForce}
                  style={godBtn}
                >
                  ⚡ Force accept
                </button>
              )}
            </div>
            <section className="trade-board-direction" aria-label="Team priorities">
              <h4>Team priorities · {text(vm.tr.stratName)}</h4>
              <p>{text(vm.tr.stratDesc)}</p>
              <div className="trade-board-appetite" aria-hidden="true">
                <span style={{ left: vm.tr.meter }} />
              </div>
              <div className="trade-board-appetite-labels">
                <span>Decline</span>
                <span>Accept</span>
              </div>
              <p className="trade-board-verdict" role="status">
                {text(vm.tr.verdict)}
              </p>
            </section>
            {advice}
          </div>
        </aside>
      </div>
    </section>
  );
}
