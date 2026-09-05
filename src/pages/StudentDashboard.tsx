import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface TopicItem {
  topic: string;
  total_questions: number;
  correct_answers: number;
  accuracy_rate: number;
}

interface ScoreItem {
  id: number;
  total_score: number;
  submitted_at: string;
  document_id?: number;
}

interface AiInsight {
  summary?: string;
  strengths?: string[];
  focus_areas?: string[];
  action_plan?: string[];
  confidence_score?: number;
  generated_at?: string;
}

const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [generatingInsight, setGeneratingInsight] = useState(false);

  const fetchData = async () => {
    try {
      const res = await axiosClient.get('/api/student/dashboard');
      setData(res.data);
      if (res.data?.profile?.email) {
        setEmailInput(res.data.profile.email);
      }
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu bảng điều khiển');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await axiosClient.put('/api/student/email', { email: emailInput });
      toast.success('Cập nhật email thành công!');
      setShowEmailModal(false);
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật email');
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateInsight = async () => {
    setGeneratingInsight(true);
    try {
      const res = await axiosClient.post('/api/ai/insight/generate', {});
      if (res.data?.data?.insight) {
        setData((prev: any) => ({
          ...prev,
          aiInsight: {
            ...res.data.data.insight,
            generated_at: res.data.data.generated_at
          }
        }));
        toast.success('Đã cập nhật bản phân tích cố vấn học tập AI!');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể tạo phân tích lúc này. Vui lòng thử lại sau.';
      toast.warning(msg);
    } finally {
      setGeneratingInsight(false);
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
          <Skeleton height="120px" />
        </div>
        <Skeleton height="300px" />
      </div>
    );
  }

  if (!data) return <EmptyState title="Lỗi dữ liệu" description="Không thể tải dữ liệu bảng điều khiển." />;

  const recentScores: ScoreItem[] = (data.stats?.recentScores || []).slice().reverse(); // Sắp xếp theo thứ tự thời gian tăng dần
  const weakTopics: TopicItem[] = data.weakTopics || [];
  const strongTopics: TopicItem[] = data.strongTopics || [];
  const allTopics: TopicItem[] = data.allTopics || [];
  const aiInsight: AiInsight | null = data.aiInsight || null;

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
          <h1 style={{ margin: 0, color: 'var(--color-primary)' }}>Xin chào, {data.profile?.full_name}!</h1>
          <p className="text-secondary" style={{ margin: 'var(--spacing-1) 0' }}>Trường {data.profile?.school || 'Chưa cập nhật'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', marginTop: 'var(--spacing-2)' }}>
            <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
              Email: {data.profile?.email || 'Chưa cập nhật'}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setShowEmailModal(true)}>Sửa</Button>
          </div>
        </div>
      </Card>

      {/* STATS OVERVIEW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-4)' }}>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-info)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Tỷ lệ chuyên cần (30 ngày)</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {data.stats?.attendanceRate}%
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-success)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Điểm trung bình</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {data.stats?.avgScore}
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-warning)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Bài thi hoàn thành</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {data.stats?.examsCount}
          </div>
        </Card>
        <Card style={{ padding: 'var(--spacing-5)', borderLeft: '4px solid var(--color-primary)' }}>
          <h3 className="text-secondary" style={{ fontSize: 'var(--font-size-sm)', margin: '0 0 var(--spacing-2) 0' }}>Chuyên đề đã tích lũy</h3>
          <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)' }}>
            {allTopics.length}
          </div>
        </Card>
      </div>

      {/* SCORE PROGRESS TREND CHART */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-xl)' }}>
            <span>📊</span> Tiến độ điểm bài thi gần nhất
          </h2>
          <span className="text-secondary" style={{ fontSize: 'var(--font-size-sm)' }}>
            Chỉ tính bài đã nộp hoàn thành
          </span>
        </div>

        {recentScores.length === 0 ? (
          <p className="text-muted" style={{ margin: 0, padding: 'var(--spacing-4) 0' }}>
            Chưa có bài thi nào được hoàn thành để vẽ biểu đồ tiến độ.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: 'var(--spacing-3)', 
              height: '180px', 
              padding: 'var(--spacing-4) 0',
              borderBottom: '2px solid var(--color-border)'
            }}>
              {recentScores.map((sc, idx) => {
                const score = Number(sc.total_score);
                const heightPercent = Math.max(10, Math.min(100, (score / 10) * 100));
                let barBg = 'var(--color-primary)';
                if (score >= 8) barBg = 'var(--color-success)';
                else if (score < 5) barBg = 'var(--color-danger)';
                else if (score < 7) barBg = 'var(--color-warning)';

                const dateText = sc.submitted_at ? new Date(sc.submitted_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) : `#${idx + 1}`;

                return (
                  <div 
                    key={sc.id || idx}
                    style={{ 
                      flex: 1, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      height: '100%', 
                      justifyContent: 'flex-end' 
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', color: barBg }}>
                      {score.toFixed(1)}
                    </span>
                    <div 
                      style={{ 
                        width: '70%', 
                        maxWidth: '40px',
                        height: `${heightPercent}%`, 
                        backgroundColor: barBg, 
                        borderRadius: '6px 6px 0 0',
                        transition: 'height 0.5s ease-in-out'
                      }} 
                      title={`Bài ngày ${dateText}: ${score}/10`}
                    />
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px' }}>
                      {dateText}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              <span>Cũ hơn</span>
              <span>Mới nhất ➔</span>
            </div>
          </div>
        )}
      </Card>

      {/* AI LEARNING INSIGHT & ACTION PLAN */}
      <Card style={{ padding: 'var(--spacing-6)', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)', flexWrap: 'wrap', gap: 'var(--spacing-2)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-xl)' }}>
            <span>🤖</span> Cố vấn học tập AI & Lộ trình hành động
          </h2>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleGenerateInsight} 
            isLoading={generatingInsight}
          >
            🔄 {aiInsight ? 'Làm mới phân tích' : 'Phân tích ngay'}
          </Button>
        </div>

        {!aiInsight ? (
          <div style={{ padding: 'var(--spacing-4)', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
            <p className="text-secondary" style={{ margin: 0 }}>
              Hệ thống chưa tạo báo cáo phân tích cá nhân hóa. Nhấn <strong>"Phân tích ngay"</strong> để AI Sư phạm tổng hợp năng lực chuyên đề và đề xuất lộ trình ôn tập 4 bước cho bạn.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {/* SUMMARY */}
            <div style={{ 
              padding: 'var(--spacing-4)', 
              backgroundColor: 'var(--color-primary-soft)', 
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-text)',
              fontSize: '14px',
              lineHeight: '1.6'
            }}>
              <strong>💡 Đánh giá tổng quan:</strong> {aiInsight.summary}
            </div>

            {/* ACTION PLAN */}
            {aiInsight.action_plan && aiInsight.action_plan.length > 0 && (
              <div>
                <h4 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: '14px', color: 'var(--color-text)' }}>
                  🎯 Kế hoạch hành động khuyến nghị (Theo mức ưu tiên):
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
                  {aiInsight.action_plan.map((act, idx) => (
                    <div 
                      key={idx}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: 'var(--spacing-2)',
                        padding: 'var(--spacing-3)',
                        backgroundColor: 'var(--color-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--color-border)',
                        fontSize: '13px'
                      }}
                    >
                      <span>📌</span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiInsight.generated_at && (
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', textAlign: 'right' }}>
                Cập nhật lúc: {new Date(aiInsight.generated_at).toLocaleString('vi-VN')}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* TOPIC PERFORMANCE: STRENGTHS & FOCUS AREAS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--spacing-4)' }}>
        
        {/* STRENGTHS */}
        <Card style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-lg)' }}>
              <span>🌟</span> Thế mạnh vững chắc (≥ 80%)
            </h2>
            <Badge variant="success">≥ 5 câu</Badge>
          </div>

          {strongTopics.length === 0 ? (
            <p className="text-muted" style={{ margin: 0 }}>Chưa có chuyên đề đạt ngưỡng thế mạnh (≥ 80% trên tối thiểu 5 câu).</p>
          ) : (
            <div className="flex flex-col gap-3">
              {strongTopics.map((t, idx) => (
                <div key={idx} style={{ padding: 'var(--spacing-2) 0' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{t.topic}</span>
                    <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-success)', fontSize: '13px' }}>
                      {t.accuracy_rate}% ({t.correct_answers}/{t.total_questions} câu)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.accuracy_rate}%`, height: '100%', backgroundColor: 'var(--color-success)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* WEAK TOPICS / FOCUS AREAS */}
        <Card style={{ padding: 'var(--spacing-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-lg)' }}>
              <span>⚠️</span> Cần củng cố & Luyện thêm (&lt; 50%)
            </h2>
            <Badge variant="danger">Ưu tiên</Badge>
          </div>

          {weakTopics.length === 0 ? (
            <p className="text-muted" style={{ margin: 0 }}>Không có chuyên đề báo động dưới 50%. Duy trì phong độ rất tốt!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {weakTopics.map((t, idx) => (
                <div key={idx} style={{ padding: 'var(--spacing-2) 0' }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>{t.topic}</span>
                    <span style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-danger)', fontSize: '13px' }}>
                      {t.accuracy_rate}% ({t.correct_answers}/{t.total_questions} câu)
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ width: `${t.accuracy_rate}%`, height: '100%', backgroundColor: 'var(--color-danger)', borderRadius: 'var(--radius-full)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>

      {/* UPCOMING SESSIONS */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-xl)' }}>
            <span>📅</span> Lịch học sắp tới
          </h2>
          {data.upcomingSessions && data.upcomingSessions.length > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              {data.upcomingSessions.length} buổi học
            </span>
          )}
        </div>

        {(!data.upcomingSessions || data.upcomingSessions.length === 0) ? (
          <p className="text-muted" style={{ margin: 0, padding: 'var(--spacing-4) 0' }}>Không có buổi học nào sắp diễn ra.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {data.upcomingSessions.map((sess: any, idx: number) => {
              const isOnline = String(sess.class_type || '').toUpperCase() === 'ONLINE';
              const hasMeet = Boolean(isOnline && sess.meet_link);
              const dateStr = sess.session_date 
                ? new Date(sess.session_date).toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' }) 
                : 'Chưa có ngày';
              const timeStr = sess.start_time ? String(sess.start_time).substring(0, 5) : '18:00';

              return (
                <div 
                  key={sess.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--spacing-4)',
                    backgroundColor: 'var(--color-surface)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    flexWrap: 'wrap',
                    gap: 'var(--spacing-3)'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '15px', color: 'var(--color-text)' }}>
                      📖 {sess.class_name || 'Lớp học'}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      <span style={{ backgroundColor: 'var(--color-background)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                        🗓️ {dateStr}
                      </span>
                      <span style={{ backgroundColor: 'var(--color-background)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        ⏰ {timeStr}
                      </span>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: isOnline ? '#eff6ff' : '#f0fdf4',
                        color: isOnline ? '#2563eb' : '#15803d'
                      }}>
                        {isOnline ? '🌐 Trực tuyến' : '🏫 Trực tiếp'}
                      </span>
                    </div>
                  </div>

                  {hasMeet && (
                    <a 
                      href={sess.meet_link} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ textDecoration: 'none' }}
                    >
                      <Button variant="primary" size="sm">
                        🎥 Vào lớp Meet
                      </Button>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ASSIGNED HOMEWORK / DOCUMENTS */}
      <Card style={{ padding: 'var(--spacing-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', fontSize: 'var(--font-size-xl)' }}>
            <span>📚</span> Bài tập & Tài liệu được giao
          </h2>
          {data.assignments && data.assignments.length > 0 && (
            <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>
              {data.assignments.length} bài tập
            </span>
          )}
        </div>
        
        {(!data.assignments || data.assignments.length === 0) ? (
          <p className="text-muted" style={{ margin: 0, padding: 'var(--spacing-4) 0' }}>Chưa có bài tập nào được giao gần đây.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            {data.assignments.map((item: any, idx: number) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 'var(--spacing-4)', 
                  backgroundColor: 'var(--color-surface)', 
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: 'var(--spacing-3)'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ fontWeight: 'var(--font-weight-bold)', fontSize: '15px', color: 'var(--color-text)' }}>
                    📄 {item.title}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                    <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>{item.class_name}</span>
                    {item.session_info && (
                      <span style={{ backgroundColor: 'var(--color-background)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                        📅 {item.session_info}
                      </span>
                    )}
                    {item.due_at && (
                      <span style={{ color: '#d97706', fontWeight: 'bold' }}>
                        ⏰ Hạn nộp: {new Date(item.due_at).toLocaleDateString('vi-VN')} {new Date(item.due_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </div>

                {item.file_url ? (
                  <a 
                    href={item.file_url} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="primary" size="sm">
                      Mở tài liệu ↗
                    </Button>
                  </a>
                ) : (
                  <Button variant="ghost" size="sm" disabled>
                    Không có file đính kèm
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* EDIT EMAIL MODAL */}
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
