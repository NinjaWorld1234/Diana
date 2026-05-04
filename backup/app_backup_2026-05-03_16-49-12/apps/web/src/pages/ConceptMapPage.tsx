import { useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlow, Background, Controls, type Node, type Edge, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion } from 'framer-motion';
import { adaptiveApi } from '../lib/api';
import { Lock, Unlock, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_STYLES: Record<string, any> = {
  LOCKED: { bg: '#334155', border: '#475569', opacity: 0.6, icon: Lock },
  IN_PROGRESS: { bg: '#1E293B', border: '#3B82F6', opacity: 1, icon: Unlock },
  COMPLETED: { bg: '#1E293B', border: '#10B981', opacity: 1, icon: CheckCircle },
};

function ConceptNodeComponent({ data }: { data: any }) {
  const statusStyle = STATUS_STYLES[data.status] || STATUS_STYLES.LOCKED;
  const Icon = statusStyle.icon;

  return (
    <div
      style={{
        width: '200px',
        padding: '16px',
        borderRadius: '16px',
        background: statusStyle.bg,
        border: `2px solid ${data.color || statusStyle.border}`,
        opacity: statusStyle.opacity,
        cursor: data.status !== 'LOCKED' ? 'pointer' : 'not-allowed',
        transition: 'all 0.3s',
        direction: 'rtl',
        textAlign: 'center',
        position: 'relative',
      }}
    >
      {data.needsReview && (
        <div style={{ position: 'absolute', top: -8, left: -8, background: '#F59E0B', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={14} color="black" />
        </div>
      )}
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: `${data.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 8px',
      }}>
        <Icon size={20} color={data.color || statusStyle.border} />
      </div>
      <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '6px' }}>
        {data.titleAr}
      </div>
      {data.masteryScore > 0 && (
        <div style={{
          fontSize: '0.75rem', fontWeight: 600,
          color: data.masteryScore >= 70 ? '#10B981' : '#F59E0B',
        }}>
          إتقان: {Math.round(data.masteryScore)}%
        </div>
      )}
    </div>
  );
}

const nodeTypes = { concept: ConceptNodeComponent };

export default function ConceptMapPage() {
  const navigate = useNavigate();
  const { data: masteryMap, isLoading } = useQuery({
    queryKey: ['mastery-map'],
    queryFn: () => adaptiveApi.getMasteryMap(),
  });

  // Build React Flow nodes and edges
  const { nodes, edges } = useMemo(() => {
    if (!masteryMap?.length) return { nodes: [], edges: [] };

    const cols = 3;
    const xGap = 280;
    const yGap = 160;

    const flowNodes: Node[] = masteryMap.map((n: any, i: number) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const xOffset = row % 2 === 1 ? xGap / 2 : 0; // zigzag

      return {
        id: n.nodeId,
        type: 'concept',
        position: { x: col * xGap + xOffset, y: row * yGap },
        data: n,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    const flowEdges: Edge[] = masteryMap.slice(1).map((n: any, i: number) => ({
      id: `e-${masteryMap[i].nodeId}-${n.nodeId}`,
      source: masteryMap[i].nodeId,
      target: n.nodeId,
      animated: n.status === 'IN_PROGRESS',
      style: {
        stroke: n.status === 'COMPLETED' ? '#10B981' : n.status === 'IN_PROGRESS' ? '#3B82F6' : '#475569',
        strokeWidth: 2,
      },
    }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [masteryMap]);

  const onNodeClick = useCallback((_: any, node: Node) => {
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

      <div className="glass-card" style={{ height: '70vh', overflow: 'hidden' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          proOptions={{ hideAttribution: true }}
          style={{ direction: 'ltr' }}
        >
          <Background color="#334155" gap={20} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '16px', justifyContent: 'center' }}>
        {[
          { color: '#475569', label: 'مغلقة 🔒' },
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
