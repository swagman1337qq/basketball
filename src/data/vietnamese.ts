// Vietnamese names: family name + middle name(s) + given name, written in that order
// (Nguyễn Văn Hùng). Three parts is the norm, four (two middle names) is common, and a bare
// two-part name is rare. Players are listed without diacritics (as on a jersey), with the
// full Vietnamese spelling as the native name.
// Surname shares: the commonly cited distribution (Wikipedia, "Vietnamese name"): Nguyễn
// 38.4%, Trần 12.1, Lê 9.5, Phạm 7.0, Hoàng/Huỳnh 5.1, Phan 4.5, Vũ/Võ 3.9, Đặng 2.1,
// Bùi 2.0, Đỗ 1.4, Hồ 1.3, Ngô 1.3, Dương 1.0, Lý 0.5; the rest share what's left.
// Entries are "Latin|Vietnamese|weight".
export const VN_SURNAMES = [
  'Nguyen|Nguyễn|38.4', 'Tran|Trần|12.1', 'Le|Lê|9.5', 'Pham|Phạm|7.0', 'Hoang|Hoàng|3.1', 'Huynh|Huỳnh|2.0', 'Phan|Phan|4.5',
  'Vu|Vũ|2.2', 'Vo|Võ|1.7', 'Dang|Đặng|2.1', 'Bui|Bùi|2.0', 'Do|Đỗ|1.4', 'Ho|Hồ|1.3', 'Ngo|Ngô|1.3', 'Duong|Dương|1.0', 'Ly|Lý|0.5',
  'Dinh|Đinh|0.4', 'Truong|Trương|0.4', 'Lam|Lâm|0.3', 'Mai|Mai|0.3', 'Cao|Cao|0.3', 'Ha|Hà|0.3', 'Luong|Lương|0.3', 'Doan|Đoàn|0.3',
  'Trinh|Trịnh|0.3', 'To|Tô|0.2', 'Luu|Lưu|0.2', 'Chau|Châu|0.2', 'Thai|Thái|0.2', 'Ta|Tạ|0.2', 'Quach|Quách|0.1', 'Kieu|Kiều|0.1', 'La|La|0.1', 'Tang|Tăng|0.1', 'Vuong|Vương|0.1', 'Tong|Tống|0.1',
];
// Male middle names: Văn is the classic (and most common), the rest are modern favorites.
export const VN_MIDDLE = [
  'Van|Văn|30', 'Minh|Minh|9', 'Duc|Đức|8', 'Quoc|Quốc|6', 'Thanh|Thành|6', 'Huu|Hữu|6', 'Hoang|Hoàng|5', 'Quang|Quang|5', 'Cong|Công|4',
  'Ngoc|Ngọc|4', 'Xuan|Xuân|3', 'Gia|Gia|4', 'Tuan|Tuấn|3', 'Anh|Anh|3', 'Dinh|Đình|3', 'Trong|Trọng|3', 'Bao|Bảo|3', 'Nhat|Nhật|3',
  'Thien|Thiên|2', 'Tien|Tiến|2', 'Manh|Mạnh|2', 'Hai|Hải|2', 'Tan|Tấn|2', 'Trung|Trung|2', 'Khanh|Khánh|2', 'Dang|Đăng|2', 'Viet|Việt|2', 'Phuoc|Phước|2',
];
export const VN_GIVEN = [
  'An|An', 'Bao|Bảo', 'Binh|Bình', 'Cuong|Cường', 'Dat|Đạt', 'Duc|Đức', 'Dung|Dũng', 'Duy|Duy', 'Hai|Hải', 'Hao|Hào', 'Hau|Hậu', 'Hieu|Hiếu',
  'Hoang|Hoàng', 'Hung|Hùng', 'Huy|Huy', 'Khang|Khang', 'Khanh|Khánh', 'Khoa|Khoa', 'Khoi|Khôi', 'Kien|Kiên', 'Lam|Lâm', 'Loc|Lộc', 'Long|Long',
  'Luan|Luân', 'Minh|Minh', 'Nam|Nam', 'Nghia|Nghĩa', 'Nhan|Nhân', 'Phat|Phát', 'Phong|Phong', 'Phuc|Phúc', 'Quan|Quân', 'Quang|Quang', 'Son|Sơn',
  'Tai|Tài', 'Tam|Tâm', 'Thai|Thái', 'Thang|Thắng', 'Thanh|Thành', 'Thien|Thiện', 'Thinh|Thịnh', 'Tien|Tiến', 'Toan|Toàn', 'Tri|Trí', 'Trung|Trung',
  'Truong|Trường', 'Tu|Tú', 'Tuan|Tuấn', 'Vinh|Vinh', 'Viet|Việt', 'Vu|Vũ', 'Hien|Hiển', 'Nhat|Nhật', 'Kha|Kha', 'Hiep|Hiệp', 'Sang|Sang', 'Tung|Tùng',
];

const parse = (a: string[]) => a.map(e => { const [lat, nat, w] = e.split('|'); return { lat, nat, w: +(w || 1) }; });
const SUR = parse(VN_SURNAMES), MID = parse(VN_MIDDLE), GIV = parse(VN_GIVEN);
const pickW = <T extends { w: number }>(a: T[], rnd: () => number): T => { let r = rnd() * a.reduce((t, x) => t + x.w, 0); for (const x of a) { if ((r -= x.w) < 0) return x; } return a[a.length - 1]; };

// A full Vietnamese name. About 3% have no middle name, about 15% have two: a second middle
// name, or the mother's family name placed before the middle name (Nguyễn Lê Minh Khôi).
export function vietnameseName(rnd: () => number) {
  const fam = pickW(SUR, rnd), giv = GIV[Math.floor(rnd() * GIV.length)], r = rnd();
  const mids: { lat: string; nat: string }[] = [];
  if (r >= 0.03) { let m = pickW(MID, rnd); for (let i = 0; m.lat === giv.lat && i < 5; i++) m = pickW(MID, rnd); mids.push(m); }
  if (r >= 0.85) {
    if (rnd() < 0.45) { let mom = pickW(SUR, rnd); for (let i = 0; mom.lat === fam.lat && i < 5; i++) mom = pickW(SUR, rnd); mids.unshift(mom); }
    else { let m2 = pickW(MID.filter(x => x.lat !== 'Van'), rnd); for (let i = 0; (m2.lat === mids[0].lat || m2.lat === giv.lat) && i < 5; i++) m2 = pickW(MID, rnd); mids.push(m2); }
  }
  const first = [...mids.map(x => x.lat), giv.lat].join(' '), nativeFirst = [...mids.map(x => x.nat), giv.nat].join(' ');
  return { first, last: fam.lat, nativeFirst, nativeLast: fam.nat };
}
export const VN_SURNAME_LIST = SUR.map(x => x.lat);
export const VN_SURNAME_WEIGHT = Object.fromEntries(SUR.map(x => [x.lat, x.w]));
export const VN_NATIVE = Object.fromEntries([...SUR, ...MID, ...GIV].map(x => [x.lat, x.nat]));
