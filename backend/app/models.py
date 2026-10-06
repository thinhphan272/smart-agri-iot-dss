from datetime import datetime
from sqlalchemy import Column, Integer, BigInteger, String, REAL, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from .database import Base

try:
    from sqlalchemy.dialects.postgresql import JSONB
    JSON_FIELD = JSON().with_variant(JSONB, "postgresql")
except Exception:
    JSON_FIELD = JSON


# ==============================================================================
# BẢNG 1: users (Khớp 100% schema.sql - Đã bỏ updated_at)
# ==============================================================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=True)                # NULL nếu dùng Google OAuth
    full_name = Column(String(100), nullable=False)
    avatar_url = Column(String(500), nullable=True)
    role = Column(String(20), nullable=False, default="farmer")         # 'admin' | 'engineer' | 'farmer'
    auth_provider = Column(String(50), default="local")                 # 'local' | 'google'
    preferred_language = Column(String(5), default="vi")                # 'vi' | 'en'
    preferred_theme = Column(String(10), default="dark")                # 'dark' | 'light'
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==============================================================================
# BẢNG 2: sensor_diagnostics (Khớp 100% schema.sql)
# ==============================================================================
class SensorDiagnostic(Base):
    __tablename__ = "sensor_diagnostics"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    source = Column(String(20), default="web")                          # 'web' | 'mobile_qr'
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    soil_ph = Column(REAL, nullable=False)
    soil_moisture = Column(REAL, nullable=False)
    air_temp_C = Column("air_temp_c", REAL, nullable=False)
    sunlight_hours = Column(REAL, nullable=False)
    pollution_index = Column(REAL, nullable=False)
    vegetation_density = Column(REAL, nullable=False)
    elevation_m = Column(REAL, nullable=False)
    proximity_to_water_m = Column(REAL, nullable=False)
    season = Column(String(20), nullable=False)
    plant_species = Column(String(50), nullable=False)
    stress_probability = Column(REAL, nullable=False)                   # Xác suất 0.00 -> 1.00
    is_stress = Column(Boolean, nullable=False)                         # True nếu bị stress
    risk_level = Column(String(20), nullable=False)                     # 'Optimal' | 'Warning' | 'Critical'
    root_causes = Column(JSON_FIELD, default=list)                      # Danh sách nguyên nhân bắt bệnh
    remediation = Column(Text, nullable=True)                           # Phác đồ can thiệp nông học


# ==============================================================================
# BẢNG 3: batch_scan_jobs (Khớp 100% schema.sql)
# ==============================================================================
class BatchScanJob(Base):
    __tablename__ = "batch_scan_jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    filename = Column(String(255), nullable=False)
    total_records = Column(Integer, nullable=False)
    stress_count = Column(Integer, nullable=False)
    healthy_count = Column(Integer, nullable=False)
    execution_time_ms = Column(REAL, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==============================================================================
# BẢNG 4: chat_history (Khớp 100% schema.sql)
# ==============================================================================
class ChatHistory(Base):
    __tablename__ = "chat_history"

    id = Column(BigInteger, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_id = Column(String(100), nullable=False, index=True)
    role = Column(String(10), nullable=False)                           # 'user' | 'bot'
    message = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    ai_provider = Column(String(20), default="internal")                # 'gemini' | 'internal'
    is_on_topic = Column(Boolean, default=True)
    response_time_ms = Column(REAL, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


# ==============================================================================
# BẢNG 6: websocket_sessions (Khớp 100% schema.sql)
# ==============================================================================
class WebSocketSession(Base):
    __tablename__ = "websocket_sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(100), unique=True, nullable=False, index=True)
    web_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    mobile_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), default="pending")                      # 'pending' | 'connected' | 'expired' | 'closed'
    qr_payload = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    connected_at = Column(DateTime(timezone=True), nullable=True)
    last_ping_at = Column(DateTime(timezone=True), nullable=True)
    device_info = Column(String(255), nullable=True)


# ==============================================================================
# BẢNG 5: actuator_logs (Khớp 100% schema.sql)
# ==============================================================================
class ActuatorLog(Base):
    __tablename__ = "actuator_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    diagnostic_id = Column(BigInteger, ForeignKey("sensor_diagnostics.id", ondelete="SET NULL"), nullable=True)
    command_type = Column(String(50), nullable=False)                   # 'irrigation' | 'misting' | 'fertilizer' | 'alert_notify'
    triggered_by = Column(String(20), nullable=False)                   # 'web_button' | 'mobile_button'
    target_device = Column(String(100), nullable=False)
    duration_sec = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)
    ws_session_id = Column(String(100), ForeignKey("websocket_sessions.session_id", ondelete="SET NULL"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
