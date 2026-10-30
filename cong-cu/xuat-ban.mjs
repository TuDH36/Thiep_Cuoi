// Xuất bản thiệp: chép trang sang thư mục xuat-ban/<tên-thiệp>, nén ảnh cho nhẹ,
// tự cắt mã QR khỏi ảnh chụp màn hình ngân hàng, và gắn ảnh xem trước khi gửi link qua Zalo, Facebook.
// Ảnh gốc trong images/ giữ nguyên, không bị sửa.
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, ".cache-anh");
const IMG_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function readInfo() {
  const file = path.join(ROOT, "info", "thong-tin.js");
  const code = readFileSync(file, "utf8");
  const ctx = { window: {} };
  try { vm.runInNewContext(code, ctx, { filename: "info/thong-tin.js" }); }
  catch (e) {
    const line = (e.stack || "").match(/thong-tin\.js:(\d+)/);
    throw new Error(`File info/thong-tin.js bị lỗi${line ? ` ở dòng ${line[1]}` : ""}: ${e.message}\nKiểm tra lại dấu ngoặc kép "..." và dấu phẩy cuối dòng.`);
  }
  if (!ctx.window.THIEP) throw new Error("Không tìm thấy window.THIEP trong info/thong-tin.js");
  return ctx.window.THIEP;
}

export function slugOf(T) {
  const base = T.logo || `${T.chuRe?.tenHienThi || ""} ${T.coDau?.tenHienThi || ""}`;
  const s = base.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return "thiep-cuoi-" + (s || "online");
}

// Tìm mã QR trong ảnh chụp màn hình rồi nới ra tới mép thẻ (màu nền thẻ)
async function cropQrCard(src) {
  const meta = await sharp(src).metadata();
  const turned = (meta.orientation || 1) >= 5;
  const w0 = turned ? meta.height : meta.width, h0 = turned ? meta.width : meta.height;
  if (!w0 || !h0 || h0 / w0 < 1.45) return null; // đã là ảnh QR vuông, không cần cắt
  const W = 400;
  const { data, info } = await sharp(src).rotate().resize({ width: W }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const H = info.height, k = w0 / W;
  const lum = (x, y) => { const i = (y * W + x) * 3; return .299 * data[i] + .587 * data[i + 1] + .114 * data[i + 2]; };
  const col = (x, y) => { const i = (y * W + x) * 3; return [data[i], data[i + 1], data[i + 2]]; };
  const trans = y => { let t = 0, prev = lum(0, y) < 140; for (let x = 1; x < W; x++) { const b = lum(x, y) < 140; if (b !== prev) t++; prev = b; } return t; };
  // Các dải hàng liền nhau có nhiều lần đổi đen trắng
  const busy = Array.from({ length: H }, (_, y) => trans(y) >= 6);
  const runs = []; let s = -1, gap = 0;
  for (let y = 0; y <= H; y++) {
    if (y < H && busy[y]) { if (s < 0) s = y; gap = 0; }
    else if (s >= 0) { if (++gap > 4 || y === H) { runs.push([s, y - gap]); s = -1; gap = 0; } }
  }
  let best = null;
  for (const [y0, y1] of runs) {
    const h = y1 - y0 + 1; if (h < 40) continue;
    const ct = new Array(W).fill(0);
    for (let x = 0; x < W; x++) { let prev = lum(x, y0) < 140; for (let y = y0 + 1; y <= y1; y++) { const b = lum(x, y) < 140; if (b !== prev) ct[x]++; prev = b; } }
    const xs = ct.map((c, x) => c >= 6 ? x : -1).filter(x => x >= 0); if (!xs.length) continue;
    const x0 = xs[0], x1 = xs[xs.length - 1], w = x1 - x0 + 1, ar = h / w;
    if (ar < .75 || ar > 1.33) continue;
    let bi = 0, n = 0;
    for (let y = y0; y <= y1; y += 2) for (let x = x0; x <= x1; x += 2) { const l = lum(x, y); n++; if (l < 95 || l > 165) bi++; }
    if (bi / n < .8) continue;
    if (!best || w * h > best.w * best.h) best = { x0, x1, y0, y1, w, h };
  }
  if (!best) return null;
  const q = best, size = Math.max(q.w, q.h);
  // Màu nền thẻ: trung vị các điểm ngay sát quanh mã QR
  const ring = [], pad = Math.round(size * .04);
  for (let x = q.x0; x <= q.x1; x += 2) { if (q.y0 - pad >= 0) ring.push(col(x, q.y0 - pad)); if (q.y1 + pad < H) ring.push(col(x, q.y1 + pad)); }
  for (let y = q.y0; y <= q.y1; y += 2) { if (q.x0 - pad >= 0) ring.push(col(q.x0 - pad, y)); if (q.x1 + pad < W) ring.push(col(q.x1 + pad, y)); }
  const med = i => { const v = ring.map(c => c[i]).sort((a, b) => a - b); return v[v.length >> 1] || 255; };
  const bg = [med(0), med(1), med(2)];
  const near = c => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]) < 48;
  const rowOk = (y, xa, xb) => { let ok = 0, n = 0; for (let x = Math.max(0, xa); x <= Math.min(W - 1, xb); x++) { n++; if (near(col(x, y))) ok++; } return n && ok / n > .35; };
  const colOk = (x, ya, yb) => { let ok = 0, n = 0; for (let y = Math.max(0, ya); y <= Math.min(H - 1, yb); y++) { n++; if (near(col(x, y))) ok++; } return n && ok / n > .35; };
  let L = q.x0, R = q.x1, Tp = q.y0, B = q.y1;
  const capX = Math.round(size * .2), capT = Math.round(size * .5), capB = Math.round(size * .45);
  while (L > 0 && q.x0 - L < capX && colOk(L - 1, q.y0, q.y1)) L--;
  while (R < W - 1 && R - q.x1 < capX && colOk(R + 1, q.y0, q.y1)) R++;
  while (Tp > 0 && q.y0 - Tp < capT && rowOk(Tp - 1, L, R)) Tp--;
  while (B < H - 1 && B - q.y1 < capB && rowOk(B + 1, L, R)) B++;
  const box = { left: Math.max(0, Math.round(L * k)), top: Math.max(0, Math.round(Tp * k)) };
  box.width = Math.min(w0 - box.left, Math.round((R - L + 1) * k)); box.height = Math.min(h0 - box.top, Math.round((B - Tp + 1) * k));
  return box;
}

