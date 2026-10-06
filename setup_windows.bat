@echo off
chcp 65001 > nul
echo ======================================================================
echo   CÀI ĐẶT TỰ ĐỘNG DỰ ÁN AGRIGUARD-IOT DSS (ZERO-CONFIG SETUP)
echo ======================================================================
cd /d "%~dp0"

echo [1/4] Đang kiểm tra Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [LỖI] Máy tính chưa cài đặt Python hoặc chưa chọn "Add Python to PATH"!
    echo Vui lòng tải Python 3.10 - 3.12 tại: https://www.python.org/downloads/
    pause
    exit /b 1
)
python --version

echo.
echo [2/4] Đang kiểm tra Node.js và npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo [LỖI] Máy tính chưa cài đặt Node.js!
    echo Vui lòng tải Node.js (phiên bản LTS) tại: https://nodejs.org/
    pause
    exit /b 1
)
echo Phiên bản npm:
npm --version

echo.
echo [3/4] Đang khởi tạo môi trường Python venv và cài đặt gói thư viện...
if not exist "venv" (
    echo Đang tạo thư mục venv...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Đang cài đặt requirements.txt...
pip install -r requirements.txt

echo.
echo [4/4] Đang cài đặt thư viện Frontend (npm install)...
cd frontend
call npm install
cd ..

echo.
echo ======================================================================
echo [HOÀN TẤT] Môi trường dự án đã được cài đặt thành công 100%!
echo.
echo Bạn có thể khởi động ngay hệ thống bằng cách:
echo   - Nhấp đúp chuột vào tệp: run_all.bat
echo ======================================================================
pause
