// Thiệp cưới online: đọc toàn bộ nội dung từ window.THIEP (info/thong-tin.js) rồi dựng trang.
// Không có nội dung nào ghi cứng ở đây; đổi file thông tin và ảnh là ra thiệp mới.
(() => {
"use strict";
const T = window.THIEP;
const root = document.getElementById("thiep");
if (!T || !root) { if (root) root.innerHTML = '<p style="padding:40px 20px;text-align:center">Không đọc được file info/thong-tin.js. Kiểm tra lại dấu ngoặc kép và dấu phẩy trong file.</p>'; return; }

const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const G = window.gsap || null;
const ANIM = !!G && !RM;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const up = s => esc(String(s ?? "").toLocaleUpperCase("vi"));
const fmtAcc = s => { const v = String(s).replace(/\s/g, ""); return v.length > 10 ? v.replace(/(\d{4})(?=\d)/g, "$1 ") : v; };
const rng = seed => { let s = Math.floor(seed) % 2147483647; if (s <= 0) s += 2147483646; return () => (s = s * 16807 % 2147483647) / 2147483647; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const stamp = d => { const n = d ? new Date(d) : new Date(); return isNaN(n) ? "" : `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}, ${n.getDate()}/${n.getMonth() + 1}`; };

// ---------- Dữ liệu ----------
const params = new URLSearchParams(location.search);
const benQ = params.get("ben");
const BEN = benQ === "nha-gai" || benQ === "nha-trai" ? benQ : (T.benMacDinh === "nha-gai" ? "nha-gai" : "nha-trai");
const TO = (params.get("to") || "").trim().slice(0, 80);
const GUEST = TO || T.loiChaoMacDinh || "";
const norm = s => String(s).normalize("NFC").toLocaleLowerCase("vi");

// Nhóm khách theo cách gọi: xét 3 chữ đầu, gặp từ của nhóm nào trước (kinhMoi hay thanMoi) thì thuộc nhóm đó
function inviteGroup(name) {
  const groups = [T.kinhMoi, T.thanMoi].filter(g => g && g.chu);
  const words = norm(name).split(/[\s,.;:()\/-]+/).filter(Boolean).slice(0, 3);
  for (const w of words) for (const g of groups) if ((g.tu || []).some(t => norm(t) === w)) return g;
  return null;
}
const GROUP = inviteGroup(GUEST);
// Lời mời: theo nhóm; không thuộc nhóm nào thì kính mời
const INVITE_WORD = (GROUP && GROUP.chu) || (T.kinhMoi && T.kinhMoi.chu) || "Trân trọng kính mời";
// Gia đình tự xưng: theo nhóm (VD "cháu" với cô chú, "tôi" với bạn bè); không thuộc nhóm nào thì theo xungHo
const SELF = (GROUP && GROUP.xung) || T.xungHo || "chúng tôi";

// Tên gọi ngắn cho câu "Hẹn gặp ...": bỏ phần đi kèm ("và người thương", "và gia đình"...),
// chữ xưng hô đứng đầu viết thường. VD "Anh Tú và người thương" → "anh Tú". Link không có tên khách thì trả về "".
function shortGuest(name) {
  const s = String(name).split(/\s+(?:và|cùng|với)\s+|\s*[&+,;]\s*/iu)[0].trim();
  if (!s) return "";
  const [first, ...rest] = s.split(/\s+/);
  const lead = [...(T.kinhMoi?.tu || []), ...(T.thanMoi?.tu || []), "vợ", "gia", "cả", "các", "hai", "nhà"];
  const f = lead.some(t => norm(t) === norm(first)) ? first.toLocaleLowerCase("vi") : first;
  return [f, ...rest].join(" ");
}
const MEET = shortGuest(TO);

function model() {
  const gai = BEN === "nha-gai";
  const ev = (T.cacLe || []).filter(e => e && e.ten && (e.hienChoBen === "ca-hai" || e.hienChoBen === BEN || !e.hienChoBen)).map(e => {
    const home = e.taiNha === "nha-trai" ? T.nhaTrai : e.taiNha === "nha-gai" ? T.nhaGai : null;
    const addr = home ? home.diaChi : e.diaDiem;
    const [d = "", mo = "", y = ""] = String(e.ngayDuong || "").split("/");
    return { ...e, d, mo, y, addr,
      place: e.taiNha === "nha-trai" ? "Tư gia nhà trai" : e.taiNha === "nha-gai" ? "Tư gia nhà gái" : "",
      map: (home && home.banDo) || (addr ? "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(addr) : "") };
  });
  const groom = { ...T.chuRe, role: "Chú rể", script: "Chú Rể", photo: T.anhChuRe };
  const bride = { ...T.coDau, role: "Cô dâu", script: "Cô Dâu", photo: T.anhCoDau };
  const famT = { label: "Nhà Trai", ...T.nhaTrai }, famG = { label: "Nhà Gái", ...T.nhaGai };
  let target = 0, cdName = "";
  if (T.demNguocDen) {
    const [y, mo, d, h = 0, mi = 0] = String(T.demNguocDen).split(/[- :]/).map(Number);
    target = new Date(y, mo - 1, d, h, mi).getTime() || 0;
    const hit = ev.find(e => { const [dd, mm, yy] = e.ngayDuong.split("/").map(Number); const [hh, mn] = String(e.gio).split(":").map(Number); return dd === d && mm === mo && yy === y && hh === h && mn === mi; });
    cdName = hit ? hit.ten : "";
  }
  const gift = (gai ? T.mungCuoi?.nhaGai : T.mungCuoi?.nhaTrai) || null;
  const xh = T.xungHo || "chúng tôi", ban = xh === "chúng mình";
  const people = gai ? [bride, groom] : [groom, bride];
  const initials = String(T.logo || `${T.chuRe?.tenHienThi || ""} & ${T.coDau?.tenHienThi || ""}`).split("&").map(s => (s.trim().split(/\s+/).pop() || "")[0] || "");
  const album = (T.album || []).filter(Boolean);
  return { ev, main: ev[ev.length - 1] || null, people, fams: gai ? [famG, famT] : [famT, famG], gai,
    target, cdName, gift: gift && gift.anhQR ? gift : null, giftFor: gai ? "cô dâu" : "chú rể", xh, ban,
    // Cách gọi khách trong thiệp: tên ngắn của khách trên link (VD "bác Hùng"); không có tên thì "quý vị" (hoặc "bạn" khi xưng "chúng mình")
    pron: MEET || (ban ? "bạn" : "quý vị"), self: SELF,
    mono: initials.filter(Boolean).join(" & "), logo: T.logo || "", album,
    invite: T.loiMoi || "", api: String(T.luuTru || "").trim() };
}
const M = model();

// Chữ trang trí lấy từ chuTrenThiep; dấu / là xuống dòng, mục để "" thì ẩn
const C = T.chuTrenThiep || {};
const lines = k => String(C[k] ?? "").split("/").map(s => s.trim()).filter(Boolean);
const say = k => lines(k).map(esc).join("<br>");

// ---------- Hình vẽ nhỏ ----------
const SVG = {
  heart: `<svg viewBox="0 0 32 30" aria-hidden="true"><path d="M16 29C8 22.3 1 16.6 1 9.6 1 4.9 4.6 1.5 8.9 1.5c3 0 5.5 1.7 7.1 4.3 1.6-2.6 4.1-4.3 7.1-4.3 4.3 0 7.9 3.4 7.9 8.1 0 7-7 12.7-15 19.4Z"/></svg>`,
  ecg: `<svg class="at-ecg" viewBox="0 0 64 56" aria-hidden="true"><path d="M32 54C19 43 3 33 3 19 3 9.6 10 3 18.4 3c5.6 0 10.4 3 13.6 8 3.2-5 8-8 13.6-8C54 3 61 9.6 61 19c0 14-16 24-29 35Z" fill="#E86464"/><path d="M6 27h14l4-7 6 15 5-12 3 4h20" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  sprig: `<svg class="at-sprig" viewBox="0 0 230 56" fill="none" stroke="#7D6B5D" stroke-width="1" stroke-linecap="round" aria-hidden="true"><path d="M4 50C64 33 130 22 226 12"/><path d="M30 44C86 44 150 30 212 38"/><path d="M98 32q8-10 17-9-6 9-17 9Z"/><path d="M128 26q6-11 15-11-4 10-15 11Z"/><path d="M150 36q9 6 17 3-8-7-17-3Z"/><path d="M160 21q4-10 13-12-2 10-13 12Z"/><path d="M186 35q8-8 16-6-6 8-16 6Z"/><g stroke-width=".9"><circle cx="190" cy="15" r="3.2"/><circle cx="196" cy="11.5" r="2.4"/><circle cx="203" cy="31" r="3"/><circle cx="209" cy="27" r="2.2"/><circle cx="214" cy="12" r="2.6"/><circle cx="176" cy="40" r="2.4"/></g></svg>`,
  flourish: `<svg viewBox="0 0 300 32" fill="none" stroke="#2A2A2A" stroke-width="1.2" stroke-linecap="round" aria-hidden="true"><path d="M4 22C52 32 104 28 140 19"/><path d="M150 25C140 17 141 7 149.5 11.5 158 7 160 17 150 25Z"/><path d="M160 19C200 9 252 10 296 20"/></svg>`,
  qr: `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3"><rect x="5" y="5" width="26" height="26" rx="3"/><rect x="69" y="5" width="26" height="26" rx="3"/><rect x="5" y="69" width="26" height="26" rx="3"/></g><g fill="currentColor"><rect x="12" y="12" width="12" height="12" rx="1.5"/><rect x="76" y="12" width="12" height="12" rx="1.5"/><rect x="12" y="76" width="12" height="12" rx="1.5"/></g></svg>`,
  ext: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>`,
  left: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>`,
  right: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`,
  menu: `<svg class="mn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path class="b1" d="M5 7h14"/><path class="b2" d="M5 12h14"/><path class="b3" d="M5 17h14"/></svg>`,
  gift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10.5C9.3 8.3 7.5 6.9 7.5 5.2 7.5 4 8.4 3.1 9.6 3.1c1 0 1.8.6 2.4 1.5.6-.9 1.4-1.5 2.4-1.5 1.2 0 2.1.9 2.1 2.1 0 1.7-1.8 3.1-4.5 5.3Z"/><path d="M3 14.5h3l3.2 1.4h4.3a1.5 1.5 0 0 1 0 3H9.8"/><path d="M13.6 18.9l5-2.5a1.6 1.6 0 0 1 2 2.4L15 21H8.4L3 19"/></svg>`,
  wish: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H5v18h14V9"/><path d="M8 8h5M8 12h6M8 16h4"/><path d="M15.5 13.5l6-6-2-2-6 6-.6 2.6Z"/></svg>`,
  rsvp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="10" cy="10" r="2.6"/><path d="M5.5 18c.7-2.4 2.4-3.6 4.5-3.6s3.8 1.2 4.5 3.6"/><path d="M15 8.5l1.6 1.6 3-3"/></svg>`,
  letter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5V20h18V9.5"/><path d="M3 9.5l9 6.5 9-6.5"/><path d="M6 11.6V4h12v7.6"/><path d="M12 11c-1.8-1.4-3-2.3-3-3.5 0-.8.6-1.4 1.4-1.4.7 0 1.2.4 1.6 1 .4-.6.9-1 1.6-1 .8 0 1.4.6 1.4 1.4 0 1.2-1.2 2.1-3 3.5Z"/></svg>`,
  music: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>`,
};
const ICONS = {
  rings: `<svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="31" cy="50" r="16"/><circle cx="49" cy="50" r="16"/><path d="M25 32l6-8 6 8-6 6Z"/><path d="M25 32h12M31 24v14"/><path d="M14 22l-4-4M18 15v-5M47 20l5-5M53 27h6M58 34l4 2"/></svg>`,
  dinner: `<svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 44h60a30 22 0 0 1-60 0Z"/><path d="M15 44c5-10 15-14 25-14s20 4 25 14"/><path d="M29 38h3M39 35h3M48 39h3M34 41h2"/><path d="M30 66h20"/><path d="M52 10l18 25M60 7l16 25"/><path d="M24 25c-4-5 4-8 0-13M34 22c-4-5 4-8 0-13"/></svg>`,
  gift: `<svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 63h70M11 63c2 7 56 7 58 0"/><path d="M20 37h40v26H20Z"/><path d="M16 29h48v8H16Z"/><path d="M40 29v34"/><path d="M40 29c-9-14-22-11-15-1 3 3 10 2 15 1ZM40 29c9-14 22-11 15-1-3 3-10 2-15 1Z"/><path d="M27 47h6M47 53h6"/></svg>`,
  heart: `<svg viewBox="0 0 80 80" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M40 66C24 53 10 43 10 28c0-9 7-15 15-15 6 0 11 3 15 9 4-6 9-9 15-9 8 0 15 6 15 15 0 15-14 25-30 38Z"/></svg>`,
};
const iconFor = name => /nạp tài|ăn hỏi|dạm ngõ|lễ vật/i.test(name) ? ICONS.gift : /cơm|tiệc|đón khách/i.test(name) ? ICONS.dinner : /thành hôn|vu quy|cưới/i.test(name) ? ICONS.rings : ICONS.heart;
const MONTHS = ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"];
const lunar = e => e.ngayAm ? `(Tức ngày ${esc(e.ngayAm)})` : "";
// Khung ảnh: luôn vẽ nền và chữ lồng; ảnh thật (nếu có) tải sau và phủ lên
const ph = (src, cls = "", alt = "", extra = "") => `<div class="ph ${cls}" data-src="${esc(src || "")}" data-alt="${esc(alt)}" data-mono="${esc(M.mono)}"${extra}></div>`;

// ---------- Dựng trang ----------
function html() {
  const mn = M.main, A = M.album, [p0, p1] = M.people;
  const parts = [];
  const pick = (own, i) => own || (A.length ? A[((i % A.length) + A.length) % A.length] : T.anhBia || "");

  // 1. Ảnh bìa
  parts.push(`<section class="at-hero" data-hero>
    ${ph(T.anhBia, "", `Ảnh cưới ${M.logo}`)}
    ${say("bia") ? `<h1 class="at-std sig" data-fit>${say("bia")}</h1>` : ""}
    <p class="at-hnames cond" data-fit><span>${esc(p0.tenHienThi)}</span><em>&amp;</em><span>${esc(p1.tenHienThi)}</span></p>
    ${mn ? `<p class="at-hdate cond">${mn.d}.${mn.mo}.${mn.y}</p>` : ""}
  </section>`);

  // 2. Hai trái tim, thẻ chú rể cô dâu
  const card = (p, side, i) => `<button class="at-pc" type="button" data-rv="${side}" data-zoomp="${i}" aria-label="Xem ảnh ${p.role.toLowerCase()} lớn hơn">
    ${ph(p.photo, "", `${p.role} ${p.tenHienThi}`)}<span class="at-pcap"><span class="r">${p.script}</span><span class="n">${esc(p.tenHienThi)}</span></span></button>`;
  parts.push(`<section class="at-hearts" data-hearts>
    ${ph(pick("", 2), "", "", ' aria-hidden="true"')}
    <div class="at-hin">
      ${say("haiTraiTim") ? `<h2 class="at-two cond" data-rv>${say("haiTraiTim")}</h2>` : ""}
      <svg class="at-heart" viewBox="0 0 32 30" aria-hidden="true" data-rv="z"><path d="M16 29C8 22.3 1 16.6 1 9.6 1 4.9 4.6 1.5 8.9 1.5c3 0 5.5 1.7 7.1 4.3 1.6-2.6 4.1-4.3 7.1-4.3 4.3 0 7.9 3.4 7.9 8.1 0 7-7 12.7-15 19.4Z"/></svg>
      ${say("haiTraiTimPhu") ? `<p class="at-soul" data-rv>${say("haiTraiTimPhu")}</p>` : ""}
    </div>
    <div class="at-cards">${card(p0, "l", 0)}<span data-rv="z">${SVG.ecg}</span>${card(p1, "r", 1)}</div>
  </section>`);

  // 3. Thiệp mời
  const fam = f => `<div class="at-fm"><h3>${f.label}</h3>${f.ong ? `<p class="p"><i>Ông</i>${esc(f.ong)}</p>` : ""}${f.ba ? `<p class="p"><i>Bà</i>${esc(f.ba)}</p>` : ""}${f.diaChi ? `<p class="ad">${esc(f.diaChi)}</p>` : ""}</div>`;
  const hand = M.invite || `Sự hiện diện của ${M.pron} là niềm vinh hạnh cho gia đình ${M.self}`;
  parts.push(`<section class="at-inv" data-sec="invite">
    <div class="at-paper" data-rv>
      <i class="at-br tl"></i><i class="at-br br"></i>
      <div class="at-fam">${fam(M.fams[0])}<span class="at-fsep" aria-hidden="true"><i></i>${SVG.heart}<i></i></span>${fam(M.fams[1])}</div>
      <p class="at-kinh cond">${esc(INVITE_WORD)}</p>
      ${GUEST ? `<p class="at-guest">${esc(GUEST)}</p>` : ""}
      ${mn ? `<p class="at-tham">Đến tham dự ${up(mn.ten)}<br>cùng gia đình ${up(M.self)}</p>` : ""}
      <div class="at-inames"><span class="n cond">${esc(p0.tenHienThi)}</span><span class="a">và</span><span class="n cond">${esc(p1.tenHienThi)}</span></div>
      ${mn ? `<p class="at-when">Được tổ chức vào lúc</p>
      <p class="at-time">${esc(mn.gio)} | ${up(mn.thu)} | ${mn.d}.${mn.mo}.${mn.y}</p>
      ${mn.ngayAm ? `<p class="at-lunar">${lunar(mn)}</p>` : ""}
      ${mn.place ? `<p class="at-place">Tại ${esc(mn.place.toLowerCase())}</p>` : ""}
      ${mn.addr ? `<p class="at-addr">${esc(mn.addr)}</p>` : ""}` : ""}
      <p class="at-hand">${esc(hand)}</p>
      ${SVG.sprig}
    </div>
  </section>`);

  // 4. Bản đồ nơi tổ chức lễ chính
  if (mn && mn.addr) parts.push(`<section class="at-map" data-rv>
    <iframe data-map="${esc("https://maps.google.com/maps?q=" + encodeURIComponent(mn.addr) + "&z=15&output=embed")}" title="Bản đồ đường đến ${esc(mn.place || "nơi tổ chức")}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    <div class="at-mcard"><b>${esc(mn.place || "Nơi tổ chức")}</b><span>${esc(mn.addr)}</span>${mn.map ? `<a class="at-mbtn" href="${esc(mn.map)}" target="_blank" rel="noopener">${SVG.ext}Mở trong Google Maps</a>` : ""}</div>
  </section>`);

  // 5. Ảnh "Về chung một nhà": trước dấu / chữ viết tay, sau dấu / chữ in
  const [jm1, ...jm2] = lines("vuaCuoi");
  parts.push(`<section class="at-jm" data-rv="k">${ph(pick(T.anhJustMarried, 2), "", "Ảnh cưới")}
    ${jm1 ? `<p class="at-jmt"><span class="j" data-rv="w" data-fit=".78">${esc(jm1)}</span>${jm2.length ? `<span class="m" data-rv style="--d:.4s">${jm2.map(esc).join("<br>")}</span>` : ""}</p>` : ""}</section>`);

  // 6. Lịch tháng và 7. đếm ngược
  if (mn) {
    const d0 = Number(mn.d), mo = Number(mn.mo), y = Number(mn.y);
    const lead = (new Date(y, mo - 1, 1).getDay() + 6) % 7, days = new Date(y, mo, 0).getDate();
    const others = M.ev.filter(e => Number(e.mo) === mo && Number(e.y) === y && Number(e.d) !== d0);
    const evDays = new Set(others.map(e => Number(e.d))), names = [...new Set(others.map(e => e.ten))];
    let grid = lead >= 2 ? `<span class="fl" style="--n:${lead}">${SVG.flourish}</span>` : "<span></span>".repeat(lead);
    for (let d = 1; d <= days; d++) grid += `<span class="d${d === d0 ? " mn" : ""}${evDays.has(d) ? " ev" : ""}" style="--i:${d}">${d === d0 ? SVG.heart : ""}<span>${d}</span></span>`;
    parts.push(`<section class="at-cal">
      <p class="at-year cond" data-rv>${y}</p>
      <p class="at-month sig" data-rv="w" data-fit style="--d:.3s">${MONTHS[mo - 1] || ""}</p>
      <div class="at-grid"><div class="at-wk">${["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map(w => `<span>${w}</span>`).join("")}</div><div class="at-days" data-rv>${grid}</div></div>
      <p class="at-key"><span><i class="h"></i>${esc(mn.ten)}</span>${names.length ? `<span><i class="o"></i>${names.map(esc).join(", ")}</span>` : ""}</p>
    </section>`);
  }
  if (M.target) parts.push(`<section class="at-cd">
    ${say("demNguoc") ? `<p class="at-cdq" data-rv>${say("demNguoc")}</p>` : ""}
    <div class="at-cdn" data-rv><div class="u"><b data-cd="d">0</b><span>Ngày</span></div><i>:</i><div class="u"><b data-cd="h">00</b><span>Giờ</span></div><i>:</i><div class="u"><b data-cd="m">00</b><span>Phút</span></div><i>:</i><div class="u"><b data-cd="s">00</b><span>Giây</span></div></div>
    ${M.cdName ? `<p class="at-cdw" data-rv>Đếm ngược đến ${esc(M.cdName)}</p>` : ""}
  </section>`);

  // 8. Lịch trình
  if (M.ev.length) parts.push(`<section class="at-tl">${ph(pick(T.anhLichTrinh, 1), "", "", ' aria-hidden="true"')}
    ${say("lichTrinh") ? `<h2 class="at-tlt sig" data-rv="w">${say("lichTrinh")}</h2>` : ""}
    ${M.ev.map(e => `<div class="at-tli" data-rv>${iconFor(e.ten)}<span class="ln"></span><div class="tx"><span class="tm">${esc(String(e.gio).replace(":", " : "))}</span><span class="nm">${esc(e.ten)}</span><span class="mt">${esc(e.thu)} ${Number(e.d)}.${Number(e.mo)}${e.place ? `<br>${esc(e.place)}` : ""}</span></div></div>`).join("")}
  </section>`);

  // 9. Album
  if (A.length) parts.push(`<section class="at-gal">
    <div class="at-trio" data-trio>${A.map((p, i) => `<button class="at-tri" type="button" data-i="${i}" data-pos="h" aria-label="Ảnh cưới ${i + 1}">${ph(p, "", `Ảnh cưới ${i + 1}`)}</button>`).join("")}</div>
    ${say("album") ? `<h2 class="at-mem sig" data-rv="w">${say("album")}</h2>` : ""}
    <div class="at-sl" data-sl aria-roledescription="trình chiếu" aria-label="Ảnh cưới">
      <div class="at-sltr">${A.map((p, i) => `<div class="at-sli" data-i="${i}" role="group" aria-label="Ảnh ${i + 1} trên ${A.length}">${ph(p, "bg", "", ' aria-hidden="true"')}${ph(p, "fg", `Ảnh cưới ${i + 1}`)}</div>`).join("")}</div>
      ${A.length > 1 ? `<button class="at-nav l" type="button" data-go="-1" aria-label="Ảnh trước">${SVG.left}</button><button class="at-nav r" type="button" data-go="1" aria-label="Ảnh sau">${SVG.right}</button><div class="at-dots">${A.map((_, i) => `<button type="button" data-dot="${i}" aria-label="Ảnh ${i + 1}"></button>`).join("")}</div>` : ""}
    </div>
  </section>`);

  // 10. Xác nhận tham dự
  if (T.xacNhanThamDu) {
    const evOpts = M.ev.map(e => `<option>${esc(e.ten)} (${Number(e.d)}/${Number(e.mo)})</option>`).join("") + (M.ev.length > 1 ? "<option>Tất cả các lễ</option>" : "");
    parts.push(`<section class="at-rsvp" data-sec="rsvp">
      ${say("xacNhan") ? `<h2 class="at-sigt sig" data-rv="w">${say("xacNhan")}</h2>` : ""}
      <p class="at-intro" data-rv>Hãy xác nhận sự có mặt của ${esc(M.pron)} để gia đình ${esc(M.self)} chuẩn bị đón tiếp một cách chu đáo nhất. Trân trọng!</p>
      ${T.hanXacNhan ? `<p class="at-cdw" data-rv>Xin báo giúp trước ngày ${esc(T.hanXacNhan)}</p>` : ""}
      <form class="at-form" data-rsvp data-rv novalidate>
        <div class="at-row2"><input class="at-in" id="r-name" name="ten" autocomplete="name" maxlength="80" placeholder="Họ và tên *" aria-label="Họ và tên"><input class="at-in" id="r-phone" name="sdt" type="tel" autocomplete="tel" maxlength="20" placeholder="Số điện thoại" aria-label="Số điện thoại"></div>
        <div class="at-radio" role="radiogroup" aria-label="Bạn sẽ tham dự chứ?"><label><input type="radio" name="r-come" value="Có" checked>Có, tôi sẽ tham dự</label><label><input type="radio" name="r-come" value="Không">Xin lỗi, tôi bận mất rồi</label></div>
        <input class="at-in" id="r-num" type="number" inputmode="numeric" min="1" max="20" placeholder="Số người tham dự" aria-label="Số người tham dự">
        <select class="at-in" id="r-of" aria-label="Bạn là khách của?"><option value="">Bạn là khách của?</option><option${!M.gai ? " selected" : ""}>Chú rể</option><option${M.gai ? " selected" : ""}>Cô dâu</option><option>Cả chú rể và cô dâu</option></select>
        ${M.ev.length ? `<select class="at-in" id="r-ev" aria-label="Bạn sẽ tham gia sự kiện nào?"><option value="">Bạn sẽ tham gia sự kiện nào?</option>${evOpts}</select>` : ""}
        <button class="at-ok" type="submit">Xác nhận</button>
        ${M.gift ? `<button class="at-gift" type="button" data-gift>${SVG.gift}<span>Gửi quà mừng cưới</span></button>` : ""}
        <p class="at-msg" role="status"></p>
      </form>
    </section>`);
  }

  // 11. Lời chúc
  if (T.soLoiChuc) parts.push(`<section class="at-wish" data-sec="wish">
    ${say("loiChuc") ? `<h2 class="at-sigt sig" data-rv="w">${say("loiChuc")}</h2>` : ""}
    <form class="at-form" data-wishf data-rv novalidate>
      <input class="at-in" id="w-name" autocomplete="name" maxlength="80" placeholder="Tên của bạn *" aria-label="Tên của bạn">
      <textarea class="at-in" id="w-text" maxlength="600" placeholder="Lời chúc của bạn *" aria-label="Lời chúc của bạn"></textarea>
      <button class="at-ok" type="submit">Gửi lời chúc mừng</button>
      <p class="at-msg" role="status"></p>
    </form>
    <div class="at-wl" data-wl data-rv><p class="at-wempty" data-empty>Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc tới cô dâu chú rể!</p></div>
  </section>`);

  // 12. Câu thơ "Có nhau…" trên nền trắng (phần đầu viết tay, các phần sau từng dòng), rồi ảnh cảm ơn
  const [vs1, ...vs2] = lines("coNhau");
  if (vs1) parts.push(`<section class="at-vs" data-rv>
    <p class="s sig">${esc(vs1)}</p>${vs2.length ? `<p class="p">${vs2.map(esc).join("<br>")}</p>` : ""}${SVG.heart}
  </section>`);
  parts.push(`<section class="at-ty">${ph(pick(T.anhCamOn, A.length - 1), "", "Ảnh cưới")}
    ${say("camOn") ? `<p class="at-tyt sig" data-rv="w" data-fit>${say("camOn")}</p>` : ""}
  </section>
  <footer class="at-end"><p class="h" data-rv>Hẹn gặp ${esc(M.pron)} trong ngày vui</p><p class="n cond" data-rv>${esc(p0.tenHienThi)} &amp; ${esc(p1.tenHienThi)}</p>${mn ? `<p class="d" data-rv>${mn.d} . ${mn.mo} . ${mn.y}</p>` : ""}</footer>`);

  return `<div class="at-col">${parts.join("")}</div>`;
}

// ---------- Ảnh: tải dần, lỗi thì giữ khung ----------
function loadSlots(scope) {
  const load = el => {
    if (el.dataset.loaded) return; el.dataset.loaded = "1";
    const path = el.dataset.src; if (!path) return;
    const img = new Image(); img.decoding = "async"; img.alt = el.dataset.alt || "";
    if (el.closest(".at-hero")) img.fetchPriority = "high";
    img.onload = () => { if (el.classList.contains("qr")) { el.replaceChildren(img); return; } el.appendChild(img); requestAnimationFrame(() => requestAnimationFrame(() => img.classList.add("ok"))); };
    img.src = path;
  };
  const slots = $$(".ph[data-src]", scope);
  if (!("IntersectionObserver" in window)) { slots.forEach(load); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: "900px 0px" });
  slots.forEach(el => el.closest(".at-hero") ? load(el) : io.observe(el));
}

// Chữ lớn (chữ viết tay, tên trên ảnh bìa) luôn nằm trên một dòng; dài quá khung thì tự thu nhỏ cho vừa.
// data-fit = phần bề ngang khung được dùng (mặc định .92)
function fitText() {
  const els = $$("[data-fit]", root); if (!els.length) return;
  const run = () => els.forEach(el => {
    el.style.fontSize = ""; el.style.width = "max-content";
    const room = (el.closest("section") || root).clientWidth * (Number(el.dataset.fit) || .92), w = el.offsetWidth;
    el.style.width = "";
    if (w > room) el.style.fontSize = `${parseFloat(getComputedStyle(el).fontSize) * room / w}px`;
  });
  run();
  if (document.fonts) document.fonts.ready.then(run);
  let t = 0; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(run, 150); });
}

function reveals() {
  $$('[data-rv="w"]', root).forEach(el => { const s = document.createElement("span"); s.className = "w-in"; while (el.firstChild) s.appendChild(el.firstChild); el.appendChild(s); });
  if (!ANIM || !("IntersectionObserver" in window)) return;
  root.classList.add("rv-on");
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .12 });
  $$("[data-rv]", root).forEach(el => io.observe(el));
}