async function processImage(src, dst, name) {
  const st = await fs.stat(src);
  const key = crypto.createHash("md5").update(`${name}|${st.size}|${st.mtimeMs}|v3`).digest("hex");
  const ext = path.extname(name).toLowerCase();
  const cached = path.join(CACHE, key + ext);
  if (!existsSync(cached)) {
    let img = sharp(src).rotate();
    if (/^qr/i.test(name)) {
      const box = await cropQrCard(src).catch(() => null);
      if (box) img = sharp(src).rotate().extract(box);
      img = img.resize({ width: 720, withoutEnlargement: true });
    } else img = img.resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true });
    if (ext === ".png") img = img.png({ compressionLevel: 9, palette: /^qr/i.test(name) ? false : true });
    else if (ext === ".webp") img = img.webp({ quality: 80 });
    else img = img.jpeg({ quality: 78, mozjpeg: true, progressive: true });
    await fs.mkdir(CACHE, { recursive: true });
    await img.toFile(cached);
  }
  await fs.copyFile(cached, dst);
  return (await fs.stat(dst)).size;
}

async function copyDir(a, b) {
  await fs.mkdir(b, { recursive: true });
  for (const e of await fs.readdir(a, { withFileTypes: true })) {
    const s = path.join(a, e.name), d = path.join(b, e.name);
    if (e.isDirectory()) await copyDir(s, d); else await fs.copyFile(s, d);
  }
}

