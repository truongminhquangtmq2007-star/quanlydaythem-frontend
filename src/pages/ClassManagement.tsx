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

const ClassManagement = () => {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newClass, setNewClass] = useState({ class_name: '', description: '', class_type: 'OFFLINE', meet_link: '', schedule: '', tuition_fee: 0 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axiosClient.get('/api/classes');
      setClasses(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axiosClient.post('/api/classes', newClass);
      setShowModal(false);
      setNewClass({ class_name: '', description: '', class_type: 'OFFLINE', meet_link: '', schedule: '', tuition_fee: 0 });
      fetchClasses();
    } catch (err) {
      alert('Lỗi tạo lớp học');
    }
  };

  return (
    <div style={{ padding: 'var(--spacing-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)' }}>
        <div>
          <h1 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-2xl)' }}>Quản lý Lớp học</h1>
          <p className="text-secondary" style={{ margin: 0 }}>Quản lý danh sách các lớp học hiện tại</p>
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Tạo Lớp Mới</Button>
      </div>

      <Card style={{ padding: 'var(--spacing-6)' }}>
        {loading ? (
           <div className="flex flex-col gap-4">
             <Skeleton height="40px" />
             <Skeleton height="40px" />
             <Skeleton height="40px" />
           </div>
        ) : classes.length === 0 ? (
           <EmptyState title="Chưa có lớp học nào" description="Bạn chưa tạo lớp học nào, hãy bắt đầu tạo lớp học đầu tiên." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                  <th style={{ padding: 'var(--spacing-3)' }}>Tên Lớp</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Lịch Học</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Sĩ số</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Hình thức</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-medium)' }}>{cls.class_name}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>{cls.schedule || 'Chưa xếp'}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>{cls.current_students || 0}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Badge variant={cls.class_type === 'ONLINE' ? 'info' : 'primary'}>{cls.class_type}</Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                      <Button variant="outline" size="sm" onClick={() => navigate(`/classes/${cls.id}`)}>Chi tiết</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo Lớp Học Mới">
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <Input 
            label="Tên Lớp" 
            placeholder="VD: Toán 10 Nâng cao" 
            value={newClass.class_name} 
            onChange={e => setNewClass({...newClass, class_name: e.target.value})} 
            required 
          />
          <Input 
            label="Mô tả / Môn học" 
            placeholder="VD: Toán học" 
            value={newClass.description} 
            onChange={e => setNewClass({...newClass, description: e.target.value})} 
          />
          <Input 
            label="Học phí (VND)" 
            type="number"
            value={newClass.tuition_fee} 
            onChange={e => setNewClass({...newClass, tuition_fee: parseInt(e.target.value) || 0})} 
          />
          <div className="flex flex-col gap-2">
            <label style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Hình thức</label>
            <select 
              className="input-base"
              value={newClass.class_type} 
              onChange={e => setNewClass({...newClass, class_type: e.target.value as any})}
              style={{ width: '100%', padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}
            >
              <option value="OFFLINE">Học Trực tiếp (Offline)</option>
              <option value="ONLINE">Học Trực tuyến (Online)</option>
            </select>
          </div>
          {newClass.class_type === 'ONLINE' && (
            <Input 
              label="Link Google Meet / Zoom" 
              placeholder="https://meet.google.com/..." 
              value={newClass.meet_link} 
              onChange={e => setNewClass({...newClass, meet_link: e.target.value})} 
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
            <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button variant="primary" type="submit">Tạo lớp</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default ClassManagement;