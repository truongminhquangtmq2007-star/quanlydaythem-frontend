const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  '<Route path="/quan-ly-tai-chinh" element={<FinancialManagement />} />',
  '<Route path="/quan-ly-tai-chinh" element={<TuitionManager />} />'
);

code = code.replace(
  "import FinancialManagement from './pages/FinancialManagement';\n",
  ""
);
code = code.replace(
  "import FinancialManagement from './pages/FinancialManagement';",
  ""
);

fs.writeFileSync('src/App.tsx', code);
console.log("App.tsx patched");

