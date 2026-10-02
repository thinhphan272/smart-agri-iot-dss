import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Droplet, 
  Thermometer, 
  FlaskConical, 
  Wind, 
  CheckCircle2, 
  Vibrate, 
  Radio, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { qrAPI } from '../services/api';

export default function MobileView({ onBackToWeb }) {
  const { role, quickDemoLogin } = useAuth();
  const [sessionId, setSessionId] = useState('AGRI-998-DEMO');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // Cảm biến di động
  const [sensors, setSensors] = useState({
    soil_ph: 6.2,
    soil_moisture: 45.0,
    air_temp_C: 29.5,
  });

  const [hapticFeedback, setHapticFeedback] = useState(null);

  useEffect(() => {
    // Đọc session_id từ URL nếu có
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id') || 'AGRI-998-DEMO';
    setSessionId(sid);

    // Mở kết nối WebSocket
    const ws = new WebSocket(`ws://localhost:8000/ws/live-sync/${sid}`);
    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'ACTUATOR_ACTIVATED' || msg.type === 'ACTUATOR_COMMAND') {
          // Rung điện thoại phản hồi xúc giác Haptic
          if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
          }
          setHapticFeedback(`📳 Rung phản hồi: ${msg.target_device || msg.command_type} đã được bật!`);
          setTimeout(() => setHapticFeedback(null), 4000);
        }
      } catch (e) {}
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const handleSliderChange = (field, val) => {
    const numVal = parseFloat(val);
    const updated = { ...sensors, [field]: numVal };
    setSensors(updated);

    // Bắn WebSocket sang màn hình máy tính Web Command Center
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'SENSOR_UPDATE',
        payload: {
          ...updated,
          sunlight_hours: 8.0,
          pollution_index: 25.0,
          vegetation_density: 0.65,
          season: 'Summer',
          plant_species: 'Lúa nước',
          source: 'mobile_qr'
        }
      }));
    }
  };

  const handleTriggerDevice = async (deviceType, deviceName) => {
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
    try {
      await qrAPI.triggerActuator({
        command_type: deviceType,
        target_device: deviceName,
        duration_sec: 15,
        triggered_by: 'mobile_button',
        ws_session_id: sessionId
      });
      setHapticFeedback(`✅ Đã gửi lệnh kích hoạt ${deviceName} thành công!`);
      setTimeout(() => setHapticFeedback(null), 3000);
    } catch (err) {
      alert('Không thể kích hoạt thiết bị từ xa.');
    }
  };

  return (
    <div style={{
      maxWidth: 480,
      margin: '0 auto',
      minHeight: '100vh',
      background: '#070c0a',
      color: '#f1f5f3',
      padding: '16px 14px',
      display: 'flex',
      flexDirection: 'column',
      gap: 16
    }}>
      {/* Top Mobile Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '14px',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {onBackToWeb && (
          <button 
            onClick={onBackToWeb}
            style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}
          >
            <ArrowLeft size={16} /> Web
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-optimal)' }}>
            📱 Trạm Thực Địa
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#94a3b8' }}>
            #{sessionId}
          </span>
        </div>

        <div className={`badge ${isConnected ? 'badge-optimal' : 'badge-warning'}`} style={{ fontSize: '0.68rem', padding: '3px 8px' }}>
          {isConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {isConnected ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Haptic Alert Notification */}
      {hapticFeedback && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(16, 185, 129, 0.2)',
          border: '1px solid var(--color-optimal)',
          borderRadius: '12px',
          color: '#34d399',
          fontSize: '0.84rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'bounce 0.5s ease'
        }}>
          <span>{hapticFeedback}</span>
        </div>
      )}

      {/* Role Quick Switch for Mobile Testing */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
        <button 
          onClick={() => quickDemoLogin('engineer')}
          className="btn btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: '8px' }}
        >
          ⚡ Kỹ Sư
        </button>
        <button 
          onClick={() => quickDemoLogin('farmer')}
          className="btn btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '5px 10px', borderRadius: '8px' }}
        >
          🌾 Nông Dân
        </button>
      </div>

      {/* Touch Sliders Container */}
      <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-optimal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={16} />
          <span>Gạt Thanh Trượt — Máy Tính Nhảy Ngay!</span>
        </div>

        {/* Soil pH */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FlaskConical size={16} color="#10b981" /> Độ pH Đất
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#10b981' }}>
              {sensors.soil_ph} pH
            </span>
          </div>
          <input
            type="range"
            min="3.5"
            max="9.0"
            step="0.1"
            value={sensors.soil_ph}
            onChange={(e) => handleSliderChange('soil_ph', e.target.value)}
            style={{ width: '100%', height: '8px', accentColor: '#10b981' }}
          />
        </div>

        {/* Soil Moisture */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Droplet size={16} color="#06b6d4" /> Độ Ẩm Đất
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#06b6d4' }}>
              {sensors.soil_moisture}%
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="95"
            step="1"
            value={sensors.soil_moisture}
            onChange={(e) => handleSliderChange('soil_moisture', e.target.value)}
            style={{ width: '100%', height: '8px', accentColor: '#06b6d4' }}
          />
        </div>

        {/* Air Temp */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Thermometer size={16} color="#f59e0b" /> Nhiệt Độ Không Khí
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#f59e0b' }}>
              {sensors.air_temp_C}°C
            </span>
          </div>
          <input
            type="range"
            min="15"
            max="45"
            step="0.5"
            value={sensors.air_temp_C}
            onChange={(e) => handleSliderChange('air_temp_C', e.target.value)}
            style={{ width: '100%', height: '8px', accentColor: '#f59e0b' }}
          />
        </div>
      </div>

      {/* Actuator Trigger Remote Buttons */}
      <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
          KÍCH HOẠT THIẾT BỊ TỪ XA (HAPTIC)
        </div>

        <button
          onClick={() => handleTriggerDevice('misting', 'Phun Sương Làm Mát Vùng 1')}
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
        >
          <Wind size={18} />
          <span>Bật Phun Sương Làm Mát</span>
        </button>

        <button
          onClick={() => handleTriggerDevice('irrigation', 'Máy Bơm Tưới Gốc')}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '12px', fontSize: '0.9rem', color: '#38bdf8' }}
        >
          <Droplet size={18} />
          <span>Bật Bơm Tưới Bù Ẩm</span>
        </button>
      </div>
    </div>
  );
}
