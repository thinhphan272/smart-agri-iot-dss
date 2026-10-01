CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS actuator_logs CASCADE;
DROP TABLE IF EXISTS websocket_sessions CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS batch_scan_jobs CASCADE;
DROP TABLE IF EXISTS sensor_diagnostics CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==============================================================================
-- BẢNG 1: users (Quản lý Người dùng, Phân quyền RBAC & Cài đặt hiển thị)
-- ==============================================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255),           -- NULL nếu đăng nhập bằng Google OAuth
    full_name VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(20) NOT NULL DEFAULT 'farmer', -- 'admin' | 'engineer' | 'farmer'
    auth_provider VARCHAR(50) DEFAULT 'local',  -- 'local' | 'google'
    preferred_language VARCHAR(5) DEFAULT 'vi', -- 'vi' (Tiếng Việt) | 'en' (English)
    preferred_theme VARCHAR(10) DEFAULT 'dark', -- 'dark' | 'light'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- ==============================================================================
-- BẢNG 2: sensor_diagnostics (Lịch sử Chẩn đoán Cảm biến & Dự đoán AI LightGBM)
-- ==============================================================================

CREATE TABLE sensor_diagnostics (

    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(20) DEFAULT 'web',      -- 'web' hoặc 'mobile_qr'
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    soil_ph REAL NOT NULL, 
    soil_moisture REAL NOT NULL,
    air_temp_C REAL NOT NULL,
    sunlight_hours REAL NOT NULL,
    pollution_index REAL NOT NULL,
    vegetation_density REAL NOT NULL,
    elevation_m REAL NOT NULL,
    proximity_to_water_m REAL NOT NULL,
    season VARCHAR(20) NOT NULL,
    plant_species VARCHAR(50) NOT NULL,
    stress_probability REAL NOT NULL,       -- Xác suất 0.00 -> 1.00 từ LightGBM
    is_stress BOOLEAN NOT NULL,             -- TRUE nếu stress_probability >= 0.34
    risk_level VARCHAR(20) NOT NULL,        --'Optimal' | 'Warning' | 'Critical'
    root_causes JSONB DEFAULT '[]'::jsonb,  -- Danh sách nguyên nhân bắt bệnh
    remediation TEXT                        -- Phác đồ can thiệp nông học
);


CREATE INDEX idx_sensor_diag_user_id ON sensor_diagnostics(user_id);
CREATE INDEX idx_sensor_diag_timestamp ON sensor_diagnostics(timestamp DESC);


-- ==============================================================================
-- BẢNG 3: batch_scan_jobs (Nhật ký Quét Lô Dữ liệu Lớn CSV - Big Data Jobs)
-- ==============================================================================

CREATE TABLE batch_scan_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    filename VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL,
    stress_count INTEGER NOT NULL,
    healthy_count INTEGER NOT NULL,
    execution_time_ms REAL NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_batch_jobs_user_id ON batch_scan_jobs(user_id);

-- ==============================================================================
-- BẢNG 4: chat_history (Nhật ký Hội thoại với Trợ lý AI AgriBot)
-- ==============================================================================

CREATE TABLE chat_history(
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    session_id VARCHAR(100) NOT NULL,            --Định danh phiên chat trình duyệt
    role VARCHAR(10) NOT NULL,                  --'user' hoặc 'bot'
    message TEXT NOT NULL,
    response TEXT,
    ai_provider VARCHAR(20) DEFAULT 'internal', --'gemini' | 'internal'
    is_on_topic BOOLEAN DEFAULT TRUE,
    response_time_ms REAL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_chat_session_id ON chat_history(session_id);
CREATE INDEX idx_chat_user_id ON chat_history(user_id);


-- ==============================================================================
-- BẢNG 6: websocket_sessions (Quản lý Phiên Kết nối QR Code ↔ Mobile Thực địa)
-- ==============================================================================

CREATE TABLE websocket_sessions(
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,    --Mã phiên trong QR (VD: 'AGRI-998-XK2')
    web_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mobile_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'pending', --'pending' | 'connected' | 'expired' | 'closed'
    qr_payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    connected_at TIMESTAMP WITH TIME ZONE,
    last_ping_at TIMESTAMP WITH TIME ZONE,
    device_info VARCHAR(255)

);

CREATE INDEX idx_ws_session_id ON websocket_sessions(session_id);

-- ==============================================================================
-- BẢNG 5: actuator_logs (Nhật ký Kích hoạt Thiết bị Cứu Cây)
-- ==============================================================================
CREATE TABLE actuator_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    diagnostic_id BIGINT REFERENCES sensor_diagnostics(id) ON DELETE SET NULL,
    command_type VARCHAR(50) NOT NULL,      -- 'irrigation' | 'misting' | 'fertilizer' | 'alert_notify'
    triggered_by VARCHAR(20) NOT NULL,      -- 'web_button' | 'mobile_button'
    target_device VARCHAR(100) NOT NULL,
    duration_sec INTEGER DEFAULT 0,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    ws_session_id VARCHAR(100) REFERENCES websocket_sessions(session_id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_actuator_logs_user_id ON actuator_logs(user_id);
CREATE INDEX idx_actuator_logs_diag_id ON actuator_logs(diagnostic_id);



-- ==============================================================================
-- SEED DATA: TÀI KHOẢN MẪU ĐỂ BẢO VỆ ĐỒ ÁN / DEMO
-- ==============================================================================
-- Mật khẩu ban đầu:
--   admin@agri-iot.vn     -> admin123
--   engineer@agri-iot.vn  -> engineer123
--   farmer@agri-iot.vn    -> farmer123
-- ==============================================================================

INSERT INTO users (email, hashed_password, full_name, role, auth_provider, preferred_language, preferred_theme)


VALUES 
(
    'admin@agri-iot.vn',
    '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
    'Quản trị viên Hệ thống (Admin)',
    'admin',
    'local',
    'vi',
    'dark'
),
(
    'engineer@agri-iot.vn',
    '$2b$12$4YlW1J8L5d2G5kO4WqJt7.7x/c1Tj1x9ZqWq2.2P7eY5l1kK1yM0S',
    'Kỹ sư Nông học Thực địa',
    'engineer',
    'local',
    'vi',
    'dark'
),
(
    'farmer@agri-iot.vn',
    '$2b$12$9/aJ3nC6z0P8yT4uE1bM9.eX8z2Y1v4kL5mN6oP7qR8sT9uV0wX2Y',
    'Chủ Nông hộ / Nông dân',
    'farmer',
    'local',
    'vi',
    'dark'
)
ON CONFLICT (email) DO NOTHING;