import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, GripVertical } from 'lucide-react';

interface ClassifyQuestionProps {
  question: any;
  showFeedback: boolean;
  isCorrect?: boolean;
  onSelect: (selectedIds: string[]) => void;
}

/**
 * ClassifyQuestion — drag items into two category boxes.
 * Options have explanationAr = category name (e.g. "طارد" or "ماص").
 * The user drags items into the correct box. On submit, we check order matches.
 */
export default function ClassifyQuestion({ question, showFeedback, isCorrect, onSelect }: ClassifyQuestionProps) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [dragItem, setDragItem] = useState<string | null>(null);

  useEffect(() => {
    if (!question?.options) return;
    // Derive categories from explanationAr (unique values)
    const cats = [...new Set(question.options.map((o: any) => o.explanationAr || 'غير مصنف'))] as string[];
    setCategories(cats);
    const shuffled = [...question.options].sort(() => Math.random() - 0.5);
    setItems(shuffled);
    setAssignments({});
    onSelect([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id, showFeedback]);

  const handleDrop = (itemId: string, category: string) => {
    const newAssignments = { ...assignments, [itemId]: category };
    setAssignments(newAssignments);
    setDragItem(null);

    // Build ordered list for submission — items sorted by correct category match
    const orderedIds = items
      .filter(item => newAssignments[item.id])
      .sort((a, b) => {
        const aCorrect = newAssignments[a.id] === a.explanationAr ? 0 : 1;
        const bCorrect = newAssignments[b.id] === b.explanationAr ? 0 : 1;
        return aCorrect - bCorrect;
      })
      .map(item => item.id);
    onSelect(orderedIds);
  };

  const isItemCorrect = (item: any) => assignments[item.id] === item.explanationAr;
  const unassigned = items.filter(item => !assignments[item.id]);
  const allAssigned = unassigned.length === 0;

  // Colors for categories
  const catColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div style={{ marginBottom: '24px' }}>
      {/* Unassigned items pool */}
      {unassigned.length > 0 && (
        <div style={{
          display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center',
          padding: '16px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)',
          marginBottom: '16px', border: '1px dashed var(--color-border)',
        }}>
          {unassigned.map(item => (
            <div
              key={item.id}
              draggable={!showFeedback}
              onDragStart={() => setDragItem(item.id)}
              style={{
                padding: '10px 20px', borderRadius: 'var(--radius-sm)',
                border: '2px solid var(--color-primary)',
                background: 'rgba(59, 130, 246, 0.05)',
                cursor: showFeedback ? 'default' : 'grab',
                fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text)',
                display: 'flex', alignItems: 'center', gap: '8px', userSelect: 'none',
              }}
            >
              {!showFeedback && <GripVertical size={16} color="var(--color-primary)" />}
              {item.textAr}
            </div>
          ))}
        </div>
      )}

      {/* Category boxes */}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${categories.length}, 1fr)`, gap: '16px' }}>
        {categories.map((cat, ci) => {
          const catItems = items.filter(item => assignments[item.id] === cat);
          const color = catColors[ci % catColors.length];

          return (
            <div
              key={cat}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = color; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = 'var(--color-border)';
                if (dragItem) handleDrop(dragItem, cat);
              }}
              style={{
                minHeight: '140px', padding: '16px', borderRadius: 'var(--radius-sm)',
                border: `2px dashed var(--color-border)`,
                background: `${color}08`, transition: 'border-color 0.2s',
              }}
            >
              <div style={{
                fontSize: '0.9rem', fontWeight: 700, color, marginBottom: '12px',
                textAlign: 'center', padding: '6px', background: `${color}15`,
                borderRadius: 'var(--radius-sm)',
              }}>
                {cat}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {catItems.map(item => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      padding: '10px 14px', borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${showFeedback ? (isItemCorrect(item) ? '#10B981' : '#EF4444') : color}`,
                      background: showFeedback ? (isItemCorrect(item) ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : `${color}10`,
                      fontWeight: 600, fontSize: '0.9rem', textAlign: 'center',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    {showFeedback && isItemCorrect(item) && <CheckCircle size={16} color="#10B981" />}
                    {showFeedback && !isItemCorrect(item) && <XCircle size={16} color="#EF4444" />}
                    {item.textAr}
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile fallback: tap-to-assign */}
      {unassigned.length > 0 && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            💡 اسحب العناصر إلى الصندوق المناسب، أو اضغط على العنصر ثم الصندوق
          </p>
        </div>
      )}
    </div>
  );
}
