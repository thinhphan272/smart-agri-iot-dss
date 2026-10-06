@echo off
chcp 65001 > nul
echo ======================================================================
echo   KHỞI ĐỘNG BACKEND FASTAPI - AGRIGUARD-IOT ENTERPRISE
echo ======================================================================
cd /d "%~dp0"
echo [*] Đang kiểm tra môi trường Python...
if exist "venv\Scripts\activate.bat" (
    echo [*] Kích hoạt venv...
    call venv\Scripts\activate.bat
) else if exist ".venv\Scripts\activate.bat" (
    echo [*] Kích hoạt .venv...
    call .venv\Scripts\activate.bat
) else (
    echo [!] Chưa tìm thấy thư mục venv. Đang chạy bằng Python mặc định của hệ thống...
)
echo [*] Đang khởi chạy Uvicorn Server trên cổng 8000...
echo [*] API Docs: http://localhost:8000/docs
echo [*] Health Check: http://localhost:8000/
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
pause
