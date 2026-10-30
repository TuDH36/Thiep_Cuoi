@echo off
rem Bam dup chuot de xem thu thiep tren may minh truoc khi dua len mang
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul || (echo Chua cai Node.js. Tai tai https://nodejs.org roi chay lai. & pause & exit /b 1)
if not exist node_modules\sharp (
  echo Dang cai cong cu lan dau, cho mot chut...
  call npm install --no-audit --no-fund
)
call node cong-cu\xem-thu.mjs --mo
pause
