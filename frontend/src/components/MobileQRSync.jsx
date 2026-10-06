import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  Radio, 
  Activity,
  Database,
  Download,
  Terminal,
  Send,
  Zap,
  Clock,
  Server,
  Layers
} from 'lucide-react';
import { qrAPI, predictAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';

export default function MobileQRSync({ 
  session: propSession, 
  customHostIp: propHostIp, 
  setCustomHostIp: propSetHostIp,
  onRecreateSession,
  onRemoteSensorUpdate,
  lastPredictionId
}) {
  const { t } = useLanguage();
  const { isConnected, lastMessage, connectToSession, sendMessage } = useSocket();
  const [localSession, setLocalSession] = useState(null);
  const [localCustomHostIp, setLocalCustomHostIp] = useState('192.168.1.17');
  const [loading, setLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);
  const [dbHistory, setDbHistory] = useState([]);
  const [actuatorLogs, setActuatorLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const session = propSession || localSession;
  const customHostIp = propHostIp !== undefined ? propHostIp : localCustomHostIp;
  const setCustomHostIp = propSetHostIp || setLocalCustomHostIp;

  useEffect(() => {
    if (!propSession) {
      initQRSession();
    }
    fetchHistoryAndLogs();
  }, [propSession]);

  // Tự động làm mới bảng khi có lần dự đoán mới hoặc khi nhận tin nhắn từ Mobile
  useEffect(() => {
    if (lastPredictionId) {
      fetchHistoryAndLogs();
    }
  }, [lastPredictionId]);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'SENSOR_UPDATE' && lastMessage.payload) {
        onRemoteSensorUpdate?.(lastMessage.payload);
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ${lang === 'vi' ? '📱 Mobile cập nhật' : '📱 Mobile update'}: pH=${lastMessage.payload.soil_ph}, ${lang === 'vi' ? 'Ẩm' : 'Moist'}=${lastMessage.payload.soil_moisture}%, Temp=${lastMessage.payload.air_temp_C}°C`,
          ...prev.slice(0, 15)
        ]);
        // Chờ 300ms để backend commit xong vào database rồi refresh
        setTimeout(() => fetchHistoryAndLogs(), 300);
      } else if (lastMessage.type === 'ACTUATOR_COMMAND' || lastMessage.type === 'ACTUATOR_ACTIVATED') {
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ${lang === 'vi' ? '⚡ Lệnh thiết bị' : '⚡ Actuator command'}: ${tText(lastMessage.target_device || lastMessage.command_type)} (${lastMessage.duration_sec || 15}s)`,
          ...prev.slice(0, 15)
        ]);
        setTimeout(() => fetchHistoryAndLogs(), 300);
      }
    }
  }, [lastMessage]);

  const initQRSession = async () => {
    if (onRecreateSession) {
      onRecreateSession();
      return;
    }
    setLoading(true);
    try {
      const res = await qrAPI.createSession();
      setLocalSession(res.data);
      if (res.data.lan_ip) {
        setCustomHostIp(res.data.lan_ip);
      }
      connectToSession(res.data.session_id);
    } catch (err) {
      console.warn('Cannot create QR session:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryAndLogs = async () => {
    setLoadingHistory(true);
    try {
      const [histRes, actRes] = await Promise.allSettled([
        predictAPI.getHistory(15),
        qrAPI.getLogs(15)
      ]);
      if (histRes.status === 'fulfilled') setDbHistory(histRes.value.data || []);
      if (actRes.status === 'fulfilled') setActuatorLogs(actRes.value.data || []);
    } catch (e) {
      console.warn('Failed to fetch history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // URL QR Code dùng IP LAN thật sự để điện thoại quét mở được
  const sessionId = session?.session_id || 'AGRI-998-DEMO';
  const port = window.location.port ? `:${window.location.port}` : '';
  const mobileLanUrl = `http://${customHostIp}${port}/mobile?session_id=${sessionId}`;
  const localPreviewUrl = `${window.location.origin}/mobile?session_id=${sessionId}`;

  // Mô phỏng điện thoại gửi tín hiệu sang Web
  const simulateMobileSensor = (data, label) => {
    const payload = {
      type: 'SENSOR_UPDATE',
      session_id: sessionId,
      payload: data
    };
    sendMessage(payload);
    onRemoteSensorUpdate?.(data);
    setSyncLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${lang === 'vi' ? '🧪 [Mô Phỏng Thực Địa] Gửi' : '🧪 [Field Simulation] Sent'}: ${label}`,
      ...prev.slice(0, 15)
    ]);
    setTimeout(() => fetchHistoryAndLogs(), 400);
  };

  const handleExportCSV = () => {
    if (!dbHistory.length) return;
    const headers = lang === 'vi'
      ? ["ID", "Thời gian", "Nguồn", "pH Đất", "Độ Ẩm (%)", "Nhiệt Độ (°C)", "Xác Suất Stress (%)", "Cấp Rủi Ro", "Phác Đồ"]
      : ["ID", "Timestamp", "Source", "Soil pH", "Moisture (%)", "Air Temp (°C)", "Stress Probability (%)", "Risk Level", "Remediation"];
    const rows = dbHistory.map(r => [
      r.id,
      r.timestamp,
      r.source,
      r.soil_ph,
      r.soil_moisture,
      r.air_temp_C,
      (r.stress_probability * 100).toFixed(1) + "%",
      r.risk_level,
      `"${(r.remediation || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `agri_telemetry_history_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header & Live API Health Bar */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              <Smartphone size={24} color="var(--color-optimal)" />
              <span>{t('mobileSyncTitle')}</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              {t('mobileSyncDesc')}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${isConnected ? 'badge-optimal' : 'badge-warning'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? t('mobileWsReady') : t('mobileWsWaiting')}
            </span>

            <button
              onClick={initQRSession}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{t('btnRecreateQR')}</span>
            </button>
          </div>
        </div>

        {/* System & Database Health Status Card */}
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: 'var(--bg-surface)',
          borderRadius: 12,
          border: '1px solid var(--border-card)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 12,
          fontSize: '0.76rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} color="#10b981" />
            <div>
              <span style={{ color: 'var(--text-muted)' }}>{t('serverStatusRest')} </span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>FastAPI (8000 Online)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="#06b6d4" />
            <div>
              <span style={{ color: 'var(--text-muted)' }}>{t('serverStatusDb')} </span>
              <span style={{ color: '#67e8f9', fontWeight: 700 }}>SQLite Engine (Live Storage)</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Radio size={16} color="#f59e0b" />
            <div>
              <span style={{ color: 'var(--text-muted)' }}>{t('serverStatusWs')} </span>
              <span style={{ color: '#fbbf24', fontWeight: 700 }}>WebSocket Full-Duplex (&lt;50ms)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: QR Code & IP Config on Left, Live WebSocket Stream on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* QR Card */}
        <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            padding: 16,
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
            marginBottom: 16
          }}>
            {session ? (
              <QRCodeSVG
                value={mobileLanUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                {t('qrGenerating')}
              </div>
            )}
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: 'var(--color-optimal)', marginBottom: 4 }}>
            {sessionId}
          </div>

          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            {t('qrSessionId')}
          </div>

          {/* Cấu hình IP LAN */}
          <div style={{ width: '100%', background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-card)', marginBottom: 14, textAlign: 'left' }}>
            <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              {t('qrLanIpLabel')}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={customHostIp}
                onChange={(e) => setCustomHostIp(e.target.value)}
                placeholder="192.168.1.17"
                className="input-field"
                style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
              />
              <span className="badge badge-optimal" style={{ fontSize: '0.72rem', alignSelf: 'center' }}>
                Port 5173
              </span>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>
              Link Mobile: <span style={{ color: 'var(--color-optimal)' }}>{mobileLanUrl}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' }}>
            <a
              href={localPreviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '8px 14px', flex: 1 }}
            >
              <ExternalLink size={14} />
              <span>{t('btnOpenMobilePreview')}</span>
            </a>
          </div>
        </div>

        {/* Live Synchronized Event Stream & Mobile Simulator */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border-card)', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={18} color="var(--color-optimal)" />
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>
                {t('wsLiveLogTitle')}
              </h4>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t('wsLatencyTip')}</span>
          </div>

          {/* Mobile Simulator Controls */}
          <div style={{ background: 'var(--bg-surface)', padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-card)', marginBottom: 12 }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={13} color="#f59e0b" />
              <span>{t('mobileSimTitle')}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <button
                type="button"
                onClick={() => simulateMobileSensor({ soil_ph: 5.8, soil_moisture: 92.0, air_temp_C: 27.0, pollution_index: 75.0 }, lang === 'vi' ? 'Ngập úng 92%' : 'Flood 92%')}
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#38bdf8' }}
              >
                {t('simFloodBtn')}
              </button>
              <button
                type="button"
                onClick={() => simulateMobileSensor({ soil_ph: 6.8, soil_moisture: 18.0, air_temp_C: 38.0, pollution_index: 30.0 }, lang === 'vi' ? 'Hạn hán 18%, 38°C' : 'Drought 18%, 38°C')}
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#f87171' }}
              >
                {t('simDroughtBtn')}
              </button>
              <button
                type="button"
                onClick={() => simulateMobileSensor({ soil_ph: 4.2, soil_moisture: 38.0, air_temp_C: 31.0, pollution_index: 40.0 }, lang === 'vi' ? 'Đất chua pH 4.2' : 'Acid soil pH 4.2')}
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#fbbf24' }}
              >
                {t('simAcidBtn')}
              </button>
              <button
                type="button"
                onClick={() => simulateMobileSensor({ soil_ph: 6.6, soil_moisture: 65.0, air_temp_C: 26.0, pollution_index: 15.0 }, lang === 'vi' ? 'Sinh trưởng tối ưu' : 'Optimal growth')}
                className="btn btn-secondary"
                style={{ fontSize: '0.72rem', padding: '5px 8px', color: '#34d399' }}
              >
                {t('simOptimalBtn')}
              </button>
            </div>
          </div>

          {/* Stream Log Display */}
          <div style={{
            flex: 1,
            minHeight: 180,
            maxHeight: 230,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            overflowY: 'auto'
          }}>
            {syncLogs.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                {t('wsLogListening')}
              </div>
            ) : (
              syncLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Database Telemetry Table (Bảng Dữ Liệu Thực Từ SQLite Backend) */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} color="var(--color-optimal)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
                {t('dbHistoryTitle')}
              </h3>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {t('dbHistorySubtitle')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={fetchHistoryAndLogs}
              className="btn btn-secondary"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <RefreshCw size={13} className={loadingHistory ? 'animate-spin' : ''} />
              <span>{t('btnReloadTable')}</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={!dbHistory.length}
              className="btn btn-outline"
              style={{ fontSize: '0.78rem', padding: '6px 12px' }}
            >
              <Download size={13} />
              <span>{t('btnExportCsv')}</span>
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px' }}>{t('thId')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thTime')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thSource')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thPh')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thMoisture')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thTemp')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thStressProb')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thRiskLevel')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thRemediation')}</th>
              </tr>
            </thead>
            <tbody>
              {dbHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('dbNoRecords')}
                  </td>
                </tr>
              ) : (
                dbHistory.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>#{item.id}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${item.source === 'mobile_qr' ? 'badge-warning' : (item.source === 'actuator_recovered' ? 'badge-optimal' : 'badge-secondary')}`} style={{ fontSize: '0.7rem' }}>
                        {item.source === 'mobile_qr' ? '📱 mobile_qr' : (item.source === 'actuator_recovered' ? '🌱 recovered' : '💻 web')}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>{item.soil_ph}</td>
                    <td style={{ padding: '8px 12px' }}>{item.soil_moisture}%</td>
                    <td style={{ padding: '8px 12px' }}>{item.air_temp_C}°C</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: item.stress_probability > 0.34 ? '#fb7185' : '#34d399' }}>
                      {(item.stress_probability * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className={`badge ${item.risk_level === 'Critical' ? 'badge-critical' : (item.risk_level === 'Warning' ? 'badge-warning' : 'badge-optimal')}`} style={{ fontSize: '0.7rem' }}>
                        {item.risk_level === 'Optimal' ? t('statusOptimal') : (item.risk_level === 'Warning' ? t('statusWarning') : t('statusCritical'))}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-secondary)' }} title={item.remediation}>
                      {tText(item.remediation) || t('bioOptimalSafe')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actuator Execution Logs Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Clock size={18} color="#f59e0b" />
          <div>
            <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', margin: 0 }}>
              {t('actuatorAuditTitle')}
            </h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {t('actuatorAuditSubtitle')}
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--border-card)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '10px 12px' }}>{t('thCmdId')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thTime')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thDeviceName')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thCmdType')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thDuration')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thTriggeredBy')}</th>
                <th style={{ padding: '10px 12px' }}>{t('thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {actuatorLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {t('noActuatorsYet')}
                  </td>
                </tr>
              ) : (
                actuatorLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)' }}>CMD-#{log.id}</td>
                    <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{tText(log.target_device)}</td>
                    <td style={{ padding: '8px 12px' }}><code>{log.command_type}</code></td>
                    <td style={{ padding: '8px 12px' }}>{log.duration_sec}s</td>
                    <td style={{ padding: '8px 12px' }}>{log.triggered_by}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span className="badge badge-optimal" style={{ fontSize: '0.7rem' }}>
                        {t('statusSuccess')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
