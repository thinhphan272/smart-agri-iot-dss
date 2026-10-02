import os
import re
import time
import json
import urllib.request
from typing import Dict, Any, Tuple

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Danh sách từ khóa liên quan đến nông nghiệp, cây trồng, đất, phân bón, môi trường
AGRI_KEYWORDS = [
    "cây", "lá", "rễ", "thân", "đất", "ph", "nước", "ẩm", "nhiệt", "mưa", "nắng",
    "sâu", "bệnh", "nấm", "rầy", "chua", "kiềm", "hạn", "úng", "tưới", "bón",
    "phân", "đạm", "lân", "kali", "npk", "vôi", "thuốc", "lúa", "ngô", "rau",
    "trái", "hoa", "quả", "hạt", "vàng lá", "cháy lá", "héo", "rụng", "đọt",
    "thực vật", "nông nghiệp", "nông học", "sinh thái", "môi trường", "cảm biến",
    "plant", "leaf", "soil", "crop", "water", "fertilizer", "pest", "disease"
]

# Bộ tri thức nông học nội bộ chuyên sâu (Offline Knowledge Base)
INTERNAL_KNOWLEDGE = [
    {
        "keywords": ["chua", "ph thấp", "đất chua", "vôi"],
        "title": "Chẩn đoán & Xử lý Đất Chua (Axit hóa)",
        "content": """🌱 **CHẨN ĐOÁN & PHÁC ĐỒ XỬ LÝ ĐẤT CHUA (pH < 5.5)**:
• **Nguyên nhân**: Đất bị rửa trôi cation kiềm (Ca2+, Mg2+), lạm dụng phân hóa học gốc chua hoặc ngập nước yếm khí.
• **Triệu chứng**: Rễ cây còi cọc, đầu rễ thâm đen, lá non vàng nhạt, cây không hấp thụ được Lân (P) và Vi lượng.

📋 **Phác đồ can thiệp 4 bước**:
1. **Rải vôi khử chua**: Bón vôi bột nông nghiệp (CaCO3) liều lượng 350 - 500 kg/ha vào đầu mùa mưa hoặc trước khi làm đất.
2. **Tưới nước giữ ẩm**: Tưới nhẹ để vôi tan và ngấm đều vào tầng đất 0 - 20cm (không tưới ngập gây trôi vôi).
3. **Bổ sung phân hữu cơ vi sinh**: Sau khi bón vôi 10-14 ngày, bón 1-2 tấn phân trùn quế hoặc phân chuồng hoai mục để phục hồi hệ vi sinh.
4. **Kiểm tra định kỳ**: Đo lại pH đất sau 3 tuần, duy trì ổn định ở mức 6.0 - 6.8."""
    },
    {
        "keywords": ["vàng lá", "cháy lá", "héo", "đốm lá"],
        "title": "Chẩn đoán Hiện tượng Vàng lá & Cháy lá",
        "content": """🌿 **BẮT BỆNH HIỆN TƯỢNG VÀNG LÁ / CHÁY CHÓP LÁ**:
• **Vàng từ lá già dưới lên**: Thiếu Đạm (N) hoặc úng rễ cục bộ.
• **Vàng gân lá xanh (nghẹt vi lượng)**: Đất quá kiềm hoặc thiếu Sắt (Fe), Magie (Mg).
• **Cháy chóp lá và rìa lá**: Cây bị sốc mặn, sốc nhiệt hoặc thiếu Kali (K).

📋 **Biện pháp khắc phục**:
1. Giảm ngay 50% lượng phân đạm hóa học, tăng cường phân bón lá hữu cơ rong biển hoặc amino acid.
2. Kiểm tra độ ẩm đất: Nếu đất ẩm > 85%, ngừng tưới và rãnh thoát nước ngay.
3. Nếu nhiệt độ môi trường > 35°C, bật hệ thống phun sương làm mát giảm bốc hơi nước."""
    },
    {
        "keywords": ["hạn", "khô", "ẩm thấp", "thiếu nước", "nắng nóng"],
        "title": "Phác đồ Cấp cứu Cây bị Sốc nhiệt & Hạn hán",
        "content": """💧 **PHÁC ĐỒ CẤP CỨU CÂY BỊ SỐC NHIỆT & HẠN HÁN**:
• **Cảnh báo nguy cấp**: Khi độ ẩm đất < 20% và nhiệt độ > 36°C, cây bước vào pha héo rũ tế bào.

📋 **Quy trình cứu cây 3 bước**:
1. **Hạ nhiệt tức thì**: Kích hoạt trạm phun sương tiểu khí hậu (misting) 10-15 phút để hạ nhiệt tán lá 3-5°C.
2. **Tưới bù ẩm gốc**: Tưới nhỏ giọt vào sáng sớm (5:00 - 7:00) hoặc chiều mát (17:30 - 19:00). Tuyệt đối KHÔNG tưới đẫm lúc giữa trưa nắng gắt.
3. **Phủ mùn giữ ẩm (Mulching)**: Rải rơm rạ hoặc xác bã thực vật dày 5-7cm quanh gốc để ngăn chặn bốc hơi nước tầng mặt."""
    },
    {
        "keywords": ["úng", "ngập", "thối rễ", "ẩm cao"],
        "title": "Xử lý Đất Ngập úng & Thối rễ",
        "content": """⚠️ **XỬ LÝ ĐẤT NGẬP ÚNG & PHÒNG NGỪA NẤM THỐI RỄ**:
• **Tác hại**: Đất úng nước làm triệt tiêu Oxy, sinh ra khí độc H2S làm thối rễ tơ và tạo điều kiện cho nấm Phytophthora tấn công.

📋 **Giải pháp khẩn cấp**:
1. Khơi thông mương rãnh thoát nước ngay lập tức để hạ mực nước ngầm dưới 40cm.
2. Xới xáo nhẹ mặt luống sau khi nước rút để phá váng, giúp rễ thở lại.
3. Tưới chế phẩm nấm đối kháng Trichoderma kết hợp Humic để tái tạo hệ rễ tơ mới sau 5 ngày."""
    }
]


