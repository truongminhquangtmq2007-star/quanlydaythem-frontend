import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useParams, useNavigate } from 'react-router-dom';
import type { Student } from '../types/core';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';

interface Profile360 {
  student: Student;
  classes: any[];
  attendance: {
    total: number;
    present: number;
    late: number;
    absent: number;
    rate: number;
  };
}

const StudentProfile360 = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<Profile360 | null>(null);
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [evaluating, setEvaluating] = useState(false);

  const [learningGoals, setLearningGoals] = useState('');
  const [savingGoals, setSavingGoals] = useState(false);
  const [aiRemark, setAiRemark] = useState<{ text: string, loading: boolean }>({ text: '', loading: false });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosClient.get(`/api/students/${id}/profile360`);
        setData(res.data);
        if (res.data.student?.learning_goals) {
          setLearningGoals(res.data.student?.learning_goals);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchTopics = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axiosClient.get(`/api/analytics/students/${id}/topics`);
        setTopics(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchProfile();
    fetchTopics();
  }, [id]);

  if (loading) return <div style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Đang tải hồ sơ..." /></div>;
  if (!data) return <div style={{ padding: 'var(--spacing-10)' }}><EmptyState title="Không tìm thấy học sinh." /></div>;

  const { student: profile, classes, attendance } = data;

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      const token = localStorage.getItem('token');
      await axiosClient.put(`/api/students/${id}/goals`, { learning_goals: learningGoals });
      alert('Đã lưu mục tiêu ngắn hạn!');
    } catch (err) {
      alert('Lỗi khi lưu mục tiêu');
    } finally {
      setSavingGoals(false);
    }
  };

  const handleGenerateAIEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await axiosClient.post(`/api/students/${id}/ai-evaluation`);
      setData(prev => prev ? { ...prev, student: { ...prev.student, ai_evaluation: res.data.data } } : null);
      alert('Đã tạo phân tích AI thành công!');
    } catch (err) {
      alert('Chức năng Phân tích & Định hướng AI đang lỗi API.');
    } finally {
      setEvaluating(false);
    }
  };

  const handleGenerateRemark = async () => {
    setAiRemark({ text: '', loading: true });
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.post(`/api/ai/generate-remark`, { student_id: id });
      setAiRemark({ text: res.data.remark, loading: false });
    } catch (err) {
      alert('Lỗi tạo nhận xét AI');
      setAiRemark({ text: 'Lỗi', loading: false });
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-8)', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-5)' }}>
        <Button onClick={() => navigate('/students')} variant="outline">
          ← Quay lại danh sách
        </Button>
      </div>

      {/* HEADER PROFILE */}
      <Card style={{ overflow: 'hidden', padding: 0, marginBottom: 'var(--spacing-8)' }}>
        <div style={{ height: '120px', backgroundColor: 'var(--color-primary)', background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) 100%)' }}></div>
        <div style={{ padding: '0 30px 30px 30px', display: 'flex', gap: '25px', position: 'relative' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'var(--color-surface)', marginTop: '-60px', padding: 'var(--spacing-1)', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              👨‍🎓
            </div>
          </div>
          <div style={{ marginTop: 'var(--spacing-4)', flex: 1 }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: 'var(--color-text)' }}>{profile.full_name}</h1>
            <div style={{ display: 'flex', gap: '25px', color: 'var(--color-text-secondary)', fontSize: '15px' }}>
              <span>Mã HS: <strong style={{ color: '#334155' }}>{profile.student_code || profile.id}</strong></span>
              <span>Trường: <strong style={{ color: '#334155' }}>{profile.school || '---'}</strong></span>
              <span>Khối: <strong style={{ color: 'var(--color-primary)' }}>{profile.grade || '---'}</strong></span>
              <span>Phụ huynh: <strong style={{ color: '#334155' }}>{profile.parent_phone || '---'}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      
      {/* AI EVALUATION SECTION */}
      {data.student.ai_evaluation && Object.keys(data.student.ai_evaluation).length > 0 && (
        <Card style={{ border: '1px solid #8b5cf6', boxShadow: '0 4px 15px rgba(139,92,246,0.1)', marginBottom: 'var(--spacing-8)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>✨ Phân tích & Định hướng AI</h3>
          <div style={{ color: '#334155', lineHeight: '1.6', fontSize: '15px' }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {typeof data.student.ai_evaluation === 'string' ? data.student.ai_evaluation : JSON.stringify(data.student.ai_evaluation)}
            </ReactMarkdown>
          </div>
        </Card>
      )}
  
      {/* QUICK STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-8)' }}>
        <Card>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>Lớp đang tham gia</div>
          <div style={{ fontSize: '36px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>{classes.length} <span style={{fontSize:'var(--font-size-base)', color:'var(--color-text-secondary)', fontWeight:'normal'}}>lớp</span></div>
        </Card>
        
        <Card>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>Tỷ lệ Chuyên cần</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--spacing-2)' }}>
            <div style={{ fontSize: '36px', fontWeight: 'var(--font-weight-bold)', color: attendance.rate >= 90 ? 'var(--color-success)' : attendance.rate >= 70 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
              {attendance.rate}%
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: '6px' }}>({attendance.present} / {attendance.total} buổi)</div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-sm)', marginTop: 'var(--spacing-4)', overflow: 'hidden' }}>
            <div style={{ width: `${attendance.rate}%`, height: '100%', backgroundColor: attendance.rate >= 90 ? 'var(--color-success)' : attendance.rate >= 70 ? 'var(--color-warning)' : 'var(--color-danger)' }}></div>
          </div>
        </Card>

        <Card>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>Nghỉ / Đi muộn</div>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>{attendance.absent}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#991b1b' }}>Buổi vắng</div>
            </div>
            <div style={{ flex: 1, backgroundColor: 'var(--color-surface)beb', padding: 'var(--spacing-2)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning)' }}>{attendance.late}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#b45309' }}>Đi muộn</div>
            </div>
          </div>
        </Card>
      </div>

      {/* MỤC TIÊU NGẮN HẠN (LEARNING GOALS) */}
      <Card style={{ marginBottom: 'var(--spacing-8)' }}>
        <h2 style={{ margin: '0 0 15px 0', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          🎯 Mục tiêu ngắn hạn (Coach Mode)
        </h2>
        <textarea 
          value={learningGoals}
          onChange={(e) => setLearningGoals(e.target.value)}
          placeholder="Ví dụ: Đạt 8 điểm bài thi Giữa kì Toán 10. (Gợi ý AI: Nhắc nhở tập trung nếu là lớp Offline, tự giác nộp bài nếu là lớp Online)"
          style={{ width: '100%', height: '80px', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-4)', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSaveGoals} disabled={savingGoals} variant="primary">
            {savingGoals ? 'Đang lưu...' : '💾 Lưu Mục tiêu'}
          </Button>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-8)' }}>
        {/* TABS LỚP HỌC */}
        <Card>
          <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>📚 Danh sách Lớp Học</h2>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Tên Lớp / Môn</th>
                  <th style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', borderBottom: '2px solid var(--color-border)' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr><td colSpan={2} style={{ padding: 'var(--spacing-8)' }}><EmptyState title="Chưa tham gia lớp nào." /></td></tr>
                ) : classes.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--color-background)' }}>
                    <td style={{ padding: 'var(--spacing-4)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
                      {c.name || c.class_name} <br/>
                      <span style={{ fontWeight: 'normal', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{c.subject || 'Chưa cập nhật môn'}</span>
                    </td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <Badge variant={c.member_status === 'ACTIVE' ? 'primary' : 'neutral'}>
                        {c.member_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* ANALYTICS: PHÂN TÍCH CHUYÊN ĐỀ */}
        <Card>
          <h2 style={{ margin: '0 0 20px 0', color: 'var(--color-text)' }}>🎯 Phân Tích Chuyên Đề (Topic Mastery)</h2>
          {topics.length === 0 ? (
            <div style={{ padding: 'var(--spacing-8)' }}><EmptyState title="Chưa có dữ liệu bài làm." /></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)', marginBottom: 'var(--spacing-8)' }}>
              {topics.map(t => {
                const rate = Number(t.accuracy_rate);
                let color = 'var(--color-success)'; // Green
                let icon = '✅';
                if (rate < 50) {
                  color = 'var(--color-danger)'; // Red
                  icon = '⚠️';
                } else if (rate < 80) {
                  color = 'var(--color-warning)'; // Yellow
                  icon = '⚡';
                }

                return (
                  <div key={t.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-2)' }}>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', color: '#334155' }}>{icon} {t.topic}</span>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', color }}>{rate}% ({t.correct_count}/{t.attempt_count})</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color, borderRadius: 'var(--radius-sm)', transition: 'width 0.5s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: 'var(--spacing-5)', paddingTop: 'var(--spacing-5)', borderTop: '2px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
              <h3 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>✨ Nhận xét AI (Coach)</h3>
            </div>
            
            {aiRemark.text && (
              <div style={{ backgroundColor: 'var(--color-background)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6', border: '1px solid var(--color-border)' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{aiRemark.text}</ReactMarkdown>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default StudentProfile360;
