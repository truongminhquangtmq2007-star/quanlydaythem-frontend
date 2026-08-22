import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';

const ParentReport = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/reports/students/${id}/weekly`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setReportData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tạo báo cáo bằng AI...</div>;
  if (!reportData) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Không tải được báo cáo.</div>;

  const { student, stats, ai_report } = reportData;

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* KHÔNG IN CÁC NÚT NÀY */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => navigate(`/students/${id}`)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          ← Quay lại Hồ sơ
        </button>
        <button onClick={handlePrint} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59,130,246,0.3)' }}>
          🖨️ Xuất PDF / Lưu ảnh
        </button>
      </div>

      <div className="report-container" style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
        
        {/* HEADER BÁO CÁO */}
        <div style={{ textAlign: 'center', marginBottom: '40px', paddingBottom: '30px', borderBottom: '2px solid #e2e8f0' }}>
          <h1 style={{ fontSize: '32px', color: '#0f172a', margin: '0 0 10px 0' }}>BÁO CÁO HỌC TẬP TUẦN</h1>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div style={{ display: 'flex', gap: '40px' }}>
          
          {/* CỘT TRÁI: THÔNG TIN & NHẬN XÉT AI */}
          <div style={{ flex: '1.5' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '30px', backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👨‍🎓</div>
              <div>
                <h2 style={{ margin: '0 0 5px 0', fontSize: '24px', color: '#1e293b' }}>{student.full_name}</h2>
                <div style={{ color: '#475569', fontSize: '15px' }}>
                  Học sinh Khối {student.grade || '---'} | Mã HS: {student.student_code}
                </div>
              </div>
            </div>

            <h3 style={{ color: '#3b82f6', fontSize: '18px', borderBottom: '2px solid #bfdbfe', paddingBottom: '10px', marginBottom: '20px' }}>✨ Gia Sư AI Nhận Xét</h3>
            <div style={{ lineHeight: '1.7', color: '#1e293b', fontSize: '15px', textAlign: 'justify' }}>
              <ReactMarkdown>
                {ai_report}
              </ReactMarkdown>
            </div>
          </div>

          {/* CỘT PHẢI: THỐNG KÊ & BIỂU ĐỒ */}
          <div style={{ flex: '1' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#166534' }}>Tỉ lệ chuyên cần</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#15803d' }}>{stats.attendance_rate}%</span>
              </div>
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#1e40af' }}>Điểm trung bình</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#1d4ed8' }}>{stats.avg_score}</span>
              </div>
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#991b1b' }}>Số bài đã làm</span>
                <span style={{ fontSize: '24px', fontWeight: '900', color: '#b91c1c' }}>{stats.exams_count}</span>
              </div>
            </div>

            <h3 style={{ color: '#0f172a', fontSize: '16px', marginBottom: '15px' }}>🎯 Chuyên đề yếu cần chú ý</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {stats.topics.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>Chưa có đủ dữ liệu.</div>
              ) : (
                stats.topics.slice(0, 5).map((t: any, idx: number) => {
                  const rate = Number(t.accuracy_rate);
                  let color = '#10b981';
                  if (rate < 50) color = '#ef4444';
                  else if (rate < 80) color = '#f59e0b';

                  return (
                    <div key={idx} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                        <strong style={{ color: '#334155' }}>{t.topic}</strong>
                        <strong style={{ color }}>{rate}%</strong>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color }}></div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

        </div>

        <div style={{ marginTop: '50px', paddingTop: '20px', borderTop: '2px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
          Báo cáo được tạo tự động bởi Hệ Thống {user ? `${user.title || ''} ${user.full_name}` : 'Gia Sư Minh Quang'} AI • Phục vụ mục đích theo dõi học tập
        </div>
      </div>
    </div>
  );
};

export default ParentReport;