function hero() {
  const h = $("[data-hero]", root); if (!h || !ANIM) return;
  const tl = G.timeline({ delay: .15 });
  const std = $(".at-std", h), date = $(".at-hdate", h);
  if (std) tl.fromTo(std, { clipPath: "inset(-40% 120% -50% -20%)" }, { clipPath: "inset(-40% -20% -50% -20%)", duration: 2, ease: "power2.inOut" }, .2);
  tl.fromTo($$(".at-hnames > *", h), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1.1, ease: "expo.out", stagger: .14 }, 1.1);
  if (date) tl.fromTo(date, { opacity: 0, y: 14, letterSpacing: ".3em" }, { opacity: 1, y: 0, letterSpacing: ".06em", duration: 1.4, ease: "expo.out" }, 1.6);
  const box = $(".ph", h);
  const zoom = i => G.fromTo(i, { scale: 1.14 }, { scale: 1, duration: 3.2, ease: "power2.out" });
  const mo = new MutationObserver(() => { const i = $("img", box); if (i) { mo.disconnect(); zoom(i); } }); mo.observe(box, { childList: true });
}

function flares() {
  const s = $("[data-hearts]", root); if (!s) return;
  const r = rng(8);
  for (let i = 0; i < 16; i++) {
    const f = document.createElement("i"); f.className = "at-flare";
    f.style.cssText = `left:${(r() * 100).toFixed(1)}%;top:${(r() * 100).toFixed(1)}%;width:${(50 + r() * 120).toFixed(0)}px;--t:${(7 + r() * 6).toFixed(1)}s;--dl:${(-r() * 12).toFixed(1)}s`;
    s.insertBefore(f, s.children[1]);
  }
}

