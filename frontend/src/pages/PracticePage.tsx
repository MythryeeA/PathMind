import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Sparkles, Send, CheckCircle, AlertCircle, ArrowRight, BookOpen, Brain, ChevronRight, RefreshCw, Award } from 'lucide-react';
import { api } from '../api/client';

interface QuestionOption {
  id: string;
  text: string;
  misconceptionId?: string;
}

interface Question {
  id: string;
  conceptId: string;
  nodeTitle: string;
  stem: string;
  options: QuestionOption[];
  correctOptionId: string;
  difficulty: number;
  explanations: {
    analogy: string;
    math: string;
    code: string;
  };
}

const trackQuestions: Record<string, Question[]> = {
  ml_foundations: [
    {
      id: 'q_ml_1',
      conceptId: 'overfitting_underfitting',
      nodeTitle: 'ML Foundations: Overfitting vs Underfitting',
      stem: 'A deep neural network achieves 99.4% accuracy on the training set, but only 62.1% accuracy on the validation set. What is the fundamental issue and primary remedy?',
      options: [
        { id: 'opt_a', text: 'The model is underfitting due to low model capacity; increase layer width.' },
        { id: 'opt_b', text: 'The model is overfitting with high variance; apply L2 regularization, dropout, or collect more data.', misconceptionId: 'm_overfit' },
        { id: 'opt_c', text: 'Overfitting occurs only when dataset size is under 1,000 samples; architecture is irrelevant.' },
        { id: 'opt_d', text: 'The learning rate is too small, causing premature convergence.' },
      ],
      correctOptionId: 'opt_b',
      difficulty: 2,
      explanations: {
        analogy: '💡 Analogy: Overfitting is like memorizing every single question on past exams rather than learning the core scientific principles. When a new question appears on the actual exam, you fail.',
        math: '📐 Math: Expected generalization error is decomposed as E[(y - f̂(x))²] = Bias[f̂(x)]² + Var[f̂(x)] + σ². In overfitting, Var[f̂(x)] is excessively high due to fitting empirical noise.',
        code: '💻 Code:\n# Fix Overfitting by adding Dropout & Weight Decay\nmodel = nn.Sequential(\n    nn.Linear(128, 64),\n    nn.ReLU(),\n    nn.Dropout(p=0.3), # Drops 30% activations to reduce co-adaptation\n    nn.Linear(64, 10)\n)\noptimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)',
      },
    },
    {
      id: 'q_ml_2',
      conceptId: 'precision_recall',
      nodeTitle: 'ML Foundations: Precision vs Recall Trade-off',
      stem: 'In a medical diagnostic system screening for a rare, life-threatening disease where missing a positive case has severe consequences, which metric should be prioritized?',
      options: [
        { id: 'opt_a', text: 'Precision, because false alarms waste laboratory resources.' },
        { id: 'opt_b', text: 'Recall (Sensitivity), to minimize False Negatives so nearly all positive cases are detected.', misconceptionId: 'm_recall' },
        { id: 'opt_c', text: 'Accuracy, because high overall accuracy guarantees low false negative rates regardless of class balance.' },
        { id: 'opt_d', text: 'Specificity, because negative samples make up the majority of the population.' },
      ],
      correctOptionId: 'opt_b',
      difficulty: 2,
      explanations: {
        analogy: '💡 Analogy: A smoke detector in a hospital must have near 100% recall. Even if burnt toast triggers a rare false alarm, missing an actual fire is catastrophic.',
        math: '📐 Math: Recall = TP / (TP + FN). When the cost of FN >> cost of FP, the optimal Bayes classification threshold τ must be lowered: P(Y=1|X) > τ with τ < 0.5.',
        code: '💻 Code:\nfrom sklearn.metrics import classification_report, precision_recall_curve\n# Lower decision threshold from 0.50 to 0.20 to maximize Recall\ny_probs = model.predict_proba(X_val)[:, 1]\ny_pred_high_recall = (y_probs >= 0.20).astype(int)',
      },
    },
    {
      id: 'q_ml_3',
      conceptId: 'gradient_descent',
      nodeTitle: 'ML Foundations: Gradient Descent Dynamics',
      stem: 'During training of a regression model with Mean Squared Error loss, the loss suddenly diverges to NaN after a few iterations. What is the most probable cause?',
      options: [
        { id: 'opt_a', text: 'The batch size is too large, causing the gradient to vanish.' },
        { id: 'opt_b', text: 'The learning rate is too high (exploding gradients), causing updates to overshoot the minimum.', misconceptionId: 'm_grad' },
        { id: 'opt_c', text: 'The features are standardized with zero mean and unit variance.' },
        { id: 'opt_d', text: 'The loss function is convex, which prevents convergence.' },
      ],
      correctOptionId: 'opt_b',
      difficulty: 3,
      explanations: {
        analogy: '💡 Analogy: Imagine trying to step to the lowest point of a steep valley, but your stride is 500 meters long. You jump back and forth across mountain peaks until you fly off into space.',
        math: '📐 Math: Parameter update rule θ_{t+1} = θ_t - η ∇L(θ_t). For Lipschitz continuous gradient with constant L_grad, convergence requires η < 2 / L_grad. If η is too large, ||θ_{t+1} - θ*|| diverges geometrically.',
        code: '💻 Code:\n# Remedy: Clip gradients and use learning rate scheduler\ntorch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\nscheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode="min", factor=0.5, patience=2)',
      },
    },
  ],
};

