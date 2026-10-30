// Đưa thiệp lên mạng (Vercel, miễn phí) và in ra link để gửi khách.
// Lần đầu: dán mã đăng nhập (token) tạo trên trang Vercel; mã được lưu vào file .vercel-token, các lần sau tự chạy.
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { build, readInfo } from "./xuat-ban.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "node_modules", "vercel", "dist", "index.js");
const TOKEN_FILE = path.join(ROOT, ".vercel-token");
let token = (process.env.VERCEL_TOKEN || (existsSync(TOKEN_FILE) ? readFileSync(TOKEN_FILE, "utf8") : "")).trim();

// Chạy lệnh vercel; vừa hiện ra màn hình vừa giữ lại chữ để đọc link
function vercel(args, { cwd = ROOT, quiet = false } = {}) {
  return new Promise((resolve, reject) => {
    const full = token ? [CLI, ...args, "--token", token] : [CLI, ...args];
    const child = spawn(process.execPath, full, { cwd, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, VERCEL_TELEMETRY_DISABLED: "1" } });
    let out = "", err = "";
    child.stdout.on("data", d => { out += d; });
    child.stderr.on("data", d => { err += d; if (!quiet) process.stderr.write(d); });
    child.on("error", reject);
    child.on("close", code => resolve({ code, out, err }));
  });
}

// Kiểm tra mã đăng nhập: trả về { user } nếu được, { bad: true } nếu Vercel nói mã sai / hết hạn,
// { err } nếu lỗi khác (mạng chập chờn, Vercel trả lời chậm...) để không đòi mã mới oan
async function whoami() {
  if (!token) return { bad: true };
  const r = await vercel(["whoami"], { quiet: true });
  if (r.code === 0) return { user: r.out.trim().split("\n").pop() };
  const text = (r.out + "\n" + r.err).replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  if (/token[^\n]*(not valid|invalid|expired)|not authorized|forbidden|\b403\b/i.test(text)) return { bad: true };
  return { err: text.split("\n").map(s => s.trim()).filter(s => /error|lỗi|fetch|timeout|ENOTFOUND|ECONN|network/i.test(s)).pop() || "Không rõ lỗi" };
}

// Có mã đã lưu: thử vài lần (mạng chập chờn thì lần sau thường được); chỉ đòi mã mới khi Vercel báo mã sai
async function checkSaved() {
  let last = null;
  for (let i = 0; i < 3; i++) {
    last = await whoami();
    if (last.user || last.bad) return last;
    await new Promise(r => setTimeout(r, 3000));
  }
  return last;
}

// Một ô nhập dùng chung cho cả lần đăng nhập; nếu cửa sổ bị đóng thì trả về rỗng thay vì treo
let rl = null, closed = false, pending = null;
function ask(q) {
  if (closed) return Promise.resolve("");
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.on("close", () => { closed = true; if (pending) { pending(""); pending = null; } });
  }
  return new Promise(resolve => { pending = resolve; rl.question(q, a => { pending = null; resolve(a); }); });
}

