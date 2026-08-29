const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ClassManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure we have imports
content = content.replace(
  "import type { ClassInfo } from '../types/core';",
  "import type { ClassInfo } from '../types/core';\nimport { Card } from '../components/ui/Card';\nimport { Button } from '../components/ui/Button';\nimport { Badge } from '../components/ui/Badge';\nimport { Modal } from '../components/ui/Modal';\nimport { Input } from '../components/ui/Input';\nimport { EmptyState } from '../components/ui/EmptyState';\nimport { Skeleton } from '../components/ui/Skeleton';"
);

// We replace the render block
const searchStr = "return (";
const lastReturnIndex = content.lastIndexOf(searchStr);

if (lastReturnIndex !== -1) {
    const newRender = `return (
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
                  <th style={{ padding: 'var(--spacing-3)' }}>Mã Lớp</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Tên Lớp</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Môn Học</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Sĩ số</th>
                  <th style={{ padding: 'var(--spacing-3)' }}>Hình thức</th>
                  <th style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: 'var(--spacing-3)', fontWeight: 'var(--font-weight-medium)' }}>{cls.class_code}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>{cls.name}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>{cls.subject}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>{cls.student_count || 0}/{cls.max_students}</td>
                    <td style={{ padding: 'var(--spacing-3)' }}>
                      <Badge variant={cls.class_type === 'ONLINE' ? 'info' : 'primary'}>{cls.class_type}</Badge>
                    </td>
                    <td style={{ padding: 'var(--spacing-3)', textAlign: 'right' }}>
                      <Button variant="outline" size="sm" onClick={() => navigate(\`/classes/\${cls.id}\`)}>Chi tiết</Button>
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
            label="Mã Lớp" 
            placeholder="VD: TOAN10-A" 
            value={newClass.class_code} 
            onChange={e => setNewClass({...newClass, class_code: e.target.value})} 
            required 
          />
          <Input 
            label="Tên Lớp" 
            placeholder="VD: Toán 10 Nâng cao" 
            value={newClass.name} 
            onChange={e => setNewClass({...newClass, name: e.target.value})} 
            required 
          />
          <Input 
            label="Môn học" 
            placeholder="VD: Toán học" 
            value={newClass.subject} 
            onChange={e => setNewClass({...newClass, subject: e.target.value})} 
            required 
          />
          <Input 
            label="Sĩ số tối đa" 
            type="number"
            value={newClass.max_students} 
            onChange={e => setNewClass({...newClass, max_students: parseInt(e.target.value)})} 
            required 
          />
          <div className="flex flex-col gap-2">
            <label style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Hình thức</label>
            <select 
              className="input-base"
              value={newClass.class_type} 
              onChange={e => setNewClass({...newClass, class_type: e.target.value as any})}
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
export default ClassManagement;`;
    
    content = content.substring(0, lastReturnIndex) + newRender;
    fs.writeFileSync(filePath, content, 'utf8');
}

