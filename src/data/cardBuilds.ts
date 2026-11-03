// Every earlier build of the ready-made player cards (playerCard.ts), oldest first: their ratings and potential
// as each version shipped. A saved library copy that still holds one exactly was never edited and takes today's
// build (upgradePresetCard); a player who was given one takes it too, keeping his growth since (retuneCarriers).
export const OLD_CARD_BUILDS: Record<string, { r: Record<string, number>; pot: number; preset?: number; ten?: Record<string, number>; notes?: string; sources?: string[] }[]> = {
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

// Contact and style audit, 2026-10-30: exact preceding variants and their authored preferences.
(OLD_CARD_BUILDS["Blake Griffin"] ||= []).push({ preset: 24, r: { hgt: 62, stre: 88, spd: 70, acc: 82, jmp: 87, endu: 70, ins: 78, dnk: 96, lay: 74, ft: 24, fg: 67, tp: 37, oiq: 65, diq: 50, blk: 39, stl: 37, drb: 41, pss: 39, reb: 69, box: 65 }, pot: 67, ten: { usage: 62, ftr: 80, ra: 62, paint: 22, mid: 12, c3: 1, atb: 3, cns: 30, pullup: 30, step: 5, fade: 35 } });
(OLD_CARD_BUILDS["Tyler Hansbrough"] ||= []).push({ preset: 23, r: { hgt: 58, stre: 86, spd: 55, acc: 68, jmp: 46, endu: 85, ins: 79, dnk: 68, lay: 73, ft: 72, fg: 88, tp: 49, oiq: 51, diq: 41, blk: 17, stl: 45, drb: 61, pss: 18, reb: 56, box: 48 }, pot: 52, ten: { usage: 60, ftr: 85, ra: 35, paint: 28, mid: 30, c3: 2, atb: 5, cns: 45, pullup: 25, step: 5, fade: 25 } });
(OLD_CARD_BUILDS["Anthony Bennett"] ||= []).push({ preset: 22, r: { hgt: 54, stre: 75, spd: 62, acc: 65, jmp: 69, endu: 45, ins: 58, dnk: 66, lay: 56, ft: 45, fg: 62, tp: 52, oiq: 38, diq: 48, blk: 41, stl: 26, drb: 49, pss: 17, reb: 53, box: 63 }, pot: 50, ten: { usage: 50, ftr: 45, ra: 35, paint: 12, mid: 18, c3: 10, atb: 25, cns: 55, pullup: 25, step: 5, fade: 15 } });
(OLD_CARD_BUILDS["Joel Embiid"] ||= []).push({ preset: 21, r: { hgt: 70, stre: 95, spd: 60, acc: 71, jmp: 62, endu: 65, ins: 88, dnk: 72, lay: 78, ft: 82, fg: 74, tp: 47, oiq: 80, diq: 73, blk: 66, stl: 53, drb: 60, pss: 60, reb: 72, box: 68 }, pot: 69, ten: { usage: 69.1, ftr: 71.2, ra: 43.9, paint: 19, mid: 16.6, c3: 7.9, atb: 12.6, cns: 56.2, pullup: 25.6, step: 4.3, fade: 13.9 } });
(OLD_CARD_BUILDS["Joel Embiid"] ||= []).push({ preset: 20, r: { hgt: 70, stre: 89, spd: 60, acc: 72, jmp: 66, endu: 45, ins: 89, dnk: 84, lay: 81, ft: 62, fg: 74, tp: 63, oiq: 48, diq: 71, blk: 90, stl: 55, drb: 50, pss: 54, reb: 72, box: 64 }, pot: 69, ten: { usage: 59.4, ftr: 75.3, ra: 37.7, paint: 13, mid: 11.9, c3: 12.3, atb: 25.1, cns: 61.9, pullup: 22.2, step: 3.2, fade: 12.7 } });
(OLD_CARD_BUILDS["Joel Embiid"] ||= []).push({ preset: 19, r: { hgt: 70, stre: 78, spd: 60, acc: 75, jmp: 68, endu: 50, ins: 82, dnk: 78, lay: 72, ft: 42, fg: 68, tp: 34, oiq: 29, diq: 65, blk: 85, stl: 46, drb: 15, pss: 47, reb: 62, box: 70 }, pot: 69, ten: { usage: 45, ftr: 80, ra: 52, paint: 30, mid: 14, c3: 1, atb: 3, cns: 30, pullup: 15, step: 5, fade: 50 } });
(OLD_CARD_BUILDS["Maxi Kleber"] ||= []).push({ preset: 18, r: { hgt: 64, stre: 55, spd: 55, acc: 48, jmp: 65, endu: 65, ins: 34, dnk: 44, lay: 34, ft: 65, fg: 58, tp: 66, oiq: 54, diq: 70, blk: 62, stl: 19, drb: 30, pss: 44, reb: 56, box: 61 }, pot: 59, ten: { usage: 19.977225751459308, ftr: 18.94961327020717, ra: 28, paint: 7, mid: 3, c3: 24, atb: 38, cns: 92, pullup: 5, step: 0, fade: 3 } });
(OLD_CARD_BUILDS["Jarred Vanderbilt"] ||= []).push({ preset: 17, r: { hgt: 56, stre: 60, spd: 72, acc: 78, jmp: 80, endu: 78, ins: 50, dnk: 65, lay: 50, ft: 41, fg: 27, tp: 47, oiq: 55, diq: 72, blk: 24, stl: 70, drb: 42, pss: 59, reb: 77, box: 67 }, pot: 60, ten: { usage: 30, ftr: 53, ra: 48, paint: 28, mid: 4, c3: 18, atb: 2, cns: 85, pullup: 10, step: 0, fade: 5 } });
(OLD_CARD_BUILDS["Jarrett Culver"] ||= []).push({ preset: 16, r: { hgt: 46, stre: 46, spd: 70, acc: 80, jmp: 68, endu: 72, ins: 39, dnk: 45, lay: 27, ft: 5, fg: 48, tp: 56, oiq: 73, diq: 60, blk: 54, stl: 28, drb: 65, pss: 44, reb: 53, box: 50 }, pot: 54, ten: { usage: 42.9, ftr: 51.7, ra: 35, paint: 5.1, mid: 7, c3: 15.5, atb: 37.4, cns: 52.6, pullup: 32.2, step: 12.8, fade: 2.4 } });
(OLD_CARD_BUILDS["Bronny James"] ||= []).push({ preset: 15, r: { hgt: 34, stre: 60, spd: 66, acc: 60, jmp: 70, endu: 70, ins: 34, dnk: 30, lay: 14, ft: 53, fg: 15, tp: 43, oiq: 36, diq: 52, blk: 41, stl: 51, drb: 36, pss: 64, reb: 31, box: 31 }, pot: 52, ten: { usage: 22.1, ftr: 44.2, ra: 31.8, paint: 5.1, mid: 3.9, c3: 8.3, atb: 50.9, cns: 65.5, pullup: 20.4, step: 12.3, fade: 1.8 } });
(OLD_CARD_BUILDS["Bismack Biyombo"] ||= []).push({ preset: 14, r: { hgt: 60, stre: 72, spd: 62, acc: 65, jmp: 95, endu: 70, ins: 44, dnk: 50, lay: 36, ft: 1, fg: 16, tp: 1, oiq: 30, diq: 70, blk: 99, stl: 5, drb: 15, pss: 22, reb: 29, box: 37 }, pot: 60, ten: { usage: 16.5, ftr: 67.5, ra: 86.2, paint: 12.2, mid: 1.1, c3: 0.1, atb: 0.4, cns: 36.4, pullup: 22.1, step: 8.5, fade: 33 } });
(OLD_CARD_BUILDS["Jan Veselý"] ||= []).push({ preset: 13, r: { hgt: 66, stre: 50, spd: 74, acc: 67, jmp: 84, endu: 70, ins: 49, dnk: 57, lay: 51, ft: 11, fg: 39, tp: 14, oiq: 29, diq: 50, blk: 78, stl: 85, drb: 15, pss: 32, reb: 59, box: 53 }, pot: 52, ten: { usage: 23.9, ftr: 58.3, ra: 82.4, paint: 12.8, mid: 4, c3: 0.2, atb: 0.6, cns: 26.1, pullup: 23.6, step: 11.2, fade: 39.1 } });
(OLD_CARD_BUILDS["Toney Douglas"] ||= []).push({ preset: 12, r: { hgt: 34, stre: 52, spd: 78, acc: 66, jmp: 62, endu: 74, ins: 37, dnk: 43, lay: 61, ft: 56, fg: 80, tp: 70, oiq: 48, diq: 62, blk: 21, stl: 67, drb: 55, pss: 66, reb: 37, box: 33 }, pot: 58, ten: { usage: 48.8, ftr: 47.8, ra: 20.6, paint: 8.9, mid: 19.5, c3: 11.4, atb: 39.6, cns: 66.4, pullup: 23.2, step: 7.4, fade: 3 } });
(OLD_CARD_BUILDS["Jeremy Lin"] ||= []).push({ preset: 11, r: { hgt: 36, stre: 52, spd: 82, acc: 85, jmp: 66, endu: 70, ins: 23, dnk: 23, lay: 27, ft: 44, fg: 42, tp: 35, oiq: 34, diq: 50, blk: 49, stl: 99, drb: 40, pss: 61, reb: 36, box: 28 }, pot: 56, ten: { usage: 30.6, ftr: 55.4, ra: 56.4, paint: 10.3, mid: 16.6, c3: 1.4, atb: 15.3, cns: 25.5, pullup: 35.4, step: 35.1, fade: 4 } });
(OLD_CARD_BUILDS["Andrei Kirilenko"] ||= []).push({ preset: 10, r: { hgt: 60, stre: 54, spd: 84, acc: 70, jmp: 88, endu: 86, ins: 56, dnk: 60, lay: 60, ft: 64, fg: 17, tp: 41, oiq: 35, diq: 86, blk: 99, stl: 30, drb: 30, pss: 32, reb: 50, box: 52 }, pot: 75, ten: { usage: 31.5, ftr: 58.5, ra: 64.1, paint: 10, mid: 2.7, c3: 6.9, atb: 16.3, cns: 65.6, pullup: 19, step: 10.9, fade: 4.5 } });
(OLD_CARD_BUILDS["Yi Jianlian"] ||= []).push({ preset: 9, r: { hgt: 68, stre: 42, spd: 70, acc: 68, jmp: 78, endu: 78, ins: 15, dnk: 42, lay: 20, ft: 84, fg: 95, tp: 40, oiq: 25, diq: 40, blk: 66, stl: 29, drb: 50, pss: 22, reb: 56, box: 46 }, pot: 62, ten: { usage: 45.8, ftr: 35.7, ra: 32.8, paint: 6.5, mid: 54.5, c3: 1.1, atb: 5.1, cns: 23.6, pullup: 34.1, step: 14.6, fade: 27.7 } });
(OLD_CARD_BUILDS["John Wall"] ||= []).push({ preset: 8, r: { hgt: 40, stre: 50, spd: 97, acc: 86, jmp: 80, endu: 84, ins: 24, dnk: 48, lay: 44, ft: 55, fg: 20, tp: 34, oiq: 22, diq: 44, blk: 47, stl: 65, drb: 87, pss: 79, reb: 47, box: 44 }, pot: 74, ten: { usage: 53.19555378618362, ftr: 75.03156270943738, ra: 84.4, paint: 8.4, mid: 3.5, c3: 0.3, atb: 3.4, cns: 5.1, pullup: 54, step: 39.8, fade: 1.1 } });
(OLD_CARD_BUILDS["Dwight Howard"] ||= []).push({ preset: 7, r: { hgt: 70, stre: 80, spd: 64, acc: 59, jmp: 86, endu: 72, ins: 83, dnk: 83, lay: 67, ft: 32, fg: 24, tp: 1, oiq: 44, diq: 55, blk: 59, stl: 51, drb: 6, pss: 35, reb: 83, box: 94 }, pot: 77, ten: { usage: 30, ftr: 79.98548594387188, ra: 77.6, paint: 21.2, mid: 0.8, c3: 0.1, atb: 0.3, cns: 32, pullup: 14.8, step: 3.2, fade: 50 } });
(OLD_CARD_BUILDS["Kawhi Leonard"] ||= []).push({ preset: 6, r: { hgt: 50, stre: 64, spd: 64, acc: 63, jmp: 54, endu: 70, ins: 52, dnk: 70, lay: 68, ft: 56, fg: 44, tp: 48, oiq: 50, diq: 64, blk: 38, stl: 66, drb: 42, pss: 43, reb: 71, box: 67 }, pot: 76, ten: { usage: 38.3, ftr: 50.7, ra: 41.1, paint: 11.6, mid: 6.8, c3: 10.5, atb: 30, cns: 64.5, pullup: 23.4, step: 6.4, fade: 5.7 } });
(OLD_CARD_BUILDS["Klay Thompson"] ||= []).push({ preset: 5, r: { hgt: 48, stre: 46, spd: 62, acc: 67, jmp: 46, endu: 76, ins: 37, dnk: 44, lay: 60, ft: 87, fg: 36, tp: 82, oiq: 47, diq: 42, blk: 44, stl: 39, drb: 42, pss: 61, reb: 52, box: 40 }, pot: 71, ten: { usage: 62, ftr: 48.4, ra: 16.2, paint: 5.3, mid: 2.9, c3: 14.5, atb: 61.1, cns: 75.6, pullup: 14.3, step: 9.4, fade: 0.7 } });
(OLD_CARD_BUILDS["Chris Paul"] ||= []).push({ preset: 4, r: { hgt: 24, stre: 52, spd: 82, acc: 85, jmp: 70, endu: 88, ins: 28, dnk: 14, lay: 46, ft: 90, fg: 34, tp: 32, oiq: 64, diq: 66, blk: 19, stl: 74, drb: 87, pss: 62, reb: 66, box: 47 }, pot: 78, ten: { usage: 62.2, ftr: 64.9, ra: 65.8, paint: 13, mid: 8.5, c3: 0.5, atb: 12.2, cns: 6, pullup: 61.4, step: 31, fade: 1.6 } });
(OLD_CARD_BUILDS["Al Horford"] ||= []).push({ preset: 3, r: { hgt: 62, stre: 86, spd: 40, acc: 34, jmp: 62, endu: 66, ins: 82, dnk: 63, lay: 78, ft: 48, fg: 59, tp: 15, oiq: 60, diq: 62, blk: 63, stl: 53, drb: 42, pss: 45, reb: 83, box: 71 }, pot: 68, ten: { usage: 37, ftr: 70.4, ra: 62, paint: 26.3, mid: 10.8, c3: 0.2, atb: 0.7, cns: 18, pullup: 21.8, step: 3.1, fade: 57.1 } });
(OLD_CARD_BUILDS["Ben Simmons"] ||= []).push({ preset: 2, r: { hgt: 64, stre: 72, spd: 86, acc: 68, jmp: 70, endu: 72, ins: 67, dnk: 67, lay: 67, ft: 22, fg: 42, tp: 6, oiq: 42, diq: 66, blk: 56, stl: 53, drb: 63, pss: 80, reb: 68, box: 78 }, pot: 69, ten: { usage: 47.38782036721893, ftr: 58.89298575521804, ra: 81, paint: 12, mid: 6, c3: 0.2, atb: 0.8, cns: 12.6, pullup: 44, step: 28.5, fade: 14.9 } });
(OLD_CARD_BUILDS["Dalton Knecht"] ||= []).push({ preset: 1, r: { hgt: 47, stre: 46, spd: 66, acc: 82, jmp: 86, endu: 56, ins: 37, dnk: 55, lay: 70, ft: 49, fg: 62, tp: 78, oiq: 51, diq: 25, blk: 17, stl: 12, drb: 34, pss: 36, reb: 55, box: 60 }, pot: 51, ten: { usage: 38.857692616338795, ftr: 12.6799438485972, ra: 27.3, paint: 8.1, mid: 8.1, c3: 14.7, atb: 41.8, cns: 72.8, pullup: 16.7, step: 8, fade: 2.5 } });
(OLD_CARD_BUILDS["Luka Dončić"] ||= []).push({ preset: 0, r: { hgt: 73, stre: 78, spd: 52, acc: 71, jmp: 42, endu: 58, ins: 54, dnk: 40, lay: 64, ft: 44, fg: 73, tp: 57, oiq: 52, diq: 44, blk: 21, stl: 41, drb: 92, pss: 59, reb: 65, box: 65 }, pot: 77, ten: { usage: 46.78811120178835, ftr: 89.18592290189015, ra: 20, paint: 14, mid: 25, c3: 3, atb: 38, cns: 10, pullup: 50, step: 30, fade: 10 } });

// 2026-11-02: untouched Knicks-season library copies take the NBA-zone rebuild.
(OLD_CARD_BUILDS["Jeremy Lin"] ||= []).push({"preset":25,"r":{"hgt":36,"stre":52,"spd":82,"acc":85,"jmp":66,"endu":78,"ins":29,"dnk":29,"lay":49,"ft":57,"fg":42,"tp":45,"oiq":55,"diq":50,"blk":23,"stl":86,"drb":69,"pss":72,"reb":46,"box":28},"pot":60,"ten":{"usage":56.34,"ftr":82.51,"ra":45,"paint":16,"mid":19.4,"c3":2,"atb":17.6,"cns":20,"pullup":55,"step":20,"fade":5,"turnovers":76.33,"fouls":58,"crash":53.22},"notes":"Full 35-game Knicks regular season. Shot-location and creation shares are scouting estimates; box-score targets use historical totals. Applying a card keeps the recipient’s identity, age, contract and history.","sources":["https://www.basketball-reference.com/players/l/linje01.html","https://www.landofbasketball.com/nba_players_season_stats/2012/jeremy_lin_full.htm"]});

(OLD_CARD_BUILDS["Luka Dončić"] ||= []).push({"preset":0,"r":{"hgt":73,"stre":78,"spd":52,"acc":71,"jmp":42,"endu":58,"ins":56,"dnk":42,"lay":66,"ft":39,"fg":74,"tp":66,"oiq":52,"diq":44,"blk":25,"stl":45,"drb":92,"pss":61,"reb":66,"box":65},"pot":77,"ten":{"usage":47.27111055978809,"ftr":75.7444334484112,"ra":19.31176168464304,"paint":13.518233179250128,"mid":24.1397021058038,"c3":3.1485587583148558,"atb":39.881744271988175,"cns":10,"pullup":50,"step":30,"fade":10,"turnovers":55.93453908026964,"fouls":41.82691046909602,"crash":38.237606429139106}});

(OLD_CARD_BUILDS["Chris Paul"] ||= []).push({"preset":4,"r":{"hgt":24,"stre":52,"spd":82,"acc":85,"jmp":70,"endu":88,"ins":27,"dnk":13,"lay":45,"ft":66,"fg":32,"tp":29,"oiq":64,"diq":66,"blk":1,"stl":66,"drb":87,"pss":61,"reb":58,"box":47},"pot":78,"ten":{"usage":27.111634289833038,"ftr":88,"ra":61.04531727774464,"paint":12.06062499408329,"mid":7.8857932653621505,"c3":0.7483568686145636,"atb":18.25990759419535,"cns":6,"pullup":61.4,"step":31,"fade":1.6,"turnovers":64.26372439545905,"fouls":72.46252764103828,"crash":49.79474315487292}});

(OLD_CARD_BUILDS["Dwight Howard"] ||= []).push({"preset":7,"r":{"hgt":70,"stre":80,"spd":64,"acc":59,"jmp":86,"endu":72,"ins":46,"dnk":46,"lay":30,"ft":37,"fg":21,"tp":1,"oiq":44,"diq":55,"blk":54,"stl":45,"drb":6,"pss":25,"reb":72,"box":94},"pot":77,"ten":{"usage":48.07398799875734,"ftr":85.63504681686865,"ra":59.259437751004015,"paint":30.130220883534136,"mid":10.310341365461847,"c3":0,"atb":0.3,"cns":32,"pullup":14.8,"step":3.2,"fade":50,"turnovers":45.23766118289093,"fouls":44.48831951170427,"crash":54.25793071243049}});

(OLD_CARD_BUILDS["Jan Veselý"] ||= []).push({"preset":13,"r":{"hgt":66,"stre":50,"spd":74,"acc":67,"jmp":84,"endu":70,"ins":44,"dnk":52,"lay":46,"ft":16,"fg":34,"tp":14,"oiq":29,"diq":50,"blk":72,"stl":82,"drb":15,"pss":25,"reb":52,"box":53},"pot":52,"ten":{"usage":29.591664902409253,"ftr":52.66078050643346,"ra":66.5,"paint":19.7,"mid":13.3,"c3":0,"atb":0.5,"cns":26.1,"pullup":23.6,"step":11.2,"fade":39.1,"turnovers":50.433993854819946,"fouls":62.70369298793738,"crash":60.09299224034881}});

(OLD_CARD_BUILDS["Jeremy Lin"] ||= []).push({"preset":25,"r":{"hgt":36,"stre":52,"spd":82,"acc":85,"jmp":66,"endu":78,"ins":35,"dnk":10,"lay":40,"ft":56,"fg":65,"tp":45,"oiq":55,"diq":50,"blk":23,"stl":94,"drb":69,"pss":74,"reb":42,"box":28},"pot":60,"ten":{"usage":45.5,"ftr":81.5,"ra":39.7,"paint":20.1,"mid":20.6,"c3":3.4,"atb":16.2,"cns":25,"pullup":70,"step":2,"fade":3,"turnovers":71.5,"fouls":57.5,"crash":53.22},"notes":"Full 35-game 2011–12 Knicks regular season, not the February hot streak. Zone attempt shares use the official NBA shot chart. Creation shares and individual finishing ratings are estimates; the engine blends finishing skills. Applying keeps the recipient’s identity, age, contract and history.","sources":["https://www.nba.com/stats/player/202391/shooting?Season=2011-12","https://www.basketball-reference.com/players/l/linje01.html","https://www.landofbasketball.com/nba_players_season_stats/2012/jeremy_lin_full.htm"]});

(OLD_CARD_BUILDS["Andrei Kirilenko"] ||= []).push({"preset":10,"r":{"hgt":60,"stre":54,"spd":84,"acc":70,"jmp":88,"endu":86,"ins":40,"dnk":44,"lay":44,"ft":48,"fg":15,"tp":31,"oiq":35,"diq":86,"blk":97,"stl":51,"drb":30,"pss":42,"reb":46,"box":52},"pot":75,"ten":{"usage":54.78368441311999,"ftr":90,"ra":58.60000000000001,"paint":7.600000000000001,"mid":18.000000000000004,"c3":3.95,"atb":11.850000000000001,"cns":65.6,"pullup":19,"step":10.9,"fade":4.5,"turnovers":40.43191467148388,"fouls":84.00145073670595,"crash":77.41183753849671}});

(OLD_CARD_BUILDS["Joel Embiid"] ||= []).push({"preset":21,"r":{"hgt":70,"stre":95,"spd":60,"acc":71,"jmp":62,"endu":65,"ins":80,"dnk":64,"lay":70,"ft":67,"fg":66,"tp":53,"oiq":80,"diq":73,"blk":48,"stl":32,"drb":60,"pss":60,"reb":83,"box":68},"pot":69,"ten":{"usage":64.96221363581,"ftr":88,"ra":46.97831596733315,"paint":20.3323007603492,"mid":17.764010137989303,"c3":5.751729159082635,"atb":9.17364397524572,"cns":56.2,"pullup":25.6,"step":4.3,"fade":13.9,"turnovers":66.93864689207547,"fouls":63.13832287967018,"crash":2}});

// Prior builds from before rim access depended on the matchup.
(OLD_CARD_BUILDS["Ben Simmons"] ||= []).push({"preset":2,"r":{"hgt":64,"stre":72,"spd":86,"acc":68,"jmp":70,"endu":72,"ins":64,"dnk":64,"lay":64,"ft":21,"fg":40,"tp":6,"oiq":42,"diq":66,"blk":52,"stl":51,"drb":63,"pss":79,"reb":64,"box":78},"pot":69,"ten":{"usage":42.38873013776312,"ftr":68.9287413032303,"ra":81.1529933481153,"paint":12.022665681202266,"mid":6.011332840601133,"c3":0.16260162601626016,"atb":0.6504065040650406,"cns":12.6,"pullup":44,"step":28.5,"fade":14.9,"turnovers":52.045257920271254,"fouls":70.40145967613746,"crash":67.42399932738901}});
(OLD_CARD_BUILDS["Joel Embiid"] ||= []).push({"preset":21,"r":{"hgt":70,"stre":95,"spd":60,"acc":71,"jmp":62,"endu":65,"ins":80,"dnk":64,"lay":50,"ft":67,"fg":66,"tp":53,"oiq":80,"diq":73,"blk":48,"stl":32,"drb":60,"pss":60,"reb":83,"box":68},"pot":69,"ten":{"usage":64.96221363581,"ftr":88,"ra":46.97831596733315,"paint":20.3323007603492,"mid":17.764010137989303,"c3":5.751729159082635,"atb":9.17364397524572,"cns":56.2,"pullup":25.6,"step":4.3,"fade":13.9,"turnovers":66.93864689207547,"fouls":63.13832287967018,"crash":2}});
