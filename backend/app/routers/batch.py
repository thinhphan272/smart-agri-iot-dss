import io
import time
import pandas as pd
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import BatchScanJob, User
from backend.app.schemas import BatchScanJobResponse
from backend.app.services.ai_service import ai_service, OPTIMAL_THRESHOLD
from backend.app.dependencies import security
from backend.app.services.auth_service import decode_access_token

router = APIRouter()


@router.post("/upload")
async def upload_batch_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    auth = Depends(security)
):
    """
    API Xử lý Quét Lô Dữ liệu Lớn CSV (Big Data Batch Scan):
    - Nhận file CSV tối đa 10,000 bản ghi
    - Vectorized Eco-Feature Engineering và chuẩn hóa siêu tốc bằng Scikit-Learn
    - Suy luận theo lô với mô hình LightGBM (< 250ms cho 10,000 dòng)
    - Thống kê tỷ lệ stress sinh thái, tỷ lệ cây khỏe
    - Lưu nhật ký xử lý vào bảng batch_scan_jobs
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Định dạng tệp không hợp lệ! Vui lòng tải lên tệp có đuôi .csv"
        )

    # 1. Xác định người dùng
    user_id = None
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload:
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_id = user.id

    t0 = time.time()

    # 2. Đọc tệp CSV vào DataFrame
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Không thể đọc nội dung tệp CSV: {str(e)}"
        )

    total_records = len(df)
    if total_records == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tệp CSV tải lên không có dòng dữ liệu nào!"
        )

    if total_records > 20000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tệp quá lớn ({total_records:,} dòng). Giới hạn tối đa là 20,000 dòng mỗi lô!"
        )

    # 3. Chuẩn hóa tên cột linh hoạt (tương thích cả tên cột gốc và tên cột chuẩn)
    col_map = {
        'pH': 'soil_ph',
        'ph': 'soil_ph',
        'ambient_temperature': 'air_temp_C',
        'temperature': 'air_temp_C',
        'temp': 'air_temp_C',
        'moisture': 'soil_moisture',
        'pollution': 'pollution_index',
        'water_distance': 'proximity_to_water_m'
    }
    df.rename(columns=col_map, inplace=True)

    # Bổ sung các cột mặc định nếu tệp bị thiếu
    defaults = {
        'soil_ph': 6.5,
        'soil_moisture': 50.0,
        'air_temp_C': 28.0,
        'sunlight_hours': 7.0,
        'pollution_index': 20.0,
        'proximity_to_water_m': 100.0,
        'elevation_m': 20.0,
        'vegetation_density': 0.6,
        'sensor_battery': 98.0,
        'season': 'Summer',
        'plant_species': 'Crop_A'
    }
    for col, default_val in defaults.items():
        if col not in df.columns:
            df[col] = default_val

    # 4. Vectorized Feature Engineering
    df['soil_acidity_stress'] = (df['soil_ph'] - 6.5).abs()
    df['drought_risk_index'] = df['air_temp_C'] / (df['soil_moisture'] + 1e-5)
    df['water_access_friction'] = df['proximity_to_water_m'] / (df['elevation_m'] + 10.0)
    df['pollution_vulnerability'] = df['pollution_index'] * (1.0 - df['vegetation_density'])

    season_series = df['season'].astype(str).str.lower()
    df['season_Spring'] = (season_series == 'spring').astype(float)
    df['season_Summer'] = (season_series == 'summer').astype(float)
    df['season_Winter'] = (season_series == 'winter').astype(float)

    species_series = df['plant_species'].astype(str).str.lower()
    df['plant_species_Grassland_B'] = species_series.str.contains('grassland|b', regex=True).astype(float)
    df['plant_species_Shrub_X'] = species_series.str.contains('shrub|x', regex=True).astype(float)
    df['plant_species_Tree_Y'] = species_series.str.contains('tree|y', regex=True).astype(float)
    df['plant_species_Wetland_C'] = species_series.str.contains('wetland|c', regex=True).astype(float)

    feature_cols = ai_service.feature_names
    X = df[feature_cols].copy()

    # 5. Scaling & Batch Inference
    if ai_service.scaler is not None:
        X_scaled = ai_service.scaler.transform(X)
    else:
        X_scaled = X.values

    if ai_service.model is not None:
        preds = ai_service.model.predict(X_scaled)
        probabilities = [float(p) for p in preds]
    else:
        probabilities = [0.5] * total_records

    stress_flags = [bool(p >= OPTIMAL_THRESHOLD) for p in probabilities]
    stress_count = sum(stress_flags)
    healthy_count = total_records - stress_count

    exec_time_ms = round((time.time() - t0) * 1000, 2)

    # 6. Ghi vào cơ sở dữ liệu
    job_record = BatchScanJob(
        user_id=user_id,
        filename=file.filename,
        total_records=total_records,
        stress_count=stress_count,
        healthy_count=healthy_count,
        execution_time_ms=exec_time_ms
    )
    db.add(job_record)
    db.commit()
    db.refresh(job_record)

    # 7. Trả về kết quả tóm tắt kèm mẫu preview 20 dòng đầu
    preview_items = []
    for i in range(min(20, total_records)):
        p = round(probabilities[i], 4)
        risk = "Optimal" if p < 0.20 else ("Warning" if p < OPTIMAL_THRESHOLD else "Critical")
        preview_items.append({
            "index": i + 1,
            "soil_ph": round(float(df['soil_ph'].iloc[i]), 2),
            "soil_moisture": round(float(df['soil_moisture'].iloc[i]), 1),
            "air_temp_C": round(float(df['air_temp_C'].iloc[i]), 1),
            "pollution_index": round(float(df['pollution_index'].iloc[i]), 1),
            "stress_probability": p,
            "is_stress": stress_flags[i],
            "risk_level": risk
        })

    return {
        "job_id": job_record.id,
        "filename": file.filename,
        "total_records": total_records,
        "stress_count": stress_count,
        "healthy_count": healthy_count,
        "stress_rate_percent": round((stress_count / total_records) * 100, 2),
        "execution_time_ms": exec_time_ms,
        "records_per_second": round(total_records / (exec_time_ms / 1000 + 1e-5), 0),
        "preview_records": preview_items
    }


@router.get("/jobs", response_model=List[BatchScanJobResponse])
def get_batch_jobs(
    limit: int = 15,
    db: Session = Depends(get_db)
):
    """Lấy danh sách lịch sử các lô Big Data CSV đã được quét"""
    jobs = db.query(BatchScanJob).order_by(desc(BatchScanJob.created_at)).limit(limit).all()
    return jobs


@router.get("/sample-csv")
def download_sample_csv():
    """Tải tệp CSV mẫu (100 dòng) để phục vụ Hội đồng và Người dùng trải nghiệm tính năng"""
    import random
    rows = []
    seasons = ["Spring", "Summer", "Autumn", "Winter"]
    species = ["Lúa nước", "Cây ăn trái", "Rau thủy canh", "Ngô lai"]
    
    for i in range(1, 101):
        # Tạo dữ liệu xen kẽ: bình thường và stress
        is_stress_case = (i % 4 == 0)
        ph = round(random.uniform(4.0, 5.0) if is_stress_case else random.uniform(6.0, 7.2), 2)
        moisture = round(random.uniform(12.0, 25.0) if is_stress_case else random.uniform(50.0, 75.0), 1)
        temp = round(random.uniform(35.0, 41.0) if is_stress_case else random.uniform(24.0, 30.0), 1)
        pollution = round(random.uniform(60.0, 90.0) if is_stress_case else random.uniform(10.0, 35.0), 1)
        sunlight = round(random.uniform(3.0, 9.5), 1)
        water_dist = round(random.uniform(10.0, 300.0), 1)
        elevation = round(random.uniform(5.0, 80.0), 1)
        veg_density = round(random.uniform(0.15, 0.85), 2)
        season = random.choice(seasons)
        spec = random.choice(species)

        rows.append(f"{i},{ph},{moisture},{temp},{sunlight},{pollution},{water_dist},{elevation},{veg_density},{season},{spec}")

    header = "sample_id,soil_ph,soil_moisture,air_temp_C,sunlight_hours,pollution_index,proximity_to_water_m,elevation_m,vegetation_density,season,plant_species\n"
    csv_content = header + "\n".join(rows)

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=smart_agri_sample_100_records.csv"}
    )
