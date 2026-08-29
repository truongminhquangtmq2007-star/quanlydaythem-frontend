const fs = require('fs');

function replaceFile(path, oldText, newText) {
  let content = fs.readFileSync(path, 'utf8');
  content = content.split(oldText).join(newText);
  fs.writeFileSync(path, content);
}

replaceFile('src/pages/ClassDetail.tsx', 'variant="success"', 'variant="primary"');
replaceFile('src/pages/ClassDetail.tsx', 'variant={isEnrolled ? "outline" : "success"}', 'variant={isEnrolled ? "outline" : "primary"}');
replaceFile('src/pages/ClassDetail.tsx', 'variant={isEnrolled ? "outline" : "warning"}', 'variant={isEnrolled ? "outline" : "secondary"}');
replaceFile('src/pages/TeacherCalendar.tsx', 'variant="success"', 'variant="primary"');
replaceFile('src/pages/TeacherSessionManager.tsx', 'variant="info"', 'variant="secondary"');