export const PracticePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackId = searchParams.get('track') || 'ml_foundations';

  const questions = trackQuestions[trackId] || trackQuestions['ml_foundations'];
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // State
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number>(3);
  const [hasInteractedConfidence, setHasInteractedConfidence] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isBlindSpot, setIsBlindSpot] = useState<boolean>(false);

  // Failure streak for triggering multi-style explainer
  const [failStreak, setFailStreak] = useState<number>(0);
  const [activeStyle, setActiveStyle] = useState<'analogy' | 'math' | 'code'>('analogy');

  // Socratic Tutor State
  const [turns, setTurns] = useState<{ role: 'tutor' | 'learner'; text: string }[]>([]);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [learnerInput, setLearnerInput] = useState<string>('');
  const [isTutorLoading, setIsTutorLoading] = useState<boolean>(false);
  const [revealed, setRevealed] = useState<boolean>(false);

  // Level Up Proposal State
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [proposalData, setProposalData] = useState<{
    proposal_id: string;
    target_difficulty: number;
    rationale: string;
  } | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const currentQ = questions[currentIdx] || questions[0];

  useEffect(() => {
    // Reset when moving to another question
    setSelectedOption(null);
    setConfidence(3);
    setHasInteractedConfidence(false);
    setSubmitted(false);
    setIsCorrect(null);
    setIsBlindSpot(false);
    setTurns([]);
    setTurnCount(0);
    setRevealed(false);
    setShowLevelUpModal(false);
  }, [currentIdx, trackId]);

  const handleConfidenceChange = (val: number) => {
    setConfidence(val);
    setHasInteractedConfidence(true);
  };

  const handleSubmit = async () => {
    if (!selectedOption || !hasInteractedConfidence) return;

    const correct = selectedOption === currentQ.correctOptionId;
    setIsCorrect(correct);
    setSubmitted(true);

    if (!correct) {
      const newStreak = failStreak + 1;
      setFailStreak(newStreak);
      const isHighConfidenceBlindSpot = confidence >= 4;
      setIsBlindSpot(isHighConfidenceBlindSpot);

      // Trigger Socratic Tutor (Agent 3) initial turn
      const initialTutorTurn = {
        role: 'tutor' as const,
        text: `Let's reflect on this. You selected an option that reflects a common misconception. In your own words, what is happening to the model when the gap between training accuracy and validation accuracy becomes this large?`,
      };
      setTurns([initialTutorTurn]);
      setTurnCount(1);
    } else {
      setFailStreak(0);
      // Trigger Path Planner Proposal Modal
      const mockProposalId = `prop_${Date.now()}`;
      setProposalData({
        proposal_id: mockProposalId,
        target_difficulty: Math.min(5, currentQ.difficulty + 1),
        rationale: `Demonstrated solid mastery of ${currentQ.nodeTitle} with ${confidence}/5 confidence. Ready to advance target difficulty to Level ${Math.min(5, currentQ.difficulty + 1)}.`,
      });
      setShowLevelUpModal(true);
    }
  };

  const handleSendTurn = async () => {
    if (!learnerInput.trim() || isTutorLoading) return;

    const userText = learnerInput.trim();
    setLearnerInput('');
    const updatedTurns = [...turns, { role: 'learner' as const, text: userText }];
    setTurns(updatedTurns);
    setIsTutorLoading(true);

    try {
      // Attempt backend tutor call
      const res = await api.post('/tutor/turn', {
        concept_id: currentQ.conceptId,
        turn_number: turnCount + 1,
        dialogue_history: updatedTurns,
        learner_message: userText,
      }).catch(() => null);

      if (res && res.data && res.data.tutor_reply) {
        const nextTurns = [...updatedTurns, { role: 'tutor' as const, text: res.data.tutor_reply }];
        setTurns(nextTurns);
        const newCount = turnCount + 1;
        setTurnCount(newCount);
        if (res.data.is_resolved || newCount >= 3) {
          setRevealed(true);
        }
      } else {
        // Deterministic Socratic progression
        const newCount = turnCount + 1;
        setTurnCount(newCount);
        let reply = '';
        if (newCount === 2) {
          reply = `Precisely on track. If the model memorized the empirical noise instead of generalizable patterns, how would adding a regularization penalty (like weight decay or dropout) constrain this behavior?`;
        } else {
          reply = `Excellent reflection! High variance occurs when model capacity is too high relative to data signal. Regularization and cross-validation help anchor generalization.`;
          setRevealed(true);
        }
        setTurns([...updatedTurns, { role: 'tutor' as const, text: reply }]);
      }
    } catch {
      setTurnCount(prev => prev + 1);
      setRevealed(true);
    } finally {
      setIsTutorLoading(false);
    }
  };

  const handleApproveProposal = async (approved: boolean) => {
    if (!proposalData) return;
    setIsApproving(true);
    try {
      await api.post('/path/approve', {
        proposal_id: proposalData.proposal_id,
        approved: approved,
      }).catch(() => null);
    } finally {
      setIsApproving(false);
      setShowLevelUpModal(false);
      handleNextQuestion();
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Level Up / Next Step Modal */}
      {showLevelUpModal && proposalData && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(11, 15, 23, 0.88)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '1.5rem',
        }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.4)', boxShadow: '0 0 40px rgba(245, 158, 11, 0.2)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', border: '1px solid #f59e0b' }}>
              <Award size={36} color="#f59e0b" />
            </div>
            <span className="badge badge-gold" style={{ marginBottom: '0.5rem' }}>Path Planner Proposal</span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.75rem', marginTop: '0.25rem' }}>
              Advance to Difficulty {proposalData.target_difficulty}?
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
              {proposalData.rationale}
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => handleApproveProposal(false)}
                disabled={isApproving}
                className="gold-outline-btn"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Stay at Diff {currentQ.difficulty}
              </button>
              <button
                onClick={() => handleApproveProposal(true)}
                disabled={isApproving}
                className="gold-btn"
                style={{ flex: 1, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {isApproving ? <RefreshCw size={18} className="animate-spin" /> : <>Approve & Advance <ArrowRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Breadcrumb & Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <span className="badge badge-gold">{currentQ.nodeTitle}</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Question {currentIdx + 1} of {questions.length}</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Adaptive Mastery Session</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="badge badge-info" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
            Difficulty {currentQ.difficulty} / 5
          </div>
          {failStreak >= 2 && (
            <div className="badge badge-gold" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid #ef4444' }}>
              Multi-Style Remediation Active
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left is Question Card, Right is Socratic Tutor & Multi-Style Explainer */}
      <div style={{ display: 'grid', gridTemplateColumns: submitted && !isCorrect ? '1.1fr 0.9fr' : '1fr', gap: '1.75rem', alignItems: 'start' }}>
        {/* Question Panel */}
        <div className="glass-card" style={{ padding: '2.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem' }}>
            <Brain size={18} color="#f59e0b" />
            <span>Diagnostic Scenario</span>
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.6, marginBottom: '2rem', color: '#f8fafc' }}>
            {currentQ.stem}
          </h3>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
            {currentQ.options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              let bg = 'rgba(15, 23, 42, 0.6)';
              let border = '#334155';

              if (isSelected) {
                border = '#f59e0b';
                bg = 'rgba(245, 158, 11, 0.12)';
              }

              if (submitted) {
                if (opt.id === currentQ.correctOptionId) {
                  border = '#10b981';
                  bg = 'rgba(16, 185, 129, 0.18)';
                } else if (isSelected && !isCorrect) {
                  border = '#ef4444';
                  bg = 'rgba(239, 68, 68, 0.18)';
                }
              }

              return (
                <div
                  key={opt.id}
                  onClick={() => !submitted && setSelectedOption(opt.id)}
                  style={{
                    padding: '1.1rem 1.25rem',
                    borderRadius: '10px',
                    border: `1px solid ${border}`,
                    backgroundColor: bg,
                    cursor: submitted ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: `2px solid ${border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {isSelected && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />}
                  </div>
                  <span style={{ fontSize: '0.98rem', color: '#f1f5f9', lineHeight: 1.4 }}>{opt.text}</span>
                </div>
              );
            })}
          </div>

          {/* 1-5 Confidence Calibration Slider */}
          {!submitted && (
            <div style={{
              backgroundColor: '#0b0f17',
              padding: '1.25rem 1.5rem',
              borderRadius: '10px',
              border: hasInteractedConfidence ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid #334155',
              marginBottom: '1.75rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: hasInteractedConfidence ? '#f8fafc' : '#f59e0b' }}>
                  {hasInteractedConfidence ? 'Confidence Rating:' : '⚠️ Please set your confidence (1-5) before submitting:'}
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: '#f59e0b' }}>
                  {hasInteractedConfidence ? `${confidence} / 5` : 'Not Set'}
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={confidence}
                onChange={(e) => handleConfidenceChange(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer', marginBottom: '0.5rem' }}
              />

              {/* Quick clickable pill buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.5rem' }}>
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleConfidenceChange(lvl)}
                    style={{
                      flex: 1,
                      padding: '0.35rem',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: hasInteractedConfidence && confidence === lvl ? '1px solid #f59e0b' : '1px solid #1e293b',
                      backgroundColor: hasInteractedConfidence && confidence === lvl ? 'rgba(245, 158, 11, 0.2)' : '#111827',
                      color: hasInteractedConfidence && confidence === lvl ? '#f59e0b' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {lvl === 1 ? '1 Unsure' : lvl === 3 ? '3 Medium' : lvl === 5 ? '5 Confident' : lvl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submission and Outcomes */}
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedOption || !hasInteractedConfidence}
              className="gold-btn"
              style={{
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                opacity: (!selectedOption || !hasInteractedConfidence) ? 0.5 : 1,
                cursor: (!selectedOption || !hasInteractedConfidence) ? 'not-allowed' : 'pointer',
              }}
            >
              {!selectedOption
                ? 'Select an Option'
                : !hasInteractedConfidence
                  ? 'Set Confidence Slider to Submit'
                  : 'Submit Answer'}
            </button>
          ) : (
            <div style={{ marginTop: '0.5rem' }}>
              {isCorrect ? (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid #10b981',
                  marginBottom: '1rem',
                }}>
                  <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    <CheckCircle size={22} /> Correct! Mastered this concept.
                  </div>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.5 }}>
                    Your confidence was calibrated at {confidence}/5. You correctly identified the balance of variance and generalization.
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '1.25rem',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  marginBottom: '1rem',
                }}>
                  <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    <AlertCircle size={22} /> Misconception Identified
                  </div>
                  {isBlindSpot && (
                    <div style={{
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid #f59e0b',
                      color: '#f59e0b',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      marginTop: '0.5rem',
                    }}>
                      ⚡ High Confidence Blind Spot: You answered with {confidence}/5 confidence. Socratic Tutor activated to recalibrate mental model.
                    </div>
                  )}
                </div>
              )}

              {isCorrect && (
                <button
                  onClick={handleNextQuestion}
                  className="gold-btn"
                  style={{ width: '100%', padding: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  Continue to Next Node <ChevronRight size={18} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side Panel: Agent 3 Socratic Tutor & Multi-Style Explainer */}
        {submitted && !isCorrect && (
          <div className="glass-card" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', height: '100%', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
            {/* Socratic Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #1e293b', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#f59e0b" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Agent 3: Socratic Tutor</h4>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Turn {turnCount}/3 • Misconception Resolution</span>
                </div>
              </div>
              <span className="badge badge-gold">Active</span>
            </div>

            {/* Socratic Chat Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', maxHeight: '280px', overflowY: 'auto', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
              {turns.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    alignSelf: t.role === 'learner' ? 'flex-end' : 'flex-start',
                    backgroundColor: t.role === 'learner' ? 'rgba(245, 158, 11, 0.15)' : '#0b0f17',
                    border: t.role === 'learner' ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #1e293b',
                    color: t.role === 'learner' ? '#fef08a' : '#cbd5e1',
                    maxWidth: '92%',
                  }}
                >
                  <strong style={{ color: t.role === 'tutor' ? '#f59e0b' : '#38bdf8', display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                    {t.role === 'tutor' ? 'Socratic Tutor' : 'You'}
                  </strong>
                  {t.text}
                </div>
              ))}
              {isTutorLoading && (
                <div style={{ padding: '0.5rem', color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={14} className="animate-spin" /> Tutor formulating guidance...
                </div>
              )}
            </div>

            {/* Learner Reply Input */}
            {!revealed && (
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={learnerInput}
                  onChange={(e) => setLearnerInput(e.target.value)}
                  placeholder="Explain your reasoning or ask a question..."
                  onKeyDown={(e) => e.key === 'Enter' && handleSendTurn()}
                  disabled={isTutorLoading}
                  style={{
                    flex: 1,
                    padding: '0.7rem 0.9rem',
                    backgroundColor: '#0b0f17',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '0.9rem',
                  }}
                />
                <button
                  onClick={handleSendTurn}
                  disabled={isTutorLoading || !learnerInput.trim()}
                  className="gold-btn"
                  style={{ padding: '0.7rem 1rem' }}
                >
                  <Send size={16} />
                </button>
              </div>
            )}

            {/* Multi-Style Explainer Tabs (Agent 4) */}
            <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid #1e293b' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <BookOpen size={16} color="#f59e0b" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                    {failStreak >= 2 ? 'Multi-Style Explainer (Repeated Attempt)' : 'Multi-Style Representation'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {(['analogy', 'math', 'code'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setActiveStyle(s)}
                      style={{
                        padding: '0.3rem 0.65rem',
                        fontSize: '0.75rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        backgroundColor: activeStyle === s ? '#f59e0b' : '#1e293b',
                        color: activeStyle === s ? '#0b0f17' : '#94a3b8',
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {s === 'analogy' ? '💡 Analogy' : s === 'math' ? '📐 Math' : '💻 Code'}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{
                backgroundColor: '#0b0f17',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#cbd5e1',
                lineHeight: 1.5,
                border: '1px solid #1e293b',
                whiteSpace: 'pre-wrap',
                fontFamily: activeStyle === 'code' ? 'monospace' : 'inherit',
              }}>
                {currentQ.explanations[activeStyle]}
              </div>

              {/* Next Question button after engaging with tutor */}
              <button
                onClick={handleNextQuestion}
                className="gold-btn"
                style={{ width: '100%', marginTop: '1.25rem', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                Proceed to Next Question <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const Practice = PracticePage;
export default PracticePage;