def check_is_on_topic(message: str) -> bool:
    """Kiểm tra câu hỏi của người dùng có nằm trong phạm vi nông nghiệp/cây trồng không"""
    msg_lower = message.lower()
    return any(kw in msg_lower for kw in AGRI_KEYWORDS)


def query_internal_knowledge(message: str) -> str:
    """Tra cứu bộ tri thức nông học nội bộ (Rule-based Offline Engine)"""
    msg_lower = message.lower()

    # Tìm kiến thức phù hợp nhất
    for item in INTERNAL_KNOWLEDGE:
        if any(kw in msg_lower for kw in item["keywords"]):
            return item["content"]

    # Phản hồi chuyên gia mặc định nếu không khớp từ khóa đặc thù
    return f"""🌿 **TƯ VẤN NÔNG HỌC TỪ AGRIGUARD-IOT**:

Cảm ơn bạn đã đặt câu hỏi về cây trồng: *"{message}"*.

Dựa trên cơ sở dữ liệu cảm biến thực địa, để cây sinh trưởng tối ưu bạn nên lưu ý:
1. **Độ pH đất**: Giữ ổn định ở khoảng 6.0 – 6.8 cho hầu hết cây trồng nhiệt đới.
2. **Độ ẩm đất lý tưởng**: Duy trì từ 55% – 70% dung tích ẩm đồng ruộng.
3. **Nhiệt độ an toàn**: Cây phát triển tốt nhất ở 22°C – 32°C. Khi vượt quá 35°C cần bật phun sương làm mát.
4. **Chăm sóc định kỳ**: Luân phiên bổ sung phân hữu cơ vi sinh và kiểm tra hệ thống thoát nước luống.

💡 *Bạn có thể nhập các chỉ số cảm biến cụ thể (pH, độ ẩm, nhiệt độ) để tôi bắt bệnh và kê phác đồ chính xác hơn nhé!*"""


def call_gemini_api(message: str) -> Tuple[str, bool]:
    """Gọi Google Gemini API nếu có key hợp lệ"""
    if not GEMINI_API_KEY or "your_gemini_api_key" in GEMINI_API_KEY:
        return "", False

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    system_prompt = (
        "Bạn là AgriBot - Chuyên gia Nông nghiệp Thông minh và Bác sĩ Cây trồng của hệ thống AgriGuard-IoT. "
        "Hãy trả lời bằng Tiếng Việt, ngắn gọn, súc tích, mang tính thực tế nông học cao, có các gạch đầu dòng rõ ràng và kèm icon sinh động."
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nNgười dùng hỏi: {message}"}
                ]
            }
        ]
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            answer = data["candidates"][0]["content"]["parts"][0]["text"]
            return answer, True
    except Exception as e:
        print(f"[!] Gemini API fallback to internal knowledge: {e}")
        return "", False


def get_chatbot_response(message: str) -> Dict[str, Any]:
    """Hàm điều phối Hybrid AI 2 tầng có Guardrails lọc chủ đề"""
    t0 = time.time()

    # 1. Bộ lọc Guardrails: Kiểm tra chủ đề
    if not check_is_on_topic(message):
        off_topic_reply = (
            "Xin lỗi bạn! Tôi là **AgriBot** — Trợ lý AI chuyên gia sức khỏe cây trồng của hệ thống **AgriGuard-IoT** 🌿\n\n"
            "Tôi chỉ có thể hỗ trợ các vấn đề về **cây trồng, độ pH đất, độ ẩm, nhiệt độ, sâu bệnh hại và môi trường sinh thái nông nghiệp**.\n\n"
            "Hãy hỏi tôi một câu hỏi về cây trồng nhé! 🌱"
        )
        return {
            "response": off_topic_reply,
            "ai_provider": "internal",
            "is_on_topic": False,
            "response_time_ms": round((time.time() - t0) * 1000, 2)
        }

    # 2. Tầng 1: Thử nghiệm Gemini API (Online)
    gemini_reply, success = call_gemini_api(message)
    if success and gemini_reply:
        return {
            "response": gemini_reply,
            "ai_provider": "gemini",
            "is_on_topic": True,
            "response_time_ms": round((time.time() - t0) * 1000, 2)
        }

    # 3. Tầng 2: Tri thức nội bộ (Offline - Luôn chạy tốt 100% kể cả không có internet)
    internal_reply = query_internal_knowledge(message)
    return {
        "response": internal_reply,
        "ai_provider": "internal",
        "is_on_topic": True,
        "response_time_ms": round((time.time() - t0) * 1000, 2)
    }
