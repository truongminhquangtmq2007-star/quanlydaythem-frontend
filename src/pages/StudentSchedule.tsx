import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axiosClient.get('/api/student/schedule');
        setSchedule(res.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  return (
    <div style={{ padding: 'var(--spacing-4)', maxWidth: '900px', margin: '0 auto', boxSizing: 'border-box' }}>
      <h1 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-4)', fontSize: '24px' }}>📅 Lịch Học Của Tôi</h1>
      <Card style={{ padding: 'var(--spacing-4)' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
             <div style={{ height: '70px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}></div>
             <div style={{ height: '70px', backgroundColor: 'var(--color-background)', borderRadius: '8px' }}></div>
          </div>
        ) : schedule.length === 0 ? (
          <EmptyState title="Trống" description="Chưa có lịch học sắp tới." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {schedule.map(s => (
              <div 
                key={s.id} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  padding: '12px 14px', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-surface)',
                  alignItems: 'center'
                }}
              >
                <div style={{ width: '60px', textAlign: 'center', borderRight: '1px solid var(--color-border)', paddingRight: '10px', flexShrink: 0 }}>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {new Date(s.session_date).getDate()}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    Tháng {new Date(s.session_date).getMonth() + 1}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 3px 0', fontSize: '16px', color: 'var(--color-text)' }}>{s.class_name}</h3>
                  {s.content && (
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '3px' }}>
                      📖 {s.content}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 'bold' }}>
                      🕒 {s.start_time?.slice(0, 5) || '18:00'}
                    </span>
                    <Badge variant="primary">Đã công bố</Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentSchedule;