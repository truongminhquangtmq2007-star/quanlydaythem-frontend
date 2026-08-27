const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const oldImageUpload = /const res = await axiosClient\.post\(\`\/api\/documents\/upload\`, formData, \{\s*headers: \{ Authorization: \`Bearer \$\{localStorage\.getItem\('token'\)\}\`, 'Content-Type': 'multipart\/form-data' \}\s*\}\);\s*return res\.data\?\.document\?\.file_url \|\| res\.data\?\.file_url \|\| null;/;

const newImageUpload = `const res = await axiosClient.post(\`/api/upload/image\`, formData, { 
          headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\`, 'Content-Type': 'multipart/form-data' } 
        });
        return res.data?.url || null;`;

if (code.match(oldImageUpload)) {
    code = code.replace(oldImageUpload, newImageUpload);
    // Also we need to change formData.append('file', file) to formData.append('image', file)
    code = code.replace("formData.append('file', file);\n      formData.append('category', 'EXAM_IMAGE');", "formData.append('image', file);\n      formData.append('category', 'EXAM_IMAGE');");
    console.log("Patched uploadImageToCloudinary");
} else {
    console.log("Failed to patch uploadImageToCloudinary");
}

const oldSaveExamUpload = /const uploadRes = await axiosClient\.post\(\s*\`\/api\/documents\/upload\`,\s*formData, \{ headers: \{ 'Content-Type': 'multipart\/form-data' \} \}\s*\);\s*const newDocumentId = uploadRes\.data\?\.document\?\.id;/;

const newSaveExamUpload = `const uploadRes = await axiosClient.post(
          \`/api/upload/document\`,
          formData, { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        const docRes = await axiosClient.post(\`/api/documents\`, {
            title: examTitle,
            category: 'EXAM',
            file_url: uploadRes.data?.secure_url
        });
        
        const newDocumentId = docRes.data?.id;`;

if (code.match(oldSaveExamUpload)) {
    code = code.replace(oldSaveExamUpload, newSaveExamUpload);
    console.log("Patched handleSaveExam upload");
} else {
    console.log("Failed to patch handleSaveExam upload");
}

fs.writeFileSync('src/pages/CreateExamAI.tsx', code);

