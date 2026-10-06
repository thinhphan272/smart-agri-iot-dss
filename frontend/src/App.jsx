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
import { SocketProvider, useSocket } from './context/SocketContext';
import { predictAPI, qrAPI } from './services/api';

function MainDashboard() {
  const { t } = useLanguage();
  const { isConnected, connectToSession, sendMessage, lastMessage } = useSocket();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [modelSource, setModelSource] = useState('lightgbm'); // 'lightgbm' | 'spark'

  // Kiểm tra nếu người dùng vào từ điện thoại /mobile
  const isMobileRoute = window.location.pathname.includes('/mobile') || window.location.search.includes('session_id');
  const [showMobileStandalone, setShowMobileStandalone] = useState(isMobileRoute);

  // Phiên làm việc QR Code cố định duy nhất xuyên suốt các tab
  const [session, setSession] = useState(null);
  const [customHostIp, setCustomHostIp] = useState('192.168.1.17');
  const [lastPredictionId, setLastPredictionId] = useState(null);

  // 9 Thông số cảm biến mặc định (vùng sinh thái tối ưu)
  const [sensorData, setSensorData] = useState({
    soil_ph: 6.5,
    soil_moisture: 58.0,
    air_temp_C: 27.0,
    sunlight_hours: 8.0,
    pollution_index: 18.0,
    vegetation_density: 0.70,
    elevation_m: 20.0,
    proximity_to_water_m: 100.0,
    season: 'Summer',
    plant_species: 'Lúa nước',
    source: 'web'
  });

  // Kết quả AI dự đoán ban đầu
  const [prediction, setPrediction] = useState({
    stress_probability: 0.15,
    is_stress: false,
    risk_level: 'Optimal',
    root_causes: [],
    remediation: 'Hệ sinh thái đang ở trạng thái tối ưu. Tiếp tục duy trì chế độ tưới tiêu và dinh dưỡng định kỳ theo lịch trình chuẩn.',
    execution_time_ms: 1.45,
    diagnostic_id: null,
    model_source: 'lightgbm',
    active_threshold: 0.34
  });

  const [loadingPredict, setLoadingPredict] = useState(false);
  const debounceTimerRef = useRef(null);

  // Khởi tạo phiên QR Code 1 lần duy nhất trên toàn hệ thống (không bị đổi khi chuyển tab)
  useEffect(() => {
    initQRSession();
  }, []);

  const initQRSession = async () => {
    try {
      const res = await qrAPI.createSession();
      setSession(res.data);
      if (res.data.lan_ip) {
        setCustomHostIp(res.data.lan_ip);
      }
      connectToSession(res.data.session_id);
    } catch (err) {
      console.warn('Cannot create QR session:', err);
    }
  };

  // Gọi API dự đoán khi cảm biến hoặc nguồn trọng số mô hình thay đổi (Debounced 120ms)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoadingPredict(true);
      try {
        const res = await predictAPI.predict({
          ...sensorData,
          model_source: modelSource
        });
        setPrediction(res.data);
        if (res.data?.diagnostic_id) {
          setLastPredictionId(res.data.diagnostic_id);
        }
      } catch (err) {
        console.warn('Prediction API error:', err);
      } finally {
        setLoadingPredict(false);
      }
    }, 120);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [sensorData, modelSource]);

  // Nhận dữ liệu cập nhật từ điện thoại qua WebSocket
  const handleRemoteSensorUpdate = (remoteData) => {
    setSensorData(prev => ({
      ...prev,
      ...remoteData,
      source: 'mobile_qr'
    }));
  };

  // Lắng nghe dữ liệu cảm biến gửi từ Mobile qua WebSocket liên tục 24/7 ở mọi tab
  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'SENSOR_UPDATE' && lastMessage.payload) {
        handleRemoteSensorUpdate(lastMessage.payload);
      }
    }
  }, [lastMessage]);

  // Khôi phục các thông số cảm biến về vùng tối ưu sau khi phác đồ cứu cây hoàn tất
  const handleRecoverOptimal = (recovered) => {
    setSensorData(prev => {
      const updated = { ...prev, ...recovered, source: 'actuator_recovered' };
      // Đồng bộ ngay sang Mobile qua WebSocket để thanh trượt điện thoại cũng về an toàn!
      if (session) {
        sendMessage({
          type: 'SENSOR_UPDATE',
          session_id: session.session_id,
          payload: updated
        });
      }
      return updated;
    });
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
        <div style={{ display: activeTab === 'dashboard' ? 'block' : 'none' }}>
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
                modelSource={modelSource}
                onModelSourceChange={(src) => setModelSource(src)}
                activeThreshold={prediction.active_threshold || (modelSource === 'spark' ? 0.50 : 0.34)}
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
              sensorData={sensorData}
              onRecoverOptimal={handleRecoverOptimal}
            />
          </div>
        </div>

        {/* TAB 2: BIG DATA BATCH SCAN CSV */}
        <div style={{ display: activeTab === 'batch' ? 'block' : 'none' }}>
          <BatchScanner />
        </div>

        {/* TAB 3: ACADEMIC DUAL-TRACK HUB */}
        <div style={{ display: activeTab === 'academic' ? 'block' : 'none' }}>
          <AcademicHub />
        </div>

        {/* TAB 4: MOBILE QR LIVE SYNC */}
        <div style={{ display: activeTab === 'mobile_qr' ? 'block' : 'none' }}>
          <MobileQRSync 
            session={session}
            customHostIp={customHostIp}
            setCustomHostIp={setCustomHostIp}
            onRecreateSession={initQRSession}
            onRemoteSensorUpdate={handleRemoteSensorUpdate}
            lastPredictionId={lastPredictionId}
          />
        </div>
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
