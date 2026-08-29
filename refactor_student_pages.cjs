const fs = require('fs');
const path = require('path');

const studentSchedulePath = path.join(__dirname, 'src', 'pages', 'StudentSchedule.tsx');
const studentScheduleContent = `import React, { useState, useEffect } from 'react';
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

export default StudentSchedule;`;
fs.writeFileSync(studentSchedulePath, studentScheduleContent);


const studentDocsPath = path.join(__dirname, 'src', 'pages', 'StudentDocuments.tsx');
const studentDocsContent = `import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

const StudentDocuments = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await axiosClient.get('/api/student/documents');
        setDocs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-6)' }}>📚 Bài Tập & Tài Liệu</h1>
      <Card style={{ padding: 'var(--spacing-8)' }}>
        {loading ? (
           <div className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-md)' }}></div>
        ) : docs.length === 0 ? (
          <EmptyState title="Trống" description="Chưa có tài liệu nào." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  <th style={{ padding: 'var(--spacing-4)' }}>Tiêu đề / Loại</th>
                  <th style={{ padding: 'var(--spacing-4)' }}>Lớp</th>
                  <th style={{ padding: 'var(--spacing-4)' }}>Hạn chót</th>
                  <th style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>{d.title}</div>
                      <Badge variant="info" style={{ marginTop: 'var(--spacing-1)' }}>{d.type}</Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', color: 'var(--color-text-secondary)' }}>{d.class_name}</td>
                    <td style={{ padding: 'var(--spacing-4)' }}>
                      {d.due_at ? (
                        <span style={{ color: new Date(d.due_at) < new Date() ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>
                          {new Date(d.due_at).toLocaleDateString('vi-VN')} {new Date(d.due_at).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ padding: 'var(--spacing-4)', textAlign: 'right' }}>
                      <Button variant="primary" size="sm" onClick={() => window.open(d.file_url, '_blank')}>
                        Xem / Làm Bài
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentDocuments;`;
fs.writeFileSync(studentDocsPath, studentDocsContent);

console.log("Student Schedule & Docs updated");

