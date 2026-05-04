import { CheckCircle, XCircle } from 'lucide-react';

interface MCQQuestionProps {
  question: any;
  showFeedback: boolean;
  selectedOption: string | null;
  onSelect: (id: string) => void;
  answers: any;
}

export default function MCQQuestion({ question, showFeedback, selectedOption, onSelect, answers }: MCQQuestionProps) {
  if (!question || !question.options) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
      {question.options.map((opt: any) => (
        <button
          key={opt.id}
          onClick={() => !showFeedback && onSelect(opt.id)}
          style={{
            padding: '14px 18px', borderRadius: 'var(--radius-sm)',
            border: `2px solid ${selectedOption === opt.id ? 'var(--color-primary)' : showFeedback ? (opt.isCorrect ? '#10B981' : answers[question.id]?.selectedId === opt.id ? '#EF4444' : 'var(--color-border)') : 'var(--color-border)'}`,
            background: selectedOption === opt.id && !showFeedback ? 'rgba(59, 130, 246, 0.1)' : showFeedback && opt.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
            cursor: showFeedback ? 'default' : 'pointer',
            textAlign: 'right', fontFamily: 'var(--font-ar)', fontSize: '1rem', color: 'var(--color-text)',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '12px',
          }}
        >
          {showFeedback && opt.isCorrect && <CheckCircle size={18} color="#10B981" />}
          {showFeedback && !opt.isCorrect && selectedOption === opt.id && <XCircle size={18} color="#EF4444" />}
          {opt.textAr}
        </button>
      ))}
    </div>
  );
}
