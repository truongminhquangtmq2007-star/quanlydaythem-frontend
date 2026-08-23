const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');

code = code.replace(
  "Học sinh khối {data.profile.grade} | Trường {data.profile.school}",
  "Trường {data.profile.school}"
);
code = code.replace(
  "Học sinh khối {data.profile?.grade} | Trường {data.profile?.school}",
  "Trường {data.profile?.school}"
);

fs.writeFileSync('src/pages/StudentDashboard.tsx', code);
console.log('Fixed StudentDashboard.tsx');

