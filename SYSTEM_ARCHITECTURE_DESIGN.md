# KIẾN TRÚC TOÀN DIỆN HỆ THỐNG AGRIGUARD-IOT
## Smart Agri-IoT Eco-Stress Monitoring & Decision Support System
**Phiên bản:** 2.0 — Enterprise Full-Stack (Web + Mobile PWA + Hybrid AI Chatbot)
**Cập nhật lần cuối:** 30/09/2026

---

## MỤC LỤC
1. [Tổng quan hệ thống](#1-tổng-quan)
2. [Công nghệ & Cấu trúc thư mục](#2-công-nghệ--cấu-trúc-thư-mục)
3. [Cơ sở dữ liệu PostgreSQL](#3-cơ-sở-dữ-liệu-postgresql)
4. [Hệ thống Xác thực & Phân quyền (Auth & RBAC)](#4-hệ-thống-xác-thực--phân-quyền)
5. [Luồng hoạt động chi tiết từng chức năng](#5-luồng-hoạt-động-chi-tiết)
6. [Kiến trúc Web ↔ Mobile (PWA + WebSockets)](#6-kiến-trúc-web--mobile)
7. [Hybrid AI Chatbot (Gemini + Tri thức Nội bộ)](#7-hybrid-ai-chatbot)
8. [Danh sách tất cả Nút bấm & Màn hình](#8-danh-sách-nút-bấm--màn-hình)
9. [Lộ trình triển khai 4 giai đoạn](#9-lộ-trình-triển-khai)

---

## 1. TỔNG QUAN

Hệ thống **AgriGuard-IoT** là giải pháp phần mềm thông minh toàn diện bao gồm:

- **Web Command Center** (React.js + Vite): Bảng điều khiển trung tâm trên máy tính / máy chiếu.
- **Mobile Field Station** (React PWA): Trạm thực địa cầm tay trên điện thoại — quét mã QR, không cần cài app.
- **Backend AI Engine** (FastAPI + LightGBM): Máy chủ suy luận AI, WebSocket Hub, REST API chuẩn quốc tế.
- **Hybrid AI Chatbot** (Google Gemini API + Bộ tri thức Nông học nội bộ): Trợ lý chuyên gia cây trồng, có bộ lọc chủ đề, hoạt động kể cả mất mạng.
- **Cơ sở dữ liệu PostgreSQL** (`agri_iot_db`): Lưu trữ lịch sử chẩn đoán, tài khoản người dùng, nhật ký Big Data.

### Sơ đồ kiến trúc tổng quan:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NGƯỜI DÙNG CUỐI (END USERS)                         │
│     💻 Giảng viên / Admin      📱 Kỹ sư Nông nghiệp     👨‍🌾 Nông dân / Khách │
└──────────────────────┬──────────────────────┬───────────────────────────────┘
                       │                      │
          ┌────────────▼────────────┐  ┌──────▼──────────────────────┐
          │   WEB COMMAND CENTER    │  │   MOBILE FIELD STATION (PWA) │
          │   React.js + Vite       │  │   React PWA (Quét mã QR)     │
          │   http://localhost:5173 │  │   http://localhost:5173/mobile│
          └────────────┬────────────┘  └──────┬───────────────────────┘
                       │                      │
                       └──────────┬───────────┘
                                  │ REST API + WebSockets
                                  ▼
                    ┌─────────────────────────────────┐
                    │    FASTAPI BACKEND ENGINE        │
                    │    http://localhost:8000         │
                    │    ├── /api/auth   (Xác thực)   │
                    │    ├── /api/predict (AI dự đoán)│
                    │    ├── /api/batch  (Big Data CSV)│
                    │    ├── /api/chat   (AI Chatbot) │
                    │    └── /ws/live-sync (WebSocket) │
                    └──────────┬──────────────────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐
    │ PostgreSQL   │  │ LightGBM     │  │ Google Gemini API│
    │ agri_iot_db  │  │ best_eco_    │  │ (AI Chatbot)     │
    │ Port: 5432   │  │ model.pkl    │  │ + Tri thức nội bộ│
    └──────────────┘  └──────────────┘  └──────────────────┘
```

---

## 2. CÔNG NGHỆ & CẤU TRÚC THƯ MỤC

### Bảng công nghệ đầy đủ:

| Hạng mục | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Frontend (Web + Mobile)** | React.js 19 + Vite 8 | Giao diện Web bảng điều khiển + Mobile PWA quét QR |
| **Icon & UI** | Lucide React + CSS Glassmorphism | Biểu tượng hiện đại, giao diện kính mờ cao cấp |
| **Gọi API** | Axios | Gửi/nhận dữ liệu giữa React và FastAPI |
| **QR Code** | qrcode.react | Vẽ mã QR kết nối điện thoại vào phiên WebSocket |
| **Backend** | Python + FastAPI (ASGI) | Máy chủ API tốc độ cao, < 3ms phản hồi |
| **Thời gian thực** | WebSockets | Đồng bộ hai chiều Web ↔ Mobile < 50ms |
| **Cơ sở dữ liệu** | PostgreSQL 16+ + pgAdmin 4 | Lưu trữ tài khoản, lịch sử chẩn đoán, nhật ký CSV |
| **ORM** | SQLAlchemy + psycopg2 | Kết nối Python ↔ PostgreSQL |
| **AI / ML** | LightGBM (best_eco_model.pkl, 41KB) | Phân loại nguy cơ stress sinh thái cây trồng |
| **Tiền xử lý** | Scikit-Learn (preprocessor_scaler.pkl) | Chuẩn hóa đặc trưng, chống rò rỉ dữ liệu |
| **Chatbot AI** | Google Gemini API + Rule-based Engine | Trợ lý nông học thông minh, hoạt động cả offline |
| **Bảo mật** | JWT (python-jose) + Bcrypt (passlib) | Mã hóa mật khẩu, quản lý phiên đăng nhập |
| **OAuth 2.0** | Google OAuth / Authlib | Đăng nhập 1 chạm bằng Gmail |
| **Đa ngôn ngữ** | React Context (i18n) | Chuyển đổi Tiếng Việt ↔ English tức thì |

### Cấu trúc thư mục dự án hoàn chỉnh:

```
smart-agri-iot-project/
├── .gitignore
├── README.md
├── requirements.txt              ← Danh sách thư viện Python
├── venv/                         ← Môi trường ảo Python (không đẩy lên GitHub)
│
├── outputs/                      ← Thành phẩm AI từ Kaggle
│   ├── best_eco_model.pkl        ← Mô hình LightGBM chính (41 KB)
│   ├── preprocessor_scaler.pkl   ← Bộ chuẩn hóa dữ liệu
│   ├── confusion_matrix_test.png
│   ├── feature_importance.png
│   ├── pr_and_roc_curves.png
│   ├── model_benchmark_comparison.png
│   ├── loss_convergence_curve.png
│   └── plant_health_model_artifacts.zip
│
├── backend/
│   ├── schema.sql                ← Script SQL khởi tạo 3 bảng PostgreSQL
│   └── app/
│       ├── main.py               ← ✅ ĐÃ TẠO: Điểm khởi động FastAPI
│       ├── database.py           ← Kết nối PostgreSQL (SQLAlchemy)
│       ├── models.py             ← Định nghĩa các bảng dữ liệu (ORM Models)
│       ├── schemas.py            ← Pydantic schemas (validate dữ liệu đầu vào/ra)
│       ├── dependencies.py       ← Hàm kiểm tra JWT Token và phân quyền RBAC
│       ├── routers/
│       │   ├── auth.py           ← API đăng nhập, đăng ký, Google OAuth, đổi mật khẩu
│       │   ├── predict.py        ← API dự đoán nguy cơ stress (LightGBM, < 1ms)
│       │   ├── batch.py          ← API xử lý Big Data CSV (1,000-10,000 dòng)
│       │   ├── chat.py           ← API Hybrid AI Chatbot (Gemini + Nội bộ)
│       │   └── websocket.py      ← WebSocket Hub đồng bộ Web ↔ Mobile
│       └── services/
│           ├── ai_service.py     ← Nạp model, tính xác suất, phân tích nguyên nhân
│           ├── auth_service.py   ← Bcrypt mã hóa, JWT tạo/kiểm tra token
│           ├── chat_service.py   ← Bộ lọc Guardrails + Gemini + Tri thức nội bộ
│           └── batch_service.py  ← Xử lý file CSV lô lớn
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json              ← ✅ Đã có: react, axios, lucide-react, qrcode.react
    └── src/
        ├── main.jsx              ← Điểm khởi động React
        ├── App.jsx               ← Component gốc, điều phối tất cả Tab + Route
        ├── index.css             ← Design System: Biến màu CSS, Dark/Light, Glassmorphism
        ├── assets/               ← Logo, ảnh nền, icon
        ├── context/
        │   ├── AuthContext.jsx   ← Quản lý phiên đăng nhập & phân quyền RBAC
        │   ├── LanguageContext.jsx← Quản lý i18n Tiếng Việt ↔ English
        │   └── SocketContext.jsx ← Quản lý kết nối WebSocket thời gian thực
        ├── components/
        │   ├── Navbar.jsx        ← Thanh điều hướng, Logo, Theme toggle, Language, User
        │   ├── AuthModal.jsx     ← Hộp thoại Đăng nhập / Đăng ký / Google OAuth
        │   ├── RiskGauge.jsx     ← Đồng hồ đo nguy cơ SVG mượt mà (Xanh/Vàng/Đỏ)
        │   ├── SensorSliders.jsx ← Cụm thanh trượt pH, Nhiệt, Ẩm, Ô nhiễm, ...
        │   ├── RootCauseCard.jsx ← Hộp bắt bệnh + Phác đồ nông học tự động
        │   ├── MobileQRSync.jsx  ← Tạo mã QR Code động + Bảng điều khiển Mobile
        │   ├── BatchScanner.jsx  ← Kéo thả CSV, tiến trình, lọc bệnh, xuất file
        │   ├── AcademicHub.jsx   ← Table 1 & 2 + 5 biểu đồ 300 DPI Dual-Track
        │   ├── ChatWidget.jsx    ← Nút tròn Chatbot nổi góc phải, bung ra cửa sổ chat
        │   └── MobileView.jsx    ← Giao diện riêng tối ưu cho màn hình điện thoại
        └── services/
            └── api.js            ← Cấu hình Axios gọi Backend (base URL, auth header)
```

---

## 3. CƠ SỞ DỮ LIỆU POSTGRESQL

### Thông tin kết nối:
- **Tên database:** `agri_iot_db`
- **Chuỗi kết nối:** `postgresql+psycopg2://postgres:<mật_khẩu>@localhost:5432/agri_iot_db`
- **Công cụ quản trị trực quan:** pgAdmin 4

### Vì sao cần 6 bảng?

| Bảng | Lý do tồn tại | Chức năng nào tạo ra dữ liệu |
| :--- | :--- | :--- |
| `users` | Lưu tài khoản & phân quyền RBAC + cài đặt cá nhân | Đăng ký, Đăng nhập, Google OAuth, Đổi ngôn ngữ/theme |
| `sensor_diagnostics` | Lưu mỗi lần AI chẩn đoán cây | Thanh trượt Realtime Web + WebSocket Mobile |
| `batch_scan_jobs` | Lưu nhật ký mỗi lần xử lý CSV lớn | Tab Batch Upload Big Data |
| `chat_history` | Lưu toàn bộ lịch sử hội thoại Chatbot | AgriBot AI Chatbot (Web + Mobile) |
| `actuator_logs` | Lưu nhật ký mỗi lần kích hoạt thiết bị | Nút Bật Phun sương / Máy bơm qua WebSocket |
| `websocket_sessions` | Lưu phiên kết nối QR Code ↔ Mobile | Nút "Kết nối Trạm Thực địa Di động" tạo mã QR |

> **Lý do thêm bảng 6:** Khi QR Code được tạo ra, hệ thống sinh một `session_id` (ví dụ: `#AGRI-998`). Nếu không lưu vào DB thì:
> - Không kiểm soát được phiên nào đang mở / đã hết hạn
> - `actuator_logs` có cột `ws_session_id` nhưng không có bảng để tham chiếu
> - Không biết ai (user nào trên điện thoại) đã kết nối vào phiên đó

> **Lý do sửa bảng `users`:** Cài đặt ngôn ngữ và giao diện cần được lưu vào DB (không chỉ localStorage) để khi người dùng đăng nhập trên máy tính khác hoặc điện thoại, trải nghiệm vẫn nhất quán.

### Sơ đồ quan hệ 6 bảng (Entity Relationship Diagram):

```
                    ┌─────────────────┐
                    │    users        │
                    │  (id, email,    │
                    │   role,         │
                    │   theme, lang)  │
                    └────────┬────────┘
                             │ id (PRIMARY KEY)
         ┌───────────────────┼────────────────────────────────┐
         │                   │              │                  │
         ▼                   ▼              ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐
│  sensor_       │  │ batch_scan_  │  │  chat_       │  │  websocket_         │
│  diagnostics   │  │ jobs         │  │  history     │  │  sessions           │
│                │  │              │  │              │  │                     │
│ user_id ──────►│  │ user_id─────►│  │ user_id─────►│  │ web_user_id────────►│
│ source         │  │ filename     │  │ session_id   │  │ mobile_user_id─────►│
│ stress_prob    │  │ total_recs   │  │ ai_provider  │  │ session_id (PK)     │
│ root_causes    │  │ exec_time_ms │  │ is_on_topic  │  │ status              │
│ (JSONB)        │  │              │  │              │  │ expires_at          │
└────────────────┘  └──────────────┘  └──────────────┘  └──────────┬──────────┘
                                                                    │ session_id
                                                                    │
                                                          ┌─────────▼──────────┐
                                                          │   actuator_logs    │
                                                          │                    │
                                                          │ user_id ──────────►│
                                                          │ diagnostic_id ────►│
                                                          │ ws_session_id      │
                                                          │ command_type       │
                                                          │ success            │
                                                          └────────────────────┘
```

### Sơ đồ 6 bảng dữ liệu chi tiết:

```
┌──────────────────────────────────────────────────────────────────────┐
│                     BẢNG 1: users                                    │
│  Quản lý Tài khoản, Phân quyền RBAC & Cài đặt Cá nhân               │
│  📌 Tạo ra bởi: Đăng ký, Đăng nhập, Google OAuth, Đổi theme/ngôn ngữ│
├──────────────────────────────────────────────────────────────────────┤
│  id                 SERIAL PRIMARY KEY                                │
│  email              VARCHAR(255) UNIQUE NOT NULL ← Chỉ mục tìm nhanh│
│  hashed_password    VARCHAR(255)         ← NULL nếu đăng nhập Google │
│  full_name          VARCHAR(100) NOT NULL                             │
│  avatar_url         VARCHAR(500)                                      │
│  role               VARCHAR(20) NOT NULL ← 'admin'|'engineer'|'farmer'│
│  auth_provider      VARCHAR(50)          ← 'local' | 'google'        │
│  preferred_language VARCHAR(5)  DEFAULT 'vi' ← Ngôn ngữ ưa thích    │
│                                          ('vi' = Tiếng Việt,         │
│                                           'en' = English)            │
│  preferred_theme    VARCHAR(10) DEFAULT 'dark' ← Giao diện ưa thích  │
│                                          ('dark' hoặc 'light')       │
│  created_at         TIMESTAMP WITH TIME ZONE                          │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ 1 — N (Quan hệ một nhiều)
    ┌──────────────────────────┼──────────────────────────────────────┐
    ▼                          ▼              ▼             ▼         ▼
┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐
│ BẢNG 2   │  │   BẢNG 3     │  │ BẢNG 4   │  │ BẢNG 5   │  │   BẢNG 6     │
│sensor_   │  │batch_scan_   │  │chat_     │  │actuator_ │  │websocket_    │
│diagnost. │  │jobs          │  │history   │  │logs      │  │sessions      │
└──────────┘  └──────────────┘  └──────────┘  └──────────┘  └──────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                  BẢNG 2: sensor_diagnostics                          │
│  Lịch sử Chẩn đoán AI từng lần đo cảm biến                          │
│  📌 Tạo ra bởi: Thanh trượt Realtime + WebSocket Mobile             │
├──────────────────────────────────────────────────────────────────────┤
│  id                    BIGSERIAL PRIMARY KEY                         │
│  user_id               INTEGER → users(id)                           │
│  source                VARCHAR(20)  ← 'web' | 'mobile_qr'           │
│  timestamp             TIMESTAMP  ← Chỉ mục tìm theo thời gian      │
│  soil_ph               REAL                                          │
│  soil_moisture         REAL                                          │
│  air_temp_C            REAL                                          │
│  sunlight_hours        REAL                                          │
│  pollution_index       REAL                                          │
│  vegetation_density    REAL                                          │
│  elevation_m           REAL                                          │
│  proximity_to_water_m  REAL                                          │
│  season                VARCHAR(20)                                   │
│  plant_species         VARCHAR(50)                                   │
│  stress_probability    REAL        ← Xác suất LightGBM dự đoán      │
│  is_stress             BOOLEAN     ← TRUE: Bị stress, FALSE: Khỏe   │
│  risk_level            VARCHAR(20) ← 'Optimal' | 'Warning' | 'Critical' │
│  root_causes           JSONB       ← Danh sách nguyên nhân gốc rễ   │
│  remediation           TEXT        ← Phác đồ xử lý nông học         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   BẢNG 3: batch_scan_jobs                            │
│  Nhật ký Quét Lô Dữ liệu Lớn CSV (Big Data Jobs)                    │
│  📌 Tạo ra bởi: Tab Batch Upload Big Data                           │
├──────────────────────────────────────────────────────────────────────┤
│  id                SERIAL PRIMARY KEY                                │
│  user_id           INTEGER → users(id)                               │
│  filename          VARCHAR(255)   ← Tên file CSV đã tải lên         │
│  total_records     INTEGER        ← Tổng số dòng dữ liệu trong file │
│  stress_count      INTEGER        ← Số cây bị stress phát hiện      │
│  healthy_count     INTEGER        ← Số cây khỏe mạnh                │
│  execution_time_ms REAL           ← Thời gian xử lý toàn bộ file    │
│  created_at        TIMESTAMP                                         │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   BẢNG 4: chat_history                               │
│  Lịch sử Toàn bộ Hội thoại với AgriBot AI                           │
│  📌 Tạo ra bởi: Chatbot AI Widget (Web + Mobile)                    │
├──────────────────────────────────────────────────────────────────────┤
│  id              BIGSERIAL PRIMARY KEY                               │
│  user_id         INTEGER → users(id)  ← NULL nếu chưa đăng nhập     │
│  session_id      VARCHAR(100)         ← ID phiên hội thoại           │
│  role            VARCHAR(10)          ← 'user' | 'bot'              │
│  message         TEXT NOT NULL        ← Nội dung tin nhắn người dùng│
│  response        TEXT                 ← Câu trả lời của AgriBot      │
│  ai_provider     VARCHAR(20)          ← 'gemini' | 'internal'       │
│                                            (gemini: có mạng,        │
│                                             internal: mất mạng)      │
│  is_on_topic     BOOLEAN              ← TRUE: đúng chủ đề cây trồng │
│                                         FALSE: ngoài luồng bị từ chối│
│  response_time_ms REAL               ← Thời gian AI phản hồi (ms)   │
│  timestamp       TIMESTAMP WITH TIME ZONE                            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   BẢNG 5: actuator_logs                              │
│  Nhật ký Kích hoạt Thiết bị Cứu Cây (Actuator Command History)      │
│  📌 Tạo ra bởi: Nút Bật/Tắt Phun sương, Máy bơm qua WebSocket      │
├──────────────────────────────────────────────────────────────────────┤
│  id              SERIAL PRIMARY KEY                                  │
│  user_id         INTEGER → users(id)                                 │
│  diagnostic_id   BIGINT → sensor_diagnostics(id) ← Liên kết với     │
│                                                    chẩn đoán gây ra │
│                                                    hành động này     │
│  command_type    VARCHAR(50)   ← 'irrigation'    (Tưới nước)        │
│                                   'misting'      (Phun sương)        │
│                                   'fertilizer'   (Bón phân)         │
│                                   'alert_notify' (Gửi cảnh báo)     │
│  triggered_by    VARCHAR(20)   ← 'web_button' | 'mobile_button'     │
│  target_device   VARCHAR(100)  ← Tên thiết bị / vùng canh tác       │
│  duration_sec    INTEGER       ← Thời gian kích hoạt thiết bị (giây)│
│  success         BOOLEAN       ← TRUE: Thực thi thành công          │
│  error_message   TEXT          ← Lý do lỗi nếu thất bại (NULL nếu OK)│
│  ws_session_id   VARCHAR(100)  ← ID phiên WebSocket QR liên quan    │
│  timestamp       TIMESTAMP WITH TIME ZONE                            │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                   BẢNG 6: websocket_sessions                         │
│  Quản lý Phiên Kết nối QR Code ↔ Trạm Mobile Thực địa               │
│  📌 Tạo ra bởi: Nút "Kết nối Trạm Thực địa Di động" (Web)           │
│  📌 Đóng bởi: Hết hạn (30 phút) hoặc người dùng ngắt kết nối        │
├──────────────────────────────────────────────────────────────────────┤
│  id              SERIAL PRIMARY KEY                                  │
│  session_id      VARCHAR(100) UNIQUE NOT NULL ← Mã QR định danh     │
│                                               (VD: 'AGRI-998-XK2')  │
│  web_user_id     INTEGER → users(id)          ← Người tạo QR trên Web│
│  mobile_user_id  INTEGER → users(id)          ← Người quét QR       │
│                                                 (NULL: chưa ai quét)│
│  status          VARCHAR(20)  ← 'pending'   : QR đã tạo, chờ quét  │
│                                  'connected' : Đang kết nối thực địa│
│                                  'expired'   : Hết hạn (> 30 phút)  │
│                                  'closed'    : Người dùng ngắt       │
│  qr_payload      TEXT         ← Nội dung mã hóa trong QR            │
│  created_at      TIMESTAMP WITH TIME ZONE ← Thời điểm tạo QR        │
│  expires_at      TIMESTAMP WITH TIME ZONE ← Thời điểm hết hạn       │
│  connected_at    TIMESTAMP                ← Thời điểm Mobile kết nối│
│  last_ping_at    TIMESTAMP                ← Ping cuối (kiểm tra sống)│
│  device_info     VARCHAR(255)             ← Loại điện thoại kết nối  │
└──────────────────────────────────────────────────────────────────────┘
```

### Tài khoản mẫu seed sẵn (Dùng để demo đồ án):
| Tài khoản | Mật khẩu | Vai trò | Quyền hạn |
| :--- | :--- | :--- | :--- |
| `admin@agri-iot.vn` | `admin123` | Admin | Toàn quyền hệ thống |
| `engineer@agri-iot.vn` | `engineer123` | Engineer | Điều khiển cảm biến, kích hoạt thiết bị |
| `farmer@agri-iot.vn` | `farmer123` | Farmer | Xem trạng thái, dùng chatbot |

---

## 4. HỆ THỐNG XÁC THỰC & PHÂN QUYỀN

### Sơ đồ phân quyền 3 cấp (RBAC):

```
                    ┌──────────────────────────────────────────┐
                    │         VAI TRÒ: ADMIN / HỘI ĐỒNG        │
                    │         (role = 'admin')                  │
                    └──────────────────────────────────────────┘
                    ✅ Xem toàn bộ dữ liệu và phân hệ
                    ✅ Truy cập Báo cáo Dual-Track học thuật
                    ✅ Nạp file Big Data CSV (1k-10k dòng)
                    ✅ Tải trọn gói Artifacts (.ZIP)
                    ✅ Quản trị tài khoản người dùng
                    ✅ Xem nhật ký hệ thống đầy đủ
                    ✅ Dùng Chatbot AI nông học

                    ┌──────────────────────────────────────────┐
                    │     VAI TRÒ: KỸ SƯ NÔNG NGHIỆP           │
                    │     (role = 'engineer')                   │
                    └──────────────────────────────────────────┘
                    ✅ Dùng Thanh trượt Cảm biến Realtime
                    ✅ Xem Đồng hồ đo nguy cơ (Risk Gauge)
                    ✅ Xem phân tích nguyên nhân + phác đồ
                    ✅ Kết nối Trạm Thực địa Mobile qua QR
                    ✅ Kích hoạt thiết bị cứu cây (Actuators)
                    ✅ Xuất báo cáo kết quả chẩn đoán CSV
                    ✅ Dùng Chatbot AI nông học
                    ❌ Không được quản trị tài khoản
                    ❌ Không được nạp Big Data batch

                    ┌──────────────────────────────────────────┐
                    │     VAI TRÒ: NÔNG DÂN / KHÁCH            │
                    │     (role = 'farmer')                     │
                    └──────────────────────────────────────────┘
                    ✅ Xem Đồng hồ đo sức khỏe cây (chỉ đọc)
                    ✅ Xem Đèn trạng thái (Xanh / Vàng / Đỏ)
                    ✅ Xem khuyến nghị nông học cơ bản
                    ✅ Dùng Chatbot AI nông học
                    ❌ Không điều khiển cảm biến hay thanh trượt
                    ❌ Không kích hoạt thiết bị
                    ❌ Không xem báo cáo học thuật chi tiết
```

### Luồng xác thực JWT (Token-based Auth):
```
[Người dùng đăng nhập]
        │
        ▼
[FastAPI /api/auth/login]
  → Kiểm tra email/pass (Bcrypt)
  → Tra cứu bảng users trong PostgreSQL
  → Tạo JWT Token (hết hạn sau 24 giờ)
        │
        ▼
[Trình duyệt / Điện thoại]
  → Lưu JWT vào localStorage
  → Mỗi request tiếp theo đính kèm:
    Header: Authorization: Bearer <JWT>
        │
        ▼
[FastAPI kiểm tra mỗi request]
  → Giải mã JWT → Xác định role
  → Cho phép hoặc từ chối truy cập
```

---

## 5. LUỒNG HOẠT ĐỘNG CHI TIẾT

### LUỒNG 1: ĐĂNG NHẬP / ĐĂNG KÝ
```
[Trang chủ] → Bấm nút [Đăng nhập]
        │
        ├── (Chọn) Đăng nhập bằng Email & Mật khẩu
        │       → Nhập email + mật khẩu → Bấm [Xác nhận]
        │       → FastAPI: POST /api/auth/login
        │       → Bcrypt kiểm tra mật khẩu
        │       → Tạo JWT Token → Lưu vào localStorage
        │       → Cập nhật AuthContext → Mở khóa giao diện
        │
        ├── (Chọn) Đăng nhập bằng Google (1 chạm)
        │       → Bấm [Đăng nhập với Google]
        │       → Chuyển hướng đến Google OAuth 2.0
        │       → Google xác nhận tài khoản Gmail
        │       → Trả về Authorization Code
        │       → FastAPI: POST /api/auth/google
        │       → Tạo/cập nhật bảng users (auth_provider = 'google')
        │       → Tạo JWT Token → Lưu vào localStorage
        │       → Mở khóa giao diện theo role
        │
        └── (Chọn) Nút Quick Demo (Dành riêng cho thi đồ án)
                → [Đăng nhập nhanh - Admin]
                → [Đăng nhập nhanh - Kỹ sư]
                → [Đăng nhập nhanh - Nông dân]
                → Tự động điền email+pass và đăng nhập ngay
```

---

### LUỒNG 2: CHẨN ĐOÁN NGUY CƠ STRESS CÂY TRỒNG (REALTIME)
```
[Tab: Chẩn đoán Realtime]
  → Component: SensorSliders.jsx + RiskGauge.jsx
        │
        ├── Người dùng kéo Thanh trượt:
        │   soil_ph, soil_moisture, air_temp_C,
        │   sunlight_hours, pollution_index,
        │   vegetation_density, elevation_m,
        │   proximity_to_water_m, season, plant_species
        │
        ▼
  [Axios gửi POST /api/predict với dữ liệu cảm biến]
        │
        ▼
  [FastAPI ai_service.py]
        │ → Tính 4 đặc trưng kỹ thuật nông học:
        │   soil_acidity_stress = |soil_ph - 6.5|
        │   drought_risk_index = air_temp_C / (soil_moisture + 1e-5)
        │   water_access_friction = proximity_to_water_m / (elevation_m + 10)
        │   pollution_vulnerability = pollution_index * (1 - vegetation_density)
        │ → Chuẩn hóa bằng preprocessor_scaler.pkl
        │ → LightGBM dự đoán: stress_probability (0.00 → 1.00)
        │ → Áp ngưỡng T* = 0.34: is_stress (True/False)
        │ → Xác định risk_level: 'Optimal' / 'Warning' / 'Critical'
        │ → Phân tích nguyên nhân gốc rễ (root_causes)
        │ → Tạo phác đồ can thiệp (remediation)
        │ → Lưu vào bảng sensor_diagnostics (PostgreSQL)
        │
        ▼
  [React cập nhật giao diện tức thì]
        │
        ├── Đồng hồ RiskGauge:
        │   🟢 Xanh (P < 0.20): "CÂY ĐANG PHÁT TRIỂN TỐI ƯU"
        │   🟡 Vàng (0.20 ≤ P < 0.34): "CẢNH BÁO SỚM — MÔI TRƯỜNG ĐANG XẤU"
        │   🔴 Đỏ (P ≥ 0.34): "STRESS NGUY CẤP — CẦN CAN THIỆP NGAY"
        │
        └── RootCauseCard:
            → Hiển thị danh sách nguyên nhân phát hiện
            → Hiển thị phác đồ xử lý chi tiết:
              pH thấp → Bón vôi CaCO3
              Nhiệt cao & Ẩm thấp → Tưới phun sương
              Ô nhiễm cao → Phun rửa tán lá
              Cạn nước → Bồn tích nước + Mulching
```

---

### LUỒNG 3: KẾT NỐI MOBILE QUA MÃ QR CODE (WEB ↔ MOBILE)
```
[Web: Bấm nút "Kết nối Trạm Thực địa Di động"]
  → Component: MobileQRSync.jsx
        │
        ▼
  [Backend WebSocket tạo Session ID: #AGRI-998]
  [React vẽ mã QR Code chứa link + Session ID]
        │
        ▼
  [Người dùng cầm điện thoại quét mã QR]
        │
        ▼
  [Điện thoại tự mở React Mobile View (MobileView.jsx)]
  [Yêu cầu đăng nhập nếu chưa có JWT Token]
        │
  ┌─────▼─────────────────────────────────────────┐
  │ TRẠM THỰC ĐỊA DI ĐỘNG đã kết nối!             │
  │ WebSocket Session #AGRI-998 đang hoạt động    │
  └─────┬─────────────────────────────────────────┘
        │
  CHIỀU 1: Điện thoại → Web (Realtime < 50ms)
        ├── Kéo thanh trượt nhiệt độ lên 39°C trên điện thoại
        ├── WebSocket bắn gói JSON: {sensor: "temp", value: 39}
        ├── Backend broadcast sang màn hình Web
        └── Kim đồng hồ trên máy chiếu giật nảy sang vùng ĐỎ!
            Còi cảnh báo phát lên! Hộp Root-Cause cập nhật!

  CHIỀU 2: Web → Điện thoại (Haptic Feedback)
        ├── Bấm nút "Kích hoạt Phun sương cứu cây" trên máy tính
        ├── WebSocket bắn lệnh sang điện thoại
        ├── React Mobile kích hoạt Haptic Vibration API
        └── Điện thoại rung lên + hiển thị thông báo:
            "✅ Đã kích hoạt hệ thống tưới thành công!"
```

---

### LUỒNG 4: QUÉT LÔ DỮ LIỆU LỚN (BIG DATA BATCH CSV)
```
[Tab: Quét Hàng Loạt Big Data]
  → Component: BatchScanner.jsx
        │
        ├── Kéo thả file CSV (tối đa 10,000 dòng) vào vùng Drop Zone
        │   (hoặc bấm nút [Chọn file CSV])
        │
        ▼
  [Axios gửi POST /api/batch + file CSV multipart]
        │
        ▼
  [Backend batch_service.py]
        │ → Đọc toàn bộ file CSV bằng Pandas
        │ → Xử lý từng dòng qua pipeline AI (LightGBM)
        │ → Đo thời gian thực thi (execution_time_ms)
        │ → Tính: tổng cây, cây bị stress, cây khỏe, tốc độ (records/giây)
        │ → Lưu vào bảng batch_scan_jobs (PostgreSQL)
        │
        ▼
  [React cập nhật giao diện]
        │ → Thanh tiến trình (Progress bar) hiển thị % hoàn thành
        │ → Bảng kết quả tổng hợp:
        │     Tổng: 5,000 cây | Stress: 1,234 (24.7%) | Khỏe: 3,766 (75.3%)
        │     Tốc độ: 4,218 records/giây | Thời gian: 1.18 giây
        │
        ├── [Bộ lọc] Bấm "Chỉ hiển thị cây bị bệnh"
        │     → Lọc danh sách chỉ còn các cây nguy cấp
        │
        └── [Xuất kết quả] Bấm "Tải xuống CSV kết quả"
              → Tải file predictions_export.csv về máy
```

---

### LUỒNG 5: HYBRID AI CHATBOT (GEMINI + TRI THỨC NỘI BỘ)
```
[Nút tròn ChatBot nổi góc dưới phải màn hình]
  → Bấm vào → Cửa sổ chat bung ra (Web: pop-up / Mobile: toàn màn hình)
        │
        ├── Giao diện Chat:
        │   - Tin nhắn chào mừng: "Xin chào! Tôi là AgriBot 🌿"
        │   - Gợi ý câu hỏi nhanh (Quick Replies):
        │     [Cây bị vàng lá?] [pH đất bao nhiêu là tốt?] [Cây héo do gì?]
        │
        ├── Người dùng gõ câu hỏi và bấm Gửi (hoặc nhấn Enter)
        │
        ▼
  [Axios gửi POST /api/chat: {message: "..."}]
        │
        ▼
  [Backend chat_service.py: BỘ LỌC GUARDRAILS]
        │
        ├── (Không liên quan cây trồng)
        │     → Trả về: "Xin lỗi, tôi chỉ hỗ trợ sức khỏe cây trồng! 🌱"
        │
        └── (Liên quan cây trồng / đất / nông nghiệp)
                │
                ├── [ƯU TIÊN 1] Kết nối Google Gemini API
                │     → System Prompt: "Bạn là chuyên gia nông học AgriGuard..."
                │     → Guardrails: Chỉ trả lời chủ đề cây trồng
                │     → Trả về câu trả lời thông minh, chi tiết
                │
                └── [DỰ PHÒNG: Nếu mất mạng / Gemini lỗi]
                      → Tra cứu Bộ tri thức Nông học nội bộ (Rule-based)
                      → Bộ tri thức 100+ bệnh cây trồng từ dataset 200k dòng
                      → Trả về câu trả lời chuẩn xác từ cơ sở tri thức
                      → Hoạt động 100% khi mất internet — ĐẢM BẢO không xịt khi thi!
```

---

### LUỒNG 6: TRUNG TÂM BÁO CÁO HỌC THUẬT (DUAL-TRACK ACADEMIC HUB)
```
[Tab: Báo cáo Học thuật]
  → Component: AcademicHub.jsx
  → Chỉ Admin & Engineer mới thấy đầy đủ
        │
        ├── Bảng Table 1 (Track 1):
        │   "BẰNG CHỨNG: Nhãn gốc plant_health là NHIỄU NGẪU NHIÊN"
        │   ROC-AUC ≈ 0.50 trên 4 mô hình (Dummy, Logistic, DT, LightGBM)
        │
        ├── Bảng Table 2 (Track 2):
        │   "ĐỐI SÁNH CÔNG BẰNG: LightGBM đạt Precision 95.05%"
        │   trên bài toán eco-stress thực tế (5% nhiễu cảm biến)
        │
        ├── 5 Biểu đồ Khoa học Chuẩn Ấn phẩm (300 DPI):
        │   [1] Confusion Matrix (Ma trận nhầm lẫn)
        │   [2] Feature Importance (Tầm quan trọng đặc trưng)
        │   [3] PR & ROC Curves (Đường cong Precision-Recall & ROC)
        │   [4] Model Benchmark Comparison (So sánh 4 mô hình)
        │   [5] Loss Convergence Curve (Đường cong hội tụ học)
        │   → Bấm vào ảnh → Mở modal phóng to full màn hình
        │   → Bấm nút [Tải ảnh PNG] → Download về máy
        │
        └── [Tải trọn gói Artifacts ZIP]
              → Bấm nút "Tải Toàn bộ Artifacts (1.50 MB)"
              → Download file plant_health_model_artifacts.zip
```

---

### LUỒNG 7: ĐỔI NGÔN NGỮ (i18n: Tiếng Việt ↔ English)
```
╔═════════════════════════════════════════════╗
║   XẢY RA TRÊN CẢ WEB VÀ MOBILE (PHƯƠNG ÁN A)   ║
╚═════════════════════════════════════════════╝

[Web: Navbar] → Bấm nút [🇻🇳 VI / 🇬🇧 EN]
[Mobile: Header] → Bấm nút [🇻🇳 VI / 🇬🇧 EN] ← Nút riêng trên Mobile (Phương án A)
        │
        ▼
  LanguageContext.jsx cập nhật state toàn cục
        │
        ├── Cập nhật giao diện tức thì (KHÔNG reload trang)
        │     Áp dụng cho: Nhãn nút, Tiêu đề, Mô tả, Thông báo lỗi,
        │                  Kết quả chẩn đoán, Phác đồ nông học
        │
        └── Nếu đã đăng nhập: Gọi PATCH /api/users/preferences
              → FastAPI cập nhật: UPDATE users
                SET preferred_language = 'en'
                WHERE id = <user_id>
              → Lần sau đăng nhập trên máy khác / điện thoại khác
                ⇒ Tự động hiện đúng ngôn ngữ đã chọn, không cần chọn lại!
```

---

### LUỒNG 8: CHUYỂN ĐỔI GIAO DIỆN TỐI / SÁNG (Dark / Light Theme)
```
╔═════════════════════════════════════════════╗
║   XẢY RA TRÊN CẢ WEB VÀ MOBILE                   ║
╚═════════════════════════════════════════════╝

[Web: Navbar] → Bấm nút [🌙 / ☀️]
[Mobile: Header] → Bấm nút [🌙 / ☀️]
        │
        ▼
  Thêm/bỏ class 'dark' vào thẻ <html>
        │
        ├── CSS Variables tự động chuyển đổi toàn bộ màu sắc:
        │     --bg-primary, --text-primary, --glass-bg, --border-color...
        │     Áp dụng tức thì, không reload
        │
        └── Nếu đã đăng nhập: Gọi PATCH /api/users/preferences
              → FastAPI cập nhật: UPDATE users
                SET preferred_theme = 'light'
                WHERE id = <user_id>
              → Lần sau đăng nhập trên máy khác / điện thoại khác
                ⇒ Tự động hiện đúng giao diện đã chọn!
```

---

## 6. KIẾN TRÚC WEB ↔ MOBILE

### Điện thoại là PWA — Không cần cài App, chỉ cần quét QR:
```
MÁY TÍNH (Web)                      ĐIỆN THOẠI (Mobile PWA)
─────────────────────               ─────────────────────────
📺 Màn hình máy chiếu lớn          📱 Màn hình điện thoại nhỏ
─────────────────────────           ─────────────────────────
[QR Code xuất hiện]    ──quét──►   [Mở trình duyệt ngay]
[Bảng điều khiển đầy đủ]           [Đăng nhập với phân quyền]
[Đồng hồ đo rủi ro lớn]            [Thanh trượt cảm biến]
[Bảng kết quả chi tiết]            [Nút kích hoạt thiết bị]
                                    [Chatbot AI nông học]

        ◄═══════ WebSocket 2 chiều < 50ms ════════►
```

### Giao diện Mobile đăng nhập đầy đủ:
```
[Mở liên kết QR trên điện thoại]
        │
        ├── Nếu CHƯA có JWT → Hiện trang Đăng nhập Mobile
        │     → Email & Mật khẩu
        │     → Google OAuth
        │     → Quick Demo Login (Admin / Engineer / Farmer)
        │
        ▼
[Màn hình Mobile chính theo Role]
        │
        ├── Role: Farmer (Nông dân)
        │   ┌─────────────────────────────┐
        │   │ 🌿 Trạng thái cây hôm nay  │
        │   │ ●  Xanh: ĐANG TỐT ✅        │
        │   │                             │
        │   │ 🌡 Nhiệt: 25°C              │
        │   │ 💧 Ẩm: 65%                 │
        │   │ pH: 6.8                    │
        │   │                             │
        │   │ 💬 Hỏi AgriBot AI          │
        │   └─────────────────────────────┘
        │
        └── Role: Engineer (Kỹ sư)
            ┌─────────────────────────────┐
            │ ⚡ Trạm Thực Địa #AGRI-998  │
            │ 🔴 STRESS NGUY CẤP!        │
            │                             │
            │ ── Nhiệt độ: [  39°C ▶] ── │
            │ ── Độ ẩm:    [  10%  ▶] ── │
            │                             │
            │ [💧 Bật Phun Sương]         │
            │ [📤 Gửi Cảnh báo về Web]   │
            │ [💬 Hỏi AgriBot AI]        │
            └─────────────────────────────┘
```

---

## 7. HYBRID AI CHATBOT

### Kiến trúc Hybrid (2 tầng bảo hiểm):
```
                    [CÂU HỎI NGƯỜI DÙNG]
                            │
                   ─────────▼─────────
                   BỘ LỌC GUARDRAILS
                  (Kiểm tra chủ đề)
                   ─────────┬─────────
                            │
            ┌───────────────┴───────────────┐
            ▼ NGOÀI LUỒNG                   ▼ LIÊN QUAN CÂY TRỒNG
   "Tôi chỉ hỗ trợ sức              ────────────────────────
   khỏe cây trồng! 🌱"              [TẦNG 1: GOOGLE GEMINI API]
                                    → Thông minh, sáng tạo, linh hoạt
                                    → Cần kết nối internet
                                            │
                                       Nếu lỗi/mất mạng
                                            │
                                            ▼
                                    [TẦNG 2: TRI THỨC NỘI BỘ]
                                    → 100+ bệnh cây trồng
                                    → Rule-based từ 200k dataset
                                    → Hoạt động 100% offline
                                    → KHÔNG BAO GIỜ xịt khi thi!
```

### Ví dụ hội thoại:
```
👤 User: "Cây bị vàng lá, độ ẩm 10%, pH 4.8 thì xử lý sao?"

🤖 AgriBot: "Chào bạn! Tôi phát hiện 2 vấn đề nghiêm trọng:
  ⚠️ Đất chua (pH 4.8 < 5.5): Rễ bị ức chế hấp thụ dinh dưỡng
  ⚠️ Hạn hán (Độ ẩm 10% < 15%): Cây mất nước nghiêm trọng

  📋 Phác đồ xử lý tức thì:
  1. Bón 500kg vôi nông nghiệp (CaCO3)/ha để khử chua
  2. Tưới nhỏ giọt sáng sớm, 3 lần/ngày
  3. Phủ mùn hữu cơ gốc cây giữ ẩm
  4. Bổ sung chế phẩm vi sinh rễ sau 7 ngày"

👤 User: "Ai vô địch World Cup 2022?"

🤖 AgriBot: "Xin lỗi bạn! Tôi là AgriBot — Trợ lý AI chuyên
  gia sức khỏe cây trồng của AgriGuard-IoT 🌿
  Tôi chỉ có thể hỗ trợ các vấn đề về cây trồng,
  đất, phân bón và môi trường sinh thái.
  Hãy hỏi tôi về cây trồng nhé!"
```

---

## 8. DANH SÁCH NÚT BẤM & MÀN HÌNH

### Tất cả nút bấm trên giao diện Web:

| Nút bấm | Vị trí | Hành động | Yêu cầu quyền |
| :--- | :--- | :--- | :--- |
| **[Đăng nhập]** | Navbar | Mở AuthModal.jsx | Tất cả |
| **[Đăng nhập bằng Google]** | AuthModal | Chuyển hướng OAuth | Tất cả |
| **[Quick Demo: Admin/Engineer/Farmer]** | AuthModal | Tự điền + đăng nhập | Tất cả |
| **[Đăng xuất]** | Navbar (User Avatar) | Xóa JWT, reset AuthContext | Đã đăng nhập |
| **[🌙/☀️ Theme]** | Navbar | Chuyển Dark/Light | Tất cả |
| **[🇻🇳/🇬🇧 Ngôn ngữ]** | Navbar | Chuyển VI/EN tức thì | Tất cả |
| **[Thanh trượt Cảm biến]** | Tab Realtime | Gọi POST /api/predict | Engineer+ |
| **[Kết nối Trạm Di động]** | Tab Realtime | Tạo QR Code + mở WebSocket | Engineer+ |
| **[Kích hoạt Phun sương]** | Tab Realtime | WebSocket → Mobile Haptic | Engineer+ |
| **[Kích hoạt Máy bơm]** | Tab Realtime | WebSocket → Mobile Haptic | Engineer+ |
| **[Chọn file CSV / Drop Zone]** | Tab Batch | Upload file Big Data | Admin |
| **[Chỉ xem cây bị bệnh]** | Tab Batch | Lọc kết quả stress | Admin |
| **[Tải CSV kết quả]** | Tab Batch | Download predictions.csv | Admin |
| **[Phóng to biểu đồ]** | Tab Academic | Mở modal full màn hình | Admin/Eng |
| **[Tải ảnh PNG]** | Tab Academic | Download biểu đồ 300 DPI | Admin/Eng |
| **[Tải Artifacts ZIP]** | Tab Academic | Download model artifacts | Admin/Eng |
| **[💬 ChatBot]** | Góc phải (nổi) | Mở cửa sổ AgriBot AI | Tất cả |
| **[Gửi tin nhắn]** | ChatWidget | POST /api/chat | Tất cả |
| **[Quick Reply buttons]** | ChatWidget | Gửi câu hỏi gợi ý nhanh | Tất cả |

### Tất cả nút bấm trên giao diện Mobile:

| Nút bấm | Vị trí | Hành động | Yêu cầu quyền |
| :--- | :--- | :--- | :--- |
| **[Đăng nhập Email/Pass]** | Trang đăng nhập Mobile | JWT Auth | Tất cả |
| **[Đăng nhập Google]** | Trang đăng nhập Mobile | OAuth | Tất cả |
| **[Quick Demo]** | Trang đăng nhập Mobile | Auto login | Tất cả |
| **[Thanh trượt Cảm biến]** | Mobile Field View | WebSocket → Web | Engineer+ |
| **[💧 Bật Phun sương]** | Mobile Field View | WebSocket lệnh → `actuator_logs` | Engineer+ |
| **[📤 Gửi Cảnh báo]** | Mobile Field View | WebSocket broadcast | Engineer+ |
| **[💬 AgriBot AI]** | Tất cả Mobile Views | Mở chat toàn màn hình | Tất cả |
| **[Gửi tin nhắn]** | Mobile ChatBot | POST /api/chat → `chat_history` | Tất cả |
| **[🇻🇳 VI / 🇬🇧 EN Ngôn ngữ]** | Header Mobile | PATCH /api/users/preferences → `users.preferred_language` | Tất cả |
| **[🌙 / ☀️ Theme]** | Header Mobile | PATCH /api/users/preferences → `users.preferred_theme` | Tất cả |
| **[Đăng xuất]** | Header Mobile | Xóa JWT khỏi localStorage | Đã đăng nhập |

---

## 8b. BẢNG ĐỐI CHIếU: HOẠT ĐỘNG → BẢNG DB

### Hoạt động trên WEB → Lưu vào bảng nào:

| Hành động trên Web | Bảng DB được ghi | Cột quan trọng |
| :--- | :--- | :--- |
| Đăng ký tài khoản mới | `users` | Tất cả cột |
| Đăng nhập Email/Pass | `users` *(đọc)* | — |
| Đăng nhập Google OAuth | `users` *(ghi nếu chưa có)* | `auth_provider = 'google'` |
| Đổi ngôn ngữ VI/EN | `users` | `preferred_language` |
| Đổi giao diện Dark/Light | `users` | `preferred_theme` |
| Kéo thanh trượt cảm biến | `sensor_diagnostics` | `source = 'web'` |
| Bấm Bật Phun sương / Máy bơm | `actuator_logs` | `triggered_by = 'web_button'` |
| Tạo mã QR Code | `websocket_sessions` | `web_user_id`, `status = 'pending'` |
| Gửi tin nhắn vào AgriBot | `chat_history` | `session_id`, `ai_provider` |
| Upload file CSV Big Data | `batch_scan_jobs` | `filename`, `total_records`, `execution_time_ms` |
| Phiên QR hết hạn (30 phút) | `websocket_sessions` | `status = 'expired'` |

### Hoạt động trên MOBILE → Lưu vào bảng nào:

| Hành động trên Mobile | Bảng DB được ghi | Cột quan trọng |
| :--- | :--- | :--- |
| Đăng nhập Email/Pass | `users` *(đọc)* | — |
| Đăng nhập Google OAuth | `users` *(ghi nếu chưa có)* | `auth_provider = 'google'` |
| Quét mã QR kết nối | `websocket_sessions` | `mobile_user_id`, `status = 'connected'`, `connected_at` |
| Kéo thanh trượt cảm biến | `sensor_diagnostics` | `source = 'mobile_qr'` |
| Bấm Bật Phun sương / Máy bơm | `actuator_logs` | `triggered_by = 'mobile_button'` |
| Gửi tin nhắn vào AgriBot | `chat_history` | `session_id`, `ai_provider` |
| Đổi ngôn ngữ VI/EN | `users` | `preferred_language` |
| Đổi giao diện Dark/Light | `users` | `preferred_theme` |
| Ngắt kết nối / Đóng phiên | `websocket_sessions` | `status = 'closed'` |
| Upload Big Data CSV | *(không có)* | Chức năng này chỉ có trên Web |

---

## 9. LỘ TRÌNH TRIỂN KHAI 4 GIAI ĐOẠN

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GIAI ĐOẠN 1: NỀN TẢNG HẠ TẦNG                        ✅ HOÀN TẤT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ✅ Khởi tạo thư mục dự án smart-agri-iot-project
 ✅ Tạo & kích hoạt môi trường ảo Python (venv)
 ✅ Cài đặt requirements.txt (14 thư viện Python)
 ✅ Khởi tạo React.js (Vite) trong frontend/
 ✅ Cài đặt lucide-react, qrcode.react, axios
 ✅ Tạo .gitignore chuẩn
 ✅ Tạo README.md
 ✅ Tạo backend/app/main.py (FastAPI entry point)
 ✅ Đẩy lên GitHub (https://github.com/thinhphan272/smart-agri-iot-dss)
 ✅ Cài đặt PostgreSQL 18 trên máy (Port 5432)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GIAI ĐOẠN 2: DATABASE + BACKEND AI ENGINE              ⏳ ĐANG LÀM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ⏳ Tạo database agri_iot_db trong PostgreSQL
 ⏳ Viết & chạy backend/schema.sql (6 bảng + seed data)
 ⏳ Viết backend/app/database.py (SQLAlchemy kết nối)
 ⏳ Viết backend/app/models.py (ORM models)
 ⏳ Viết backend/app/schemas.py (Pydantic schemas)
 ⏳ Viết backend/app/services/ai_service.py (nạp LightGBM)
 ⏳ Viết backend/app/routers/predict.py (API dự đoán)
 ⏳ Viết backend/app/services/auth_service.py (JWT+Bcrypt)
 ⏳ Viết backend/app/routers/auth.py (đăng nhập/đăng ký)
 ⏳ Viết backend/app/routers/batch.py (CSV Big Data)
 ⏳ Viết backend/app/routers/websocket.py (Realtime hub)
 ⏳ Viết backend/app/services/chat_service.py (Hybrid AI)
 ⏳ Viết backend/app/routers/chat.py (API Chatbot)
 ⏳ Kiểm thử toàn bộ API tại http://localhost:8000/docs
 ⏳ Commit & Push lên GitHub

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GIAI ĐOẠN 3: FRONTEND REACT.JS HOÀN CHỈNH             🔲 CHƯA LÀM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔲 index.css (Design System: CSS Variables, Dark/Light, Glassmorphism)
 🔲 context/AuthContext.jsx
 🔲 context/LanguageContext.jsx
 🔲 context/SocketContext.jsx
 🔲 services/api.js (Axios config)
 🔲 components/Navbar.jsx (Logo, Theme, Language, User Avatar)
 🔲 components/AuthModal.jsx (Login + Register + Google + Quick Demo)
 🔲 components/RiskGauge.jsx (Đồng hồ SVG xanh/vàng/đỏ)
 🔲 components/SensorSliders.jsx (9 thanh trượt cảm biến)
 🔲 components/RootCauseCard.jsx (Bắt bệnh + Phác đồ)
 🔲 components/MobileQRSync.jsx (QR Code + WebSocket control)
 🔲 components/MobileView.jsx (Giao diện điện thoại)
 🔲 components/BatchScanner.jsx (Upload CSV + Progress + Export)
 🔲 components/AcademicHub.jsx (Table 1&2 + 5 biểu đồ)
 🔲 components/ChatWidget.jsx (Nút tròn + Cửa sổ chat Hybrid AI)
 🔲 App.jsx (Điều phối Tab routing chính)
 🔲 Kiểm thử toàn bộ chức năng giao diện
 🔲 Commit & Push lên GitHub

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GIAI ĐOẠN 4: TÍCH HỢP + KIỂM THỬ + DEMO               🔲 CHƯA LÀM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 🔲 Kiểm thử đầu-cuối: Web ↔ Backend ↔ Database ↔ Mobile
 🔲 Kiểm thử kịch bản demo: QR → Mobile → WebSocket → Web
 🔲 Kiểm thử Hybrid AI Chatbot (cả online & offline)
 🔲 Kiểm thử phân quyền RBAC 3 vai trò
 🔲 Kiểm thử Big Data batch CSV (1,000 - 10,000 dòng)
 🔲 Tối ưu hiệu năng và UX
 🔲 Cài đặt Google Gemini API Key (biến môi trường .env)
 🔲 Hoàn thiện tài liệu README.md
 🔲 Commit lần cuối & Push tag release v1.0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
