const fs = require('fs');
let code = fs.readFileSync('src/pages/ClassDetail.tsx', 'utf8');

code = code.replace(
  '`/api/classes/sessions/${activeSession.id}/sync-calendar`',
  '`/api/sessions/${activeSession.id}/sync-calendar`'
);

fs.writeFileSync('src/pages/ClassDetail.tsx', code);
console.log("Patched API route.");

