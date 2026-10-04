import type { VM } from '../vm';
import { GOD_PINK } from '../kit';
import { CountryPicker } from '../kit';
import { EasyToggles } from '../Tour';
import { ExpansionPicker } from './ExpansionPicker';
import { AwardFormulas } from './AwardFormulas';
import { RetirementSetting } from './RetirementSetting';

export function SettingsScreen({ vm }: { vm: VM }) {
  return (
    <>
      <section style={{ maxWidth: "900px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Appearance
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            Dark or light theme.
          </div>
          <button className="btn btn-secondary" onClick={vm.toggleTheme} style={{ whiteSpace: "nowrap" }}>
            {vm.themeLabel}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Layout
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            {vm.layout.desc}
          </div>
          <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            {(vm.layout.segs || []).map((sg: any, i: number) => (
              <button key={i} onClick={sg.onClick} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", whiteSpace: "nowrap", color: sg.color, boxShadow: sg.ring }}>
                {sg.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            CCP games
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            Quick results work out each development-league game from the clubs’ strength and each player’s ratings (sims run much faster). The full engine plays every CCP game possession by possession, like NBA games.
          </div>
          <div style={{ display: "inline-flex", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
            {([[false, 'Quick results'], [true, 'Full engine']] as [boolean, string][]).map(([v, l]) => { const on = !!vm.ctx.s.ccpFull === v; return (
              <button key={l} onClick={() => vm.ctx.gm.setState({ ccpFull: v })} style={{ all: "unset", cursor: "pointer", padding: "6px 14px", fontSize: "13px", whiteSpace: "nowrap", color: on ? "var(--color-accent-700)" : "var(--color-text)", boxShadow: on ? "inset 0 0 0 1px var(--color-accent)" : "none" }}>{l}</button>); })}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Save file
          </div>
          <div>
            <div>
              {vm.save.name} · {vm.save.status}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Saved automatically in this browser. Export a copy to back it up or move it to another device.
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button className="btn btn-secondary" onClick={vm.save.onExport} style={{ whiteSpace: "nowrap" }}>
              Export
            </button>
            <button className="btn btn-secondary" onClick={vm.save.onExit} style={{ whiteSpace: "nowrap" }}>
              All leagues
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", color: vm.god.on ? GOD_PINK : undefined }}>
            God Mode
          </div>
          <div>
            <div>
              {vm.god.label}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Edit any player or team, see every player’s true ratings, move players anywhere, and make trades and signings without cap or salary-matching rules. Players sign whatever you offer, and the owner has nothing over you: no firing, no payroll orders or fire sales, no meddling, and your contract renews itself. Edit or sell any owner in the League editor. IDs, engine formulas and past-season stats stay locked.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.god.toggle} style={{ whiteSpace: "nowrap", ...(vm.god.on ? { color: GOD_PINK, borderColor: GOD_PINK } : {}) }}>
            {vm.god.btn}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Owner can fire you
          </div>
          <div>
            <div>
              {vm.firing.label}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              Each owner’s firing conditions are listed on the Owner screen and checked when you end the season.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.firing.toggle} style={{ whiteSpace: "nowrap" }}>
            {vm.firing.btn}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Cap easy mode
          </div>
          <div>
            <div>
              {vm.capEasySet.on ? 'On: a simpler cap with no aprons' : 'Off: the full NBA cap, with both aprons'}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              No 1st or 2nd apron and none of their rules (100% salary matching, lost exceptions, trade limits). What stays: the soft cap and its exceptions, Bird rights, the luxury tax and the repeater tax, and one hard cap (at the old 2nd apron line) that no team can go over. Owners keep their payroll limits. You can switch it any time.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.capEasySet.toggle} style={{ whiteSpace: "nowrap" }}>
            {vm.capEasySet.on ? 'Turn off' : 'Turn on'}
          </button>
        </div>
        {vm.god.on && <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", color: GOD_PINK }}>Trading picks</div>
          <div><div>Picks can be traded up to {vm.pickYearsSet.v} draft{vm.pickYearsSet.v === 1 ? '' : 's'} ahead</div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>God Mode: how far into the future every team, you and the AI, can trade draft picks and pick swaps. Default 4 (the NBA allows 7). Picks further out stay with their teams until they come into range.</div></div>
          <select className="input" value={vm.pickYearsSet.v} onChange={e => vm.pickYearsSet.set(+e.target.value)} style={{ width: "auto" }}>{[1, 2, 3, 4, 5, 6, 7].map(n => <option key={n} value={n}>{n} year{n === 1 ? '' : 's'}</option>)}</select>
        </div>}
        {vm.god.on && <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", color: GOD_PINK }}>Roster size</div>
          <div><div>{vm.rosterLimSet.max} standard contracts in season ({vm.rosterLimSet.max + 6} in the offseason), at least {vm.rosterLimSet.min} on opening night</div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>God Mode: the league’s roster limits, for every team (the NBA: 15 in season, 21 in the offseason, at least 14). Two-way contracts stay at 3. AI teams over a lowered limit waive players right away. Force Sign can take you past the limit, but you can’t play a game until you’re back under it.</div></div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", fontSize: "12px" }}>
            <label>Max <select className="input" value={vm.rosterLimSet.max} onChange={e => vm.rosterLimSet.set(+e.target.value, vm.rosterLimSet.min)} style={{ width: "auto" }}>{Array.from({ length: 11 }, (_, i) => 10 + i).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
            <label>Min <select className="input" value={vm.rosterLimSet.min} onChange={e => vm.rosterLimSet.set(vm.rosterLimSet.max, +e.target.value)} style={{ width: "auto" }}>{Array.from({ length: vm.rosterLimSet.max - 7 }, (_, i) => 8 + i).map(n => <option key={n} value={n}>{n}</option>)}</select></label>
          </div>
        </div>}
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Team sales
          </div>
          <div>
            <div>
              {vm.salesSet.v === 'off' ? 'Off: owners never sell' : vm.salesSet.v === 'often' ? 'Frequent: about 15% of teams a year' : 'Realistic: about 5% of teams a year, like the NBA since 2010'}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              When free agency opens, an owner may sell the team or a controlling stake. The new owner can be a different type, with new demands and budget. Losing teams sell more often. Real rate: 20–25 change-of-control sales since 2010 (RotoWire, Front Office Sports).
            </div>
          </div>
          <select className="input" value={vm.salesSet.v} onChange={e => vm.salesSet.set(e.target.value)} style={{ width: "auto" }}>
            <option value="off">Off</option>
            <option value="real">Realistic</option>
            <option value="often">Frequent</option>
          </select>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr) auto", gap: "16px", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            League expansion
          </div>
          <div>
            <div>
              {vm.settings.expLabel}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
              New franchises (any even number, picked below from the franchise database or designed yourself) join at the next preseason through an expansion draft. The schedule, lottery and draft pool adjust. You can expand again in later seasons.
            </div>
          </div>
          <button className="btn btn-secondary" onClick={vm.settings.toggleExp} disabled={vm.settings.expDis} style={{ whiteSpace: "nowrap" }}>
            {vm.settings.expBtn}
          </button>
        </div>
        <ExpansionPicker vm={vm} />
        <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>Easy mode</div>
          <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>Hand off any part of the job. Everything is off unless you turn it on.</p>
          <EasyToggles vm={vm} />
        </div>
        <RetirementSetting vm={vm} />
        <AwardFormulas vm={vm} />
        <div style={{ padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600", flex: "1" }}>
              Nationality mix for new players
            </div>
            <button className="btn btn-ghost" onClick={vm.resetNat} style={{ fontSize: "12px" }}>
              Reset to 1980–2026 history
            </button>
          </div>
          <p style={{ margin: "4px 0 8px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
            Weights are approximate counts of NBA players by nationality since 1980. They set how likely each country is for every newly generated player (draft classes, expansion). Click a country to see who represents it.
          </p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", margin: "0 0 8px", fontSize: "12.5px" }}>
            <span style={{ color: "var(--color-neutral-700)" }}>Add a country to the mix:</span>
            <CountryPicker C={vm.ctx.gm.db.C} exclude={Object.keys(vm.ctx.s.natW || {})} onPick={(c: string) => vm.ctx.gm.setState((st: any) => ({ natW: { ...st.natW, [c]: 1 } }))} placeholder="Type any country…" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: "0 24px" }}>
            {(vm.natRows || []).map((r: any, i: number) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "20px minmax(0,1fr) 64px 80px", gap: "8px", alignItems: "center", padding: "3px 0", borderBottom: "1px solid var(--color-divider)" }}>
                <img src={r.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                <button className="hv1" onClick={r.open} style={{ all: "unset", cursor: "pointer" }}>
                  {r.name}
                </button>
                <span style={{ textAlign: "right", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                  {r.share}
                </span>
                <input className="input" type="number" min="0" value={r.w} onChange={r.set} style={{ minHeight: "26px", fontSize: "12px", padding: "2px 6px" }} />
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "180px minmax(0,1fr)", gap: "16px", padding: "12px 0", borderBottom: "1px solid var(--color-divider)" }}>
          <div style={{ fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: "600" }}>
            Season format
          </div>
          <div style={{ color: "var(--color-neutral-700)" }}>
            82 games, a play-in for seeds 7–10, then four best-of-7 rounds. The offseason runs the 2027-rules “3-2-1” draft lottery (16 teams, all 16 picks drawn), the draft, free agency and preseason.
          </div>
        </div>
      </section>
    </>
  );
}
