import React, { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';
import { useNavigate } from 'react-router-dom';
import type { ClassInfo } from '../types/core';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { TableContainer, Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Select } from '../components/ui/Select';
import { toast } from 'react-toastify';

const ClassManagement = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({ class_name: '', description: '', class_type: 'OFFLINE', meet_link: '', schedule: '', tuition_fee: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const navigate = useNavigate();

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/api/classes');
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const filteredClasses = classes.filter(cls => {
    const matchSearch = (cls.class_name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (cls.schedule || '').toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'ALL' || cls.class_type === typeFilter;
    return matchSearch && matchType;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosClient.post('/api/classes', newClass);
      setShowModal(false);
      setNewClass({ class_name: '', description: '', class_type: 'OFFLINE', meet_link: '', schedule: '', tuition_fee: 0 });
      toast.success('Tạo lớp học mới thành công!');
      fetchClasses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi tạo lớp học');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-4)', maxWidth: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-1) 0', fontSize: '24px', color: 'var(--color-text)' }}>Quản lý Lớp học</h1>
          <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '14px' }}>Danh sách các lớp học do bạn giảng dạy</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)} style={{ minHeight: '44px', minWidth: '130px' }}>
          + Tạo Lớp Mới
        </Button>
      </div>

      <Card style={{ marginBottom: 'var(--spacing-4)', padding: 'var(--spacing-4)' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <Input 
              placeholder="🔍 Tìm kiếm theo tên lớp, lịch học..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ width: '180px' }}>
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'Tất cả hình thức' },
                { value: 'ONLINE', label: 'Trực tuyến (Online)' },
                { value: 'OFFLINE', label: 'Tại lớp (Offline)' }
              ]}
            />
          </div>
        </div>
      </Card>

      <Card style={{ padding: 'var(--spacing-4)' }}>
        {loading ? (
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             <Skeleton height="50px" />
             <Skeleton height="50px" />
             <Skeleton height="50px" />
           </div>
        ) : filteredClasses.length === 0 ? (
           <EmptyState 
             title={classes.length === 0 ? "Chưa có lớp học nào" : "Không tìm thấy lớp học"} 
             description={classes.length === 0 ? "Bạn chưa tạo lớp học nào, hãy bấm '+ Tạo Lớp Mới' để bắt đầu." : "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc."} 
           />
        ) : (
          <div>
            {/* DESKTOP TABLE VIEW */}
            <div className="desktop-class-table">
              <TableContainer>
                <Table>
                  <Thead>
                    <Tr>
                      <Th>Tên Lớp</Th>
                      <Th>Lịch Học</Th>
                      <Th>Sĩ số</Th>
                      <Th>Hình thức</Th>
                      <Th style={{ textAlign: 'right' }}>Thao tác</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {filteredClasses.map(cls => (
                      <Tr key={cls.id}>
                        <Td style={{ fontWeight: 'var(--font-weight-medium)', color: 'var(--color-text)' }}>{cls.class_name}</Td>
                        <Td style={{ color: 'var(--color-text-secondary)' }}>{cls.schedule || 'Chưa xếp'}</Td>
                        <Td style={{ color: 'var(--color-text)' }}>{cls.current_students || 0} học sinh</Td>
                        <Td>
                          <Badge variant={cls.class_type === 'ONLINE' ? 'info' : 'primary'}>{cls.class_type}</Badge>
                        </Td>
                        <Td style={{ textAlign: 'right' }}>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${cls.id}`)} style={{ minHeight: '36px' }}>Chi tiết</Button>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            </div>

            {/* MOBILE CARD LIST VIEW */}
            <div className="mobile-class-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredClasses.map(cls => (
                <div 
                  key={cls.id}
                  onClick={() => navigate(`/classes/${cls.id}`)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '16px', color: 'var(--color-text)' }}>{cls.class_name}</strong>
                    <Badge variant={cls.class_type === 'ONLINE' ? 'info' : 'primary'}>{cls.class_type}</Badge>
                  </div>
                  
                  <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div>🕒 Lịch: {cls.schedule || 'Chưa xếp lịch cụ thể'}</div>
                    <div>👥 Sĩ số: <strong>{cls.current_students || 0}</strong> học sinh</div>
                  </div>

                  <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); navigate(`/classes/${cls.id}`); }}
                      style={{ minHeight: '44px', width: '100%' }}
                    >
                      Mở lớp học ➔
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* MODAL TẠO LỚP */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo Lớp Học Mới">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Input 
            label="Tên lớp học" 
            placeholder="VD: Toán 10 Nâng Cao" 
            value={newClass.class_name} 
            onChange={(e) => setNewClass({ ...newClass, class_name: e.target.value })} 
            required 
          />
          <Input 
            label="Lịch học" 
            placeholder="VD: Thứ 2, Thứ 4 (18:00 - 19:30)" 
            value={newClass.schedule} 
            onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })} 
          />
          <Select 
            label="Hình thức học"
            value={newClass.class_type} 
            onChange={(e) => setNewClass({ ...newClass, class_type: e.target.value })}
            options={[
              { value: 'OFFLINE', label: 'Tại lớp (Offline)' },
              { value: 'ONLINE', label: 'Trực tuyến (Online)' }
            ]}
          />
          {newClass.class_type === 'ONLINE' && (
            <Input 
              label="Link phòng học Online" 
              placeholder="VD: https://meet.google.com/..." 
              value={newClass.meet_link} 
              onChange={(e) => setNewClass({ ...newClass, meet_link: e.target.value })} 
            />
          )}
          <Input 
            label="Mô tả lớp học" 
            placeholder="Mục tiêu, đối tượng học sinh..." 
            value={newClass.description} 
            onChange={(e) => setNewClass({ ...newClass, description: e.target.value })} 
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} style={{ minHeight: '44px' }}>Hủy</Button>
            <Button type="submit" variant="primary" style={{ minHeight: '44px' }}>Lưu & Tạo Lớp</Button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (max-width: 768px) {
          .desktop-class-table {
            display: none !important;
          }
          .mobile-class-cards {
            display: flex !important;
          }
        }
        @media (min-width: 769px) {
          .desktop-class-table {
            display: block !important;
          }
          .mobile-class-cards {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ClassManagement;