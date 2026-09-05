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
import { toast } from 'react-toastify';

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
  recent_scores?: any[];
  topics?: any[];
  ai_evaluation?: any;
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axiosClient.get(`/api/students/${id}/profile360`);
        setData(res.data);
        if (res.data.student?.learning_goals) {
          setLearningGoals(res.data.student?.learning_goals);
        }
        if (res.data.topics && res.data.topics.length > 0) {
          setTopics(res.data.topics);
        }
      } catch (err) {
        console.error('Lỗi tải hồ sơ Profile360:', err);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchTopics = async () => {
      try {
        const res = await axiosClient.get(`/api/analytics/students/${id}/topics`);
        if (Array.isArray(res.data) && res.data.length > 0) {
          setTopics(res.data);
        }
      } catch (err) {
        console.log('Chưa có dữ liệu topics riêng:', err);
      }
    };

    fetchProfile();
    fetchTopics();
  }, [id]);

  if (loading) {
    return (
      <div style={{ padding: 'var(--spacing-10)', maxWidth: '1200px', margin: '0 auto' }}>
        <EmptyState title="Đang tải hồ sơ 360° học sinh..." />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: 'var(--spacing-10)', maxWidth: '1200px', margin: '0 auto' }}>
        <EmptyState 
          title="Không tìm thấy học sinh" 
          description="Học sinh không tồn tại hoặc bạn không có quyền truy cập hồ sơ này." 
          action={<Button onClick={() => navigate('/students')} variant="outline">← Quay lại danh sách</Button>}
        />
      </div>
    );
  }

  const { student: profile, classes = [], attendance, recent_scores = [] } = data;
  const aiEval = data.ai_evaluation || profile.ai_evaluation;

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    try {
      await axiosClient.put(`/api/students/${id}/goals`, { learning_goals: learningGoals });
      toast.success('Đã lưu mục tiêu ngắn hạn!');
    } catch (_err) {
      toast.error('Lỗi khi lưu mục tiêu học sinh');
    } finally {
      setSavingGoals(false);
    }
  };

  const handleGenerateAIEvaluation = async () => {
    setEvaluating(true);
    try {
      const res = await axiosClient.post(`/api/students/${id}/ai-evaluation`);
      const aiResult = res.data?.data || res.data?.ai_evaluation;
      setData(prev => prev ? { 
        ...prev, 
        ai_evaluation: aiResult,
        student: { ...prev.student, ai_evaluation: aiResult } 
      } : null);
      toast.success('Đã tạo phân tích & định hướng AI thành công!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Chức năng Phân tích & Định hướng AI đang lỗi API.';
      toast.error(msg);
    } finally {
      setEvaluating(false);
    }
  };

  // Helper để lấy danh sách từ AI eval (hỗ trợ cả mảng hoặc chuỗi phân cách)
  const parseList = (val: any): string[] => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      return val.split('\n').map(s => s.replace(/^[-*•\d.]+\s*/, '').trim()).filter(Boolean);
    }
    return [];
  };

  const strongPoints = parseList(aiEval?.strong_points || aiEval?.diem_manh);
  const weakPoints = parseList(aiEval?.weak_points || aiEval?.diem_yeu);
  const attentionNote = aiEval?.attention_note || aiEval?.can_chu_y || '';
  const actionPlan = aiEval?.action_plan || aiEval?.ke_hoach || '';
  const analyzedAt = aiEval?.analyzed_at || '';

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* NÚT ĐIỀU HƯỚNG */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <Button onClick={() => navigate('/students')} variant="outline" size="sm">
          ← Quay lại danh sách học sinh
        </Button>
      </div>

      {/* 1. PROFILE HEADER */}
      <Card style={{ overflow: 'hidden', padding: 0, marginBottom: 'var(--spacing-6)' }}>
        <div style={{ 
          height: '110px', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #4338ca 100%)' 
        }} />
        <div style={{ 
          padding: '0 var(--spacing-6) var(--spacing-6) var(--spacing-6)', 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 'var(--spacing-5)', 
          position: 'relative' 
        }}>
          <div style={{ 
            width: '100px', 
            height: '100px', 
            borderRadius: 'var(--radius-full)', 
            backgroundColor: 'var(--color-surface)', 
            marginTop: '-50px', 
            padding: 'var(--spacing-1)', 
            boxShadow: 'var(--shadow-md)',
            flexShrink: 0
          }}>
            <div style={{ 
              width: '100%', 
              height: '100%', 
              borderRadius: 'var(--radius-full)', 
              backgroundColor: 'var(--color-primary-soft, #e0e7ff)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '44px' 
            }}>
              👨‍🎓
            </div>
          </div>
          <div style={{ marginTop: 'var(--spacing-2)', flex: '1 1 300px' }}>
            <h1 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-2xl)', color: 'var(--color-text)', fontWeight: 'var(--font-weight-bold)' }}>
              {profile.full_name}
            </h1>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: 'var(--spacing-4)', 
              color: 'var(--color-text-secondary)', 
              fontSize: 'var(--font-size-sm)',
              lineHeight: '1.5'
            }}>
              <span>Mã HS: <strong style={{ color: 'var(--color-text)' }}>{profile.student_code || `#${profile.id}`}</strong></span>
              <span>Trường: <strong style={{ color: 'var(--color-text)' }}>{profile.school || profile.school_name || '---'}</strong></span>
              <span>Khối: <strong style={{ color: 'var(--color-primary)' }}>{profile.grade || '---'}</strong></span>
              <span>Phụ huynh: <strong style={{ color: 'var(--color-text)' }}>{profile.parent_phone || profile.phone_number || '---'}</strong></span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. STATS GRID: LỚP, CHUYÊN CẦN, VẮNG / MUỘN */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: 'var(--spacing-5)', 
        marginBottom: 'var(--spacing-6)' 
      }}>
        <Card>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
            Lớp đang tham gia
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {classes.length} <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', fontWeight: 'normal' }}>lớp học</span>
          </div>
        </Card>
        
        <Card>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
            Tỷ lệ Chuyên cần
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-2)' }}>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: 'var(--font-weight-bold)', 
              color: attendance.rate >= 90 ? 'var(--color-success)' : attendance.rate >= 70 ? 'var(--color-warning)' : 'var(--color-danger)' 
            }}>
              {attendance.rate}%
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
              ({attendance.present} / {attendance.total} buổi)
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', marginTop: 'var(--spacing-3)', overflow: 'hidden' }}>
            <div style={{ 
              width: `${Math.min(100, Math.max(0, attendance.rate))}%`, 
              height: '100%', 
              backgroundColor: attendance.rate >= 90 ? 'var(--color-success)' : attendance.rate >= 70 ? 'var(--color-warning)' : 'var(--color-danger)',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </Card>

        <Card>
          <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase', marginBottom: 'var(--spacing-2)' }}>
            Nghỉ / Đi muộn
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <div style={{ 
              flex: 1, 
              backgroundColor: '#fee2e2', 
              padding: 'var(--spacing-3)', 
              borderRadius: 'var(--radius-md)', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)' }}>
                {attendance.absent}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#991b1b', fontWeight: 'var(--font-weight-medium)' }}>
                Buổi vắng
              </div>
            </div>
            <div style={{ 
              flex: 1, 
              backgroundColor: '#fef3c7', 
              padding: 'var(--spacing-3)', 
              borderRadius: 'var(--radius-md)', 
              textAlign: 'center' 
            }}>
              <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-warning)' }}>
                {attendance.late}
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: '#92400e', fontWeight: 'var(--font-weight-medium)' }}>
                Đi muộn
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. MỤC TIÊU NGẮN HẠN (COACH MODE) */}
      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-3) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
          🎯 Mục tiêu ngắn hạn (Coach Mode)
        </h2>
        <textarea 
          value={learningGoals}
          onChange={(e) => setLearningGoals(e.target.value)}
          placeholder="Ví dụ: Đạt 8 điểm bài thi Giữa kì Toán 10. (Gợi ý AI: Nhắc nhở tập trung nếu là lớp Offline, tự giác nộp bài nếu là lớp Online)"
          style={{ 
            width: '100%', 
            minHeight: '75px', 
            padding: 'var(--spacing-3)', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-border)', 
            boxSizing: 'border-box', 
            fontFamily: 'inherit', 
            fontSize: 'var(--font-size-sm)', 
            marginBottom: 'var(--spacing-3)', 
            resize: 'vertical',
            color: 'var(--color-text)',
            backgroundColor: 'var(--color-surface)'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={handleSaveGoals} disabled={savingGoals} isLoading={savingGoals} variant="primary" size="sm">
            💾 Lưu Mục tiêu
          </Button>
        </div>
      </Card>

      {/* 4. GRID: LỚP HỌC & TOPIC MASTERY */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: 'var(--spacing-6)',
        marginBottom: 'var(--spacing-6)'
      }}>
        
        {/* DANH SÁCH LỚP HỌC */}
        <Card>
          <h2 style={{ margin: '0 0 var(--spacing-4) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
            📚 Danh sách Lớp Học
          </h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-background)' }}>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Tên Lớp / Môn</th>
                  <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: 'var(--spacing-6)' }}>
                      <EmptyState title="Chưa tham gia lớp nào." />
                    </td>
                  </tr>
                ) : classes.map((c: any, idx: number) => (
                  <tr key={c.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text)' }}>
                      <div style={{ fontWeight: 'var(--font-weight-bold)' }}>{c.name || c.class_name}</div>
                      <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>{c.subject || 'Lớp dạy kèm'}</div>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                      <Badge variant={c.member_status === 'ACTIVE' || c.member_status === 'Đang học' ? 'success' : 'neutral'}>
                        {c.member_status || 'Đang học'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* TOPIC MASTERY */}
        <Card>
          <h2 style={{ margin: '0 0 var(--spacing-4) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
            🎯 Topic Mastery (Chuyên đề)
          </h2>
          {topics.length === 0 ? (
            <div style={{ padding: 'var(--spacing-6)' }}>
              <EmptyState title="Chưa có dữ liệu bài làm chuyên đề." />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
              {topics.map((t: any, idx: number) => {
                const rate = Number(t.accuracy_rate || 0);
                let color = 'var(--color-success)';
                let icon = '✅';
                if (rate < 50) {
                  color = 'var(--color-danger)';
                  icon = '⚠️';
                } else if (rate < 80) {
                  color = 'var(--color-warning)';
                  icon = '⚡';
                }

                return (
                  <div key={t.id || idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-1)', fontSize: 'var(--font-size-sm)' }}>
                      <span style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
                        {icon} {t.topic}
                      </span>
                      <span style={{ fontWeight: 'var(--font-weight-bold)', color }}>
                        {rate}% ({t.correct_count ?? t.correct_answers ?? 0}/{t.attempt_count ?? t.total_questions ?? 0})
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color, borderRadius: 'var(--radius-full)', transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* 5. RECENT EXAM SCORES */}
      <Card style={{ marginBottom: 'var(--spacing-6)' }}>
        <h2 style={{ margin: '0 0 var(--spacing-4) 0', fontSize: 'var(--font-size-lg)', color: 'var(--color-text)' }}>
          📊 Điểm thi gần đây
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--color-background)' }}>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Tên Bài Thi</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Điểm số</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)' }}>Thời gian làm</th>
                <th style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>Ngày nộp</th>
              </tr>
            </thead>
            <tbody>
              {recent_scores.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: 'var(--spacing-6)' }}>
                    <EmptyState title="Chưa có lịch sử làm bài thi nào hoàn thành." />
                  </td>
                </tr>
              ) : recent_scores.map((sc: any, idx: number) => (
                <tr key={sc.id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
                    {sc.exam_title || `Bài thi #${sc.document_id || idx + 1}`}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)' }}>
                    <Badge variant={sc.total_score >= 8 ? 'success' : sc.total_score >= 5 ? 'warning' : 'danger'}>
                      {sc.total_score}/10
                    </Badge>
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                    {sc.time_taken_seconds ? `${Math.floor(sc.time_taken_seconds / 60)}p ${sc.time_taken_seconds % 60}s` : '---'}
                  </td>
                  <td style={{ padding: 'var(--spacing-3)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', textAlign: 'right' }}>
                    {sc.submitted_at ? new Date(sc.submitted_at).toLocaleDateString('vi-VN') : '---'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 6. PHÂN TÍCH AI CÁ NHÂN */}
      <Card style={{ 
        border: '1px solid var(--color-primary)', 
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--spacing-6)' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 'var(--spacing-4)',
          marginBottom: 'var(--spacing-5)',
          paddingBottom: 'var(--spacing-4)',
          borderBottom: '1px solid var(--color-border)'
        }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-xl)' }}>
              ✨ Phân tích AI cá nhân
            </h2>
            <p style={{ margin: 'var(--spacing-1) 0 0 0', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>
              Tổng hợp điểm mạnh, điểm yếu và kế hoạch bứt phá từ kết quả điểm danh và làm bài của học sinh.
            </p>
          </div>
          <Button 
            onClick={handleGenerateAIEvaluation} 
            disabled={evaluating} 
            isLoading={evaluating}
            variant={aiEval ? 'outline' : 'primary'}
          >
            {evaluating ? 'Đang phân tích...' : aiEval ? '🔄 Phân tích lại' : '✨ Phân tích & Định hướng AI'}
          </Button>
        </div>

        {aiEval ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-5)' }}>
            {analyzedAt && (
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                <span>📅 Ngày phân tích: <strong>{analyzedAt}</strong></span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-4)' }}>
              {/* ĐIỂM MẠNH */}
              <div style={{ 
                backgroundColor: 'var(--color-success-soft, #f0fdf4)', 
                border: '1px solid #bbf7d0', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-4)' 
              }}>
                <h4 style={{ margin: '0 0 var(--spacing-2) 0', color: '#166534', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  💪 Điểm mạnh
                </h4>
                {strongPoints.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', color: '#14532d', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                    {strongPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#166534', fontSize: 'var(--font-size-sm)' }}>Chưa có ghi nhận điểm mạnh cụ thể.</p>
                )}
              </div>

              {/* ĐIỂM YẾU */}
              <div style={{ 
                backgroundColor: 'var(--color-warning-soft, #fffbeb)', 
                border: '1px solid #fef08a', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-4)' 
              }}>
                <h4 style={{ margin: '0 0 var(--spacing-2) 0', color: '#854d0e', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  ⚠️ Điểm cần cải thiện
                </h4>
                {weakPoints.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 'var(--spacing-5)', color: '#713f12', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                    {weakPoints.map((pt, i) => <li key={i}>{pt}</li>)}
                  </ul>
                ) : (
                  <p style={{ margin: 0, color: '#854d0e', fontSize: 'var(--font-size-sm)' }}>Chưa có ghi nhận điểm yếu cụ thể.</p>
                )}
              </div>
            </div>

            {/* ĐIỀU CẦN CHÚ Ý */}
            {attentionNote && (
              <div style={{ 
                backgroundColor: 'var(--color-info-soft, #eff6ff)', 
                border: '1px solid #bfdbfe', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-4)' 
              }}>
                <h4 style={{ margin: '0 0 var(--spacing-2) 0', color: '#1e40af', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  🔍 Điều cần chú ý
                </h4>
                <div style={{ color: '#1e3a8a', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {attentionNote}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {/* KẾ HOẠCH HÀNH ĐỘNG */}
            {actionPlan && (
              <div style={{ 
                backgroundColor: 'var(--color-background)', 
                border: '1px solid var(--color-border)', 
                borderRadius: 'var(--radius-md)', 
                padding: 'var(--spacing-4)' 
              }}>
                <h4 style={{ margin: '0 0 var(--spacing-2) 0', color: 'var(--color-primary)', fontSize: 'var(--font-size-base)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                  🚀 Kế hoạch hành động
                </h4>
                <div style={{ color: 'var(--color-text)', fontSize: 'var(--font-size-sm)', lineHeight: '1.6' }}>
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {actionPlan}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 'var(--spacing-6)', textAlign: 'center' }}>
            <EmptyState 
              title="Chưa có phân tích AI cá nhân" 
              description="Bấm vào nút 'Phân tích & Định hướng AI' bên trên để hệ thống đánh giá tự động dựa trên dữ liệu chuyên cần và bài thi của học sinh."
            />
          </div>
        )}
      </Card>

    </div>
  );
};

export default StudentProfile360;
