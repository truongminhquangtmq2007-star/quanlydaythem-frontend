const fs = require('fs');
let code = fs.readFileSync('src/pages/ClassDetail.tsx', 'utf8');

// The assignment map render expects `a.title`, `a.document_type`, `a.document_title`, `a.created_at`, `a.due_at`, `a.file_url`.
// Since we fetch assignable-documents, we get `a.title` (document title), `a.category` (document type), `a.created_at`, `a.file_url`.
code = code.replace(
  "{a.document_type}",
  "{a.category || 'Tài liệu'}"
);

code = code.replace(
  "{a.document_title}",
  "{a.folder_name ? `Thư mục: \${a.folder_name}` : 'Không có thư mục'}"
);

// We need to change how `assignments` is set
code = code.replace(
  "const assignRes = await axiosClient.get(`/api/classes/${id}/assignments`);\n        setAssignments(assignRes.data);",
  "const assignRes = await axiosClient.get(`/api/classes/${id}/assignable-documents`);\n        setAssignments(assignRes.data.filter((d: any) => d.folder_class_id === Number(id)));"
);

fs.writeFileSync('src/pages/ClassDetail.tsx', code);
console.log("Patched ClassDetail.tsx render");

