import React from 'react';
import { AlertTriangle, CheckCircle2, Flame, Zap } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RiskGauge({ 
  probability = 0.5, 
  riskLevel = 'Warning', 
  latency = 1.25, 
  isStress = true 
}) {
  const { t } = useLanguage();

  // Góc quay của kim từ -90 độ (0%) đến +90 độ (100%)
  const clampedProb = Math.max(0, Math.min(1, probability));
  const angle = -90 + clampedProb * 180;

  const getStatusConfig = () => {
    switch (riskLevel) {
      case 'Optimal':
        return {
          title: t('statusOptimal'),
          color: 'var(--color-optimal)',
          glow: 'var(--color-optimal-glow)',
          badgeClass: 'badge-optimal',
          icon: CheckCircle2,
          desc: 'Tất cả các chỉ số đều trong vùng sinh thái an toàn'
        };
      case 'Warning':
        return {
          title: t('statusWarning'),
          color: 'var(--color-warning)',
          glow: 'var(--color-warning-glow)',
          badgeClass: 'badge-warning',
          icon: AlertTriangle,
          desc: 'Hệ sinh thái đang dần xấu đi, cần theo dõi sát'
        };
      case 'Critical':
      default:
        return {
          title: t('statusCritical'),
          color: 'var(--color-critical)',
          glow: 'var(--color-critical-glow)',
          badgeClass: 'badge-critical',
          icon: Flame,
          desc: 'Ngưỡng nguy cấp! Rễ cây hoặc tế bào đang tổn thương'
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${status.glow}`
      }}
    >
      {/* Background radial glow */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '180px',
        height: '180px',
        background: status.glow,
        filter: 'blur(50px)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Header */}
      <div style={{ zIndex: 1, textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontWeight: 700 }}>
          {t('riskGaugeTitle')}
        </div>
      </div>

      {/* SVG Semi-Circle Gauge */}
      <div style={{ position: 'relative', width: 260, height: 145, zIndex: 1 }}>
        <svg viewBox="0 0 200 115" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="34%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
          </defs>

          {/* Vòng cung nền xám */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="14"
            strokeLinecap="round"
          />

          {/* Vòng cung Gradient phân dải */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="251.2"
            strokeDashoffset="0"
          />

          {/* Vạch đánh dấu ngưỡng tối ưu T* = 0.34 */}
          {/* Góc tại 0.34 là: -90 + 0.34 * 180 = -28.8 độ */}
          <line
            x1="100"
            y1="22"
            x2="100"
            y2="34"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray="2,2"
            transform="rotate(-28.8 100 100)"
          />
          <text
            x="100"
            y="14"
            fill="#e2e8f0"
            fontSize="6"
            fontFamily="var(--font-mono)"
            fontWeight="bold"
            textAnchor="middle"
            transform="rotate(-28.8 100 100)"
          >
            T*=0.34
          </text>

          {/* Kim chỉ thị (Needle) */}
          <g 
            transform={`rotate(${angle} 100 100)`} 
            style={{ transition: 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          >
            <polygon points="97,100 103,100 101,28 99,28" fill="#ffffff" />
            <circle cx="100" cy="100" r="7" fill="#ffffff" stroke={status.color} strokeWidth="3" />
          </g>
        </svg>

        {/* Chỉ số % Stress nằm chính giữa đáy kim */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: '2.1rem',
            fontFamily: 'var(--font-heading)',
            fontWeight: 800,
            lineHeight: 1,
            color: status.color,
            textShadow: `0 0 20px ${status.glow}`
          }}>
            {(clampedProb * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: 2 }}>
            {t('stressProbLabel')}
          </div>
        </div>
      </div>

      {/* Status Alert Banner */}
      <div style={{
        zIndex: 1,
        marginTop: 18,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6
      }}>
        <div className={`badge ${status.badgeClass}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          <StatusIcon size={16} />
          <span>{status.title}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 260 }}>
          {status.desc}
        </div>
      </div>

      {/* Latency Footer */}
      <div style={{
        zIndex: 1,
        marginTop: 14,
        paddingTop: 10,
        borderTop: '1px solid var(--border-card)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)'
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={12} color="var(--color-optimal)" />
          {t('execTimeLabel')}:
        </span>
        <span style={{ color: 'var(--color-optimal)', fontWeight: 700 }}>
          {latency} ms
        </span>
      </div>
    </div>
  );
}
