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
import { Lock, Unlock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';

/* ═══════════════════════════════════════════════
   Layout Constants
   ═══════════════════════════════════════════════ */
const TOPIC_H = 120;
const SUB_H   = 70;

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
   Topic Node — main concept nodes (click to expand/collapse)
   ═══════════════════════════════════════════════ */
function TopicNodeComponent({ data }: { data: any }) {
  const s = STATUS_STYLES[data.status] || STATUS_STYLES.LOCKED;
  const Icon = s.icon;
  const isExpanded = data.isExpanded;
  const isLocked = data.status === 'LOCKED';

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
      cursor: isLocked ? 'not-allowed' : 'pointer',
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
      if (!isLocked) {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!isLocked) {
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

      {/* Expand/Collapse indicator for unlocked nodes */}
      {!isLocked && (
        <div style={{
          position: 'absolute', top: -8, left: -8,
          background: isExpanded ? '#6366f1' : '#3b82f6',
          borderRadius: '50%',
          width: 22, height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
          border: '2px solid #fff',
          transition: 'all 0.3s ease',
        }}>
          {isExpanded ? <ChevronUp size={13} color="#fff" /> : <ChevronDown size={13} color="#fff" />}
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
   Sub-concept Leaf Node
   ═══════════════════════════════════════════════ */
function SubConceptNodeComponent({ data }: { data: any }) {
  const subStatus = data.subStatus || 'LOCKED';
  const isLocked = subStatus === 'LOCKED';
  const isCompleted = subStatus === 'COMPLETED';

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
   Sub-node titles
   ═══════════════════════════════════════════════ */
const NODE_SUBS: Record<number, string[]> = {
  1: [
    'ما المقصود بتغير الطاقة في التفاعل؟',
    'ما الدليل على حدوث تغير في الطاقة؟',
    'ماذا نستنتج من ظهور ضوء وحرارة؟',
  ],
  2: [
    'هل انخفاض الحرارة يعني تفاعلاً طارداً؟',
    'أي التفاعلات التالية طاردة للطاقة؟',
    'ماذا نستنتج إذا احتاج تفاعل تسخيناً مستمراً؟',
  ],
  3: [
    'متى تكون ΔH سالبة؟',
    'ما اتجاه انتقال الطاقة عند ΔH سالبة؟',
    'الفرق بين الطارد والماص بيانياً',
  ],
  4: [
    'ما المقصود بالمعادلة الكيميائية الحرارية؟',
    'ماذا تعني ΔH = -572 KJ في معادلة الماء؟',
    'الإشارة السالبة والموجبة في ΔH',
  ],
  5: [
    'هل كسر الروابط يحتاج أم يطلق طاقة؟',
    'ماذا نستنتج عن رابطة ذات طاقة كبيرة؟',
    'العلاقة بين قوة الرابطة وطاقتها',
  ],
  6: [
    'ماذا نستنتج إذا كانت المكسورة > المتكونة؟',
    'رتب خطوات حساب حرارة التفاعل',
    'التعويض في قانون ΔH بالأمثلة',
  ],
  7: [
    'ماذا يحدث للطاقة عند تضاعف المولات؟',
    'اسحب كل مصطلح إلى تعريفه الصحيح',
    'حساب الطاقة لكميات مختلفة من المواد',
  ],
  8: [
    'ما المقصود بحرارة الاحتراق؟',
    'أيهما أكبر حرارة احتراق: الميثان أم الإيثان؟',
    'العلاقة بين حرارة الاحتراق والقيمة الحرارية',
  ],
  9: [
    'ماذا نعني بالقيمة الحرارية للغذاء؟',
    'حساب الطاقة من كربوهيدرات ودهون',
    'تحويل السعرات الحرارية إلى جول',
  ],
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

  // ── حالة التوسيع للجذر ──
  const [rootExpanded, setRootExpanded] = useState(() => {
    return sessionStorage.getItem('mapExpanded') === 'true';
  });

  const expandRoot = useCallback(() => {
    setRootExpanded(true);
    sessionStorage.setItem('mapExpanded', 'true');
  }, []);

  // ── حالة طي/فتح العقد الرئيسية — محفوظة في sessionStorage ──
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('mapExpandedTopics');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleTopic = useCallback((nodeId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      sessionStorage.setItem('mapExpandedTopics', JSON.stringify([...next]));
      return next;
    });
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

    // ═══ الحالة 2: العقد الرئيسية ظاهرة (الفرعية مطوية حتى يُضغط عليها) ═══
    const COLLAPSED_GAP = 140;
    const EXPANDED_GAP  = 300;
    const rootX  = 50;
    const topicX = 400;
    const subX   = 780;

    // حساب المواقع — كل عقدة رئيسية تأخذ مساحة أكبر إذا كانت موسعة
    let currentY = 0;
    const positions: { y: number; isUserExpanded: boolean; effStatus: string }[] = [];
    masteryMap.forEach((n: any) => {
      const effStatus = (isTeacherOrAdmin && n.status === 'LOCKED') ? 'IN_PROGRESS' : n.status;
      const isUserExpanded = expandedTopics.has(n.nodeId) && effStatus !== 'LOCKED';
      positions.push({ y: currentY, isUserExpanded, effStatus });
      currentY += isUserExpanded ? EXPANDED_GAP : COLLAPSED_GAP;
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
      const isUserExpanded = positions[i].isUserExpanded;
      const effStatus = positions[i].effStatus;

      flowNodes.push({
        id: n.nodeId, type: 'topic',
        position: { x: topicX, y: topicY },
        data: { ...n, status: effStatus, isExpanded: isUserExpanded },
      });

      const strokeColor = effStatus === 'COMPLETED' ? '#10B981' : effStatus === 'IN_PROGRESS' ? '#3B82F6' : '#94a3b8';

      flowEdges.push({
        id: `root-${n.nodeId}`,
        source: 'root', target: n.nodeId,
        sourceHandle: 'r', targetHandle: 'l',
        type: 'default',
        animated: effStatus === 'IN_PROGRESS',
        style: { stroke: strokeColor, strokeWidth: 2 },
      });

      // ── الفرعيات تظهر فقط إذا ضغط المستخدم على العقدة الرئيسية ──
      if (!isUserExpanded) return;

      const subs = NODE_SUBS[order] || ['مستوى 1', 'مستوى 2', 'مستوى 3'];
      const middleSubY = topicY + (TOPIC_H - SUB_H) / 2;
      const subNodeGap = 20;

      const getSubStatus = (si: number): 'LOCKED' | 'OPEN' | 'COMPLETED' => {
        if (isTeacherOrAdmin) return 'OPEN';
        if (effStatus === 'LOCKED') return 'LOCKED';
        if (effStatus === 'COMPLETED') return 'COMPLETED';
        // IN_PROGRESS: only first sub-node is active by default, rest locked until previous completes
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
          data: { label, parentNodeId: n.nodeId, levelIndex: si, parentStatus: effStatus, subStatus },
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
  }, [masteryMap, rootExpanded, expandedTopics]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'root' && !rootExpanded) {
      expandRoot();
      return;
    }
    // ── الضغط على عقدة رئيسية = طي/فتح الفرعيات (بدون تنقل) ──
    if (node.type === 'topic' && node.data.status !== 'LOCKED') {
      toggleTopic(node.id);
      return;
    }
    // ── الضغط على عقدة فرعية = التنقل للمحتوى/الامتحان ──
    if (node.type === 'sub' && node.data.subStatus !== 'LOCKED') {
      navigate(`/node/${node.data.parentNodeId}?content=${node.data.levelIndex}&level=${node.data.levelIndex}`);
    }
  }, [navigate, rootExpanded, toggleTopic]);

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
          {!rootExpanded
            ? 'اضغط على العقدة المركزية لاستكشاف المفاهيم'
            : 'اضغط على أي عقدة رئيسية مفتوحة لعرض العقد الفرعية'}
        </p>
      </div>

      <div className="glass-card" style={{ height: '78vh', overflow: 'hidden' }}>
        <ReactFlow
          key={rootExpanded ? `expanded-${expandedTopics.size}` : 'collapsed'}
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
