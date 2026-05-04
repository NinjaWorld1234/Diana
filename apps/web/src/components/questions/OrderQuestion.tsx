import { useState, useEffect, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { CheckCircle, XCircle, GripVertical } from 'lucide-react';

interface OrderQuestionProps {
  question: any;
  showFeedback: boolean;
  isCorrect?: boolean;
  onSelect: (selectedIds: string[]) => void;
}

export default function OrderQuestion({ question, showFeedback, isCorrect, onSelect }: OrderQuestionProps) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // Shuffle options initially if not showing feedback
    if (!showFeedback && question?.options) {
      const shuffled = [...question.options].sort(() => Math.random() - 0.5);
      setItems(shuffled);
      // Send initial order
      onSelect(shuffled.map(i => i.id));
    }
    // Only re-run when the question changes or feedback state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, showFeedback]);

  const handleReorder = useCallback((newItems: any[]) => {
    setItems(newItems);
    onSelect(newItems.map(i => i.id));
  }, [onSelect]);

  if (!question || !question.options) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
      <Reorder.Group axis="y" values={items} onReorder={showFeedback ? () => {} : handleReorder} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((opt, index) => {
          const originalIndex = question.options.findIndex((o: any) => o.id === opt.id);
          const isItemInCorrectPosition = index === originalIndex;
          
          return (
            <Reorder.Item
              key={opt.id}
              value={opt}
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-sm)',
                border: `2px solid ${showFeedback ? (isItemInCorrectPosition ? '#10B981' : '#EF4444') : 'var(--color-border)'}`,
                background: showFeedback ? (isItemInCorrectPosition ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'transparent',
                cursor: showFeedback ? 'default' : 'grab',
                textAlign: 'right',
                fontFamily: 'var(--font-ar)',
                fontSize: '1rem',
                color: 'var(--color-text)',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {!showFeedback && <GripVertical size={18} color="var(--color-text-muted)" style={{ cursor: 'grab' }} />}
              {showFeedback && isItemInCorrectPosition && <CheckCircle size={18} color="#10B981" />}
              {showFeedback && !isItemInCorrectPosition && <XCircle size={18} color="#EF4444" />}
              {opt.textAr}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
    </div>
  );
}
