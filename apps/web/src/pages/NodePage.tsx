import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { contentApi, questionsApi, adaptiveApi, progressApi } from '../lib/api';
import { ArrowRight, BookOpen, HelpCircle, Lightbulb, CheckCircle, XCircle, ChevronLeft, Brain } from 'lucide-react';
import MCQQuestion from '../components/questions/MCQQuestion';
import OrderQuestion from '../components/questions/OrderQuestion';
import DragDropQuestion from '../components/questions/DragDropQuestion';

type Phase = 'intro' | 'content' | 'q-understanding' | 'q-application' | 'q-reasoning' | 'result';

export default function NodePage() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('intro');
  const [answers, setAnswers] = useState<Record<string, { isCorrect: boolean; selectedId: string }>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState<any>(null);
  const [adaptiveResult, setAdaptiveResult] = useState<any>(null);

  // ─── Time Tracking ─────────────────────────
  const timeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!nodeId) return;
    timeRef.current = 0;

    // Tick every second
    intervalRef.current = setInterval(() => {
      timeRef.current += 1;
    }, 1000);

    // Flush every 30 seconds
    const flushInterval = setInterval(() => {
      if (timeRef.current > 0) {
        progressApi.updateTimeSpent(nodeId, timeRef.current).catch(() => {});
        timeRef.current = 0;
      }
    }, 30000);

    // Flush on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearInterval(flushInterval);
      if (timeRef.current > 0 && nodeId) {
        progressApi.updateTimeSpent(nodeId, timeRef.current).catch(() => {});
      }
    };
  }, [nodeId]);

  const { data: node } = useQuery({
    queryKey: ['node', nodeId],
    queryFn: () => contentApi.getNode(nodeId!),
    enabled: !!nodeId,
  });

  const { data: questions } = useQuery({
    queryKey: ['questions', nodeId],
    queryFn: () => questionsApi.getNodeQuestions(nodeId!),
    enabled: !!nodeId,
  });

  const { data: hints } = useQuery({
    queryKey: ['hints', nodeId],
    queryFn: () => questionsApi.getHints(nodeId!),
    enabled: !!nodeId,
  });

  const { data: remediationCards } = useQuery({
    queryKey: ['remediation', nodeId],
    queryFn: () => questionsApi.getRemediation(nodeId!),
    enabled: !!nodeId,
  });

  const [activeHint, setActiveHint] = useState<any>(null);
  const [hintLoading, setHintLoading] = useState(false);

  const handleUseHint = async () => {
    if (!hints || hints.length === 0) return;
    
    // Find a hint for the current level
    const currentLevel = phase === 'q-understanding' ? 'UNDERSTANDING' : phase === 'q-application' ? 'APPLICATION' : 'REASONING';
    const levelHints = hints.filter((h: any) => h.level === currentLevel);
    if (levelHints.length === 0) return;

    // Pick a random hint for the level
    const randomHint = levelHints[Math.floor(Math.random() * levelHints.length)];
    
    setHintLoading(true);
    try {
      await questionsApi.useHint(nodeId!, randomHint.id);
      setActiveHint(randomHint);
    } catch (e) {
      console.error(e);
    } finally {
      setHintLoading(false);
    }
  };

  // Group questions by level
  const questionsByLevel = {
    UNDERSTANDING: questions?.filter((q: any) => q.level === 'UNDERSTANDING') || [],
    APPLICATION: questions?.filter((q: any) => q.level === 'APPLICATION') || [],
    REASONING: questions?.filter((q: any) => q.level === 'REASONING') || [],
  };

  const getCurrentQuestions = () => {
    if (phase === 'q-understanding') return questionsByLevel.UNDERSTANDING;
    if (phase === 'q-application') return questionsByLevel.APPLICATION;
    if (phase === 'q-reasoning') return questionsByLevel.REASONING;
    return [];
  };

  const handleSubmitAnswer = async () => {
    if (!selectedOption) return;
    const currentQuestions = getCurrentQuestions();
    const q = currentQuestions[currentQ];
    
    try {
      const result = await questionsApi.submitAnswer(q.id, selectedOption, 30);
      setFeedbackData(result);
      setShowFeedback(true);
      setAnswers((prev) => ({ ...prev, [q.id]: { isCorrect: result.isCorrect, selectedId: selectedOption } }));
    } catch {
      setShowFeedback(true);
      setFeedbackData({ isCorrect: false, explanation: 'حدث خطأ' });
    }
  };

  const handleNext = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    setFeedbackData(null);
    setActiveHint(null);
    const currentQuestions = getCurrentQuestions();

    if (currentQ < currentQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setCurrentQ(0);
      if (phase === 'q-understanding') setPhase('q-application');
      else if (phase === 'q-application') setPhase('q-reasoning');
      else if (phase === 'q-reasoning') evaluateResults();
    }
  };

  const evaluateResults = async () => {
    // Calculate success rate per level (at least 50% correct to pass)
    const calcPassRate = (levelQuestions: any[]) => {
      if (levelQuestions.length === 0) return true; // No questions = auto pass
      const correct = levelQuestions.filter((q: any) => answers[q.id]?.isCorrect).length;
      return correct / levelQuestions.length >= 0.5;
    };
    const understanding = calcPassRate(questionsByLevel.UNDERSTANDING);
    const application = calcPassRate(questionsByLevel.APPLICATION);
    const reasoning = calcPassRate(questionsByLevel.REASONING);

    try {
      const result = await adaptiveApi.evaluate(nodeId!, understanding, application, reasoning);
      setAdaptiveResult(result);
    } catch {
      setAdaptiveResult({ path: 'FULL_REMEDIATION', message: 'حدث خطأ في التقييم', pointsEarned: 0 });
    }
    setPhase('result');
  };

  if (!node) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
      <div className="pulse-glow" style={{ width: 50, height: 50, borderRadius: '50%', background: 'var(--color-primary)' }} />
    </div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/map')} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
          <ArrowRight size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>{node.titleAr}</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>{node.descriptionAr}</p>
        </div>
      </div>

      {/* Phase: Intro */}
      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="glass-card" style={{ padding: '32px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <BookOpen size={24} color="var(--color-primary)" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>تمهيد</h2>
              </div>
              <p style={{ lineHeight: 2, fontSize: '1.05rem' }}>{node.introductionAr}</p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn-primary" onClick={() => setPhase('content')}>
                متابعة المحتوى <ChevronLeft size={18} />
              </button>
              <button className="btn-secondary" onClick={() => setPhase('q-understanding')}>
                انتقال للأسئلة مباشرة
              </button>
            </div>
          </motion.div>
        )}

        {/* Phase: Content */}
        {phase === 'content' && (
          <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            {node.contentChunks?.map((chunk: any, i: number) => (
              <div key={i} className="glass-card" style={{ padding: '24px', marginBottom: '12px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  {chunk.type === 'DEFINITION' ? '📖 تعريف' : chunk.type === 'LAW' ? '⚖️ قانون' : chunk.type === 'EXAMPLE' ? '💡 مثال' : chunk.type === 'NOTE' ? '📌 ملاحظة' : '📝 شرح'}
                </div>
                <p style={{ lineHeight: 2, fontSize: '1rem', whiteSpace: 'pre-wrap' }}>{chunk.textAr}</p>
              </div>
            ))}
            {node.formulas?.length > 0 && (
              <div className="glass-card" style={{ padding: '24px', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>📐 المعادلات والقوانين</h3>
                {node.formulas.map((f: any, i: number) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--color-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '1rem', direction: 'ltr', textAlign: 'center', marginBottom: '4px' }}>{f.expression}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>{f.descriptionAr}</div>
                  </div>
                ))}
              </div>
            )}
            <button className="btn-primary" onClick={() => { setCurrentQ(0); setPhase('q-understanding'); }}>
              ابدأ التقييم <ChevronLeft size={18} />
            </button>
          </motion.div>
        )}

        {/* Phase: Questions */}
        {(phase === 'q-understanding' || phase === 'q-application' || phase === 'q-reasoning') && (
          <motion.div key={phase} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
            <div style={{
              display: 'inline-block', padding: '6px 16px', borderRadius: '50px', marginBottom: '16px',
              background: phase === 'q-understanding' ? 'rgba(59, 130, 246, 0.15)' : phase === 'q-application' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: phase === 'q-understanding' ? '#3B82F6' : phase === 'q-application' ? '#8B5CF6' : '#F59E0B',
              fontWeight: 600, fontSize: '0.85rem',
            }}>
              {phase === 'q-understanding' ? '🧠 مستوى الفهم' : phase === 'q-application' ? '🔧 مستوى التطبيق' : '💡 مستوى الاستدلال'}
            </div>

            {getCurrentQuestions().length > 0 ? (
              <div className="glass-card" style={{ padding: '32px' }}>
                <div style={{ marginBottom: '8px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  سؤال {currentQ + 1} من {getCurrentQuestions().length}
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '24px', lineHeight: 1.8 }}>
                  {getCurrentQuestions()[currentQ]?.textAr}
                </h3>

                {getCurrentQuestions()[currentQ]?.type === 'ORDER' ? (
                  <OrderQuestion 
                    question={getCurrentQuestions()[currentQ]} 
                    showFeedback={showFeedback} 
                    isCorrect={feedbackData?.isCorrect} 
                    onSelect={setSelectedOption} 
                  />
                ) : getCurrentQuestions()[currentQ]?.type === 'DRAG_DROP' ? (
                  <DragDropQuestion 
                    question={getCurrentQuestions()[currentQ]} 
                    showFeedback={showFeedback} 
                    isCorrect={feedbackData?.isCorrect} 
                    onSelect={setSelectedOption} 
                  />
                ) : (
                  <MCQQuestion 
                    question={getCurrentQuestions()[currentQ]} 
                    showFeedback={showFeedback} 
                    selectedOption={selectedOption} 
                    onSelect={setSelectedOption} 
                    answers={answers} 
                  />
                )}
                {showFeedback && feedbackData && (
                  <>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{
                      padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px',
                      background: feedbackData.isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${feedbackData.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px', color: feedbackData.isCorrect ? '#10B981' : '#EF4444' }}>
                        {feedbackData.isCorrect ? '✅ إجابة صحيحة!' : '❌ إجابة خاطئة'}
                      </div>
                      {feedbackData.explanation && <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>{feedbackData.explanation}</p>}
                    </motion.div>
                    
                    {!feedbackData.isCorrect && remediationCards?.length > 0 && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{
                        padding: '20px', borderRadius: 'var(--radius-sm)', marginBottom: '16px',
                        background: 'var(--color-bg)', border: '2px dashed rgba(59, 130, 246, 0.5)',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--color-primary)' }}>
                          <BookOpen size={20} />
                          <span style={{ fontWeight: 600 }}>بطاقة دعم ومراجعة</span>
                        </div>
                        <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--color-text-secondary)' }}>
                          {remediationCards.find((r: any) => r.level === (phase === 'q-understanding' ? 'UNDERSTANDING' : phase === 'q-application' ? 'APPLICATION' : 'REASONING'))?.contentAr || remediationCards[0].contentAr}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
                {activeHint && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{
                    padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '16px',
                    background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                  }}>
                    <Lightbulb size={24} color="#F59E0B" style={{ flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: '#F59E0B', marginBottom: '4px' }}>تلميح المساعدة</div>
                      <p style={{ fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {activeHint.textAr}
                      </p>
                    </div>
                  </motion.div>
                )}

                {!showFeedback ? (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-primary" onClick={handleSubmitAnswer} disabled={!selectedOption} style={{ flex: 1 }}>
                      <HelpCircle size={18} /> تأكيد الإجابة
                    </button>
                    <button 
                      className="btn-secondary" 
                      onClick={handleUseHint} 
                      disabled={hintLoading || activeHint || hints?.filter((h: any) => h.level === (phase === 'q-understanding' ? 'UNDERSTANDING' : phase === 'q-application' ? 'APPLICATION' : 'REASONING')).length === 0}
                      style={{ padding: '0 20px' }}
                    >
                      <Lightbulb size={18} /> {hintLoading ? '...' : 'تلميح'}
                    </button>
                  </div>
                ) : (
                  <button className="btn-primary" onClick={handleNext}>
                    التالي <ChevronLeft size={18} />
                  </button>
                )}
              </div>
            ) : (
              <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--color-text-muted)' }}>لا توجد أسئلة لهذا المستوى حالياً</p>
                <button className="btn-primary" onClick={handleNext} style={{ marginTop: '16px' }}>تخطي <ChevronLeft size={18} /></button>
              </div>
            )}
          </motion.div>
        )}

        {/* Phase: Result */}
        {phase === 'result' && adaptiveResult && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <div className="glass-card" style={{ padding: '40px', textAlign: 'center' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 20px',
                background: adaptiveResult.path === 'MASTERY' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {adaptiveResult.path === 'MASTERY' ? <CheckCircle size={36} color="#10B981" /> : <Lightbulb size={36} color="#F59E0B" />}
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '12px' }}>
                {adaptiveResult.path === 'MASTERY' ? 'تم الإتقان! 🎉' : 'تحتاج مراجعة'}
              </h2>
              <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', lineHeight: 1.8, marginBottom: '8px' }}>
                {adaptiveResult.message}
              </p>
              {adaptiveResult.pointsEarned > 0 && (
                <div className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '20px' }}>
                  +{adaptiveResult.pointsEarned} نقطة
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => navigate('/map')}>
                  العودة للخارطة
                </button>
                <button className="btn-secondary" onClick={() => navigate('/ai-teacher')}>
                  <Brain size={18} /> اسأل المعلم الذكي
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
