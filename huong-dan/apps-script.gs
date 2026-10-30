/**
 * Nơi lưu xác nhận tham dự và lời chúc của thiệp cưới (Google Apps Script, miễn phí).
 * Cách cài: xem file huong-dan/luu-loi-chuc.md
 *
 * Bảng tính sẽ có 2 trang:
 *   - "Xac nhan": thời gian, tên, số điện thoại, có đến không, số người, khách của ai, lễ nào, link của bên nào, tên khách trên link
 *   - "Loi chuc": thời gian, tên, lời chúc, hiện (đổi ô này thành KHONG để ẩn một lời chúc khỏi thiệp)
 */

// Mật khẩu để cô dâu chú rể mở trang xem khách (quan-ly.html). Đổi chữ trong ngoặc kép thành mật khẩu của bạn.
// Để "" thì trang xem khách bị khóa hẳn.
const MAT_KHAU = "";

const TRANG_XAC_NHAN = "Xac nhan";
const TRANG_LOI_CHUC = "Loi chuc";
const COT_XAC_NHAN = ["Thời gian", "Tên", "Số điện thoại", "Tham dự", "Số người", "Khách của", "Sự kiện", "Link của bên", "Tên khách trên link"];
const COT_LOI_CHUC = ["Thời gian", "Tên", "Lời chúc", "Hiện", "Link của bên", "Tên khách trên link"];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const cat = (v, n) => String(v == null ? "" : v).slice(0, n);

    // Trang xem khách: cần đúng mật khẩu
    if (d.loai === "quanly" || d.loai === "anhien") {
      if (!MAT_KHAU) return tra({ ok: false, loi: "chua-dat-mat-khau" });
      if (String(d.mk || "") !== MAT_KHAU) { Utilities.sleep(1500); return tra({ ok: false, loi: "sai-mat-khau" }); }
      if (d.loai === "quanly") return tra({ ok: true, xacNhan: doc(TRANG_XAC_NHAN, COT_XAC_NHAN.length), loiChuc: doc(TRANG_LOI_CHUC, COT_LOI_CHUC.length), bang: SpreadsheetApp.getActive().getUrl() });
      // Ẩn / hiện một lời chúc trên thiệp; kiểm tra đúng dòng (bảng có thể đã bị sửa tay)
      const sh = SpreadsheetApp.getActive().getSheetByName(TRANG_LOI_CHUC);
      const dong = Number(d.dong);
      if (!sh || !(dong >= 2) || dong > sh.getLastRow() || String(sh.getRange(dong, 2).getValue()) !== String(d.ten)) return tra({ ok: false, loi: "da-thay-doi" });
      sh.getRange(dong, 4).setValue(d.hien ? "CO" : "KHONG");
      return tra({ ok: true });
    }

    // Khách gửi từ thiệp
    if (!cat(d.ten, 80).trim()) return tra({ ok: false, loi: "Thiếu tên" });
    if (d.loai === "xacnhan") {
      trang(TRANG_XAC_NHAN, COT_XAC_NHAN)
        .appendRow([new Date(), cat(d.ten, 80), "'" + cat(d.sdt, 20), cat(d.thamDu, 10), Number(d.soNguoi) || 0, cat(d.khachCua, 40), cat(d.suKien, 80), cat(d.ben, 10), cat(d.khach, 80)]);
      return tra({ ok: true });
    }
    if (d.loai === "loichuc") {
      if (!cat(d.loiChuc, 600).trim()) return tra({ ok: false, loi: "Thiếu lời chúc" });
      trang(TRANG_LOI_CHUC, COT_LOI_CHUC)
        .appendRow([new Date(), cat(d.ten, 80), cat(d.loiChuc, 600), "CO", cat(d.ben, 10), cat(d.khach, 80)]);
      return tra({ ok: true });
    }
    return tra({ ok: false, loi: "Không rõ loại dữ liệu" });
  } catch (err) {
    return tra({ ok: false, loi: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Thiệp gọi vào đây để lấy danh sách lời chúc (mới nhất trước, tối đa 200)
function doGet(e) {
  const sh = SpreadsheetApp.getActive().getSheetByName(TRANG_LOI_CHUC);
  if (!sh || sh.getLastRow() < 2) return tra({ ok: true, loiChuc: [] });
  const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 4).getValues();
  const loiChuc = rows.filter(r => r[1] && r[2] && String(r[3]).toUpperCase() !== "KHONG")
    .map(r => ({ thoiGian: r[0] instanceof Date ? r[0].toISOString() : String(r[0]), ten: String(r[1]), loiChuc: String(r[2]) }))
    .reverse().slice(0, 200);
  return tra({ ok: true, loiChuc });
}

// Đọc cả một trang thành danh sách: mỗi dòng là [số dòng, thời gian, các ô còn lại...]
function doc(ten, soCot) {
  const sh = SpreadsheetApp.getActive().getSheetByName(ten);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, soCot).getValues()
    .map((r, i) => [i + 2, ...r.map(v => v instanceof Date ? v.toISOString() : v)])
    .filter(r => r[2]);
}

function trang(ten, tieuDe) {
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(ten);
  if (!sh) { sh = ss.insertSheet(ten); sh.appendRow(tieuDe); sh.setFrozenRows(1); sh.getRange(1, 1, 1, tieuDe.length).setFontWeight("bold"); }
  return sh;
}

function tra(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
