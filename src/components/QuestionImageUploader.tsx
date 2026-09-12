import React from 'react';

export interface QuestionImageUploaderProps {
  part: 'part1' | 'part2' | 'part3';
  index: number;
  imageUrl?: string;
  onUpload: (part: 'part1' | 'part2' | 'part3', index: number, e: React.ChangeEvent<HTMLInputElement>) => void | Promise<void>;
  onRemove?: (part: 'part1' | 'part2' | 'part3', index: number) => void;
  isUploading?: boolean;
}

export const QuestionImageUploader: React.FC<QuestionImageUploaderProps> = ({
  part,
  index,
  imageUrl,
  onUpload,
  onRemove,
  isUploading = false,
}) => {
  const inputId = `upload-img-${part}-${index}`;

  return (
    <div style={{ marginTop: 'var(--spacing-2, 8px)', marginBottom: 'var(--spacing-3, 12px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-2, 8px)', flexWrap: 'wrap' }}>
        <label
          htmlFor={inputId}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            backgroundColor: imageUrl ? 'var(--color-surface, #ffffff)' : 'var(--color-primary-soft, #eff6ff)',
            color: 'var(--color-primary, #2563eb)',
            border: '1px solid var(--color-primary, #3b82f6)',
            borderRadius: 'var(--radius-md, 6px)',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontSize: 'var(--font-size-sm, 13px)',
            fontWeight: 600,
            opacity: isUploading ? 0.7 : 1,
            transition: 'all 0.2s',
            minHeight: '36px',
            userSelect: 'none',
          }}
          title={imageUrl ? 'Thay ảnh khác cho câu hỏi này' : 'Tải ảnh minh họa cho câu hỏi này'}
        >
          {isUploading ? (
            <>⏳ Đang tải ảnh...</>
          ) : imageUrl ? (
            <>📷 Thay ảnh</>
          ) : (
            <>📷 Tải ảnh lên</>
          )}
          <input
            id={inputId}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            disabled={isUploading}
            onChange={(e) => onUpload(part, index, e)}
          />
        </label>

        {imageUrl && onRemove && (
          <button
            type="button"
            onClick={() => onRemove(part, index)}
            disabled={isUploading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: 'transparent',
              color: 'var(--color-danger, #ef4444)',
              border: '1px solid var(--color-danger, #ef4444)',
              borderRadius: 'var(--radius-md, 6px)',
              cursor: isUploading ? 'not-allowed' : 'pointer',
              fontSize: 'var(--font-size-sm, 13px)',
              minHeight: '36px',
              transition: 'all 0.2s',
            }}
            title="Xóa ảnh minh họa này"
          >
            🗑️ Xóa ảnh
          </button>
        )}
      </div>

      {imageUrl && (
        <div
          style={{
            marginTop: 'var(--spacing-2, 8px)',
            padding: 'var(--spacing-1, 4px)',
            borderRadius: 'var(--radius-md, 6px)',
            backgroundColor: 'var(--color-background, #f8fafc)',
            display: 'inline-block',
            maxWidth: '100%',
          }}
        >
          <img
            src={imageUrl}
            alt="Minh họa câu hỏi"
            style={{
              maxWidth: '100%',
              maxHeight: '220px',
              borderRadius: 'var(--radius-md, 6px)',
              border: '1px solid var(--color-border, #e2e8f0)',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default QuestionImageUploader;
