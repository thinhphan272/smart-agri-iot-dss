import React, { useState, useEffect } from 'react';
import { 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Flame,
  BarChart3, 
  ShieldAlert,
  Server,
  Cpu,
  Layers,
  Activity,
  Play,
  Sparkles,
  Info,
  Database,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Camera,
  Tag,
  Eye,
  Search,
  ArrowRight
} from 'lucide-react';
import { batchAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function BatchScanner() {
  const { role } = useAuth();
  const { t, lang, tText } = useLanguage();
  const [file, setFile] = useState(null);
  const [engine, setEngine] = useState('dual'); // 'dual' | 'lightgbm' | 'spark'
  const [modelSource, setModelSource] = useState('lightgbm'); // 'lightgbm' | 'spark'
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [showSchema, setShowSchema] = useState(false);

  // Phân đoạn xem dữ liệu linh hoạt (Slice Window Navigator)
  const [startRow, setStartRow] = useState(1);
  const [endRow, setEndRow] = useState(25);
  const [startRowInput, setStartRowInput] = useState('1');
  const [endRowInput, setEndRowInput] = useState('25');
  const [sliceNotice, setSliceNotice] = useState(null);
  const [sliceLoading, setSliceLoading] = useState(false);

  const canUpload = role === 'admin';
  const maxTotal = scanResult ? scanResult.total_records : 200000;

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('agri_batch_scan_result');
      if (saved) {
        const parsed = JSON.parse(saved);
        setScanResult(parsed);
        if (parsed.total_records) {
          const initEnd = Math.min(25, parsed.total_records);
          setEndRow(initEnd);
          setEndRowInput(String(initEnd));
        }
      }
    } catch (e) {
      console.warn('Cannot load scan result from sessionStorage:', e);
    }
    loadRecentJobs();
  }, []);

  useEffect(() => {
    if (scanResult) {
      try {
        sessionStorage.setItem('agri_batch_scan_result', JSON.stringify(scanResult));
      } catch (e) {
        console.warn('Cannot save scan result to sessionStorage:', e);
      }
    }
  }, [scanResult]);

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

  // Xử lý khi người dùng đổi ô "Từ dòng"
  const handleStartChange = (val) => {
    setStartRowInput(val);
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;

    let newStart = parsed;
    if (newStart < 1) newStart = 1;
    if (newStart > maxTotal) newStart = maxTotal;

    // Quy tắc: Ô bắt đầu không được lớn hơn ô kết thúc
    if (newStart > endRow) {
      setSliceNotice({
        type: 'error',
        message: lang === 'vi'
          ? `Lỗi: Số dòng bắt đầu (${newStart}) không được lớn hơn số dòng kết thúc (${endRow})!`
          : `Error: Starting row (${newStart}) cannot be greater than ending row (${endRow})!`
      });
      setStartRow(newStart);
      return;
    }

    // Quy tắc: Nếu khoảng cách > 25 dòng (ví dụ đang [25, 50] mà nhập < 25), thông báo và tự động đưa về 25 dòng
    if (endRow - newStart > 25) {
      const adjustedStart = Math.max(1, endRow - 25);
      setSliceNotice({
        type: 'warning',
        message: lang === 'vi'
          ? `Khoảng hiển thị (${endRow - newStart + 1} dòng) vượt quá giới hạn 25 dòng! Đã tự động đưa 'Từ dòng' về ${adjustedStart}.`
          : `View window (${endRow - newStart + 1} rows) exceeds 25 rows limit! Auto-adjusted 'From row' to ${adjustedStart}.`
      });
      setStartRow(adjustedStart);
      setStartRowInput(String(adjustedStart));
      return;
    }

    // Hợp lệ (xem ít hơn hoặc bằng 25 dòng)
    setSliceNotice(null);
    setStartRow(newStart);
  };

  // Xử lý khi người dùng đổi ô "Đến dòng"
  const handleEndChange = (val) => {
    setEndRowInput(val);
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) return;

    let newEnd = parsed;
    if (newEnd > maxTotal) newEnd = maxTotal;

    // Quy tắc: Ô kết thúc không được nhỏ hơn ô bắt đầu
    if (newEnd < startRow) {
      setSliceNotice({
        type: 'error',
        message: lang === 'vi'
          ? `Lỗi: Số dòng kết thúc (${newEnd}) không được nhỏ hơn số dòng bắt đầu (${startRow})!`
          : `Error: Ending row (${newEnd}) cannot be less than starting row (${startRow})!`
      });
      setEndRow(newEnd);
      return;
    }

    // Quy tắc: Nếu khoảng cách > 25 dòng (ví dụ từ 25 tới 50 mà nhập > 50), thông báo và tự động back về tối đa 25 dòng
    if (newEnd - startRow > 25) {
      const adjustedEnd = Math.min(maxTotal, startRow + 25);
      setSliceNotice({
        type: 'warning',
        message: lang === 'vi'
          ? `Khoảng hiển thị (${newEnd - startRow + 1} dòng) vượt quá giới hạn 25 dòng! Đã tự động điều chỉnh 'Đến dòng' về ${adjustedEnd}.`
          : `View window (${newEnd - startRow + 1} rows) exceeds 25 rows limit! Auto-adjusted 'To row' to ${adjustedEnd}.`
      });
      setEndRow(adjustedEnd);
      setEndRowInput(String(adjustedEnd));
      return;
    }

    // Hợp lệ (xem ít hơn hoặc bằng 25 dòng)
    setSliceNotice(null);
    setEndRow(newEnd);
  };

  const handlePresetClick = (s, e) => {
    const validStart = Math.max(1, s);
    const validEnd = Math.min(maxTotal, e);
    setStartRow(validStart);
    setEndRow(validEnd);
    setStartRowInput(String(validStart));
    setEndRowInput(String(validEnd));
    setSliceNotice(null);
    executeFetchSlice(validStart, validEnd);
  };

  const executeFetchSlice = async (s = startRow, e = endRow, source = modelSource) => {
    if (s > e) {
      setSliceNotice({
        type: 'error',
        message: lang === 'vi'
          ? `Lỗi: Số dòng bắt đầu (${s}) không được lớn hơn số dòng kết thúc (${e})!`
          : `Error: Starting row (${s}) cannot be greater than ending row (${e})!`
      });
      return;
    }
    setSliceLoading(true);
    try {
      const jobId = scanResult ? scanResult.job_id : null;
      const res = await batchAPI.getSlice(jobId, s, e, source);
      if (res.data && res.data.preview_records) {
        setScanResult(prev => ({
          ...prev,
          preview_records: res.data.preview_records,
          model_source: res.data.model_source || source,
          active_threshold: res.data.active_threshold || (source === 'spark' ? 0.50 : 0.35)
        }));
        setSliceNotice({
          type: 'success',
          message: lang === 'vi'
            ? `Đã nạp thành công ${res.data.count} bản ghi bằng trọng số [${source === 'spark' ? 'Apache Spark MLlib' : 'LightGBM SOTA'}] từ dòng #${s.toLocaleString()} đến #${e.toLocaleString()}!`
            : `Successfully loaded ${res.data.count} records using [${source === 'spark' ? 'Apache Spark MLlib' : 'LightGBM SOTA'}] weights from row #${s.toLocaleString()} to #${e.toLocaleString()}!`
        });
        setTimeout(() => setSliceNotice(null), 4000);
      }
    } catch (err) {
      setSliceNotice({
        type: 'error',
        message: err.response?.data?.detail || (lang === 'vi' ? 'Lỗi khi trích xuất phân đoạn dữ liệu!' : 'Error extracting dataset slice!')
      });
    } finally {
      setSliceLoading(false);
    }
  };

  const handleSwitchModelSource = async (newSource) => {
    if (newSource === modelSource) return;
    setModelSource(newSource);
    if (scanResult) {
      await executeFetchSlice(startRow, endRow, newSource);
    }
  };

  // Quét tệp người dùng tải lên (hỗ trợ đến 500,000 dòng)
  const handleUploadScan = async () => {
    if (!file) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng chọn một tệp CSV trước khi quét!' : 'Please select a CSV file before scanning!');
      return;
    }
    if (!canUpload) {
      setErrorMsg(lang === 'vi' ? 'Chỉ tài khoản Admin / Hội Đồng mới có quyền nạp và quét tệp Big Data CSV!' : 'Only Admin / Reviewer accounts can upload and scan Big Data CSV files!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await batchAPI.uploadCSV(file, engine, modelSource);
      setScanResult(res.data);
      setStartRow(1);
      const initEnd = Math.min(25, res.data.total_records);
      setEndRow(initEnd);
      setStartRowInput('1');
      setEndRowInput(String(initEnd));
      setSliceNotice(null);
      loadRecentJobs();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || (lang === 'vi' ? 'Lỗi xử lý file CSV.' : 'CSV processing error.'));
    } finally {
      setLoading(false);
    }
  };

  // Nạp nhanh tập dữ liệu 200,000 dòng có sẵn trong dự án (1-Click)
  const handleScan200kDefault = async () => {
    if (!canUpload) {
      setErrorMsg(lang === 'vi' ? 'Chỉ tài khoản Admin / Hội Đồng mới có quyền nạp và quét tệp Big Data CSV!' : 'Only Admin / Reviewer accounts can upload and scan Big Data CSV files!');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await batchAPI.scan200kDataset(engine, modelSource);
      setScanResult(res.data);
      setStartRow(1);
      const initEnd = Math.min(25, res.data.total_records);
      setEndRow(initEnd);
      setStartRowInput('1');
      setEndRowInput(String(initEnd));
      setSliceNotice(null);
      loadRecentJobs();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || (lang === 'vi' ? 'Lỗi đọc tệp 200,000 dòng.' : 'Error reading 200,000 records dataset.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 40 }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span className="badge badge-optimal">{t('batchBadgeEngine')}</span>
              <span className="badge badge-warning">{t('batchBadgeMaxRows')}</span>
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700 }}>
              <FileSpreadsheet size={26} color="var(--color-optimal)" />
              <span>{t('batchTitle')}</span>
            </h2>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: 4, maxWidth: 750 }}>
              {t('batchDesc')}
            </p>
          </div>

          {/* Action Buttons: Schema Specs & 1-Click Load 200k */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setShowSchema(!showSchema)}
              className="btn"
              style={{
                padding: '12px 18px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: showSchema ? 'rgba(59, 130, 246, 0.25)' : 'var(--bg-surface)',
                border: showSchema ? '1px solid #3b82f6' : '1px solid var(--border-card)',
                color: showSchema ? '#60a5fa' : 'var(--text-primary)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <BookOpen size={18} color="#3b82f6" />
              <span>{t('btnMetadataSpec')}</span>
              {showSchema ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              onClick={handleScan200kDefault}
              disabled={!canUpload || loading}
              className="btn btn-primary"
              style={{
                padding: '12px 20px',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
              }}
            >
              <Sparkles size={18} />
              <span>{t('btnLoad200k')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* METADATA SCHEMA & DATASET DICTIONARY CARD */}
      {showSchema && (
        <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #3b82f6', marginBottom: 24, animation: 'fadeIn 0.2s ease-in-out' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={22} color="#3b82f6" />
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0 }}>
                  {t('schemaModalTitle')}
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 6, marginBottom: 0, lineHeight: 1.6, maxWidth: 900 }}>
                {lang === 'vi' 
                  ? 'Tập dữ liệu ghi nhận các chỉ số môi trường và đặc điểm sinh trưởng của nhiều loài cây cỏ được thu thập từ hệ thống cảm biến tại các khu vực sinh thái khác nhau. Mỗi bản ghi tương ứng với một mẫu quan sát tại một thời điểm, xuyên suốt bốn mùa trong năm và bao gồm cả những yếu tố ngẫu nhiên về thiết bị, thẻ nhận dạng hoặc ghi chú thực địa.'
                  : 'The dataset captures environmental metrics and vegetative physiological characteristics collected from IoT sensor stations across ecological zones. Each record corresponds to a point-in-time observation across four seasons, accounting for hardware factors, identification tags, and field notes.'}
              </p>
            </div>
            <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '6px 12px', fontSize: '0.78rem' }}>
              {lang === 'vi' ? 'Chuẩn 17 Thuộc Tính Gốc + 4 Thuộc Tính AI' : '17 Standard Raw Features + 4 AI Features'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 16 }}>
            {/* Nhóm 1 */}
            <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span>{t('batchGrpDevices')}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><code>record_id</code>: {lang === 'vi' ? 'Mã định danh bản ghi quan sát duy nhất' : 'Unique observation record identifier'}</li>
                <li><code>sensor_id</code>: {lang === 'vi' ? 'Mã trạm cảm biến IoT tại thực địa (S0001 - S0500)' : 'Field IoT station identifier (S0001 - S0500)'}</li>
                <li><code>image_filename</code>: {lang === 'vi' ? 'Tên file ảnh camera thực địa (img_*.jpg)' : 'Field camera image filename (img_*.jpg)'}</li>
                <li><code>sample_note</code>: {lang === 'vi' ? 'Ghi chú thực địa (ok, noisy, suspect, manual_check)' : 'Field observation note (ok, noisy, suspect, manual_check)'}</li>
                <li><code>random_tag</code>: {lang === 'vi' ? 'Thẻ nhận dạng ngẫu nhiên (alpha, beta, gamma...)' : 'Hardware test batch tag (alpha, beta, gamma...)'}</li>
                <li><code>sensor_battery</code>: {lang === 'vi' ? 'Tỷ lệ pin thiết bị phần cứng (%)' : 'Sensor battery capacity level (%)'}</li>
              </ul>
            </div>

            {/* Nhóm 2 */}
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#34d399', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span>{t('batchGrpSoil')}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><code>soil_ph</code>: {lang === 'vi' ? 'Độ pH đất (độ chua / kiềm)' : 'Soil pH level (acidity / alkalinity)'}</li>
                <li><code>soil_moisture</code>: {lang === 'vi' ? 'Độ ẩm trong đất (%)' : 'Soil volumetric moisture content (%)'}</li>
                <li><code>sunlight_hours</code>: {lang === 'vi' ? 'Cường độ chiếu sáng (giờ nắng / ngày)' : 'Sunlight exposure hours (hrs/day)'}</li>
                <li><code>air_temp_C</code>: {lang === 'vi' ? 'Nhiệt độ môi trường không khí (°C)' : 'Ambient air temperature (°C)'}</li>
                <li><code>pollution_index</code>: {lang === 'vi' ? 'Mức độ ô nhiễm môi trường' : 'Environmental pollution severity index'}</li>
                <li><code>proximity_to_water_m</code>: {lang === 'vi' ? 'Khoảng cách nguồn nước tự nhiên (m)' : 'Distance to natural open water (m)'}</li>
                <li><code>elevation_m</code>: {lang === 'vi' ? 'Độ cao khu vực so với mực nước biển (m)' : 'Terrain elevation above sea level (m)'}</li>
                <li><code>vegetation_density</code>: {lang === 'vi' ? 'Mật độ thảm thực vật che phủ (0.0 - 1.0)' : 'Vegetation canopy cover density (0.0 - 1.0)'}</li>
              </ul>
            </div>

            {/* Nhóm 3 */}
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span>{t('batchGrpSeason')}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><code>season</code>: {lang === 'vi' ? 'Bốn mùa trong năm (Spring, Summer, Autumn, Winter)' : 'Four meteorological seasons (Spring, Summer, Autumn, Winter)'}</li>
                <li><code>plant_species</code>: {lang === 'vi' ? 'Phân loại 5 nhóm loài (Tree_Y, Shrub_X, Grassland_A, Grassland_B, Wetland_C)' : '5 botanical species categories (Tree_Y, Shrub_X, Grassland_A, Grassland_B, Wetland_C)'}</li>
              </ul>
              <div style={{ marginTop: 8, fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {lang === 'vi' ? '* Thu thập xuyên suốt chu kỳ sinh trưởng bốn mùa của thực vật' : '* Sampled across full seasonal growth vegetative cycles'}
              </div>
            </div>

            {/* Nhóm 4 */}
            <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#c084fc', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <span>{t('batchGrpTarget')}</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                <li><code>plant_health</code>: {lang === 'vi' ? 'Tình trạng sức khỏe (Healthy / Unhealthy)' : 'Plant health state (Healthy / Unhealthy)'}</li>
                <li><code>stress_probability</code>: {lang === 'vi' ? 'Xác suất rủi ro stress tính bởi AI (%)' : 'Eco-stress risk probability computed by AI (%)'}</li>
                <li><code>ai_diagnosis</code>: {lang === 'vi' ? 'Trạng thái chẩn đoán (Khỏe Mạnh / Nguy Cơ Stress)' : 'Diagnostic classification (Healthy / Stress Risk)'}</li>
                <li><code>risk_level</code>: {lang === 'vi' ? 'Cấp độ nguy cơ (Optimal / Warning / Critical)' : 'Severity tier (Optimal / Warning / Critical)'}</li>
                <li><code>verification</code>: {lang === 'vi' ? 'Đối chứng kiểm tra chuẩn xác (✓ Khớp 100%)' : 'Ground-truth cross verification (✓ 100% Matched)'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Engine Selection & Upload Zone */}
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
            <span>
              {lang === 'vi' ? 'Bạn đang xem ở quyền' : 'You are currently logged in as'} <strong>{role}</strong>. {lang === 'vi' ? 'Hãy bấm Đăng Nhập Nhanh → Admin trên thanh điều hướng để nạp file!' : 'Click Quick Demo Login → Admin in navbar to upload datasets!'}
            </span>
          </div>
        )}

        {/* Engine Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('engineSelectLabel')}</span>
          
          <button
            onClick={() => setEngine('dual')}
            className="btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.82rem',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: engine === 'dual' ? 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' : 'var(--bg-surface)',
              color: engine === 'dual' ? '#ffffff' : 'var(--text-secondary)',
              border: engine === 'dual' ? '1px solid #10b981' : '1px solid var(--border-card)',
              fontWeight: engine === 'dual' ? 700 : 500
            }}
          >
            <Sparkles size={15} />
            <span>{t('engineDual')}</span>
          </button>

          <button
            onClick={() => setEngine('lightgbm')}
            className="btn"
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: engine === 'lightgbm' ? 'var(--color-optimal)' : 'var(--bg-surface)',
              color: engine === 'lightgbm' ? '#ffffff' : 'var(--text-secondary)',
              border: engine === 'lightgbm' ? '1px solid var(--color-optimal)' : '1px solid var(--border-card)',
              fontWeight: engine === 'lightgbm' ? 700 : 500
            }}
          >
            <Zap size={15} />
            <span>{t('engineLightGBM')}</span>
          </button>

          <button
            onClick={() => setEngine('spark')}
            className="btn"
            style={{
              padding: '8px 14px',
              fontSize: '0.82rem',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: engine === 'spark' ? '#f59e0b' : 'var(--bg-surface)',
              color: engine === 'spark' ? '#000000' : 'var(--text-secondary)',
              border: engine === 'spark' ? '1px solid #f59e0b' : '1px solid var(--border-card)',
              fontWeight: engine === 'spark' ? 700 : 500
            }}
          >
            <Flame size={15} />
            <span>{t('engineSpark')}</span>
          </button>
        </div>

        {/* Nguồn Trọng Số Mô Hình (Model Weight Source Switcher) */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          gap: 12, 
          marginBottom: 22, 
          flexWrap: 'wrap' 
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '6px 14px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Cpu size={15} color="#38bdf8" />
              <span>{t('modelSourceLabel')}</span>
            </span>

            <div style={{ display: 'inline-flex', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3, gap: 4 }}>
              <button
                type="button"
                onClick={() => handleSwitchModelSource('lightgbm')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: modelSource === 'lightgbm' ? 700 : 500,
                  background: modelSource === 'lightgbm' ? 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' : 'transparent',
                  color: modelSource === 'lightgbm' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: modelSource === 'lightgbm' ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🟢 LightGBM SOTA (T* = 35%)</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchModelSource('spark')}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: modelSource === 'spark' ? 700 : 500,
                  background: modelSource === 'spark' ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  color: modelSource === 'spark' ? '#ffffff' : 'var(--text-secondary)',
                  boxShadow: modelSource === 'spark' ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🔥 Apache Spark GBT (T* = 50%)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div 
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: '16px',
            padding: '36px 20px',
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
              width: 54,
              height: 54,
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
                {file ? `${t('dropzoneSelected')} ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : t('dropzoneText')}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                {t('dropzoneSubtext')}
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ marginTop: 14, color: '#fb7185', fontSize: '0.84rem' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={handleUploadScan}
            disabled={!canUpload || !file || loading}
            className="btn btn-primary"
            style={{ padding: '12px 28px', fontSize: '0.92rem' }}
          >
            <Play size={17} />
            <span>{loading ? t('btnScanning') : t('btnUploadScan')}</span>
          </button>
        </div>
      </div>

      {/* Loading Animation Card */}
      {loading && (
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', width: 44, height: 44, border: '3px solid rgba(16, 185, 129, 0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: 16, fontWeight: 700 }}>
            {t('batchLoadingTitle')}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {t('batchLoadingSubtitle')}
          </p>
        </div>
      )}

      {/* RESULT SECTION */}
      {scanResult && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* View Mode Switcher Pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            padding: '12px 18px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-card)',
            borderRadius: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('batchViewModeLabel')}</span>
              <span className="badge" style={{
                background: engine === 'dual' ? 'rgba(16, 185, 129, 0.15)' : (engine === 'lightgbm' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)'),
                color: engine === 'spark' ? '#fbbf24' : '#34d399',
                border: `1px solid ${engine === 'spark' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                fontSize: '0.78rem'
              }}>
                {engine === 'dual' ? t('batchDualArenaTag') : (engine === 'lightgbm' ? t('batchSingleLgbTag') : t('batchSingleSparkTag'))}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                onClick={() => setEngine('dual')}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  background: engine === 'dual' ? 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' : 'rgba(255,255,255,0.05)',
                  color: engine === 'dual' ? '#fff' : 'var(--text-secondary)',
                  border: engine === 'dual' ? '1px solid #10b981' : '1px solid var(--border-card)',
                  fontWeight: engine === 'dual' ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {t('batchViewDualBtn')}
              </button>
              <button
                onClick={() => setEngine('lightgbm')}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  background: engine === 'lightgbm' ? 'var(--color-optimal)' : 'rgba(255,255,255,0.05)',
                  color: engine === 'lightgbm' ? '#000' : 'var(--text-secondary)',
                  border: engine === 'lightgbm' ? '1px solid var(--color-optimal)' : '1px solid var(--border-card)',
                  fontWeight: engine === 'lightgbm' ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {t('batchViewLgbBtn')}
              </button>
              <button
                onClick={() => setEngine('spark')}
                className="btn"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  background: engine === 'spark' ? '#f59e0b' : 'rgba(255,255,255,0.05)',
                  color: engine === 'spark' ? '#000' : 'var(--text-secondary)',
                  border: engine === 'spark' ? '1px solid #f59e0b' : '1px solid var(--border-card)',
                  fontWeight: engine === 'spark' ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {t('batchViewSparkBtn')}
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar: Adapts based on active engine */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {/* Card 1: Tổng số bản ghi */}
            <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchTotalRecords')}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>
                {scanResult.total_records.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 2 }}>{scanResult.filename}</div>
            </div>

            {/* If Single LightGBM */}
            {engine === 'lightgbm' && (
              <>
                <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid var(--color-optimal)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchEngineExec')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-optimal)', marginTop: 8 }}>
                    LightGBM SOTA
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Single-Node C++ (In-Memory Monolithic)
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid var(--color-optimal)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchExecTime')}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-optimal)', marginTop: 4 }}>
                    {(scanResult.execution_time_ms / 1000).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-optimal)', marginTop: 2 }}>
                    ~{scanResult.records_per_second.toLocaleString()} {lang === 'vi' ? 'dòng / giây' : 'rows / sec'}
                  </div>
                </div>
              </>
            )}

            {/* If Single Spark */}
            {engine === 'spark' && (
              <>
                <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchEngineExec')}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b', marginTop: 8 }}>
                    Apache Spark MLlib
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Distributed 6-Partition RDD
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchSparkTime')}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                    {(scanResult.dual_arena.spark_mllib.execution_time_ms / 1000).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: 2 }}>
                    6 Partitions (local[*])
                  </div>
                </div>
              </>
            )}

            {/* If Dual Arena */}
            {engine === 'dual' && (
              <>
                <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid var(--color-optimal)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchLgbTime')}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-optimal)', marginTop: 4 }}>
                    {(scanResult.execution_time_ms / 1000).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--color-optimal)', marginTop: 2 }}>
                    ~{scanResult.records_per_second.toLocaleString()} {lang === 'vi' ? 'dòng / giây' : 'rows / sec'}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchSparkTime')}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                    {(scanResult.dual_arena.spark_mllib.execution_time_ms / 1000).toFixed(2)}s
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#f59e0b', marginTop: 2 }}>
                    6 Partitions (local[*])
                  </div>
                </div>
              </>
            )}

            {/* Card: Cây gặp stress sinh thái */}
            <div className="glass-panel" style={{ padding: '18px', textAlign: 'center', borderLeft: '3px solid var(--color-critical)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t('batchStressTrees')}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-critical)', marginTop: 4 }}>
                {scanResult.stress_count.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--color-critical)', marginTop: 2 }}>
                {scanResult.stress_rate_percent}% {lang === 'vi' ? 'tổng đàn cây' : 'of total batch'}
              </div>
            </div>
          </div>

          {/* DETAILED ENGINE ARCHITECTURE PANEL */}

          {/* 1. SINGLE-ENGINE: LIGHTGBM ONLY */}
          {engine === 'lightgbm' && (
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid var(--color-optimal)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-card)', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--color-optimal)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={22} color="var(--color-optimal)" />
                    <span>{lang === 'vi' ? 'Kết Quả Quét Lô Đơn Lẻ: LightGBM Classifier (Single-Node C++)' : 'Single Engine Batch Scan: LightGBM Classifier (Single-Node C++)'}</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {t('batchSingleLgbDesc')}
                  </p>
                </div>
                <span className="badge badge-optimal">{t('batchSingleLgb1Part')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Thông số kỹ thuật */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--color-optimal)', fontWeight: 700, margin: 0 }}>
                    {t('batchSpecsAndThroughput')}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>• <strong>{t('batchMemArch')}</strong> {scanResult.dual_arena.lightgbm.architecture}</div>
                    <div>• <strong>{t('batchPartitionsCount')}</strong> {scanResult.dual_arena.lightgbm.partitions} Partition ({t('batchContiguousRam')})</div>
                    <div>• <strong>{t('batchExecutionTime')}</strong> <span style={{ color: 'var(--color-optimal)', fontWeight: 800 }}>{(scanResult.dual_arena.lightgbm.execution_time_ms / 1000).toFixed(2)} {t('batchSeconds')}</span></div>
                    <div>• <strong>{t('batchProcessingSpeed')}</strong> <span style={{ color: 'var(--color-optimal)', fontWeight: 800 }}>~{scanResult.dual_arena.lightgbm.throughput_records_sec.toLocaleString()} {t('batchRecordsSec')}</span></div>
                    <div>• <strong>{t('batchRamUsage')}</strong> ~{scanResult.dual_arena.lightgbm.memory_mb} MB ({t('batchExtremelyLight')})</div>
                  </div>

                  {/* Single Progress Bar */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('batchSingleThreadProgress')}</span>
                      <span style={{ color: 'var(--color-optimal)', fontWeight: 700 }}>100% ({scanResult.total_records.toLocaleString()} {t('batchRowsUnit')})</span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 6 }} />
                    </div>
                  </div>
                </div>

                {/* Phân tích thuật toán & Giới hạn vật lý */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#6ee7b7', fontWeight: 700, margin: 0 }}>
                    {t('batchCppSpecsAndLimits')}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    {t('batchLightgbmFastReason')}
                  </p>
                  
                  {/* Limitation Alert */}
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'rgba(244, 63, 94, 0.1)', 
                    borderLeft: '3px solid var(--color-critical)',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.78rem',
                    color: '#fda4af',
                    lineHeight: 1.5,
                    marginTop: 'auto'
                  }}>
                    <strong>{t('batchPhysicalLimitReport')}</strong>
                    {scanResult.dual_arena.lightgbm.limitation}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. SINGLE-ENGINE: APACHE SPARK MLLIB ONLY */}
          {engine === 'spark' && (
            <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-card)', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Flame size={22} color="#f59e0b" />
                    <span>{t('batchSingleSparkTitle')}</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {t('batchSingleSparkSubtitle')}
                  </p>
                </div>
                <span className="badge badge-warning">{t('batch6PartitionsDist')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                {/* Thông số phân tán & Workers */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#f59e0b', fontWeight: 700, margin: 0 }}>
                    {t('batchClusterSpecsAnd6Workers')}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>• <strong>{t('batchDistArch')}</strong> {scanResult.dual_arena.spark_mllib.architecture}</div>
                    <div>• <strong>{t('batchPartitionsCount')}</strong> {scanResult.dual_arena.spark_mllib.partitions} Partitions ({t('batch6WorkerThreadsParallel')})</div>
                    <div>• <strong>{t('batchExecutionTime')}</strong> <span style={{ color: '#f59e0b', fontWeight: 800 }}>{(scanResult.dual_arena.spark_mllib.execution_time_ms / 1000).toFixed(2)} {t('batchSeconds')}</span> ({t('batchSubjectToOverhead')})</div>
                    <div>• <strong>{t('batchProcessingSpeed')}</strong> ~{scanResult.dual_arena.spark_mllib.throughput_records_sec.toLocaleString()} {t('batchRecordsSec')} ({t('batchViaJvmPy4j')})</div>
                    <div>• <strong>{t('batchRamJvmHeap')}</strong> ~{scanResult.dual_arena.spark_mllib.memory_mb} MB ({t('batchJvmHeapRddCache')})</div>
                  </div>

                  {/* 6 Workers Parallel Progress Bars */}
                  <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('batch6WorkersParallelProgress')}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {scanResult.dual_arena.spark_mllib.workers.map((w) => (
                        <div key={w.worker_id} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: 6, fontSize: '0.72rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Partition {w.partition}:</span>
                            <span style={{ color: 'var(--text-muted)' }}>{w.records.toLocaleString()} {t('batchRowsUnit')}</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${w.progress_percent}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4 DAG Pipeline Stages & Ưu thế Big Data */}
                <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', padding: '18px', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fbbf24', fontWeight: 700, margin: 0 }}>
                    {t('batchDagPipelineStages')}
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {scanResult.dual_arena.spark_mllib.dag_stages.map((stage, idx) => (
                      <li key={idx}><strong>Stage {idx + 1}:</strong> {stage.split(': ')[1] || stage}</li>
                    ))}
                  </ul>

                  {/* Advantage Alert */}
                  <div style={{ 
                    padding: '12px 14px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderLeft: '3px solid var(--color-optimal)',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.78rem',
                    color: '#6ee7b7',
                    lineHeight: 1.5,
                    marginTop: 'auto'
                  }}>
                    <strong>{t('batchVitalAdvantage')}</strong>
                    {scanResult.dual_arena.spark_mllib.advantage}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. DUAL-ENGINE: SIDE-BY-SIDE ARENA COMPARISON */}
          {engine === 'dual' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-card)', paddingBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={20} color="#10b981" />
                    <span>{t('batchDualArenaHeader')}</span>
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                    {t('batchDualArenaSub')}
                  </p>
                </div>
                <span className="badge badge-optimal">{t('batchSideBySideBadge')}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
                {/* LEFT COLUMN: LIGHTGBM */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Zap size={20} color="var(--color-optimal)" />
                      <h4 style={{ fontSize: '1.05rem', color: 'var(--color-optimal)', fontWeight: 700, margin: 0 }}>
                        {t('batchBrain1Title')}
                      </h4>
                    </div>
                    <span className="badge badge-optimal">Single-Node C++</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>• <strong>{t('batchMemArch')}</strong> {scanResult.dual_arena.lightgbm.architecture}</div>
                    <div>• <strong>{t('batchPartitionsCount')}</strong> {scanResult.dual_arena.lightgbm.partitions} Partition ({t('batchContiguousRam')})</div>
                    <div>• <strong>{t('batchExecutionTime')}</strong> <span style={{ color: 'var(--color-optimal)', fontWeight: 800 }}>{(scanResult.dual_arena.lightgbm.execution_time_ms / 1000).toFixed(2)} {t('batchSeconds')}</span></div>
                    <div>• <strong>{t('batchProcessingSpeed')}</strong> <span style={{ color: 'var(--color-optimal)', fontWeight: 800 }}>~{scanResult.dual_arena.lightgbm.throughput_records_sec.toLocaleString()} {t('batchRecordsSec')}</span></div>
                    <div>• <strong>{t('batchRamUsage')}</strong> ~{scanResult.dual_arena.lightgbm.memory_mb} MB ({t('batchExtremelyLight')})</div>
                  </div>

                  {/* Single Progress Bar */}
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{t('batchSingleThreadProgress')}</span>
                      <span style={{ color: 'var(--color-optimal)', fontWeight: 700 }}>100% ({scanResult.total_records.toLocaleString()} {t('batchRowsUnit')})</span>
                    </div>
                    <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 6, overflow: 'hidden' }}>
                      <div style={{ width: '100%', height: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', borderRadius: 6 }} />
                    </div>
                  </div>

                  {/* Limitation Alert */}
                  <div style={{ 
                    padding: '10px 12px', 
                    background: 'rgba(244, 63, 94, 0.1)', 
                    borderLeft: '3px solid var(--color-critical)',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.76rem',
                    color: '#fda4af',
                    lineHeight: 1.5,
                    marginTop: 'auto'
                  }}>
                    <strong>{t('batchPhysicalLimit')}</strong>
                    {scanResult.dual_arena.lightgbm.limitation}
                  </div>
                </div>

                {/* RIGHT COLUMN: APACHE SPARK MLLIB */}
                <div style={{
                  background: 'var(--bg-surface)',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Flame size={20} color="#f59e0b" />
                      <h4 style={{ fontSize: '1.05rem', color: '#f59e0b', fontWeight: 700, margin: 0 }}>
                        {t('batchBrain2Title')}
                      </h4>
                    </div>
                    <span className="badge badge-warning">6 Partitions RDD</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>• <strong>{t('batchDistArch')}</strong> {scanResult.dual_arena.spark_mllib.architecture}</div>
                    <div>• <strong>{t('batchPartitionsCount')}</strong> {scanResult.dual_arena.spark_mllib.partitions} Partitions ({t('batch6WorkerThreadsParallel')})</div>
                    <div>• <strong>{t('batchExecutionTime')}</strong> <span style={{ color: '#f59e0b', fontWeight: 800 }}>{(scanResult.dual_arena.spark_mllib.execution_time_ms / 1000).toFixed(2)} {t('batchSeconds')}</span> ({t('batchSubjectToOverhead')})</div>
                    <div>• <strong>{t('batchProcessingSpeed')}</strong> ~{scanResult.dual_arena.spark_mllib.throughput_records_sec.toLocaleString()} {t('batchRecordsSec')} ({t('batchViaJvmPy4j')})</div>
                    <div>• <strong>{t('batchRamUsage')}</strong> ~{scanResult.dual_arena.spark_mllib.memory_mb} MB ({t('batchJvmHeapRddCache')})</div>
                  </div>

                  {/* 6 Workers Parallel Progress Bars */}
                  <div style={{ marginTop: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('batch6WorkersParallelProgress')}</span>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6 }}>
                      {scanResult.dual_arena.spark_mllib.workers.map((w) => (
                        <div key={w.worker_id} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: 6, fontSize: '0.72rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ color: '#f59e0b', fontWeight: 600 }}>Partition {w.partition}:</span>
                            <span style={{ color: 'var(--text-muted)' }}>{w.records.toLocaleString()} {t('batchRowsUnit')}</span>
                          </div>
                          <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${w.progress_percent}%`, height: '100%', background: '#f59e0b', borderRadius: 3 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Advantage Alert */}
                  <div style={{ 
                    padding: '10px 12px', 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    borderLeft: '3px solid var(--color-optimal)',
                    borderRadius: '0 8px 8px 0',
                    fontSize: '0.76rem',
                    color: '#6ee7b7',
                    lineHeight: 1.5,
                    marginTop: 'auto'
                  }}>
                    <strong>{t('batchBigDataPower')}</strong>
                    {scanResult.dual_arena.spark_mllib.advantage}
                  </div>
                </div>
              </div>

              {/* Academic Summary Comparison Banner */}
              <div style={{
                marginTop: 18,
                padding: '14px 18px',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12
              }}>
                <Info size={18} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                  <strong style={{ color: 'var(--text-primary)' }}>{t('batchJuryConclusionTitle')}</strong>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {t('batchJuryConclusionText')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Comprehensive Preview Table with All 17 Original CSV Columns + AI Results */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Database size={18} color="#10b981" />
                  <span>{t('batchTableTitle')} ({lang === 'vi' ? 'Phân Đoạn Dòng' : 'Slice Rows'} #{startRow.toLocaleString()} - #{endRow.toLocaleString()})</span>
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 0 }}>
                  {t('batchTableSubtitle')}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.72rem' }}>
                  {t('batchGrpDevices')}
                </span>
                <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.72rem' }}>
                  {t('batchGrpSoil')}
                </span>
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.72rem' }}>
                  {t('batchGrpSeason')}
                </span>
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)', fontSize: '0.72rem' }}>
                  {t('batchGrpTarget')}
                </span>
              </div>
            </div>

            {/* Full-Dataset Ground-Truth Verification Stats Banner (if available) */}
            {scanResult.match_stats && scanResult.match_stats.has_labels && (
              <div style={{ marginBottom: 20, background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShieldAlert size={20} color="#c084fc" />
                    <span style={{ fontSize: '0.98rem', fontWeight: 700, color: '#e2e8f0' }}>
                      {t('batchFullVerificationTitle')} {scanResult.match_stats.total_evaluated.toLocaleString()} {t('batchFullVerificationSuffix')}
                    </span>
                  </div>
                  <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.35)', fontSize: '0.76rem', fontWeight: 700 }}>
                    {t('batchFullMatchRate')} {scanResult.match_stats.match_rate_percent}%
                  </span>
                </div>

                {/* 3 KPI mini cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 14 }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#34d399', fontWeight: 600 }}>{t('batchMatchedCardTitle')}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#10b981', marginTop: 4 }}>
                      {scanResult.match_stats.matched_count.toLocaleString()} {lang === 'vi' ? 'dòng' : 'rows'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {lang === 'vi' ? 'Chiếm' : 'Accounting for'} {scanResult.match_stats.match_rate_percent}% {t('batchMatchedCardDesc')}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#fbbf24', fontWeight: 600 }}>{t('batchEarlyWarningCardTitle')}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f59e0b', marginTop: 4 }}>
                      {scanResult.match_stats.early_warning_count.toLocaleString()} {lang === 'vi' ? 'dòng' : 'rows'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {lang === 'vi' ? 'Chiếm' : 'Accounting for'} {scanResult.match_stats.early_warning_percent}% ({t('batchEarlyWarningCardDesc')})
                    </div>
                  </div>

                  <div style={{ background: 'rgba(148, 163, 184, 0.08)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 600 }}>{t('batchFieldNoiseCardTitle')}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#cbd5e1', marginTop: 4 }}>
                      {scanResult.match_stats.missed_count.toLocaleString()} {lang === 'vi' ? 'dòng' : 'rows'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {lang === 'vi' ? 'Chiếm' : 'Accounting for'} {scanResult.match_stats.missed_percent}% ({t('batchFieldNoiseCardDesc')})
                    </div>
                  </div>
                </div>

                {/* Technical Callout Notes */}
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.6, background: 'rgba(0, 0, 0, 0.3)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #38bdf8' }}>
                  <div style={{ fontWeight: 700, color: '#38bdf8', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Info size={14} color="#38bdf8" />
                    <span>{t('batchDeviationExplTitle')}</span>
                  </div>
                  <div>• {t('batchDeviationExplText1')}</div>
                  <div style={{ marginTop: 4 }}>• {t('batchDeviationExplText2')}</div>
                </div>
              </div>
            )}

            {/* REAL-TIME MODEL WEIGHT SOURCE SWITCHER & COMPARISON PANEL */}
            <div style={{
              marginBottom: 20,
              background: modelSource === 'spark' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
              border: `1px solid ${modelSource === 'spark' ? 'rgba(245, 158, 11, 0.35)' : 'rgba(16, 185, 129, 0.35)'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: modelSource === 'spark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${modelSource === 'spark' ? '#f59e0b' : '#10b981'}`
                  }}>
                    {modelSource === 'spark' ? <Flame size={20} color="#f59e0b" /> : <Zap size={20} color="#10b981" />}
                  </div>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span>{t('batchWeightSourceActiveLabel')}</span>
                      <span style={{ 
                        color: modelSource === 'spark' ? '#fbbf24' : '#34d399',
                        background: modelSource === 'spark' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        padding: '2px 10px',
                        borderRadius: 6,
                        border: `1px solid ${modelSource === 'spark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`
                      }}>
                        {modelSource === 'spark' ? 'Apache Spark MLlib (GBT 30 Trees)' : 'LightGBM SOTA Booster (12 Trees)'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {modelSource === 'spark' 
                        ? t('batchWeightSparkSub')
                        : t('batchWeightLgbSub')}
                    </div>
                  </div>
                </div>

                {/* Big Switch Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => handleSwitchModelSource('lightgbm')}
                    disabled={sliceLoading}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: sliceLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: modelSource === 'lightgbm' 
                        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      color: modelSource === 'lightgbm' ? '#ffffff' : 'var(--text-secondary)',
                      border: modelSource === 'lightgbm' 
                        ? '1px solid #10b981' 
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: modelSource === 'lightgbm' ? '0 4px 12px rgba(16, 185, 129, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Zap size={15} />
                    <span>{t('batchBtnUseLgbWeights')}</span>
                    {modelSource === 'lightgbm' && <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.2)' }}>{t('batchSelectedTag')}</span>}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchModelSource('spark')}
                    disabled={sliceLoading}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: sliceLoading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: modelSource === 'spark' 
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' 
                        : 'rgba(255, 255, 255, 0.05)',
                      color: modelSource === 'spark' ? '#ffffff' : 'var(--text-secondary)',
                      border: modelSource === 'spark' 
                        ? '1px solid #f59e0b' 
                        : '1px solid rgba(255, 255, 255, 0.15)',
                      boxShadow: modelSource === 'spark' ? '0 4px 12px rgba(245, 158, 11, 0.35)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Flame size={15} />
                    <span>{t('batchBtnUseSparkWeights')}</span>
                    {modelSource === 'spark' && <span style={{ fontSize: '0.7rem', padding: '1px 5px', borderRadius: 4, background: 'rgba(255,255,255,0.2)' }}>{t('batchSelectedTag')}</span>}
                  </button>
                </div>
              </div>

              {/* Dynamic Comparison Explanation Box */}
              <div style={{
                background: 'rgba(0, 0, 0, 0.35)',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '0.78rem',
                lineHeight: 1.6,
                borderLeft: `3px solid ${modelSource === 'spark' ? '#f59e0b' : '#10b981'}`
              }}>
                {modelSource === 'spark' ? (
                  <div>
                    <strong style={{ color: '#fbbf24' }}>{t('batchSparkEmpiricalDiffTitle')}</strong>
                    <span style={{ color: '#e2e8f0' }}>{t('batchSparkEmpiricalDiffText')}</span>
                  </div>
                ) : (
                  <div>
                    <strong style={{ color: '#34d399' }}>{t('batchLgbEmpiricalDiffTitle')}</strong>
                    <span style={{ color: '#e2e8f0' }}>{t('batchLgbEmpiricalDiffText')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE DATASET SLICE NAVIGATOR */}
            <div style={{
              marginBottom: 20,
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={18} color="#38bdf8" />
                  <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {t('batchSliceNavTitle')}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    ({t('batchShowingRows')} <strong style={{ color: '#38bdf8' }}>#{startRow.toLocaleString()}</strong> {lang === 'vi' ? 'đến' : 'to'} <strong style={{ color: '#38bdf8' }}>#{endRow.toLocaleString()}</strong> / {lang === 'vi' ? 'Tổng' : 'Total'} {maxTotal.toLocaleString()} {lang === 'vi' ? 'dòng' : 'rows'})
                  </span>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{t('batchJumpQuick')}</span>
                  <button 
                    type="button"
                    onClick={() => handlePresetClick(1, 25)}
                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', background: startRow === 1 && endRow === 25 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer' }}>
                    [1 - 25]
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePresetClick(25, 50)}
                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', background: startRow === 25 && endRow === 50 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer' }}>
                    [25 - 50]
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePresetClick(117945, 117955)}
                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', background: startRow === 117945 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255,255,255,0.05)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.3)', cursor: 'pointer' }}>
                    [{lang === 'vi' ? '117,945 - 117,955 (Hạn hán)' : '117,945 - 117,955 (Drought)'}]
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePresetClick(100000, 100025)}
                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', background: startRow === 100000 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer' }}>
                    [{lang === 'vi' ? '100,000 - 100,025 (Giữa tập)' : '100,000 - 100,025 (Mid-dataset)'}]
                  </button>
                  <button 
                    type="button"
                    onClick={() => handlePresetClick(Math.max(1, maxTotal - 24), maxTotal)}
                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem', background: endRow === maxTotal ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.05)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', cursor: 'pointer' }}>
                    [{lang === 'vi' ? `Cuối tập: ${Math.max(1, maxTotal - 24).toLocaleString()} - ${maxTotal.toLocaleString()}` : `End: ${Math.max(1, maxTotal - 24).toLocaleString()} - ${maxTotal.toLocaleString()}`}]
                  </button>
                </div>
              </div>

              {/* Form Inputs & Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('fromRowLabel')}</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={maxTotal}
                    value={startRowInput}
                    onChange={(e) => handleStartChange(e.target.value)}
                    style={{
                      width: '110px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}
                  />
                </div>

                <ArrowRight size={16} color="var(--text-secondary)" />

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('toRowLabel')}</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={maxTotal}
                    value={endRowInput}
                    onChange={(e) => handleEndChange(e.target.value)}
                    style={{
                      width: '110px',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(0, 0, 0, 0.35)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => executeFetchSlice(startRow, endRow)}
                  disabled={sliceLoading || startRow > endRow}
                  className="btn btn-primary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '0.82rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: (sliceLoading || startRow > endRow) ? 'not-allowed' : 'pointer',
                    opacity: (sliceLoading || startRow > endRow) ? 0.6 : 1
                  }}>
                  {sliceLoading ? (
                    <span>{t('batchLoadingSlice')}</span>
                  ) : (
                    <>
                      <Search size={14} />
                      <span>{t('btnApplySlice')} ({Math.max(0, endRow - startRow + 1)} {lang === 'vi' ? 'dòng' : 'rows'})</span>
                    </>
                  )}
                </button>

                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                  {t('batchSliceMaxLimit')}
                </span>
              </div>

              {/* Notification Banner for Auto-Adjustment or Errors */}
              {sliceNotice && (
                <div style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: sliceNotice.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : (sliceNotice.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)'),
                  color: sliceNotice.type === 'error' ? '#fca5a5' : (sliceNotice.type === 'success' ? '#6ee7b7' : '#fcd34d'),
                  border: `1px solid ${sliceNotice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : (sliceNotice.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)')}`
                }}>
                  {sliceNotice.type === 'error' ? (
                    <AlertTriangle size={15} color="#ef4444" />
                  ) : (sliceNotice.type === 'success' ? (
                    <CheckCircle2 size={15} color="#10b981" />
                  ) : (
                    <Info size={15} color="#f59e0b" />
                  ))}
                  <span>{sliceNotice.message}</span>
                </div>
              )}
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--border-card)', textAlign: 'left' }}>
                    {/* Nhóm 1: Thiết Bị & Định Danh */}
                    <th style={{ padding: '10px 12px', color: '#94a3b8', position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 2 }}>#</th>
                    <th style={{ padding: '10px 12px', color: '#60a5fa', position: 'sticky', left: 40, background: 'var(--bg-surface)', zIndex: 2 }}>{t('batchThRecordId')}</th>
                    <th style={{ padding: '10px 12px', color: '#60a5fa' }}>{t('batchThSensorId')}</th>
                    <th style={{ padding: '10px 12px', color: '#60a5fa' }}>{t('batchThImage')}</th>
                    <th style={{ padding: '10px 12px', color: '#60a5fa' }}>{t('batchThNote')}</th>
                    <th style={{ padding: '10px 12px', color: '#60a5fa' }}>{t('batchThTag')}</th>
                    <th style={{ padding: '10px 12px', color: '#60a5fa' }}>{t('batchThBattery')}</th>
                    {/* Nhóm 2: Môi trường & Khí hậu */}
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThSoilPh')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThMoisture')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThTemp')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThSunlight')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThPollution')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThProximity')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThElevation')}</th>
                    <th style={{ padding: '10px 12px', color: '#34d399' }}>{t('batchThVegDensity')}</th>
                    {/* Nhóm 3: Sinh thái nông nghiệp */}
                    <th style={{ padding: '10px 12px', color: '#fbbf24' }}>{t('batchThSeason')}</th>
                    <th style={{ padding: '10px 12px', color: '#fbbf24' }}>{t('batchThSpecies')}</th>
                    {/* Nhóm 4: Nhãn gốc & Đối chiếu AI */}
                    <th style={{ padding: '10px 12px', color: '#c084fc' }}>{t('batchThActualLabel')}</th>
                    <th style={{ padding: '10px 12px', color: '#c084fc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{t('batchThStressProb')}</span>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          padding: '1px 6px', 
                          borderRadius: '4px',
                          background: modelSource === 'spark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: modelSource === 'spark' ? '#fbbf24' : '#34d399',
                          border: `1px solid ${modelSource === 'spark' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)'}`,
                          fontWeight: 600
                        }}>
                          {modelSource === 'spark' ? 'Spark GBT (T*=50%)' : 'LightGBM (T*=35%)'}
                        </span>
                      </div>
                    </th>
                    <th style={{ padding: '10px 12px', color: '#c084fc' }}>{t('batchThAiDiagnosis')}</th>
                    <th style={{ padding: '10px 12px', color: '#c084fc' }}>{t('batchThRiskLevel')}</th>
                    <th style={{ padding: '10px 12px', color: '#c084fc' }}>{t('batchThVerification')}</th>
                  </tr>
                </thead>
                <tbody>
                  {scanResult.preview_records.map((r) => {
                    const isHealthyActual = r.actual_label ? r.actual_label.toLowerCase() === 'healthy' : null;
                    const isUnhealthyActual = r.actual_label ? (r.actual_label.toLowerCase() === 'unhealthy' || r.actual_label.toLowerCase().includes('stress')) : null;
                    const isMatch = (isUnhealthyActual !== null && isHealthyActual !== null) 
                      ? ((isUnhealthyActual && r.is_stress) || (isHealthyActual && !r.is_stress)) 
                      : null;

                    return (
                      <tr key={r.index} style={{ borderBottom: '1px solid var(--border-card)', transition: 'background 0.15s ease' }}>
                        {/* 1. STT */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', position: 'sticky', left: 0, background: 'var(--bg-surface)', zIndex: 1 }}>
                          {r.index}
                        </td>
                        {/* 2. record_id */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600, position: 'sticky', left: 40, background: 'var(--bg-surface)', zIndex: 1 }}>
                          #{r.record_id || r.index}
                        </td>
                        {/* 3. sensor_id */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                          {r.sensor_id || 'N/A'}
                        </td>
                        {/* 4. image_filename */}
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#94a3b8' }}>
                            <Camera size={12} color="#60a5fa" />
                            <span>{r.image_filename || `img_${r.record_id}.jpg`}</span>
                          </span>
                        </td>
                        {/* 5. sample_note */}
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            fontSize: '0.72rem', 
                            background: r.sample_note === 'ok' ? 'rgba(16, 185, 129, 0.1)' : (r.sample_note === 'noisy' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(244, 63, 94, 0.1)'),
                            color: r.sample_note === 'ok' ? '#34d399' : (r.sample_note === 'noisy' ? '#fbbf24' : '#fda4af'),
                            border: `1px solid ${r.sample_note === 'ok' ? 'rgba(16, 185, 129, 0.25)' : (r.sample_note === 'noisy' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(244, 63, 94, 0.25)')}`,
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {r.sample_note || 'ok'}
                          </span>
                        </td>
                        {/* 6. random_tag */}
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ 
                            padding: '2px 7px', 
                            borderRadius: '4px', 
                            fontSize: '0.72rem', 
                            background: 'rgba(56, 189, 248, 0.08)',
                            color: '#7dd3fc',
                            border: '1px solid rgba(56, 189, 248, 0.2)',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {r.random_tag || 'alpha'}
                          </span>
                        </td>
                        {/* 7. sensor_battery */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.sensor_battery != null ? `${r.sensor_battery}%` : '—'}
                        </td>
                        {/* 8. soil_ph */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.soil_ph}
                        </td>
                        {/* 9. soil_moisture */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.soil_moisture}%
                        </td>
                        {/* 10. air_temp_C */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.air_temp_C}°C
                        </td>
                        {/* 11. sunlight_hours */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.sunlight_hours != null ? `${r.sunlight_hours}h` : '—'}
                        </td>
                        {/* 12. pollution_index */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.pollution_index}
                        </td>
                        {/* 13. proximity_to_water_m */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.proximity_to_water_m != null ? `${r.proximity_to_water_m}m` : '—'}
                        </td>
                        {/* 14. elevation_m */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.elevation_m != null ? `${r.elevation_m}m` : '—'}
                        </td>
                        {/* 15. vegetation_density */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)' }}>
                          {r.vegetation_density != null ? r.vegetation_density : '—'}
                        </td>
                        {/* 16. season */}
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.74rem', 
                            background: 'rgba(245, 158, 11, 0.1)', 
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.25)'
                          }}>
                            {r.season || 'N/A'}
                          </span>
                        </td>
                        {/* 17. plant_species */}
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{ 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.74rem', 
                            background: 'rgba(56, 189, 248, 0.1)', 
                            color: '#38bdf8',
                            border: '1px solid rgba(56, 189, 248, 0.25)'
                          }}>
                            {r.plant_species || 'N/A'}
                          </span>
                        </td>
                        {/* 18. actual_label (plant_health) */}
                        <td style={{ padding: '9px 12px' }}>
                          {r.actual_label ? (
                            isUnhealthyActual ? (
                              <span className="badge badge-critical" style={{ fontSize: '0.72rem' }}>Unhealthy</span>
                            ) : (
                              <span className="badge badge-optimal" style={{ fontSize: '0.72rem' }}>Healthy</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.74rem' }}>{t('batchUnlabeled')}</span>
                          )}
                        </td>
                        {/* 19. stress_probability */}
                        <td style={{ padding: '9px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: r.is_stress ? 'var(--color-critical)' : 'var(--color-optimal)' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span>{(r.stress_probability * 100).toFixed(2)}%</span>
                            {modelSource === 'spark' && r.stress_probability >= 0.8 && (
                              <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(244, 63, 94, 0.2)', color: '#fda4af', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
                                {lang === 'vi' ? 'Hạn đỉnh' : 'Peak drought'}
                              </span>
                            )}
                            {modelSource === 'spark' && r.stress_probability <= 0.05 && (
                              <span style={{ fontSize: '0.66rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(16, 185, 129, 0.2)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
                                {lang === 'vi' ? 'Cực an toàn' : 'Ultra safe'}
                              </span>
                            )}
                          </div>
                        </td>
                        {/* 20. is_stress */}
                        <td style={{ padding: '9px 12px' }}>
                          {r.is_stress ? (
                            <span className="badge badge-critical" style={{ fontSize: '0.74rem' }}>{t('batchUnhealthy')}</span>
                          ) : (
                            <span className="badge badge-optimal" style={{ fontSize: '0.74rem' }}>{t('batchHealthy')}</span>
                          )}
                        </td>
                        {/* 21. risk_level */}
                        <td style={{ padding: '9px 12px' }}>
                          <span style={{
                            fontWeight: 600,
                            fontSize: '0.76rem',
                            color: r.risk_level === 'Critical' ? 'var(--color-critical)' : (r.risk_level === 'Warning' ? 'var(--color-warning)' : 'var(--color-optimal)')
                          }}>
                            {r.risk_level}
                          </span>
                        </td>
                        {/* 22. isMatch */}
                        <td style={{ padding: '9px 12px', fontSize: '0.75rem' }}>
                          {isMatch !== null ? (
                            isMatch ? (
                              <span style={{ color: 'var(--color-optimal)', fontWeight: 700 }}>{t('batchMatched')}</span>
                            ) : (
                              <span style={{ color: 'var(--color-warning)', fontWeight: 700 }}>{t('batchMismatch')}</span>
                            )
                          ) : (
                            <span style={{ color: 'var(--text-secondary)' }}>{t('batchNewInference')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECENT JOBS TABLE */}
      {recentJobs.length > 0 && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: 14 }}>
            {t('batchRecentAudit')}
          </h4>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '10px 12px' }}>{t('batchThJobId')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('batchThFileName')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('batchThRecords')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('batchThStressed')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('batchThOptimal')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('batchThDuration')}</th>
                  <th style={{ padding: '10px 12px' }}>{t('batchThTimestamp')}</th>
                </tr>
              </thead>
              <tbody>
                {recentJobs.map((j) => (
                  <tr key={j.id} style={{ borderBottom: '1px solid var(--border-card)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>#{j.id}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{j.filename}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{j.total_records.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-critical)', fontWeight: 600 }}>{j.stress_count.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--color-optimal)', fontWeight: 600 }}>{j.healthy_count.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>{j.execution_time_ms} ms</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {new Date(j.created_at).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')}
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
