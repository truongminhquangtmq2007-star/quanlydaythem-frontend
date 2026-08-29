import React from 'react';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';

const FinancialManagement = () => {
  return (
    <div style={{ padding: 'var(--spacing-10)', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 var(--spacing-5) 0', fontSize: '30px', color: 'var(--color-text)' }}>💰 Quản lý Tài chính</h1>
      <Card>
        <EmptyState title="Tính năng đang phát triển" description="Tính năng Quản lý Tài chính sẽ sớm được ra mắt trong các phiên bản tiếp theo." />
      </Card>
    </div>
  );
};

export default FinancialManagement;
