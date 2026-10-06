import React, { useState, useEffect, useRef } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  AlertOctagon, 
  Droplet, 
  Wind, 
  BellRing, 
  ShieldAlert, 
  Waves,
  Sparkles,
  Volume2,
  Clock
} from 'lucide-react';
import { qrAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';

// Web Audio API Sound Synthesizers (Không cần tải file audio bên ngoài)
const playSirenSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.12, ctx.currentTime);

    // Hiệu ứng còi báo động dao động tần số 880Hz <-> 550Hz
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(550, ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.6);
    osc.frequency.linearRampToValueAtTime(550, ctx.currentTime + 0.9);
    osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.warn('Web Audio error:', e);
  }
};

const playPumpSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.2);
  } catch (e) {
    console.warn('Web Audio error:', e);
  }
};

export default function RootCauseCard({ 
  rootCauses = [], 
  remediation = '', 
  riskLevel = 'Optimal', 
  diagnosticId = null,
  sensorData = null,
  onRecoverOptimal = null
}) {
  const { role } = useAuth();
  const { t, tText } = useLanguage();
  const { sessionId, lastMessage } = useSocket();
  const [triggerStatus, setTriggerStatus] = useState(null);
  const [loadingDevice, setLoadingDevice] = useState(null);
  const [activeTimers, setActiveTimers] = useState({}); // { deviceType: secondsLeft }

  // Chỉ Kỹ sư và Admin mới có quyền kích hoạt thiết bị cứu cây
  const canTrigger = role === 'admin' || role === 'engineer';

  // Lọc các câu thông báo bình thường ra khỏi danh sách nguyên nhân gốc rễ
  const actualCauses = (rootCauses || []).filter(c => 
    !c.toLowerCase().includes('ngưỡng sinh trưởng an toàn') &&
    !c.toLowerCase().includes('khỏe mạnh') &&
    !c.toLowerCase().includes('không phát hiện')
  );

  // Nhận tín hiệu kích hoạt từ Mobile sang Web (Đồng bộ hai chiều)
  useEffect(() => {
    if (lastMessage && (lastMessage.type === 'ACTUATOR_ACTIVATED' || lastMessage.type === 'ACTUATOR_COMMAND')) {
      const devType = lastMessage.command_type;
      const devName = lastMessage.target_device || devType;
      if (devType) {
        if (devType === 'alert_notify') playSirenSound();
        else playPumpSound();

        setActiveTimers(prev => ({ ...prev, [devType]: 15 }));
        setTriggerStatus({
          success: true,
          message: `${t('toastRemoteMobile')} ${devName} (15s)`
        });
        setTimeout(() => setTriggerStatus(null), 5000);

        // Khôi phục cảm biến trên Web nếu được cứu từ xa qua điện thoại
        if (onRecoverOptimal) {
          let rec = {};
          if (devType === 'drainage') rec = { soil_moisture: 58.0 };
          else if (devType === 'irrigation') rec = { soil_moisture: 62.0 };
          else if (devType === 'misting') rec = { air_temp_C: 26.5, soil_moisture: 58.0 };
          if (sensorData?.soil_ph && sensorData.soil_ph < 5.5) rec.soil_ph = 6.5;
          if (Object.keys(rec).length > 0) {
            setTimeout(() => onRecoverOptimal(rec), 1500);
          }
        }
      }
    }
  }, [lastMessage]);

  // Đếm ngược 15 giây cho thiết bị đang kích hoạt
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.keys(next).forEach(dev => {
          if (next[dev] > 1) {
            next[dev] -= 1;
            changed = true;
          } else if (next[dev] === 1) {
            delete next[dev];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerActuator = async (deviceType, deviceName) => {
    if (!canTrigger) return;
    setTriggerStatus(null);

    // 1. Kiểm tra nếu tất cả điều kiện đang trong tình trạng ổn định (Optimal)
    if (riskLevel === 'Optimal' || actualCauses.length === 0) {
      setTriggerStatus({
        warning: true,
        message: t('toastOptimalWarn')
      });
      setTimeout(() => setTriggerStatus(null), 5000);
      return;
    }

    // 2. Kiểm tra nếu phác đồ sai tình trạng thực tế
    const moisture = sensorData?.soil_moisture ?? 50.0;
    const ph = sensorData?.soil_ph ?? 6.5;
    const temp = sensorData?.air_temp_C ?? 28.0;

    if (moisture >= 80.0 && deviceType === 'irrigation') {
      setTriggerStatus({
        error: true,
        message: t('toastFloodMismatch')
      });
      setTimeout(() => setTriggerStatus(null), 6000);
      return;
    }

    if (moisture <= 30.0 && deviceType === 'drainage') {
      setTriggerStatus({
        error: true,
        message: t('toastDroughtMismatch')
      });
      setTimeout(() => setTriggerStatus(null), 6000);
      return;
    }

    if (ph < 5.2 && deviceType === 'drainage') {
      setTriggerStatus({
        error: true,
        message: t('toastAcidityMismatch')
      });
      setTimeout(() => setTriggerStatus(null), 6000);
      return;
    }

    setLoadingDevice(deviceType);

    // Phát âm thanh mô phỏng thực địa qua Web Audio API
    if (deviceType === 'alert_notify') {
      playSirenSound();
    } else {
      playPumpSound();
    }

    try {
      await qrAPI.triggerActuator({
        command_type: deviceType,
        target_device: deviceName,
        duration_sec: 15,
        diagnostic_id: diagnosticId,
        triggered_by: 'web_button',
        ws_session_id: sessionId
      });
      
      setActiveTimers(prev => ({ ...prev, [deviceType]: 15 }));
      setTriggerStatus({
        success: true,
        message: `${t('toastTriggerSuccess')}`
      });

      // Tự động khôi phục các chỉ số cảm biến về vùng tối ưu an toàn sau khi cứu cây
      if (onRecoverOptimal) {
        let recovered = {};
        if (deviceType === 'drainage') {
          recovered = { soil_moisture: 58.0 };
        } else if (deviceType === 'irrigation') {
          recovered = { soil_moisture: 62.0 };
        } else if (deviceType === 'misting') {
          recovered = { air_temp_C: 26.5, soil_moisture: 58.0 };
        }
        if (ph < 5.5) {
          recovered.soil_ph = 6.5;
        }
        if (Object.keys(recovered).length > 0) {
          setTimeout(() => {
            onRecoverOptimal(recovered);
          }, 1500);
        }
      }
    } catch (err) {
      setTriggerStatus({
        error: true,
        message: lang === 'vi' ? 'Lỗi gửi lệnh kích hoạt. Vui lòng kiểm tra lại kết nối thiết bị.' : 'Error sending trigger command. Please verify device connection.'
      });
    } finally {
      setLoadingDevice(null);
      setTimeout(() => setTriggerStatus(null), 5000);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-card)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            background: actualCauses.length === 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={20} color={actualCauses.length === 0 ? 'var(--color-optimal)' : 'var(--color-critical)'} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
              {t('rootCauseTitle')}
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {t('rootCauseSubtitle')}
            </p>
          </div>
        </div>

        {/* Trạng thái an toàn hay có nguy cơ */}
        <span className={`badge ${actualCauses.length === 0 ? 'badge-optimal' : 'badge-critical'}`}>
          {actualCauses.length === 0 ? t('zeroCausesSafe') : `${actualCauses.length} ${t('causesDetectedSuffix')}`}
        </span>
      </div>

      {/* Root Causes Section */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
          {t('rootCauseHeader')} ({actualCauses.length})
        </div>

        {/* Hiển thị dạng thẻ xanh khi 0 nguyên nhân (Tối ưu) */}
        {actualCauses.length === 0 ? (
          <div style={{
            padding: '14px 16px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            fontSize: '0.84rem',
            color: 'var(--color-optimal)',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <CheckCircle2 size={24} color="#10b981" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#10b981' }}>
                {t('optimalStateCardTitle')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {t('optimalStateCardDesc')}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actualCauses.map((cause, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  borderLeft: '4px solid var(--color-critical)',
                  borderRadius: '6px 10px 10px 6px',
                  fontSize: '0.84rem',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10
                }}
              >
                <AlertOctagon size={18} color="var(--color-critical)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span style={{ lineHeight: 1.5 }}>{tText(cause)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Remediation Protocol */}
      {remediation && (
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
            {t('remediationHeader')}
          </div>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '14px 16px',
            fontSize: '0.84rem',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-line',
            lineHeight: 1.6
          }}>
            {tText(remediation)}
          </div>
        </div>
      )}

      {/* Actuator Trigger Actions */}
      <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t('actuatorsSectionTitle')}
          </span>
          {!canTrigger && (
            <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={12} /> {t('actuatorsRoleReq')}
            </span>
          )}
        </div>

        {triggerStatus && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 12,
            borderRadius: '10px',
            fontSize: '0.84rem',
            lineHeight: 1.5,
            background: triggerStatus.error ? 'rgba(244, 63, 94, 0.16)' : (triggerStatus.warning ? 'rgba(245, 158, 11, 0.16)' : 'rgba(16, 185, 129, 0.16)'),
            color: triggerStatus.error ? '#fb7185' : (triggerStatus.warning ? '#fbbf24' : '#34d399'),
            border: `1px solid ${triggerStatus.error ? 'rgba(244, 63, 94, 0.4)' : (triggerStatus.warning ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)')}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Volume2 size={16} />
            <span>{triggerStatus.message}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {/* Phun sương làm mát */}
          <button
            onClick={() => handleTriggerActuator('misting', 'Trạm Phun Sương Làm Mát Vùng 1')}
            disabled={!canTrigger || loadingDevice === 'misting'}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', position: 'relative' }}
          >
            <Wind size={15} />
            <span>{loadingDevice === 'misting' ? t('actuatorSending') : t('btnTriggerMisting')}</span>
            {activeTimers['misting'] && (
              <span className="badge badge-critical" style={{ fontSize: '0.68rem', padding: '2px 6px', marginLeft: 4 }}>
                <Clock size={10} /> {activeTimers['misting']}s
              </span>
            )}
          </button>

          {/* Máy bơm tưới nhỏ giọt */}
          <button
            onClick={() => handleTriggerActuator('irrigation', 'Máy Bơm Tưới Nhỏ Giọt Vùng Gốc')}
            disabled={!canTrigger || loadingDevice === 'irrigation'}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#38bdf8', position: 'relative' }}
          >
            <Droplet size={15} />
            <span>{loadingDevice === 'irrigation' ? t('actuatorSending') : t('btnTriggerPump')}</span>
            {activeTimers['irrigation'] && (
              <span className="badge badge-optimal" style={{ fontSize: '0.68rem', padding: '2px 6px', marginLeft: 4 }}>
                <Clock size={10} /> {activeTimers['irrigation']}s
              </span>
            )}
          </button>

          {/* Tiêu úng khẩn cấp (Bơm hút & Xả van luống) */}
          <button
            onClick={() => handleTriggerActuator('drainage', 'Máy Bơm Tiêu Úng & Van Xả Rãnh')}
            disabled={!canTrigger || loadingDevice === 'drainage'}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#67e8f9', position: 'relative' }}
          >
            <Waves size={15} />
            <span>{loadingDevice === 'drainage' ? t('actuatorOpeningValve') : t('btnTriggerDrainage')}</span>
            {activeTimers['drainage'] && (
              <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '2px 6px', marginLeft: 4 }}>
                <Clock size={10} /> {activeTimers['drainage']}s
              </span>
            )}
          </button>

          {/* Còi báo động & đèn chớp */}
          <button
            onClick={() => handleTriggerActuator('alert_notify', 'Còi Báo Động & Đèn Chớp Thực Địa')}
            disabled={!canTrigger || loadingDevice === 'alert_notify'}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#fb7185', position: 'relative' }}
          >
            <BellRing size={15} />
            <span>{loadingDevice === 'alert_notify' ? t('actuatorBroadcasting') : t('btnTriggerAlert')}</span>
            {activeTimers['alert_notify'] && (
              <span className="badge badge-critical" style={{ fontSize: '0.68rem', padding: '2px 6px', marginLeft: 4 }}>
                <Clock size={10} /> {activeTimers['alert_notify']}s
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
