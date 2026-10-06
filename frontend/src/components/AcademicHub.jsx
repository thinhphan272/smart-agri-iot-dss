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
  Info,
  Columns,
  LayoutGrid,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../services/api';

export default function AcademicHub() {
  const { lang, t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState('spark-vs-traditional'); // 'spark-vs-traditional' | 'track1-vs-track2'
  const [chartViewMode, setChartViewMode] = useState('side-by-side'); // 'side-by-side' | 'spark' | 'traditional'
  const [zoomedImage, setZoomedImage] = useState(null);

  // Dữ liệu so sánh đa mô hình toàn diện (Thư viện thông thường vs Apache Spark MLlib)
  const fullBenchmarkData = [
    {
      model: lang === 'vi' ? "LightGBM Classifier (SOTA Đề Xuất)" : "LightGBM Classifier (Proposed SOTA)",
      engine: lang === 'vi' ? "Thư viện Thông thường (C++)" : "Conventional Library (C++)",
      env: lang === 'vi' ? "Single-Node / Đơn luồng RAM" : "Single-Node / In-Memory RAM",
      partitions: "1 Partition (Monolithic)",
      trainTime: "1.25s",
      accuracy: "94.80%",
      precision: "95.05%",
      recall: "65.78%",
      f1: "0.778",
      rocAuc: "0.830",
      prAuc: "0.719",
      isBest: true,
      badge: t('badgeSotaRealtime'),
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
      badge: t('badgeSparkBest'),
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
      badge: t('badgeEnsemble'),
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
      badge: t('badgeDecisionTree'),
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
      badge: lang === 'vi' ? "Tuyến tính Phân tán" : "Distributed Linear",
      badgeColor: "#a855f7"
    },
    {
      model: "Scikit-Learn Logistic Regression",
      engine: lang === 'vi' ? "Thư viện Thông thường (Sklearn)" : "Conventional Library (Sklearn)",
      env: "Single-Node RAM",
      partitions: "1 Partition",
      trainTime: "2.10s",
      accuracy: "55.65%",
      precision: "3.05%",
      recall: "43.41%",
      f1: "0.057",
      rocAuc: "0.501",
      prAuc: "0.032",
      badge: lang === 'vi' ? "Baseline Đơn máy" : "Single-Node Baseline",
      badgeColor: "#64748b"
    },
    {
      model: "Dummy Baseline (Majority Class)",
      engine: lang === 'vi' ? "Thư viện Thông thường" : "Conventional Library",
      env: "Rule-based",
      partitions: "-",
      trainTime: "0.05s",
      accuracy: "96.91%",
      precision: "0.00%",
      recall: "0.00%",
      f1: "0.000",
      rocAuc: "0.500",
      prAuc: "0.031",
      badge: lang === 'vi' ? "Nghịch lý 97% Accuracy" : "97% Accuracy Paradox",
      badgeColor: "#ef4444"
    }
  ];

  // 6 CẶP BIỂU ĐỒ SO SÁNH SONG SONG ĐỐI ỨNG TRỰC DIỆN (SIDE-BY-SIDE DUAL VIEW)
  const pairedCharts = [
    {
      id: "pair_loss",
      title: lang === 'vi' 
        ? "1. Đường Cong Hội Tụ Loss Function (Loss Convergence Curve)" 
        : "1. Loss Function Convergence Curve",
      subtitle: lang === 'vi'
        ? "So sánh khả năng học hội tụ và kiểm soát Overfitting qua các vòng lặp Boosting"
        : "Comparing learning convergence and overfitting control across boosting iterations",
      insight: lang === 'vi'
        ? "Cả LightGBM (150 vòng) và Spark GBT (30 vòng phân tán) đều hội tụ mượt mà theo hàm mũ, hàm mất mát Log-loss giảm dần ổn định và không gặp hiện tượng Overfitting."
        : "Both LightGBM (150 rounds) and Spark GBT (30 distributed rounds) exhibit smooth exponential convergence, with log-loss decaying stably without overfitting.",
      traditional: {
        title: lang === 'vi' ? "Thư Viện Thường: LightGBM Loss Convergence" : "Conventional: LightGBM Loss Convergence",
        file: "loss_convergence_curve.png",
        desc: lang === 'vi'
          ? "Hàm mất mát Log-loss giảm đều qua 150 vòng lặp, minh chứng mô hình học hội tụ ổn định không bị Overfitting."
          : "Log-loss decays steadily across 150 iterations, demonstrating stable learning convergence without overfitting."
      },
      spark: {
        title: "Apache Spark MLlib: GBT Loss Convergence",
        file: "spark_loss_convergence_curve.png",
        desc: lang === 'vi'
          ? "Hàm mất mát Log-loss giảm đều qua 30 vòng lặp Boosting phân tán, ROC-AUC hội tụ tiệm cận 0.8340."
          : "Distributed Log-loss decays stably across 30 distributed boosting iterations, ROC-AUC converging near 0.8340."
      }
    },
    {
      id: "pair_cm",
      title: lang === 'vi'
        ? "2. Ma Trận Nhầm Lẫn Trên Tập Test (Confusion Matrix Comparison)"
        : "2. Confusion Matrix Comparison (Test Set)",
      subtitle: lang === 'vi'
        ? "Đối chiếu năng lực bắt bệnh stress sinh thái thực tế trên tập Holdout Test Set"
        : "Evaluating real-world eco-stress diagnostic sensitivity on holdout test set",
      insight: lang === 'vi'
        ? "Tỷ lệ bắt trúng cây stress (Recall/Sensitivity) của 2 mô hình tương đương nhau (~65.8% vs 66.0%), trong khi tỷ lệ dự đoán đúng cây khỏe (Specificity) đạt trên 98.6%. Cả 2 đều loại bỏ triệt để hiện tượng đoán bừa."
        : "Stress detection recall (~65.8% vs 66.0%) and healthy specificity (>98.6%) are practically identical between models. Both eliminate majority-class guessing.",
      traditional: {
        title: lang === 'vi' ? "Thư Viện Thường: LightGBM Confusion Matrix" : "Conventional: LightGBM Confusion Matrix",
        file: "confusion_matrix_test.png",
        desc: lang === 'vi'
          ? "Độ nhạy đạt 65.78% ở ngưỡng T*=0.34, phát hiện chính xác cây stress sinh thái trên 60,000 mẫu kiểm thử."
          : "Sensitivity reaches 65.78% at threshold T*=0.34, accurately diagnosing eco-stressed plants across 60,000 test samples."
      },
      spark: {
        title: "Apache Spark MLlib: GBT Confusion Matrix",
        file: "spark_confusion_matrix.png",
        desc: lang === 'vi'
          ? "Phân loại phân tán trên 6 Partitions, phát hiện 2,740 cây stress (Recall 66.02%) mượt mà, không đè chữ."
          : "Distributed classification across 6 partitions identifies 2,740 stressed plants (Recall 66.02%) cleanly."
      }
    },
    {
      id: "pair_roc",
      title: lang === 'vi'
        ? "3. Đường Cong ROC & Precision-Recall Kép (PR & ROC Curves)"
        : "3. Dual ROC & Precision-Recall Curves (PR & ROC)",
      subtitle: lang === 'vi'
        ? "Đánh giá chất lượng phân loại toàn diện độc lập với ngưỡng quyết định"
        : "Evaluating comprehensive classification quality independent of decision threshold",
      insight: lang === 'vi'
        ? "Spark GBT đạt ROC-AUC 0.8340 và PR-AUC 0.7330, tiệm cận hoàn hảo với LightGBM (ROC-AUC 0.8299, PR-AUC 0.7192). Cả 2 đều vượt xa ngẫu nhiên (0.50) và giữ vững độ phân loại cao."
        : "Spark GBT attains ROC-AUC 0.8340 and PR-AUC 0.7330, showing virtually identical parity with LightGBM (ROC-AUC 0.8299, PR-AUC 0.7192). Both far outperform random baseline (0.50).",
      traditional: {
        title: lang === 'vi' ? "Thư Viện Thường: PR & ROC Curves" : "Conventional: PR & ROC Curves",
        file: "pr_and_roc_curves.png",
        desc: lang === 'vi'
          ? "ROC-AUC đạt 0.830 và PR-AUC đạt 0.719, vượt xa ngẫu nhiên (0.50) và giữ vững độ phân loại cao."
          : "ROC-AUC reaches 0.830 and PR-AUC reaches 0.719, establishing robust discriminative capability."
      },
      spark: {
        title: "Apache Spark MLlib: PR & ROC Curves",
        file: "spark_pr_and_roc_curves.png",
        desc: lang === 'vi'
          ? "Spark GBT đạt ROC-AUC = 0.8340 và PR-AUC = 0.7330, chứng minh tính toàn vẹn toán học phân tán."
          : "Spark GBT reaches ROC-AUC = 0.8340 and PR-AUC = 0.7330, confirming mathematical parity of distributed training."
      }
    },
    {
      id: "pair_feat",
      title: lang === 'vi'
        ? "4. Tầm Quan Trọng Đặc Trưng Nông Học (Feature Importance)"
        : "4. Agronomic Feature Importance",
      subtitle: lang === 'vi'
        ? "Xác định các yếu tố môi trường sinh thái có trọng số quyết định đến sức khỏe cây trồng"
        : "Identifying pivotal ecological factors dictating crop physiological health",
      insight: lang === 'vi'
        ? "Cả hai cách tiếp cận đều thống nhất: Độ chua đất (Soil Acidity Stress), Chỉ số Hạn hán (Drought Risk) và Mức độ tổn thương ô nhiễm là 3 yếu tố quyết định hàng đầu trong mô hình cây."
        : "Both architectures reach full consensus: Soil Acidity Stress, Drought Risk, and Environmental Pollution are the top 3 dominant split factors.",
      traditional: {
        title: lang === 'vi' ? "Thư Viện Thường: 20 Đặc Trưng Sinh Thái" : "Conventional: 20 Ecological Features",
        file: "feature_importance.png",
        desc: lang === 'vi'
          ? "Độ chua đất (pH Stress), Hạn hán (Drought Risk) và Ma sát thủy văn chiếm vị trí đầu bảng trong cây quyết định."
          : "Soil pH Stress, Drought Risk, and Hydrological distance dominate top importance ranks."
      },
      spark: {
        title: "Apache Spark MLlib: Tree Feature Importances",
        file: "spark_feature_importance.png",
        desc: lang === 'vi'
          ? "Trích xuất từ VectorAssembler và GBTClassificationModel trên Apache Spark Pipeline."
          : "Extracted from VectorAssembler and GBTClassificationModel within Apache Spark ML Pipeline."
      }
    },
    {
      id: "pair_bench",
      title: lang === 'vi'
        ? "5. Tổng Hợp So Sánh Đa Mô Hình (Multi-Model Benchmark)"
        : "5. Multi-Model Benchmark Comparison",
      subtitle: lang === 'vi'
        ? "Đối chiếu hiệu năng giữa các giải thuật trong từng môi trường tính toán"
        : "Cross-algorithm performance evaluation across execution environments",
      insight: lang === 'vi'
        ? "Ở cả 2 môi trường, thuật toán Boosting (LightGBM và Spark GBT) đều vượt trội hoàn toàn so với Cây quyết định đơn lẻ (Decision Tree) và Hồi quy Tuyến tính (Logistic Regression)."
        : "Across both runtime environments, boosting ensembles (LightGBM and Spark GBT) decisively outperform standalone Decision Trees and Logistic Regression.",
      traditional: {
        title: lang === 'vi' ? "Thư Viện Thường: Đa Mô Hình Chuẩn Quốc Tế" : "Conventional: Multi-Model Benchmark",
        file: "model_benchmark_comparison.png",
        desc: lang === 'vi'
          ? "Đối chứng toàn diện Dummy vs Logistic Regression vs Decision Tree vs LightGBM trên cả 2 Track."
          : "Comprehensive benchmark comparing Dummy, Logistic Regression, Decision Tree, and LightGBM across both tracks."
      },
      spark: {
        title: lang === 'vi' ? "Apache Spark MLlib: Benchmark 4 Mô Hình" : "Apache Spark MLlib: 4-Model Benchmark",
        file: "spark_model_benchmark.png",
        desc: lang === 'vi'
          ? "Đối sánh trực quan giữa Logistic Regression, Decision Tree, Random Forest và GBT trên Spark."
          : "Visual benchmark comparing Logistic Regression, Decision Tree, Random Forest, and GBT in Spark MLlib."
      }
    },
    {
      id: "pair_time",
      title: lang === 'vi'
        ? "6. Thời Gian Huấn Luyện & Chi Phí Phân Tán (Training Time & Distributed Overhead)"
        : "6. Training Time & Distributed Overhead",
      subtitle: lang === 'vi'
        ? "Minh chứng bản chất Big Data: Đơn luồng C++ nhanh ở dữ liệu nhỏ, Spark mở rộng ở dữ liệu lớn"
        : "Demonstrating Big Data tradeoffs: Single-node C++ excels on small data, Spark scales on big data",
      insight: lang === 'vi'
        ? "Tập 200k dòng (~23.5MB) nằm vừa trong RAM nên thư viện thường train chỉ mất 1.25s. Spark MLlib mất 21.42s do chi phí khởi tạo JVM, Py4J và chia 6 Partitions (Distributed Overhead)."
        : "The 200k dataset (~23.5MB) fits in single-node RAM (trains in 1.25s). Spark MLlib takes 21.42s due to JVM startup, Py4J serialization, and 6-partition coordination (Distributed Overhead).",
      traditional: {
        title: lang === 'vi' ? "Thư Viện Thường: Thời Gian Huấn Luyện Đơn Máy" : "Conventional: Single-Node Training Time",
        file: "training_time_comparison.png",
        desc: lang === 'vi'
          ? "Thời gian huấn luyện trên CPU đơn máy: LightGBM chỉ 1.25s, Decision Tree 0.85s, Logistic Regression 2.10s."
          : "Single-node CPU training time: LightGBM 1.25s, Decision Tree 0.85s, Logistic Regression 2.10s."
      },
      spark: {
        title: lang === 'vi' ? "Apache Spark MLlib: Thời Gian Huấn Luyện Phân Tán" : "Apache Spark MLlib: Distributed Training Time",
        file: "spark_training_time_comparison.png",
        desc: lang === 'vi'
          ? "Đo lường thời gian huấn luyện 4 mô hình Spark trên 6 Partitions (Decision Tree 3.3s, GBT 21.4s)."
          : "Distributed training time for 4 Spark models on 6 partitions (Decision Tree 3.3s, GBT 21.4s)."
      }
    }
  ];

  // Danh mục 6 biểu đồ Thư viện thông thường (LightGBM)
  const traditionalCharts = pairedCharts.map(p => ({
    id: p.id + '_trad',
    title: p.traditional.title,
    file: p.traditional.file,
    desc: p.traditional.desc
  }));

  // Danh mục 6 biểu đồ Apache Spark MLlib
  const sparkCharts = pairedCharts.map(p => ({
    id: p.id + '_spark',
    title: p.spark.title,
    file: p.spark.file,
    desc: p.spark.desc
  }));

  const singleCharts = chartViewMode === 'spark' ? sparkCharts : traditionalCharts;

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
                <span className="badge badge-optimal">{t('academicDefenseBadge')}</span>
                <span className="badge badge-warning">{t('academicRecordsCount')}</span>
              </div>
              <h2 style={{ fontSize: '1.45rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {t('academicTitle')}
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {t('academicSubtitle')}
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
              <span>{t('academicBtnDownloadLgb')}</span>
            </a>
            <a
              href={`${API_BASE_URL}/api/predict/download-artifacts/spark`}
              download="spark_mllib_model_artifacts.zip"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', padding: '10px 16px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <Flame size={16} />
              <span>{t('academicBtnDownloadSpark')}</span>
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
            <span>{t('subTabSparkVsTrad')}</span>
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
            <span>{t('subTabTrack1VsTrack2')}</span>
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
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('academicStatTradLib')}</span>
                <span className="badge badge-optimal">{t('academicStatRealtimeServing')}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                LightGBM SOTA
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-optimal)' }}>1.25s</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('academicStatTrainTime')}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Accuracy: <strong>94.80%</strong> | ROC-AUC: <strong>0.830</strong></div>
                <div>{t('academicTradInferenceNote')}</div>
                <div>{t('academicTradArchNote')}</div>
              </div>
            </div>

            {/* Card 2: Spark MLlib */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #f59e0b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#f59e0b', fontWeight: 600 }}>{t('academicStatSparkTitle')}</span>
                <span className="badge badge-warning">{t('academicStatSparkBadge')}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                Spark GBTClassifier
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>21.42s</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('academicStatTrainTime')}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Accuracy: <strong>94.07%</strong> | ROC-AUC: <strong>0.834</strong></div>
                <div>{t('academicSparkStructNote')}</div>
                <div>{t('academicSparkExecNote')}</div>
              </div>
            </div>

            {/* Card 3: Mathematical Parity */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #38bdf8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: 600 }}>{t('academicStatMathParity')}</span>
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>{t('academicStatMathBadge')}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {t('academicStatMathTitle')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>0.830 ⟷ 0.834</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ROC-AUC</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>{t('academicMathFidelityNote')}</div>
                <div>{t('academicMathBaselineNote')}</div>
                <div>{t('academicMathF1Note')}</div>
              </div>
            </div>

            {/* Card 4: Big Data Overhead */}
            <div className="glass-panel" style={{ padding: '20px', borderTop: '3px solid #a855f7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#a855f7', fontWeight: 600 }}>{t('academicStatOverhead')}</span>
                <span className="badge" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>{t('academicStatOverheadBadge')}</span>
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {t('academicStatOverheadTitle')}
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '8px 0' }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7' }}>200,000</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{t('academicStatRows')}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>{t('academicOverheadRamNote')}</div>
                <div>{t('academicOverheadOomNote')}</div>
                <div>{t('academicOverheadScaleNote')}</div>
              </div>
            </div>
          </div>

          {/* Benchmark Table: Comprehensive Comparison */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {t('academicTableTitle')}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {t('academicTableSubtitle')}
                </p>
              </div>
              <span className="badge badge-optimal">{t('academicTableArchitecturesBadge')}</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px 14px' }}>{t('academicColModel')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColEngine')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColPartitions')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColTrainTime')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColAccuracy')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColPrecision')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColRecall')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColF1')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColRocAuc')}</th>
                    <th style={{ padding: '12px 14px' }}>{t('academicColRole')}</th>
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
                  {t('academicAnalysis1Title')}
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • <strong>{t('academicAnalysis1P1')}</strong><br />
                {t('academicAnalysis1P2')}<br />
                • {t('academicAnalysis1P3')}
              </p>
            </div>

            {/* Analysis 2: When Spark shines */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--color-optimal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Server size={20} color="var(--color-optimal)" />
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {t('academicAnalysis2Title')}
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • <strong>{t('academicAnalysis2P1')}</strong> {t('academicAnalysis2P2')}<br />
                • <strong>{t('academicAnalysis2P3')}</strong> {t('academicAnalysis2P4')}
              </p>
            </div>

            {/* Analysis 3: Industry Standard Lambda Architecture */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid #38bdf8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Layers size={20} color="#38bdf8" />
                <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                  {t('academicAnalysis3Title')}
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                • <strong>{t('academicAnalysis3P1')}</strong> {t('academicAnalysis3P2')}<br />
                • <strong>{t('academicAnalysis3P3')}</strong> {t('academicAnalysis3P4')}
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
                <span className="badge badge-warning">{t('academicTrack1Badge')}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t('academicRecordsCount')}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                {t('academicTrack1Title')}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                • {t('academicTrack1P1')}<br />
                • {t('academicTrack1P2')}
              </p>
            </div>

            {/* Track 2 Card */}
            <div className="glass-panel" style={{ padding: '22px', borderLeft: '4px solid var(--color-optimal)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="badge badge-optimal">{t('academicTrack2Badge')}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-optimal)', fontWeight: 700 }}>{t('academicTrack2DeployBadge')}</span>
              </div>
              <h4 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 8 }}>
                {t('academicTrack2Title')}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                • {t('academicTrack2P1')}<br />
                • {t('academicTrack2P2')}<br />
                • {t('academicTrack2P3')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION: 6x6 SCIENTIFIC VISUALIZATION GALLERY & SIDE-BY-SIDE COMPARISON */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {t('academicGalleryTitle')}
              </h3>
              <span className="badge badge-optimal">{t('academicGalleryBadge')}</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {t('academicGallerySubtitle')}
            </p>
          </div>

          {/* View Mode Selector */}
          <div style={{ display: 'flex', gap: 8, background: 'var(--bg-surface)', padding: 4, borderRadius: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => setChartViewMode('side-by-side')}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: chartViewMode === 'side-by-side' ? 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)' : 'transparent',
                color: chartViewMode === 'side-by-side' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: chartViewMode === 'side-by-side' ? 700 : 500,
                boxShadow: chartViewMode === 'side-by-side' ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
              }}
            >
              <Columns size={15} />
              <span>{t('viewSideBySide')}</span>
            </button>

            <button
              onClick={() => setChartViewMode('spark')}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: chartViewMode === 'spark' ? '#f59e0b' : 'transparent',
                color: chartViewMode === 'spark' ? '#000000' : 'var(--text-secondary)',
                fontWeight: chartViewMode === 'spark' ? 700 : 500
              }}
            >
              <Flame size={15} />
              <span>{t('viewSparkOnly')}</span>
            </button>

            <button
              onClick={() => setChartViewMode('traditional')}
              className="btn"
              style={{
                padding: '8px 14px',
                fontSize: '0.82rem',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: chartViewMode === 'traditional' ? 'var(--color-optimal)' : 'transparent',
                color: chartViewMode === 'traditional' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: chartViewMode === 'traditional' ? 700 : 500
              }}
            >
              <Zap size={15} />
              <span>{t('viewTradOnly')}</span>
            </button>
          </div>
        </div>

        {/* ====================================================================== */}
        {/* VIEW 1: SIDE-BY-SIDE DUAL COMPARISON (2 HÌNH KẾ BÊN NHAU MỖI TIÊU CHÍ)   */}
        {/* ====================================================================== */}
        {chartViewMode === 'side-by-side' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {pairedCharts.map((pair) => {
              const tradUrl = `${API_BASE_URL}/outputs/${pair.traditional.file}`;
              const sparkUrl = `${API_BASE_URL}/outputs/${pair.spark.file}`;

              return (
                <div 
                  key={pair.id}
                  className="glass-panel"
                  style={{
                    padding: '22px',
                    border: '1px solid var(--border-card)',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16
                  }}
                >
                  {/* Pair Header */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--border-card)', paddingBottom: 12 }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Sparkles size={17} color="#10b981" />
                        <span>{pair.title}</span>
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        {pair.subtitle}
                      </p>
                    </div>
                    <span className="badge badge-optimal">{t('academicSideBySideBadge')}</span>
                  </div>

                  {/* 2 Images Placed Side-by-Side in Same Frame */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
                    {/* LEFT: TRADITIONAL ML */}
                    <div style={{
                      background: 'var(--bg-surface)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Sub-header */}
                      <div style={{ 
                        padding: '10px 14px', 
                        background: 'rgba(16, 185, 129, 0.08)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(16, 185, 129, 0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Zap size={15} color="var(--color-optimal)" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-optimal)' }}>
                            {t('academicTradSubhead')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Single-Node C++</span>
                      </div>

                      {/* Image Frame */}
                      <div 
                        style={{
                          position: 'relative',
                          background: '#040706',
                          height: 240,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setZoomedImage({ url: tradUrl, title: pair.traditional.title, desc: pair.traditional.desc })}
                      >
                        <img 
                          src={tradUrl} 
                          alt={pair.traditional.title}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          background: 'rgba(0,0,0,0.65)',
                          borderRadius: '8px',
                          padding: '5px 8px',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.72rem'
                        }}>
                          <Maximize2 size={12} />
                          <span>{t('academicZoom')}</span>
                        </div>
                      </div>

                      {/* Caption & Download */}
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                          {pair.traditional.desc}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>300 DPI • PNG</span>
                          <a
                            href={tradUrl}
                            download={pair.traditional.file}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <Download size={13} />
                            <span>{t('academicDownloadPng')}</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: APACHE SPARK MLLIB */}
                    <div style={{
                      background: 'var(--bg-surface)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                      display: 'flex',
                      flexDirection: 'column'
                    }}>
                      {/* Sub-header */}
                      <div style={{ 
                        padding: '10px 14px', 
                        background: 'rgba(245, 158, 11, 0.08)', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(245, 158, 11, 0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Flame size={15} color="#f59e0b" />
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b' }}>
                            {t('academicSparkSubhead')}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>6 RDD Partitions</span>
                      </div>

                      {/* Image Frame */}
                      <div 
                        style={{
                          position: 'relative',
                          background: '#040706',
                          height: 240,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setZoomedImage({ url: sparkUrl, title: pair.spark.title, desc: pair.spark.desc })}
                      >
                        <img 
                          src={sparkUrl} 
                          alt={pair.spark.title}
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          background: 'rgba(0,0,0,0.65)',
                          borderRadius: '8px',
                          padding: '5px 8px',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: '0.72rem'
                        }}>
                          <Maximize2 size={12} />
                          <span>{t('academicZoom')}</span>
                        </div>
                      </div>

                      {/* Caption & Download */}
                      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '0.79rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
                          {pair.spark.desc}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border-card)' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>300 DPI • PNG</span>
                          <a
                            href={sparkUrl}
                            download={pair.spark.file}
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: 5 }}
                          >
                            <Download size={13} />
                            <span>{t('academicDownloadPng')}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Academic Comparative Insight Box */}
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(16, 185, 129, 0.06)',
                    borderLeft: '4px solid #10b981',
                    borderRadius: '0 8px 8px 0',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10
                  }}>
                    <Info size={17} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{t('academicInsight')} </strong>
                      <span style={{ color: 'var(--text-secondary)' }}>{pair.insight}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ====================================================================== */}
        {/* VIEW 2 & 3: SINGLE GROUP GALLERY (XEM RIÊNG 6 ẢNH SPARK HOẶC THƯỜNG)     */}
        {/* ====================================================================== */}
        {chartViewMode !== 'side-by-side' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {singleCharts.map((chart) => {
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
                        e.target.parentElement.innerHTML = `<div style="padding: 20px; color: var(--text-muted); font-size: 0.8rem; text-align: center;">${t('academicRenderingChart')}</div>`;
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
                      <span>{t('academicZoom')}</span>
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
                        <span>{t('academicDownloadPng')}</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                  <span>{t('academicZoomDownload300')}</span>
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
