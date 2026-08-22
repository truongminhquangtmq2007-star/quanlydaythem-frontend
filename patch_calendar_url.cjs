const fs = require('fs');
let code = fs.readFileSync('src/pages/TeacherCalendar.tsx', 'utf8');

code = code.replace(
  "const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';",
  ""
);

code = code.replace(
  "window.location.href = `${apiUrl}/api/calendar/auth?token=${token}`;",
  "window.location.href = `${import.meta.env.VITE_API_URL}/api/calendar/auth?token=${token}`;"
);

fs.writeFileSync('src/pages/TeacherCalendar.tsx', code);
console.log("Patched TeacherCalendar.tsx");

