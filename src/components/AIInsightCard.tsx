import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EmptyState } from './ui/EmptyState';
import axiosClient from '../api/axiosClient';

const AIInsightCard: React.FC = () => {
    const [insight, setInsight] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [generating, setGenerating] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchLatestInsight = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/api/student/ai-insights');
            setInsight(res.data.data);
            setError(null);
        } catch (err: any) {
            if (err.response?.status !== 404) {
                console.error("Error fetching AI insight", err);
            }
            setInsight(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLatestInsight();
    }, []);

    const generateInsight = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await axiosClient.post('/api/student/ai-insights/generate');
            setInsight(res.data.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Không thể phân tích lúc này. Vui lòng thử lại.');
        } finally {
            setGenerating(false);
        }
    };

    if (loading) {
        return (
            <Card style={{ padding: 'var(--space-card-padding)' }}>
                <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span>✨</span> Phân tích tiến độ của tôi
                </h2>
                <div style={{ height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p className="text-secondary">Đang tải dữ liệu...</p>
                </div>
            </Card>
        );
    }

    if (!insight && !generating) {
        return (
            <Card style={{ padding: 'var(--space-card-padding)' }}>
                <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span>✨</span> Phân tích tiến độ của tôi
                </h2>
                {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-4)' }}>{error}</div>}
                <EmptyState 
                    title="Chưa có phân tích" 
                    description="AI sẽ phân tích kết quả bài kiểm tra và chuyên cần của bạn để đưa ra định hướng học tập." 
                    icon="✨" 
                    action={<Button onClick={generateInsight}>✨ Bắt đầu Phân tích</Button>}
                />
            </Card>
        );
    }

    if (generating) {
        return (
            <Card style={{ padding: 'var(--space-card-padding)' }}>
                <h2 style={{ marginBottom: 'var(--spacing-4)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span>✨</span> Phân tích tiến độ của tôi
                </h2>
                <div style={{ height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-3)' }}>
                    <div className="spinner" style={{ width: '30px', height: '30px', border: '3px solid var(--color-primary-soft)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <p className="text-primary" style={{ fontWeight: 'var(--font-weight-medium)' }}>Đang phân tích tiến độ...</p>
                </div>
            </Card>
        );
    }

    const { insight: aiData, generated_at } = insight;

    return (
        <Card style={{ padding: 'var(--space-card-padding)', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-4)' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                    <span>✨</span> Phân tích tiến độ của tôi
                </h2>
                <Button variant="ghost" size="sm" onClick={generateInsight} disabled={generating}>
                    ↻ Phân tích lại
                </Button>
            </div>

            {error && <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--spacing-4)' }}>{error}</div>}

            <div style={{ marginBottom: 'var(--spacing-4)' }}>
                <h3 style={{ fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)', marginBottom: 'var(--spacing-2)' }}>{aiData.headline}</h3>
                <p style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>{aiData.summary}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-4)', marginBottom: 'var(--spacing-4)' }}>
                <div style={{ backgroundColor: 'var(--color-surface-hover)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ color: 'var(--color-text)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span>📈</span> Quan sát tiến độ
                    </h4>
                    <ul style={{ paddingLeft: 'var(--spacing-4)', margin: 0, color: 'var(--color-secondary)' }}>
                        {aiData.progress_observations?.map((obs: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: 'var(--spacing-1)' }}>{obs}</li>
                        ))}
                    </ul>
                </div>
                
                <div style={{ backgroundColor: 'var(--color-success-soft)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ color: 'var(--color-success)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span>🌟</span> Điểm mạnh
                    </h4>
                    <ul style={{ paddingLeft: 'var(--spacing-4)', margin: 0, color: 'var(--color-text)' }}>
                        {aiData.strengths?.map((str: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: 'var(--spacing-1)' }}>{str}</li>
                        ))}
                    </ul>
                </div>

                <div style={{ backgroundColor: 'var(--color-warning-soft)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ color: 'var(--color-warning)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span>🎯</span> Cần tập trung
                    </h4>
                    <ul style={{ paddingLeft: 'var(--spacing-4)', margin: 0, color: 'var(--color-text)' }}>
                        {aiData.focus_areas?.map((focus: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: 'var(--spacing-1)' }}>{focus}</li>
                        ))}
                    </ul>
                </div>

                <div style={{ backgroundColor: 'var(--color-info-soft)', padding: 'var(--spacing-4)', borderRadius: 'var(--radius-md)', gridColumn: '1 / -1' }}>
                    <h4 style={{ color: 'var(--color-info)', marginBottom: 'var(--spacing-2)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-2)' }}>
                        <span>🚀</span> Hướng đi tiếp theo
                    </h4>
                    <ul style={{ paddingLeft: 'var(--spacing-4)', margin: 0, color: 'var(--color-text)' }}>
                        {aiData.next_steps?.map((step: string, idx: number) => (
                            <li key={idx} style={{ marginBottom: 'var(--spacing-1)' }}>{step}</li>
                        ))}
                        {aiData.upcoming_focus?.map((focus: string, idx: number) => (
                            <li key={`up-${idx}`} style={{ marginBottom: 'var(--spacing-1)', fontWeight: 'var(--font-weight-medium)' }}>{focus}</li>
                        ))}
                    </ul>
                </div>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-secondary)', textAlign: 'right' }}>
                Cập nhật lần cuối: {new Date(generated_at).toLocaleString('vi-VN')}
            </div>
        </Card>
    );
};

export default AIInsightCard;

