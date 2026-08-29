const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'ExamResult.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const oldStylesStart = "const styles = {";
const startIndex = content.indexOf(oldStylesStart);

if (startIndex !== -1) {
    const nextFunctionIndex = content.indexOf("const renderPart1Review = () => {", startIndex);
    if (nextFunctionIndex !== -1) {
        const newStyles = `const styles = {
      container: { backgroundColor: 'var(--color-background)', minHeight: isTeacherView ? 'auto' : '100vh', paddingBottom: 'var(--spacing-16)' } as React.CSSProperties,
      header: { background: 'var(--color-primary)', padding: 'var(--spacing-8) var(--spacing-6)', color: '#fff', borderRadius: isTeacherView ? '0' : '0 0 var(--radius-xl) var(--radius-xl)' } as React.CSSProperties,
      headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-6)', maxWidth: '1000px', margin: '0 auto var(--spacing-6) auto' } as React.CSSProperties,
      backBtn: { padding: 'var(--spacing-2) var(--spacing-4)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.3)', backgroundColor: 'transparent', color: '#fff', fontWeight: 'var(--font-weight-medium)', cursor: 'pointer', fontSize: 'var(--font-size-sm)', transition: 'all var(--transition-fast)' } as React.CSSProperties,
      scorePanel: { display: 'flex', alignItems: 'center', gap: 'var(--spacing-10)', justifyContent: 'center', flexWrap: 'wrap' as const, maxWidth: '1000px', margin: '0 auto' } as React.CSSProperties,
      bigScore: { textAlign: 'center' as const } as React.CSSProperties,
      bigScoreValue: { fontSize: isTeacherView ? '56px' : '72px', fontWeight: 'var(--font-weight-bold)', lineHeight: 1, textShadow: 'var(--shadow-sm)', color: '#fff' } as React.CSSProperties,
      bigScoreLabel: { fontSize: 'var(--font-size-sm)', color: 'rgba(255,255,255,0.8)', marginTop: 'var(--spacing-1)', fontWeight: 'var(--font-weight-semibold)' } as React.CSSProperties,
      statCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 'var(--spacing-3)', flex: 1, maxWidth: '600px' } as React.CSSProperties,
      statCard: (bg: string) => ({ backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', textAlign: 'center' as const, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--color-border)' }) as React.CSSProperties,
      statValue: { fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--color-text)', margin: 0 } as React.CSSProperties,
      statLabel: { fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-1)', fontWeight: 'var(--font-weight-semibold)' } as React.CSSProperties,
      breakdownContainer: { margin: isTeacherView ? '0' : '-30px auto 0 auto', maxWidth: '1000px', position: 'relative' as const, zIndex: 10 } as React.CSSProperties,
      breakdownCard: { backgroundColor: 'var(--color-surface)', borderRadius: isTeacherView ? '0' : 'var(--radius-lg)', padding: 'var(--spacing-6)', boxShadow: isTeacherView ? 'none' : 'var(--shadow-md)', marginBottom: 'var(--spacing-6)' } as React.CSSProperties,
      breakdownGrid: { display: 'grid', gridTemplateColumns: isEnglishExam ? '1fr' : '1fr 1fr 1fr', gap: 'var(--spacing-4)' } as React.CSSProperties,
      partBox: (color: string) => ({ border: \`1px solid \${color}\`, borderRadius: 'var(--radius-md)', padding: 'var(--spacing-4)', textAlign: 'center' as const, backgroundColor: 'var(--color-surface)' }) as React.CSSProperties,
      reviewCard: { maxWidth: '1000px', margin: '0 auto', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-8)', boxShadow: 'var(--shadow-sm)', marginBottom: 'var(--spacing-8)' } as React.CSSProperties,
      sectionTitle: { color: 'var(--color-primary)', fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-bold)', borderBottom: '2px solid var(--color-primary)', paddingBottom: 'var(--spacing-2)', marginBottom: 'var(--spacing-6)', marginTop: 'var(--spacing-8)' } as React.CSSProperties,
      questionBox: { marginBottom: 'var(--spacing-6)', clear: 'both' as const, borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--spacing-6)' } as React.CSSProperties,
      questionText: { fontWeight: 'var(--font-weight-medium)', marginBottom: 'var(--spacing-4)', lineHeight: '1.6', fontSize: 'var(--font-size-base)', color: 'var(--color-text)' } as React.CSSProperties,
      optionsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-3)' } as React.CSSProperties,
    };`;
        
        const cmtIdx = content.lastIndexOf("// ===", nextFunctionIndex);
        content = content.substring(0, startIndex) + newStyles + "\n  " + content.substring(cmtIdx);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("ExamResult styles rewritten successfully!");
    } else {
        console.error("next function not found");
    }
}

