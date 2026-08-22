const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findTsxFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const files = findTsxFiles(srcDir);

for (const filePath of files) {
  if (filePath.includes('axiosClient.ts')) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('import axios ')) continue;

  const depth = filePath.split(path.sep).length - srcDir.split(path.sep).length;
  let importPath = '../api/axiosClient';
  if (depth === 1) importPath = './api/axiosClient';
  else if (depth === 2) importPath = '../api/axiosClient';
  else if (depth === 3) importPath = '../../api/axiosClient';

  // Replace import
  content = content.replace(/import axios from 'axios';?/g, `import axiosClient from '${importPath}';`);
  
  // Replace direct axios. defaults
  content = content.replace(/axios\.defaults\.baseURL[^;]+;/g, '');

  // Replace axios.method calls
  content = content.replace(/axios\.(get|post|put|delete|patch)/g, 'axiosClient.$1');

  // Regex to match header auth params: , { headers: { Authorization: `Bearer ${token}` } }
  // We'll just remove anything matching { headers: { Authorization: .*? } }
  // It could be: { headers: { Authorization: `Bearer ${token}` } }
  // or { params: {...}, headers: { Authorization: ... } }
  // It's safer to just do a string replacement if it's the exact object, but there are multiple formats.
  
  // Regex to remove standalone headers arg:
  content = content.replace(/,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}/g, '');
  content = content.replace(/,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{localStorage\.getItem\('token'\)\}`\s*\}\s*\}/g, '');
  content = content.replace(/,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*,\s*'Content-Type':\s*'multipart\/form-data'\s*\}\s*\}/g, ", { headers: { 'Content-Type': 'multipart/form-data' } }");
  
  // Replace silent catch blocks:
  // catch (error) { \n } -> catch (error) { console.error(error); alert('Có lỗi xảy ra'); }
  // This is too complex for regex, I'll just use a basic replacement for empty catch
  content = content.replace(/catch\s*\(([^)]+)\)\s*\{\s*\}/g, "catch ($1) {\n      console.error($1);\n    }");

  // Hardcoded URLs like axiosClient.post('https://quanlydaythem-api.onrender.com/api/...)
  content = content.replace(/['"`]https:\/\/quanlydaythem-api\.onrender\.com(\/api\/[^'"`]+)['"`]/g, "`$1`");

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Refactored ${filePath}`);
}
