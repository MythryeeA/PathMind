import { useNavigate } from 'react-router-dom';
import { Compass, Sparkles, Brain, Network, Cpu, ArrowRight } from 'lucide-react';

export function TrackPickerPage() {
  const navigate = useNavigate();

  const tracks = [
    {
      id: 'ml_foundations',
      title: 'ML Foundations',
      nodes: '12 Concept Nodes',
      icon: <Brain size={28} color="#f59e0b" />,
      desc: 'Supervised vs Unsupervised, Overfitting vs Underfitting, Precision & Recall, Gradient Descent mechanics.',
      featured: true,
      tag: 'Primary Track for Demo'
    },
    {
      id: 'deep_learning',
      title: 'Deep Learning',
      nodes: '12 Concept Nodes',
      icon: <Network size={28} color="#f59e0b" />,
      desc: 'Backpropagation, Activation functions, CNN architectures, Transformer Self-Attention mechanism.',
      featured: false,
    },
    {
      id: 'nlp_genai',
      title: 'NLP & GenAI',
      nodes: '12 Concept Nodes',
      icon: <Cpu size={28} color="#f59e0b" />,
      desc: 'Vector Embeddings, Tokenization, LLM Fine-Tuning vs RAG, Prompt Engineering, Hallucinations.',
      featured: false,
    },
    {
      id: 'agentic_ai',
      title: 'Agentic AI',
      nodes: '9 Concept Nodes',
      icon: <Compass size={28} color="#f59e0b" />,
      desc: 'Tool Execution, ReAct Reasoning loops, Agentic Memory, Multi-agent Orchestration & Safety.',
      featured: false,
    },
    {
      id: 'all',
      title: 'Diagnose Me (All Tracks)',
      nodes: '45 Nodes',
      icon: <Sparkles size={28} color="#f59e0b" />,
      desc: 'Adaptive diagnostic across ML, DL, NLP, and Agentic AI to map your skill tree & blind spots in 8 questions.',
      featured: false,
    },
  ];

  const handleSelectTrack = (trackId: string) => {
    navigate(`/practice?track=${trackId}`);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
          Select Your <span className="gold-gradient-text">Learning Track</span>
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
          Explore structured concept trees with confidence-calibrated Socratic tutoring and live mastery progression.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {tracks.map((t) => (
          <div
            key={t.id}
            className="glass-card"
            style={{
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              border: t.featured ? '2px solid rgba(245, 158, 11, 0.8)' : '1px solid #1e293b',
              boxShadow: t.featured ? '0 0 30px rgba(245, 158, 11, 0.25)' : 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
              position: 'relative',
            }}
            onClick={() => handleSelectTrack(t.id)}
          >
            {t.tag && (
              <div style={{
                position: 'absolute',
                top: '-12px',
                right: '20px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                color: '#0b0f17',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.6rem',
                borderRadius: '6px',
                letterSpacing: '0.04em'
              }}>
                {t.tag}
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {t.icon}
                </div>
                <span className="badge badge-gold">{t.nodes}</span>
              </div>

              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem' }}>{t.title}</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                {t.desc}
              </p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); handleSelectTrack(t.id); }}
              className={t.featured ? 'gold-btn' : 'gold-outline-btn'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', width: '100%' }}
            >
              {t.featured ? 'Start ML Foundations' : 'Explore Track'} <ArrowRight size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export const TrackPicker = TrackPickerPage;
export default TrackPickerPage;
