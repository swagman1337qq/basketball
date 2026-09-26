import { useEffect } from 'react';
import type { VM } from '../vm';
import { Dice } from '../kit';
import { TransactionsTab } from './TransactionsTab';
import { CountryPicker, NumInput } from '../kit';
import { GodPlayerEditor } from './GodPlayerEditor';
import { ScoutReportView } from '../ScoutReportView';
import { CompareTab, ContractExtras, DevelopmentTab, HistoryExtras } from './ProfileExtras';
import { ProfileHeader, ProfileOverview } from './ProfileMain';

export function PlayerModal({ vm }: { vm: VM }) {
  useEffect(() => { document.querySelector('main')?.scrollTo(0, 0); }, [vm.ctx.s.pid]);
  return (
    <>
      <div>
        <div style={{ width: "100%", boxSizing: "border-box" }}>
          <button className="btn btn-ghost" onClick={vm.goBack} style={{ fontSize: "13px", marginBottom: "10px" }}>← Back</button>
          <ProfileHeader vm={vm} />
          <div style={{ display: "flex", gap: "22px", alignItems: "center", borderBottom: "1px solid var(--color-divider)", marginBottom: "20px" }}>
            {(vm.ptabs || []).map((t: any, i: number) => (
              <button key={i} onClick={t.go} style={{ all: "unset", cursor: "pointer", padding: "8px 0 7px", fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: t.fw, color: t.color, borderBottom: `2px solid ${t.ul ?? ""}`, marginBottom: "-1px" }}>
                {t.label}
              </button>
            ))}
            <span style={{ flex: "1" }}></span>
            {!!vm.ctx.s.god && vm.ctx.s.ptab !== 'edit' && <button className="btn btn-primary" onClick={() => vm.goTab('edit')} style={{ fontSize: "13px" }}>✎ Edit player</button>}

          </div>
          {!!vm.pl.tabOverview && <ProfileOverview vm={vm} />}
          {!!vm.pl.tabContract && (<>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "36px", alignItems: "start" }}>
              <section>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Contract
                </h4>
                {(vm.pl.cRows || []).map((r: any, i: number) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "140px minmax(0,1fr)", gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      {r.k}
                    </span>
                    <span>
                      {r.v}
                    </span>
                  </div>
                ))}
                <p style={{ margin: "12px 0 0" }}>
                  {vm.pl.cStatus}
                </p>
              </section>
              <section>
                {!!vm.pl.canExt && (<>
                  <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                    Offer an extension
                  </h4>
                  <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0,1fr) 90px", gap: "12px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      Years
                    </span>
                    <NumInput value={vm.ext.years} min={1} max={vm.ext.maxYears} step={1} onValue={v => vm.ext.setYears({ target: { value: v } })} suffix={'max ' + vm.ext.maxYears} />
                    <span style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: "18px" }}>
                      {vm.ext.yearsLabel}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0,1fr) 90px", gap: "12px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      Per year
                    </span>
                    <NumInput value={vm.ext.amt} min={vm.ext.min} max={vm.ext.max} step={0.1} width={90} onValue={v => vm.ext.setAmt({ target: { value: v } })} suffix={'$M · ' + vm.ext.min + '–' + vm.ext.max} />
                    <span style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: "18px" }}>
                      {vm.ext.amtLabel}
                    </span>
                  </div>
                  <p style={{ margin: "8px 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                    {vm.ext.rule}
                  </p>
                  <p style={{ margin: "0 0 10px" }}>
                    {vm.ext.askLine}
                  </p>
                  <button className="btn btn-primary" onClick={vm.ext.offer}>
                    Offer extension
                  </button>
                  {!!vm.ext.hasMsg && (<>
                    <p style={{ margin: "10px 0 0", color: "var(--color-accent-800)" }}>
                      {vm.ext.msg}
                    </p>
                  </>)}
                </>)}
                {!!vm.pl.noExt && (<>
                  <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                    Extension
                  </h4>
                  <p style={{ margin: "8px 0", color: "var(--color-neutral-700)" }}>
                    {vm.pl.extWhy}
                  </p>
                </>)}
              </section>
            </div>
          </>)}
          {!!vm.pl.tabContract && <ContractExtras vm={vm} />}
          {!!vm.pl.tabDev && <DevelopmentTab vm={vm} />}
          {!!vm.pl.tabCompare && <CompareTab vm={vm} />}
          {vm.ctx.s.ptab === 'scout' && <div style={{ marginTop: 20 }}><ScoutReportView vm={vm} pid={vm.ctx.s.pid} /></div>}
          {vm.ctx.s.ptab === 'tx' && <TransactionsTab vm={vm} />}
          {!!vm.pl.tabEdit && (<>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: "36px", alignItems: "start" }}>
              <section>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Identity
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: "8px 12px", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Name
                  </span>
                  <span style={{ display: "flex", gap: 6 }}><input className="input" value={vm.pl.ed.name} onChange={vm.pl.ed.setName} style={{ minHeight: "30px", fontSize: "13px", flex: 1, minWidth: 0 }} /><Dice title="A random name from the country he represents" onClick={vm.pl.ed.randName} /></span>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Native script
                  </span>
                  <span style={{ display: "flex", gap: 6 }}><input className="input" value={vm.pl.ed.native} onChange={vm.pl.ed.setNative} style={{ minHeight: "30px", fontSize: "13px", flex: 1, minWidth: 0 }} /><Dice title="A random native-script name (countries with their own script)" onClick={vm.pl.ed.randNative} /></span>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Represents
                  </span>
                  <span style={{ display: "flex", gap: 6 }}><span style={{ flex: 1, minWidth: 0 }}><CountryPicker C={vm.ctx.gm.db.C} value={vm.pl.ed.repV} onPick={(c: string) => vm.pl.ed.setRep({ target: { value: c } })} width="100%" /></span><Dice title="A random country (any of the 215)" onClick={vm.pl.ed.randRep} /></span>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Motivation
                  </span>
                  <span style={{ display: "flex", gap: 6 }}><select className="input" value={vm.pl.ed.motV} onChange={vm.pl.ed.setMot} style={{ minHeight: "30px", fontSize: "13px", flex: 1, minWidth: 0 }}>
                    {(vm.pl.ed.motOpts || []).map((o: any, i: number) => (
                      <option key={i} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select><Dice title="A random motivation" onClick={vm.pl.ed.randMot} /></span>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Team
                  </span>
                  <span style={{ display: "flex", gap: 6 }}><select className="input" value={vm.pl.ed.teamV} onChange={vm.pl.ed.setTeam} style={{ minHeight: "30px", fontSize: "13px", flex: 1, minWidth: 0 }}>
                    {(vm.pl.ed.teamOpts || []).map((o: any, i: number) => (
                      <option key={i} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select><Dice title="Move him to a random team" onClick={() => { const o = vm.pl.ed.teamOpts || []; if (o.length) vm.pl.ed.setTeam({ target: { value: o[Math.floor(Math.random() * o.length)].v } }); }} /></span>
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Core
                </h4>
                {(vm.pl.ed.sliders || []).map((r: any, i: number) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 64px", gap: "12px", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      {r.label}
                    </span>
                    <NumInput value={r.v} min={r.min} max={r.max} step={r.step} onValue={v => r.set({ target: { value: v } })} suffix={r.suffix || (r.label === 'Salary' ? '$M per year' : r.label === 'Age' ? 'years' : undefined)} />
                    <span>{r.rand && <Dice onClick={r.rand} title={'Random ' + String(r.label).toLowerCase()} />}</span>
                  </div>
                ))}
                <h4 style={{ margin: "16px 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Traits <Dice onClick={vm.pl.ed.randTraits} title="Random personality traits" />
                </h4>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(vm.pl.ed.traits || []).map((c: any, i: number) => (
                    <button key={i} onClick={c.toggle} style={{ all: "unset", cursor: "pointer", padding: "2px 10px", border: `1px solid ${c.border ?? ""}`, borderRadius: "var(--radius-sm)", fontSize: "12px", color: c.color, background: c.bg }}>
                      {c.mark}{c.label}
                    </button>
                  ))}
                </div>
                <h4 style={{ margin: "16px 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Health
                </h4>
                <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ marginRight: "6px" }}>
                    {vm.pl.ed.health}
                  </span>
                  <button className="btn btn-secondary" onClick={vm.pl.ed.heal} style={{ fontSize: "12px", padding: "3px 10px" }}>
                    Heal
                  </button>
                  <button className="btn btn-secondary" onClick={vm.pl.ed.injMinor} style={{ fontSize: "12px", padding: "3px 10px" }}>
                    Minor injury
                  </button>
                  <button className="btn btn-secondary" onClick={vm.pl.ed.injMajor} style={{ fontSize: "12px", padding: "3px 10px" }}>
                    Major injury
                  </button>
                </div>
                <p style={{ margin: "14px 0 0", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                  Player IDs, engine formulas and stats from past seasons can’t be edited.
                </p>
              </section>
              <section>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Ratings
                </h4>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", margin: "0 0 8px" }}>
                  <button className="btn btn-secondary" onClick={vm.pl.ed.randRatings} style={{ fontSize: "12px" }} title="New ratings around his overall, shaped by position (height stays)">🎲 Randomize ratings</button>
                  <button className="btn btn-secondary" onClick={() => vm.pl.ed.shiftAll(-1)} style={{ fontSize: "12px" }} title="Every rating except height −1 (overall too); wingspan is a measurement and doesn't change">−1 all</button>
                  <button className="btn btn-secondary" onClick={() => vm.pl.ed.shiftAll(1)} style={{ fontSize: "12px" }} title="Every rating except height +1 (overall too); wingspan is a measurement and doesn't change">+1 all</button>
                </div>
                {(vm.pl.ed.ratings || []).map((r: any, i: number) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 40px", gap: "12px", alignItems: "center", padding: "3px 0" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      {r.label}
                    </span>
                    <NumInput value={r.v} min={r.min} max={r.max} step={r.step} onValue={v => r.set({ target: { value: v } })} suffix={r.suffix || (r.label === 'Salary' ? '$M per year' : r.label === 'Age' ? 'years' : undefined)} />
                    <span>{r.rand && <Dice onClick={r.rand} title={'Random ' + String(r.label).toLowerCase()} />}</span>
                  </div>
                ))}
              </section>
            </div>
          </>)}
          {!!vm.pl.tabEdit && <GodPlayerEditor vm={vm} />}
          {!!vm.pl.tabHistory && (<>
            <section>
              <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                Season by season
              </h4>
              {!!vm.pl.hasCareer && (<>
                <table className="table" style={{ fontSize: "13px" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "6px 8px" }}>
                        Season
                      </th>
                      <th style={{ padding: "6px 8px" }}>
                        Team
                      </th>
                      <th style={{ padding: "6px 8px" }}>
                        League
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        GP
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        Min
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        Pts
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        Reb
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        Ast
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        PER
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {(vm.pl.career || []).map((c: any, i: number) => (
                      <tr key={i} style={{ fontWeight: c.fw }}>
                        <td style={{ padding: "5px 8px" }}>
                          {c.season}
                        </td>
                        <td style={{ padding: "5px 8px" }}>
                          {c.team}
                        </td>
                        <td style={{ padding: "5px 8px", color: "var(--color-neutral-700)" }}>
                          {c.lg}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {c.gp}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {c.min}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {c.pts}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {c.reb}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {c.ast}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                          {c.per}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>)}
              {!!vm.pl.noCareer && (<>
                <p style={{ color: "var(--color-neutral-700)", fontStyle: "italic", padding: "10px 0" }}>
                  No professional games yet. Ratings are scouting estimates.
                </p>
              </>)}
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <button className="btn btn-secondary" onClick={vm.toggleJson} style={{ fontSize: "13px" }}>
                  {vm.pl.jsonLabel}
                </button>
                <button className="btn btn-ghost" onClick={vm.downloadFaces} style={{ fontSize: "13px" }}>
                  Download league faces.json
                </button>
              </div>
              {!!vm.showJson && (<>
                <pre style={{ margin: "10px 0 0", padding: "12px", maxHeight: "220px", overflow: "auto", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", fontSize: "11px", lineHeight: "1.4", whiteSpace: "pre-wrap" }}>
                  {vm.pl.faceJson}
                </pre>
              </>)}
            </section>
          </>)}
          {!!vm.pl.tabHistory && <HistoryExtras vm={vm} />}
        </div>
      </div>
    </>
  );
}
