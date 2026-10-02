import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import RiskGauge from './components/RiskGauge';
import SensorSliders from './components/SensorSliders';
import RootCauseCard from './components/RootCauseCard';
import BatchScanner from './components/BatchScanner';
import AcademicHub from './components/AcademicHub';
import MobileQRSync from './components/MobileQRSync';
import MobileView from './components/MobileView';
import ChatWidget from './components/ChatWidget';

import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { SocketProvider } from './context/SocketContext';
import { predictAPI } from './services/api';

function MainDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Kiểm tra nếu người dùng vào từ điện thoại /mobile
  const isMobileRoute = window.location.pathname.includes('/mobile') || window.location.search.includes('session_id');
  const [showMobileStandalone, setShowMobileStandalone] = useState(isMobileRoute);

  // 9 Thông số cảm biến mặc định
  const [sensorData, setSensorData] = useState({
    soil_ph: 6.2,
    soil_moisture: 48.0,
    air_temp_C: 28.5,
    sunlight_hours: 7.5,
    pollution_index: 22.0,
    vegetation_density: 0.65,
    elevation_m: 20.0,
    proximity_to_water_m: 120.0,
    season: 'Summer',
    plant_species: 'Lúa nước',
    source: 'web'
  });

  // Kết quả AI dự đoán
  const [prediction, setPrediction] = useState({
    stress_probability: 0.28,
    is_stress: false,
    risk_level: 'Warning',
    root_causes: ['Chỉ số môi trường bắt đầu có dấu hiệu khô nhẹ vào buổi trưa.'],
    remediation: '=== KHUYẾN NGHỊ NÔNG HỌC ===\n• Tiếp tục duy trì chế độ tưới sáng sớm. Theo dõi thêm chỉ số nhiệt độ mặt ruộng.',
    execution_time_ms: 1.45,
    diagnostic_id: null
  });

  const [loadingPredict, setLoadingPredict] = useState(false);
  const debounceTimerRef = useRef(null);

  // Gọi API dự đoán khi cảm biến thay đổi (Debounced 300ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingPredict(true);
      try {
        const res = await predictAPI.predict(sensorData);
        setPrediction(res.data);
      } catch (err) {
        console.warn('Prediction API error:', err);
      } finally {
        setLoadingPredict(false);
      }
    }, 280);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sensorData]);

  // Nhận dữ liệu cập nhật từ điện thoại qua WebSocket
  const handleRemoteSensorUpdate = (remoteData) => {
    setSensorData(prev => ({
      ...prev,
      ...remoteData,
      source: 'mobile_qr'
    }));
  };

  // Nếu đang ở màn hình Mobile độc lập (quét QR từ điện thoại)
  if (showMobileStandalone) {
    return (
      <MobileView onBackToWeb={() => setShowMobileStandalone(false)} />
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Sticky Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main style={{ maxWidth: 1440, width: '100%', margin: '0 auto', padding: '24px 24px 80px 24px', flex: 1 }}>
        {/* TAB 1: REAL-TIME DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Grid: Gauge Meter on Left, Sliders on Right */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(300px, 360px) 1fr',
              gap: 24,
              alignItems: 'start'
            }}>
              <RiskGauge
                probability={prediction.stress_probability}
                riskLevel={prediction.risk_level}
                latency={prediction.execution_time_ms}
                isStress={prediction.is_stress}
              />

              <SensorSliders
                sensorData={sensorData}
                onChange={setSensorData}
              />
            </div>

            {/* Bottom: Root Cause Diagnosis & Prescriptive Treatment Plan */}
            <RootCauseCard
              rootCauses={prediction.root_causes}
              remediation={prediction.remediation}
              riskLevel={prediction.risk_level}
              diagnosticId={prediction.diagnostic_id}
            />
          </div>
        )}

        {/* TAB 2: BIG DATA BATCH SCAN CSV */}
        {activeTab === 'batch' && <BatchScanner />}

        {/* TAB 3: ACADEMIC DUAL-TRACK HUB */}
        {activeTab === 'academic' && <AcademicHub />}

        {/* TAB 4: MOBILE QR LIVE SYNC */}
        {activeTab === 'mobile_qr' && (
          <MobileQRSync onRemoteSensorUpdate={handleRemoteSensorUpdate} />
        )}
      </main>

      {/* Floating Hybrid AI Doctor Chat Widget */}
      <ChatWidget />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <SocketProvider>
          <MainDashboard />
        </SocketProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
