import { AlmanacSidebar } from './shell/AlmanacSidebar';
import { DeskRail } from './shell/DeskRail';
import { BroadsheetMasthead } from './shell/BroadsheetMasthead';
import { DeskTopbar } from './shell/DeskTopbar';
import { DashboardScreen } from './screens/DashboardScreen';
import { RosterScreen } from './screens/RosterScreen';
import { DepthChartScreen } from './screens/DepthChartScreen';
import { StandingsScreen } from './screens/StandingsScreen';
import { TradeScreen } from './screens/TradeScreen';
import { FreeAgencyScreen } from './screens/FreeAgencyScreen';
import { DraftScreen } from './screens/DraftScreen';
import { LiveGameScreen } from './screens/LiveGameScreen';
import { ScheduleScreen } from './screens/ScheduleScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { ShortlistScreen } from './screens/ShortlistScreen';
import { PlayoffsScreen } from './screens/PlayoffsScreen';
import { AwardsScreen } from './screens/AwardsScreen';
import { MyTeamsScreen } from './screens/MyTeamsScreen';
import { TacticsScreen } from './screens/TacticsScreen';
import { ScoutingScreen } from './screens/ScoutingScreen';
import { OverseasScreen } from './screens/OverseasScreen';
import { DevelopmentScreen } from './screens/DevelopmentScreen';
import { OwnerScreen } from './screens/OwnerScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { FinancesScreen } from './screens/FinancesScreen';
import { CareerScreen } from './screens/CareerScreen';
import { PressScreen } from './screens/PressScreen';
import { LeagueStatsScreen } from './screens/LeagueStatsScreen';
import { LeagueEditorScreen } from './screens/LeagueEditorScreen';
import { HallOfFameScreen } from './screens/HallOfFameScreen';
import { CapOutlookScreen } from './screens/CapOutlookScreen';
import { CapSheetScreen } from './screens/CapSheetScreen';
import { StatsScreen } from './screens/StatsScreen';
import { InboxCard } from './screens/InboxCard';
import { DeskPanel } from './shell/DeskPanel';
import { ListModal } from './modals/ListModal';
import { TeamModal } from './modals/TeamModal';
import { PlayerModal } from './modals/PlayerModal';
import { ConfirmDialog } from './modals/ConfirmDialog';
import { ContractDialog } from './modals/ContractDialog';
import { PlayerSearch } from './PlayerSearch';
import { OwnerLetterModal } from './modals/OwnerLetterModal';
import type { VM } from './vm';

