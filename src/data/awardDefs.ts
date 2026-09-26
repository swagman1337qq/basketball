// Default award definitions: the Basketball GM custom-award format (name, flags and a
// formula over season stats). Replace or edit them in Settings → Award formulas.
export interface AwardDef { shortName: string; name: string; formula: string; showStats?: string; actAs?: string; rookie?: boolean; bench?: boolean; mip?: boolean; numTeams?: number; statRange?: number }

export const DEFAULT_AWARDS: AwardDef[] = [
  {
    "shortName": "MVP",
    "name": "Most Valuable Player",
    "showStats": "offense",
    "actAs": "mvp",
    "formula": "(max(0, ewa/24 + vorp/8 + ws/16 + bpm/10 + per/30 + onOff100/30) * (0.4 + seasonFraction*winp)^2 + 1.5*max(0, 0.5 - max(0, 0.5 - ws/max(teamWs,ws)))*seasonFraction*winp + 1.2*seasonFraction*winp + (max(0, pts + trb + ast - 38) - max(0, pts + trb + ast - 48))/3 + 1.5*(max(0, per - 30) - max(0, per - 36)) + 1.2*(max(0, vorp - 9.5) - max(0, vorp - 13))) * (1/(numWon.MVP + 1))^(1/12) * (1/(numWonConsecutive.MVP + 1))^(1/10) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 30 - min) - 100000*max(0, 0.5 - winp) - 100000*max(0, 52 - tsp)"
  },
  {
    "shortName": "DPOY",
    "name": "Defensive Player of the Year",
    "showStats": "defense",
    "formula": "(dbpm/1.2 + blkp/6 + stlp/2.4 + drbp/40 + (112 - drtg)/7 + dws/6 + (min - 24)/20 + 1.5*seasonFraction*winp - 0.4*max(0, pf - 2.8)) * (1/(numWon.DPOY + 1))^(1/20) * (1/(numWonConsecutive.DPOY + 1))^(1/16) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  },
  {
    "shortName": "ROY",
    "name": "Rookie of the Year",
    "showStats": "offense",
    "rookie": true,
    "actAs": "roy",
    "formula": "ewa/6 + vorp/2 + ws/4 + gp/82*(pts + 0.7*trb + 1.1*ast)/16 + 0.04*(tsp-50) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 20 - min)"
  },
  {
    "shortName": "SMOY",
    "name": "Sixth Man of the Year",
    "showStats": "offense",
    "bench": true,
    "formula": "(ewa/6 + ws/5 + bpm/8 + gp/82*(pts + 0.5*trb + 0.8*ast)/7 + 0.04*(tsp-50) + 0.5*seasonFraction*winp) * (1/(numWon.SMOY + 1))^(1/24) * (1/(numWonConsecutive.SMOY + 1))^(1/18) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 22 - min) - 100000*max(0, 2*gs - gp + 1) - 100000*max(0, gs - 35)"
  },
  {
    "shortName": "MIP",
    "name": "Most Improved Player",
    "showStats": "offense",
    "mip": true,
    "formula": "(ewa/6 + vorp/2 + ws/4 + gp/82*(pts + 0.7*trb + 1.1*ast)/16 + 0.04*(tsp-50) + 2*min(1, gp/(65*max(seasonFraction, 0.001)))) * (1/(numWon.MIP + 1)) * (1/(numWonConsecutive.MIP + 1))^(1/2)"
  },
  {
    "shortName": "FMVP",
    "name": "Finals MVP",
    "showStats": "offense",
    "statRange": -1,
    "formula": "gmsc + pm/3 + (stl + blk)/2 + 15*won - 50*(1 - min(1, gp/4))"
  },
  {
    "shortName": "SFMVP",
    "name": "Semifinals MVP",
    "showStats": "offense",
    "statRange": -2,
    "formula": "gmsc + pm/3 + (stl + blk)/2 + 15*won - 50*(1 - min(1, gp/4))"
  },
  {
    "shortName": "ALL",
    "name": "All-League",
    "showStats": "offense",
    "numTeams": 3,
    "formula": "ewa/24 + vorp/8 + ws/16 + bpm/10 + per/30 + 0.6*max(0, 0.5 - max(0, 0.5 - ws/max(teamWs,ws))) + 0.5*seasonFraction*winp - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  },
  {
    "shortName": "DEF",
    "name": "All-Defensive",
    "showStats": "defense",
    "numTeams": 2,
    "formula": "dbpm/1.2 + blkp/6 + stlp/2.4 + drbp/40 + (112 - drtg)/18 + dws/10 + (min - 24)/20 - 0.4*max(0, pf - 2.8) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  },
  {
    "shortName": "ALR",
    "name": "All-Rookie",
    "showStats": "offense",
    "rookie": true,
    "numTeams": 2,
    "formula": "ewa/6 + vorp/2 + ws/4 + gp/82*(pts + 0.7*trb + 1.1*ast)/16 + 0.04*(tsp-50) - 100000*max(0, 41*seasonFraction - gp) - 100000*max(0, 15 - min)"
  },
  {
    "shortName": "OPOY",
    "name": "Offensive Player of the Year",
    "showStats": "offense",
    "formula": "ows/4 + obpm/3 + gp/82*pts/12 + usgp/14 + 0.04*(tsp-50) + (ortg - 100)/10 - tovp/20 - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 28 - min)"
  },
  {
    "shortName": "PMOY",
    "name": "Playmaker of the Year",
    "showStats": "offense",
    "formula": "astp/6 + gp/82*ast/2 + ows/6 + 0.04*(tsp-50) - tovp/12 - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  },
  {
    "shortName": "JOKIC",
    "name": "The Nikola Jokic Advanced Stats Darling Award",
    "showStats": "offense",
    "formula": "per/4 + ewa/8 + ws/5 + ws48*12 + ows/5 + dws/4 + bpm/2 + obpm/4 + dbpm/4 + vorp/2.5 + (ortg - 108)/8 + (108 - drtg)/8 + pm100/5 + onOff100/5 + (tsp - 56)/4 + (efg - 52)/5 + orbp/10 + drbp/12 + trbp/12 + astp/12 + stlp/1.2 + blkp/2 - tovp/8 - usgp/5 - gp/82*(pts + 0.5*trb + 0.7*ast)/4 - 100000*max(0, 3*seasonFraction - ws) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  },
  {
    "shortName": "GLUE",
    "name": "Glue Guy Award",
    "showStats": "defense",
    "formula": "onOff100/5 + dbpm/1.5 + ws/3 + gp/82*(orb/4 + stl/1.2 + blk/2.5) - usgp/6 - 1.2*max(0, per - 17) - 100000*max(0, usgp - 21) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 20 - min)"
  },
  {
    "shortName": "LVP",
    "name": "Least Valuable Player",
    "showStats": "offense",
    "formula": "usgp/8 + gp/82*(tovp/4 + max(0, 56-tsp)/3) - vorp - ws/2 - bpm/2 - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 20 - min)"
  },
  {
    "shortName": "AVG",
    "name": "Mr. Perfectly Average",
    "showStats": "offense",
    "formula": "-abs(per - 15) - abs(bpm) - abs(ws - 3) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 20 - min)"
  },
  {
    "shortName": "LIP",
    "name": "Least Improved Player",
    "showStats": "offense",
    "mip": true,
    "formula": "0 - (ewa/6 + vorp/2 + ws/4 + gp/82*(pts + 0.7*trb + 1.1*ast)/16 + 0.04*(tsp-50)) + 2*min(1, gp/(65*max(seasonFraction, 0.001)))"
  },
  {
    "shortName": "LEP",
    "name": "Least Efficient Player",
    "showStats": "offense",
    "formula": "(15 - per)/2 + (56 - tsp)/2.5 + (52 - efg)/4 + (108 - ortg)/6 + tovp/5 - obpm/1.5 - bpm/2.5 - 100000*max(0, 10 - pts) - 100000*max(0, 8 - fga) - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  },
  {
    "shortName": "WDP",
    "name": "Worst Defensive Player",
    "showStats": "defense",
    "formula": "(drtg - 106)/4 - dbpm/1.2 - dws/1.5 - gp/82*(stl/1.2 + blk/1.5 + drb/6) + pf/4 - 100000*max(0, 65*seasonFraction - gp) - 100000*max(0, 24 - min)"
  }
];
