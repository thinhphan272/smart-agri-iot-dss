import React from 'react';
import { 
  Droplet, 
  Thermometer, 
  Sun, 
  Wind, 
  Trees, 
  Compass, 
  Mountain, 
  FlaskConical, 
  Lock, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function SensorSliders({ sensorData, onChange, disabled = false }) {
  const { role } = useAuth();
  const { t } = useLanguage();

  // Nông dân (Farmer) chỉ có quyền xem, không được kéo thanh trượt
  const isReadOnly = disabled || role === 'farmer';

  const handleSliderChange = (field, val) => {
    if (isReadOnly) return;
    onChange({ ...sensorData, [field]: parseFloat(val) });
  };

  const applyPreset = (preset) => {
    if (isReadOnly) return;
    onChange({ ...sensorData, ...preset });
  };

  const sliderConfigs = [
    {
      id: 'soil_ph',
      label: t('soilPh'),
      icon: FlaskConical,
      min: 3.5,
      max: 9.5,
      step: 0.1,
      unit: 'pH',
      color: '#10b981',
      warningMin: 5.5,
      warningMax: 7.5,
    },
    {
      id: 'soil_moisture',
      label: t('soilMoisture'),
      icon: Droplet,
      min: 5,
      max: 95,
      step: 0.5,
      unit: '%',
      color: '#06b6d4',
      warningMin: 35,
      warningMax: 80,
    },
    {
      id: 'air_temp_C',
      label: t('airTemp'),
      icon: Thermometer,
      min: 10,
      max: 45,
      step: 0.5,
      unit: '°C',
      color: '#f59e0b',
      warningMin: 18,
      warningMax: 33,
    },
    {
      id: 'sunlight_hours',
      label: t('sunlight'),
      icon: Sun,
      min: 1,
      max: 14,
      step: 0.5,
      unit: t('unitHoursPerDay'),
      color: '#eab308',
      warningMin: 4.5,
      warningMax: 10,
    },
    {
      id: 'pollution_index',
      label: t('pollution'),
      icon: Wind,
      min: 0,
      max: 100,
      step: 1,
      unit: 'AQI',
      color: '#f43f5e',
      warningMin: 0,
      warningMax: 50,
    },
    {
      id: 'vegetation_density',
      label: t('vegDensity'),
      icon: Trees,
      min: 0.05,
      max: 0.95,
      step: 0.05,
      unit: 'NDVI',
      color: '#84cc16',
      warningMin: 0.4,
      warningMax: 1.0,
    },
    {
      id: 'proximity_to_water_m',
      label: t('proximityWater'),
      icon: Compass,
      min: 10,
      max: 500,
      step: 10,
      unit: 'm',
      color: '#38bdf8',
      warningMin: 0,
      warningMax: 300,
    },
    {
      id: 'elevation_m',
      label: t('elevation'),
      icon: Mountain,
      min: 0,
      max: 200,
      step: 5,
      unit: 'm',
      color: '#a855f7',
      warningMin: 0,
      warningMax: 150,
    }
  ];

  return (
    <div className="glass-panel" style={{ padding: '20px' }}>
      {/* Title & Presets Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 18,
        paddingBottom: 14,
        borderBottom: '1px solid var(--border-card)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{t('slidersTitle')}</span>
            {isReadOnly && (
              <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                <Lock size={10} /> {t('slidersReadOnly')}
              </span>
            )}
          </h3>
          <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {t('slidersDesc')}
          </p>
        </div>

        {/* Quick Scenario Presets */}
        {!isReadOnly && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            <button
              onClick={() => applyPreset({ soil_ph: 6.6, soil_moisture: 65, air_temp_C: 26, sunlight_hours: 8, pollution_index: 15, vegetation_density: 0.75 })}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '5px 10px', borderRadius: '8px' }}
            >
              {t('presetOptimal')}
            </button>
            <button
              onClick={() => applyPreset({ soil_ph: 4.2, soil_moisture: 38, air_temp_C: 31, pollution_index: 30 })}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '5px 10px', borderRadius: '8px' }}
            >
              {t('presetAcidic')}
            </button>
            <button
              onClick={() => applyPreset({ soil_ph: 6.8, soil_moisture: 14, air_temp_C: 39, pollution_index: 68 })}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '5px 10px', borderRadius: '8px', color: '#fb7185' }}
            >
              {t('presetHeatwave')}
            </button>
            <button
              onClick={() => applyPreset({ soil_ph: 5.8, soil_moisture: 92, air_temp_C: 27, pollution_index: 75 })}
              className="btn btn-secondary"
              style={{ fontSize: '0.74rem', padding: '5px 10px', borderRadius: '8px', color: '#38bdf8' }}
            >
              {t('presetFlood')}
            </button>
          </div>
        )}
      </div>

      {/* Grid of Sliders */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px 24px'
      }}>
        {sliderConfigs.map((cfg) => {
          const Icon = cfg.icon;
          const val = sensorData[cfg.id] !== undefined ? sensorData[cfg.id] : cfg.min;
          const isWarning = val < cfg.warningMin || val > cfg.warningMax;

          return (
            <div 
              key={cfg.id}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: '12px',
                padding: '12px 14px',
                transition: 'var(--transition-smooth)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: '8px',
                    background: `${cfg.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={16} color={cfg.color} />
                  </div>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {cfg.label}
                  </span>
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: isWarning ? 'var(--color-critical)' : 'var(--text-primary)'
                }}>
                  {val} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cfg.unit}</span>
                </div>
              </div>

              {/* Slider Input */}
              <input
                type="range"
                min={cfg.min}
                max={cfg.max}
                step={cfg.step}
                value={val}
                disabled={isReadOnly}
                onChange={(e) => handleSliderChange(cfg.id, e.target.value)}
                style={{
                  width: '100%',
                  height: '6px',
                  borderRadius: '6px',
                  outline: 'none',
                  cursor: isReadOnly ? 'not-allowed' : 'pointer',
                  accentColor: cfg.color
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <span>{cfg.min}</span>
                <span style={{ color: isWarning ? '#fb7185' : 'var(--text-muted)' }}>
                  {isWarning ? t('outOfBoundsWarning') : t('bioOptimalSafe')}
                </span>
                <span>{cfg.max}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selectors for Season & Crop Species */}
      <div style={{
        marginTop: 18,
        paddingTop: 14,
        borderTop: '1px solid var(--border-card)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 14
      }}>
        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            {t('season')}
          </label>
          <select
            className="input-field"
            value={sensorData.season || 'Summer'}
            disabled={isReadOnly}
            onChange={(e) => onChange({ ...sensorData, season: e.target.value })}
            style={{ padding: '8px 12px', fontSize: '0.88rem' }}
          >
            <option value="Spring">{t('seasonSpring')}</option>
            <option value="Summer">{t('seasonSummer')}</option>
            <option value="Autumn">{t('seasonAutumn')}</option>
            <option value="Winter">{t('seasonWinter')}</option>
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>
            {t('plantSpecies')}
          </label>
          <select
            className="input-field"
            value={sensorData.plant_species || 'Lúa nước'}
            disabled={isReadOnly}
            onChange={(e) => onChange({ ...sensorData, plant_species: e.target.value })}
            style={{ padding: '8px 12px', fontSize: '0.88rem' }}
          >
            <option value="Lúa nước">{t('cropRice')}</option>
            <option value="Cây ăn trái">{t('cropFruit')}</option>
            <option value="Rau màu thổ nhưỡng">{t('cropVegetables')}</option>
            <option value="Đồng cỏ chăn nuôi">{t('cropGrass')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