export async function build({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  const T = readInfo();
  const slug = slugOf(T), OUT = path.join(ROOT, "xuat-ban", slug);
  // Xóa bản cũ nhưng giữ thư mục .vercel (nơi ghi thiệp này thuộc dự án Vercel nào)
  if (existsSync(OUT)) for (const e of await fs.readdir(OUT)) if (e !== ".vercel") await fs.rm(path.join(OUT, e), { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });
  await copyDir(path.join(ROOT, "assets"), path.join(OUT, "assets"));
  await copyDir(path.join(ROOT, "info"), path.join(OUT, "info"));
  await fs.copyFile(path.join(ROOT, "tao-link.html"), path.join(OUT, "tao-link.html"));
  await fs.copyFile(path.join(ROOT, "quan-ly.html"), path.join(OUT, "quan-ly.html"));

  // Ảnh và nhạc: chỉ đưa lên những file thiệp có dùng (ghi trong thong-tin.js); ảnh được nén lại.
  // Link ngoài (bắt đầu bằng http) thì không cần chép.
  const used = new Set([T.anhBia, T.anhChuRe, T.anhCoDau, T.anhJustMarried, T.anhLichTrinh, T.anhCamOn, T.nhacNen, ...(T.album || []),
    T.mungCuoi?.nhaTrai?.anhQR, T.mungCuoi?.nhaGai?.anhQR, ...(T.cauChuyen || []).map(c => c && c.anh)]
    .filter(Boolean).map(p => String(p).trim()).filter(p => p && !/^https?:\/\//i.test(p)).map(p => p.replace(/^\.?\//, "")));
  let total = 0; const missing = [];
  for (const rel of used) {
    const src = path.join(ROOT, rel), dst = path.join(OUT, rel);
    if (!existsSync(src)) { missing.push(rel); continue; }
    await fs.mkdir(path.dirname(dst), { recursive: true });
    const ext = path.extname(rel).toLowerCase();
    if (IMG_EXT.has(ext)) total += await processImage(src, dst, path.basename(rel));
    else { await fs.copyFile(src, dst); total += (await fs.stat(dst)).size; }
  }

  // Ảnh xem trước khi gửi link (1200 x 630)
  let share = "";
  if (T.anhBia && existsSync(path.join(ROOT, T.anhBia))) {
    share = "images/_xem-truoc.jpg";
    await fs.mkdir(path.join(OUT, "images"), { recursive: true });
    await sharp(path.join(ROOT, T.anhBia)).rotate().resize(1200, 630, { fit: "cover", position: "attention" }).jpeg({ quality: 80, mozjpeg: true }).toFile(path.join(OUT, share));
  }

  // Tiêu đề và ảnh xem trước trong index.html
  const names = `${T.chuRe?.tenHienThi || ""} & ${T.coDau?.tenHienThi || ""}`;
  const main = (T.cacLe || []).filter(e => e && e.ngayDuong).slice(-1)[0];
  const title = `Thiệp cưới ${names}`;
  const desc = `Trân trọng thân mời bạn tới dự lễ cưới của ${names}${main ? ` ngày ${main.ngayDuong.replace(/\//g, ".")}` : ""}.`;
  const site = String(T.diaChiWeb || "").replace(/\/+$/, "");
  const abs = p => site ? `${site}/${p}` : p;
  const e = s => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const meta = [
    `<meta name="description" content="${e(desc)}">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${e(title)}">`,
    `<meta property="og:description" content="${e(desc)}">`,
    share && `<meta property="og:image" content="${e(abs(share))}">`,
    share && `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`,
    site && `<meta property="og:url" content="${e(site)}/">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ].filter(Boolean).join("\n");
  let html = await fs.readFile(path.join(ROOT, "index.html"), "utf8");
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${e(title)}</title>`).replace(/<!-- CHIA_SE[\s\S]*?-->/, meta);
  await fs.writeFile(path.join(OUT, "index.html"), html);
  await fs.writeFile(path.join(OUT, "vercel.json"), JSON.stringify({ headers: [{ source: "/images/(.*)", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] }] }, null, 2));

  log(`Đã xuất bản vào: xuat-ban/${slug}`);
  log(`Ảnh đã nén: ${used.size - missing.length} file, tổng ${(total / 1048576).toFixed(1)} MB`);
  if (missing.length) log(`Chưa có file (thiệp sẽ hiện khung giữ chỗ): ${missing.join(", ")}`);
  if (!site) log(`Gợi ý: sau lần đưa lên mạng đầu tiên, ghi địa chỉ thiệp vào diaChiWeb trong info/thong-tin.js để link gửi Zalo, Facebook có ảnh xem trước.`);
  return { OUT, slug, T };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().catch(err => { console.error("\nLỖI: " + err.message); process.exit(1); });
}
