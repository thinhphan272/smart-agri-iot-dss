@echo off
chcp 65001 > nul
echo ======================================================================
echo   KHỞI ĐỘNG ĐỒNG THỜI TOÀN BỘ HỆ THỐNG AGRIGUARD-IOT (BACKEND + FRONTEND)
echo ======================================================================
cd /d "%~dp0"
echo [*] Đang mở cửa sổ Backend FastAPI (Cổng 8000)...
start "AgriGuard-IoT Backend (Port 8000)" cmd /c "run_backend.bat"

echo [*] Đang mở cửa sổ Frontend React (Cổng 5173)...
start "AgriGuard-IoT Frontend (Port 5173)" cmd /c "run_frontend.bat"

echo [✓] Đã khởi động cả 2 server!
echo     - Dashboard: http://localhost:5173
echo     - API Docs:  http://localhost:8000/docs
echo ======================================================================
pause
