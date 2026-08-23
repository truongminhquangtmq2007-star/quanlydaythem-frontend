const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentSchedule.tsx', 'utf8');

code = code.replace(/\{s\.start_time\.slice\(0,\s*5\)\}\s*-\s*\{s\.end_time\.slice\(0,\s*5\)\}/g, "{s.start_time?.slice(0, 5)}");

fs.writeFileSync('src/pages/StudentSchedule.tsx', code);
console.log('Fixed StudentSchedule.tsx');

