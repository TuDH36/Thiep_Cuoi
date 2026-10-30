@echo off
rem Bam dup chuot vao file nay de dua thiep len mang (hoac cap nhat thiep sau khi sua thong tin, anh)
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Chua cai Node.js. Tai tai https://nodejs.org roi chay lai. & pause & exit /b 1)
if not exist node_modules\vercel\dist\index.js (
  echo Dang cai cong cu lan dau, cho mot chut...
  call npm install --no-audit --no-fund
)
call node cong-cu\trien-khai.mjs
pause
