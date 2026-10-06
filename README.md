# 🌿 AgriGuard-IoT: Smart Plant Health & Eco-Stress Monitoring DSS

> **Hệ thống Giám sát Sức khỏe Cây trồng, Chẩn đoán Nguy cơ Stress Sinh thái và Ra Quyết định Nông học Thông minh**  
> Tích hợp 2 Bộ não: **LightGBM SOTA** (Real-time Serving < 20ms) & **Apache Spark MLlib** (Xử lý phân tán Big Data 200,000 bản ghi).

---

## 🛠️ Công Nghệ Nền Tảng (Tech Stack)
* **Frontend:** React 18, Vite, Lucide Icons, Glassmorphism Dark UI, WebSockets Real-time Hub, Song ngữ 100% (VI ↔ EN).
* **Backend:** FastAPI, Python 3.10+, SQLAlchemy ORM, Uvicorn ASGI Server.
* **Database:** PostgreSQL (Khuyên dùng) hoặc **Tự động chuyển sang SQLite nội bộ (Zero-Config)** nếu máy chưa cài PostgreSQL.
* **AI & Big Data:** 
  * **Bộ não 1:** LightGBM Booster (Huấn luyện tối ưu ROC T* = 0.34, Precision 95.05%).
  * **Bộ não 2:** Apache Spark MLlib GBTClassifier (30 Trees, 6 Partitions RDD phân tán).
* **AI Chatbot:** Google Gemini 1.5 Flash Cloud API & Tri thức Nông học Nội bộ.

---

## 💻 Yêu Cầu Cài Đặt Trước (Prerequisites)
Trước khi khởi chạy, máy tính của bạn hoặc bạn bè cần có sẵn:
1. **Python 3.10 - 3.12** ([Tải Python](https://www.python.org/downloads/)) — *Nhớ tích chọn "Add Python to PATH" khi cài đặt*.
2. **Node.js 18+ hoặc 20+** ([Tải Node.js](https://nodejs.org/)) — *Bao gồm sẵn trình quản lý gói `npm`*.
3. **Git** ([Tải Git](https://git-scm.com/)).

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh Nhất (Quick Start)

### Bước 1: Clone mã nguồn từ GitHub
Mở Terminal hoặc Command Prompt và gõ:
```bash
git clone https://github.com/thinhphan272/smart-agri-iot-dss.git
cd smart-agri-iot-dss
```

---

### Bước 2: Cài đặt thư viện Backend (Python)
Tạo môi trường ảo và cài đặt các phụ thuộc:

**Trên Windows:**
```bash
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
```

**Trên macOS / Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

### Bước 3: Cài đặt thư viện Frontend (Node.js)
Mở một cửa sổ terminal khác (hoặc chuyển thư mục):
```bash
cd frontend
npm install
cd ..
```

---

### Bước 4: Khởi động hệ thống (Run All)

#### Cách 1: Chạy 1-Chạm trên Windows (Đơn giản nhất)
Nhấp đúp chuột (Double click) vào tệp:
👉 **`run_all.bat`** *(Hoặc mở 2 tệp `run_backend.bat` và `run_frontend.bat`)*.

#### Cách 2: Chạy lệnh thủ công (Cho cả Windows, macOS, Linux)
* **Terminal 1 (Backend FastAPI):**
  ```bash
  # Kích hoạt venv trước:
  # Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
  python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
  ```
* **Terminal 2 (Frontend React Vite):**
  ```bash
  cd frontend
  npm run dev
  ```

---

### Bước 5: Trải nghiệm ứng dụng trên Trình duyệt
Sau khi khởi động thành công, mở trình duyệt và truy cập:
* 🌐 **Web Dashboard:** [http://localhost:5173](http://localhost:5173)
* 📖 **API Docs Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
* 📱 **Trạm Thực địa Mobile PWA:** [http://localhost:5173/mobile](http://localhost:5173/mobile)

---

## 🔐 Tài Khoản Mẫu Trải Nghiệm 1-Chạm (Quick Demo Login)
Bạn có thể bấm trực tiếp vào nút **"Demo 1-Chạm"** trên thanh Navbar để đăng nhập ngay mà không cần nhớ mật khẩu:
* 👑 **Hội đồng / Admin:** `admin@agri-iot.vn` (Mật khẩu: `admin123`) — *Toàn quyền quét tệp Big Data CSV và cấu hình hệ thống*.
* ⚡ **Kỹ sư Nông học:** `engineer@agri-iot.vn` (Mật khẩu: `engineer123`) — *Chẩn đoán chuyên sâu, điều khiển thanh trượt & kích hoạt thiết bị cứu cây*.
* 🌾 **Chủ Nông hộ / Nông dân:** `farmer@agri-iot.vn` (Mật khẩu: `farmer123`) — *Xem chỉ số an toàn, nhận phác đồ can thiệp tức thì*.

---

## 🗄️ Cơ Chế Database Thông Minh (Zero-Config Database)
* **PostgreSQL:** Nếu máy bạn có cài đặt PostgreSQL (với database `agri_iot_db` và user `postgres:postgres`), hệ thống sẽ tự động kết nối lưu trữ.
* **Tự động Fallback sang SQLite:** Nếu máy bạn bè **chưa cài PostgreSQL**, hệ thống sẽ **tự động chuyển sang sử dụng SQLite nội bộ (`agri_iot.db`)** mà không hề báo lỗi kết nối. Bạn bè của bạn có thể chạy được ngay 100%!

---

## 🌟 Các Tính Năng Trọng Tâm Của Đồ Án
1. **Real-Time Dashboard (Tab 1):** Gauge đo xác suất stress sinh thái theo thời gian thực (< 20ms), 9 thanh trượt vi khí hậu, chốt chặn nông học lai và phác đồ cứu cây tức thì.
2. **Big Data Batch Scan (Tab 2):** Điều hướng phân đoạn dữ liệu 25 dòng chống tràn RAM, Đấu trường 2 Bộ Não (LightGBM vs Apache Spark MLlib), kiểm chứng nhãn 200,000 dòng.
3. **Academic Dual-Track Hub (Tab 3):** Trung tâm báo cáo đối chứng khoa học giữa Thư viện thông thường và Apache Spark MLlib, 6x6 biểu đồ đối xứng chuẩn 300 DPI, phân tích chi phí phân tán (Distributed Overhead).
4. **Mobile Field Station & QR Sync (Tab 4):** Đồng bộ dữ liệu 2 chiều Web ↔ Mobile qua WebSocket thời gian thực, kích hoạt van tưới/tiêu úng từ xa, lưu trữ nhật ký thiết bị (Actuator Audit Logs).
5. **AgriBot AI Doctor:** Trợ lý Bác sĩ Nông học thông minh kết nối đám mây Google Gemini 1.5 Flash Cloud API, hỗ trợ cửa sổ phóng to toàn màn hình.
6. **Song Ngữ Hoàn Thiện (VI ↔ EN):** Chuyển đổi ngôn ngữ tức thì trên toàn bộ giao diện và thuật ngữ nông học.

---

## 📞 Hỗ Trợ Kỹ Thuật
Nếu gặp bất kỳ vấn đề gì trong quá trình cài đặt, vui lòng tạo Issue trên GitHub hoặc liên hệ tác giả qua email: `phanthinh654@gmail.com`.
