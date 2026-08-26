const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentList.tsx', 'utf8');

// Add email state
code = code.replace(
  "const [schoolName, setSchoolName] = useState('');",
  "const [schoolName, setSchoolName] = useState('');\n  const [email, setEmail] = useState('');"
);

// Add email to post
code = code.replace(
  "school_name: schoolName,",
  "school_name: schoolName,\n            email: email,"
);

// Add email to put
code = code.replace(
  "phone_number: phoneNumber,\n            school_name: schoolName",
  "phone_number: phoneNumber,\n            school_name: schoolName,\n            email: email"
);

// Clear email on submit
code = code.replace(
  "setSchoolName('');",
  "setSchoolName('');\n        setEmail('');"
);

// Set email on edit
code = code.replace(
  "setSchoolName(student.school_name || '');",
  "setSchoolName(student.school_name || '');\n      setEmail(student.email || '');"
);

// Add email input field
const inputHTML = `<input 
              type="email" 
              placeholder="Email (Không bắt buộc)" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              style={{ flex: 1, minWidth: '200px', padding: '14px 15px', borderRadius: '12px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }} 
            />`;

code = code.replace(
  `type="text" \n              placeholder="Tên Trường" \n              value={schoolName} `,
  `type="text" \n              placeholder="Tên Trường" \n              value={schoolName} `
);

// Just inject the input HTML before the button
code = code.replace(
  /<button type="submit"/,
  inputHTML + "\n            <button type=\"submit\""
);

// Add react-toastify to StudentList.tsx
if (!code.includes("toast.success")) {
  code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { toast } from 'react-toastify';");
  
  // Replace setMessage with toast
  code = code.replace("setMessage('✅ Cập nhật thông tin thành công!');", "toast.success('Cập nhật thông tin thành công!');");
  code = code.replace("setMessage('✅ Thêm học sinh thành công!');", "toast.success('Thêm học sinh thành công!');");
  code = code.replace("setMessage('✅ Đã xóa học sinh thành công!');", "toast.success('Đã xóa học sinh thành công!');");
  code = code.replace("setMessage('❌ Không thể xóa học sinh này.');", "toast.error('Không thể xóa học sinh này.');");
  code = code.replace("alert('✅ Đã cấp lại mật khẩu thành công!');", "toast.success('Đã cấp lại mật khẩu thành công!');");
  code = code.replace("alert('❌ Lỗi: Không thể cấp lại mật khẩu.');", "toast.error('Lỗi: Không thể cấp lại mật khẩu.');");
}

fs.writeFileSync('src/pages/StudentList.tsx', code);
console.log("Patched StudentList.tsx");
