import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import ReactMarkdown from 'react-markdown';
import { AuthContext } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';

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
        const res = await axiosClient.get(`/api/reports/students/${id}/weekly`);
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

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-8)', maxWidth: '1000px', margin: '0 auto' }}>
        <Skeleton style={{ height: '40px', width: '200px', marginBottom: 'var(--spacing-5)' }} />
        <Card style={{ padding: 'var(--spacing-10)' }}>
          <Skeleton style={{ height: '50px', width: '50%', margin: '0 auto var(--spacing-10)' }} />
          <div style={{ display: 'flex', gap: 'var(--spacing-10)' }}>
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <Skeleton style={{ height: '100px', width: '100%' }} />
              <Skeleton style={{ height: '300px', width: '100%' }} />
            </div>
            <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              <Skeleton style={{ height: '80px', width: '100%' }} />
              <Skeleton style={{ height: '80px', width: '100%' }} />
              <Skeleton style={{ height: '80px', width: '100%' }} />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div style={{ padding: 'var(--spacing-8)' }}>
        <EmptyState title="Không tải được báo cáo" description="Vui lòng thử lại sau." />
      </div>
    );
  }

  const { student, stats, ai_report } = reportData;

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1000px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      {/* KHÔNG IN CÁC NÚT NÀY */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .report-container { box-shadow: none !important; border: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-5)' }}>
        <Button variant="outline" onClick={() => navigate(`/students/${id}`)}>
          ← Quay lại Hồ sơ
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          🖨️ Xuất PDF / Lưu ảnh
        </Button>
      </div>

      <Card className="report-container" style={{ padding: 'var(--spacing-10)', border: '1px solid var(--color-border)' }}>
        
        {/* HEADER BÁO CÁO */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-10)', paddingBottom: 'var(--spacing-8)', borderBottom: '2px solid var(--color-border)' }}>
          <h1 style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-text)', margin: '0 0 var(--spacing-2) 0' }}>BÁO CÁO HỌC TẬP TUẦN</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-base)', margin: 0 }}>Ngày xuất báo cáo: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-10)' }}>
          
          {/* CỘT TRÁI: THÔNG TIN & NHẬN XÉT AI */}
          <div style={{ flex: '1.5' }}>
            <Card style={{ display: 'flex', gap: 'var(--spacing-5)', alignItems: 'center', marginBottom: 'var(--spacing-8)', backgroundColor: 'var(--color-background)', padding: 'var(--spacing-5)' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👨‍🎓</div>
              <div>
                <h2 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)' }}>{student.full_name}</h2>
                <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  Học sinh Khối {student.grade || '---'} | Mã HS: {student.student_code}
                </div>
              </div>
            </Card>

            <h3 style={{ color: 'var(--color-primary)', fontSize: 'var(--font-size-lg)', borderBottom: '2px solid var(--color-border)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-5)' }}>✨ Gia Sư AI Nhận Xét</h3>
            <div style={{ lineHeight: '1.7', color: 'var(--color-text)', fontSize: '15px', textAlign: 'justify' }}>
              <ReactMarkdown>
                {ai_report}
              </ReactMarkdown>
            </div>
          </div>

          {/* CỘT PHẢI: THỐNG KÊ & BIỂU ĐỒ */}
          <div style={{ flex: '1' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-8)' }}>
              <Card style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: 'var(--spacing-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#166534' }}>Tỉ lệ chuyên cần</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '900', color: '#15803d' }}>{stats.attendance_rate}%</span>
              </Card>
              <Card style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: 'var(--spacing-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary-dark)' }}>Điểm trung bình</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '900', color: 'var(--color-primary)' }}>{stats.avg_score}</span>
              </Card>
              <Card style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: 'var(--spacing-5)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#991b1b' }}>Số bài đã làm</span>
                <span style={{ fontSize: 'var(--font-size-2xl)', fontWeight: '900', color: '#b91c1c' }}>{stats.exams_count}</span>
              </Card>
            </div>

            <h3 style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-4)' }}>🎯 Chuyên đề yếu cần chú ý</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {stats.topics.length === 0 ? (
                <EmptyState title="Chưa có đủ dữ liệu" />
              ) : (
                stats.topics.slice(0, 5).map((t: any, idx: number) => {
                  const rate = Number(t.accuracy_rate);
                  let color = 'var(--color-success)';
                  let variant: 'primary' | 'warning' | 'danger' = 'primary';
                  
                  if (rate < 50) {
                    color = 'var(--color-danger)';
                    variant = 'danger';
                  } else if (rate < 80) {
                    color = 'var(--color-warning)';
                    variant = 'warning';
                  }

                  return (
                    <Card key={idx} style={{ backgroundColor: 'var(--color-background)', padding: 'var(--spacing-3)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-size-sm)', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--color-text)' }}>{t.topic}</strong>
                        <Badge variant={variant}>{rate}%</Badge>
                      </div>
                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--color-border)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color }}></div>
                      </div>
                    </Card>
                  )
                })
              )}
            </div>
          </div>

        </div>

        <div style={{ marginTop: '50px', paddingTop: 'var(--spacing-5)', borderTop: '2px solid var(--color-border)', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
          Báo cáo được tạo tự động bởi Hệ Thống {user ? `${user.title || ''} ${user.full_name}` : 'Gia Sư Minh Quang'} AI • Phục vụ mục đích theo dõi học tập
        </div>
      </Card>
    </div>
  );
};

export default ParentReport;

