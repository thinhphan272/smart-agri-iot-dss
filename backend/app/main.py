from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.routers import auth, predict

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


# Đăng ký các Router nghiệp vụ
app.include_router(auth.router, prefix="/api/auth", tags=["1. Xác thực & Phân quyền (Auth & RBAC)"])
app.include_router(predict.router, prefix="/api/predict", tags=["2. Chẩn đoán & AI Engine (Predict & Diagnosis)"])

@app.get("/", tags=["Trạng thái Hệ thống"])
def read_root():
    return {
        "status": "online",
        "system": "AgriGuard-IoT Enterprise AI Engine",
        "version": "2.0.0",
        "docs_url": "http://localhost:8000/docs"
    }

