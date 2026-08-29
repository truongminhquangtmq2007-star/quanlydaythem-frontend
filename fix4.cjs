const fs = require('fs');

let c = fs.readFileSync('src/pages/ClassDetail.tsx', 'utf8');

c = c.replace(/<Badge([^>]*)variant="secondary"/g, (match, p1) => {
    return `<Badge${p1}variant="warning"`;
});

c = c.replace(/variant=\{a.status === 'LATE' \? 'warning' : 'outline'\}/g, "variant={a.status === 'LATE' ? 'secondary' : 'outline'}");

fs.writeFileSync('src/pages/ClassDetail.tsx', c);

