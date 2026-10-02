from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models import ChatHistory, User
from backend.app.schemas import ChatMessageRequest, ChatMessageResponse
from backend.app.services.chat_service import get_chatbot_response
from backend.app.dependencies import security
from backend.app.services.auth_service import decode_access_token

router = APIRouter()


@router.post("/message", response_model=ChatMessageResponse)
def send_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db),
    auth = Depends(security)
):
    """
    API Hội thoại với Trợ lý Nông học AgriBot (Hybrid AI Chatbot):
    - Kiểm tra lọc chủ đề (Guardrails)
    - Tầng 1: Google Gemini API (nếu có key & online)
    - Tầng 2: Tri thức nông học nội bộ (Offline - Luôn trả lời tốt khi demo/thi)
    - Lưu lịch sử hội thoại vào bảng chat_history trong PostgreSQL
    """
    # 1. Xác định người dùng (nếu có Token)
    user_id = None
    if auth and auth.credentials:
        payload = decode_access_token(auth.credentials)
        if payload:
            email = payload.get("sub")
            user = db.query(User).filter(User.email == email).first()
            if user:
                user_id = user.id

    # 2. Xử lý câu trả lời qua Chat Service
    bot_result = get_chatbot_response(request.message)

    # 3. Ghi nhật ký vào database
    chat_record = ChatHistory(
        user_id=user_id,
        session_id=request.session_id,
        role="user",
        message=request.message,
        response=bot_result["response"],
        ai_provider=bot_result["ai_provider"],
        is_on_topic=bot_result["is_on_topic"],
        response_time_ms=bot_result["response_time_ms"]
    )
    db.add(chat_record)
    db.commit()
    db.refresh(chat_record)

    return ChatMessageResponse(
        id=chat_record.id,
        session_id=chat_record.session_id,
        role="bot",
        message=chat_record.message,
        response=chat_record.response,
        ai_provider=chat_record.ai_provider,
        is_on_topic=chat_record.is_on_topic,
        response_time_ms=chat_record.response_time_ms,
        timestamp=chat_record.timestamp
    )


@router.get("/history/{session_id}", response_model=List[ChatMessageResponse])
def get_chat_session_history(
    session_id: str,
    db: Session = Depends(get_db)
):
    """Lấy toàn bộ lịch sử trò chuyện của một phiên chat theo session_id"""
    messages = db.query(ChatHistory).filter(ChatHistory.session_id == session_id).order_by(ChatHistory.timestamp.asc()).all()
    
    res = []
    for m in messages:
        res.append(ChatMessageResponse(
            id=m.id,
            session_id=m.session_id,
            role=m.role,
            message=m.message,
            response=m.response,
            ai_provider=m.ai_provider,
            is_on_topic=m.is_on_topic,
            response_time_ms=m.response_time_ms,
            timestamp=m.timestamp
        ))
    return res
