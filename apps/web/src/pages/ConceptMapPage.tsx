import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlow, Background, Controls, type Node, type Edge, Position, Handle, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { adaptiveApi } from '../lib/api';
import { Lock, Unlock, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_STYLES: Record<string, any> = {
  LOCKED: { bg: 'var(--color-bg-hover)', border: 'var(--color-border)', opacity: 0.5, icon: Lock },
  IN_PROGRESS: { bg: 'var(--color-bg-secondary)', border: '#3B82F6', opacity: 1, icon: Unlock },
  COMPLETED: { bg: 'var(--color-bg-secondary)', border: '#10B981', opacity: 1, icon: CheckCircle },
};

/* ── Leaf Node (sub-concept bubble) ── */
function LeafNodeComponent({ data }: { data: any }) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.LOCKED;
  return (
    <div style={{
      minWidth: '180px', maxWidth: '220px', padding: '10px 14px',
      borderRadius: '20px', textAlign: 'center', direction: 'rtl',
      background: statusStyle.bg, opacity: statusStyle.opacity,
      border: `2px solid ${data.color || statusStyle.border}`,
      fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.4,
      color: 'var(--color-text)', cursor: data.status !== 'LOCKED' ? 'pointer' : 'not-allowed',
    }}>
      <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0 }} />
      {data.titleAr}
      <Handle type="source" position={Position.Left} id="left-source" style={{ opacity: 0 }} />
    </div>
  );
}

/* ── Branch Node (main concept) ── */
function BranchNodeComponent({ data }: { data: any }) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.LOCKED;
  const Icon = statusStyle.icon;
  return (
    <div style={{
      width: '280px', padding: '14px 20px',
      borderRadius: '16px', textAlign: 'center', direction: 'rtl',
      background: `${data.color || '#3B82F6'}18`,
      border: `2px solid ${data.color || statusStyle.border}`,
      opacity: statusStyle.opacity,
      cursor: data.status !== 'LOCKED' ? 'pointer' : 'not-allowed',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0 }} />
      {data.needsReview && (
        <div style={{ position: 'absolute', top: -8, left: -8, background: '#F59E0B', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={12} color="black" />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '4px' }}>
        <Icon size={16} color={data.color || statusStyle.border} />
        <span style={{ fontSize: '0.9rem', fontWeight: 700, lineHeight: 1.4 }}>{data.titleAr}</span>
      </div>
      {data.masteryScore > 0 && (
        <div style={{ fontSize: '0.7rem', fontWeight: 600, color: data.masteryScore >= 70 ? '#10B981' : '#F59E0B' }}>
          إتقان: {Math.round(data.masteryScore)}%
        </div>
      )}
      <Handle type="source" position={Position.Left} id="left-source" style={{ opacity: 0 }} />
    </div>
  );
}

/* ── Root Node (unit title) ── */
function RootNodeComponent({ data }: { data: any }) {
  return (
    <div style={{
      padding: '18px 28px', borderRadius: '16px', textAlign: 'center', direction: 'rtl',
      background: 'linear-gradient(135deg, #6366F120, #8B5CF620)',
      border: '3px solid #8B5CF6',
      fontWeight: 800, fontSize: '1rem', color: 'var(--color-text)',
    }}>
      {data.titleAr}
      <Handle type="source" position={Position.Left} id="left-source" style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { branch: BranchNodeComponent, leaf: LeafNodeComponent, root: RootNodeComponent };

export default function ConceptMapPage() {
  const navigate = useNavigate();
  const { data: masteryMap, isLoading } = useQuery({
    queryKey: ['mastery-map'],
    queryFn: () => adaptiveApi.getMasteryMap(),
  });

  const { nodes, edges } = useMemo(() => {
    if (!masteryMap?.length) return { nodes: [], edges: [] };

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];

    // Calculate total height to center the root node
    const yStart = 0;
    const yGap = 120;
    const totalHeight = (masteryMap.length - 1) * yGap;
    const rootY = totalHeight / 2;

    // Root node on the right side
    const rootId = 'root';
    flowNodes.push({
      id: rootId,
      type: 'root',
      position: { x: 1050, y: rootY }, // Moved further right
      data: { titleAr: 'الطاقة في التفاعلات\nالكيميائية' },
    });

    const branchX = 400; // Moved further left to increase spacing

    masteryMap.forEach((n: any, i: number) => {
      const y = yStart + i * yGap;

      // Branch node
      flowNodes.push({
        id: n.nodeId,
        type: 'branch',
        position: { x: branchX, y },
        data: n,
      });

      // Edge from root to branch
      const strokeColor = n.status === 'COMPLETED' ? '#10B981' : n.status === 'IN_PROGRESS' ? '#3B82F6' : '#94A3B8';
      flowEdges.push({
        id: `e-root-${n.nodeId}`,
        source: rootId,
        target: n.nodeId,
        sourceHandle: 'left-source',
        targetHandle: 'right-target',
        type: 'default', // Using default for beautiful bezier curves as requested
        animated: n.status === 'IN_PROGRESS',
        style: { stroke: strokeColor, strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16, color: strokeColor },
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [masteryMap]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    if (node.type === 'root') return;
    if (node.data.status !== 'LOCKED') {
      navigate(`/node/${node.id}`);
    }
  }, [navigate]);

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
        <p style={{ color: 'var(--color-text-secondary)' }}>اضغط على أي عقدة مفتوحة لبدء التعلم</p>
      </div>

      <div className="glass-card" style={{ height: '75vh', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          style={{ direction: 'ltr' }}
        >
          <Background color="var(--color-border)" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center' }}>
        {[
          { color: '#94A3B8', label: 'مغلقة 🔒' },
          { color: '#3B82F6', label: 'مفتوحة 🔓' },
          { color: '#10B981', label: 'منجزة ✅' },
        ].map((item) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 16, height: 16, borderRadius: 4, background: item.color }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
