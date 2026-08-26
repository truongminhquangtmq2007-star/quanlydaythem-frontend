const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentList.tsx', 'utf8');

code = code.replace(
    /interface Student \{\s*id: number;\s*full_name: string;\s*phone_number: string;\s*school_name: string;\s*\}/,
    "interface Student {\n  id: number;\n  full_name: string;\n  phone_number: string;\n  school_name: string;\n  email?: string;\n}"
);

fs.writeFileSync('src/pages/StudentList.tsx', code);
console.log("Patched StudentList.tsx interface");

