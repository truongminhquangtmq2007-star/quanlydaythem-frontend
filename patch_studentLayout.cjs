const fs = require('fs');
let code = fs.readFileSync('src/components/StudentLayout.tsx', 'utf8');

const targetStr = "{user ? `${user.title === 'Em' ? '' : user.title} ${studentName}`.trim() : `Chào em, ${studentName}`}";
// The console output showed `Chào em`, `Học viên`. The encoding might be weird. Let's just find `user ?` and replace the whole h3 tag block.
code = code.replace(
  /<h3 style=\{\{ margin: '0 0 5px 0', fontSize: '18px', color: '#f8fafc' \}\}>[\s\S]*?<\/h3>/m,
  "<h3 style={{ margin: '0 0 5px 0', fontSize: '18px', color: '#f8fafc', textTransform: 'capitalize' }}>\n            {studentName}\n          </h3>"
);

fs.writeFileSync('src/components/StudentLayout.tsx', code);
console.log('Patched StudentLayout.tsx');

