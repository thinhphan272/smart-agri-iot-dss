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
  ArrowLeft,
  Waves,
  BellRing,
  Sun,
  Sprout
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { qrAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function MobileView({ onBackToWeb }) {
  const { role, quickDemoLogin } = useAuth();
  const { lang, t, tText } = useLanguage();
  const [sessionId, setSessionId] = useState('AGRI-998-DEMO');
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);

  // Cảm biến di động
  const [sensors, setSensors] = useState({
    soil_ph: 6.2,
    soil_moisture: 45.0,
    air_temp_C: 29.5,
  });

  // Mùa vụ & Giống cây trồng
  const [season, setSeason] = useState('Summer');
  const [plantSpecies, setPlantSpecies] = useState('Lúa nước');

  const [hapticFeedback, setHapticFeedback] = useState(null);

  useEffect(() => {
    // Đọc session_id từ URL nếu có
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('session_id') || 'AGRI-998-DEMO';
    setSessionId(sid);

    // Mở kết nối WebSocket linh hoạt theo IP máy chủ
    const host = window.location.hostname || 'localhost';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${host}:8000/ws/live-sync/${sid}`);
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
          setHapticFeedback(lang === 'vi' 
            ? `📳 Rung phản hồi: ${msg.target_device || msg.command_type} đã được kích hoạt!`
            : `📳 Haptic response: ${tText(msg.target_device || msg.command_type)} activated!`
          );
          setTimeout(() => setHapticFeedback(null), 4000);
        } else if (msg.type === 'SENSOR_UPDATE' && msg.payload) {
          // Nhận đồng bộ cảm biến từ Web
          if (msg.payload.soil_ph !== undefined) {
            setSensors(prev => ({
              ...prev,
              soil_ph: msg.payload.soil_ph,
              soil_moisture: msg.payload.soil_moisture,
              air_temp_C: msg.payload.air_temp_C
            }));
          }
          if (msg.payload.season) setSeason(msg.payload.season);
          if (msg.payload.plant_species) setPlantSpecies(msg.payload.plant_species);
        }
      } catch (e) {}
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, []);

  const sendSensorUpdate = (updatedSensors, updatedSeason = season, updatedSpecies = plantSpecies) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'SENSOR_UPDATE',
        session_id: sessionId,
        payload: {
          ...updatedSensors,
          sunlight_hours: 8.0,
          pollution_index: 25.0,
          vegetation_density: 0.65,
          season: updatedSeason,
          plant_species: updatedSpecies,
          source: 'mobile_qr'
        }
      }));
    }
  };

  const handleSliderChange = (field, val) => {
    const numVal = parseFloat(val);
    const updated = { ...sensors, [field]: numVal };
    setSensors(updated);
    sendSensorUpdate(updated);
  };

  const handlePresetClick = (preset, label) => {
    setSensors(preset);
    sendSensorUpdate(preset);
    setHapticFeedback(lang === 'vi'
      ? `📡 Đã áp dụng kịch bản ${label} và đồng bộ sang Web!`
      : `📡 Applied scenario ${label} and synchronized to Web!`
    );
    setTimeout(() => setHapticFeedback(null), 3000);
  };

  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason);
    sendSensorUpdate(sensors, newSeason, plantSpecies);
  };

  const handleSpeciesChange = (newSpecies) => {
    setPlantSpecies(newSpecies);
    sendSensorUpdate(sensors, season, newSpecies);
  };

  const handleTriggerDevice = async (deviceType, deviceName) => {
    // 1. Kiểm tra trạng thái hiện tại trên Mobile
    const isOptimal = sensors.soil_moisture >= 50 && sensors.soil_moisture <= 70 && sensors.soil_ph >= 6.0 && sensors.soil_ph <= 7.0 && sensors.air_temp_C <= 32;
    if (isOptimal) {
      setHapticFeedback(lang === 'vi'
        ? '⚠️ Cây đang tối ưu lý tưởng! Không cần bật thiết bị cứu cây lúc này.'
        : '⚠️ Plants are in optimal equilibrium! No rescue actuator needed right now.'
      );
      setTimeout(() => setHapticFeedback(null), 4000);
      return;
    }

    // 2. Kiểm tra phác đồ sai
    if (sensors.soil_moisture >= 80.0 && deviceType === 'irrigation') {
      setHapticFeedback(lang === 'vi'
        ? `❌ Đất đang ngập úng (${sensors.soil_moisture}%), bơm tưới thêm nước sẽ làm chết rễ! Hãy chọn Tiêu Úng.`
        : `❌ Soil is waterlogged (${sensors.soil_moisture}%); irrigating further will suffocate roots! Please select Drainage.`
      );
      setTimeout(() => setHapticFeedback(null), 5000);
      return;
    }
    if (sensors.soil_moisture <= 30.0 && deviceType === 'drainage') {
      setHapticFeedback(lang === 'vi'
        ? `❌ Đất đang khô hạn (${sensors.soil_moisture}%), không được tiêu úng! Hãy chọn Bơm Bù Ẩm.`
        : `❌ Soil is severely dry (${sensors.soil_moisture}%); do not drain! Please select Drip Irrigation.`
      );
      setTimeout(() => setHapticFeedback(null), 5000);
      return;
    }

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

      // Tự động khôi phục cảm biến về tối ưu sau khi cứu cây!
      let recovered = { ...sensors };
      if (deviceType === 'drainage') recovered.soil_moisture = 58.0;
      else if (deviceType === 'irrigation') recovered.soil_moisture = 60.0;
      else if (deviceType === 'misting') {
        recovered.air_temp_C = 26.5;
        recovered.soil_moisture = 58.0;
      }
      if (recovered.soil_ph < 5.5) recovered.soil_ph = 6.5;

      setTimeout(() => {
        setSensors(recovered);
        sendSensorUpdate(recovered);
      }, 1500);

      setHapticFeedback(lang === 'vi'
        ? `🎉 Kích hoạt ${deviceName} thành công! Đang tự động khôi phục vi khí hậu về an toàn...`
        : `🎉 Triggered ${tText(deviceName)} successfully! Auto-restoring microclimate to safe equilibrium...`
      );
      setTimeout(() => setHapticFeedback(null), 4000);
    } catch (err) {
      setHapticFeedback(lang === 'vi'
        ? '❌ Không thể kích hoạt thiết bị từ xa.'
        : '❌ Unable to remotely activate device.'
      );
      setTimeout(() => setHapticFeedback(null), 3000);
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
            <ArrowLeft size={16} /> {t('mobileBackToWeb')}
          </button>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.86rem', fontWeight: 800, color: 'var(--color-optimal)' }}>
            📱 {t('mobileHeaderTitle')}
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
          background: hapticFeedback.includes('❌') ? 'rgba(244, 63, 94, 0.2)' : (hapticFeedback.includes('⚠️') ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'),
          border: `1px solid ${hapticFeedback.includes('❌') ? '#fb7185' : (hapticFeedback.includes('⚠️') ? '#fbbf24' : 'var(--color-optimal)')}`,
          borderRadius: '12px',
          color: hapticFeedback.includes('❌') ? '#fb7185' : (hapticFeedback.includes('⚠️') ? '#fbbf24' : '#34d399'),
          fontSize: '0.82rem',
          lineHeight: 1.45,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'bounce 0.5s ease'
        }}>
          <span>{hapticFeedback}</span>
        </div>
      )}

      {/* Season & Crop Species Selectors */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
        background: 'rgba(255, 255, 255, 0.04)',
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div>
          <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Sun size={12} color="#f59e0b" /> {t('season')}
          </label>
          <select
            value={season}
            onChange={(e) => handleSeasonChange(e.target.value)}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: '0.74rem'
            }}
          >
            <option value="Spring">{t('seasonSpring')}</option>
            <option value="Summer">{t('seasonSummer')}</option>
            <option value="Autumn">{t('seasonAutumn')}</option>
            <option value="Winter">{t('seasonWinter')}</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Sprout size={12} color="#10b981" /> {t('plantSpecies')}
          </label>
          <select
            value={plantSpecies}
            onChange={(e) => handleSpeciesChange(e.target.value)}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '6px 8px',
              fontSize: '0.74rem'
            }}
          >
            <option value="Lúa nước">{t('cropRice')}</option>
            <option value="Cây ăn trái">{t('cropFruit')}</option>
            <option value="Rau màu thổ nhưỡng">{t('cropVegetables')}</option>
            <option value="Đồng cỏ chăn nuôi">{t('cropGrass')}</option>
          </select>
        </div>
      </div>

      {/* Quick Scenario Presets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
        <button 
          onClick={() => handlePresetClick({ soil_ph: 6.5, soil_moisture: 60.0, air_temp_C: 27.0 }, lang === 'vi' ? 'Tối Ưu' : 'Optimal')}
          className="btn btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '7px 8px', borderRadius: '8px', color: '#34d399', justifyContent: 'center' }}
        >
          {lang === 'vi' ? '🌱 Tối Ưu (60%, 27°C)' : '🌱 Optimal (60%, 27°C)'}
        </button>
        <button 
          onClick={() => handlePresetClick({ soil_ph: 5.8, soil_moisture: 92.0, air_temp_C: 27.0 }, lang === 'vi' ? 'Ngập Úng' : 'Waterlogged')}
          className="btn btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '7px 8px', borderRadius: '8px', color: '#38bdf8', justifyContent: 'center' }}
        >
          {lang === 'vi' ? '🌊 Ngập Úng 92%' : '🌊 Flooding 92%'}
        </button>
        <button 
          onClick={() => handlePresetClick({ soil_ph: 4.2, soil_moisture: 38.0, air_temp_C: 31.0 }, lang === 'vi' ? 'Đất Chua' : 'Acidic Soil')}
          className="btn btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '7px 8px', borderRadius: '8px', color: '#fbbf24', justifyContent: 'center' }}
        >
          {lang === 'vi' ? '🍋 Đất Chua pH 4.2' : '🍋 Acidic pH 4.2'}
        </button>
        <button 
          onClick={() => handlePresetClick({ soil_ph: 6.8, soil_moisture: 18.0, air_temp_C: 38.0 }, lang === 'vi' ? 'Hạn Hán' : 'Drought')}
          className="btn btn-secondary" 
          style={{ fontSize: '0.72rem', padding: '7px 8px', borderRadius: '8px', color: '#f87171', justifyContent: 'center' }}
        >
          {lang === 'vi' ? '☀️ Hạn Hán (18%, 38°C)' : '☀️ Drought (18%, 38°C)'}
        </button>
      </div>

      {/* Touch Sliders Container */}
      <div className="glass-panel" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--color-optimal)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={16} />
          <span>{t('slidersTitle')}</span>
        </div>

        {/* Soil pH */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: 6 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FlaskConical size={16} color="#10b981" /> {t('soilPh')}
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
              <Droplet size={16} color="#06b6d4" /> {t('soilMoisture')}
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
              <Thermometer size={16} color="#f59e0b" /> {t('airTemp')}
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
          {t('actuatorsSectionTitle')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button
            onClick={() => handleTriggerDevice('misting', 'Phun Sương Làm Mát Vùng 1')}
            className="btn btn-primary"
            style={{ padding: '10px 8px', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            <Wind size={15} />
            <span>{t('btnTriggerMisting')}</span>
          </button>

          <button
            onClick={() => handleTriggerDevice('irrigation', 'Máy Bơm Tưới Gốc')}
            className="btn btn-secondary"
            style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#38bdf8', justifyContent: 'center' }}
          >
            <Droplet size={15} />
            <span>{t('btnTriggerPump')}</span>
          </button>

          <button
            onClick={() => handleTriggerDevice('drainage', 'Máy Bơm Tiêu Úng & Van Xả')}
            className="btn btn-secondary"
            style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#67e8f9', justifyContent: 'center' }}
          >
            <Waves size={15} />
            <span>{t('btnTriggerDrainage')}</span>
          </button>

          <button
            onClick={() => handleTriggerDevice('alert_notify', 'Còi Báo Động & Đèn Chớp')}
            className="btn btn-secondary"
            style={{ padding: '10px 8px', fontSize: '0.8rem', color: '#fb7185', justifyContent: 'center' }}
          >
            <BellRing size={15} />
            <span>{t('btnTriggerAlert')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
