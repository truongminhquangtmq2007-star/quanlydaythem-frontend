import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await axiosClient.get('/api/student/schedule');
        setSchedule(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-6)' }}>📅 Lịch Học Của Tôi</h1>
      <Card style={{ padding: 'var(--spacing-8)' }}>
        {loading ? (
          <div className="flex flex-col gap-4">
             <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }}></div>
             <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }}></div>
          </div>
        ) : schedule.length === 0 ? (
          <EmptyState title="Trống" description="Chưa có lịch học sắp tới." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            {schedule.map(s => (
              <div key={s.id} style={{ display: 'flex', gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ width: '80px', textAlign: 'center', borderRight: '2px dashed var(--color-border)', paddingRight: 'var(--spacing-6)' }}>
                  <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                    {new Date(s.session_date).getDate()}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', fontWeight: 'var(--font-weight-bold)', textTransform: 'uppercase' }}>
                    Tháng {new Date(s.session_date).getMonth() + 1}
                  </div>
                </div>
                <div>
                  <h3 style={{ margin: '0 0 var(--spacing-1) 0', color: 'var(--color-text)' }}>{s.class_name}</h3>
                  <div style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-1)' }}>
                    Môn: Toán
                  </div>
                  <div style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-bold)' }}>
                    ⏰ {s.start_time?.slice(0, 5)}
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