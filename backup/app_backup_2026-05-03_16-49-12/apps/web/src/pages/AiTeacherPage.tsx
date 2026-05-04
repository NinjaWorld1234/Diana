import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { aiTeacherApi, contentApi } from '../lib/api';
import { Send, Bot, User, Sparkles } from 'lucide-react';

export default function AiTeacherPage() {
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: 'مرحباً! أنا المعلم الذكي لوحدة الطاقة في التفاعلات الكيميائية. 🧪\n\nيمكنني مساعدتك في:\n• شرح المفاهيم بطريقة بسيطة\n• حل المسائل خطوة بخطوة\n• تقديم أمثلة توضيحية\n• الإجابة على أسئلتك\n\nاسألني عن أي شيء في الوحدة!' },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: nodes } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => contentApi.getNodes(),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim()) return;
    const userMsg = message.trim();
    setMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const res = await aiTeacherApi.chat(userMsg, sessionId || undefined, selectedNode || undefined);
      setSessionId(res.sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    }
    setIsTyping(false);
  };

  const quickQuestions = [
    'ما الفرق بين التفاعل الطارد والماص؟',
    'كيف أحسب حرارة التفاعل من طاقة الروابط؟',
    'اشرح لي المعادلة الحرارية',
    'ما هي الكمادات وكيف تعمل؟',
    'ما معنى ΔH سالبة؟',
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 700 }}>المعلم الذكي</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#10B981' }}>
              <Sparkles size={12} /> مدعوم بـ Gemini AI
            </div>
          </div>
        </div>

        {/* Node selector */}
        <select
          value={selectedNode || ''}
          onChange={(e) => setSelectedNode(e.target.value || null)}
          style={{
            padding: '8px 12px', borderRadius: 'var(--radius-sm)',
            background: 'var(--color-bg)', border: '1px solid var(--color-border)',
            color: 'var(--color-text)', fontFamily: 'var(--font-ar)', fontSize: '0.85rem', direction: 'rtl',
          }}
        >
          <option value="">كل المواضيع</option>
          {nodes?.map((n: any) => (
            <option key={n.id} value={n.id}>{n.titleAr}</option>
          ))}
        </select>
      </div>

      {/* Chat Messages */}
      <div className="glass-card" style={{ flex: 1, overflow: 'auto', padding: '20px', marginBottom: '12px' }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex', gap: '12px', marginBottom: '16px',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'linear-gradient(135deg, #3B82F6, #2563EB)' : 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="white" />}
            </div>
            <div style={{
              maxWidth: '70%', padding: '14px 18px', borderRadius: '16px',
              background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.15)' : 'var(--color-bg)',
              border: `1px solid ${msg.role === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'var(--color-border)'}`,
              lineHeight: 1.8, whiteSpace: 'pre-wrap', fontSize: '0.95rem',
            }}>
              {msg.content}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            <Bot size={18} /> المعلم يكتب...
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Questions */}
      <div style={{ display: 'flex', gap: '8px', overflow: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => setMessage(q)}
            style={{
              padding: '8px 14px', borderRadius: '50px', whiteSpace: 'nowrap',
              background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)', cursor: 'pointer',
              fontFamily: 'var(--font-ar)', fontSize: '0.8rem', transition: 'all 0.2s',
            }}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          className="input-field"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب سؤالك هنا..."
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          onClick={handleSend}
          disabled={!message.trim() || isTyping}
          style={{ padding: '12px 20px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}
