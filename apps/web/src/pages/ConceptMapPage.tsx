import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow, Background, Controls,
  type Node, type Edge,
  Position, Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { adaptiveApi } from '../lib/api';
import { Lock, Unlock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';

/* ═══════════════════════════════════════════════
   Layout Constants (pixel-perfect for straight edges)
   ═══════════════════════════════════════════════ */
const TOPIC_H = 120;  // ارتفاع العقدة الرئيسية ثابت
const SUB_H   = 70;   // ارتفاع العقدة الفرعية ثابت

/* ═══════════════════════════════════════════════
   Status Styles
   ═══════════════════════════════════════════════ */
const STATUS_STYLES: Record<string, any> = {
  LOCKED:      { bg: '#f8fafc', border: '#cbd5e1', opacity: 0.7, icon: Lock, shadow: 'none', text: '#64748b' },
  IN_PROGRESS: { bg: '#ffffff', border: '#3b82f6', opacity: 1, icon: Unlock, shadow: '0 8px 24px rgba(59,130,246,0.2)', text: '#1e293b' },
  COMPLETED:   { bg: '#ffffff', border: '#10b981', opacity: 1, icon: CheckCircle, shadow: '0 8px 24px rgba(16,185,129,0.15)', text: '#1e293b' },
};

/* ═══════════════════════════════════════════════
   Root Node — "الطاقة في التفاعلات الكيميائية"
   ═══════════════════════════════════════════════ */
function RootNodeComponent({ data }: { data: any }) {
  return (
    <div style={{
      padding: '20px 28px',
      borderRadius: '16px',
      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      border: '2px solid rgba(255,255,255,0.2)',
      color: '#fff',
      textAlign: 'center',
      direction: 'rtl',
      fontWeight: 800,
      fontSize: '1rem',
      lineHeight: 1.6,
      minWidth: '180px',
      maxWidth: '200px',
      minHeight: '70px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 10px 30px rgba(79, 70, 229, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
      cursor: 'pointer',
    }}>
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />
      {data.label}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Topic Node — 10 main concept nodes (clickable)
   ═══════════════════════════════════════════════ */
function TopicNodeComponent({ data }: { data: any }) {
  const s = STATUS_STYLES[data.status] || STATUS_STYLES.LOCKED;
  const Icon = s.icon;

  return (
    <div style={{
      width: '200px',
      height: `${TOPIC_H}px`,
      boxSizing: 'border-box' as const,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '16px 12px',
      borderRadius: '14px',
      background: s.bg,
      border: `2px solid ${data.color || s.border}`,
      opacity: s.opacity,
      cursor: data.status !== 'LOCKED' ? 'pointer' : 'not-allowed',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      direction: 'rtl',
      textAlign: 'center',
      position: 'relative',
      color: s.text,
      boxShadow: data.status === 'IN_PROGRESS' 
        ? `0 10px 25px ${data.color || '#3b82f6'}30` 
        : (data.status === 'COMPLETED' ? s.shadow : '0 2px 8px rgba(0,0,0,0.04)'),
    }}
    onMouseEnter={(e) => {
      if (data.status !== 'LOCKED') {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      }
    }}
    onMouseLeave={(e) => {
      if (data.status !== 'LOCKED') {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }
    }}
    >
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="r" style={{ opacity: 0 }} />

      {data.needsReview && (
        <div style={{
          position: 'absolute', top: -8, right: -8,
          background: '#F59E0B', borderRadius: '50%',
          width: 24, height: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
          border: '2px solid #fff'
        }}>
          <AlertTriangle size={14} color="#fff" />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
        <div style={{ 
          background: `${data.color || s.border}15`, 
          padding: '8px', 
          borderRadius: '10px',
          color: data.color || s.border
        }}>
          <Icon size={20} />
        </div>
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5, marginBottom: data.masteryScore > 0 ? '4px' : '0' }}>
        {data.titleAr}
      </div>
      {data.masteryScore > 0 && (
        <div style={{
          fontSize: '0.75rem', fontWeight: 700,
          color: data.masteryScore >= 70 ? '#059669' : '#d97706',
          background: data.masteryScore >= 70 ? '#d1fae5' : '#fef3c7',
          padding: '2px 8px',
          borderRadius: '12px',
          display: 'inline-block'
        }}>
          إتقان: {Math.round(data.masteryScore)}%
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   Sub-concept Leaf Node (descriptive question title)
   ═══════════════════════════════════════════════ */
function SubConceptNodeComponent({ data }: { data: any }) {
  const subStatus = data.subStatus || 'LOCKED'; // 'LOCKED' | 'OPEN' | 'COMPLETED'
  const isLocked = subStatus === 'LOCKED';
  const isCompleted = subStatus === 'COMPLETED';
  
  // 0 = الفهم (أزرق)، 1 = التطبيق (أخضر)، 2 = الاستدلال (بنفسجي)
  const colors = [
    { bg: '#eff6ff', border: '#bfdbfe', hoverBg: '#dbeafe', hoverBorder: '#60a5fa', text: '#1e40af', icon: '📖', shadow: 'rgba(59, 130, 246, 0.15)' },
    { bg: '#f0fdfa', border: '#bfe8e5', hoverBg: '#ccfbf1', hoverBorder: '#2dd4bf', text: '#0f766e', icon: '⚙️', shadow: 'rgba(20, 184, 166, 0.15)' },
    { bg: '#faf5ff', border: '#e9d5ff', hoverBg: '#f3e8ff', hoverBorder: '#c084fc', text: '#6b21a8', icon: '💡', shadow: 'rgba(168, 85, 247, 0.15)' },
  ];

  const lockedStyle = { bg: '#f8fafc', border: '#e2e8f0', hoverBg: '#f8fafc', hoverBorder: '#e2e8f0', text: '#94a3b8', icon: '🔒', shadow: 'transparent' };
  const completedStyle = { ...colors[data.levelIndex] || colors[0], icon: '✅' };

  const c = isLocked ? lockedStyle : isCompleted ? completedStyle : (colors[data.levelIndex] || colors[0]);

  return (
    <div style={{
      width: '260px',
      height: `${SUB_H}px`,
      boxSizing: 'border-box' as const,
      padding: '12px 14px',
      borderRadius: '12px',
      background: c.bg,
      border: `2px solid ${c.border}`,
      direction: 'rtl',
      textAlign: 'center',
      fontSize: '0.75rem',
      fontWeight: 700,
      color: c.text,
      lineHeight: 1.6,
      cursor: isLocked ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 4px 12px ${c.shadow}`,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => { 
      if (!isLocked) {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = c.hoverBg; 
        el.style.borderColor = c.hoverBorder; 
        el.style.transform = 'translateY(-2px) scale(1.02)';
        el.style.boxShadow = `0 8px 20px ${c.shadow}`;
      }
    }}
    onMouseLeave={(e) => { 
      if (!isLocked) {
        const el = e.currentTarget as HTMLDivElement;
        el.style.background = c.bg; 
        el.style.borderColor = c.border; 
        el.style.transform = 'translateY(0) scale(1)';
        el.style.boxShadow = `0 4px 12px ${c.shadow}`;
      }
    }}
    >
      <Handle type="target" position={Position.Left} id="l" style={{ opacity: 0 }} />
      <div style={{
        background: '#fff',
        borderRadius: '50%',
        width: '28px',
        height: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: `0 2px 4px ${c.shadow}`,
        fontSize: '0.9rem'
      }}>
        {c.icon}
      </div>
      <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>{data.label}</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  root: RootNodeComponent,
  topic: TopicNodeComponent,
  sub: SubConceptNodeComponent,
};

/* ═══════════════════════════════════════════════
   Sub-node titles — مستمدة من أسئلة بنك الأسئلة
   كل عقدة فرعية = سؤال فعلي (فهم، تطبيق، استدلال)
   ═══════════════════════════════════════════════ */
const NODE_SUBS: Record<number, string[]> = {
  // العقدة 1: تغيرات الطاقة
  1: [
    'ما المقصود بتغير الطاقة في التفاعل؟',
    'ما الدليل على حدوث تغير في الطاقة؟',
    'ماذا نستنتج من ظهور ضوء وحرارة؟',
  ],
  // العقدة 2: الطارد والماص
  2: [
    'هل انخفاض الحرارة يعني تفاعلاً طارداً؟',
    'أي التفاعلات التالية طاردة للطاقة؟',
    'ماذا نستنتج إذا احتاج تفاعل تسخيناً مستمراً؟',
  ],
  // العقدة 3: التغير ΔH
  3: [
    'متى تكون ΔH سالبة؟',
    'ما اتجاه انتقال الطاقة عند ΔH سالبة؟',
    'الفرق بين الطارد والماص بيانياً',
  ],
  // العقدة 4: المعادلة الحرارية
  4: [
    'ما المقصود بالمعادلة الكيميائية الحرارية؟',
    'ماذا تعني ΔH = -572 KJ في معادلة الماء؟',
    'الإشارة السالبة والموجبة في ΔH',
  ],
  // العقدة 5: طاقة الرابطة
  5: [
    'هل كسر الروابط يحتاج أم يطلق طاقة؟',
    'ماذا نستنتج عن رابطة ذات طاقة كبيرة؟',
    'العلاقة بين قوة الرابطة وطاقتها',
  ],
  // العقدة 6: حساب حرارة التفاعل
  6: [
    'ماذا نستنتج إذا كانت المكسورة > المتكونة؟',
    'رتب خطوات حساب حرارة التفاعل',
    'التعويض في قانون ΔH بالأمثلة',
  ],
  // العقدة 7: الحسابات بالمعادلة
  7: [
    'ماذا يحدث للطاقة عند تضاعف المولات؟',
    'اسحب كل مصطلح إلى تعريفه الصحيح',
    'حساب الطاقة لكميات مختلفة من المواد',
  ],
  // العقدة 8: حرارة الاحتراق
  8: [
    'ما المقصود بحرارة الاحتراق؟',
    'أيهما أكبر حرارة احتراق: الميثان أم الإيثان؟',
    'العلاقة بين حرارة الاحتراق والقيمة الحرارية',
  ],
  // العقدة 9: قيمة الغذاء
  9: [
    'ماذا نعني بالقيمة الحرارية للغذاء؟',
    'حساب الطاقة من كربوهيدرات ودهون',
    'تحويل السعرات الحرارية إلى جول',
  ],
  // العقدة 10: التطبيقات الحياتية
  10: [
    'كيف ترتبط الكمادات بمفاهيم الطاقة؟',
    'الكمادة الباردة: ماص أم طارد؟',
    'تطبيقات عملية على التفاعلات الطاردة والماصة',
  ],
};

/* ═══════════════════════════════════════════════
   Page Component
   ═══════════════════════════════════════════════ */
export default function ConceptMapPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isTeacherOrAdmin = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const { data: masteryMap, isLoading } = useQuery({
    queryKey: ['mastery-map'],
    queryFn: () => adaptiveApi.getMasteryMap(),
  });

  // ── حالة التوسيع: تبقى مفتوحة طوال الجلسة بعد أول ضغطة ──
  const [rootExpanded, setRootExpanded] = useState(() => {
    return sessionStorage.getItem('mapExpanded') === 'true';
  });

  const expandRoot = useCallback(() => {
    setRootExpanded(true);
    sessionStorage.setItem('mapExpanded', 'true');
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!masteryMap?.length) return { nodes: [], edges: [] };

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // ═══ الحالة 1: الجذر وحده في الوسط ═══
    if (!rootExpanded) {
      flowNodes.push({
        id: 'root',
        type: 'root',
        position: { x: 0, y: 0 },
        data: { label: 'الطاقة في\nالتفاعلات الكيميائية' },
        draggable: false,
      });
      return { nodes: flowNodes, edges: flowEdges };
    }

    // ═══ الحالة 2: كل العقد الرئيسية ظاهرة ═══
    const COLLAPSED_GAP = 140;
    const EXPANDED_GAP  = 300;
    const rootX  = 50;
    const topicX = 400;
    const subX   = 780;

    let currentY = 0;
    const positions: { y: number; expanded: boolean; effStatus: string }[] = [];
    masteryMap.forEach((n: any) => {
      const effStatus = (isTeacherOrAdmin && n.status === 'LOCKED') ? 'IN_PROGRESS' : n.status;
      const expanded = effStatus === 'IN_PROGRESS' || effStatus === 'COMPLETED';
      positions.push({ y: currentY, expanded, effStatus });
      currentY += expanded ? EXPANDED_GAP : COLLAPSED_GAP;
    });

    const lastPos = positions[positions.length - 1];
    const totalHeight = lastPos ? lastPos.y : 0;

    flowNodes.push({
      id: 'root',
      type: 'root',
      position: { x: rootX, y: totalHeight / 2 - 25 },
      data: { label: 'الطاقة في\nالتفاعلات الكيميائية' },
      draggable: false,
    });

    masteryMap.forEach((n: any, i: number) => {
      const order = n.order ?? (i + 1);
      const topicY = positions[i].y;
      const isExpanded = positions[i].expanded;

      flowNodes.push({
        id: n.nodeId, type: 'topic',
        position: { x: topicX, y: topicY },
        data: { ...n, status: positions[i].effStatus },
      });

      const strokeColor = positions[i].effStatus === 'COMPLETED' ? '#10B981' : positions[i].effStatus === 'IN_PROGRESS' ? '#3B82F6' : '#94a3b8';

      flowEdges.push({
        id: `root-${n.nodeId}`,
        source: 'root', target: n.nodeId,
        sourceHandle: 'r', targetHandle: 'l',
        type: 'default',
        animated: positions[i].effStatus === 'IN_PROGRESS',
        style: { stroke: strokeColor, strokeWidth: 2 },
      });

      // ── الفرعيات تظهر فقط للعقد المفتوحة (IN_PROGRESS أو COMPLETED) ──
      if (!isExpanded) return;

      const subs = NODE_SUBS[order] || ['مستوى 1', 'مستوى 2', 'مستوى 3'];
      const middleSubY = topicY + (TOPIC_H - SUB_H) / 2;
      const subNodeGap = 20;

      const getSubStatus = (si: number): 'LOCKED' | 'OPEN' | 'COMPLETED' => {
        if (isTeacherOrAdmin) return 'OPEN';
        if (n.status === 'LOCKED') return 'LOCKED';
        if (n.status === 'COMPLETED') return 'COMPLETED';
        if (si === 0) return n.understandingScore >= 100 ? 'COMPLETED' : 'OPEN';
        if (si === 1) {
          if (n.understandingScore < 100) return 'LOCKED';
          return n.applicationScore >= 100 ? 'COMPLETED' : 'OPEN';
        }
        if (si === 2) {
          if (n.applicationScore < 100) return 'LOCKED';
          return n.reasoningScore >= 100 ? 'COMPLETED' : 'OPEN';
        }
        return 'LOCKED';
      };

      subs.forEach((label, si) => {
        const sid = `sub-${order}-${si}`;
        const subStatus = getSubStatus(si);

        let subY: number;
        if (si === 0) subY = middleSubY - SUB_H - subNodeGap;
        else if (si === 2) subY = middleSubY + SUB_H + subNodeGap;
        else subY = middleSubY;

        flowNodes.push({
          id: sid, type: 'sub',
          position: { x: subX, y: subY },
          data: { label, parentNodeId: n.nodeId, levelIndex: si, parentStatus: n.status, subStatus },
          draggable: false,
        });

        const subEdgeColor = subStatus === 'COMPLETED' ? '#10b981' : subStatus === 'OPEN' ? '#3b82f6' : '#e2e8f0';

        flowEdges.push({
          id: `${n.nodeId}-${sid}`,
          source: n.nodeId, target: sid,
          sourceHandle: 'r', targetHandle: 'l',
          type: si === 1 ? 'straight' : 'default',
          animated: subStatus === 'OPEN',
          style: { stroke: subEdgeColor, strokeWidth: 1.5 },
        });
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [masteryMap, rootExpanded]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'root' && !rootExpanded) {
      expandRoot();
      return;
    }
    if (node.type === 'topic' && node.data.status !== 'LOCKED') {
      navigate(`/node/${node.id}`);
    } else if (node.type === 'sub' && node.data.subStatus !== 'LOCKED') {
      navigate(`/node/${node.data.parentNodeId}?content=${node.data.levelIndex}&level=${node.data.levelIndex}`);
    }
  }, [navigate, rootExpanded]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="pulse-glow" style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--color-primary)' }} />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>
          <span className="gradient-text">الخارطة المفاهيمية</span>
        </h1>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          {!rootExpanded ? 'اضغط على العقدة المركزية لاستكشاف المفاهيم' : 'اضغط على أي عقدة مفتوحة لبدء التعلم'}
        </p>
      </div>

      <div className="glass-card" style={{ height: '78vh', overflow: 'hidden' }}>
        <ReactFlow
          key={rootExpanded ? 'expanded' : 'collapsed'}
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: rootExpanded ? 0.15 : 0.5 }}
          proOptions={{ hideAttribution: true }}
          style={{ direction: 'ltr' }}
          minZoom={0.25}
          maxZoom={1.8}
          defaultEdgeOptions={{ type: 'default' }}
        >
          <Background color="var(--color-border)" gap={28} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '14px', justifyContent: 'center' }}>
        {[
          { color: '#94a3b8', label: 'مغلقة 🔒' },
          { color: '#3B82F6', label: 'مفتوحة 🔓' },
          { color: '#10B981', label: 'منجزة ✅' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