export function GMView({ vm }: { vm: VM }) {
  return (
    <>
      <div ref={vm.rootRef} style={{ display: "flex", width: "100%", height: "100%", overflow: "hidden", position: "relative", background: "var(--color-bg)", color: "var(--color-text)", fontFamily: "var(--font-body)", fontSize: "13px", lineHeight: "1.45", fontVariantNumeric: "tabular-nums" }}>
        {!!vm.isA && <AlmanacSidebar vm={vm} />}
        {!!vm.isC && <DeskRail vm={vm} />}
        <div style={{ flex: "1", minWidth: "0", display: "flex", flexDirection: "column" }}>
          {!!vm.isB && <BroadsheetMasthead vm={vm} />}
          {!!vm.isC && <DeskTopbar vm={vm} />}
          <main style={{ flex: "1", overflow: "auto", padding: "22px 28px 40px" }}>
            <div className="team-stripe" />
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", margin: "-6px 0 16px", padding: "7px 12px", border: "1px solid var(--color-divider)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)", whiteSpace: "nowrap" }}>
                {vm.ph.season}
              </span>
              {(vm.ph.steps || []).map((st: any, i: number) => (
                <button key={i} onClick={st.go} title={st.title} style={{ all: "unset", cursor: st.cursor, fontSize: "12px", whiteSpace: "nowrap", padding: "2px 7px", borderRadius: "var(--radius-sm)", border: st.border, color: st.color, fontWeight: st.fw }}>
                  {st.label}
                </button>
              ))}
              <span style={{ flex: "1", minWidth: "120px", fontSize: "12px", color: "var(--color-neutral-700)", textAlign: "right" }}>
                {vm.ph.note}
              </span>
              {(vm.ph.actions || []).map((a: any, i: number) => (
                <button key={i} className="btn {{a.cls}}" onClick={a.go} disabled={a.dis} style={{ whiteSpace: "nowrap", fontSize: "13px", padding: "5px 12px" }}>
                  {a.label}
                </button>
              ))}
            </div>
            {vm.hasModal ? <PlayerModal vm={vm} /> : vm.hasTeamModal ? <TeamModal vm={vm} /> : (<>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", marginBottom: "18px", paddingBottom: "10px", borderBottom: "1px solid var(--color-divider)" }}>
              <div style={{ flex: "1", minWidth: "0" }}>
                <div style={{ fontSize: "10.5px", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--color-accent-700)" }}>
                  {vm.page.kicker}
                </div>
                <h2 style={{ margin: "2px 0 0", fontSize: "32px", fontWeight: "400" }}>
                  {vm.page.title}
                </h2>
              </div>
              <div style={{ color: "var(--color-neutral-700)", textAlign: "right" }}>
                {vm.page.meta}
              </div>
              {!vm.isC && <PlayerSearch vm={vm} />}
            </div>
            {!!vm.is.dash && <InboxCard vm={vm} />}
            {!!vm.is.dash && <DashboardScreen vm={vm} />}
            {!!vm.is.roster && <RosterScreen vm={vm} />}
            {!!vm.is.depth && <DepthChartScreen vm={vm} />}
            {!!vm.is.standings && <StandingsScreen vm={vm} />}
            {!!vm.is.trade && <TradeScreen vm={vm} />}
            {!!vm.is.fa && <FreeAgencyScreen vm={vm} />}
            {!!vm.is.draft && <DraftScreen vm={vm} />}
            {!!vm.is.game && <LiveGameScreen vm={vm} />}
            {!!vm.is.schedule && <ScheduleScreen vm={vm} />}
            {!!vm.is.tx && <TransactionsScreen vm={vm} />}
            {!!vm.is.short && <ShortlistScreen vm={vm} />}
            {!!vm.is.playoffs && <PlayoffsScreen vm={vm} />}
            {!!vm.is.awards && <AwardsScreen vm={vm} />}
            {!!vm.is.teams && <MyTeamsScreen vm={vm} />}
            {!!vm.is.tactics && <TacticsScreen vm={vm} />}
            {!!vm.is.scouting && <ScoutingScreen vm={vm} />}
            {!!vm.is.overseas && <OverseasScreen vm={vm} />}
            {!!vm.is.dev && <DevelopmentScreen vm={vm} />}
            {!!vm.is.owner && <OwnerScreen vm={vm} />}
            {!!vm.is.settings && <SettingsScreen vm={vm} />}
            {!!vm.is.fin && <FinancesScreen vm={vm} />}
            {!!vm.is.career && <CareerScreen vm={vm} />}
            {!!vm.is.press && <PressScreen vm={vm} />}
            {!!vm.is.league && <LeagueStatsScreen vm={vm} />}
            {!!vm.is.editor && <LeagueEditorScreen vm={vm} />}
            {!!vm.is.hof && <HallOfFameScreen vm={vm} />}
            {!!vm.is.caps && <CapOutlookScreen vm={vm} />}
            {!!vm.is.capsheet && <CapSheetScreen vm={vm} />}
            {!!vm.is.stats && <StatsScreen vm={vm} />}
            </>)}
          </main>
        </div>
        {!!vm.isC && <DeskPanel vm={vm} />}
        {!!vm.hasList && <ListModal vm={vm} />}
        {!!vm.hasDialog && (vm.ctx.s.dialog.type === 'sign' || vm.ctx.s.dialog.type === 'release' ? <ContractDialog vm={vm} /> : <ConfirmDialog vm={vm} />)}
        {!!vm.ctx.s.letterOpen && <OwnerLetterModal vm={vm} />}
      </div>
    </>
  );
}
