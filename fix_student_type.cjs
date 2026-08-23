const fs = require('fs');
let code = fs.readFileSync('src/types/core.ts', 'utf8');
if (!code.includes('ai_evaluation')) {
  code = code.replace(/learning_goals\?: string;/g, "learning_goals?: string;\n  ai_evaluation?: any;");
  fs.writeFileSync('src/types/core.ts', code);
}

