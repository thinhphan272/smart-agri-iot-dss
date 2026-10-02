import os
import time
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
SCALER_PATH = os.path.join(OUTPUTS_DIR, "preprocessor_scaler.pkl")

# Ngưỡng quyết định tối ưu đã được tối ưu hóa từ thực nghiệm (ROC-AUC 0.83, F1-Score 0.78)
OPTIMAL_THRESHOLD = 0.34

class AIService:
    def __init__(self):
        self.model = None
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
        """Nạp model LightGBM và bộ chuẩn hóa StandardScaler từ đĩa"""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                print(f"[+] Loaded LightGBM Model successfully from {MODEL_PATH}")
            else:
                print(f"[-] Model file not found at {MODEL_PATH}")

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
        season_Spring = 1.0 if season.lower() == "spring" else 0.0
        season_Summer = 1.0 if season.lower() == "summer" else 0.0
        season_Winter = 1.0 if season.lower() == "winter" else 0.0

        # One-hot encoding loài thực vật (Plant species)
        species_clean = plant_species.lower()
        plant_species_Grassland_B = 1.0 if ("grassland" in species_clean or "b" in species_clean) else 0.0
        plant_species_Shrub_X = 1.0 if ("shrub" in species_clean or "x" in species_clean) else 0.0
        plant_species_Tree_Y = 1.0 if ("tree" in species_clean or "y" in species_clean) else 0.0
        plant_species_Wetland_C = 1.0 if ("wetland" in species_clean or "c" in species_clean) else 0.0

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
        """Tự động phân tích các nguyên nhân gốc rễ gây stress sinh thái"""
        causes = []
        soil_ph = float(raw_data.get("soil_ph", 6.5))
        soil_moisture = float(raw_data.get("soil_moisture", 50.0))
        air_temp_C = float(raw_data.get("air_temp_C", 28.0))
        pollution_index = float(raw_data.get("pollution_index", 20.0))
        sunlight_hours = float(raw_data.get("sunlight_hours", 7.0))
        vegetation_density = float(raw_data.get("vegetation_density", 0.6))

        if soil_ph < 5.2:
            causes.append(f"Đất bị chua/axit hóa nghiêm trọng (pH = {soil_ph:.1f} < 5.2) gây bất hoạt vi sinh vật và khóa hấp thụ rễ.")
        elif soil_ph > 8.0:
            causes.append(f"Đất bị kiềm hóa (pH = {soil_ph:.1f} > 8.0) làm kết tủa sắt, phốt pho và các vi lượng thiết yếu.")

        if air_temp_C >= 35.0 and soil_moisture <= 30.0:
            causes.append(f"Cặp đôi stress sốc nhiệt & hạn hán: Nhiệt độ {air_temp_C:.1f}°C kết hợp độ ẩm đất kiệt quệ {soil_moisture:.1f}%.")
        elif soil_moisture < 20.0:
            causes.append(f"Độ ẩm đất quá thấp ({soil_moisture:.1f}% < 20%) chạm ngưỡng héo rũ vĩnh viễn của tế bào thực vật.")
        elif soil_moisture > 85.0:
            causes.append(f"Độ ẩm đất ngập úng ({soil_moisture:.1f}% > 85%) gây yếm khí, nghẹt rễ và tăng nguy cơ nấm thối rễ.")

        if pollution_index >= 60.0:
            causes.append(f"Chỉ số ô nhiễm không khí/nguồn nước báo động ({pollution_index:.1f} >= 60) phá vỡ màng khí khổng.")

        if sunlight_hours < 4.0:
            causes.append(f"Số giờ nắng không đủ ({sunlight_hours:.1f}h/ngày < 4h) làm suy giảm năng suất quang hợp.")

        if vegetation_density < 0.25:
            causes.append(f"Mật độ thảm thực vật che phủ quá thấp ({vegetation_density:.2f}) khiến tầng đất mặt trơ trọi, bốc hơi nước mạnh.")

        if not causes:
            causes.append("Tất cả các chỉ số hóa sinh và khí tượng đều nằm trong ngưỡng sinh trưởng an toàn.")

        return causes

    def generate_remediation(self, causes: List[str], risk_level: str) -> str:
        """Kê đơn phác đồ điều trị nông học chính xác dựa trên các nguyên nhân phát hiện"""
        if risk_level == "Optimal":
            return "Hệ sinh thái đang ở trạng thái tối ưu. Tiếp tục duy trì chế độ tưới tiêu và dinh dưỡng định kỳ theo lịch trình chuẩn."

        protocols = []
        protocols.append("=== PHÁC ĐỒ CAN THIỆP NÔNG HỌC TỨC THÌ ===")

        for c in causes:
            if "axit hóa" in c or "chua" in c:
                protocols.append("• Xử lý chua đất: Rải vôi bột nông nghiệp (CaCO3) liều lượng 350-450 kg/ha, tưới ẩm nhẹ để trung hòa nhanh tầng đất mặt.")
            if "kiềm hóa" in c:
                protocols.append("• Hạ kiềm: Bổ sung thạch cao nông nghiệp (CaSO4) hoặc phân hữu cơ vi sinh giàu axit humic để kéo pH về mức 6.2 - 6.8.")
            if "sốc nhiệt" in c or "hạn hán" in c or "héo rũ" in c:
                protocols.append("• Cấp cứu sốc nhiệt/hạn: Kích hoạt hệ thống phun sương làm mát tiểu khí hậu (15 phút/lần) và tưới nhỏ giọt bù ẩm gốc.")
            if "ngập úng" in c:
                protocols.append("• Tiêu úng: Mở van xả rãnh thoát nước luống, ngừng toàn bộ hệ thống tưới tự động, xới nhẹ mặt đất tăng thoáng khí.")
            if "ô nhiễm" in c:
                protocols.append("• Giải độc ô nhiễm: Bật hệ thống vòi phun rửa tán lá để rửa trôi bụi bẩn/kim loại bám trên khí khổng, phun bổ sung Silic nano tăng đề kháng.")
            if "Số giờ nắng" in c:
                protocols.append("• Tăng cường chiếu sáng hoặc kéo giãn tỉa cành để đón tối đa ánh sáng tán dưới.")

        if risk_level == "Critical":
            protocols.append("⚠️ MỨC ĐỘ NGUY CẤP: Kỹ sư trạm thực địa cần lập tức kích hoạt thiết bị cứu cây và gửi thông báo khẩn cấp tới nông hộ qua ứng dụng di động.")

        return "\n".join(protocols)

    def predict(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Thực hiện toàn bộ quy trình suy luận AI end-to-end"""
        t0 = time.time()
        
        # 1. Feature Engineering
        features_df = self.engineer_features(raw_data)

        # 2. Scaling (Chuẩn hóa)
        if self.scaler is not None:
            features_scaled = self.scaler.transform(features_df)
        else:
            features_scaled = features_df.values

        # 3. LightGBM Inference
        if self.model is not None:
            preds = self.model.predict(features_scaled)
            stress_prob = float(preds[0])
        else:
            stress_prob = 0.50

        stress_prob = max(0.001, min(0.999, stress_prob))
        
        # 4. Ngưỡng quyết định tối ưu T* = 0.34
        is_stress = bool(stress_prob >= OPTIMAL_THRESHOLD)

        # 5. Phân tầng rủi ro
        if stress_prob < 0.20:
            risk_level = "Optimal"
        elif stress_prob < OPTIMAL_THRESHOLD:
            risk_level = "Warning"
        else:
            risk_level = "Critical"

        # 6. Bắt bệnh & Kê đơn
        root_causes = self.analyze_root_causes(raw_data)
        remediation = self.generate_remediation(root_causes, risk_level)

        exec_time_ms = round((time.time() - t0) * 1000, 2)

        return {
            "stress_probability": round(stress_prob, 4),
            "is_stress": is_stress,
            "risk_level": risk_level,
            "root_causes": root_causes,
            "remediation": remediation,
            "execution_time_ms": exec_time_ms
        }

# Khởi tạo singleton instance
ai_service = AIService()
