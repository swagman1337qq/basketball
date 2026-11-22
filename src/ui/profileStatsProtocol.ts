import type { ProfileSeasonData } from './profileStatsData';
export interface StatsContext {
  year: number;
  revision: number;
  firstSeason?: number;
  players: Record<number, any>;
  currentIds: number[];
  rapm: any;
  state: { season: number; day: number; phase: string; gv: number; teams: any[]; tstats: any; tstatsHist: any; teamHist: any };
}
export interface StatsRequest {
  id: number;
  epoch: string;
  pid: number;
  years: number[];
  po: boolean;
  ccp: boolean;
  context?: StatsContext;
}
export type StatsCommand = StatsRequest | { type: 'pause' };
export type StatsReply =
  | {
      type: 'season';
      id: number;
      epoch: string;
      pid: number;
      po: boolean;
      ccp: boolean;
      year: number;
      value: ProfileSeasonData;
      cached?: boolean;
    }
  | { type: 'done'; id: number; epoch: string; pid: number; po: boolean; ccp: boolean }
  | { type: 'error'; id: number; epoch: string; pid: number; po: boolean; ccp: boolean; error: string };
