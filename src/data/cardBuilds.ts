// Every earlier build of the ready-made player cards (playerCard.ts), oldest first: their ratings and potential
// as each version shipped. A saved library copy that still holds one exactly was never edited and takes today's
// build (upgradePresetCard); a player who was given one takes it too, keeping his growth since (retuneCarriers).
export const OLD_CARD_BUILDS: Record<string, { r: Record<string, number>; pot: number; preset?: number; ten?: Record<string, number> }[]> = {
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
    { r: {hgt: 68, stre: 42, spd: 70, acc: 57, jmp: 78, endu: 78, ins: 46, dnk: 70, lay: 52, ft: 60, fg: 60, tp: 23, oiq: 29, diq: 40, blk: 65, stl: 38, drb: 30, pss: 22, reb: 50, box: 40}, pot: 62 },
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

// Playing styles ready-made cards shipped with and later replaced (2026-10-18: the Luka card went back to his exact
// rookie shot profile after carrying the AI's read of his retuned build). A library copy still on one takes today's.
export const OLD_CARD_TENS: Record<string, Record<string, number>[]> = {
  'Luka Dončić': [
    { usage: 74.2, ftr: 56.5, ra: 22.4, paint: 13.8, mid: 22.7, c3: 4, atb: 37.1, cns: 9.8, pullup: 62.9, step: 22.9, fade: 4.4 },
    { usage: 79.1, ftr: 44.6, ra: 8.3, paint: 7.8, mid: 42.1, c3: 6.5, atb: 35.3, cns: 11.5, pullup: 60.9, step: 20.2, fade: 7.4 },
  ],
};

// Historical-season audit, 2026-10-29. Variant IDs prevent the three Embiid builds colliding.
(OLD_CARD_BUILDS["Blake Griffin"] ||= []).push({ preset: 24, r: { hgt: 62, stre: 88, spd: 70, acc: 82, jmp: 87, endu: 70, ins: 72, dnk: 90, lay: 68, ft: 30, fg: 53, tp: 27, oiq: 51, diq: 50, blk: 43, stl: 41, drb: 51, pss: 43, reb: 75, box: 71 }, pot: 67, ten: { usage: 62, ftr: 80, ra: 62, paint: 22, mid: 12, c3: 1, atb: 3, cns: 30, pullup: 30, step: 5, fade: 35 } });
(OLD_CARD_BUILDS["Tyler Hansbrough"] ||= []).push({ preset: 23, r: { hgt: 58, stre: 86, spd: 55, acc: 68, jmp: 46, endu: 85, ins: 71, dnk: 60, lay: 65, ft: 74, fg: 74, tp: 37, oiq: 55, diq: 41, blk: 29, stl: 41, drb: 47, pss: 26, reb: 56, box: 62 }, pot: 52, ten: { usage: 60, ftr: 85, ra: 35, paint: 28, mid: 30, c3: 2, atb: 5, cns: 45, pullup: 25, step: 5, fade: 25 } });
(OLD_CARD_BUILDS["Anthony Bennett"] ||= []).push({ preset: 22, r: { hgt: 54, stre: 75, spd: 62, acc: 65, jmp: 69, endu: 45, ins: 60, dnk: 68, lay: 58, ft: 49, fg: 62, tp: 52, oiq: 44, diq: 48, blk: 45, stl: 34, drb: 41, pss: 25, reb: 55, box: 49 }, pot: 50, ten: { usage: 50, ftr: 45, ra: 35, paint: 12, mid: 18, c3: 10, atb: 25, cns: 55, pullup: 25, step: 5, fade: 15 } });
(OLD_CARD_BUILDS["Joel Embiid"] ||= []).push({ preset: 19, r: { hgt: 70, stre: 78, spd: 60, acc: 75, jmp: 68, endu: 50, ins: 82, dnk: 78, lay: 72, ft: 44, fg: 54, tp: 30, oiq: 39, diq: 65, blk: 87, stl: 52, drb: 29, pss: 41, reb: 64, box: 56 }, pot: 69, ten: { usage: 45, ftr: 80, ra: 52, paint: 30, mid: 14, c3: 1, atb: 3, cns: 30, pullup: 15, step: 5, fade: 50 } });
(OLD_CARD_BUILDS["Maxi Kleber"] ||= []).push({ preset: 18, r: { hgt: 64, stre: 55, spd: 55, acc: 48, jmp: 65, endu: 65, ins: 35, dnk: 45, lay: 35, ft: 76, fg: 58, tp: 81, oiq: 54, diq: 70, blk: 65, stl: 22, drb: 30, pss: 45, reb: 61, box: 61 }, pot: 59, ten: { usage: 30, ftr: 30, ra: 28, paint: 7, mid: 3, c3: 24, atb: 38, cns: 92, pullup: 5, step: 0, fade: 3 } });
(OLD_CARD_BUILDS["John Wall"] ||= []).push({ preset: 8, r: { hgt: 40, stre: 50, spd: 97, acc: 86, jmp: 80, endu: 84, ins: 28, dnk: 52, lay: 48, ft: 54, fg: 20, tp: 26, oiq: 22, diq: 44, blk: 53, stl: 67, drb: 87, pss: 80, reb: 50, box: 44 }, pot: 74, ten: { usage: 57.1, ftr: 74.2, ra: 84.4, paint: 8.4, mid: 3.5, c3: 0.3, atb: 3.4, cns: 5.1, pullup: 54, step: 39.8, fade: 1.1 } });
(OLD_CARD_BUILDS["Dwight Howard"] ||= []).push({ preset: 7, r: { hgt: 70, stre: 80, spd: 64, acc: 59, jmp: 86, endu: 72, ins: 99, dnk: 99, lay: 83, ft: 44, fg: 24, tp: 1, oiq: 44, diq: 55, blk: 64, stl: 48, drb: 6, pss: 41, reb: 85, box: 94 }, pot: 77, ten: { usage: 42, ftr: 90.2, ra: 77.6, paint: 21.2, mid: 0.8, c3: 0.1, atb: 0.3, cns: 32, pullup: 14.8, step: 3.2, fade: 50 } });
(OLD_CARD_BUILDS["Ben Simmons"] ||= []).push({ preset: 2, r: { hgt: 64, stre: 72, spd: 86, acc: 68, jmp: 70, endu: 72, ins: 81, dnk: 81, lay: 81, ft: 20, fg: 42, tp: 6, oiq: 42, diq: 66, blk: 74, stl: 59, drb: 63, pss: 82, reb: 79, box: 78 }, pot: 69, ten: { usage: 53.9, ftr: 61.3, ra: 81, paint: 12, mid: 6, c3: 0.2, atb: 0.8, cns: 12.6, pullup: 44, step: 28.5, fade: 14.9 } });
(OLD_CARD_BUILDS["Dalton Knecht"] ||= []).push({ preset: 1, r: { hgt: 47, stre: 46, spd: 66, acc: 82, jmp: 86, endu: 56, ins: 44, dnk: 62, lay: 77, ft: 43, fg: 62, tp: 81, oiq: 51, diq: 25, blk: 24, stl: 13, drb: 34, pss: 41, reb: 54, box: 60 }, pot: 51, ten: { usage: 60.5, ftr: 53.6, ra: 27.3, paint: 8.1, mid: 8.1, c3: 14.7, atb: 41.8, cns: 72.8, pullup: 16.7, step: 8, fade: 2.5 } });
(OLD_CARD_BUILDS["Luka Dončić"] ||= []).push({ preset: 0, r: { hgt: 73, stre: 78, spd: 52, acc: 71, jmp: 42, endu: 58, ins: 59, dnk: 45, lay: 69, ft: 40, fg: 73, tp: 55, oiq: 52, diq: 44, blk: 27, stl: 47, drb: 92, pss: 58, reb: 70, box: 65 }, pot: 77, ten: { usage: 52, ftr: 67, ra: 20, paint: 14, mid: 25, c3: 3, atb: 38, cns: 10, pullup: 50, step: 30, fade: 10 } });
