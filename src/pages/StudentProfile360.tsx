import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useParams, useNavigate } from 'react-router-dom';
import type { Student } from '../types/core';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Profile360 {
  profile: Student;
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
        if (res.data.profile.learning_goals) {
          setLearningGoals(res.data.profile.learning_goals);
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

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải hồ sơ...</div>;
  if (!data) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>Không tìm thấy học sinh.</div>;

  const { profile, classes, attendance } = data;

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
      setData(prev => prev ? { ...prev, profile: { ...prev.profile, ai_evaluation: res.data.data } } : null);
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
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button onClick={() => navigate('/students')} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: '0.2s' }}>
          ← Quay lại danh sách
        </button>
        <button onClick={() => navigate(`/students/${id}/report`)} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(59,130,246,0.3)', transition: '0.2s' }}>
          ✨ Tạo Báo cáo Tuần (AI)
        </button>
        <button onClick={handleGenerateAIEvaluation} disabled={evaluating} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: evaluating ? '#94a3b8' : '#8b5cf6', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(139,92,246,0.3)', transition: '0.2s' }}>
          {evaluating ? '⏳ Đang phân tích...' : '✨ Phân tích & Định hướng AI'}
        </button>
      </div>

      {/* HEADER PROFILE */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: '30px' }}>
        <div style={{ height: '120px', backgroundColor: '#3b82f6', background: 'linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%)' }}></div>
        <div style={{ padding: '0 30px 30px 30px', display: 'flex', gap: '25px', position: 'relative' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: 'white', marginTop: '-60px', padding: '5px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
              👨‍🎓
            </div>
          </div>
          <div style={{ marginTop: '15px', flex: 1 }}>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#0f172a' }}>{profile.full_name}</h1>
            <div style={{ display: 'flex', gap: '25px', color: '#64748b', fontSize: '15px' }}>
              <span>Mã HS: <strong style={{ color: '#334155' }}>{profile.student_code || profile.id}</strong></span>
              <span>Trường: <strong style={{ color: '#334155' }}>{profile.school || '---'}</strong></span>
              <span>Khối: <strong style={{ color: '#3b82f6' }}>{profile.grade || '---'}</strong></span>
              <span>Phụ huynh: <strong style={{ color: '#334155' }}>{profile.parent_phone || '---'}</strong></span>
            </div>
          </div>
        </div>
      </div>

      
      {/* AI EVALUATION SECTION */}
      {data.profile.ai_evaluation && Object.keys(data.profile.ai_evaluation).length > 0 && (
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #8b5cf6', boxShadow: '0 4px 15px rgba(139,92,246,0.1)', marginBottom: '30px' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#6d28d9', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Phân tích & Định hướng AI</h3>
          <div style={{ color: '#334155', lineHeight: '1.6', fontSize: '15px' }}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {typeof data.profile.ai_evaluation === 'string' ? data.profile.ai_evaluation : JSON.stringify(data.profile.ai_evaluation)}
            </ReactMarkdown>
          </div>
        </div>
      )}
  
      {/* QUICK STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' }}>
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Lớp đang tham gia</div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#0f172a' }}>{classes.length} <span style={{fontSize:'16px', color:'#64748b', fontWeight:'normal'}}>lớp</span></div>
        </div>
        
        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Tỷ lệ Chuyên cần</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: attendance.rate >= 90 ? '#10b981' : attendance.rate >= 70 ? '#f59e0b' : '#ef4444' }}>
              {attendance.rate}%
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>({attendance.present} / {attendance.total} buổi)</div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', marginTop: '15px', overflow: 'hidden' }}>
            <div style={{ width: `${attendance.rate}%`, height: '100%', backgroundColor: attendance.rate >= 90 ? '#10b981' : attendance.rate >= 70 ? '#f59e0b' : '#ef4444' }}></div>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '10px' }}>Nghỉ / Đi muộn</div>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div style={{ flex: 1, backgroundColor: '#fef2f2', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{attendance.absent}</div>
              <div style={{ fontSize: '12px', color: '#991b1b' }}>Buổi vắng</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#fffbeb', padding: '10px', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>{attendance.late}</div>
              <div style={{ fontSize: '12px', color: '#b45309' }}>Đi muộn</div>
            </div>
          </div>
        </div>
      </div>

      {/* MỤC TIÊU NGẮN HẠN (LEARNING GOALS) */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', marginBottom: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
          🎯 Mục tiêu ngắn hạn (Coach Mode)
        </h2>
        <textarea 
          value={learningGoals}
          onChange={(e) => setLearningGoals(e.target.value)}
          placeholder="Ví dụ: Đạt 8 điểm bài thi Giữa kì Toán 10. (Gợi ý AI: Nhắc nhở tập trung nếu là lớp Offline, tự giác nộp bài nếu là lớp Online)"
          style={{ width: '100%', height: '80px', padding: '15px', borderRadius: '12px', border: '1px solid #cbd5e1', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '14px', marginBottom: '15px', resize: 'vertical' }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleSaveGoals} disabled={savingGoals} style={{ padding: '10px 20px', backgroundColor: savingGoals ? '#94a3b8' : '#8b5cf6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(139,92,246,0.3)' }}>
            {savingGoals ? 'Đang lưu...' : '💾 Lưu Mục tiêu'}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* TABS LỚP HỌC */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>📚 Danh sách Lớp Học</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Tên Lớp / Môn</th>
                <th style={{ padding: '15px', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0' }}>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Chưa tham gia lớp nào.</td></tr>
              ) : classes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#0f172a' }}>
                    {c.name || c.class_name} <br/>
                    <span style={{ fontWeight: 'normal', color: '#64748b', fontSize: '13px' }}>{c.subject || 'Chưa cập nhật môn'}</span>
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '6px 12px', backgroundColor: c.member_status === 'ACTIVE' ? '#dcfce7' : '#f1f5f9', color: c.member_status === 'ACTIVE' ? '#166534' : '#64748b', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                      {c.member_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ANALYTICS: PHÂN TÍCH CHUYÊN ĐỀ */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🎯 Phân Tích Chuyên Đề (Topic Mastery)</h2>
          {topics.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Chưa có dữ liệu bài làm.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
              {topics.map(t => {
                const rate = Number(t.accuracy_rate);
                let color = '#10b981'; // Green
                let icon = '✅';
                if (rate < 50) {
                  color = '#ef4444'; // Red
                  icon = '⚠️';
                } else if (rate < 80) {
                  color = '#f59e0b'; // Yellow
                  icon = '⚡';
                }

                return (
                  <div key={t.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 'bold', color: '#334155' }}>{icon} {t.topic}</span>
                      <span style={{ fontWeight: 'bold', color }}>{rate}% ({t.correct_count}/{t.attempt_count})</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', backgroundColor: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color, borderRadius: '5px', transition: 'width 0.5s' }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Nhận xét AI (Coach)</h3>
              <button onClick={handleGenerateRemark} disabled={aiRemark.loading} style={{ padding: '8px 15px', backgroundColor: aiRemark.loading ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}>
                {aiRemark.loading ? 'Đang tạo...' : (aiRemark.text ? '🔄 Tái tạo nhận xét' : '✨ Tạo nhận xét')}
              </button>
            </div>
            
            {aiRemark.text && (
              <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', color: '#1e293b', fontSize: '14px', lineHeight: '1.6', border: '1px solid #e2e8f0' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{aiRemark.text}</ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile360;

