const fs = require('fs');
let p = 'src/pages/ClassDetail.tsx';
let c = fs.readFileSync(p, 'utf8');
c = c.replace('"warning"', '"secondary"');
fs.writeFileSync(p, c);

