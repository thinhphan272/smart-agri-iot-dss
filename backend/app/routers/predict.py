import os
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import SensorDiagnostic, User
from backend.app.schemas import (
    SensorPredictRequest,
    SensorPredictResponse,
    SensorDiagnosticHistoryItem
)
from backend.app.services.ai_service import ai_service, OUTPUTS_DIR
from backend.app.dependencies import security
from backend.app.services.auth_service import decode_access_token

router = APIRouter()


@router.post("/", response_model=SensorPredictResponse)
def predict_plant_health(
    request: SensorPredictRequest,
    db: Session = Depends(get_db),
    auth = Depends(security)
):
    """
    API Chẩn đoán Nguy cơ Stress Cây trồng bằng Mô hình LightGBM:
    - Tiếp nhận 9 thông số cảm biến môi trường
    - Trích xuất 4 chỉ số sinh thái nông học
    - Chuẩn hóa bằng StandardScaler
    - Dự đoán xác suất stress bằng LightGBM Booster
    - Áp dụng ngưỡng cắt tối ưu T* = 0.34
    - Bắt bệnh và kê đơn phác đồ điều trị
    - Lưu nhật ký chẩn đoán vào bảng sensor_diagnostics
    """
    # 1. Xác định người dùng gửi request (nếu có Token)
    user_id = None
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload:
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_id = user.id

    # 2. Suy luận AI qua ai_service
    ai_result = ai_service.predict(request.model_dump())

    # 3. Ghi vào cơ sở dữ liệu PostgreSQL
    diagnostic_record = SensorDiagnostic(
        user_id=user_id,
        source=request.source or "web",
        soil_ph=request.soil_ph,
        soil_moisture=request.soil_moisture,
        air_temp_C=request.air_temp_C,
        sunlight_hours=request.sunlight_hours,
        pollution_index=request.pollution_index,
        vegetation_density=request.vegetation_density,
        elevation_m=request.elevation_m,
        proximity_to_water_m=request.proximity_to_water_m,
        season=request.season,
        plant_species=request.plant_species,
        stress_probability=ai_result["stress_probability"],
        is_stress=ai_result["is_stress"],
        risk_level=ai_result["risk_level"],
        root_causes=ai_result["root_causes"],
        remediation=ai_result["remediation"]
    )
    db.add(diagnostic_record)
    db.commit()
    db.refresh(diagnostic_record)

    return SensorPredictResponse(
        stress_probability=ai_result["stress_probability"],
        is_stress=ai_result["is_stress"],
        risk_level=ai_result["risk_level"],
        root_causes=ai_result["root_causes"],
        remediation=ai_result["remediation"],
        execution_time_ms=ai_result["execution_time_ms"],
        model_source=ai_result.get("model_source", request.model_source or "lightgbm"),
        active_threshold=ai_result.get("active_threshold", 0.34),
        diagnostic_id=diagnostic_record.id,
        timestamp=diagnostic_record.timestamp
    )


@router.get("/history", response_model=List[SensorDiagnosticHistoryItem])
def get_diagnostic_history(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Lấy danh sách các lần chẩn đoán gần nhất từ trạm giám sát"""
    records = db.query(SensorDiagnostic).order_by(desc(SensorDiagnostic.timestamp)).limit(limit).all()
    return records


from fastapi.responses import FileResponse

@router.get("/metrics")
def get_academic_evaluation_metrics():
    """
    Trả về dữ liệu báo cáo khoa học đối chứng:
    - Track 1 (Raw Label): Baseline models với zero-signal
    - Track 2 (Eco-Stress): LightGBM đạt ROC-AUC 0.83, F1-Score 0.78, Accuracy 94.8%
    - Apache Spark MLlib: 4 mô hình huấn luyện phân tán trên 6 Partitions (GBT, RF, DT, LR)
    """
    data = {}
    metrics_path = os.path.join(OUTPUTS_DIR, "test_evaluation_metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    
    spark_path = os.path.join(OUTPUTS_DIR, "spark_evaluation_metrics.json")
    if os.path.exists(spark_path):
        with open(spark_path, "r", encoding="utf-8") as f:
            data["spark_mllib"] = json.load(f)

    if data:
        return data
    
    return {
        "status": "unavailable",
        "message": "Metrics file not found in outputs directory."
    }


@router.get("/download-artifacts/{target}")
def download_artifacts(target: str = "lightgbm"):
    """
    Tải gói nén Artifacts phục vụ nghiệm thu đồ án:
    - target = 'spark': spark_mllib_model_artifacts.zip
    - target = 'lightgbm' (mặc định): plant_health_model_artifacts.zip
    """
    if target.lower() == "spark":
        zip_path = os.path.join(OUTPUTS_DIR, "spark_mllib_model_artifacts.zip")
        filename = "spark_mllib_model_artifacts.zip"
    else:
        zip_path = os.path.join(OUTPUTS_DIR, "plant_health_model_artifacts.zip")
        filename = "plant_health_model_artifacts.zip"
    
    if os.path.exists(zip_path):
        return FileResponse(
            path=zip_path,
            filename=filename,
            media_type="application/zip"
        )
    raise HTTPException(status_code=404, detail=f"Artifacts package not found: {filename}")