async function login() {
  console.log("\n=== Cần mã đăng nhập Vercel ===");
  console.log("(Nếu bạn còn giữ mã cũ chưa xóa trên trang Vercel thì dán lại mã cũ là được.)");
  console.log("1. Mở trang này trên trình duyệt (đã đăng nhập Vercel):  https://vercel.com/account/settings/tokens");
  console.log("2. Ở mục Create Token: điền tên bất kỳ (ví dụ: thiep), Scope chọn tài khoản của bạn,");
  console.log("   Expiration chọn No Expiration (hoặc 1 Year), rồi bấm Create.");
  console.log("3. Bấm nút Copy để chép mã vừa tạo.");
  console.log("4. Quay lại cửa sổ này, bấm chuột phải (hoặc Ctrl+V) để dán, rồi bấm Enter.\n");
  for (let i = 0; i < 3; i++) {
    const t = (await ask("Dán mã vào đây rồi bấm Enter: ")).trim().replace(/^["']|["']$/g, "");
    if (!t) break;
    token = t;
    const { user, err } = await whoami();
    if (err) { console.log(`Chưa kiểm tra được mã vì lỗi kết nối: ${err}\nKiểm tra mạng rồi dán lại.\n`); token = ""; continue; }
    if (user) {
      if (rl) rl.close();
      await fs.writeFile(TOKEN_FILE, t);
      console.log(`\nĐã đăng nhập Vercel: ${user}. Mã được lưu trong file .vercel-token (đừng gửi file này cho ai).`);
      return user;
    }
    console.log("Mã chưa đúng hoặc đã hết hạn. Kiểm tra đã chép đủ mã chưa rồi dán lại.\n");
    token = "";
  }
  if (rl) rl.close();
  throw new Error("Chưa đăng nhập được Vercel. Chạy lại trien-khai.bat để thử lần nữa.");
}

async function deploy(dir) {
  console.log("\nĐang đưa thiệp lên mạng...");
  const r = await vercel(["deploy", "--prod", "--yes"], { cwd: dir });
  if (r.code !== 0) throw new Error("Vercel báo lỗi khi đưa thiệp lên (xem dòng chữ ở trên).");
  // Link chính (Aliased) là link ai cũng mở được; link riêng của từng lần đưa lên thường bị khóa, chỉ dùng khi không có link chính
  const text = (r.out + "\n" + r.err).replace(/\x1b\[[0-9;]*[A-Za-z]/g, "");
  const alias = (text.match(/Aliased:?\s+(https:\/\/[^\s\[\]]+)/) || [])[1];
  const any = (r.out.match(/https:\/\/[^\s\[\]]+\.vercel\.app/) || [])[0];
  if (!alias) console.log("Chú ý: không thấy link chính trong kết quả của Vercel, tạm dùng link của lần đưa lên này.");
  return (alias || any || "").replace(/\/$/, "");
}

async function saveSite(url) {
  const file = path.join(ROOT, "info", "thong-tin.js");
  const src = await fs.readFile(file, "utf8");
  const next = src.replace(/diaChiWeb:\s*""/, `diaChiWeb: "${url}"`);
  if (next !== src) { await fs.writeFile(file, next); return true; }
  return false;
}

try {
  let user = "";
  if (token) {
    const r = await checkSaved();
    if (r.user) user = r.user;
    else if (r.err) throw new Error(`Không kết nối được tới Vercel (${r.err}).\nMã đăng nhập của bạn vẫn giữ nguyên, không cần tạo mã mới. Kiểm tra mạng rồi chạy lại trien-khai.bat sau ít phút.`);
    else console.log("\nMã đăng nhập đã lưu không còn dùng được (có thể đã bị xóa trên trang Vercel). Cần dán mã mới.");
  }
  if (!user) user = await login();
  console.log(`Tài khoản Vercel: ${user}`);
  let { OUT, T } = await build({ quiet: true });
  let url = await deploy(OUT);
  if (!url) throw new Error("Đã đưa lên nhưng không đọc được link. Mở vercel.com, vào dự án để lấy link.");
  // Lần đầu: ghi địa chỉ thiệp vào file thông tin rồi đưa lên lại để link gửi Zalo, Facebook có ảnh xem trước
  if (!String(T.diaChiWeb || "").trim() && await saveSite(url)) {
    console.log(`\nĐã ghi địa chỉ ${url} vào info/thong-tin.js (mục diaChiWeb). Cập nhật lại một lần nữa...`);
    ({ OUT, T } = await build({ quiet: true }));
    url = (await deploy(OUT)) || url;
  }
  T = readInfo();
  const site = String(T.diaChiWeb || url).replace(/\/+$/, "");
  const ex = encodeURIComponent("Bác Hùng và gia đình");
  console.log("\n================ XONG ================");
  console.log(`Thiệp đã lên mạng: ${site}`);
  console.log(`  Link nhà trai gửi:  ${site}/?ben=nha-trai`);
  console.log(`  Link nhà gái gửi:   ${site}/?ben=nha-gai`);
  console.log(`  Kèm tên khách, ví dụ: ${site}/?ben=nha-trai&to=${ex}`);
  console.log(`  Tạo link cho cả danh sách khách: ${site}/tao-link.html`);
  console.log(`  Sổ khách (cô dâu chú rể xem ai đi, ai không, lời chúc; cần mật khẩu): ${site}/quan-ly.html`);
  console.log("=======================================\n");
} catch (e) {
  console.error("\nLỖI: " + e.message);
  process.exitCode = 1;
}
