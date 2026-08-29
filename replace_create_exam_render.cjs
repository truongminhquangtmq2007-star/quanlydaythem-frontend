const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'CreateExamAI.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Ensure we have imports
content = content.replace(
  "import { toast } from 'react-toastify';",
  "import { toast } from 'react-toastify';\nimport { Wizard } from '../components/ui/Wizard';\nimport { Input } from '../components/ui/Input';\nimport { Button } from '../components/ui/Button';\nimport { Card } from '../components/ui/Card';"
);

// We need a small state for Wizard step
const stateSearchStr = "const [jsonError, setJsonError] = useState<string>('');";
content = content.replace(stateSearchStr, stateSearchStr + "\n  const [currentStep, setCurrentStep] = useState(0);");

// The main render starts at "  return (\n    <div style={styles.container}>"
const searchStr = "return (\n    <div style={styles.container}>";
let splitIndex = content.indexOf(searchStr);

if (splitIndex === -1) {
    // try removing newlines
    splitIndex = content.indexOf("return (", content.indexOf("const handleSaveJson = "));
    if (splitIndex === -1) {
      console.error("Could not find main return statement");
      process.exit(1);
    }
}

const newRender = `return (
    <div style={{ padding: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: 'var(--spacing-6)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)' }}>
        <span style={{ fontSize: '32px' }}>✨</span> Tạo Đề Thi Với AI
      </h1>
      
      {isLoading ? (
        <Card style={{ padding: 'var(--spacing-10)', textAlign: 'center' }}>
          <div className="spinner" style={{ fontSize: '48px', color: 'var(--color-primary)', margin: '0 auto var(--spacing-6) auto' }}></div>
          <h2 style={{ color: 'var(--color-primary)' }}>{loadingMessage || 'AI đang phân tích đề thi...'}</h2>
          <p className="text-secondary">Quá trình này có thể mất từ 1 - 3 phút. Vui lòng không đóng trình duyệt.</p>
        </Card>
      ) : (
        <Wizard
          currentStep={currentStep}
          onNext={() => {
            if (currentStep === 1) {
              // Note: the old code uses handleParseExam(), let's map that
              handleParseExam();
              setCurrentStep(2);
            } else if (currentStep === 2) { 
              // Go to submit
            } else {
              setCurrentStep(c => c + 1);
            }
          }}
          onPrev={() => setCurrentStep(c => c - 1)}
          onSubmit={handleSubmit}
          isSubmitting={isLoading}
          submitLabel="Lưu & Xuất bản"
          steps={[
            {
              id: 'config',
              label: 'Cấu hình chung',
              isValid: !!examTitle && !!classId,
              content: (
                <div className="flex flex-col gap-6">
                  <Input 
                    label="Tên đề thi"
                    placeholder="VD: Đề thi Giữa kỳ Hóa 12"
                    value={examTitle}
                    onChange={(e) => setExamTitle(e.target.value)}
                    required
                  />
                  <div className="flex flex-col gap-2">
                    <label style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Lớp học <span style={{color: 'var(--color-danger)'}}>*</span></label>
                    <select 
                      className="input-base"
                      value={classId} 
                      onChange={(e) => setClassId(e.target.value)} 
                      required
                    >
                      <option value="">-- Chọn lớp học --</option>
                      {classOptions.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.class_name}</option>
                      ))}
                    </select>
                  </div>
                  <Input 
                    label="Thời gian thi (Phút)"
                    type="number"
                    value={duration as any}
                    onChange={(e) => setDuration(e.target.value)}
                    required
                  />
                </div>
              )
            },
            {
              id: 'source',
              label: 'Nguồn đề thi',
              isValid: inputMode === 'text' ? !!rawText : !!selectedFile,
              content: (
                <div className="flex flex-col gap-6">
                  <div style={{ display: 'flex', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-2)' }}>
                    <Button variant={inputMode === 'text' ? 'primary' : 'outline'} onClick={() => setInputMode('text')} style={{ flex: 1 }}>Nhập văn bản (Text)</Button>
                    <Button variant={inputMode === 'file' ? 'primary' : 'outline'} onClick={() => setInputMode('file')} style={{ flex: 1 }}>Tải lên File (PDF, DOCX)</Button>
                  </div>
                  
                  {inputMode === 'text' ? (
                    <div className="flex flex-col gap-2">
                      <label style={{ fontWeight: 'var(--font-weight-medium)', fontSize: 'var(--font-size-sm)' }}>Nội dung văn bản</label>
                      <textarea 
                        className="input-base"
                        rows={10} 
                        placeholder="Dán nội dung câu hỏi vào đây (Hỗ trợ định dạng LaTeX)..."
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </div>
                  ) : (
                    <div style={{ padding: 'var(--spacing-10)', border: '2px dashed var(--color-border)', borderRadius: 'var(--radius-lg)', textAlign: 'center', backgroundColor: 'var(--color-surface-hover)' }}>
                       <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)' }}>📄</div>
                       <input 
                         type="file" 
                         accept=".pdf,.docx,.png,.jpg,.jpeg" 
                         onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                         id="file-upload"
                         style={{ display: 'none' }}
                       />
                       <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'inline-flex', padding: 'var(--spacing-2) var(--spacing-4)', backgroundColor: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 'var(--font-weight-medium)' }}>
                         Chọn tệp tải lên
                       </label>
                       {selectedFile && <p style={{ marginTop: 'var(--spacing-4)', color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)' }}>Đã chọn: {selectedFile.name}</p>}
                       <p className="text-secondary" style={{ marginTop: 'var(--spacing-4)', fontSize: 'var(--font-size-sm)' }}>Hỗ trợ PDF, DOCX, Ảnh (tối đa 10MB)</p>
                    </div>
                  )}
                  {error && <p style={{ color: 'var(--color-danger)' }}>{error}</p>}
                </div>
              )
            },
            {
              id: 'preview',
              label: 'Kiểm tra & Cấu trúc',
              isValid: !!editContent,
              content: (
                <div className="flex flex-col gap-4">
                  {!editContent ? (
                    <div className="text-center text-muted" style={{ padding: 'var(--spacing-8)' }}>Chưa có dữ liệu. Vui lòng quay lại bước Nguồn đề thi và tiếp tục để AI phân tích.</div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-success-soft)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)' }}>
                         <div style={{ color: 'var(--color-success)', fontWeight: 'var(--font-weight-bold)' }}>✅ Phân tích thành công!</div>
                         <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                            <Button variant="outline" size="sm" onClick={() => { setJsonString(JSON.stringify(editContent, null, 2)); }}>Sửa JSON Nội dung</Button>
                         </div>
                      </div>

                      <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: 'var(--spacing-4)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-surface)' }}>
                        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 'var(--font-size-sm)', fontFamily: 'monospace', margin: 0 }}>
                          {JSON.stringify(editContent, null, 2)}
                        </pre>
                      </div>

                      {(jsonString !== '') && (
                        <div style={{ marginTop: 'var(--spacing-6)' }}>
                          <h3 style={{ marginBottom: 'var(--spacing-2)' }}>Chỉnh sửa JSON</h3>
                          <textarea 
                            className="input-base"
                            rows={15}
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                            style={{ fontFamily: 'monospace', fontSize: '13px' }}
                          />
                          {jsonError && <p style={{ color: 'var(--color-danger)', marginTop: 'var(--spacing-2)' }}>{jsonError}</p>}
                          <div style={{ display: 'flex', gap: 'var(--spacing-2)', marginTop: 'var(--spacing-4)' }}>
                            <Button variant="primary" onClick={handleSaveJson}>Lưu thay đổi</Button>
                            <Button variant="ghost" onClick={() => { setJsonString(''); }}>Hủy</Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            }
          ]}
        />
      )}
    </div>
  );
};

export default CreateExamAI;
`;

const finalContent = content.substring(0, splitIndex) + newRender;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("CreateExamAI rewritten successfully!");

