import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Flame, Zap, Info, Cpu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RiskGauge({ 
  probability = 0.5, 
  riskLevel = 'Warning', 
  latency = 1.25, 
  isStress = true,
  modelSource = 'lightgbm',
  onModelSourceChange,
  activeThreshold = 0.34
}) {
  const { t } = useLanguage();
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Góc quay của kim từ -90 độ (0%) đến +90 độ (100%)
  const clampedProb = Math.max(0, Math.min(1, probability));
  const angle = -90 + clampedProb * 180;

  // Tính góc xoay của vạch ngưỡng T*
  const currentThreshold = activeThreshold || (modelSource === 'spark' ? 0.50 : 0.34);
  const thresholdAngle = -90 + currentThreshold * 180;

  const getStatusConfig = () => {
    switch (riskLevel) {
      case 'Optimal':
        return {
          title: t('statusOptimal'),
          color: 'var(--color-optimal)',
          glow: 'var(--color-optimal-glow)',
          badgeClass: 'badge-optimal',
          icon: CheckCircle2,
          desc: t('statusOptimalDesc')
        };
      case 'Warning':
        return {
          title: t('statusWarning'),
          color: 'var(--color-warning)',
          glow: 'var(--color-warning-glow)',
          badgeClass: 'badge-warning',
          icon: AlertTriangle,
          desc: t('statusWarningDesc')
        };
      case 'Critical':
      default:
        return {
          title: t('statusCritical'),
          color: 'var(--color-critical)',
          glow: 'var(--color-critical-glow)',
          badgeClass: 'badge-critical',
          icon: Flame,
          desc: t('statusCriticalDesc')
        };
    }
  };

  const status = getStatusConfig();
  const StatusIcon = status.icon;

  return (
    <div 
      className="glass-panel" 
      style={{
        padding: '22px',
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

      {/* Header & Dual Model Weight Switcher */}
      <div style={{ zIndex: 1, textAlign: 'center', width: '100%', marginBottom: 12 }}>
        <div style={{ fontSize: '0.76rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8 }}>
          {t('riskGaugeTitle')}
        </div>

        {/* Nút chuyển đổi nguồn trọng số mô hình */}
        <div style={{
          display: 'inline-flex',
          background: 'var(--bg-surface)',
          padding: 3,
          borderRadius: 10,
          border: '1px solid var(--border-card)',
          gap: 4
        }}>
          <button
            type="button"
            onClick={() => onModelSourceChange?.('lightgbm')}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: 7,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: modelSource === 'lightgbm' ? 'var(--color-optimal)' : 'transparent',
              color: modelSource === 'lightgbm' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>⚡ LightGBM</span>
            <span style={{ fontSize: '0.64rem', opacity: 0.85 }}>(T*=0.34)</span>
          </button>

          <button
            type="button"
            onClick={() => onModelSourceChange?.('spark')}
            style={{
              padding: '4px 10px',
              border: 'none',
              borderRadius: 7,
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: modelSource === 'spark' ? '#f59e0b' : 'transparent',
              color: modelSource === 'spark' ? '#0f172a' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 4
            }}
          >
            <span>🔥 Apache Spark</span>
            <span style={{ fontSize: '0.64rem', opacity: 0.85 }}>(T*=0.50)</span>
          </button>
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

          {/* Vạch đánh dấu ngưỡng cắt T* linh hoạt theo mô hình */}
          <line
            x1="100"
            y1="22"
            x2="100"
            y2="34"
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeDasharray="2,2"
            transform={`rotate(${thresholdAngle} 100 100)`}
          />
          <text
            x="100"
            y="14"
            fill="#e2e8f0"
            fontSize="6"
            fontFamily="var(--font-mono)"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(${thresholdAngle} 100 100)`}
          >
            T*={currentThreshold.toFixed(2)}
          </text>

          {/* Kim chỉ thị (Needle) quay tự do không bị chặn */}
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
        marginTop: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6
      }}>
        <div className={`badge ${status.badgeClass}`} style={{ fontSize: '0.85rem', padding: '6px 14px' }}>
          <StatusIcon size={16} />
          <span>{status.title}</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: 280 }}>
          {status.desc}
        </div>
      </div>

      {/* Latency Footer & Explanation */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Zap size={12} color="var(--color-optimal)" />
          <span>{t('execTimeLabel')}:</span>
          <span style={{ color: 'var(--color-optimal)', fontWeight: 700 }}>
            {latency} ms
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowDetailModal(!showDetailModal)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            fontSize: '0.68rem'
          }}
          title={t('gaugeDetailsBtn')}
        >
          <Info size={12} />
          <span>{t('gaugeDetailsBtn')}</span>
        </button>
      </div>

      {/* Accordion Note giải thích nguồn gốc Latency & Trọng số */}
      {showDetailModal && (
        <div style={{
          marginTop: 10,
          padding: '10px 12px',
          background: 'var(--bg-surface)',
          borderRadius: 8,
          border: '1px solid var(--border-card)',
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.5,
          width: '100%'
        }}>
          <div>⏱️ <b>{t('execTimeLabel')} ({latency} ms):</b> {t('gaugeLatencyExpl')}</div>
          <div style={{ marginTop: 4 }}>📊 <b>{t('gaugeModelExplTitle')}</b></div>
          <div>• <b>LightGBM (T*=0.34):</b> {t('gaugeModelExplLgb')}</div>
          <div>• <b>Apache Spark GBT (T*=0.50):</b> {t('gaugeModelExplSpark')}</div>
        </div>
      )}
    </div>
  );
}
