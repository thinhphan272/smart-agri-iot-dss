from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


# ==============================================================================
# 1. AUTH & USER SCHEMAS (Đăng ký, Đăng nhập, Cấp JWT Token, Phân quyền RBAC)
# ==============================================================================


class UserRegisterRequest(BaseModel):
    """Schema tiếp nhận yêu cầu Đăng ký tài khoản mới"""
    email: str = Field(..., description="Email người dùng", example="farmer@agri-iot.vn")
    password: str = Field(..., min_length=6, description="Mật khẩu ít nhất 6 ký tự", example="farmer123")
    full_name: str = Field(..., description="Họ và tên đầy đủ", example="Nguyễn Văn Nông")
    role: str = Field(default="farmer", description="Vai trò: 'admin' | 'engineer' | 'farmer'", example="farmer")
    preferred_language: str = Field(default="vi", description="Ngôn ngữ: 'vi' | 'en'", example="vi")
    preferred_theme: str = Field(default="dark", description="Giao diện: 'dark' | 'light'", example="dark")



class UserLoginRequest(BaseModel):
    """Schema tiếp nhận yêu cầu Đăng nhập bằng Email & Mật khẩu"""
    email: str = Field(..., example="admin@agri-iot.vn")
    password: str = Field(..., example="admin123")


class QuickDemoLoginRequest(BaseModel):
    """Schema phục vụ nút bấm Đăng nhập nhanh 1 chạm"""
    role: str = Field(..., example="admin")  # 'admin' | 'engineer' | 'farmer'


class TokenResponse(BaseModel):
    """Schema trả về Access Token sau khi đăng nhập thành công"""
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: int
    full_name: str



class TokenData(BaseModel):
    """Dữ liệu được giải mã từ JWT Token để kiểm tra phân quyền"""
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None


class UserResponse(BaseModel):
    """Schema trả về thông tin cá nhân (ĐÃ ẨN MẬT KHẨU)"""
    id: int
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    role: str
    auth_provider: str
    preferred_language: str
    preferred_theme: str
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)



# ==============================================================================
# 2. SENSOR DIAGNOSTICS & AI SCHEMAS (9 Thanh trượt cảm biến & Bắt bệnh)
# ==============================================================================

class SensorPredictRequest(BaseModel):
    """Schema nhận 9 thông số cảm biến gửi từ Web Dashboard hoặc Mobile QR"""
    soil_ph: float = Field(..., ge=0.0, le=14.0, description="Độ pH đất (0 - 14)", example=5.8)
    soil_moisture: float = Field(..., ge=0.0, le=100.0, description="Độ ẩm đất (%)", example=45.2)
    air_temp_C: float = Field(..., ge=-20.0, le=60.0, description="Nhiệt độ không khí (°C)", example=32.5)
    sunlight_hours: float = Field(default=7.0, ge=0.0, le=24.0, description="Số giờ nắng trong ngày", example=7.5)
    pollution_index: float = Field(default=20.0, ge=0.0, le=100.0, description="Chỉ số ô nhiễm", example=25.0)
    vegetation_density: float = Field(default=0.6, ge=0.0, le=1.0, description="Mật độ thảm thực vật (0.0 - 1.0)", example=0.65)
    elevation_m: float = Field(default=15.0, ge=0.0, description="Độ cao so với mặt biển (m)", example=15.0)
    proximity_to_water_m: float = Field(default=120.0, ge=0.0, description="Khoảng cách tới nguồn nước (m)", example=120.0)
    season: str = Field(default="Summer", description="Mùa trong năm", example="Summer")
    plant_species: str = Field(default="Lúa nước", description="Loài cây trồng", example="Lúa nước")
    source: Optional[str] = Field(default="web", description="'web' hoặc 'mobile_qr'", example="web")
    model_source: Optional[str] = Field(default="lightgbm", description="'lightgbm' hoặc 'spark'", example="lightgbm")


class SensorPredictResponse(BaseModel):
    """Schema trả về kết quả suy luận AI LightGBM, kim đồng hồ & phác đồ"""
    stress_probability: float = Field(..., description="Xác suất stress (0.00 -> 1.00)", example=0.78)
    is_stress: bool = Field(..., description="Cây có bị stress hay không (True/False)", example=True)
    risk_level: str = Field(..., description="'Optimal' | 'Warning' | 'Critical'", example="Critical")
    root_causes: List[str] = Field(default_factory=list, description="Danh sách nguyên nhân gốc rễ")
    remediation: str = Field(..., description="Phác đồ can thiệp nông học tức thì")
    execution_time_ms: float = Field(..., description="Thời gian suy luận AI tính bằng ms", example=1.45)
    model_source: Optional[str] = "lightgbm"
    active_threshold: Optional[float] = 0.34
    diagnostic_id: Optional[int] = None
    timestamp: Optional[datetime] = None


