const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

// I'll just use a simple regex matching the timer div
code = code.replace(/<div style=\{examStyles.timer\}>\s*<span>⏱<\/span> \{formatTime\(timeLeft\)\}\s*<\/div>/g, 
  `<div style={{...examStyles.timer, gap: '15px', display: 'flex'}}>
            <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 'normal' }}>{saveStatus}</span>
            <span>
              <span>⏱</span> {formatTime(timeLeft)}
            </span>
          </div>`
);

fs.writeFileSync('src/pages/ExamRoom.tsx', code);
console.log("Patched header");

