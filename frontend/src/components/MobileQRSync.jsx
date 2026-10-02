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
  Activity 
} from 'lucide-react';
import { qrAPI } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useLanguage } from '../context/LanguageContext';

export default function MobileQRSync({ onRemoteSensorUpdate }) {
  const { t } = useLanguage();
  const { isConnected, lastMessage, connectToSession } = useSocket();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState([]);

  useEffect(() => {
    initQRSession();
  }, []);

  useEffect(() => {
    if (lastMessage) {
      if (lastMessage.type === 'SENSOR_UPDATE' && lastMessage.payload) {
        onRemoteSensorUpdate?.(lastMessage.payload);
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] 📱 Mobile cập nhật: pH=${lastMessage.payload.soil_ph}, Ẩm=${lastMessage.payload.soil_moisture}%`,
          ...prev.slice(0, 8)
        ]);
      } else if (lastMessage.type === 'ACTUATOR_COMMAND') {
        setSyncLogs(prev => [
          `[${new Date().toLocaleTimeString()}] ⚡ Lệnh từ xa: ${lastMessage.target_device} (${lastMessage.action})`,
          ...prev.slice(0, 8)
        ]);
      }
    }
  }, [lastMessage]);

  const initQRSession = async () => {
    setLoading(true);
    try {
      const res = await qrAPI.createSession();
      setSession(res.data);
      connectToSession(res.data.session_id);
    } catch (err) {
      console.warn('Cannot create QR session:', err);
    } finally {
      setLoading(false);
    }
  };

  const mobileUrl = session 
    ? `${window.location.origin}/mobile?session_id=${session.session_id}`
    : `${window.location.origin}/mobile`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Smartphone size={24} color="var(--color-optimal)" />
              <span>Đồng Bộ Trạm Thực Địa Di Động (Web ↔ Mobile PWA)</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              Quét mã QR bằng điện thoại để điều khiển từ xa qua WebSocket 2 chiều độ trễ dưới 50ms.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${isConnected ? 'badge-optimal' : 'badge-warning'}`}>
              {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isConnected ? 'WebSocket Sẵn Sàng' : 'Đang Chờ Kết Nối'}
            </span>

            <button
              onClick={initQRSession}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Làm Mới Mã QR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: QR Code on Left, Live Sync Log on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
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
                value={mobileUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            ) : (
              <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                Đang tạo mã QR...
              </div>
            )}
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 800, color: 'var(--color-optimal)', marginBottom: 6 }}>
            {session?.session_id || 'AGRI-998-PENDING'}
          </div>

          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 14 }}>
            Mã định danh phiên làm việc (Hiệu lực: 30 phút)
          </div>

          <a
            href={mobileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
            style={{ fontSize: '0.84rem', padding: '8px 16px' }}
          >
            <ExternalLink size={14} />
            <span>Mở Trực Tiếp Trên Trình Duyệt Này</span>
          </a>
        </div>

        {/* Live Synchronized Event Stream */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid var(--border-card)', paddingBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={18} color="var(--color-optimal)" />
              <h4 style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                Nhật Ký Tín Hiệu Thời Gian Thực
              </h4>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Độ trễ &lt; 50ms</span>
          </div>

          <div style={{
            flex: 1,
            minHeight: 220,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px',
            padding: '14px',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            overflowY: 'auto'
          }}>
            {syncLogs.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Đang chờ tín hiệu từ điện thoại hoặc thiết bị thực địa...
              </div>
            ) : (
              syncLogs.map((log, idx) => (
                <div key={idx} style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
