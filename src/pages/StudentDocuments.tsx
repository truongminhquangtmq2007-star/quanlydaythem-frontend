import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { 
  Card, 
  EmptyState, 
  Badge, 
  Button, 
  Table, 
  Thead, 
  Tbody, 
  Tr, 
  Th, 
  Td, 
  TableContainer, 
  Skeleton,
  Alert 
} from '../components/ui';

const StudentDocuments = () => {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axiosClient.get('/api/student/documents');
      setDocs(res.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Không thể tải danh sách tài liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: 'var(--spacing-6)' }}>
        <h1 style={{ color: 'var(--color-text)', margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-2xl)' }}>
          📚 Bài Tập & Tài Liệu Của Tôi
        </h1>
        <p className="text-secondary" style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
          Danh sách tài liệu học tập, chuyên đề và bài tập được giáo viên giao cho lớp của bạn.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--spacing-4)' }}>
          <Alert variant="danger">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span>{error}</span>
              <Button variant="danger" size="sm" onClick={fetchDocs} style={{ minHeight: '32px' }}>
                Thử lại
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {loading ? (
        <Card style={{ padding: 'var(--spacing-6)' }}>
          <div className="flex flex-col gap-3">
            <Skeleton height="40px" />
            <Skeleton height="50px" />
            <Skeleton height="50px" />
            <Skeleton height="50px" />
          </div>
        </Card>
      ) : docs.length === 0 ? (
        <Card style={{ padding: 'var(--spacing-6)' }}>
          <EmptyState 
            icon="📁"
            title="Chưa có tài liệu nào" 
            description="Hiện tại lớp của bạn chưa có bài tập hoặc tài liệu mới được giao." 
          />
        </Card>
      ) : (
        <TableContainer>
          <Table>
            <Thead>
              <Tr>
                <Th>Tiêu đề / Loại</Th>
                <Th>Lớp học</Th>
                <Th>Hạn chót nộp bài</Th>
                <Th style={{ textAlign: 'right' }}>Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {docs.map(d => {
                const isPastDue = d.due_at && new Date(d.due_at) < new Date();
                return (
                  <Tr key={d.id}>
                    <Td>
                      <div style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>
                        {d.title}
                      </div>
                      {d.type && (
                        <div style={{ marginTop: 'var(--spacing-1)' }}>
                          <Badge variant="info" size="sm">{d.type}</Badge>
                        </div>
                      )}
                    </Td>
                    <Td style={{ color: 'var(--color-text-secondary)' }}>
                      {d.class_name || 'Tất cả'}
                    </Td>
                    <Td>
                      {d.due_at ? (
                        <span style={{ 
                          color: isPastDue ? 'var(--color-danger)' : 'var(--color-success)', 
                          fontWeight: 'var(--font-weight-semibold)',
                          fontSize: 'var(--font-size-xs)'
                        }}>
                          {new Date(d.due_at).toLocaleDateString('vi-VN')} {new Date(d.due_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          {isPastDue && ' (Đã hết hạn)'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)' }}>Không giới hạn</span>
                      )}
                    </Td>
                    <Td style={{ textAlign: 'right' }}>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={() => window.open(d.file_url, '_blank', 'noopener,noreferrer')}
                        disabled={!d.file_url}
                      >
                        {d.file_url ? 'Mở tài liệu ↗' : 'Không có file'}
                      </Button>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </TableContainer>
      )}
    </div>
  );
};

export default StudentDocuments;