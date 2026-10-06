import uuid
import json
import socket
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import WebSocketSession, ActuatorLog, User
from backend.app.schemas import (
    ActuatorTriggerRequest,
    ActuatorLogResponse,
    WebSocketSessionResponse
)
from backend.app.dependencies import security
from backend.app.services.auth_service import decode_access_token

router = APIRouter()

def get_lan_ip() -> str:
    """Tự động phát hiện IP LAN nội bộ của máy chủ để phát mã QR cho điện thoại di động"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "192.168.1.17"


class ConnectionManager:
    """Quản lý các kết nối WebSocket thời gian thực giữa Web và Mobile"""
    def __init__(self):
        # session_id -> list of active WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.active_connections:
            self.active_connections[session_id] = []
        self.active_connections[session_id].append(websocket)
        print(f"[WS] Client connected to session: {session_id} (Total: {len(self.active_connections[session_id])})")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.active_connections:
            if websocket in self.active_connections[session_id]:
                self.active_connections[session_id].remove(websocket)
            if not self.active_connections[session_id]:
                del self.active_connections[session_id]
        print(f"[WS] Client disconnected from session: {session_id}")

    async def broadcast(self, session_id: str, message: dict, sender: Optional[WebSocket] = None):
        """Phát tin nhắn đồng bộ hai chiều tới tất cả các máy trong cùng phiên (Web + Mobile)"""
        if session_id in self.active_connections:
            text_data = json.dumps(message)
            for connection in self.active_connections[session_id]:
                # Không gửi lại cho chính người gửi nếu cần, hoặc gửi tất cả để đồng bộ trạng thái
                try:
                    await connection.send_text(text_data)
                except Exception as e:
                    print(f"[WS Error] Failed to send message: {e}")


ws_manager = ConnectionManager()


# ==============================================================================
# 1. WEBSOCKET ENDPOINT
# ==============================================================================
@router.websocket("/ws/live-sync/{session_id}")
async def websocket_live_sync(websocket: WebSocket, session_id: str, db: Session = Depends(get_db)):
    """
    Kênh WebSocket đồng bộ siêu tốc < 50ms giữa Web Command Center và Mobile Field Station:
    - Nhận cảm biến từ Mobile -> Cập nhật kim đồng hồ trên Web tức thì
    - Bấm nút trên Web -> Gửi lệnh rung phản hồi xúc giác (Haptic) sang điện thoại
    """
    await ws_manager.connect(session_id, websocket)

    # Cập nhật trạng thái session trong database
    db_session = db.query(WebSocketSession).filter(WebSocketSession.session_id == session_id).first()
    if db_session:
        db_session.status = "connected"
        db_session.connected_at = datetime.now(timezone.utc)
        db_session.last_ping_at = datetime.now(timezone.utc)
        db.commit()

    # Gửi thông điệp chào mừng kết nối thành công
    await websocket.send_text(json.dumps({
        "type": "CONNECTION_ESTABLISHED",
        "session_id": session_id,
        "message": "Trạm Thực địa Di động đã kết nối thành công qua WebSocket Hub!",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }))

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
            except Exception:
                msg = {"type": "RAW_TEXT", "payload": data_text}

            # Cập nhật thời gian ping sống
            if db_session:
                db_session.last_ping_at = datetime.now(timezone.utc)
                db.commit()

            # Broadcast dữ liệu sang tất cả các thiết bị cùng phiên
            await ws_manager.broadcast(session_id, msg, sender=websocket)

    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
        if db_session and (session_id not in ws_manager.active_connections):
            db_session.status = "closed"
            db.commit()


# ==============================================================================
# 2. REST API: TẠO MÃ PHIÊN QR CODE CHO MOBILE
# ==============================================================================
@router.post("/qr/create-session", response_model=WebSocketSessionResponse)
def create_qr_session(
    db: Session = Depends(get_db),
    auth = Depends(security)
):
    """
    Tạo phiên kết nối QR Code mới có hiệu lực trong 30 phút:
    - Web bấm 'Kết nối trạm di động' -> Nhận mã session và đường link QR
    """
    user_id = None
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload:
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_id = user.id

    # Sinh mã phiên định danh duy nhất (VD: AGRI-998-A1B2)
    short_uuid = uuid.uuid4().hex[:4].upper()
    session_id = f"AGRI-998-{short_uuid}"
    
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    lan_ip = get_lan_ip()
    mobile_url = f"http://{lan_ip}:5173/mobile?session_id={session_id}"
    qr_payload = mobile_url

    new_session = WebSocketSession(
        session_id=session_id,
        web_user_id=user_id,
        status="pending",
        qr_payload=qr_payload,
        expires_at=expires_at
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)

    return WebSocketSessionResponse(
        session_id=new_session.session_id,
        status=new_session.status,
        qr_payload=new_session.qr_payload,
        expires_at=new_session.expires_at,
        connected_at=new_session.connected_at,
        lan_ip=lan_ip,
        mobile_url=mobile_url
    )


# ==============================================================================
# 3. REST API: KÍCH HOẠT THIẾT BỊ CỨU CÂY (ACTUATOR TRIGGER)
# ==============================================================================
@router.post("/actuators/trigger", response_model=ActuatorLogResponse)
async def trigger_actuator(
    req: ActuatorTriggerRequest,
    db: Session = Depends(get_db),
    auth = Depends(security)
):
    """
    Kích hoạt thiết bị cứu cây (Bơm nước, Phun sương, Bón phân, Chuông cảnh báo):
    - Ghi nhận lệnh vào bảng actuator_logs
    - Bắn tín hiệu WebSocket thông báo realtime tới Web và Mobile
    """
    user_id = None
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload:
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_id = user.id

    log_record = ActuatorLog(
        user_id=user_id,
        diagnostic_id=req.diagnostic_id,
        command_type=req.command_type,
        triggered_by=req.triggered_by,
        target_device=req.target_device,
        duration_sec=req.duration_sec,
        success=True,
        ws_session_id=req.ws_session_id
    )
    db.add(log_record)
    db.commit()
    db.refresh(log_record)

    # Nếu có ws_session_id, phát lệnh WebSocket sang các thiết bị
    if req.ws_session_id:
        await ws_manager.broadcast(req.ws_session_id, {
            "type": "ACTUATOR_ACTIVATED",
            "command_type": req.command_type,
            "target_device": req.target_device,
            "duration_sec": req.duration_sec,
            "triggered_by": req.triggered_by,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

    return ActuatorLogResponse(
        id=log_record.id,
        command_type=log_record.command_type,
        triggered_by=log_record.triggered_by,
        target_device=log_record.target_device,
        duration_sec=log_record.duration_sec,
        success=log_record.success,
        error_message=log_record.error_message,
        timestamp=log_record.timestamp
    )


@router.get("/actuators/logs", response_model=List[ActuatorLogResponse])
def get_actuator_logs(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Lấy danh sách nhật ký kích hoạt thiết bị gần nhất"""
    logs = db.query(ActuatorLog).order_by(desc(ActuatorLog.timestamp)).limit(limit).all()
    return logs
