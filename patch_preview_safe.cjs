const fs = require('fs');

let code = fs.readFileSync('src/pages/ExamEditor.tsx', 'utf8');
const parts = code.split("{/* PHẢI: EDIT FORM (50%) */}");

if (parts.length !== 2) {
    console.error("Could not split by EDIT FORM");
    process.exit(1);
}

let previewCode = parts[0];
let editCode = parts[1];

// 1. Remove the sharedContexts block at the top of the preview
const sharedCtxRegex = /\{examData\.sharedContexts\?\.map\(\(ctx: any, i: number\) => \([\s\S]*?<\/div>\s*\)\)\}/u;
previewCode = previewCode.replace(sharedCtxRegex, "");

// 2. Wrap part1 items
const part1Regex = /\{examData\.part1\?\.map\(\(q: any, i: number\) => \(\s*(<div key=\{`p1-\$\{i\}`\}[\s\S]*?<\/div>\s*<\/div>\s*)\)\)\}/u;
previewCode = previewCode.replace(part1Regex, (match, divContent) => {
    return `{examData.part1?.map((q: any, i: number) => {
            const ctx = q.context_id && (i === 0 || examData.part1[i - 1].context_id !== q.context_id) ? (examData.sharedContexts || examData.shared_context)?.find((c:any) => String(c.id) === String(q.context_id)) : null;
            return (
              <React.Fragment key={\`p1-frag-\${i}\`}>
                {ctx && (
                  <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '1px dashed #f59e0b' }}>
                    <strong>📖 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
                    {ctx.image_url && <div style={{ marginTop: '10px' }}><img src={ctx.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} /></div>}
                  </div>
                )}
                ${divContent}
              </React.Fragment>
            );
          })}`;
});

// 3. Wrap part2 items
const part2Regex = /\{examData\.part2\?\.map\(\(q: any, i: number\) => \(\s*(<div key=\{`p2-\$\{i\}`\}[\s\S]*?<\/div>\s*<\/div>\s*)\)\)\}/u;
previewCode = previewCode.replace(part2Regex, (match, divContent) => {
    return `{examData.part2?.map((q: any, i: number) => {
            const ctx = q.context_id && (i === 0 || examData.part2[i - 1].context_id !== q.context_id) ? (examData.sharedContexts || examData.shared_context)?.find((c:any) => String(c.id) === String(q.context_id)) : null;
            return (
              <React.Fragment key={\`p2-frag-\${i}\`}>
                {ctx && (
                  <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '1px dashed #f59e0b' }}>
                    <strong>📖 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
                    {ctx.image_url && <div style={{ marginTop: '10px' }}><img src={ctx.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} /></div>}
                  </div>
                )}
                ${divContent}
              </React.Fragment>
            );
          })}`;
});

// 4. Wrap part3 items
const part3Regex = /\{examData\.part3\?\.map\(\(q: any, i: number\) => \(\s*(<div key=\{`p3-\$\{i\}`\}[\s\S]*?<\/div>\s*<\/div>\s*)\)\)\}/u;
previewCode = previewCode.replace(part3Regex, (match, divContent) => {
    return `{examData.part3?.map((q: any, i: number) => {
            const ctx = q.context_id && (i === 0 || examData.part3[i - 1].context_id !== q.context_id) ? (examData.sharedContexts || examData.shared_context)?.find((c:any) => String(c.id) === String(q.context_id)) : null;
            return (
              <React.Fragment key={\`p3-frag-\${i}\`}>
                {ctx && (
                  <div style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fef3c7', borderRadius: '10px', border: '1px dashed #f59e0b' }}>
                    <strong>📖 Ngữ cảnh chung:</strong> {renderMathText(ctx.content)}
                    {ctx.image_url && <div style={{ marginTop: '10px' }}><img src={ctx.image_url} style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} /></div>}
                  </div>
                )}
                ${divContent}
              </React.Fragment>
            );
          })}`;
});

fs.writeFileSync('src/pages/ExamEditor.tsx', previewCode + "{/* PHẢI: EDIT FORM (50%) */}" + editCode);
console.log("Patched ExamEditor.tsx safely!");

