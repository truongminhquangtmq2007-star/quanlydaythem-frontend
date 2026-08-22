const fs = require('fs');
let code = fs.readFileSync('src/api/axiosClient.ts', 'utf8');

code = code.replace(
  "baseURL: import.meta.env.VITE_API_URL || 'https://quanlydaythem-api.onrender.com'",
  "baseURL: (import.meta.env.VITE_API_URL || 'https://quanlydaythem-api.onrender.com').replace(/\\/+$/, '')"
);

fs.writeFileSync('src/api/axiosClient.ts', code);
console.log('Fixed trailing slash in axiosClient.ts');