function countdown() {
  if (!M.target) return;
  const els = { d: $$('[data-cd="d"]'), h: $$('[data-cd="h"]'), m: $$('[data-cd="m"]'), s: $$('[data-cd="s"]') };
  const tick = () => {
    const s = Math.max(0, Math.floor((M.target - Date.now()) / 1000));
    const v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
    for (const k in v) els[k].forEach(e => e.textContent = k === "d" ? v.d : String(v[k]).padStart(2, "0"));
  };
  tick(); setInterval(tick, 1000);
}

// ---------- Hạt trắng rơi ----------
function snow() {
  if (RM) return;
  const cv = $("#tuyet"); if (!cv) return;
  const ctx = cv.getContext("2d"); let W = 0, H = 0, fl = [], id = 0;
  const size = () => { const d = Math.min(2, window.devicePixelRatio || 1); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const spawn = top => ({ x: Math.random() * W, y: top ? -10 : Math.random() * H, r: 1.2 + Math.random() * 2.6, vy: .35 + Math.random() * .7, sw: 8 + Math.random() * 18, ph: Math.random() * 6.28, ps: .006 + Math.random() * .012, a: .55 + Math.random() * .4 });
  const frame = () => {
    ctx.clearRect(0, 0, W, H); ctx.fillStyle = "#fff"; ctx.shadowColor = "rgba(0,0,0,.18)"; ctx.shadowBlur = 3;
    for (const f of fl) { f.y += f.vy; f.ph += f.ps; if (f.y > H + 10) Object.assign(f, spawn(true)); ctx.globalAlpha = f.a; ctx.beginPath(); ctx.arc(f.x + Math.sin(f.ph) * f.sw, f.y, f.r, 0, 6.283); ctx.fill(); }
    id = requestAnimationFrame(frame);
  };
  size(); fl = Array.from({ length: Math.min(70, Math.round(W * H / 14000) + 8) }, () => spawn(false));
  id = requestAnimationFrame(frame);
  addEventListener("resize", size);
  document.addEventListener("visibilitychange", () => { cancelAnimationFrame(id); if (!document.hidden) id = requestAnimationFrame(frame); });
}

// ---------- Album ----------
function lightbox(list, start) {
  list = list.filter(Boolean); if (!list.length) return;
  let i = clamp(start, 0, list.length - 1);
  const back = document.activeElement;
  const el = document.createElement("div"); el.className = "lb"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Xem ảnh");
  el.innerHTML = `<div class="lb-top"><span data-n></span><button class="lb-x" type="button" aria-label="Đóng">${SVG.x}</button></div><div class="lb-img"><img alt=""></div>${list.length > 1 ? `<div class="lb-nav"><button type="button" data-d="-1" aria-label="Ảnh trước">${SVG.left}</button><button type="button" data-d="1" aria-label="Ảnh sau">${SVG.right}</button></div>` : "<div></div>"}`;
  const img = $("img", el), n = $("[data-n]", el);
  const show = () => { img.src = list[i]; img.alt = `Ảnh cưới ${i + 1}`; n.textContent = `${i + 1} / ${list.length}`; if (ANIM) G.fromTo(img, { opacity: 0, scale: .97 }, { opacity: 1, scale: 1, duration: .35, ease: "power2.out" }); };
  const go = d => { i = (i + d + list.length) % list.length; show(); };
  const close = () => { el.classList.remove("on"); document.removeEventListener("keydown", key); document.documentElement.classList.remove("no-scroll"); setTimeout(() => el.remove(), 250); if (back && back.focus) back.focus({ preventScroll: true }); };
  const key = e => { if (e.key === "Escape") close(); if (e.key === "ArrowLeft") go(-1); if (e.key === "ArrowRight") go(1); };
  $(".lb-x", el).addEventListener("click", close);
  $$("[data-d]", el).forEach(b => b.addEventListener("click", () => go(Number(b.dataset.d))));
  let sx = null; el.addEventListener("pointerdown", e => { sx = e.clientX; }); el.addEventListener("pointerup", e => { if (sx !== null && Math.abs(e.clientX - sx) > 50) go(e.clientX < sx ? 1 : -1); sx = null; });
  document.addEventListener("keydown", key);
  document.documentElement.classList.add("no-scroll");
  document.body.appendChild(el); show(); requestAnimationFrame(() => el.classList.add("on")); $(".lb-x", el).focus();
}

function trio() {
  const box = $("[data-trio]", root); if (!box) return;
  const items = $$(".at-tri", box), n = items.length; let cur = 0, hold = 0;
  const lay = () => items.forEach((el, i) => { const k = ((i - cur) % n + n) % n; el.dataset.pos = k === 0 ? "c" : k === 1 ? "r" : k === n - 1 ? "l" : "h"; });
  lay();
  items.forEach((el, i) => el.addEventListener("click", () => { hold = Date.now(); if (el.dataset.pos === "c") lightbox(M.album, i); else { cur = i; lay(); } }));
  if (ANIM && n > 2) setInterval(() => { if (Date.now() - hold > 6000 && !$(".lb") && !document.hidden) { cur = (cur + 1) % n; lay(); } }, 3200);
}

function slider() {
  const sl = $("[data-sl]", root); if (!sl) return;
  const tr = $(".at-sltr", sl), n = $$(".at-sli", sl).length, dots = $$("[data-dot]", sl); let cur = 0, hold = 0;
  const go = i => { cur = (i + n) % n; tr.style.transform = `translateX(${-cur * 100}%)`; dots.forEach((b, k) => b.setAttribute("aria-current", k === cur)); };
  go(0);
  $$("[data-go]", sl).forEach(b => b.addEventListener("click", e => { e.stopPropagation(); hold = Date.now(); go(cur + Number(b.dataset.go)); }));
  dots.forEach(b => b.addEventListener("click", e => { e.stopPropagation(); hold = Date.now(); go(Number(b.dataset.dot)); }));
  let sx = null, dx = 0;
  sl.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; sx = e.clientX; dx = 0; tr.style.transition = "none"; sl.setPointerCapture(e.pointerId); });
  sl.addEventListener("pointermove", e => { if (sx === null) return; dx = e.clientX - sx; tr.style.transform = `translateX(calc(${-cur * 100}% + ${dx}px))`; });
  const end = () => { if (sx === null) return; sx = null; tr.style.transition = ""; hold = Date.now(); if (Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); else { go(cur); if (Math.abs(dx) < 6) lightbox(M.album, cur); } };
  sl.addEventListener("pointerup", end); sl.addEventListener("pointercancel", () => { sx = null; tr.style.transition = ""; go(cur); });
  if (ANIM && n > 1) setInterval(() => { if (Date.now() - hold > 7000 && !$(".lb") && !document.hidden) go(cur + 1); }, 4500);
}

