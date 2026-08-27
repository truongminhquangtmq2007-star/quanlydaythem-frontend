const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamManagement.tsx', 'utf8');

const oldUpload = /await axiosClient\.post\(\`\/api\/documents\/upload\`, formData, \{ headers: \{ 'Content-Type': 'multipart\/form-data' \} \}\);/;

const newUpload = `const uploadRes = await axiosClient.post(\`/api/upload/document\`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        await axiosClient.post(\`/api/documents\`, {
            title: documentTitle,
            category: 'EXAM',
            file_url: uploadRes.data?.secure_url
        });`;

if (code.match(oldUpload)) {
    code = code.replace(oldUpload, newUpload);
    fs.writeFileSync('src/pages/ExamManagement.tsx', code);
    console.log("Patched ExamManagement upload");
} else {
    console.log("Failed to patch ExamManagement upload");
}
