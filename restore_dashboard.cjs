const fs = require('fs');

let code = fs.readFileSync('src/pages/StudentDashboard.tsx', 'utf8');

const missingSections = `
      {/* LỊCH HỌC SẮP TỚI */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>📅 Lịch học sắp tới</h2>
        {(!data.upcomingSessions || data.upcomingSessions.length === 0) ? (
          <div style={{ color: '#94a3b8' }}>Không có lịch học nào sắp tới.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {data.upcomingSessions.map((session: any, idx: number) => (
              <div key={idx} style={{ padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                <div style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '10px' }}>
                  {new Date(session.session_date).toLocaleDateString('vi-VN')}
                </div>
                <div style={{ color: '#475569', fontSize: '14px' }}>
                  Lớp: <strong>{session.class_name}</strong>
                </div>
                <div style={{ color: '#475569', fontSize: '14px', marginTop: '5px' }}>
                  🕒 {session.start_time} - {session.end_time || '19:30'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ĐỀ THI / BÀI TẬP */}
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '30px' }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>📝 Đề thi & Bài tập gần đây</h2>
        {(!data.assignments || data.assignments.length === 0) ? (
          <div style={{ color: '#94a3b8' }}>Không có bài tập/đề thi nào.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {data.assignments.map((assignment: any, idx: number) => (
              <div key={idx} style={{ padding: '20px', borderRadius: '15px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '5px', fontSize: '16px' }}>{assignment.title}</div>
                  <div style={{ color: '#64748b', fontSize: '14px' }}>Lớp: {assignment.class_name}</div>
                </div>
                <div>
                  {assignment.score !== null && assignment.score !== undefined ? (
                    <span style={{ fontWeight: 'bold', color: '#10b981', fontSize: '18px' }}>{assignment.score} điểm</span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: 'bold' }}>Chưa làm</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
`;

code = code.replace('{/* WEAK TOPICS */}', missingSections + '\n      {/* WEAK TOPICS */}');

fs.writeFileSync('src/pages/StudentDashboard.tsx', code);
console.log('Restored sections in StudentDashboard.tsx');

