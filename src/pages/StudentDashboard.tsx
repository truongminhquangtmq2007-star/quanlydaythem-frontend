import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axiosClient from '../api/axiosClient';

const StudentDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  
  const handleUpdateEmail = async () => {
    try {
      await axiosClient.put('/api/student/email', { email: emailInput });
      toast.success('Cập nhật email thành công!');
      setShowEmailModal(false);
      // Reload page to fetch new data instead of calling undefined fetchData
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật email');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axiosClient.get('/api/student/dashboard');
                setData(res.data);
        if (res.data.profile?.email) {
            setEmailInput(res.data.profile.email);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  if (!data) return <div style={{ padding: '40px', textAlign: 'center' }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* HEADER */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>👨‍🎓</div>
        <div>
          <h1 style={{ margin: '0 0 5px 0', color: '#0f172a' }}>Xin chào, {data.profile.full_name}! 👋</h1>
          <p style={{ margin: 0, color: '#64748b' }}>Trường {data.profile.school}</p>
          <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', color: '#334155' }}>Email: {data.profile.email || 'Chưa cập nhật'}</span>
            <button onClick={() => setShowEmailModal(true)} style={{ padding: '4px 10px', fontSize: '12px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cập nhật</button>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #3b82f6' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '15px' }}>Tỉ lệ chuyên cần</h3>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>{data.stats.attendanceRate}%</div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #10b981' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '15px' }}>Điểm trung bình (30 ngày)</h3>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>{data.stats.avgScore}</div>
        </div>
        <div style={{ flex: 1, backgroundColor: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', borderLeft: '5px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: '15px' }}>Bài đã làm</h3>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b' }}>{data.stats.examsCount}</div>
        </div>
      </div>

      
      {/* AI EVALUATION SECTION */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🤖 Đánh giá & Định hướng AI</h2>
        {!data.profile.ai_evaluation || Object.keys(data.profile.ai_evaluation).length === 0 ? (
          <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '15px', border: '1px dashed #93c5fd', color: '#3b82f6', textAlign: 'center', fontWeight: 'bold' }}>
            Chưa có phân tích định kỳ từ giáo viên. Em hãy hoàn thành các bài kiểm tra để hệ thống đánh giá nhé!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Card 1: Strong points */}
            <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '15px', border: '1px solid #bbf7d0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Điểm mạnh & Phát huy</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '14px', lineHeight: '1.6' }}>
                {Array.isArray(data.profile.ai_evaluation.strong_points) ? data.profile.ai_evaluation.strong_points.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>{data.profile.ai_evaluation.strong_points || 'Không có dữ liệu'}</li>}
              </ul>
            </div>
            
            {/* Card 2: Weak points */}
            <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '15px', border: '1px solid #fecaca', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#991b1b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Cần cải thiện</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c', fontSize: '14px', lineHeight: '1.6' }}>
                {Array.isArray(data.profile.ai_evaluation.weak_points) ? data.profile.ai_evaluation.weak_points.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>{data.profile.ai_evaluation.weak_points || 'Không có dữ liệu'}</li>}
              </ul>
            </div>

            {/* Card 3: Attention note */}
            <div style={{ backgroundColor: '#fefce8', padding: '20px', borderRadius: '15px', border: '1px solid #fef08a', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#854d0e', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>💡 Lưu ý kỹ năng</h3>
              <p style={{ margin: 0, color: '#a16207', fontSize: '14px', lineHeight: '1.6' }}>
                {data.profile.ai_evaluation.attention_note || 'Không có lưu ý đặc biệt'}
              </p>
            </div>

            {/* Card 4: Action plan */}
            <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '15px', border: '1px solid #bfdbfe', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e40af', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Mục tiêu & Hành động</h3>
              <p style={{ margin: 0, color: '#1d4ed8', fontSize: '14px', lineHeight: '1.6' }}>
                {data.profile.ai_evaluation.action_plan || 'Chưa có kế hoạch hành động'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* WEAK TOPICS */}

      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🎯 Phân tích tiến độ học tập (Chuyên đề cần cố gắng)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {data.weakTopics.length === 0 ? (
            <div style={{ color: '#94a3b8' }}>Chưa có dữ liệu bài làm để phân tích.</div>
          ) : (
            data.weakTopics.map((t: any, idx: number) => {
              const rate = Number(t.accuracy_rate);
              let color = '#10b981';
              if (rate < 50) color = '#ef4444';
              else if (rate < 80) color = '#f59e0b';

              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '15px' }}>
                    <span style={{ fontWeight: 'bold', color: '#334155' }}>{t.topic}</span>
                    <span style={{ fontWeight: 'bold', color }}>{rate}%</span>
                  </div>
                  <div style={{ width: '100%', height: '12px', backgroundColor: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ width: `${rate}%`, height: '100%', backgroundColor: color, borderRadius: '6px' }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
