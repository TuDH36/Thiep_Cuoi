// Xem thử thiệp đã xuất bản trên máy mình trước khi đưa lên mạng: mở http://localhost:5173
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { build } from "./xuat-ban.mjs";

const PORT = Number(process.env.PORT) || 5173;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".m4a": "audio/mp4" };
const { OUT } = await build();
http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  let file = path.join(OUT, url.endsWith("/") ? url + "index.html" : url);
  if (!file.startsWith(OUT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end("Không có file"); return; }
  res.writeHead(200, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`\nĐang chạy thử tại: http://localhost:${PORT}\nThêm ?to=Tên khách hoặc ?ben=nha-gai vào cuối link để thử. Tắt cửa sổ này để dừng.`);
  if (process.argv.includes("--mo")) {
    const cmd = process.platform === "win32" ? ["cmd", ["/c", "start", "", `http://localhost:${PORT}`]] : [process.platform === "darwin" ? "open" : "xdg-open", [`http://localhost:${PORT}`]];
    spawn(cmd[0], cmd[1], { stdio: "ignore", detached: true }).unref();
  }
});
