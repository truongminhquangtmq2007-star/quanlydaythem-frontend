import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

const StudentDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosClient.get('/api/student/dashboard');
        setData(res.data);
        if (res.data.profile?.email) {
          setEmailInput(res.data.profile.email);
        }
      } catch (err) {
        console.error(err);
        toast.error('Lỗi tải dữ liệu bảng điều khiển');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axiosClient.put('/api/student/email', { email: emailInput });
      toast.success('Cập nhật email thành công!');
      setShowEmailModal(false);
      const res = await axiosClient.get('/api/student/dashboard');
      setData(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật email');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton height="100px" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-4)' }}>
          <Skeleton height="120px" />
          <Skeleton height="120px" />
          <Skeleton height="120px" />
        </div>
        <Skeleton height="300px" />
      </div>
    );
  }

  if (!data) return <EmptyState title="Lỗi dữ liệu" description="Không thể tải dữ liệu." />;

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER HERO */}
      <Card style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 'var(--spacing-6)', 
        padding: 'var(--spacing-6)',
        backgroundColor: 'var(--color-primary-soft)',
        border: 'none'
      }}>
        <div style={{ 
          width: '80px', height: '80px', 
          borderRadius: '50%', 
          backgroundColor: 'var(--color-surface)', 
          color: 'var(--color-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '40px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          👋
        </div>
        <div>
          <h1 style={{ margin: 0, color: 'var(--color-primary)' }}>Xin chào, {data.profile.full_name}!</h1>
          <p className="text-secondary" style={{ margin: 'var(--spacing-1) 0' }}>Trường {data.profile.school}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
            <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
              Email: {data.profile.email || 'Chưa cập nhật'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowEmailModal(true)}>Sửa</Button>
          </div>
        </div>
      </Card>

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-info)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Tỷ lệ chuyên cần</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {data.stats.attendanceRate}%
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-success)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Điểm trung bình (30 ngày)</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {data.stats.avgScore}
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-warning)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Bài đã làm</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {data.stats.examsCount}
          </div>
        </Card>
      </div>

      {/* AI EVALUATION SECTION */}
      <div>
        <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <span>🤖</span> Đánh giá & Định hướng
        </h2>
        {!data.profile.ai_evaluation || Object.keys(data.profile.ai_evaluation).length === 0 ? (
          <EmptyState 
            title="Chưa có đánh giá" 
            description="Giáo viên chưa có đánh giá định kỳ cho bạn. Hãy hoàn thành các bài kiểm tra để hệ thống phân tích!" 
            icon="📊" 
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-4)' }}>
            <Card style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--color-success-soft)', border: 'none' }}>
              <h3 style={{ color: 'var(--color-success)', fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-3)' }}>💪 Điểm mạnh</h3>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>
                {Array.isArray(data.profile.ai_evaluation.strong_points) ? data.profile.ai_evaluation.strong_points.map((p: string, i: number) => <li key={i} style={{ marginBottom: 'var(--spacing-1)' }}>{p}</li>) : <li>{data.profile.ai_evaluation.strong_points || 'Không có dữ liệu'}</li>}
              </ul>
            </Card>
            <Card style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--color-danger-soft)', border: 'none' }}>
              <h3 style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-3)' }}>🎯 Cần cải thiện</h3>
              <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>
                {Array.isArray(data.profile.ai_evaluation.weak_points) ? data.profile.ai_evaluation.weak_points.map((p: string, i: number) => <li key={i} style={{ marginBottom: 'var(--spacing-1)' }}>{p}</li>) : <li>{data.profile.ai_evaluation.weak_points || 'Không có dữ liệu'}</li>}
              </ul>
            </Card>
            <Card style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--color-warning-soft)', border: 'none' }}>
              <h3 style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-3)' }}>💡 Lưu ý</h3>
              <p style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>{data.profile.ai_evaluation.attention_note || 'Không có'}</p>
            </Card>
            <Card style={{ padding: 'var(--spacing-5)', backgroundColor: 'var(--color-info-soft)', border: 'none' }}>
              <h3 style={{ color: 'var(--color-info)', fontSize: 'var(--font-size-base)', marginBottom: 'var(--spacing-3)' }}>🚀 Hành động</h3>
              <p style={{ margin: 0, color: 'var(--color-text)', fontSize: 'var(--font-size-sm)' }}>{data.profile.ai_evaluation.action_plan || 'Không có'}</p>
            </Card>
          </div>
        )}
      </div>

      {/* WEAK TOPICS */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          <span>📈</span> Tiến độ chuyên đề
        </h2>
        <div className="flex flex-col gap-4">
          {data.weakTopics.length === 0 ? (
            <p className="text-muted">Chưa có dữ liệu bài làm để phân tích.</p>
          ) : (
            data.weakTopics.map((t: any, idx: number) => {
              const rate = Number(t.accuracy_rate);
              let barColor = 'var(--color-success)';
              if (rate < 50) barColor = 'var(--color-danger)';
              else if (rate < 80) barColor = 'var(--color-warning)';

              return (
                <div key={idx}>
                  <div className="flex justify-between items-center mb-2">
                    <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{t.topic}</span>
                    <span style={{ fontWeight: 'var(--font-weight-bold)', color: barColor }}>{rate}%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${rate}%`, height: '100%', backgroundColor: barColor, borderRadius: 'var(--radius-full)', transition: 'width 1s ease-out' }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Modal isOpen={showEmailModal} onClose={() => setShowEmailModal(false)} title="Cập nhật Email">
        <form onSubmit={handleUpdateEmail} className="flex flex-col gap-4">
          <Input 
            label="Địa chỉ Email" 
            type="email" 
            value={emailInput} 
            onChange={(e) => setEmailInput(e.target.value)} 
            required 
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => setShowEmailModal(false)}>Hủy</Button>
            <Button type="submit" isLoading={updating}>Lưu thay đổi</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
};

export default StudentDashboard;
