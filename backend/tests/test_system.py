"""
==============================================================================
AGRIGUARD-IOT: AUTOMATED END-TO-END SYSTEM INTEGRATION TEST SUITE
==============================================================================
Chạy kiểm thử tự động toàn diện 10 phân hệ nghiệp vụ:
1. Health check & Server status
2. Quick Demo Login cho 3 vai trò (Admin, Engineer, Farmer)
3. RBAC & Xác thực JWT Token (/api/auth/me)
4. AI LightGBM Engine (20 Features, Optimal Threshold T*=0.34, Chẩn đoán căn nguyên & Phác đồ)
5. PostgreSQL Audit Log & Lịch sử cảm biến
6. Khoa học dữ liệu: Đối chứng Dual-Track Metrics (Track 1 Raw vs Track 2 Eco)
7. Big Data Batch CSV Scanner (Vectorized High-Throughput Inference)
8. Nhật ký Batch Job History
9. Dynamic QR Code & Điều khiển Thiết bị Cứu cây (Bơm, Phun sương)
10. Hybrid AI Chatbot với Agricultural Guardrails (Lọc câu hỏi lạc đề)
==============================================================================
"""

import sys
import os
import io

# Đảm bảo đường dẫn import tương đối từ thư mục gốc dự án
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_full_system():
    print("\n" + "="*70)
    print("🚀 BẮT ĐẦU KIỂM THỬ TỰ ĐỘNG TOÀN DIỆN HỆ THỐNG AGRIGUARD-IOT")
    print("="*70)

    # 1. Health check
    print("\n[1/10] Kiểm tra Endpoint Trạng thái Hệ thống (Health Check)...")
    res = client.get("/")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health = res.json()
    assert health["status"] == "online"
    print(f"  ✓ Hệ thống Online - Phiên bản: {health['version']}")

    # 2. Demo Login cho 3 vai trò
    print("\n[2/10] Kiểm tra Đăng nhập nhanh 1-chạm (Admin, Kỹ sư, Nông dân)...")
    tokens = {}
    for role in ["admin", "engineer", "farmer"]:
        res = client.post("/api/auth/demo-login", json={"role": role})
        assert res.status_code == 200, f"Demo login failed for {role}: {res.text}"
        data = res.json()
        tokens[role] = data["access_token"]
        assert data["role"] == role
        print(f"  ✓ Đăng nhập thành công vai trò: [{role.upper()}] - {data['full_name']}")

    admin_header = {"Authorization": f"Bearer {tokens['admin']}"}
    engineer_header = {"Authorization": f"Bearer {tokens['engineer']}"}
    farmer_header = {"Authorization": f"Bearer {tokens['farmer']}"}

    # 3. RBAC Me Profile
    print("\n[3/10] Kiểm tra Xác thực JWT & Phân quyền Profile (/api/auth/me)...")
    res = client.get("/api/auth/me", headers=admin_header)
    assert res.status_code == 200
    assert res.json()["role"] == "admin"
    print(f"  ✓ JWT Token hợp lệ - Email: {res.json()['email']}")

    # 4. Real-time LightGBM AI
    print("\n[4/10] Kiểm tra Suy luận Trực quan LightGBM AI & Bắt bệnh Cây trồng...")
    sensor_payload = {
        "soil_ph": 4.5,
        "soil_moisture": 18.0,
        "sunlight_hours": 9.5,
        "air_temp_C": 38.5,
        "pollution_index": 72.0,
        "proximity_to_water_m": 450.0,
        "elevation_m": 120.0,
        "vegetation_density": 0.35,
        "season": "Summer",
        "plant_species": "Tree_Y"
    }
    res = client.post("/api/predict/", json=sensor_payload, headers=engineer_header)
    assert res.status_code == 200, f"Prediction failed: {res.text}"
    pred = res.json()
    assert pred["is_stress"] is True
    assert pred["risk_level"] == "Critical"
    assert len(pred["root_causes"]) >= 2
    assert "remediation" in pred
    print(f"  ✓ Suy luận thành công trong: {pred['execution_time_ms']:.2f} ms")
    print(f"    - Xác suất Stress: {pred['stress_probability']*100:.2f}% | Cấp độ rủi ro: {pred['risk_level']}")
    print(f"    - Bắt bệnh căn nguyên: {len(pred['root_causes'])} nguyên nhân được phát hiện")

    # 5. Diagnostic History
    print("\n[5/10] Kiểm tra Nhật ký Chẩn đoán thời gian thực trong PostgreSQL...")
    res = client.get("/api/predict/history?limit=5", headers=farmer_header)
    assert res.status_code == 200
    history = res.json()
    assert len(history) > 0
    print(f"  ✓ Đã truy vấn thành công {len(history)} bản ghi nhật ký cảm biến.")

    # 6. Academic Metrics
    print("\n[6/10] Kiểm tra Báo cáo Khoa học Đối chứng Dual-Track (/api/predict/metrics)...")
    res = client.get("/api/predict/metrics")
    assert res.status_code == 200
    metrics = res.json()
    assert "track1_raw_lightgbm" in metrics
    assert "track2_eco_lightgbm" in metrics
    print(f"  ✓ Track 1 (Raw Zero-Signal) ROC-AUC: {metrics['track1_raw_lightgbm']['ROC-AUC']:.4f}")
    print(f"  ✓ Track 2 (Eco SOTA) ROC-AUC: {metrics['track2_eco_lightgbm']['ROC-AUC']:.4f}")
    print(f"  ✓ Track 2 Độ chính xác Accuracy: {metrics['track2_eco_lightgbm']['Accuracy']*100:.2f}%")
    print(f"  ✓ Ngưỡng cắt tối ưu đề xuất T*: {metrics['optimal_threshold']:.2f}")

    # 7. Big Data Batch CSV
    print("\n[7/10] Kiểm tra Xử lý Big Data theo Lô (Batch CSV Vectorized Scan)...")
    sample_csv_res = client.get("/api/batch/sample-csv")
    assert sample_csv_res.status_code == 200
    csv_bytes = sample_csv_res.content

    files = {"file": ("dataset_test_stream.csv", io.BytesIO(csv_bytes), "text/csv")}
    batch_res = client.post("/api/batch/upload", files=files, headers=admin_header)
    assert batch_res.status_code == 200, f"Batch upload failed: {batch_res.text}"
    batch = batch_res.json()
    assert batch["total_records"] > 0
    print(f"  ✓ Quét thành công file {batch['filename']} ({batch['total_records']} bản ghi)")
    print(f"    - Thời gian xử lý: {batch['execution_time_ms']:.2f} ms")
    print(f"    - Cây gặp stress: {batch['stress_count']} | Cây khỏe mạnh: {batch['healthy_count']}")

    # 8. Batch Job History
    print("\n[8/10] Kiểm tra Lịch sử Công việc Big Data Batch Job...")
    jobs_res = client.get("/api/batch/jobs?limit=5", headers=admin_header)
    assert jobs_res.status_code == 200
    assert len(jobs_res.json()) > 0
    print(f"  ✓ Truy xuất {len(jobs_res.json())} công việc batch đã lưu trong DB.")

    # 9. Dynamic QR & Actuator Controls
    print("\n[9/10] Kiểm tra Phiên kết nối Dynamic QR Code & Kích hoạt Thiết bị Cứu cây...")
    qr_res = client.post("/qr/create-session")
    assert qr_res.status_code == 200
    session_id = qr_res.json()["session_id"]
    print(f"  ✓ Mã phiên QR di động thời gian thực: {session_id}")

    actuator_payload = {
        "command_type": "irrigation",
        "triggered_by": "web_button",
        "target_device": "Trạm Bơm Phân Khu A",
        "duration_sec": 20
    }
    act_res = client.post("/actuators/trigger", json=actuator_payload, headers=engineer_header)
    assert act_res.status_code == 200
    assert act_res.json()["success"] is True
    print(f"  ✓ Lệnh kích hoạt trạm bơm gửi thành công. Trạng thái: OK")

    act_logs = client.get("/actuators/logs?limit=5")
    assert act_logs.status_code == 200
    assert len(act_logs.json()) > 0
    print(f"  ✓ Nhật ký kiểm toán phần cứng đã ghi nhận.")

    # 10. Hybrid AI Chatbot Guardrails
    print("\n[10/10] Kiểm tra Trợ lý AI Cây trồng AgriBot & Bộ lọc Guardrails...")
    chat_agri = {
        "message": "Nhiệt độ 40 độ C, độ ẩm 15% làm sao cứu lúa?",
        "session_id": "test_session_agri"
    }
    chat_res1 = client.post("/api/chat/message", json=chat_agri, headers=farmer_header)
    assert chat_res1.status_code == 200
    r1 = chat_res1.json()
    assert r1["is_on_topic"] is True
    print(f"  ✓ Câu hỏi nông nghiệp: Đã xử lý (Nguồn: {r1['ai_provider']})")

    chat_offtopic = {
        "message": "Giá cổ phiếu Apple hôm nay bao nhiêu?",
        "session_id": "test_session_offtopic"
    }
    chat_res2 = client.post("/api/chat/message", json=chat_offtopic, headers=farmer_header)
    assert chat_res2.status_code == 200
    r2 = chat_res2.json()
    assert r2["is_on_topic"] is False
    assert "AgriBot" in r2["response"] and "cây trồng" in r2["response"]
    print(f"  ✓ Câu hỏi lạc đề: Guardrail đã kích hoạt chặn chính xác!")

    print("\n" + "="*70)
    print("🎉 TOÀN BỘ 10 PHÂN HỆ ĐÃ VƯỢT QUA TEST TỰ ĐỘNG THÀNH CÔNG 100%!")
    print("="*70 + "\n")

if __name__ == "__main__":
    test_full_system()