class SensorDiagnosticHistoryItem(BaseModel):
    """Schema hiển thị từng dòng trong Lịch sử chẩn đoán cây trồng"""
    id: int
    user_id: Optional[int] = None
    source: str
    soil_ph: float
    soil_moisture: float
    air_temp_C: float
    sunlight_hours: float
    pollution_index: float
    vegetation_density: float
    elevation_m: float
    proximity_to_water_m: float
    season: str
    plant_species: str
    stress_probability: float
    is_stress: bool
    risk_level: str
    root_causes: Any = None
    remediation: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


# ==============================================================================
# 3. BIG DATA BATCH SCAN SCHEMAS (Nhật ký xử lý file CSV lô lớn)
# ==============================================================================


class BatchScanJobResponse(BaseModel):
    """Schema tóm tắt kết quả quét một tệp Big Data CSV"""
    id: int
    user_id: Optional[int] = None
    filename: str
    total_records: int
    stress_count: int
    healthy_count: int
    execution_time_ms: float
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class GoogleLoginRequest(BaseModel):
    """Schema đăng nhập bằng Google / Gmail"""
    email: str = Field(..., example="chuyengia.nonghoc@gmail.com")
    full_name: Optional[str] = Field(default=None, example="Nguyễn Văn Chuyên Gia")
    role: Optional[str] = Field(default="engineer", example="engineer")


# ==============================================================================
# 4. HYBRID AI CHATBOT SCHEMAS (Trợ lý chuyên gia cây trồng AgriBot)
# ==============================================================================
class ChatMessageRequest(BaseModel):
    """Schema tin nhắn gửi đến AgriBot"""
    session_id: str = Field(..., example="session-demo-001")
    message: str = Field(..., min_length=1, example="Lá lúa bị cháy đầu lá và đất chua thì cần bón phân gì?")
    model: Optional[str] = Field(default="gemini-1.5-flash", example="gemini-1.5-flash")
    history: Optional[List[Dict[str, Any]]] = Field(default=None, description="Lịch sử các lượt hội thoại trước")
    api_key: Optional[str] = Field(default=None, description="Tùy chọn API Key Google Gemini do người dùng cấu hình")


class ChatMessageResponse(BaseModel):
    """Schema câu trả lời từ AgriBot (Gemini hoặc Bộ tri thức nội bộ)"""
    id: Optional[int] = None
    session_id: str
    role: str
    message: str
    response: Optional[str] = None
    ai_provider: str = Field(default="internal", description="'gemini' | 'internal'")
    is_on_topic: bool = True
    response_time_ms: Optional[float] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)



# ==============================================================================
# 5. WEBSOCKET QR & ACTUATOR SCHEMAS (Điều khiển thiết bị & Trạm di động)
# ==============================================================================



class ActuatorTriggerRequest(BaseModel):
    """Schema lệnh kích hoạt thiết bị cứu cây (Bơm nước, Phun sương...)"""
    command_type: str = Field(..., example="misting")  # 'irrigation' | 'misting' | 'fertilizer' | 'alert_notify'
    triggered_by: str = Field(default="web_button", example="web_button")  # 'web_button' | 'mobile_button'
    target_device: str = Field(..., example="Trạm Phun Sương Vùng 1")
    duration_sec: int = Field(default=10, ge=1, le=3600, example=15)
    ws_session_id: Optional[str] = None
    diagnostic_id: Optional[int] = None


class ActuatorLogResponse(BaseModel):
    """Schema nhật ký thực thi của thiết bị"""
    id: int
    command_type: str
    triggered_by: str
    target_device: str
    duration_sec: int
    success: bool
    error_message: Optional[str] = None
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)


class WebSocketSessionResponse(BaseModel):
    """Schema thông tin phiên QR Code đang chờ điện thoại kết nối"""
    session_id: str
    status: str
    qr_payload: str
    expires_at: datetime
    connected_at: Optional[datetime] = None
    lan_ip: Optional[str] = None
    mobile_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)






