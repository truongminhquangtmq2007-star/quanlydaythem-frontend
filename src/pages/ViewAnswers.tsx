import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ViewAnswers = () => {
  const { docId } = useParams();
  const [key, setKey] = useState<any>(null);

  useEffect(() => {
    const fetchKey = async () => {
      try {
        const res = await axios.get(`[https://quanlydaythem-api.onrender.com](https://quanlydaythem-api.onrender.com)/api/exams/key/${docId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setKey(res.data);
      } catch (e) { alert("Không thể tải đáp án"); }
    };
    fetchKey();
  }, [docId]);

  if (!key) return <div style={{padding:'40px', textAlign:'center'}}>Đang tải đáp án...</div>;

  return (
    <div style={{ padding: '40px', backgroundColor: '#f1f5f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <button onClick={() => window.history.back()} style={{ marginBottom: '20px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer' }}>← Quay lại</button>
        <h2 style={{ color: '#1e3a8a', marginBottom: '30px' }}>Đáp án chi tiết đề thi</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* PHẦN 1 */}
          <div style={{ border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 15px 0', color: '#64748b' }}>PHẦN I (Trắc nghiệm)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {Object.entries(key.part1_key || {}).map(([q, ans]) => (
                <div key={q} style={{ display: 'flex', gap: '10px', fontSize: '14px' }}>
                  <span style={{ fontWeight: 'bold' }}>Câu {q}:</span> <span style={{ color: '#10b981', fontWeight: '800' }}>{ans as string}</span>
                </div>
              ))}
            </div>
          </div>
          {/* PHẦN 2 & 3 tương tự... */}
        </div>
      </div>
    </div>
  );
};
export default ViewAnswers;