const fs = require('fs');
let code = fs.readFileSync('src/pages/TeacherCalendar.tsx', 'utf8');

// 1. Check for sync=success on mount
const useEffectCode = `
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('sync') === 'success') {
      alert('Đã liên kết Google Calendar thành công!');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('sync') === 'error') {
      alert('Liên kết Google Calendar thất bại!');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
`;
if (!code.includes("window.location.search")) {
  code = code.replace(
    "const [showTuitionModal, setShowTuitionModal] = useState(false);",
    "const [showTuitionModal, setShowTuitionModal] = useState(false);\n" + useEffectCode
  );
}

// 2. Change the button onClick
const oldButton = `onClick={() => alert('Tính năng đồng bộ Calendar đang được cấu hình')}`;
const newButton = `onClick={() => {
              const token = localStorage.getItem('token');
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
              window.location.href = \`\${apiUrl}/api/calendar/auth?token=\${token}\`;
            }}`;

code = code.replace(oldButton, newButton);

fs.writeFileSync('src/pages/TeacherCalendar.tsx', code);
console.log("Patched TeacherCalendar.tsx");

