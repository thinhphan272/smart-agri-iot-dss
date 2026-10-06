from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers import auth, predict, batch, chat, websocket
from backend.app.database import engine, Base

# Tự động khởi tạo schema bảng nếu chưa tồn tại (chạy được ngay cho người dùng mới)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"[DB Auto-Migration] {e}")

app = FastAPI(
    title="AgriGuard-IoT Backend API",
    description="Hệ thống Giám sát Nông nghiệp Thông minh, Chẩn đoán Nguy cơ Stress Sinh thái và Ra quyết định Nông học",
    version="2.0.0"
)


# Cấu hình CORS để Frontend React (port 5173) giao tiếp thông suốt với Backend (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import os
from fastapi.staticfiles import StaticFiles

# Đăng ký các Router nghiệp vụ
app.include_router(auth.router, prefix="/api/auth", tags=["1. Xác thực & Phân quyền (Auth & RBAC)"])
app.include_router(predict.router, prefix="/api/predict", tags=["2. Chẩn đoán & AI Engine (Predict & Diagnosis)"])
app.include_router(batch.router, prefix="/api/batch", tags=["3. Xử lý Lô Big Data CSV (Batch Processing)"])
app.include_router(chat.router, prefix="/api/chat", tags=["4. Trợ lý AI Nông học (Hybrid Chatbot)"])
app.include_router(websocket.router, tags=["5. Đồng bộ Realtime & Thiết bị (WebSocket & Actuators)"])

# Phục vụ tệp tĩnh ảnh biểu đồ và artifacts phục vụ Frontend
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
OUTPUTS_DIR = os.path.join(PROJECT_ROOT, "outputs")
if os.path.exists(OUTPUTS_DIR):
    app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

@app.get("/", tags=["Trạng thái Hệ thống"])
def read_root():
    return {
        "status": "online",
        "system": "AgriGuard-IoT Enterprise AI Engine",
        "version": "2.0.0",
        "docs_url": "http://localhost:8000/docs"
    }

