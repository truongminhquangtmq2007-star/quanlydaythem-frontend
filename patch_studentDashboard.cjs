const fs = require('fs');
let code = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');

const aiEvalComponent = `
      {/* AI EVALUATION SECTION */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>🤖 Đánh giá & Định hướng AI</h2>
        {!data.profile.ai_evaluation || Object.keys(data.profile.ai_evaluation).length === 0 ? (
          <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '15px', border: '1px dashed #93c5fd', color: '#3b82f6', textAlign: 'center', fontWeight: 'bold' }}>
            Chưa có phân tích định kỳ từ giáo viên. Em hãy hoàn thành các bài kiểm tra để hệ thống đánh giá nhé!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {/* Card 1: Strong points */}
            <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '15px', border: '1px solid #bbf7d0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#166534', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>✨ Điểm mạnh & Phát huy</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#15803d', fontSize: '14px', lineHeight: '1.6' }}>
                {Array.isArray(data.profile.ai_evaluation.strong_points) ? data.profile.ai_evaluation.strong_points.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>{data.profile.ai_evaluation.strong_points || 'Không có dữ liệu'}</li>}
              </ul>
            </div>
            
            {/* Card 2: Weak points */}
            <div style={{ backgroundColor: '#fef2f2', padding: '20px', borderRadius: '15px', border: '1px solid #fecaca', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#991b1b', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Cần cải thiện</h3>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#b91c1c', fontSize: '14px', lineHeight: '1.6' }}>
                {Array.isArray(data.profile.ai_evaluation.weak_points) ? data.profile.ai_evaluation.weak_points.map((p: string, i: number) => <li key={i}>{p}</li>) : <li>{data.profile.ai_evaluation.weak_points || 'Không có dữ liệu'}</li>}
              </ul>
            </div>

            {/* Card 3: Attention note */}
            <div style={{ backgroundColor: '#fefce8', padding: '20px', borderRadius: '15px', border: '1px solid #fef08a', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#854d0e', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>💡 Lưu ý kỹ năng</h3>
              <p style={{ margin: 0, color: '#a16207', fontSize: '14px', lineHeight: '1.6' }}>
                {data.profile.ai_evaluation.attention_note || 'Không có lưu ý đặc biệt'}
              </p>
            </div>

            {/* Card 4: Action plan */}
            <div style={{ backgroundColor: '#eff6ff', padding: '20px', borderRadius: '15px', border: '1px solid #bfdbfe', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#1e40af', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>🚀 Mục tiêu & Hành động</h3>
              <p style={{ margin: 0, color: '#1d4ed8', fontSize: '14px', lineHeight: '1.6' }}>
                {data.profile.ai_evaluation.action_plan || 'Chưa có kế hoạch hành động'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* WEAK TOPICS */}
`;

code = code.replace(/\{\/\* WEAK TOPICS \*\/\}/, aiEvalComponent);
fs.writeFileSync('src/pages/StudentDashboard.tsx', code);
console.log('Patched StudentDashboard.tsx');

