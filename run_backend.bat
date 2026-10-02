@echo off
chcp 65001 > nul
echo ======================================================================
echo   KHỞI ĐỘNG BACKEND FASTAPI - AGRIGUARD-IOT ENTERPRISE
echo ======================================================================
cd /d "%~dp0"
echo [*] Đang kích hoạt môi trường Python venv...
call venv\Scripts\activate.bat
echo [*] Đang khởi chạy Uvicorn Server trên cổng 8000...
echo [*] API Docs: http://localhost:8000/docs
echo [*] Health Check: http://localhost:8000/
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
