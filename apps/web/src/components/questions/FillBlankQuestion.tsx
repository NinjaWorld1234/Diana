import { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface FillBlankQuestionProps {
  question: any;
  showFeedback: boolean;
  isCorrect?: boolean;
  onSelect: (answer: string) => void;
}

export default function FillBlankQuestion({ question, showFeedback, isCorrect, onSelect }: FillBlankQuestionProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (!showFeedback) {
      setInputValue('');
    }
  }, [question?.id, showFeedback]);

  const handleChange = (val: string) => {
    setInputValue(val);
    onSelect(val.trim());
  };

  if (!question) return null;

  // The correct answer is stored in the first correct option's textAr
  const correctAnswer = question.options?.find((o: any) => o.isCorrect)?.textAr || '';

  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap',
        padding: '20px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
        border: `2px solid ${showFeedback ? (isCorrect ? '#10B981' : '#EF4444') : 'var(--color-border)'}`,
      }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleChange(e.target.value)}
          disabled={showFeedback}
          placeholder="اكتب إجابتك هنا..."
          style={{
            flex: 1, minWidth: '200px',
            padding: '12px 16px', fontSize: '1.1rem', fontWeight: 600,
            fontFamily: 'var(--font-ar)', textAlign: 'center',
            background: 'var(--color-bg-secondary)',
            border: `2px solid ${showFeedback ? (isCorrect ? '#10B981' : '#EF4444') : 'var(--color-primary)'}`,
            borderRadius: 'var(--radius-sm)', outline: 'none',
            color: 'var(--color-text)', transition: 'all 0.2s',
          }}
        />
        {showFeedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isCorrect ? <CheckCircle size={24} color="#10B981" /> : <XCircle size={24} color="#EF4444" />}
          </div>
        )}
      </div>
      {showFeedback && !isCorrect && (
        <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#10B981', fontWeight: 600 }}>
          الإجابة الصحيحة: {correctAnswer}
        </div>
      )}
    </div>
  );
}