// ---------- Thông báo, mừng cưới, menu nhanh ----------
function toast(title, text, ms = 5000) {
  $$(".at-toast").forEach(t => t.remove());
  const t = document.createElement("div"); t.className = "at-toast"; t.setAttribute("role", "status");
  t.innerHTML = `<svg viewBox="0 0 32 30" fill="currentColor" aria-hidden="true"><path d="M16 29C8 22.3 1 16.6 1 9.6 1 4.9 4.6 1.5 8.9 1.5c3 0 5.5 1.7 7.1 4.3 1.6-2.6 4.1-4.3 7.1-4.3 4.3 0 7.9 3.4 7.9 8.1 0 7-7 12.7-15 19.4Z"/></svg><b></b><p></p><button class="cl" type="button" aria-label="Đóng thông báo">×</button><i style="animation-duration:${ms}ms"></i>`;
  $("b", t).textContent = title; $("p", t).textContent = text;
  document.body.appendChild(t); requestAnimationFrame(() => t.classList.add("on"));
  const close = () => { t.classList.remove("on"); setTimeout(() => t.remove(), 400); };
  $(".cl", t).addEventListener("click", close); setTimeout(close, ms);
}

function copyText(btn, text, accEl) {
  const orig = btn.textContent;
  const done = t => { btn.textContent = t; setTimeout(() => { btn.textContent = orig; }, 1800); };
  const fallback = () => { if (accEl) { const r = document.createRange(); r.selectNodeContents(accEl); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } done("Đã chọn số, bấm Sao chép"); };
  try { navigator.clipboard.writeText(text).then(() => done("Đã chép số tài khoản"), fallback); } catch (e) { fallback(); }
}

