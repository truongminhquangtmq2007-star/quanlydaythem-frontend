import React, { useState, useEffect } from 'react';
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

export default StudentDocuments;