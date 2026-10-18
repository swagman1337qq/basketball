// Every earlier build of the ready-made player cards (playerCard.ts), oldest first: their ratings and potential
// as each version shipped. A saved library copy that still holds one exactly was never edited and takes today's
// build (upgradePresetCard); a player who was given one takes it too, keeping his growth since (retuneCarriers).
export const OLD_CARD_BUILDS: Record<string, { r: Record<string, number>; pot: number }[]> = {
  "Luka Dončić": [
    { r: {hgt: 73, stre: 78, spd: 52, acc: 62, jmp: 42, endu: 58, ins: 62, dnk: 34, lay: 62, ft: 44, fg: 45, tp: 56, oiq: 82, diq: 44, drb: 90, pss: 62, reb: 61, box: 56}, pot: 83 },
    { r: {hgt: 73, stre: 78, spd: 52, acc: 62, jmp: 42, endu: 58, ins: 48, dnk: 30, lay: 42, ft: 42, fg: 95, tp: 51, oiq: 70, diq: 44, drb: 85, pss: 58, reb: 61, box: 56}, pot: 83 },
    { r: {hgt: 73, stre: 78, spd: 52, acc: 62, jmp: 42, endu: 58, ins: 48, dnk: 30, lay: 42, ft: 42, fg: 95, tp: 51, oiq: 70, diq: 44, blk: 30, stl: 62, drb: 85, pss: 58, reb: 61, box: 56}, pot: 83 },
    { r: {hgt: 73, stre: 78, spd: 52, acc: 61, jmp: 42, endu: 58, ins: 53, dnk: 35, lay: 47, ft: 38, fg: 96, tp: 63, oiq: 58, diq: 44, blk: 28, stl: 51, drb: 85, pss: 60, reb: 68, box: 63}, pot: 77 },
  ],
  "Dalton Knecht": [
    { r: {hgt: 47, stre: 46, spd: 66, acc: 80, jmp: 86, endu: 56, ins: 48, dnk: 66, lay: 81, ft: 49, fg: 59, tp: 62, oiq: 43, diq: 25, blk: 20, stl: 15, drb: 46, pss: 41, reb: 40, box: 46}, pot: 51 },
  ],
  "Ben Simmons": [
    { r: {hgt: 64, stre: 72, spd: 86, acc: 78, jmp: 70, endu: 72, ins: 91, dnk: 91, lay: 91, ft: 16, fg: 42, tp: 8, oiq: 62, diq: 66, blk: 70, stl: 60, drb: 74, pss: 78, reb: 59, box: 58}, pot: 69 },
  ],
  "Al Horford": [
    { r: {hgt: 62, stre: 86, spd: 40, acc: 38, jmp: 62, endu: 66, ins: 79, dnk: 60, lay: 75, ft: 46, fg: 58, tp: 12, oiq: 60, diq: 62, blk: 65, stl: 53, drb: 36, pss: 45, reb: 82, box: 70}, pot: 68 },
  ],
  "Chris Paul": [
    { r: {hgt: 24, stre: 52, spd: 82, acc: 88, jmp: 70, endu: 88, ins: 39, dnk: 25, lay: 57, ft: 76, fg: 47, tp: 26, oiq: 84, diq: 66, blk: 10, stl: 83, drb: 88, pss: 70, reb: 53, box: 34}, pot: 85 },
  ],
  "Klay Thompson": [
    { r: {hgt: 48, stre: 46, spd: 62, acc: 58, jmp: 46, endu: 76, ins: 49, dnk: 56, lay: 72, ft: 88, fg: 51, tp: 93, oiq: 52, diq: 42, blk: 57, stl: 47, drb: 46, pss: 58, reb: 42, box: 30}, pot: 71 },
  ],
  "Kawhi Leonard": [
    { r: {hgt: 50, stre: 70, spd: 70, acc: 62, jmp: 56, endu: 72, ins: 62, dnk: 87, lay: 87, ft: 55, fg: 53, tp: 60, oiq: 54, diq: 70, blk: 38, stl: 73, drb: 44, pss: 43, reb: 61, box: 58}, pot: 86 },
    { r: {hgt: 50, stre: 64, spd: 64, acc: 58, jmp: 54, endu: 70, ins: 54, dnk: 72, lay: 70, ft: 55, fg: 50, tp: 58, oiq: 48, diq: 64, blk: 34, stl: 64, drb: 40, pss: 40, reb: 66, box: 62}, pot: 80 },
  ],
  "Dwight Howard": [
    { r: {hgt: 70, stre: 80, spd: 64, acc: 58, jmp: 86, endu: 72, ins: 95, dnk: 95, lay: 70, ft: 35, fg: 35, tp: 1, oiq: 38, diq: 55, blk: 67, stl: 54, drb: 26, pss: 45, reb: 67, box: 76}, pot: 82 },
  ],
  "John Wall": [
    { r: {hgt: 40, stre: 50, spd: 97, acc: 95, jmp: 80, endu: 84, ins: 48, dnk: 72, lay: 68, ft: 54, fg: 36, tp: 39, oiq: 40, diq: 44, blk: 45, stl: 66, drb: 74, pss: 72, reb: 30, box: 24}, pot: 78 },
  ],
  "Yi Jianlian": [
    { r: {hgt: 68, stre: 42, spd: 70, acc: 58, jmp: 78, endu: 78, ins: 36, dnk: 60, lay: 42, ft: 70, fg: 46, tp: 30, oiq: 28, diq: 40, blk: 72, stl: 36, drb: 18, pss: 36, reb: 42, box: 32}, pot: 62 },
  ],
  "Andrei Kirilenko": [
    { r: {hgt: 60, stre: 54, spd: 84, acc: 80, jmp: 88, endu: 86, ins: 36, dnk: 40, lay: 40, ft: 52, fg: 34, tp: 22, oiq: 34, diq: 86, blk: 97, stl: 48, drb: 22, pss: 34, reb: 36, box: 38}, pot: 79 },
  ],
  "Jeremy Lin": [
    { r: {hgt: 36, stre: 52, spd: 82, acc: 84, jmp: 66, endu: 70, ins: 34, dnk: 40, lay: 42, ft: 54, fg: 28, tp: 30, oiq: 34, diq: 50, blk: 44, stl: 96, drb: 50, pss: 58, reb: 36, box: 28}, pot: 56 },
    { r: {hgt: 36, stre: 52, spd: 82, acc: 84, jmp: 66, endu: 70, ins: 22, dnk: 22, lay: 26, ft: 54, fg: 46, tp: 41, oiq: 34, diq: 50, blk: 44, stl: 96, drb: 50, pss: 58, reb: 36, box: 28}, pot: 56 },
  ],
  "Toney Douglas": [
    { r: {hgt: 34, stre: 52, spd: 78, acc: 76, jmp: 62, endu: 74, ins: 40, dnk: 46, lay: 64, ft: 60, fg: 68, tp: 68, oiq: 46, diq: 62, blk: 22, stl: 62, drb: 56, pss: 58, reb: 30, box: 26}, pot: 58 },
  ],
  "Jan Veselý": [
    { r: {hgt: 66, stre: 50, spd: 74, acc: 66, jmp: 84, endu: 70, ins: 42, dnk: 50, lay: 44, ft: 12, fg: 28, tp: 12, oiq: 22, diq: 50, blk: 72, stl: 70, drb: 12, pss: 36, reb: 52, box: 46}, pot: 52 },
  ],
  "Bismack Biyombo": [
    { r: {hgt: 60, stre: 72, spd: 62, acc: 56, jmp: 95, endu: 70, ins: 24, dnk: 30, lay: 16, ft: 8, fg: 16, tp: 1, oiq: 20, diq: 70, blk: 98, stl: 12, drb: 10, pss: 14, reb: 42, box: 50}, pot: 60 },
  ],
  "Bronny James": [
    { r: {hgt: 34, stre: 60, spd: 66, acc: 64, jmp: 70, endu: 70, ins: 34, dnk: 30, lay: 14, ft: 56, fg: 10, tp: 36, oiq: 38, diq: 52, blk: 30, stl: 50, drb: 36, pss: 64, reb: 30, box: 30}, pot: 52 },
  ],
  "Jarrett Culver": [
    { r: {hgt: 46, stre: 46, spd: 70, acc: 70, jmp: 68, endu: 72, ins: 42, dnk: 48, lay: 30, ft: 8, fg: 30, tp: 36, oiq: 62, diq: 60, blk: 68, stl: 48, drb: 48, pss: 47, reb: 33, box: 30}, pot: 54 },
  ],
};