function giftModal() {
  // Mặc định hiện quà của bên gửi link; nếu bên kia cũng có QR thì cho chuyển qua lại
  const sides = [["nha-trai", "chú rể", T.mungCuoi?.nhaTrai], ["nha-gai", "cô dâu", T.mungCuoi?.nhaGai]].filter(s => s[2] && s[2].anhQR);
  if (!sides.length) return;
  let k = Math.max(0, sides.findIndex(s => s[0] === BEN));
  const back = document.activeElement;
  const el = document.createElement("div"); el.className = "at-modal"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-label", "Mừng cưới");
  const body = () => {
    const g = sides[k][2];
    return `${say("mungCuoi") ? `<p class="t sig">${say("mungCuoi")}</p>` : ""}
      ${sides.length > 1 ? `<div class="at-mtabs" role="tablist">${sides.map((s, i) => `<button type="button" role="tab" data-k="${i}" aria-selected="${i === k}">Mừng cưới ${s[1]}</button>`).join("")}</div>` : `<p class="s">Mừng cưới ${sides[k][1]}</p>`}
      <div class="ph qr" data-src="${esc(g.anhQR)}" data-alt="Mã QR chuyển khoản mừng cưới ${sides[k][1]}"><div class="qr-ph">${SVG.qr}<span>Mã QR đang được cập nhật</span></div></div>
      ${g.nganHang ? `<p class="bank">${esc(g.nganHang)}</p>` : ""}${g.soTaiKhoan ? `<p class="acc" data-acc>${fmtAcc(g.soTaiKhoan)}</p>` : ""}${g.chuTaiKhoan ? `<p class="hold">${esc(g.chuTaiKhoan)}</p>` : ""}
      ${g.soTaiKhoan ? `<button class="at-copy" type="button" data-copy>Chép số tài khoản</button>` : ""}`;
  };
  const paint = () => {
    const mc = $(".at-mc", el); mc.innerHTML = `<button class="at-x" type="button" aria-label="Đóng">${SVG.x}</button>` + body();
    loadSlots(mc);
    $(".at-x", mc).addEventListener("click", close);
    $$("[data-k]", mc).forEach(b => b.addEventListener("click", () => { k = Number(b.dataset.k); paint(); $(`[data-k="${k}"]`, el).focus(); }));
    const cb = $("[data-copy]", mc); if (cb) cb.addEventListener("click", () => copyText(cb, String(sides[k][2].soTaiKhoan).replace(/\s/g, ""), $("[data-acc]", mc)));
  };
  const close = () => { el.classList.remove("on"); document.removeEventListener("keydown", key); document.documentElement.classList.remove("no-scroll"); setTimeout(() => el.remove(), 260); if (back && back.focus) back.focus({ preventScroll: true }); };
  const key = e => { if (e.key === "Escape") close(); };
  el.innerHTML = `<div class="at-mc"></div>`;
  el.addEventListener("click", e => { if (e.target === el) close(); });
  document.addEventListener("keydown", key);
  document.documentElement.classList.add("no-scroll");
  document.body.appendChild(el); paint();
  requestAnimationFrame(() => el.classList.add("on")); $(".at-x", el).focus();
}

