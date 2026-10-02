@echo off
chcp 65001 > nul
echo ======================================================================
echo   KHỞI ĐỘNG FRONTEND WEB COMMAND CENTER - AGRIGUARD-IOT
echo ======================================================================
cd /d "%~dp0frontend"
echo [*] Đang khởi chạy Vite React Dev Server trên cổng 5173...
echo [*] Web Dashboard: http://localhost:5173
echo [*] Mobile PWA Sync: http://localhost:5173/mobile
npm run dev
pause
