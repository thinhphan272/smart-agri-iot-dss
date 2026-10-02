import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  BarChart3, 
  ShieldAlert 
} from 'lucide-react';
import { batchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function BatchScanner() {
  const { role } = useAuth();
  const { t } = useLanguage();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  const canUpload = role === 'admin';

  useEffect(() => {
    loadRecentJobs();
  }, []);

  const loadRecentJobs = async () => {
    try {
      const res = await batchAPI.getJobs(5);
      setRecentJobs(res.data);
    } catch (err) {
      console.warn('Cannot load jobs:', err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUploadScan = async () => {
    if (!file) {
      setErrorMsg('Vui lòng chọn một tệp CSV trước khi quét!');
      return;
    }
    if (!canUpload) {
      setErrorMsg('Chỉ tài khoản Admin / Hội Đồng mới có quyền nạp và quét tệp Big Data CSV!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await batchAPI.uploadCSV(file);
      setScanResult(res.data);
      loadRecentJobs();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Lỗi xử lý file CSV.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileSpreadsheet size={24} color="var(--color-optimal)" />
              <span>{t('batchTitle')}</span>
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 700 }}>
              {t('batchDesc')}
            </p>
          </div>

          <a
            href={batchAPI.getSampleCSVUrl()}
            download="smart_agri_sample_100_records.csv"
            className="btn btn-outline"
            style={{ fontSize: '0.86rem' }}
          >
            <Download size={16} />
            <span>{t('btnDownloadSample')}</span>
          </a>
        </div>
      </div>

      {/* Upload Zone & Action */}
      <div className="glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
        {!canUpload && (
          <div style={{
            marginBottom: 16,
            padding: '10px 14px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '10px',
            fontSize: '0.84rem',
            color: '#fbbf24',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}>
            <ShieldAlert size={16} />
            <span>Bạn đang xem ở quyền <strong>{role}</strong>. Hãy bấm <strong>Đăng Nhập Nhanh &rarr; Admin</strong> trên thanh điều hướng để nạp file!</span>
          </div>
        )}

        <div 
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: '16px',
            padding: '40px 20px',
            background: 'var(--bg-surface)',
            cursor: canUpload ? 'pointer' : 'not-allowed',
            position: 'relative'
          }}
        >
          <input
            type="file"
            accept=".csv"
            disabled={!canUpload}
            onChange={handleFileChange}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: canUpload ? 'pointer' : 'not-allowed'
            }}
          />

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <UploadCloud size={28} color="var(--color-optimal)" />
            </div>

            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {file ? `Đã chọn: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : t('dropzoneText')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Hỗ trợ tệp định dạng .csv từ 100 đến 20,000 dòng cảm biến
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginTop: 14, color: '#fb7185', fontSize: '0.84rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <button
            onClick={handleUploadScan}
            disabled={!canUpload || !file || loading}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.95rem' }}
          >
            <Zap size={18} />
            <span>{loading ? 'Đang Xử Lý Vectorized AI...' : t('btnUploadScan')}</span>
          </button>
        </div>
      </div>

      {/* Batch Scan Summary Dashboard */}
      {scanResult && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-card)', paddingBottom: 12 }}>
            <BarChart3 size={20} color="var(--color-optimal)" />
            <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              Kết Quả Quét Lô: {scanResult.filename}
            </h3>
          </div>

          {/* Metric Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 14,
            marginBottom: 20
          }}>
            <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỔNG BẢN GHI</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {scanResult.total_records.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
              <div style={{ fontSize: '0.74rem', color: '#fb7185', fontWeight: 600 }}>CÂY BỊ STRESS</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-critical)', marginTop: 4 }}>
                {scanResult.stress_count.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>({scanResult.stress_rate_percent}%)</span>
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>CÂY KHỎE MẠNH</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-optimal)', marginTop: 4 }}>
                {scanResult.healthy_count.toLocaleString()}
              </div>
            </div>

            <div style={{ padding: '14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>TỐC ĐỘ XỬ LÝ</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                {scanResult.records_per_second.toLocaleString()} <span style={{ fontSize: '0.75rem' }}>mẫu/s</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Thời gian: {scanResult.execution_time_ms} ms</div>
            </div>
          </div>

          {/* Preview Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px' }}>STT</th>
                  <th style={{ padding: '10px 12px' }}>Độ pH</th>
                  <th style={{ padding: '10px 12px' }}>Độ ẩm (%)</th>
                  <th style={{ padding: '10px 12px' }}>Nhiệt độ (°C)</th>
                  <th style={{ padding: '10px 12px' }}>Ô nhiễm</th>
                  <th style={{ padding: '10px 12px' }}>Xác suất Stress</th>
                  <th style={{ padding: '10px 12px' }}>Đánh giá</th>
                </tr>
              </thead>
              <tbody>
                {scanResult.preview_records.map((r) => (
                  <tr key={r.index} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>#{r.index}</td>
                    <td style={{ padding: '10px 12px' }}>{r.soil_ph}</td>
                    <td style={{ padding: '10px 12px' }}>{r.soil_moisture}%</td>
                    <td style={{ padding: '10px 12px' }}>{r.air_temp_C}°C</td>
                    <td style={{ padding: '10px 12px' }}>{r.pollution_index}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      {(r.stress_probability * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span className={`badge ${r.is_stress ? 'badge-critical' : 'badge-optimal'}`}>
                        {r.is_stress ? 'Stress Cảnh Báo' : 'Tối Ưu'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
