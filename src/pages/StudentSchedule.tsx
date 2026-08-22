import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    const fetchSchedule = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('/api/student/schedule', { headers: { Authorization: `Bearer ${token}` } });
        setSchedule(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedule();
  }, []);

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#0f172a', marginBottom: '20px' }}>📅 Lịch Học Của Tôi</h1>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        {schedule.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8' }}>Chưa có lịch học sắp tới.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {schedule.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: '20px', padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                <div style={{ width: '80px', textAlign: 'center', borderRight: '2px dashed #cbd5e1', paddingRight: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#3b82f6' }}>
                    {new Date(s.session_date).getDate()}
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Tháng {new Date(s.session_date).getMonth() + 1}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{s.class_name}</h3>
                  <div style={{ color: '#475569', fontSize: '14px', marginBottom: '5px' }}>
                    Môn: {s.subject}
                  </div>
                  <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold' }}>
                    ⏰ {s.start_time.slice(0, 5)} - {s.end_time.slice(0, 5)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSchedule;