function fab() {
  const hasGift = T.mungCuoi && ((T.mungCuoi.nhaTrai && T.mungCuoi.nhaTrai.anhQR) || (T.mungCuoi.nhaGai && T.mungCuoi.nhaGai.anhQR));
  const acts = [hasGift && ["gift", "Mừng cưới", SVG.gift], T.soLoiChuc && ["wish", "Gửi lời chúc", SVG.wish], T.xacNhanThamDu && ["rsvp", "Xác nhận tham dự", SVG.rsvp], ["invite", "Thư mời", SVG.letter]].filter(Boolean);
  const box = document.createElement("div"); box.className = "at-fab";
  box.innerHTML = acts.map(([k, t, ic], i) => `<div class="it" style="--k:${acts.length - 1 - i}"><span class="tip">${t}</span><button class="at-fb" type="button" data-act="${k}" aria-label="${t}" tabindex="-1">${ic}</button></div>`).join("") + `<button class="at-fb" type="button" data-menu aria-label="Mở menu nhanh" aria-expanded="false">${SVG.menu}</button>`;
  document.body.appendChild(box);
  const menu = $("[data-menu]", box);
  const set = open => { box.classList.toggle("open", open); menu.setAttribute("aria-expanded", open); $$("[data-act]", box).forEach(b => b.tabIndex = open ? 0 : -1); };
  menu.addEventListener("click", () => set(!box.classList.contains("open")));
  document.addEventListener("click", e => { if (!box.contains(e.target)) set(false); });
  $$("[data-act]", box).forEach(b => b.addEventListener("click", () => {
    set(false);
    if (b.dataset.act === "gift") giftModal();
    else { const s = $(`[data-sec="${b.dataset.act}"]`, root); if (s) s.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" }); }
  }));
}

// Nhạc nền: mặc định BẬT. Phát ngay khi mở thiệp, lặp lại liên tục cho tới khi khách bấm nút nốt nhạc để tắt.
// Nút nốt nhạc hiện theo lựa chọn bật / tắt (mặc định bật), không hiện nhãn nhắc nào.
// Máy nào không cho trang web tự phát tiếng (iPhone, nhiều điện thoại) thì nhạc bắt đầu ngay ở lần chạm đầu tiên vào thiệp.
function music() {
  const src = String(T.nhacNen || "").trim();
  if (!src) return;
  const a = new Audio(/%[0-9a-f]{2}/i.test(src) ? src : encodeURI(src));
  a.loop = true; a.preload = "auto"; a.volume = .8;
  const b = document.createElement("button"); b.className = "at-music"; b.type = "button";
  b.setAttribute("aria-label", "Tắt hoặc bật nhạc nền"); b.innerHTML = SVG.music;
  document.body.appendChild(b);
  let on = true; // khách chưa tự tắt nhạc
  const show = () => b.setAttribute("aria-pressed", String(on));
  show();
  a.addEventListener("error", () => b.remove()); // file nhạc hỏng hoặc sai link thì ẩn nút
  const play = () => a.play().then(() => true, () => false);
  // Máy chặn tự phát: thử phát lại ở mọi lần chạm, bấm, gõ phím cho tới khi được
  const EVENTS = ["pointerdown", "touchstart", "touchend", "click", "keydown"];
  const stopWaiting = () => EVENTS.forEach(ev => removeEventListener(ev, first, true));
  const first = e => { if (e.target.closest && e.target.closest(".at-music")) return; if (on && a.paused) play().then(ok => { if (ok) stopWaiting(); }); };
  EVENTS.forEach(ev => addEventListener(ev, first, true));
  b.addEventListener("click", () => {
    // Đang bật nhưng máy chưa cho phát: lần bấm này chính là lần chạm đầu, cho phát luôn
    if (on && a.paused) { play().then(ok => { if (ok) stopWaiting(); }); return; }
    on = !on; show();
    if (on) play(); else { a.pause(); stopWaiting(); }
  });
  play().then(ok => { if (ok) stopWaiting(); });
  // Khách chuyển sang ứng dụng khác thì tạm dừng, quay lại thì phát tiếp
  document.addEventListener("visibilitychange", () => { if (document.hidden) { if (!a.paused) a.pause(); } else if (on && a.currentTime > 0) play(); });
}

// ---------- Gửi xác nhận và lời chúc lên Google Sheet ----------
async function send(data) {
  if (!M.api) return { ok: true, local: true };
  const r = await fetch(M.api, { method: "POST", body: JSON.stringify(data) });
  const j = await r.json().catch(() => ({ ok: r.ok }));
  if (!j.ok) throw new Error(j.loi || "Không gửi được");
  return j;
}
async function loadWishes() {
  if (!M.api) return [];
  const r = await fetch(M.api + (M.api.includes("?") ? "&" : "?") + "loai=loichuc");
  const j = await r.json();
  return Array.isArray(j.loiChuc) ? j.loiChuc : [];
}

function forms() {
  const f = $("[data-rsvp]", root);
  if (f) {
    const msg = $(".at-msg", f), num = $("#r-num", f), ok = $(".at-ok", f);
    $$('input[name="r-come"]', f).forEach(r => r.addEventListener("change", () => { num.hidden = r.value === "Không" && r.checked; }));
    const g = $("[data-gift]", f); if (g) g.addEventListener("click", giftModal);
    f.addEventListener("submit", async e => {
      e.preventDefault();
      const ten = $("#r-name", f).value.trim(), thamDu = $('input[name="r-come"]:checked', f).value;
      msg.classList.remove("err");
      if (!ten) { msg.textContent = "Bạn ghi họ và tên giúp nhé."; msg.classList.add("err"); $("#r-name", f).focus(); return; }
      const soNguoi = thamDu === "Có" ? Math.max(1, Math.min(20, Number(num.value) || 1)) : 0;
      ok.disabled = true; msg.textContent = "Đang gửi…";
      try {
        const r = await send({ loai: "xacnhan", ten, sdt: $("#r-phone", f).value.trim(), thamDu, soNguoi, khachCua: $("#r-of", f).value, suKien: $("#r-ev", f)?.value || "", ben: BEN, khach: GUEST });
        msg.textContent = r.local ? `Cảm ơn ${ten}! (Thiệp chưa kết nối nơi lưu nên gia đình chưa nhận được xác nhận này.)`
          : thamDu === "Có" ? `Cảm ơn ${ten}! Gia đình đã nhận xác nhận${soNguoi > 1 ? ` cho ${soNguoi} người` : ""}. Hẹn gặp trong ngày vui!` : `Cảm ơn ${ten} đã báo. Gia đình rất tiếc vì không gặp được ${M.pron}.`;
        toast(ten, thamDu === "Có" ? "Đã xác nhận sẽ tham dự" : "Đã báo không tham dự được");
      } catch (err) { msg.textContent = "Chưa gửi được, bạn kiểm tra mạng rồi bấm Xác nhận lần nữa nhé."; msg.classList.add("err"); }
      ok.disabled = false;
    });
  }
  const w = $("[data-wishf]", root), list = $("[data-wl]", root);
  const add = (name, text, time, top = true) => {
    const empty = $("[data-empty]", list); if (empty) empty.remove();
    const it = document.createElement("div"); it.className = "at-wi";
    it.innerHTML = `<b></b><p></p>${time ? `<small>${esc(time)}</small>` : ""}`;
    $("b", it).textContent = name; $("p", it).textContent = text;
    if (top) list.prepend(it); else list.appendChild(it);
    return it;
  };
  if (w) {
    const msg = $(".at-msg", w), ok = $(".at-ok", w);
    w.addEventListener("submit", async e => {
      e.preventDefault();
      const ten = $("#w-name", w).value.trim(), loiChuc = $("#w-text", w).value.trim();
      msg.classList.remove("err");
      if (!ten || !loiChuc) { msg.textContent = !ten ? "Bạn ghi tên giúp nhé." : "Bạn viết vài lời chúc nhé."; msg.classList.add("err"); (!ten ? $("#w-name", w) : $("#w-text", w)).focus(); return; }
      ok.disabled = true; msg.textContent = "Đang gửi…";
      try {
        const r = await send({ loai: "loichuc", ten, loiChuc, ben: BEN, khach: GUEST });
        const it = add(ten, loiChuc, stamp()); list.scrollTop = 0;
        if (ANIM) G.fromTo(it, { opacity: 0, y: -12, backgroundColor: "#FFF6E6" }, { opacity: 1, y: 0, backgroundColor: "#FFFFFF", duration: 1.2, ease: "expo.out" });
        $("#w-text", w).value = "";
        msg.textContent = r.local ? "Đã gửi. (Thiệp chưa kết nối nơi lưu nên lời chúc chỉ hiện trên máy bạn.)" : "Cảm ơn bạn! Lời chúc đã được gửi tới cô dâu chú rể.";
        toast(ten, loiChuc);
      } catch (err) { msg.textContent = "Chưa gửi được, bạn kiểm tra mạng rồi gửi lại nhé."; msg.classList.add("err"); }
      ok.disabled = false;
    });
    // Lời chúc của mọi người: hiện trong danh sách và lần lượt bật lên ở đầu màn hình
    loadWishes().then(items => {
      if (!items.length) return;
      items.forEach(x => add(x.ten, x.loiChuc, x.thoiGian ? stamp(x.thoiGian) : "", false));
      if (RM) return;
      let i = 0;
      const next = () => { if (!document.hidden && !$(".at-modal") && !$(".lb")) { const x = items[i++ % items.length]; toast(x.ten, x.loiChuc, 5000); } };
      setTimeout(() => { next(); setInterval(next, 12000); }, 6000);
    }).catch(() => {});
  }
}

// ---------- Khởi động ----------
const p = M.people;
document.title = `Thiệp cưới ${p[0].tenHienThi} & ${p[1].tenHienThi}`;
if (ANIM) document.body.classList.add("anim");
root.innerHTML = html();
loadSlots(root); reveals(); fitText(); hero(); flares(); countdown(); trio(); slider(); forms(); fab(); music(); snow();
$$("[data-zoomp]", root).forEach(b => b.addEventListener("click", () => { const list = M.people.map(x => x.photo).filter(Boolean); if (list.length) lightbox(list, Math.min(Number(b.dataset.zoomp), list.length - 1)); }));
// Bản đồ chỉ tải khi khách cuộn gần tới, để thiệp mở nhanh
const mapFrame = $("iframe[data-map]", root);
if (mapFrame) { const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); mapFrame.src = mapFrame.dataset.map; } }, { rootMargin: "600px 0px" }); io.observe(mapFrame); }
})();
