import type { VM } from '../vm';

export function PlayerModal({ vm }: { vm: VM }) {
  return (
    <>
      <div onClick={vm.closeModal} style={{ position: "absolute", inset: "0", zIndex: "15", display: "grid", placeItems: "center", padding: "26px", background: "rgba(0,0,0,.55)" }}>
        <div onClick={vm.stop} style={{ width: "min(1180px,100%)", maxHeight: "100%", overflow: "auto", boxSizing: "border-box", background: "var(--color-bg)", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-lg)", padding: "22px 26px 28px" }}>
          <div style={{ display: "flex", gap: "24px", alignItems: "flex-end", marginBottom: "24px" }}>
            <div className="gm-face" style={{ width: "96px", height: "144px", flex: "none", overflow: "hidden", borderBottom: "1px solid var(--color-text)" }}>
              {vm.pl.face}
            </div>
            <div style={{ flex: "1", minWidth: "0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                <img src={vm.pl.flag} alt="" style={{ width: "18px", height: "12px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                <button className="hv4" onClick={vm.pl.openRep} style={{ all: "unset", cursor: "pointer" }}>
                  {vm.pl.cname}
                </button>
                <span>
                  {" "}· {vm.pl.pos} ·{" "}
                  <button className="hv4" onClick={vm.pl.openT} style={{ all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px", verticalAlign: "middle" }}>
                    {vm.pl.teamLogo}
                    {vm.pl.teamLabel}
                  </button>
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-heading)", fontSize: "46px", fontWeight: "400", lineHeight: "1.02", letterSpacing: "-.015em" }}>
                {vm.pl.name}
                <span style={{ fontSize: "26px", color: "var(--color-neutral-600)", marginLeft: "14px" }}>
                  {vm.pl.nativeSep}
                </span>
              </div>
              <div style={{ color: "var(--color-neutral-700)", marginTop: "4px" }}>
                {vm.pl.bio}
              </div>
              <div style={{ marginTop: "2px" }}>
                {vm.pl.contractLine}
              </div>
            </div>
            <div style={{ display: "flex", gap: "26px", textAlign: "center" }}>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "56px", lineHeight: ".95", color: vm.pl.tone }}>
                  {vm.pl.ovr}
                </div>
                <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                  Overall
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-heading)", fontSize: "56px", lineHeight: ".95", color: "var(--color-neutral-600)" }}>
                  {vm.pl.pot}
                </div>
                <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)" }}>
                  Potential
                </div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
              {!!vm.pl.isMine && (<>
                <button className="btn btn-secondary" onClick={vm.pl.release}>
                  Release
                </button>
                <button className="btn btn-ghost" onClick={vm.pl.toAbroad} style={{ fontSize: "12px" }}>
                  Release to play overseas
                </button>
              </>)}
              {!!vm.pl.isOther && (<>
                <button className="btn btn-primary" onClick={vm.pl.tradeFor}>
                  Trade for
                </button>
              </>)}
              {!!vm.pl.isFA && (<>
                <button className="btn btn-primary" onClick={vm.pl.sign}>
                  Sign · {vm.pl.ask}
                </button>
              </>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", margin: "-8px 0 22px" }}>
            <span style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-neutral-700)", marginRight: "4px" }}>
              Shortlist
            </span>
            {(vm.pl.lists || []).map((c: any, i: number) => (
              <button key={i} onClick={c.toggle} style={{ all: "unset", cursor: "pointer", padding: "2px 10px", border: `1px solid ${c.border ?? ""}`, borderRadius: "var(--radius-sm)", fontSize: "12px", color: c.color, background: c.bg }}>
                {c.mark}{c.name}
              </button>
            ))}
            <button className="btn btn-ghost" onClick={vm.goShort} style={{ fontSize: "12px" }}>
              Manage categories
            </button>
          </div>
          <div style={{ display: "flex", gap: "22px", alignItems: "center", borderBottom: "1px solid var(--color-divider)", marginBottom: "20px" }}>
            {(vm.ptabs || []).map((t: any, i: number) => (
              <button key={i} onClick={t.go} style={{ all: "unset", cursor: "pointer", padding: "8px 0 7px", fontFamily: "var(--font-heading)", fontSize: "17px", fontWeight: t.fw, color: t.color, borderBottom: `2px solid ${t.ul ?? ""}`, marginBottom: "-1px" }}>
                {t.label}
              </button>
            ))}
            <span style={{ flex: "1" }}></span>
            <button className="btn btn-ghost" onClick={vm.closeModal} style={{ fontSize: "13px" }}>
              Close
            </button>
          </div>
          {!!vm.pl.tabOverview && (<>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.6fr)", gap: "36px", alignItems: "start" }}>
              <section>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Background
                </h4>
                {(vm.pl.bgRows || []).map((r: any, i: number) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      {r.k}
                    </span>
                    <span style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {!!r.hasFlag && (<>
                        <img src={r.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                      </>)}
                      <button className="hv4" onClick={r.open} style={{ all: "unset", cursor: "pointer" }}>
                        {r.v}
                      </button>
                    </span>
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Eligible for
                  </span>
                  <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {(vm.pl.elig || []).map((e: any, i: number) => (
                      <span key={i} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <img src={e.flag} alt="" style={{ width: "16px", height: "11px", objectFit: "cover", outline: "1px solid var(--color-divider)" }} />
                        <button className="hv4" onClick={e.open} style={{ all: "unset", cursor: "pointer" }}>
                          {e.name}
                        </button>
                        <span style={{ color: "var(--color-neutral-600)", fontSize: "11px" }}>
                          {e.why}
                        </span>
                      </span>
                    ))}
                  </span>
                </div>
              </section>
              <section style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "20px" }}>
                {(vm.pl.groups || []).map((g: any, i: number) => (
                  <div key={i}>
                    <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                      {g.label}
                    </h4>
                    {(g.items || []).map((r: any, i: number) => (
                      <div key={i} style={{ padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                          <span style={{ color: "var(--color-neutral-700)" }}>
                            {r.name}
                          </span>
                          <span style={{ color: r.tone, fontWeight: "600" }}>
                            {r.v}
                          </span>
                        </div>
                        <div style={{ height: "2px", background: "var(--color-divider)", marginTop: "3px" }}>
                          <div style={{ height: "2px", width: r.w, background: "var(--color-accent)" }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            </div>
            {!!vm.pl.isPro && (<>
              <section style={{ marginTop: "26px", padding: "14px 16px", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
                  <span style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                    Scouting report · margin ±{vm.pl.sr.margin}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-neutral-700)" }}>
                    {vm.pl.sr.scout}
                  </span>
                </div>
                <p style={{ margin: "8px 0 10px", textAlign: "justify", hyphens: "auto" }}>
                  {vm.pl.sr.summary}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: "16px", fontSize: "13px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                      Strengths
                    </div>
                    {vm.pl.sr.str}
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                      Weaknesses
                    </div>
                    {vm.pl.sr.weak}
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--color-neutral-600)" }}>
                      Plays like
                    </div>
                    <button className="hv6" onClick={vm.pl.sr.openComp} style={{ all: "unset", cursor: "pointer", color: "var(--color-accent-700)" }}>
                      {vm.pl.sr.comp}
                    </button>
                  </div>
                </div>
                <div style={{ marginTop: "10px", fontSize: "12px", color: "var(--color-neutral-700)" }}>
                  Intangibles: {vm.pl.sr.intang}
                </div>
                {!!vm.pl.sr.canPromise && (<>
                  <div style={{ marginTop: "10px" }}>
                    <button className="btn btn-primary" onClick={vm.pl.sr.promise} style={{ fontSize: "13px" }}>
                      Promise to draft him at #{vm.pl.sr.pickN}
                    </button>
                  </div>
                </>)}
                {!!vm.pl.sr.promised && (<>
                  <div style={{ marginTop: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ color: "var(--color-accent-800)" }}>
                      You promised him the No. {vm.pl.sr.pickN} pick.
                    </span>
                    <button className="btn btn-ghost" onClick={vm.pl.sr.unpromise} style={{ fontSize: "12px" }}>
                      Withdraw
                    </button>
                  </div>
                </>)}
              </section>
            </>)}
            <section style={{ marginTop: "28px", display: "grid", gridTemplateColumns: "minmax(0,0.85fr) minmax(0,1.6fr)", gap: "36px", alignItems: "start" }}>
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Personality
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "92px minmax(0,1fr)", gap: "8px", padding: "5px 0", borderBottom: "1px solid var(--color-divider)" }}>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Motivated by
                  </span>
                  <span style={{ fontWeight: "600" }}>
                    {vm.pl.mot}
                  </span>
                </div>
                <p style={{ margin: "8px 0", color: "var(--color-neutral-700)", fontSize: "12px" }}>
                  {vm.pl.motDesc}
                </p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {(vm.pl.traits || []).map((t: any, i: number) => (
                    <span key={i} className="tag" style={{ background: "var(--color-neutral-200)", color: "var(--color-neutral-800)" }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px", display: "flex", justifyContent: "space-between" }}>
                  <span>
                    Happiness
                  </span>
                  <span style={{ color: vm.pl.hapColor }}>
                    {vm.pl.hapLabel}
                  </span>
                </h4>
                {!!vm.pl.hasMood && (<>
                  <div style={{ height: "4px", background: "var(--color-neutral-300)", margin: "8px 0 10px" }}>
                    <div style={{ height: "4px", width: vm.pl.hapW, background: vm.pl.hapColor }}></div>
                  </div>
                  {(vm.pl.factors || []).map((f: any, i: number) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid var(--color-divider)" }}>
                      <span>
                        {f.n}
                      </span>
                      <span style={{ color: f.color, fontWeight: "600" }}>
                        {f.v}
                      </span>
                    </div>
                  ))}
                </>)}
                {!!vm.pl.noMood && (<>
                  <p style={{ margin: "8px 0", color: "var(--color-neutral-700)" }}>
                    {vm.pl.fitNote}
                  </p>
                </>)}
              </div>
            </section>
          </>)}
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
                    <input type="range" min="1" max={vm.ext.maxYears} step="1" value={vm.ext.years} onChange={vm.ext.setYears} style={{ width: "100%", accentColor: "var(--color-accent)" }} />
                    <span style={{ textAlign: "right", fontFamily: "var(--font-heading)", fontSize: "18px" }}>
                      {vm.ext.yearsLabel}
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0,1fr) 90px", gap: "12px", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--color-divider)" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      Per year
                    </span>
                    <input type="range" min={vm.ext.min} max={vm.ext.max} step="0.1" value={vm.ext.amt} onChange={vm.ext.setAmt} style={{ width: "100%", accentColor: "var(--color-accent)" }} />
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
                  <input className="input" value={vm.pl.ed.name} onChange={vm.pl.ed.setName} style={{ minHeight: "30px", fontSize: "13px" }} />
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Native script
                  </span>
                  <input className="input" value={vm.pl.ed.native} onChange={vm.pl.ed.setNative} style={{ minHeight: "30px", fontSize: "13px" }} />
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Represents
                  </span>
                  <select className="input" value={vm.pl.ed.repV} onChange={vm.pl.ed.setRep} style={{ minHeight: "30px", fontSize: "13px" }}>
                    {(vm.pl.ed.repOpts || []).map((o: any, i: number) => (
                      <option key={i} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Motivation
                  </span>
                  <select className="input" value={vm.pl.ed.motV} onChange={vm.pl.ed.setMot} style={{ minHeight: "30px", fontSize: "13px" }}>
                    {(vm.pl.ed.motOpts || []).map((o: any, i: number) => (
                      <option key={i} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: "var(--color-neutral-700)" }}>
                    Team
                  </span>
                  <select className="input" value={vm.pl.ed.teamV} onChange={vm.pl.ed.setTeam} style={{ minHeight: "30px", fontSize: "13px" }}>
                    {(vm.pl.ed.teamOpts || []).map((o: any, i: number) => (
                      <option key={i} value={o.v}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <h4 style={{ margin: "0 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Core
                </h4>
                {(vm.pl.ed.sliders || []).map((r: any, i: number) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr) 64px", gap: "12px", alignItems: "center", padding: "4px 0" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      {r.label}
                    </span>
                    <input type="range" min={r.min} max={r.max} step={r.step} value={r.v} onChange={r.set} style={{ width: "100%", accentColor: "var(--color-accent)" }} />
                    <span style={{ textAlign: "right" }}>
                      {r.val}
                    </span>
                  </div>
                ))}
                <h4 style={{ margin: "16px 0 6px", fontSize: "18px", borderBottom: "1px solid var(--color-text)", paddingBottom: "4px" }}>
                  Traits
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
                {(vm.pl.ed.ratings || []).map((r: any, i: number) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "120px minmax(0,1fr) 40px", gap: "12px", alignItems: "center", padding: "3px 0" }}>
                    <span style={{ color: "var(--color-neutral-700)" }}>
                      {r.label}
                    </span>
                    <input type="range" min={r.min} max={r.max} step={r.step} value={r.v} onChange={r.set} style={{ width: "100%", accentColor: "var(--color-accent)" }} />
                    <span style={{ textAlign: "right" }}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </section>
            </div>
          </>)}
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
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>
                        GP
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>
                        Min
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>
                        Pts
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>
                        Reb
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>
                        Ast
                      </th>
                      <th style={{ padding: "6px 8px", textAlign: "right" }}>
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
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>
                          {c.gp}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>
                          {c.min}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>
                          {c.pts}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>
                          {c.reb}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>
                          {c.ast}
                        </td>
                        <td style={{ padding: "5px 8px", textAlign: "right" }}>
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
        </div>
      </div>
    </>
  );
}
