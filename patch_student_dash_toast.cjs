const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');

if (!code.includes("import { toast } from 'react-toastify';")) {
  code = code.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\nimport { toast } from 'react-toastify';");
}

code = code.replace("alert('Cập nhật email thành công!');", "toast.success('Cập nhật email thành công!');");
code = code.replace("alert(err.response?.data?.message || 'Lỗi cập nhật email');", "toast.error(err.response?.data?.message || 'Lỗi cập nhật email');");

fs.writeFileSync('src/pages/StudentDashboard.tsx', code);
console.log("Patched StudentDashboard.tsx");

