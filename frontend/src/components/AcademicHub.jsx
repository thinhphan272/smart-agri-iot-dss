import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  Maximize2, 
  X, 
  Server, 
  Cpu, 
  Database, 
  Layers, 
  Activity, 
  FileText,
  Zap,
  Flame,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';

export default function AcademicHub() {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('spark-vs-traditional'); // 'spark-vs-traditional' | 'track1-vs-track2'
  const [chartGroup, setChartGroup] = useState('spark'); // 'spark' | 'traditional'
  const [zoomedImage, setZoomedImage] = useState(null);

  // Dữ liệu so sánh đa mô hình toàn diện (Thư viện thông thường vs Apache Spark MLlib)
  const fullBenchmarkData = [
    {
      model: "LightGBM Classifier (SOTA Đề Xuất)",
      engine: "Thư viện Thông thường (C++)",
      env: "Single-Node / Đơn luồng RAM",
      partitions: "1 Partition (Monolithic)",
      trainTime: "1.25s",
      accuracy: "94.80%",
      precision: "95.05%",
      recall: "65.78%",
      f1: "0.778",
      rocAuc: "0.830",
      prAuc: "0.719",
      isBest: true,
      badge: "SOTA Phục vụ Realtime Web/Mobile",
      badgeColor: "var(--color-optimal)"
    },
    {
      model: "Spark GBTClassifier (Boosting)",
      engine: "Apache Spark MLlib",
      env: "Distributed DAG Engine",
      partitions: "6 Partitions (local[*])",
      trainTime: "21.42s",
      accuracy: "94.07%",
      precision: "93.89%",
      recall: "94.07%",
      f1: "0.937",
      rocAuc: "0.834",
      prAuc: "0.733",
      isSparkBest: true,
      badge: "Mô hình Phân tán Tốt nhất",
      badgeColor: "#f59e0b"
    },
    {
      model: "Spark Random Forest (Trees=50)",
      engine: "Apache Spark MLlib",
      env: "Distributed DAG Engine",
      partitions: "6 Partitions (local[*])",
      trainTime: "8.10s",
      accuracy: "94.03%",
      precision: "93.84%",
      recall: "94.03%",
      f1: "0.936",
      rocAuc: "0.830",
      prAuc: "0.719",
      badge: "Ensemble Phân tán",
      badgeColor: "#38bdf8"
    },
    {
      model: "Spark Decision Tree (Depth=6)",
      engine: "Apache Spark MLlib",
      env: "Distributed DAG Engine",
      partitions: "6 Partitions (local[*])",
      trainTime: "3.30s",
      accuracy: "94.05%",
      precision: "93.86%",
      recall: "94.05%",
      f1: "0.936",
      rocAuc: "0.214",
      prAuc: "0.086",
      badge: "Cây Quyết định Phân tán",
      badgeColor: "#94a3b8"
    },
    {
      model: "Spark Logistic Regression",
      engine: "Apache Spark MLlib",
      env: "Distributed DAG Engine",
      partitions: "6 Partitions (local[*])",
      trainTime: "8.18s",
      accuracy: "90.31%",
      precision: "90.38%",
      recall: "90.31%",
      f1: "0.884",
      rocAuc: "0.801",
      prAuc: "0.639",
      badge: "Tuyến tính Phân tán",
      badgeColor: "#a855f7"
    },
    {
      model: "Scikit-Learn Logistic Regression",
      engine: "Thư viện Thông thường (Sklearn)",
      env: "Single-Node RAM",
      partitions: "1 Partition",
      trainTime: "2.10s",
      accuracy: "55.65%",
      precision: "3.05%",
      recall: "43.41%",
      f1: "0.057",
      rocAuc: "0.501",
      prAuc: "0.032",
      badge: "Baseline Đơn máy",
      badgeColor: "#64748b"
    },
    {
      model: "Dummy Baseline (Majority Class)",
      engine: "Thư viện Thông thường",
      env: "Rule-based",
      partitions: "-",
      trainTime: "0.05s",
      accuracy: "96.91%",
      precision: "0.00%",
      recall: "0.00%",
      f1: "0.000",
      rocAuc: "0.500",
      prAuc: "0.031",
      badge: "Nghịch lý 97% Accuracy",
      badgeColor: "#ef4444"
    }
  ];

  // Danh mục 5 biểu đồ Thư viện thông thường (LightGBM)
  const traditionalCharts = [
    {
      id: "loss_conv",
      title: "Đường Cong Hội Tụ Loss Function",
      file: "loss_convergence_curve.png",
      desc: "Hàm mất mát Log-loss giảm đều qua 150 vòng lặp, minh chứng mô hình học hội tụ không bị Overfitting."
    },
    {
      id: "cm_test",
      title: "Ma Trận Nhầm Lẫn Tập Test (Confusion Matrix)",
      file: "confusion_matrix_test.png",
      desc: "Độ nhạy đạt 65.78% ở ngưỡng T*=0.34, phát hiện chính xác cây stress sinh thái trên 60,000 mẫu kiểm thử."
    },
    {
      id: "roc_pr",
      title: "Đường Cong PR & ROC Kép",
      file: "pr_and_roc_curves.png",
      desc: "ROC-AUC đạt 0.830 và PR-AUC đạt 0.719, vượt xa ngẫu nhiên (0.50) và giữ vững độ phân loại cao."
    },
    {
      id: "feat_imp",
      title: "Tầm Quan Trọng 20 Đặc Trưng Sinh Thái",
      file: "feature_importance.png",
      desc: "Độ chua đất (pH Stress), Hạn hán (Drought Risk) và Ma sát thủy văn chiếm vị trí đầu bảng trong cây quyết định."
    },
    {
      id: "model_bench",
      title: "So Sánh Hiệu Năng Đa Mô Hình Chuẩn Quốc Tế",
      file: "model_benchmark_comparison.png",
      desc: "Đối chứng toàn diện Dummy vs Logistic Regression vs Decision Tree vs LightGBM trên cả 2 Track."
    }
  ];

  // Danh mục biểu đồ Apache Spark MLlib (Đồng bộ 1-1 với thư viện thường)
  const sparkCharts = [
    {
      id: "spark_loss",
      title: "Đường Cong Hội Tụ Loss Function (Spark GBT Loss)",
      file: "spark_loss_convergence_curve.png",
      desc: "Hàm mất mát Log-loss giảm đều qua 30 vòng lặp Boosting phân tán, ROC-AUC hội tụ tiệm cận 0.8340."
    },
    {
      id: "spark_cm",
      title: "Ma Trận Nhầm Lẫn Phân Tán (Spark GBT Confusion Matrix)",
      file: "spark_confusion_matrix.png",
      desc: "Khả năng phân loại của Spark GBTClassifier trên tập dữ liệu phân tán 60,000 mẫu kiểm thử."
    },
    {
      id: "spark_roc",
      title: "Đường Cong PR & ROC của Apache Spark MLlib",
      file: "spark_pr_and_roc_curves.png",
      desc: "Spark GBT đạt ROC-AUC = 0.8340 và PR-AUC = 0.7330, chứng minh tính toàn vẹn toán học phân tán."
    },
    {
      id: "spark_feat",
      title: "Trọng Số Đặc Trưng Phân Tán (Spark GBT Feature Importance)",
      file: "spark_feature_importance.png",
      desc: "Trích xuất từ VectorAssembler và GBTClassificationModel trên Apache Spark Pipeline."
    },
    {
      id: "spark_bench",
      title: "Tổng Hợp Benchmark Các Mô Hình Apache Spark MLlib",
      file: "spark_model_benchmark.png",
      desc: "Đối sánh trực quan giữa Logistic Regression, Decision Tree, Random Forest và GBT trên Spark."
    },
    {
      id: "spark_time",
      title: "Thời Gian Huấn Luyện Phân Tán (Spark Training Time)",
      file: "spark_training_time_comparison.png",
      desc: "Đo lường thời gian huấn luyện 4 mô hình Spark trên 6 Partitions (Decision Tree 3.3s, GBT 21.4s)."
    }
  ];

  const currentCharts = chartGroup === 'spark' ? sparkCharts : traditionalCharts;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 26, paddingBottom: 40 }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{ padding: '28px', borderLeft: '4px solid #10b981' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)'
            }}>
              <Award size={26} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="badge badge-optimal">HUIT Big Data Defense Ready</span>
                <span className="badge badge-warning">200,000 Bản Ghi Cảm Biến</span>
              </div>
              <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                Trung Tâm Báo Cáo Đối Chứng Học Thuật & Xử Lý Phân Tán
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Đề tài Nông nghiệp Thông minh: Đối chiếu Thư viện Thông thường (LightGBM) vs Apache Spark MLlib (6 Partitions)
              </p>
            </div>
          </div>

          {/* Quick Artifact Download Buttons */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={`${API_BASE_URL}/api/predict/download-artifacts/lightgbm`}
              download="plant_health_model_artifacts.zip"
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '10px 16px' }}
            >
              <Download size={16} />
              <span>Tải Artifacts LightGBM (.ZIP)</span>
            </a>
            <a
              href={`${API_BASE_URL}/api/predict/download-artifacts/spark`}
              download="spark_mllib_model_artifacts.zip"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '10px 16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <Flame size={16} />
              <span>Tải Artifacts Spark MLlib (.ZIP)</span>
            </a>
          </div>
        </div>

        {/* Sub-Tab Navigation Switcher */}
        <div style={{ 
          display: 'flex', 
          gap: 10, 
          marginTop: 22, 
          paddingTop: 18, 
          borderTop: '1px solid var(--border-card)',
          overflowX: 'auto' 
        }}>
          <button
            onClick={() => setActiveSubTab('spark-vs-traditional')}
            className="btn"
            style={{
              padding: '10px 18px',
              fontSize: '0.86rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeSubTab === 'spark-vs-traditional' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
              color: activeSubTab === 'spark-vs-traditional' ? '#f59e0b' : 'var(--text-secondary)',
              border: activeSubTab === 'spark-vs-traditional' ? '1px solid #f59e0b' : '1px solid transparent',
              fontWeight: activeSubTab === 'spark-vs-traditional' ? 700 : 500
            }}
          >
            <Server size={18} />
            <span>ĐỐI CHỨNG: THƯ VIỆN THƯỜNG VS APACHE SPARK MLLIB (TRỌNG TÂM BIG DATA)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('track1-vs-track2')}
            className="btn"
            style={{
              padding: '10px 18px',
              fontSize: '0.86rem',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: activeSubTab === 'track1-vs-track2' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: activeSubTab === 'track1-vs-track2' ? 'var(--color-optimal)' : 'var(--text-secondary)',
              border: activeSubTab === 'track1-vs-track2' ? '1px solid var(--color-optimal)' : '1px solid transparent',
              fontWeight: activeSubTab === 'track1-vs-track2' ? 700 : 500
            }}
          >
            <Database size={18} />
            <span>ĐỐI CHỨNG BÀI TOÁN: TRACK 1 (DỮ LIỆU GỐC) VS TRACK 2 (ECO-STRESS SOTA)</span>
          </button>
        </div>
      </div>

      {/* CONTENT TAB 1: SPARK VS TRADITIONAL */}
      {activeSubTab === 'spark-vs-traditional' && (
        <>
          {/* 4 Stat Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {/* Card 1: LightGBM SOTA */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid var(--color-optimal)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>THƯ VIỆN THÔNG THƯỜNG</span>
                <span className="badge badge-optimal">Realtime Serving</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                LightGBM SOTA
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-optimal)' }}>1.25s</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Thời gian train</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Accuracy: <strong>94.80%</strong> | ROC-AUC: <strong>0.830</strong></div>
                <div>• Phản hồi suy luận: <strong>&lt; 20ms</strong> trên Web & Mobile</div>
                <div>• Kiến trúc: Single-Node C++ biên dịch tối ưu</div>
              </div>
            </div>

            {/* Card 2: Spark MLlib */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>APACHE SPARK MLLIB</span>
                <span className="badge badge-warning">6 Partitions RDD</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Spark GBTClassifier
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>21.42s</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Thời gian train</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Accuracy: <strong>94.07%</strong> | ROC-AUC: <strong>0.834</strong></div>
                <div>• Cấu trúc: <strong>6 RDD Partitions</strong> (local[*])</div>
                <div>• Thực thi: <strong>DAG Stages</strong> song song qua JVM</div>
              </div>
            </div>

            {/* Card 3: Mathematical Parity */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>ĐỐI CHIẾU TOÁN HỌC</span>
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>Chuẩn 100%</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Toàn Vẹn Độ Chính Xác
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>0.830 ⟷ 0.834</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ROC-AUC</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Thuật toán phân tán <strong>không làm giảm chất lượng</strong></div>
                <div>• Cả 2 đều vượt trội hoàn toàn so với Baseline (0.50)</div>
                <div>• F1-Score đạt <strong>0.78 - 0.94</strong> cực kỳ ổn định</div>
              </div>
            </div>

            {/* Card 4: Big Data Overhead */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #a855f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#a855f7', fontWeight: 600 }}>BẢN CHẤT BIG DATA</span>
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>Distributed Cost</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Distributed Overhead
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>200,000</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Dòng (~23.5 MB)</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Dữ liệu &lt; RAM: Single-node C++ thắng vì nhẹ</div>
                <div>• Dữ liệu &gt; RAM (Big Data): Sklearn sập OOM</div>
                <div>• Spark mở rộng ngang (Scale-out) trên cụm máy</div>
              </div>
            </div>
          </div>

          {/* Benchmark Table: Comprehensive Comparison */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Bảng Đối Chứng Thực Nghiệm: Thư Viện Thông Thường vs Apache Spark MLlib
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Trích xuất trực tiếp từ kết quả chạy thực tế trên Kaggle (Tập dữ liệu 200,000 dòng cảm biến)
                </p>
              </div>
              <span className="badge badge-optimal">7 Kiến Trúc Đã Đánh Giá</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 14px' }}>Mô Hình Huấn Luyện</th>
                    <th style={{ padding: '12px 14px' }}>Nền Tảng Thực Thi</th>
                    <th style={{ padding: '12px 14px' }}>Phân Vùng (Partitions)</th>
                    <th style={{ padding: '12px 14px' }}>Thời Gian Train</th>
                    <th style={{ padding: '12px 14px' }}>Accuracy</th>
                    <th style={{ padding: '12px 14px' }}>Precision</th>
                    <th style={{ padding: '12px 14px' }}>Recall</th>
                    <th style={{ padding: '12px 14px' }}>F1-Score</th>
                    <th style={{ padding: '12px 14px' }}>ROC-AUC</th>
                    <th style={{ padding: '12px 14px' }}>Đặc Tính Ứng Dụng</th>
                  </tr>
                </thead>
                <tbody>
                  {fullBenchmarkData.map((row, idx) => (
                    <tr 
                      key={idx}
                      style={{
                        borderBottom: '1px solid var(--border-card)',
                        background: row.isBest 
                          ? 'rgba(16, 185, 129, 0.08)' 
                          : row.isSparkBest 
                            ? 'rgba(245, 158, 11, 0.08)' 
                            : 'transparent'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: (row.isBest || row.isSparkBest) ? 700 : 500, color: row.isBest ? 'var(--color-optimal)' : row.isSparkBest ? '#f59e0b' : 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {row.isBest && <Zap size={15} color="var(--color-optimal)" />}
                          {row.isSparkBest && <Flame size={15} color="#f59e0b" />}
                          <span>{row.model}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                        {row.engine}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {row.partitions}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.trainTime.startsWith('1.') ? 'var(--color-optimal)' : 'var(--text-primary)' }}>
                        {row.trainTime}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{row.accuracy}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{row.precision}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{row.recall}</td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: (row.isBest || row.isSparkBest) ? 800 : 400, color: (row.isBest || row.isSparkBest) ? '#34d399' : 'inherit' }}>
                        {row.f1}
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: (row.isBest || row.isSparkBest) ? 800 : 400, color: (row.isBest || row.isSparkBest) ? '#34d399' : 'inherit' }}>
                        {row.rocAuc}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span 
                          className="badge" 
                          style={{ 
                            background: `${row.badgeColor}22`, 
                            color: row.badgeColor,
                            border: `1px solid ${row.badgeColor}44`,
                            fontSize: '0.74rem'
                          }}
                        >
                          {row.badge}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Deep Architectural Analysis Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
            {/* Analysis 1: Why Spark has overhead */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Cpu size={20} color="#f59e0b" />
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Giải Mã Chi Phí Phân Tán (Distributed Overhead)
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • <strong>Tại sao LightGBM chỉ mất 1.25s còn Spark mất 21.4s?</strong><br />
                Tập dữ liệu 200,000 dòng có dung lượng ~23.5 MB, hoàn toàn nằm gọn trong RAM. Ở quy mô này, thư viện C++ (LightGBM) không tốn bất kỳ chi phí mạng hay phân mảnh bộ nhớ nào.<br />
                • Trong khi đó, Apache Spark MLlib phải: <strong>1)</strong> Khởi động máy ảo Java (JVM); <strong>2)</strong> Tuần tự hóa dữ liệu qua Py4J Gateway; <strong>3)</strong> Băm dữ liệu vào 6 Partitions và lập lịch đồ thị DAG. Chi phí quản lý phân tán này lớn hơn thời gian tính toán thực tế.
              </p>
            </div>

            {/* Analysis 2: When Spark shines */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--color-optimal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Server size={20} color="var(--color-optimal)" />
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Khi Nào Apache Spark MLlib Bất Khả Chiến Bại?
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • <strong>Vấn đề Out-Of-Memory (OOM) của máy đơn:</strong> Khi nông trường tích lũy dữ liệu nhiều năm lên đến <strong>50GB hoặc 500GB</strong>, việc nạp vào Pandas hoặc Scikit-Learn trên laptop sẽ lập tức gây sập phần mềm vì tràn RAM.<br />
                • <strong>Khả năng mở rộng ngang (Scale-out):</strong> Apache Spark MLlib không bị giới hạn bởi RAM của 1 máy. Khi dữ liệu tăng gấp 10 lần, ta chỉ cần thêm Worker Nodes vào cụm Cluster để dữ liệu tự động chia đều qua các Partitions mà không cần sửa một dòng code nào.
              </p>
            </div>

            {/* Analysis 3: Industry Standard Lambda Architecture */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Layers size={20} color="#38bdf8" />
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  Kiến Trúc Chuẩn Kết Hợp: Lambda Architecture
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • <strong>Tầng Xử lý Lô (Batch Layer - Spark MLlib):</strong> Chạy định kỳ vào ban đêm trên cụm Hadoop / Databricks để phân tích dữ liệu lớn lịch sử, tái huấn luyện mô hình và cập nhật trọng số.<br />
                • <strong>Tầng Phục vụ Thời gian thực (Speed Layer - LightGBM Serving):</strong> Nhúng mô hình tối ưu vào Web Server FastAPI để phục vụ người dùng gạt thanh trượt cảm biến phản hồi dưới <strong>20ms</strong> trên Web và Mobile.
              </p>
            </div>
          </div>
        </>
      )}

      {/* CONTENT TAB 2: TRACK 1 VS TRACK 2 */}
      {activeSubTab === 'track1-vs-track2' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 2 Key Analytical Takeaways Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 18 }}>
            {/* Track 1 Card */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--color-warning)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="badge badge-warning">Track 1: Dữ Liệu Gốc Của Thầy</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>200,000 Dòng</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                Nghịch Lý Độ Chính Xác 97% (The 97% Accuracy Paradox)
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                • Mô hình Dummy đạt <strong>96.91% Accuracy</strong> chỉ bằng cách đoán tất cả cây đều khỏe mạnh. Nhưng <strong>Recall và F1-Score đều bằng 0</strong>.<br />
                • Kiểm định thống kê chứng minh nhãn <code>plant_health</code> phân bố ngẫu nhiên độc lập với 9 biến môi trường (Zero-Signal). Mọi thuật toán AI đều dừng ở sàn ngẫu nhiên <strong>ROC-AUC = 0.50</strong>.
              </p>
            </div>

            {/* Track 2 Card */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--color-optimal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="badge badge-optimal">Track 2: Nhãn Sinh Thái Chuẩn (SOTA)</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-optimal)', fontWeight: 700 }}>Đưa Vào Ứng Dụng Web</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                Mô Hình LightGBM Tối Ưu Ngưỡng Quyết Định T* = 0.34
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                • Bổ sung 4 đặc trưng sinh thái nông học (Axit hóa, Sốc nhiệt/hạn, Thủy văn, Ô nhiễm).<br />
                • Mô hình hội tụ hoàn hảo sau 150 vòng lặp, đạt <strong>ROC-AUC 0.83</strong>, <strong>Precision 95.05%</strong> và <strong>F1-Score 0.778</strong>.<br />
                • Đây là mô hình lõi đang vận hành trên Web Command Center & Mobile PWA.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: 10 SCIENTIFIC VISUALIZATION CHARTS (300 DPI) */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', fontWeight: 700 }}>
              Thư Viện Biểu Đồ Thực Nghiệm Khoa Học (300 DPI)
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Xuất trực tiếp từ quá trình huấn luyện máy học phục vụ Báo cáo & Trình chiếu trước Hội đồng
            </p>
          </div>

          {/* Chart Group Selector */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface)', padding: 4, borderRadius: 10 }}>
            <button
              onClick={() => setChartGroup('spark')}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: chartGroup === 'spark' ? '#f59e0b' : 'transparent',
                color: chartGroup === 'spark' ? '#000000' : 'var(--text-secondary)',
                fontWeight: chartGroup === 'spark' ? 700 : 500
              }}
            >
              <Flame size={15} />
              <span>6 Biểu Đồ Spark MLlib (Có Loss Curve)</span>
            </button>

            <button
              onClick={() => setChartGroup('traditional')}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: chartGroup === 'traditional' ? 'var(--color-optimal)' : 'transparent',
                color: chartGroup === 'traditional' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: chartGroup === 'traditional' ? 700 : 500
              }}
            >
              <Zap size={15} />
              <span>5 Biểu Đồ Thư Viện Thường</span>
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          {currentCharts.map((chart) => {
            const imageUrl = `${API_BASE_URL}/outputs/${chart.file}`;
            return (
              <div 
                key={chart.id}
                className="glass-panel" 
                style={{ 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: '1px solid var(--border-card)',
                  transition: 'all 0.25s ease'
                }}
              >
                {/* Image Container with Hover Overlay */}
                <div 
                  style={{ 
                    position: 'relative', 
                    background: '#040706', 
                    height: 220, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => setZoomedImage({ url: imageUrl, title: chart.title, desc: chart.desc })}
                >
                  <img 
                    src={imageUrl} 
                    alt={chart.title}
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain' 
                    }}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div style="padding: 20px; color: var(--text-muted); font-size: 0.8rem; text-align: center;">📊 Biểu đồ đang được kết xuất...</div>';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.65)',
                    borderRadius: '8px',
                    padding: '6px',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.72rem'
                  }}>
                    <Maximize2 size={13} />
                    <span>Phóng to</span>
                  </div>
                </div>

                {/* Card Content */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '0.96rem', color: 'var(--text-primary)', fontWeight: 700, marginBottom: 6 }}>
                      {chart.title}
                    </h4>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 12 }}>
                      {chart.desc}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-card)' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      300 DPI • PNG
                    </span>
                    <a
                      href={imageUrl}
                      download={chart.file}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <Download size={13} />
                      <span>Tải ảnh PNG</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL-SCREEN IMAGE MODAL */}
      {zoomedImage && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setZoomedImage(null)}
        >
          <div 
            style={{
              maxWidth: '92vw',
              maxHeight: '92vh',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '16px 20px', 
              borderBottom: '1px solid var(--border-card)' 
            }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {zoomedImage.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {zoomedImage.desc}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <a
                  href={zoomedImage.url}
                  download
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Download size={15} />
                  <span>Tải ảnh 300 DPI</span>
                </a>
                <button 
                  onClick={() => setZoomedImage(null)}
                  className="btn btn-secondary"
                  style={{ padding: 8, borderRadius: '8px' }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div style={{ 
              padding: 20, 
              background: '#050a08', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              overflow: 'auto',
              maxHeight: 'calc(92vh - 80px)'
            }}>
              <img 
                src={zoomedImage.url} 
                alt={zoomedImage.title}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '75vh', 
                  objectFit: 'contain',
                  borderRadius: 8
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
