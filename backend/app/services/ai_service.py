import os
import time
import warnings
warnings.filterwarnings("ignore")
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List

# Tìm thư mục outputs linh hoạt từ gốc dự án
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__)) # backend/app/services
APP_DIR = os.path.dirname(CURRENT_DIR)                   # backend/app
BACKEND_DIR = os.path.dirname(APP_DIR)                   # backend
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)              # smart-agri-iot-project

OUTPUTS_DIR = os.path.join(PROJECT_ROOT, "outputs")
if not os.path.exists(OUTPUTS_DIR):
    OUTPUTS_DIR = os.path.join(BACKEND_DIR, "outputs")

MODEL_PATH = os.path.join(OUTPUTS_DIR, "best_eco_model.pkl")
SPARK_MODEL_PATH = os.path.join(OUTPUTS_DIR, "spark_gbt_model.pkl")
SCALER_PATH = os.path.join(OUTPUTS_DIR, "preprocessor_scaler.pkl")

# Ngưỡng quyết định tối ưu đã được tối ưu hóa từ thực nghiệm (ROC-AUC 0.83, F1-Score 0.78)
OPTIMAL_THRESHOLD = 0.34

class AIService:
    def __init__(self):
        self.model = None
        self.spark_model = None
        self.scaler = None
        self.feature_names = [
            'soil_ph', 'soil_moisture', 'sunlight_hours', 'air_temp_C', 'pollution_index',
            'proximity_to_water_m', 'elevation_m', 'vegetation_density',
            'sensor_battery', 'soil_acidity_stress', 'drought_risk_index',
            'water_access_friction', 'pollution_vulnerability', 'season_Spring',
            'season_Summer', 'season_Winter', 'plant_species_Grassland_B',
            'plant_species_Shrub_X', 'plant_species_Tree_Y', 'plant_species_Wetland_C'
        ]
        self._load_artifacts()

    def _load_artifacts(self):
        """Nạp model LightGBM, model Spark GBT và bộ chuẩn hóa StandardScaler từ đĩa"""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                print(f"[+] Loaded LightGBM Model successfully from {MODEL_PATH}")
            else:
                print(f"[-] Model file not found at {MODEL_PATH}")

            if os.path.exists(SPARK_MODEL_PATH):
                self.spark_model = joblib.load(SPARK_MODEL_PATH)
                print(f"[+] Loaded Spark GBT Model successfully from {SPARK_MODEL_PATH}")
            else:
                print(f"[-] Spark GBT Model file not found at {SPARK_MODEL_PATH}")

            if os.path.exists(SCALER_PATH):
                self.scaler = joblib.load(SCALER_PATH)
                print(f"[+] Loaded Scaler successfully from {SCALER_PATH}")
            else:
                print(f"[-] Scaler file not found at {SCALER_PATH}")
        except Exception as e:
            print(f"[!] Error loading AI artifacts: {e}")

    def engineer_features(self, raw_data: Dict[str, Any]) -> pd.DataFrame:
        """
        Trích xuất đặc trưng sinh thái (Eco-Feature Engineering)
        Tạo đúng 20 cột đặc trưng mà mô hình LightGBM yêu cầu
        """
        soil_ph = float(raw_data.get("soil_ph", 6.5))
        soil_moisture = float(raw_data.get("soil_moisture", 50.0))
        air_temp_C = float(raw_data.get("air_temp_C", 28.0))
        sunlight_hours = float(raw_data.get("sunlight_hours", 7.0))
        pollution_index = float(raw_data.get("pollution_index", 20.0))
        proximity_to_water_m = float(raw_data.get("proximity_to_water_m", 100.0))
        elevation_m = float(raw_data.get("elevation_m", 20.0))
        vegetation_density = float(raw_data.get("vegetation_density", 0.6))
        sensor_battery = float(raw_data.get("sensor_battery", 98.0))
        season = str(raw_data.get("season", "Summer"))
        plant_species = str(raw_data.get("plant_species", "Crop_A"))

        # 4 Chỉ số tương tác sinh thái nông học
        soil_acidity_stress = abs(soil_ph - 6.5)
        drought_risk_index = air_temp_C / (soil_moisture + 1e-5)
        water_access_friction = proximity_to_water_m / (elevation_m + 10.0)
        pollution_vulnerability = pollution_index * (1.0 - vegetation_density)

        # One-hot encoding mùa (Season)
        season_clean = season.lower()
        season_Spring = 1.0 if ("spring" in season_clean or "xuân" in season_clean) else 0.0
        season_Summer = 1.0 if ("summer" in season_clean or "hè" in season_clean) else 0.0
        season_Winter = 1.0 if ("winter" in season_clean or "đông" in season_clean) else 0.0

        # One-hot encoding loài thực vật (Plant species)
        species_clean = plant_species.lower()
        plant_species_Grassland_B = 1.0 if ("grassland" in species_clean or "đồng cỏ" in species_clean or "grassland_b" in species_clean) else 0.0
        plant_species_Shrub_X = 1.0 if ("shrub" in species_clean or "rau" in species_clean or "shrub_x" in species_clean) else 0.0
        plant_species_Tree_Y = 1.0 if ("tree" in species_clean or "cây ăn trái" in species_clean or "cây thân gỗ" in species_clean or "tree_y" in species_clean) else 0.0
        plant_species_Wetland_C = 1.0 if ("wetland" in species_clean or "lúa" in species_clean or "thủy sinh" in species_clean or "wetland_c" in species_clean) else 0.0

        df = pd.DataFrame([{
            'soil_ph': soil_ph,
            'soil_moisture': soil_moisture,
            'sunlight_hours': sunlight_hours,
            'air_temp_C': air_temp_C,
            'pollution_index': pollution_index,
            'proximity_to_water_m': proximity_to_water_m,
            'elevation_m': elevation_m,
            'vegetation_density': vegetation_density,
            'sensor_battery': sensor_battery,
            'soil_acidity_stress': soil_acidity_stress,
            'drought_risk_index': drought_risk_index,
            'water_access_friction': water_access_friction,
            'pollution_vulnerability': pollution_vulnerability,
            'season_Spring': season_Spring,
            'season_Summer': season_Summer,
            'season_Winter': season_Winter,
            'plant_species_Grassland_B': plant_species_Grassland_B,
            'plant_species_Shrub_X': plant_species_Shrub_X,
            'plant_species_Tree_Y': plant_species_Tree_Y,
            'plant_species_Wetland_C': plant_species_Wetland_C,
        }], columns=self.feature_names)

        return df

    def analyze_root_causes(self, raw_data: Dict[str, Any]) -> List[str]:
        """Tự động phân tích các nguyên nhân gốc rễ gây stress sinh thái nông học"""
        causes = []
        soil_ph = float(raw_data.get("soil_ph", 6.5))
        soil_moisture = float(raw_data.get("soil_moisture", 50.0))
        air_temp_C = float(raw_data.get("air_temp_C", 28.0))
        pollution_index = float(raw_data.get("pollution_index", 20.0))
        sunlight_hours = float(raw_data.get("sunlight_hours", 7.0))
        vegetation_density = float(raw_data.get("vegetation_density", 0.6))
        season = str(raw_data.get("season", "Summer"))
        plant_species = str(raw_data.get("plant_species", "Lúa nước"))

        if soil_ph < 5.2:
            causes.append(f"Đất bị chua/axit hóa nghiêm trọng (pH = {soil_ph:.1f} < 5.2) gây bất hoạt vi sinh vật và khóa hấp thụ rễ.")
        elif soil_ph > 8.0:
            causes.append(f"Đất bị kiềm hóa (pH = {soil_ph:.1f} > 8.0) làm kết tủa sắt, phốt pho và các vi lượng thiết yếu.")

        if air_temp_C >= 35.0 and soil_moisture <= 30.0:
            causes.append(f"Cặp đôi stress sốc nhiệt & hạn hán: Nhiệt độ {air_temp_C:.1f}°C kết hợp độ ẩm đất kiệt quệ {soil_moisture:.1f}%.")
        elif soil_moisture < 20.0:
            causes.append(f"Độ ẩm đất quá thấp ({soil_moisture:.1f}% < 20%) chạm ngưỡng héo rũ vĩnh viễn của tế bào thực vật.")
        elif soil_moisture >= 80.0:
            causes.append(f"Độ ẩm đất ngập úng nghiêm trọng ({soil_moisture:.1f}% >= 80%) gây yếm khí tầng rễ, cạn kiệt oxy hòa tan và tăng nguy cơ nấm thối rễ.")

        # Phân tích tương tác chuyên biệt theo loài cây trồng & mùa vụ
        species_lower = plant_species.lower()
        if "rau" in species_lower and soil_moisture >= 75.0:
            causes.append(f"Rau màu rễ nông mẫn cảm cao với ẩm độ ({soil_moisture:.1f}%): Nguy cơ nghẹt rễ thối cổ rễ nhanh chóng.")
        elif "lúa" in species_lower and soil_moisture <= 38.0:
            causes.append(f"Lúa nước thiếu hụt nước nghiêm trọng ({soil_moisture:.1f}% <= 38%): Nguy cơ nghẹt đòng và khô cháy chóp lá.")

        if ("summer" in season.lower() or "hè" in season.lower()) and air_temp_C >= 34.0:
            causes.append(f"Tiểu khí hậu mùa Hè nắng gắt ({air_temp_C:.1f}°C) thúc đẩy tốc độ bốc thoát hơi nước vượt ngưỡng bù ẩm tự nhiên.")
        elif ("winter" in season.lower() or "đông" in season.lower()) and air_temp_C <= 16.0:
            causes.append(f"Thời tiết mùa Đông lạnh ({air_temp_C:.1f}°C) làm chậm tốc độ trao đổi chất và hô hấp của hệ rễ.")

        if pollution_index >= 60.0:
            causes.append(f"Chỉ số ô nhiễm không khí/nguồn nước báo động ({pollution_index:.1f} >= 60) phá vỡ màng khí khổng.")

        if sunlight_hours < 4.0:
            causes.append(f"Số giờ nắng không đủ ({sunlight_hours:.1f}h/ngày < 4h) làm suy giảm năng suất quang hợp.")

        if vegetation_density < 0.25:
            causes.append(f"Mật độ thảm thực vật che phủ quá thấp ({vegetation_density:.2f}) khiến tầng đất mặt trơ trọi, bốc hơi nước mạnh.")

        # Khi không có nguyên nhân gây hại, trả về danh sách rỗng [] để giao diện hiển thị trạng thái an toàn
        return causes

    def generate_remediation(self, causes: List[str], risk_level: str) -> str:
        """Kê đơn phác đồ điều trị nông học chính xác dựa trên các nguyên nhân phát hiện"""
        if risk_level == "Optimal" or len(causes) == 0:
            return "Hệ sinh thái đang ở trạng thái tối ưu. Tiếp tục duy trì chế độ tưới tiêu và dinh dưỡng định kỳ theo lịch trình chuẩn."

        protocols = []
        protocols.append("=== PHÁC ĐỒ CAN THIỆP NÔNG HỌC TỨC THÌ ===")

        for c in causes:
            if "axit hóa" in c or "chua" in c:
                protocols.append("• Xử lý chua đất: Rải vôi bột nông nghiệp (CaCO3) liều lượng 350-450 kg/ha, tưới ẩm nhẹ để trung hòa nhanh tầng đất mặt.")
            if "kiềm hóa" in c:
                protocols.append("• Hạ kiềm: Bổ sung thạch cao nông nghiệp (CaSO4) hoặc phân hữu cơ vi sinh giàu axit humic để kéo pH về mức 6.2 - 6.8.")
            if "sốc nhiệt" in c or "hạn hán" in c or "héo rũ" in c or "bốc thoát hơi nước" in c:
                protocols.append("• Cấp cứu hạn & sốc nhiệt: Bật phun sương làm mát 10-15 phút để hạ nhiệt tán lá; tưới nhỏ giọt vào sáng sớm hoặc chiều mát; phủ rơm rạ giữ ẩm vùng gốc.")
            if "ngập úng" in c or "yếm khí" in c or "nghẹt rễ" in c:
                protocols.append("• Cấp cứu ngập úng: Kích hoạt bơm tiêu úng và mở van xả rãnh ngay lập tức; sau khi rút nước xới nhẹ mặt luống phá váng và tưới nấm Trichoderma phòng thối rễ.")
            if "lúa nước thiếu hụt nước" in c:
                protocols.append("• Bù ẩm cho lúa: Bơm nước vào ruộng đạt mực nước 3-5cm để dưỡng cây làm đòng, tránh thất thoát hạt.")
            if "ô nhiễm" in c:
                protocols.append("• Giảm tác động ô nhiễm: Phun bổ sung phân bón lá chứa Axit Amin và vi lượng để kích thích cơ chế tự miễn dịch của biểu bì lá.")
            if "quang hợp" in c:
                protocols.append("• Cải thiện ánh sáng: Cắt tỉa cành vô hiệu, dọn dẹp cỏ dại che bóng tán lá.")
            if "thảm thực vật" in c:
                protocols.append("• Che phủ bảo vệ đất: Trồng xen cây họ đậu hoặc phủ thảm xác thực vật để chống xói mòn và giữ ẩm tầng mặt.")
        if risk_level == "Critical":
            protocols.append("⚠️ MỨC ĐỘ NGUY CẤP: Kỹ sư trạm thực địa cần lập tức kích hoạt thiết bị cứu cây và gửi thông báo khẩn cấp tới nông hộ qua ứng dụng di động.")

        return "\n".join(protocols)

    def predict(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Thực hiện toàn bộ quy trình suy luận AI end-to-end:
        - Hỗ trợ chuyển đổi linh hoạt nguồn trọng số (LightGBM vs Apache Spark MLlib)
        - Tích hợp Chốt chặn Nông học Lai (Hybrid Agronomic Guard) ngăn ngừa sai sót vật lý
        """
        t0 = time.time()
        model_source = str(raw_data.get("model_source", "lightgbm")).lower()

        # 1. Feature Engineering (20 đặc trưng sinh thái)
        features_df = self.engineer_features(raw_data)

        # 2. Scaling (Chuẩn hóa)
        if self.scaler is not None:
            features_scaled = self.scaler.transform(features_df)
        else:
            features_scaled = features_df.values

        # 3. Model Inference theo Nguồn Trọng Số được chọn
        if model_source == "spark" and self.spark_model is not None:
            # Mô hình Apache Spark MLlib GBT (Gradient Boosted Trees)
            spark_probs = self.spark_model.predict_proba(features_scaled)
            raw_prob = float(spark_probs[0][1])
            active_threshold = 0.50
        elif self.model is not None:
            # Mô hình LightGBM tối ưu hóa
            preds = self.model.predict(features_scaled)
            raw_prob = float(preds[0])
            active_threshold = OPTIMAL_THRESHOLD  # 0.34
        else:
            raw_prob = 0.50
            active_threshold = OPTIMAL_THRESHOLD

        # 4. Phân tích nguyên nhân gốc rễ sinh thái
        root_causes = self.analyze_root_causes(raw_data)

        # 5. Hybrid Agronomic Guard (Chốt chặn Vật lý & Chuyên gia Nông học)
        # Giúp hệ thống không bao giờ chẩn đoán "Tối ưu" khi thực tế đất đang ngập úng 92% hay hạn hán kiệt quệ
        soil_moisture = float(raw_data.get("soil_moisture", 50.0))
        soil_ph = float(raw_data.get("soil_ph", 6.5))
        air_temp_C = float(raw_data.get("air_temp_C", 28.0))

        stress_prob = raw_prob
        # Trường hợp ngập úng cấp tính (soil_moisture >= 80%)
        if soil_moisture >= 80.0:
            moisture_factor = min(0.97, 0.82 + (soil_moisture - 80.0) * 0.012)
            stress_prob = max(stress_prob, moisture_factor)
        # Trường hợp hạn hán & sốc nhiệt cực đoan
        elif soil_moisture <= 18.0 or (air_temp_C >= 38.0 and soil_moisture <= 28.0):
            stress_prob = max(stress_prob, 0.88)
        # Trường hợp đất chua hoặc kiềm cực đoan
        elif soil_ph <= 4.2 or soil_ph >= 8.8:
            stress_prob = max(stress_prob, 0.85)
        # Trường hợp sinh thái tối ưu hoàn toàn (không có nguyên nhân gây stress nào)
        elif len(root_causes) == 0 and 5.8 <= soil_ph <= 7.2 and 45.0 <= soil_moisture <= 75.0 and air_temp_C <= 32.0:
            stress_prob = min(stress_prob, 0.15)

        stress_prob = max(0.001, min(0.999, stress_prob))

        # 6. Ngưỡng quyết định & Phân tầng rủi ro
        is_stress = bool(stress_prob >= active_threshold)

        if stress_prob < (0.22 if model_source == "lightgbm" else 0.35) and len(root_causes) == 0:
            risk_level = "Optimal"
        elif stress_prob < active_threshold:
            risk_level = "Warning"
        else:
            risk_level = "Critical"

        # 7. Kê đơn phác đồ điều trị
        remediation = self.generate_remediation(root_causes, risk_level)

        exec_time_ms = round((time.time() - t0) * 1000, 2)

        return {
            "stress_probability": round(stress_prob, 4),
            "is_stress": is_stress,
            "risk_level": risk_level,
            "root_causes": root_causes,
            "remediation": remediation,
            "execution_time_ms": exec_time_ms,
            "model_source": model_source,
            "active_threshold": active_threshold
        }

# Khởi tạo singleton instance
ai_service = AIService()
