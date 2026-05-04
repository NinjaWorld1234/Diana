import { useState, useEffect, useCallback } from 'react';
import { Reorder } from 'framer-motion';
import { CheckCircle, XCircle, GripVertical } from 'lucide-react';

interface DragDropQuestionProps {
  question: any;
  showFeedback: boolean;
  isCorrect?: boolean;
  onSelect: (selectedIds: string[]) => void;
}

export default function DragDropQuestion({ question, showFeedback, isCorrect, onSelect }: DragDropQuestionProps) {
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
    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'stretch' }}>
      {/* Fixed Definitions Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {question.options.map((opt: any, idx: number) => (
          <div key={`def-${opt.id}`} style={{ 
            padding: '14px 18px', 
            background: 'var(--color-bg)', 
            borderRadius: 'var(--radius-sm)',
            border: '2px solid transparent',
            color: 'var(--color-text-secondary)',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            height: '100%',
            display: 'flex',
            alignItems: 'center'
          }}>
            {opt.explanationAr || `تعريف ${idx + 1}`}
          </div>
        ))}
      </div>

      {/* Draggable Terms Column */}
      <div style={{ flex: 1 }}>
        <Reorder.Group axis="y" values={items} onReorder={showFeedback ? () => {} : handleReorder} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
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
                  border: `2px solid ${showFeedback ? (isItemInCorrectPosition ? '#10B981' : '#EF4444') : 'var(--color-primary)'}`,
                  background: showFeedback ? (isItemInCorrectPosition ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(59, 130, 246, 0.05)',
                  cursor: showFeedback ? 'default' : 'grab',
                  textAlign: 'center',
                  fontFamily: 'var(--font-ar)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px',
                  height: '100%',
                  flex: 1,
                  position: 'relative'
                }}
              >
                {!showFeedback && <GripVertical size={18} color="var(--color-primary)" style={{ cursor: 'grab', position: 'absolute', right: '12px' }} />}
                {showFeedback && isItemInCorrectPosition && <CheckCircle size={18} color="#10B981" style={{ position: 'absolute', right: '12px' }} />}
                {showFeedback && !isItemInCorrectPosition && <XCircle size={18} color="#EF4444" style={{ position: 'absolute', right: '12px' }} />}
                {opt.textAr}
              </Reorder.Item>
            );
          })}
        </Reorder.Group>
      </div>
    </div>
  );
}
