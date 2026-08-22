import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const StudentDashboard = () => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axiosClient.get('/api/student/dashboard');
        setData(res.data);
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
          <p style={{ margin: 0, color: '#64748b' }}>Học sinh khối {data.profile.grade} | Trường {data.profile.school}</p>
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
