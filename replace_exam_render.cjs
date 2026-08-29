const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ExamRoom.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add imports at the top
content = content.replace(
  "import ExamResult from './ExamResult';",
  "import ExamResult from './ExamResult';\nimport { ExamList } from '../components/exam/ExamList';\nimport { ExamConfirm } from '../components/exam/ExamConfirm';\nimport { ExamHeader } from '../components/exam/ExamHeader';\nimport { QuestionNavigator } from '../components/exam/QuestionNavigator';\nimport { SubmitConfirmModal } from '../components/exam/SubmitConfirmModal';\nimport { Button } from '../components/ui/Button';"
);

// 2. We will cut the file right before VIEW 1
const view1Str = "// ================= VIEW 1:";
const splitIndex = content.indexOf(view1Str);

if (splitIndex === -1) {
    console.error("Could not find VIEW 1 marker");
    process.exit(1);
}

const newRenderCode = `  // ================= VIEW 1: DANH SÁCH ĐỀ =================
  if (viewState === 'LIST') {
    return (
      <ExamList 
        exams={exams} 
        myScores={myScores} 
        onBack={() => navigate(-1)} 
        onSelectExam={(doc) => {
          setSelectedExam(doc);
          setViewState('CONFIRM');
        }} 
      />
    );
  }

  // ================= VIEW 2: CONFIRM =================
  if (viewState === 'CONFIRM') {
    return (
      <ExamConfirm 
        selectedExam={selectedExam} 
        onCancel={() => {
          setSelectedExam(null);
          setViewState('LIST');
        }} 
        onConfirm={() => {
          setViewState('EXAM');
        }} 
      />
    );
  }

  // ================= VIEW 4: RESULT =================
  if (viewState === 'RESULT') {
    return (
      <ExamResult 
        scoreData={examScore} 
        examId={selectedExam?.id} 
        onClose={() => {
          setViewState('LIST');
          setSelectedExam(null);
          setExamScore(null);
          setGradingResult(null);
          // reset answers
          setPart1Answers({});
          setPart2Answers({});
          setPart3Answers({});
          fetchExams();
        }}
        gradingResult={gradingResult}
      />
    );
  }

  // ================= VIEW 3: EXAM ROOM (DISTRACTION FREE) =================
  if (viewState === 'EXAM') {
    
    // We keep the old render style logic here for questions, but wrap it in the new layout
    const examStyles = {
      sectionTitle: { fontSize: 'var(--font-size-lg)', fontWeight: 'bold', color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-4)', marginTop: 'var(--spacing-8)' },
      questionBox: { backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--spacing-6)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' },
      questionText: { fontSize: \`\${fontSize}px\`, marginBottom: 'var(--spacing-4)', lineHeight: 1.6 },
      optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-3)' },
      optionItem: (selected: boolean) => ({
        padding: 'var(--spacing-3)', borderRadius: 'var(--radius-md)', border: selected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', backgroundColor: selected ? 'var(--color-primary-soft)' : 'var(--color-surface)', cursor: 'pointer', display: 'flex', gap: 'var(--spacing-3)', transition: 'all var(--transition-fast)'
      }),
      radioCircle: (selected: boolean) => ({
        width: '20px', height: '20px', minWidth: '20px', borderRadius: '50%', border: selected ? '6px solid var(--color-primary)' : '2px solid var(--color-border)', backgroundColor: '#fff', transition: 'all 0.2s'
      }),
      tfTable: { width: '100%', borderCollapse: 'collapse' as const, marginTop: 'var(--spacing-3)' },
      tfCell: { padding: 'var(--spacing-3)', borderBottom: '1px solid var(--color-border)', fontSize: \`\${fontSize - 1}px\` }
    };

    const answeredCount = Object.keys(part1Answers).length 
      + Object.keys(part2Answers).reduce((acc, qId) => acc + Object.keys(part2Answers[Number(qId)]).length, 0) 
      + Object.keys(part3Answers).length;
      
    // Count total required sub-questions
    let totalQ = 0;
    if (examData?.part1) totalQ += examData.part1.length;
    if (examData?.part2) {
      examData.part2.forEach((q: any) => {
        totalQ += (q.sub_questions?.length || 4);
      });
    }
    if (examData?.part3) totalQ += examData.part3.length;

    const allQuestions = [
      ...(examData?.part1 || []),
      ...(examData?.part2 || []),
      ...(examData?.part3 || [])
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background)', overflow: 'hidden' }}>
        <ExamHeader 
          title={selectedExam?.title || 'Đang thi'} 
          duration={selectedExam?.duration_minutes || 50} 
          saveStatus={saveStatus}
          isSubmitting={isSubmitting}
          timeLeft={timeLeft}
          onExit={() => {
            if (window.confirm("Bạn có chắc chắn muốn thoát? Kết quả có thể không được lưu đầy đủ.")) {
               setViewState('LIST');
            }
          }}
        />

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* LEFT: CONTENT */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-8)' }} id="exam-scroll-area">
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)', backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>Cỡ chữ:</span>
                  <button onClick={() => setFontSize(f => Math.max(14, f - 2))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>A-</button>
                  <span style={{ fontWeight: 'bold' }}>{fontSize}px</span>
                  <button onClick={() => setFontSize(f => Math.min(24, f + 2))} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '18px' }}>A+</button>
                </div>
              </div>

              {!examData ? (
                 <div className="text-center text-muted">Đang tải đề thi...</div>
              ) : (
                <>
                  {/* PART 1 */}
                  {examData.part1 && examData.part1.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-10)' }}>
                      <div style={examStyles.sectionTitle}>PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN</div>
                      {examData.part1.map((q: any) => {
                        const ctx = findContext(q.id);
                        return (
                          <React.Fragment key={q.id}>
                            {ctx && (
                              <div style={{ marginBottom: 'var(--spacing-2)' }}>
                                <Button variant="secondary" size="sm" onClick={() => setActiveContext(ctx)}>
                                  Xem dữ liệu chung (Context)
                                </Button>
                              </div>
                            )}
                            <div id={\`q-\${q.id}\`} style={examStyles.questionBox} onMouseEnter={() => setActiveContext(findContext(q.id))}>
                              {q.image_url && <ImageBlock url={q.image_url} />}
                              <div style={examStyles.questionText}>
                                <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                              </div>
                              <div style={examStyles.optionsGrid}>
                                {['A', 'B', 'C', 'D'].map((opt) => (
                                  <div key={opt} style={examStyles.optionItem(part1Answers[q.id] === opt)} onClick={() => setPart1Answers({ ...part1Answers, [q.id]: opt })}>
                                    <div style={examStyles.radioCircle(part1Answers[q.id] === opt)}></div>
                                    <div><strong>{opt}.</strong> {renderContent(q.options[opt])}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* PART 2 */}
                  {examData.part2 && examData.part2.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-10)' }}>
                      <div style={examStyles.sectionTitle}>PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG/SAI</div>
                      {examData.part2.map((q: any) => {
                        const ctx = findContext(q.id);
                        return (
                          <React.Fragment key={q.id}>
                            {ctx && (
                              <div style={{ marginBottom: 'var(--spacing-2)' }}>
                                <Button variant="secondary" size="sm" onClick={() => setActiveContext(ctx)}>
                                  Xem dữ liệu chung (Context)
                                </Button>
                              </div>
                            )}
                            <div id={\`q-\${q.id}\`} style={examStyles.questionBox} onMouseEnter={() => setActiveContext(findContext(q.id))}>
                              {q.image_url && <ImageBlock url={q.image_url} />}
                              <div style={examStyles.questionText}>
                                <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                              </div>
                              <table style={examStyles.tfTable}>
                                <thead>
                                  <tr>
                                    <th style={{ textAlign: 'left', padding: 'var(--spacing-3)', borderBottom: '2px solid var(--color-border)' }}>Phát biểu</th>
                                    <th style={{ width: '60px', textAlign: 'center', padding: 'var(--spacing-3)', borderBottom: '2px solid var(--color-border)' }}>Đúng</th>
                                    <th style={{ width: '60px', textAlign: 'center', padding: 'var(--spacing-3)', borderBottom: '2px solid var(--color-border)' }}>Sai</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {q.statements && Object.keys(q.statements).map((stmt) => {
                                    const currentAns = part2Answers[q.id]?.[stmt];
                                    return (
                                      <tr key={stmt}>
                                        <td style={examStyles.tfCell}><strong>{stmt})</strong> {renderContent(q.statements[stmt])}</td>
                                        <td style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                          <div 
                                            onClick={() => setPart2Answers({ ...part2Answers, [q.id]: { ...part2Answers[q.id], [stmt]: 'Đ' } })}
                                            style={{ margin: '0 auto', cursor: 'pointer', ...examStyles.radioCircle(currentAns === 'Đ') }}></div>
                                        </td>
                                        <td style={{ textAlign: 'center', borderBottom: '1px solid var(--color-border)' }}>
                                          <div 
                                            onClick={() => setPart2Answers({ ...part2Answers, [q.id]: { ...part2Answers[q.id], [stmt]: 'S' } })}
                                            style={{ margin: '0 auto', cursor: 'pointer', ...examStyles.radioCircle(currentAns === 'S') }}></div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}

                  {/* PART 3 */}
                  {examData.part3 && examData.part3.length > 0 && (
                    <div style={{ marginBottom: 'var(--spacing-10)' }}>
                      <div style={examStyles.sectionTitle}>PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN</div>
                      {examData.part3.map((q: any) => {
                        const ctx = findContext(q.id);
                        return (
                          <React.Fragment key={q.id}>
                            {ctx && (
                              <div style={{ marginBottom: 'var(--spacing-2)' }}>
                                <Button variant="secondary" size="sm" onClick={() => setActiveContext(ctx)}>
                                  Xem dữ liệu chung (Context)
                                </Button>
                              </div>
                            )}
                            <div id={\`q-\${q.id}\`} style={examStyles.questionBox} onMouseEnter={() => setActiveContext(findContext(q.id))}>
                              {q.image_url && <ImageBlock url={q.image_url} />}
                              <div style={examStyles.questionText}>
                                <strong>Câu {q.id}. </strong>{renderContent(q.questionText)}
                              </div>
                              <input 
                                type="text"
                                className="input-base"
                                placeholder="Nhập câu trả lời của bạn..."
                                value={part3Answers[q.id] || ''}
                                onChange={(e) => setPart3Answers({ ...part3Answers, [q.id]: e.target.value })}
                                style={{ marginTop: 'var(--spacing-3)', fontSize: \`\${fontSize}px\` }}
                              />
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* RIGHT: NAVIGATOR */}
          <QuestionNavigator 
            questions={allQuestions}
            part1Answers={part1Answers}
            part2Answers={part2Answers}
            part3Answers={part3Answers}
            onScrollToQuestion={(qId) => {
              const el = document.getElementById(\`q-\${qId}\`);
              if (el) {
                const container = document.getElementById('exam-scroll-area');
                if (container) {
                   container.scrollTo({ top: el.offsetTop - 20, behavior: 'smooth' });
                }
              }
            }}
            onSubmitClick={() => setShowCheatModal(true)} 
          />
        </div>

        {/* MODALS */}
        <SubmitConfirmModal 
          isOpen={showCheatModal && !cheatReason} 
          onClose={() => setShowCheatModal(false)}
          onSubmit={handleSubmit}
          totalQuestions={totalQ}
          answeredCount={answeredCount}
          isSubmitting={isSubmitting}
        />

        {/* CHEAT MODAL OVERRIDE (If actually cheating) */}
        {showCheatModal && cheatReason && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'var(--color-surface)', padding: 'var(--spacing-8)', borderRadius: 'var(--radius-lg)', textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--spacing-4)' }}>🚨</div>
              <h2 style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-4)' }}>CẢNH BÁO GIAN LẬN!</h2>
              <p style={{ marginBottom: 'var(--spacing-6)' }}>{cheatReason}</p>
              <Button variant="danger" onClick={handleSubmit} isLoading={isSubmitting}>Nộp bài bắt buộc</Button>
            </div>
          </div>
        )}

        {/* ACTIVE CONTEXT DRAWER */}
        {activeContext && (
          <div style={{ position: 'fixed', bottom: 'var(--spacing-6)', left: 'var(--spacing-6)', width: '400px', backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-primary)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-6)', boxShadow: 'var(--shadow-lg)', zIndex: 9000 }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
               <h4 style={{ margin: 0, color: 'var(--color-primary)' }}>Dữ liệu chung</h4>
               <Button variant="ghost" size="sm" onClick={() => setActiveContext(null)}>Đóng</Button>
             </div>
             <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: \`\${fontSize - 1}px\` }}>
               {activeContext.image_url && <img src={activeContext.image_url} alt="Context" style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: 'var(--spacing-3)' }} />}
               <div>{renderContent(activeContext.content)}</div>
             </div>
          </div>
        )}

      </div>
    );
  }

  return null;
};

export default ExamRoom;
`;

const finalContent = content.substring(0, splitIndex) + newRenderCode;

fs.writeFileSync(filePath, finalContent, 'utf8');
console.log("ExamRoom rewritten successfully!");

