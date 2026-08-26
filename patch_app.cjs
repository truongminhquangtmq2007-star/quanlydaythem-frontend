const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

if (!code.includes('ToastContainer')) {
    code = code.replace("import { AuthProvider } from './context/AuthContext';", "import { AuthProvider } from './context/AuthContext';\nimport { ToastContainer } from 'react-toastify';");
    code = code.replace("    <AuthProvider>", "    <AuthProvider>\n      <ToastContainer />");
}

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx with ToastContainer");
