import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  HelpCircle, 
  TrendingUp, 
  Sliders, 
  Sparkles, 
  Download 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AcademicHub() {
  const { t } = useLanguage();

  const benchmarkData = [
    {
      model: "Baseline 1: Dummy (Majority Class)",
      track: "Track 1: Nhãn gốc",
      threshold: "0.50",
      accuracy: "96.91%",
      precision: "0.00%",
      recall: "0.00%",
      f1: "0.000",
      rocAuc: "0.500",
      note: "Nghịch lý 97% Accuracy: Đoán bừa toàn bộ là Khỏe"
    },
    {
      model: "Baseline 2: Logistic Regression",
      track: "Track 1: Nhãn gốc",
      threshold: "0.50",
      accuracy: "55.65%",
      precision: "3.05%",
      recall: "43.41%",
      f1: "0.057",
      rocAuc: "0.501",
      note: "Hội tụ về sàn ngẫu nhiên do Zero Signal"
    },
    {
      model: "Baseline 3: Decision Tree (Max Depth=6)",
      track: "Track 1: Nhãn gốc",
      threshold: "0.50",
      accuracy: "90.86%",
      precision: "3.05%",
      recall: "6.37%",
      f1: "0.041",
      rocAuc: "0.501",
      note: "Cây quyết định không trích xuất được quy luật"
    },
    {
      model: "Đề Xuất: LightGBM Classifier (Mô hình chính)",
      track: "Track 2: Eco-Stress (Chuẩn)",
      threshold: "T* = 0.34",
      accuracy: "94.80%",
      precision: "95.05%",
      recall: "65.78%",
      f1: "0.778",
      rocAuc: "0.830",
      isBest: true,
      note: "SOTA: Tối ưu ngưỡng T*=0.34, F1 nhảy vọt lên 0.78"
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Hero Banner */}
      <div className="glass-panel" style={{ padding: '26px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
          }}>
            <Award size={22} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--text-primary)' }}>
              Báo Cáo Đối Chứng Học Thuật — Chiến Lược Đánh Giá Kép (Dual-Track)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Phục vụ Báo cáo Khoa học & Trả lời Phản biện của Giảng viên môn Big Data
            </p>
          </div>
        </div>
      </div>

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

      {/* Benchmark Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: 14 }}>
          Bảng So Sánh Hiệu Năng Đa Thuật Toán (Model Benchmark Comparison)
        </h3>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-card)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '12px 14px' }}>Kiến Trúc Mô Hình</th>
                <th style={{ padding: '12px 14px' }}>Mục Tiêu Đánh Giá</th>
                <th style={{ padding: '12px 14px' }}>Ngưỡng T*</th>
                <th style={{ padding: '12px 14px' }}>Accuracy</th>
                <th style={{ padding: '12px 14px' }}>Precision</th>
                <th style={{ padding: '12px 14px' }}>Recall</th>
                <th style={{ padding: '12px 14px' }}>F1-Score</th>
                <th style={{ padding: '12px 14px' }}>ROC-AUC</th>
              </tr>
            </thead>
            <tbody>
              {benchmarkData.map((b, idx) => (
                <tr 
                  key={idx}
                  style={{
                    borderBottom: '1px solid var(--border-card)',
                    background: b.isBest ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                    fontWeight: b.isBest ? 600 : 400
                  }}
                >
                  <td style={{ padding: '12px 14px', color: b.isBest ? 'var(--color-optimal)' : 'var(--text-primary)' }}>
                    {b.model}
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                    {b.track}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>
                    {b.threshold}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{b.accuracy}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{b.precision}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)' }}>{b.recall}</td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: b.isBest ? 800 : 400, color: b.isBest ? '#34d399' : 'inherit' }}>
                    {b.f1}
                  </td>
                  <td style={{ padding: '12px 14px', fontFamily: 'var(--font-mono)', fontWeight: b.isBest ? 800 : 400, color: b.isBest ? '#34d399' : 'inherit' }}>
                    {b.rocAuc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
