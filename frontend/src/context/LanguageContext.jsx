import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const dictionary = {
  vi: {
    // Navbar
    brandTitle: "AgriGuard-IoT",
    brandSubtitle: "Hệ thống Ra quyết định Nông học Thông minh",
    tabDashboard: "Bảng Điều Khiển Realtime",
    tabBatch: "Quét Lô Big Data CSV",
    tabAcademic: "Báo Cáo Đối Chứng Học Thuật",
    tabMobile: "Trạm Thực Địa Di Động (QR)",
    btnDemoLogin: "Đăng Nhập Nhanh",
    btnLogout: "Đăng Xuất",
    roleAdmin: "Hội Đồng / Admin",
    roleEngineer: "Kỹ Sư Nông Học",
    roleFarmer: "Nông Dân / Khách",
    roleGuest: "Khách Xem",

    // Dashboard
    heroTitle: "Giám Sát Stress Sinh Thái Cây Trồng Thời Gian Thực",
    heroDesc: "Kết hợp 9 kênh cảm biến vật lý, mô hình LightGBM tối ưu ngưỡng T*=0.34 và giao thức can thiệp nông học tức thì.",
    riskGaugeTitle: "Chỉ Số Nguy Cơ Stress Sinh Thái",
    statusOptimal: "SINH TRƯỞNG TỐI ƯU",
    statusWarning: "CẢNH BÁO SỚM — SUY THOÁI",
    statusCritical: "BÁO ĐỘNG ĐỎ — CẦN CỨU CÂY!",
    stressProbLabel: "Xác Suất Stress Dự Đoán",
    execTimeLabel: "Thời Gian Xử Lý AI",

    // Sliders
    soilPh: "Độ pH Đất",
    soilMoisture: "Độ Ẩm Đất",
    airTemp: "Nhiệt Độ Không Khí",
    sunlight: "Số Giờ Nắng",
    pollution: "Chỉ Số Ô Nhiễm",
    vegDensity: "Mật Độ Thảm Thực Vật",
    proximityWater: "Khoảng Cách Đến Nước",
    elevation: "Độ Cao Địa Hình",
    season: "Mùa Vụ",
    plantSpecies: "Loài Cây Trồng",

    // Root Cause & Prescription
    rootCauseTitle: "Chẩn Đoán Bắt Bệnh & Phác Đồ Can Thiệp",
    rootCauseHeader: "Nguyên Nhân Gốc Rễ Phát Hiện",
    remediationHeader: "Phác Đồ Điều Trị Nông Học",
    btnTriggerMisting: "Bật Phun Sương Làm Mát",
    btnTriggerPump: "Kích Hoạt Máy Bơm Tưới",
    btnTriggerAlert: "Phát Cảnh Báo Âm Thanh",

    // Batch Scanner
    batchTitle: "Quét Lô Dữ Liệu Lớn Big Data (CSV Batch Scan)",
    batchDesc: "Xử lý hàng nghìn bản ghi cảm biến đồng thời bằng công nghệ Vectorized LightGBM với thông lượng > 1,500 mẫu/giây.",
    btnDownloadSample: "Tải File CSV Mẫu (100 dòng)",
    dropzoneText: "Kéo thả tệp CSV vào đây hoặc bấm để chọn tệp",
    btnUploadScan: "Tiến Hành Quét & Bắt Bệnh Toàn Bộ",

    // Chatbot
    chatTitle: "AgriBot — Bác Sĩ Cây Trồng Thông Minh",
    chatPlaceholder: "Nhập câu hỏi về sâu bệnh, đất chua, phân bón...",
    chatSend: "Gửi",
    chatWelcome: "Xin chào! Tôi là AgriBot — Trợ lý AI nông học. Hãy cho tôi biết tình trạng cây trồng hoặc chỉ số cảm biến để tôi tư vấn phác đồ điều trị nhé! 🌿",
  },
  en: {
    // Navbar
    brandTitle: "AgriGuard-IoT",
    brandSubtitle: "Smart Agro-Ecological Decision Support",
    tabDashboard: "Real-Time Dashboard",
    tabBatch: "Big Data Batch Scan",
    tabAcademic: "Academic Dual-Track Hub",
    tabMobile: "Mobile Field Station (QR)",
    btnDemoLogin: "Quick Demo Login",
    btnLogout: "Sign Out",
    roleAdmin: "Review Board / Admin",
    roleEngineer: "Field Agro-Engineer",
    roleFarmer: "Farmer / Grower",
    roleGuest: "Guest Viewer",

    // Dashboard
    heroTitle: "Real-Time Plant Eco-Stress Monitoring & Diagnostics",
    heroDesc: "Fusing 9 environmental sensor streams, LightGBM inference at optimal T*=0.34 threshold, and instant prescriptive agronomic protocols.",
    riskGaugeTitle: "Eco-Stress Risk Gauge",
    statusOptimal: "OPTIMAL GROWTH",
    statusWarning: "EARLY WARNING DEGRADATION",
    statusCritical: "CRITICAL ALERT — INTERVENE NOW!",
    stressProbLabel: "Predicted Stress Probability",
    execTimeLabel: "AI Inference Latency",

    // Sliders
    soilPh: "Soil pH Level",
    soilMoisture: "Soil Moisture",
    airTemp: "Air Temperature",
    sunlight: "Sunlight Hours",
    pollution: "Pollution Index",
    vegDensity: "Vegetation Density",
    proximityWater: "Proximity to Water",
    elevation: "Terrain Elevation",
    season: "Season",
    plantSpecies: "Plant Species",

    // Root Cause & Prescription
    rootCauseTitle: "Root-Cause Diagnosis & Prescriptive Protocol",
    rootCauseHeader: "Identified Ecological Stressors",
    remediationHeader: "Agronomic Treatment Plan",
    btnTriggerMisting: "Trigger Misting Sprayer",
    btnTriggerPump: "Trigger Irrigation Pump",
    btnTriggerAlert: "Trigger Audio Siren Alert",

    // Batch Scanner
    batchTitle: "Big Data High-Throughput Batch CSV Scan",
    batchDesc: "Process thousands of sensor rows simultaneously via vectorized LightGBM inference with throughput > 1,500 records/sec.",
    btnDownloadSample: "Download Sample CSV (100 rows)",
    dropzoneText: "Drag & drop CSV dataset here or click to browse",
    btnUploadScan: "Execute High-Speed Batch Diagnosis",

    // Chatbot
    chatTitle: "AgriBot — Intelligent Agro-Physician",
    chatPlaceholder: "Ask about plant disease, soil acidity, fertilizers...",
    chatSend: "Send",
    chatWelcome: "Hello! I am AgriBot, your smart agricultural AI consultant. Share your plant symptoms or sensor readings for an instant treatment protocol! 🌿",
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(localStorage.getItem('agri_lang') || 'vi');

  const toggleLanguage = () => {
    const nextLang = lang === 'vi' ? 'en' : 'vi';
    setLang(nextLang);
    localStorage.setItem('agri_lang', nextLang);
  };

  const t = (key) => {
    return dictionary[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
