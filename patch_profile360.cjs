const fs = require('fs');

let code = fs.readFileSync('src/pages/StudentProfile360.tsx', 'utf8');

// Move evaluating up
code = code.replace('  const [evaluating, setEvaluating] = useState(false);', '');

// Insert evaluating below topics
code = code.replace(
  '  const [topics, setTopics] = useState<any[]>([]);',
  `  const [topics, setTopics] = useState<any[]>([]);
  const [evaluating, setEvaluating] = useState(false);`
);

fs.writeFileSync('src/pages/StudentProfile360.tsx', code);
console.log('Fixed StudentProfile360.tsx');

