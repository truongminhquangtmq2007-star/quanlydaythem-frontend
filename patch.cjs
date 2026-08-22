const fs = require('fs');
let code = fs.readFileSync('src/pages/ExamRoom.tsx', 'utf8');

const replacement = `  const fetchExams = useCallback(async () => {
    try {
      const classId = localStorage.getItem('classId') || '1';
      const resDocs = await axiosClient.get(\`/api/folders/drive?category=EXAM&class_id=\${classId}\`);
      const resScores = await axiosClient.get('/api/exams/my-submissions');
      
      const historyMap: {[key: number]: any[]} = {};
      resScores.data.forEach((s: any) => { 
          if (!historyMap[s.document_id]) historyMap[s.document_id] = [];
          historyMap[s.document_id].push(s);
      });
      
      setExams(resDocs.data.documents || []);
      setMyScores(historyMap);
    } catch (error) { console.error("Lỗi lấy đề thi"); }
  }, []);

  useEffect(() => { if (viewState === 'LIST') fetchExams(); }, [viewState, fetchExams]);

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
  }, [part1Answers, part2Answers, part3Answers]);

  useEffect(() => {
    if (viewState === 'EXAM' && selectedExam) {
      const duration = selectedExam.duration_minutes ? selectedExam.duration_minutes * 60 : 50 * 60;
      setTimeLeft(duration);

      const fetchExamContent = async () => {
        try {
          const res = await axiosClient.get(\`/api/exams/key/\${selectedExam.id}\`);
          if (res.data && res.data.exam_content) {
            setExamData(res.data.exam_content);
          } else {
            alert('Giáo viên chưa cập nhật nội dung chi tiết cho đề thi này!');
            setExamData({ part1: [], part2: [], part3: [], sharedContexts: [] });
          }
        } catch (error) {
          console.error('Lỗi khi tải nội dung đề thi:', error);
          alert('Không thể tải nội dung đề thi. Vui lòng thử lại!');
        }
      };

      fetchExamContent();
    }
  }, [viewState, selectedExam]);`;

const regex = /  const fetchExams = useCallback\(async \(\) => \{\n    try \{\n      const classId = localStorage\.getItem\('classId'\) \|\| '1';[\s\S]*?  \}, \[viewState, selectedExam\]\);/m;

code = code.replace(regex, replacement);
fs.writeFileSync('src/pages/ExamRoom.tsx', code);
console.log("Patched successfully");

