const fs = require('fs');
let code = fs.readFileSync('src/pages/TeacherCalendar.tsx', 'utf8');

code = code.replace(
  "const apiUrl = import.meta.env.VITE_API_URL || 'https://quanlydaythem-api.onrender.com';\n              window.location.href = `${apiUrl}/api/calendar/auth?token=${token}`;",
  "const rawApiUrl = import.meta.env.VITE_API_URL || 'https://quanlydaythem-api.onrender.com';\n              const apiUrl = rawApiUrl.replace(/\\/+$/, '');\n              window.location.href = `${apiUrl}/api/calendar/auth?token=${token}`;"
);

fs.writeFileSync('src/pages/TeacherCalendar.tsx', code);
console.log('Fixed trailing slash in TeacherCalendar.tsx');

