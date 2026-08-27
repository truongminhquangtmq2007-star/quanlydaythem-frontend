const fs = require('fs');
let code = fs.readFileSync('src/pages/CreateExamAI.tsx', 'utf8');

const targetRegex = /if\s*\(\s*response\?\.data\?\.status === 'success'\s*\)\s*\{[\s\S]*?else\s*\{\s*setIsLoading\(false\);\s*toast\.error\("Không nhận được dữ liệu hợp lệ từ AI\."\);\s*\}\s*\}/;

const newCode = `const responseData = response?.data?.status === 'success' ? response.data.data : response?.data;
      if (responseData && responseData.examContent) {
        const content = responseData.examContent;
        if (!content.sharedContexts) content.sharedContexts = [];
        
        const finalTitle = examTitle || \`Đề thi AI - Lớp \${classOptions.find((c: any) => c.id == classId)?.class_name || 'Mới'}\`;
        const finalGrade = classOptions.find((c: any) => c.id == classId)?.grade || '12';
        const finalSubject = classOptions.find((c: any) => c.id == classId)?.subject || 'Chung';

        const meta = {
            document_id: responseData.document_id || 0,
            title: finalTitle,
            grade: finalGrade,
            subject: finalSubject,
            duration_minutes: Number(duration)
        };
        
        // Chuyển hướng sang màn hình ExamEditor (Phase 3)
        navigate('/exam-editor', { state: { examContent: content, meta } });
      } else {
        toast.error("Không nhận được dữ liệu hợp lệ từ AI.");
      }`;

if (code.match(targetRegex)) {
    code = code.replace(targetRegex, newCode);
    fs.writeFileSync('src/pages/CreateExamAI.tsx', code);
    console.log("Successfully restored navigate to /exam-editor");
} else {
    console.log("Failed to match targetRegex");
}
