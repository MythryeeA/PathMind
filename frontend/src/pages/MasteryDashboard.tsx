import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  type Node,
  type Edge,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Brain,
  Sparkles,
  AlertTriangle,
  Clock,
  X,
  Play,
  Layers,
  ChevronRight,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { api } from '../api/client';

// Interfaces
interface Misconception {
  id: string;
  node_id: string;
  title: string;
  wrong_belief: string;
  rationale?: string;
}

interface ConceptNodeData {
  id: string;
  title: string;
  track: string;
  description: string;
  prerequisites: string[];
  sort_order: number;
  score: number;
  calibration: number;
  fail_streak: number;
  preferred_style: string;
  misconceptions: Misconception[];
  is_blind_spot: boolean;
  is_review_due: boolean;
  onSelectNode: (nodeData: ConceptNodeData) => void;
}

// Fallback seed data if offline/loading
const defaultConceptNodes: ConceptNodeData[] = [
  // ML Foundations
  {
    id: 'supervised_learning',
    title: 'Supervised vs Unsupervised',
    track: 'ml_foundations',
    description: 'Foundations of labeled vs unlabeled learning paradigms, inductive bias, and task formulations.',
    prerequisites: [],
    sort_order: 1,
    score: 0.92,
    calibration: 0.88,
    fail_streak: 0,
    preferred_style: 'analogy',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  {
    id: 'train_val_split',
    title: 'Train / Validation Splits',
    track: 'ml_foundations',
    description: 'Data leakage prevention, k-fold cross-validation, and stratification strategies.',
    prerequisites: ['supervised_learning'],
    sort_order: 2,
    score: 0.85,
    calibration: 0.80,
    fail_streak: 0,
    preferred_style: 'code',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  {
    id: 'overfitting',
    title: 'Overfitting & Regularization',
    track: 'ml_foundations',
    description: 'Bias-variance trade-off, L1/L2 weight decay, dropout mechanics, and model capacity control.',
    prerequisites: ['train_val_split'],
    sort_order: 3,
    score: 0.55,
    calibration: 0.45,
    fail_streak: 1,
    preferred_style: 'math',
    misconceptions: [
      {
        id: 'm_overfit_size',
        node_id: 'overfitting',
        title: 'Small Dataset Myth',
        wrong_belief: 'Overfitting only occurs when the dataset is small; architecture capacity is unrelated.',
        rationale: 'Overfitting is driven by model capacity relative to effective sample variance.',
      },
    ],
    is_blind_spot: true,
    is_review_due: true,
    onSelectNode: () => {},
  },
  {
    id: 'precision_recall',
    title: 'Precision vs Recall',
    track: 'ml_foundations',
    description: 'Confusion matrices, ROC-AUC, classification thresholds, and class imbalance cost sensitivity.',
    prerequisites: ['train_val_split'],
    sort_order: 4,
    score: 0.65,
    calibration: 0.60,
    fail_streak: 0,
    preferred_style: 'analogy',
    misconceptions: [
      {
        id: 'm_recall_imbalance',
        node_id: 'precision_recall',
        title: 'Accuracy in Imbalance Trap',
        wrong_belief: 'High accuracy implies low false negative rates regardless of positive prevalence.',
      },
    ],
    is_blind_spot: false,
    is_review_due: true,
    onSelectNode: () => {},
  },
  {
    id: 'gradient_descent',
    title: 'Gradient Descent Dynamics',
    track: 'ml_foundations',
    description: 'Stochastic vs mini-batch gradient descent, learning rate schedules, and momentum acceleration.',
    prerequisites: ['overfitting'],
    sort_order: 5,
    score: 0.42,
    calibration: 0.35,
    fail_streak: 2,
    preferred_style: 'math',
    misconceptions: [
      {
        id: 'm_lr_scale',
        node_id: 'gradient_descent',
        title: 'Learning Rate Miscalibration',
        wrong_belief: 'Higher learning rate always speeds up convergence without causing divergence.',
      },
    ],
    is_blind_spot: true,
    is_review_due: true,
    onSelectNode: () => {},
  },
  {
    id: 'loss_functions',
    title: 'Convexity & Loss Functions',
    track: 'ml_foundations',
    description: 'Cross-Entropy, MSE, Huber loss, and empirical risk minimization properties.',
    prerequisites: ['gradient_descent'],
    sort_order: 6,
    score: 0.30,
    calibration: 0.30,
    fail_streak: 0,
    preferred_style: 'math',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  // Deep Learning
  {
    id: 'backprop',
    title: 'Backpropagation & Chain Rule',
    track: 'deep_learning',
    description: 'Computational graphs, reverse-mode autodiff, and gradient accumulation.',
    prerequisites: ['gradient_descent'],
    sort_order: 7,
    score: 0.70,
    calibration: 0.65,
    fail_streak: 0,
    preferred_style: 'math',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  {
    id: 'self_attention',
    title: 'Transformer Self-Attention',
    track: 'deep_learning',
    description: 'Scaled dot-product attention, Query-Key-Value projections, and multi-head representation.',
    prerequisites: ['backprop'],
    sort_order: 8,
    score: 0.88,
    calibration: 0.82,
    fail_streak: 0,
    preferred_style: 'code',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  // NLP & GenAI
  {
    id: 'embeddings',
    title: 'Vector Embeddings & Cosine Sim',
    track: 'nlp_genai',
    description: 'Semantic vector spaces, token embeddings, and approximate nearest neighbor search.',
    prerequisites: ['self_attention'],
    sort_order: 9,
    score: 0.82,
    calibration: 0.80,
    fail_streak: 0,
    preferred_style: 'analogy',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  {
    id: 'rag_vs_finetune',
    title: 'RAG vs Fine-Tuning',
    track: 'nlp_genai',
    description: 'Parametric vs non-parametric memory trade-offs, latency, freshness, and citation grounding.',
    prerequisites: ['embeddings'],
    sort_order: 10,
    score: 0.60,
    calibration: 0.50,
    fail_streak: 0,
    preferred_style: 'analogy',
    misconceptions: [
      {
        id: 'm_rag_weights',
        node_id: 'rag_vs_finetune',
        title: 'Fine-Tuning Knowledge Storage Myth',
        wrong_belief: 'Fine-tuning is the optimal way to inject volatile factual knowledge into an LLM.',
      },
    ],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
  // Agentic AI
  {
    id: 'react_agent',
    title: 'ReAct Reasoning Loops',
    track: 'agentic_ai',
    description: 'Interleaving Thought-Action-Observation trajectories for deterministic tool orchestration.',
    prerequisites: ['rag_vs_finetune'],
    sort_order: 11,
    score: 0.45,
    calibration: 0.40,
    fail_streak: 0,
    preferred_style: 'code',
    misconceptions: [],
    is_blind_spot: false,
    is_review_due: false,
    onSelectNode: () => {},
  },
];

// Custom Flow Node with High-End Dark Gold Styling
const CustomSkillNode: React.FC<{ data: ConceptNodeData }> = ({ data }) => {
  const isMastered = data.score >= 0.8;
  const isInProgress = data.score >= 0.4 && data.score < 0.8;
  const isDanger = data.is_blind_spot || (data.score < 0.4 && data.fail_streak > 0);

  // Dynamic Theme Colors
  let borderColor = '#334155';
  let glowColor = 'transparent';
  let badgeBg = 'rgba(51, 65, 85, 0.4)';
  let badgeText = '#94a3b8';
  let statusLabel = 'Unstarted';

  if (isMastered) {
    borderColor = '#f59e0b';
    glowColor = 'rgba(245, 158, 11, 0.35)';
    badgeBg = 'rgba(245, 158, 11, 0.2)';
    badgeText = '#f59e0b';
    statusLabel = 'Mastered (≥80%)';
  } else if (isDanger) {
    borderColor = '#ef4444';
    glowColor = 'rgba(239, 68, 68, 0.35)';
    badgeBg = 'rgba(239, 68, 68, 0.2)';
    badgeText = '#f87171';
    statusLabel = data.is_blind_spot ? '⚡ Blind Spot' : 'Review Due';
  } else if (isInProgress) {
    borderColor = '#38bdf8';
    glowColor = 'rgba(56, 189, 248, 0.25)';
    badgeBg = 'rgba(56, 189, 248, 0.15)';
    badgeText = '#38bdf8';
    statusLabel = 'In Progress';
  }

  return (
    <div
      onClick={() => data.onSelectNode(data)}
      style={{
        padding: '1.1rem 1.25rem',
        borderRadius: '12px',
        backgroundColor: '#0f172a',
        border: `2px solid ${borderColor}`,
        boxShadow: `0 0 20px ${glowColor}, 0 4px 12px rgba(0,0,0,0.5)`,
        width: '260px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: borderColor, width: '8px', height: '8px' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            backgroundColor: badgeBg,
            color: badgeText,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          {statusLabel}
        </span>
        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: isMastered ? '#f59e0b' : '#cbd5e1' }}>
          {Math.round(data.score * 100)}%
        </span>
      </div>

      <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem', lineHeight: 1.3 }}>
        {data.title}
      </h4>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.6rem' }}>
        <div
          style={{
            width: `${Math.round(data.score * 100)}%`,
            height: '100%',
            backgroundColor: isMastered ? '#f59e0b' : isDanger ? '#ef4444' : '#38bdf8',
            borderRadius: '3px',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748b' }}>
        <span>Calib: {Math.round(data.calibration * 100)}%</span>
        <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
          Details <ChevronRight size={12} />
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: borderColor, width: '8px', height: '8px' }} />
    </div>
  );
};

const nodeTypes = {
  customSkill: CustomSkillNode,
};

export const MasteryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTrack, setActiveTrack] = useState<string>('ml_foundations');
  const [selectedNode, setSelectedNode] = useState<ConceptNodeData | null>(null);
  const [activeTab, setActiveTab] = useState<'graph' | 'blind_spots' | 'review_due'>('graph');
  const [allNodesData, setAllNodesData] = useState<ConceptNodeData[]>(defaultConceptNodes);
  const [_blindSpotsList, setBlindSpotsList] = useState<any[]>([]);
  const [_reviewDueList, setReviewDueList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch live mastery overview from backend
  useEffect(() => {
    let mounted = true;
    const fetchMastery = async () => {
      try {
        const res = await api.get('/mastery');
        if (mounted && res.data) {
          if (res.data.nodes && res.data.nodes.length > 0) {
            setAllNodesData(res.data.nodes);
          }
          if (res.data.blind_spots) {
            setBlindSpotsList(res.data.blind_spots);
          }
          if (res.data.review_due) {
            setReviewDueList(res.data.review_due);
          }
        }
      } catch (err) {
        console.warn('Using seeded concept tree for mastery visualization:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchMastery();
    return () => { mounted = false; };
  }, []);

  const handleSelectNodeCallback = useCallback((nodeData: ConceptNodeData) => {
    setSelectedNode(nodeData);
  }, []);

  // Filter and compute nodes & edges based on activeTrack
  const filteredNodes = useMemo(() => {
    if (activeTrack === 'all') return allNodesData;
    return allNodesData.filter((n) => n.track === activeTrack || activeTrack === 'all');
  }, [allNodesData, activeTrack]);

  // Layout algorithm for React Flow
  const { initialFlowNodes, initialFlowEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Hierarchical layout coordinate calculation
    const columns = 3;
    const xGap = 320;
    const yGap = 160;

    filteredNodes.forEach((node, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      nodes.push({
        id: node.id,
        type: 'customSkill',
        position: { x: col * xGap + 40, y: row * yGap + 40 },
        data: {
          ...node,
          onSelectNode: handleSelectNodeCallback,
        },
      });

      // Add edges from prerequisites
      if (node.prerequisites && node.prerequisites.length > 0) {
        node.prerequisites.forEach((prereqId) => {
          edges.push({
            id: `edge_${prereqId}_${node.id}`,
            source: prereqId,
            target: node.id,
            animated: node.score < 0.8 && node.score > 0,
            style: {
              stroke: node.score >= 0.8 ? '#f59e0b' : node.is_blind_spot ? '#ef4444' : '#334155',
              strokeWidth: 2,
            },
          });
        });
      }
    });

    return { initialFlowNodes: nodes, initialFlowEdges: edges };
  }, [filteredNodes, handleSelectNodeCallback]);

  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [flowEdges, setFlowEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  // Sync state when filter changes
  useEffect(() => {
    setFlowNodes(initialFlowNodes);
    setFlowEdges(initialFlowEdges);
  }, [initialFlowNodes, initialFlowEdges, setFlowNodes, setFlowEdges]);

  // Summary Metrics
  const trackMetrics = useMemo(() => {
    const total = filteredNodes.length;
    const mastered = filteredNodes.filter((n) => n.score >= 0.8).length;
    const blindSpots = filteredNodes.filter((n) => n.is_blind_spot).length;
    const avgScore = total > 0 ? Math.round((filteredNodes.reduce((acc, n) => acc + n.score, 0) / total) * 100) : 0;
    return { total, mastered, blindSpots, avgScore };
  }, [filteredNodes]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem', minHeight: 'calc(100vh - 80px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-gold">Mastery Skill Graph</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>~45 Concept Nodes & Dependency Links</span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>
            Visual Mastery <span className="gold-gradient-text">Skill Tree</span>
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.25rem' }}>
            Interactive confidence-calibrated knowledge map powered by Socratic diagnosis.
          </p>
        </div>

        {/* Global Progress Pill */}
        <div className="glass-card" style={{ padding: '1rem 1.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Track Progress</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b' }}>{trackMetrics.mastered} / {trackMetrics.total}</span>
          </div>
          <div style={{ height: '32px', width: '1px', backgroundColor: '#1e293b' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Avg Mastery</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>{trackMetrics.avgScore}%</span>
          </div>
          <div style={{ height: '32px', width: '1px', backgroundColor: '#1e293b' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>Blind Spots</span>
            <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f87171' }}>{trackMetrics.blindSpots}</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (Tracks + Views) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        {/* Track Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ml_foundations', label: 'ML Foundations (Primary)' },
            { id: 'deep_learning', label: 'Deep Learning' },
            { id: 'nlp_genai', label: 'NLP & GenAI' },
            { id: 'agentic_ai', label: 'Agentic AI' },
            { id: 'all', label: 'All Tracks' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTrack(t.id)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: activeTrack === t.id ? '1px solid #f59e0b' : '1px solid #1e293b',
                backgroundColor: activeTrack === t.id ? 'rgba(245, 158, 11, 0.2)' : '#0b0f17',
                color: activeTrack === t.id ? '#f59e0b' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#0b0f17', padding: '0.3rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <button
            onClick={() => setActiveTab('graph')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: activeTab === 'graph' ? '#f59e0b' : 'transparent',
              color: activeTab === 'graph' ? '#0b0f17' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Skill Tree Graph
          </button>
          <button
            onClick={() => setActiveTab('blind_spots')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: activeTab === 'blind_spots' ? '#ef4444' : 'transparent',
              color: activeTab === 'blind_spots' ? '#fff' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            ⚡ Blind Spots ({trackMetrics.blindSpots})
          </button>
          <button
            onClick={() => setActiveTab('review_due')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.8rem',
              fontWeight: 700,
              backgroundColor: activeTab === 'review_due' ? '#38bdf8' : 'transparent',
              color: activeTab === 'review_due' ? '#0b0f17' : '#94a3b8',
              cursor: 'pointer',
            }}
          >
            Review Due (Spaced Rep)
          </button>
        </div>
      </div>

      {/* Main Interactive Skill Tree Graph */}
      {activeTab === 'graph' && (
        <div
          className="glass-card"
          style={{
            height: '650px',
            width: '100%',
            position: 'relative',
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid #1e293b',
          }}
        >
          {isLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '0.5rem' }}>
              <RefreshCw className="animate-spin" size={24} color="#f59e0b" />
              <span>Loading Mastery Graph...</span>
            </div>
          ) : (
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              minZoom={0.4}
              maxZoom={1.5}
            >
              <Background color="#1e293b" gap={20} size={1} />
              <Controls style={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
              <MiniMap
                nodeColor={(n) => {
                  const data = n.data as unknown as ConceptNodeData;
                  if (data?.score >= 0.8) return '#f59e0b';
                  if (data?.is_blind_spot) return '#ef4444';
                  if (data?.score >= 0.4) return '#38bdf8';
                  return '#334155';
                }}
                style={{ backgroundColor: '#0b0f17', border: '1px solid #1e293b', borderRadius: '8px' }}
              />
            </ReactFlow>
          )}

          {/* Graph Legend */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              backgroundColor: 'rgba(11, 15, 23, 0.9)',
              backdropFilter: 'blur(8px)',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              display: 'flex',
              gap: '1.25rem',
              fontSize: '0.75rem',
              zIndex: 10,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <span style={{ color: '#cbd5e1' }}>Mastered (≥80%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              <span style={{ color: '#cbd5e1' }}>In Progress (40-79%)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <span style={{ color: '#cbd5e1' }}>⚡ Blind Spot / Urgent Review</span>
            </div>
          </div>
        </div>
      )}

      {/* Side Panel View: Blind Spots */}
      {activeTab === 'blind_spots' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredNodes.filter((n) => n.is_blind_spot || n.misconceptions.length > 0).map((n) => (
            <div key={n.id} className="glass-card" style={{ padding: '1.75rem', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <span className="badge badge-gold" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid #ef4444' }}>
                  ⚡ High Confidence Blind Spot
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f59e0b' }}>
                  Mastery: {Math.round(n.score * 100)}%
                </span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>{n.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{n.description}</p>

              {n.misconceptions.map((m) => (
                <div key={m.id} style={{ backgroundColor: '#0b0f17', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f87171', display: 'block', marginBottom: '0.25rem' }}>
                    Misconception: {m.title}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: 0 }}>"{m.wrong_belief}"</p>
                </div>
              ))}

              <button
                onClick={() => navigate(`/practice?concept_id=${n.id}&track=${n.track}`)}
                className="gold-btn"
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Play size={16} /> Remediate with Socratic Tutor
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Side Panel View: Review Due */}
      {activeTab === 'review_due' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {filteredNodes.filter((n) => n.is_review_due || n.score < 0.8).map((n) => (
            <div key={n.id} className="glass-card" style={{ padding: '1.75rem', border: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Clock size={16} /> Spaced Repetition Due
                </div>
                <span className="badge badge-gold">{n.preferred_style ? `Style: ${n.preferred_style}` : 'Review'}</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>{n.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{n.description}</p>

              <div style={{ backgroundColor: '#0b0f17', padding: '0.85rem', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Retention Calibration:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>{Math.round(n.calibration * 100)}%</span>
              </div>

              <button
                onClick={() => navigate(`/practice?concept_id=${n.id}&track=${n.track}`)}
                className="gold-btn"
                style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <RefreshCw size={16} /> Practice Spaced Review
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Side Drawer for Node Details */}
      {selectedNode && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            maxWidth: '460px',
            backgroundColor: '#0b0f17',
            borderLeft: '1px solid #1e293b',
            boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
            zIndex: 1000,
            padding: '2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Brain size={22} color="#f59e0b" />
                </div>
                <div>
                  <span className="badge badge-gold" style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    {selectedNode.track}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={24} />
              </button>
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.75rem' }}>
              {selectedNode.title}
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
              {selectedNode.description}
            </p>

            {/* Metrics Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <TrendingUp size={14} color="#f59e0b" /> Mastery Score
                </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: selectedNode.score >= 0.8 ? '#f59e0b' : '#38bdf8', display: 'block', marginTop: '0.25rem' }}>
                  {Math.round(selectedNode.score * 100)}%
                </span>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Sparkles size={14} color="#10b981" /> Confidence Calib
                </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', display: 'block', marginTop: '0.25rem' }}>
                  {Math.round(selectedNode.calibration * 100)}%
                </span>
              </div>
            </div>

            {/* Misconceptions Alert */}
            {selectedNode.misconceptions && selectedNode.misconceptions.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f87171', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  <AlertTriangle size={16} /> Curated Misconceptions
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedNode.misconceptions.map((m) => (
                    <div key={m.id} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.85rem', borderRadius: '8px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#f87171', display: 'block', marginBottom: '0.25rem' }}>
                        {m.title}
                      </span>
                      <p style={{ fontSize: '0.8rem', color: '#cbd5e1', margin: 0 }}>
                        "{m.wrong_belief}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prerequisites */}
            {selectedNode.prerequisites && selectedNode.prerequisites.length > 0 && (
              <div style={{ marginBottom: '1.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                  <Layers size={16} color="#f59e0b" /> Required Prerequisites
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {selectedNode.prerequisites.map((p) => (
                    <span key={p} className="badge badge-gold" style={{ fontSize: '0.75rem' }}>
                      {p.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action CTA */}
          <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #1e293b' }}>
            <button
              onClick={() => navigate(`/practice?concept_id=${selectedNode.id}&track=${selectedNode.track}`)}
              className="gold-btn"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
              }}
            >
              <Play size={18} /> Practice This Concept
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const DashboardPage = MasteryDashboard;
export default MasteryDashboard;
