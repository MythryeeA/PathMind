import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Target, ArrowRight, Layers, HelpCircle, RefreshCw, Compass } from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: 'calc(100vh - 70px)', paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <section style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '4rem 1.5rem 3rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <div className="badge badge-gold" style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          <Sparkles size={14} /> Socratic AI/ML Tutor & Misconception Engine
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, maxWidth: '900px' }}>
          Stop Guessing Why You're Wrong in <span className="gold-gradient-text">AI & Machine Learning</span>
        </h1>

        <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '750px', lineHeight: 1.6 }}>
          PathMind doesn't just mark your answer wrong — it identifies your specific misconception, guides you with Socratic questions, and switches explanation styles until you truly master the concept.
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link to="/tracks" className="gold-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '0.8rem 1.8rem' }}>
            Start ML Foundations <ArrowRight size={20} />
          </Link>
          <Link to="/tracks" className="gold-outline-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', padding: '0.8rem 1.8rem' }}>
            <Compass size={20} /> Explore 4 Tracks
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          marginTop: '4rem',
        }}>
          <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Target size={26} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Misconception Diagnosis</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Maps wrong answers against a curated taxonomy of 30+ core AI misconceptions (overfitting, gradient descent traps, RAG vs fine-tuning).
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <HelpCircle size={26} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Socratic Tutoring Loop</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Asks targeted guiding questions capped at 3 turns to enable self-correction rather than revealing immediate answers.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <RefreshCw size={26} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Multi-Style Re-explanations</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Fails twice on a concept? The Explainer regenerates explanations dynamically switching between Analogy, Math, and Code.
            </p>
          </div>

          <div className="glass-card" style={{ padding: '2rem', textAlign: 'left' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
              <Layers size={26} color="#f59e0b" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>Live Mastery Skill Tree</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              Visualizes progress across ML Foundations, Deep Learning, NLP & GenAI, and Agentic AI with confidence-calibrated difficulty.
            </p>
          </div>
        </div>
      </section>

      {/* Tracks Preview */}
      <section style={{ maxWidth: '1200px', margin: '3rem auto 0', padding: '0 1.5rem' }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, textAlign: 'center', marginBottom: '2rem' }}>
          Curated Learning Tracks (~45 Concept Nodes)
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {[
            { title: 'ML Foundations', count: '12 Nodes', desc: 'Supervised vs Unsupervised, Overfitting, Precision/Recall, Gradient Descent' },
            { title: 'Deep Learning', count: '12 Nodes', desc: 'Backpropagation, Activations, CNNs, Transformers & Attention' },
            { title: 'NLP & GenAI', count: '12 Nodes', desc: 'Embeddings, Tokenization, LLMs, RAG vs Fine-tuning, Prompting' },
            { title: 'Agentic AI', count: '9 Nodes', desc: 'Tool Use, ReAct Framework, Memory, Multi-agent Coordination' },
          ].map((track, i) => (
            <div key={i} className="glass-card" style={{ padding: '1.75rem' }}>
              <span className="badge badge-gold" style={{ marginBottom: '0.75rem' }}>{track.count}</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>{track.title}</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{track.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
