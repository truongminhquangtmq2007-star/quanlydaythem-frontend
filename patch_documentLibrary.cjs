const fs = require('fs');
let code = fs.readFileSync('src/pages/DocumentLibrary.tsx', 'utf8');

code = code.replace(
  /await axiosClient\.post\('\/api\/folders', \{ name: folderName, parent_id: currentFolderId \}\);/,
  `await axiosClient.post('/api/folders', { name: folderName, parent_id: currentFolderId, category: 'STORAGE' });`
);

fs.writeFileSync('src/pages/DocumentLibrary.tsx', code);
console.log('Fixed DocumentLibrary folder creation');
