const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ExamManagement.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "import { useNavigate } from 'react-router-dom';",
  "import { useNavigate } from 'react-router-dom';\nimport { Card } from '../components/ui/Card';\nimport { Button } from '../components/ui/Button';\nimport { Badge } from '../components/ui/Badge';\nimport { Input } from '../components/ui/Input';\nimport { Modal } from '../components/ui/Modal';\nimport { EmptyState } from '../components/ui/EmptyState';\nimport { Skeleton } from '../components/ui/Skeleton';"
);

// Very basic replacement of main styling wrapper
content = content.replace(
  "<div style={{ padding: '40px', maxWidth: '100%', boxSizing: 'border-box' }}>",
  "<div style={{ padding: 'var(--spacing-6)' }}>"
);

content = content.replace(
  "<div><h1 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '30px' }}>Quản lý Thi & Điểm số</h1></div>",
  "<div><h1 style={{ margin: '0 0 var(--spacing-2) 0', fontSize: 'var(--font-size-2xl)' }}>Quản lý Đề Thi & Chấm Điểm</h1><p className='text-secondary' style={{margin:0}}>Soạn đề, cập nhật đáp án và theo dõi kết quả thi.</p></div>"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("ExamManagement partially updated!");

