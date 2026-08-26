const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');

code = code.replace("import { axiosClient } from '../api/axiosClient';\n", "");

code = code.replace(
`  const handleUpdateEmail = async () => {
    try {
      await axiosClient.put('/api/student/email', { email: emailInput });
      alert('Cập nhật email thành công!');
      setShowEmailModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật email');
    }
  };`,
`  const handleUpdateEmail = async () => {
    try {
      await axiosClient.put('/api/student/email', { email: emailInput });
      alert('Cập nhật email thành công!');
      setShowEmailModal(false);
      // Reload page to fetch new data instead of calling undefined fetchData
      window.location.reload();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi cập nhật email');
    }
  };`
);

fs.writeFileSync('src/pages/StudentDashboard.tsx', code);
console.log("Patched StudentDashboard properly.");

