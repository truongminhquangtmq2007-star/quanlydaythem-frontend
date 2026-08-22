const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

// 1. Add saveStatus state
code = code.replace(
  "const [isSubmitting, setIsSubmitting] = useState<boolean>(false);",
  "const [isSubmitting, setIsSubmitting] = useState<boolean>(false);\n  const [saveStatus, setSaveStatus] = useState<string>('');"
);

// 2. Add startExam and auto-save useEffects
const fetchExamsEndRegex = /  useEffect\(\(\) => \{ if \(viewState === 'LIST'\) fetchExams\(\); \}, \[viewState, fetchExams\]\);/g;
const inserts = `  useEffect(() => { if (viewState === 'LIST') fetchExams(); }, [viewState, fetchExams]);

  const startExam = async () => {
    setPart1Answers({});
    setPart2Answers({});
    setPart3Answers({});
    setCheatWarnings(0);
    setGradingResult(null);
    setExamScore(null);
    elapsedTimeRef.current = 0;
    setSaveStatus('');
    try {
      const res = await axiosClient.get(\`/api/exams/\${selectedExam.id}/draft\`);
      if (res.data && res.data.draft) {
        const draft = res.data.draft;
        const answers = typeof draft.student_answers === 'string' ? JSON.parse(draft.student_answers) : draft.student_answers;
        if (answers) {
          if (answers.part1) setPart1Answers(answers.part1);
          if (answers.part2) setPart2Answers(answers.part2);
          if (answers.part3) setPart3Answers(answers.part3);
        }
        if (draft.time_taken_seconds) {
          elapsedTimeRef.current = draft.time_taken_seconds;
        }
        if (draft.last_saved_at) {
          const dt = new Date(draft.last_saved_at);
          setSaveStatus(\`Đã khôi phục nháp lúc \${dt.getHours()}:\${dt.getMinutes() < 10 ? '0' : ''}\${dt.getMinutes()}\`);
        }
      }
    } catch (error) {
      console.error('Lỗi lấy nháp', error);
    }
    setViewState('EXAM');
  };

  useEffect(() => {
    if (viewState !== 'EXAM' || isSubmitting || !selectedExam) return;

    setSaveStatus('Đang lưu...');
    const timer = setTimeout(async () => {
      try {
        await axiosClient.post(\`/api/exams/\${selectedExam.id}/draft\`, {
          answers: { part1: part1Answers, part2: part2Answers, part3: part3Answers },
          time_taken_seconds: elapsedTimeRef.current
        });
        const now = new Date();
        setSaveStatus(\`Đã lưu lúc \${now.getHours()}:\${now.getMinutes() < 10 ? '0' : ''}\${now.getMinutes()}\`);
      } catch (error) {
        setSaveStatus('Lỗi kết nối. Đang thử lưu lại...');
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [part1Answers, part2Answers, part3Answers]);`;

code = code.replace(fetchExamsEndRegex, inserts);

// 3. Replace the old start exam logic in the CONFIRM view with startExam
const oldConfirmBtnRegex = /<button onClick=\{\(\) => \{ setPart1Answers\(\{\}\); setPart2Answers\(\{\}\); setPart3Answers\(\{\}\); setCheatWarnings\(0\); setGradingResult\(null\); setExamScore\(null\); elapsedTimeRef\.current = 0; setViewState\('EXAM'\); \}\} style=\{\{ padding: '12px 25px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' \}\}>Bắt đầu thi<\/button>/g;
code = code.replace(oldConfirmBtnRegex, `<button onClick={startExam} style={{ padding: '12px 25px', backgroundColor: '#1e40af', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>Bắt đầu thi</button>`);

// 4. Add saveStatus UI to the EXAM view header
const headerTarget = `          <div style={examStyles.timer}>
            <span>⏱</span> {formatTime(timeLeft)}
          </div>`;
const newHeader = `          <div style={{...examStyles.timer, gap: '15px', display: 'flex'}}>
            <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: 'normal' }}>{saveStatus}</span>
            <span>
              <span>⏱</span> {formatTime(timeLeft)}
            </span>
          </div>`;
code = code.replace(headerTarget, newHeader);

// 5. Remove console.log KATEX RAW if it's there
code = code.replace(/\/\/ DEBUG: xem chính xác từng ký tự KaTeX nhận được[\s\S]*?\}\)\)\n    \);/m, "");

fs.writeFileSync('src/pages/ExamRoom.tsx', code);
console.log("Patched correctly");
