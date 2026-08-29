const fs = require('fs');
const path = require('path');

const pageDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pageDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pageDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace invalid Button variants with valid ones
  content = content.replace(/<Button([^>]*)variant="success"/g, '<Button$1variant="primary"');
  content = content.replace(/<Button([^>]*)variant="warning"/g, '<Button$1variant="secondary"');
  content = content.replace(/<Button([^>]*)variant="info"/g, '<Button$1variant="secondary"');
  
  // also catch dynamic ones like variant={x ? "success" : "danger"}
  content = content.replace(/variant=\{(.*?)"success"(.*?)\}/g, 'variant={$1"primary"$2}');
  content = content.replace(/variant=\{(.*?)"warning"(.*?)\}/g, 'variant={$1"secondary"$2}');
  content = content.replace(/variant=\{(.*?)"info"(.*?)\}/g, 'variant={$1"secondary"$2}');
  
  // catch unquoted properties in JS objects
  content = content.replace(/'success'/g, "'primary'");
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
}

