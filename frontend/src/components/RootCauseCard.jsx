import React, { useState } from 'react';
import { 
  Stethoscope, 
  CheckCircle2, 
  AlertOctagon, 
  Droplet, 
  Wind, 
  BellRing, 
  ShieldAlert, 
  Sparkles 
} from 'lucide-react';
import { qrAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function RootCauseCard({ 
  rootCauses = [], 
  remediation = '', 
  riskLevel = 'Optimal', 
  diagnosticId = null 
}) {
  const { role } = useAuth();
  const { t } = useLanguage();
  const [triggerStatus, setTriggerStatus] = useState(null);
  const [loadingDevice, setLoadingDevice] = useState(null);

  // Chỉ Kỹ sư và Admin mới có quyền kích hoạt thiết bị cứu cây
  const canTrigger = role === 'admin' || role === 'engineer';

  const handleTriggerActuator = async (deviceType, deviceName) => {
    if (!canTrigger) return;
    setLoadingDevice(deviceType);
    setTriggerStatus(null);

    try {
      const res = await qrAPI.triggerActuator({
        command_type: deviceType,
        target_device: deviceName,
        duration_sec: 15,
        diagnostic_id: diagnosticId,
        triggered_by: 'web_button'
      });
      setTriggerStatus({
        success: true,
        message: `Đã kích hoạt thành công: ${deviceName} trong 15 giây!`
      });
    } catch (err) {
      setTriggerStatus({
        success: false,
        message: 'Lỗi kích hoạt thiết bị. Vui lòng kiểm tra lại kết nối trạm.'
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
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Stethoscope size={20} color="var(--color-optimal)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              {t('rootCauseTitle')}
            </h3>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              Hệ thống suy luận nhân quả và phác đồ can thiệp nông học tức thì
            </p>
          </div>
        </div>
      </div>

      {/* Root Causes List */}
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
          {t('rootCauseHeader')} ({rootCauses.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {rootCauses.length === 0 ? (
            <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '10px', fontSize: '0.84rem', color: 'var(--color-optimal)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} />
              <span>Chưa phát hiện dấu hiệu bất thường. Cây trồng đang khỏe mạnh!</span>
            </div>
          ) : (
            rootCauses.map((cause, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '10px 14px',
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
                <AlertOctagon size={16} color="var(--color-critical)" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>{cause}</span>
              </div>
            ))
          )}
        </div>
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
            {remediation}
          </div>
        </div>
      )}

      {/* Actuator Trigger Actions */}
      <div style={{ paddingTop: 10, borderTop: '1px solid var(--border-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Thiết Bị Cứu Cây Trực Tiếp (Actuators)
          </span>
          {!canTrigger && (
            <span style={{ fontSize: '0.72rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 4 }}>
              <ShieldAlert size={12} /> Yêu cầu quyền Kỹ Sư / Admin
            </span>
          )}
        </div>

        {triggerStatus && (
          <div style={{
            padding: '8px 12px',
            marginBottom: 10,
            borderRadius: '8px',
            fontSize: '0.82rem',
            background: triggerStatus.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            color: triggerStatus.success ? '#34d399' : '#fb7185',
            border: `1px solid ${triggerStatus.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`
          }}>
            {triggerStatus.message}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button
            onClick={() => handleTriggerActuator('misting', 'Trạm Phun Sương Làm Mát Vùng 1')}
            disabled={!canTrigger || loadingDevice === 'misting'}
            className="btn btn-primary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
          >
            <Wind size={15} />
            <span>{loadingDevice === 'misting' ? 'Đang kích hoạt...' : t('btnTriggerMisting')}</span>
          </button>

          <button
            onClick={() => handleTriggerActuator('irrigation', 'Máy Bơm Tưới Nhỏ Giọt Vùng Gốc')}
            disabled={!canTrigger || loadingDevice === 'irrigation'}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#38bdf8' }}
          >
            <Droplet size={15} />
            <span>{loadingDevice === 'irrigation' ? 'Đang kích hoạt...' : t('btnTriggerPump')}</span>
          </button>

          <button
            onClick={() => handleTriggerActuator('alert_notify', 'Còi Báo Động & Đèn Chớp Thực Địa')}
            disabled={!canTrigger || loadingDevice === 'alert_notify'}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px', color: '#fb7185' }}
          >
            <BellRing size={15} />
            <span>{loadingDevice === 'alert_notify' ? 'Đang phát...' : t('btnTriggerAlert')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
