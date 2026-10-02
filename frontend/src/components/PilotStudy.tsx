import React, { useState, useEffect, useRef } from 'react';
import { Target, Clock, CheckCircle2, Play, Sparkles, Send, ArrowRight, RotateCcw } from 'lucide-react';
import { api } from '../api/client';

export type PilotStage = 'idle' | 'pre_test' | 'socratic' | 'post_test' | 'complete';

interface Option {
  id: string;
  text: string;
  isCorrect?: boolean;
  misconceptionExplanation?: string;
}

interface PilotQuestion {
  id: string;
  title: string;
  concept: string;
  stem: string;
  options: Option[];
  correctOptionId: string;
  explanation: string;
}

interface QuestionAnswerState {
  selectedOption: string | null;
  confidence: number;
  hasInteractedConfidence: boolean;
}

const PRE_TEST_QUESTIONS: PilotQuestion[] = [
  {
    id: 'pre_q1',
    title: 'Pre-Test Q1: Generalization & Model Divergence',
    concept: 'Overfitting & High Variance',
    stem: 'A deep neural network achieves 99.4% accuracy on training data after 60 epochs, but validation accuracy drops from 74% to 61.2% while validation loss spikes. Which fundamental issue explains this divergence, and what is the primary remedy?',
    options: [
      {
        id: 'opt_a',
        text: 'The model has high bias (underfitting); increase the depth and width of hidden layers.',
        misconceptionExplanation: 'High bias causes poor performance on both training and validation sets. High training accuracy rules out high bias.',
      },
      {
        id: 'opt_b',
        text: 'The model suffers from high variance (overfitting); apply L2 regularization, dropout, or increase training sample diversity.',
        isCorrect: true,
        misconceptionExplanation: 'Correct! The divergence between train and validation accuracy indicates empirical noise memorization.',
      },
      {
        id: 'opt_c',
        text: 'The model learning rate is too low, causing optimization to stall in a shallow saddle point.',
        misconceptionExplanation: 'A low learning rate leads to slow convergence, not divergence of validation loss while training loss decreases.',
      },
      {
        id: 'opt_d',
        text: 'Overfitting only occurs when training samples are fewer than 1,000; network architecture has no influence.',
        misconceptionExplanation: 'Overfitting depends on the model capacity relative to data complexity, not an arbitrary 1,000-sample cutoff.',
      },
    ],
    correctOptionId: 'opt_b',
    explanation: 'High training accuracy paired with degrading validation performance is the hallmark of high variance / overfitting. Regularization, dropout, and more diverse data constrain the model from memorizing noise.',
  },
  {
    id: 'pre_q2',
    title: 'Pre-Test Q2: Bias-Variance Decomposition & Capacity',
    concept: 'Bias-Variance Tradeoff',
    stem: 'In the bias-variance decomposition of expected error E[(y - f̂(x))²] = Bias[f̂(x)]² + Var[f̂(x)] + σ², which condition describes an overfitted model with excess capacity?',
    options: [
      {
        id: 'opt_a',
        text: 'High Bias and Low Variance: the model fails to capture the true underlying data patterns.',
        misconceptionExplanation: 'This describes underfitting (e.g., fitting a linear model to quadratic data).',
      },
      {
        id: 'opt_b',
        text: 'Low Bias and High Variance: the model is excessively sensitive to noise and random sample perturbations.',
        isCorrect: true,
        misconceptionExplanation: 'Correct! High capacity fits sample noise, producing large predictions variance across folds.',
      },
      {
        id: 'opt_c',
        text: 'Irreducible error σ² is reduced to 0 by adding more polynomial features.',
        misconceptionExplanation: 'Irreducible error σ² is inherent noise in the data generating process and cannot be reduced by model capacity.',
      },
      {
        id: 'opt_d',
        text: 'Both bias and variance are simultaneously minimized to zero without regularization.',
        misconceptionExplanation: 'In general learning systems, there is an inherent tradeoff between bias and variance.',
      },
    ],
    correctOptionId: 'opt_b',
    explanation: 'Overfitting corresponds to Low Bias and High Variance: the estimator has high capacity to closely fit training samples, but oscillates unpredictably on new data points.',
  },
];

const POST_TEST_QUESTIONS: PilotQuestion[] = [
  {
    id: 'post_q1',
    title: 'Post-Test Q1: Preventing Variance Degradation',
    concept: 'Overfitting & Regularization Remedies',
    stem: 'During training of an image classifier, validation loss begins monotonically increasing after epoch 22, while training loss drops to near zero. Which intervention directly counteracts this high-variance regime without changing the training dataset?',
    options: [
      {
        id: 'opt_a',
        text: 'Disable weight decay and increase learning rate to force rapid traversal across loss valleys.',
        misconceptionExplanation: 'Disabling weight decay removes weight shrinkage, worsening overfitting.',
      },
      {
        id: 'opt_b',
        text: 'Introduce Early Stopping based on validation loss, accompanied by Dropout and L2 weight decay.',
        isCorrect: true,
        misconceptionExplanation: 'Correct! Early stopping halts training before noise memorization occurs, while dropout reduces co-adaptation.',
      },
      {
        id: 'opt_c',
        text: 'Double the parameter count of the neural network to memorize remaining hard examples.',
        misconceptionExplanation: 'Increasing parameter count further inflates variance and worsens generalization.',
      },
      {
        id: 'opt_d',
        text: 'Switch from cross-entropy loss to Mean Squared Error without regularization.',
        misconceptionExplanation: 'Changing the loss function to MSE for classification does not address high variance.',
      },
    ],
    correctOptionId: 'opt_b',
    explanation: 'Early stopping acts as a natural regularizer by terminating training at optimal validation loss. Dropout and L2 weight decay restrict weights from fitting noise.',
  },
  {
    id: 'post_q2',
    title: 'Post-Test Q2: Variance Reduction Mechanisms',
    concept: 'Data-Centric Variance Reduction',
    stem: 'Which of the following interventions reduces model variance while preserving the expressiveness of the underlying hypothesis space and architecture?',
    options: [
      {
        id: 'opt_a',
        text: 'Removing half of the hidden layers and linearizing activation functions.',
        misconceptionExplanation: 'Pruning layers fundamentally restricts hypothesis expressiveness (increasing bias).',
      },
      {
        id: 'opt_b',
        text: 'Restricting the input feature space to only a single dominant feature.',
        misconceptionExplanation: 'Eliminating features increases bias and risks severe underfitting.',
      },
      {
        id: 'opt_c',
        text: 'Increasing the effective training volume through synthetic data augmentation and collecting more samples.',
        isCorrect: true,
        misconceptionExplanation: 'Correct! More training data shrinks estimator variance without compromising model capacity.',
      },
      {
        id: 'opt_d',
        text: 'Binarizing all continuous inputs into single-threshold step functions.',
        misconceptionExplanation: 'Quantizing features degrades signal resolution and increases bias.',
      },
    ],
    correctOptionId: 'opt_c',
    explanation: 'As sample size N increases, estimator variance scales as O(1/N). Collecting more data or applying realistic data augmentation reduces variance without degrading model expressiveness.',
  },
];

interface PilotStudyProps {
  onComplete?: (results: {
    preScore: number;
    postScore: number;
    gain: number;
    timeSeconds: number;
  }) => void;
}

export const PilotStudy: React.FC<PilotStudyProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<PilotStage>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [runId, setRunId] = useState<string | null>(null);

  // Pre-test answers
  const [preAnswers, setPreAnswers] = useState<Record<string, QuestionAnswerState>>({
    pre_q1: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
    pre_q2: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
  });

  // Post-test answers
  const [postAnswers, setPostAnswers] = useState<Record<string, QuestionAnswerState>>({
    post_q1: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
    post_q2: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
  });

  // Socratic dialogue state
  const [turns, setTurns] = useState<{ role: 'tutor' | 'learner'; text: string }[]>([]);
  const [learnerInput, setLearnerInput] = useState<string>('');
  const [isTutorTyping, setIsTutorTyping] = useState<boolean>(false);
  const [socraticTurnCount, setSocraticTurnCount] = useState<number>(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live stopwatch timer
  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerRunning]);

  // Scroll chat to bottom on new turns
  useEffect(() => {
    if (stage === 'socratic' && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, isTutorTyping, stage]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const handleStartSession = async () => {
    setElapsedSeconds(0);
    setTimerRunning(true);
    setStage('pre_test');
    setPreAnswers({
      pre_q1: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
      pre_q2: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
    });
    setPostAnswers({
      post_q1: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
      post_q2: { selectedOption: null, confidence: 3, hasInteractedConfidence: false },
    });
    setTurns([]);
    setSocraticTurnCount(0);

    // Call backend start endpoint if available
    try {
      const res = await api.post('/eval/start', { node_id: 'overfitting_underfitting' }).catch(() => null);
      if (res && res.data && res.data.run_id) {
        setRunId(res.data.run_id);
      }
    } catch {
      // Offline fallback
    }
  };

  // Check if pre-test is fully answered
  const isPreTestComplete =
    preAnswers.pre_q1.selectedOption !== null &&
    preAnswers.pre_q1.hasInteractedConfidence &&
    preAnswers.pre_q2.selectedOption !== null &&
    preAnswers.pre_q2.hasInteractedConfidence;

  // Check if post-test is fully answered
  const isPostTestComplete =
    postAnswers.post_q1.selectedOption !== null &&
    postAnswers.post_q1.hasInteractedConfidence &&
    postAnswers.post_q2.selectedOption !== null &&
    postAnswers.post_q2.hasInteractedConfidence;

  // Transition to Socratic Stage
  const handleAdvanceToSocratic = () => {
    if (!isPreTestComplete) return;

    setStage('socratic');

    // Tailor initial Socratic prompt
    const q1Ans = preAnswers.pre_q1.selectedOption;
    const q2Ans = preAnswers.pre_q2.selectedOption;
    const q1Correct = q1Ans === PRE_TEST_QUESTIONS[0].correctOptionId;
    const q2Correct = q2Ans === PRE_TEST_QUESTIONS[1].correctOptionId;

    let initialPrompt = `Welcome to the Socratic Learning session on **Overfitting & High Variance**!\n\n`;
    if (!q1Correct || !q2Correct) {
      initialPrompt += `In your pre-test diagnostic, we detected an opportunity to sharpen your mental model of the bias-variance tradeoff. When a machine learning model shows 99% training accuracy but 61% validation accuracy, what is happening to the parameter weights, and why does this harm generalization?`;
    } else {
      initialPrompt += `Great diagnostic baseline! Let's solidify the intuition: When a deep neural network has millions of parameters, why does it naturally fit empirical noise, and how do regularization techniques (like L2 weight decay or dropout) mathematically prevent weight divergence?`;
    }

    setTurns([{ role: 'tutor', text: initialPrompt }]);
    setSocraticTurnCount(1);
  };

  // Send message in Socratic chat
  const handleSendSocraticMessage = async (customText?: string) => {
    const textToSend = (customText || learnerInput).trim();
    if (!textToSend || isTutorTyping) return;

    setLearnerInput('');
    const updatedTurns = [...turns, { role: 'learner' as const, text: textToSend }];
    setTurns(updatedTurns);
    setIsTutorTyping(true);

    try {
      // Call backend tutor API if available
      const res = await api
        .post('/tutor/turn', {
          concept_id: 'overfitting_underfitting',
          turn_number: socraticTurnCount + 1,
          dialogue_history: updatedTurns,
          learner_message: textToSend,
        })
        .catch(() => null);

      if (res && res.data && res.data.tutor_reply) {
        setTurns([...updatedTurns, { role: 'tutor' as const, text: res.data.tutor_reply }]);
        setSocraticTurnCount((c) => c + 1);
      } else {
        // High-fidelity fallback Socratic tutor responses
        setTimeout(() => {
          let tutorReply = '';
          const nextCount = socraticTurnCount + 1;
          setSocraticTurnCount(nextCount);

          if (nextCount === 2) {
            tutorReply = `Precisely reasoned! When weights grow excessively large, the model function oscillates wildly between data points to memorize individual labels. Now, if you introduce an L2 penalty (λ * Σ w_i²), how does penalizing large weight magnitudes smooth out the decision boundary?`;
          } else if (nextCount === 3) {
            tutorReply = `Spot on. The L2 penalty shrinks parameter weights toward zero, which acts as a constraint against fitting high-frequency noise. You now understand why regularization directly lowers variance without discarding model capacity! Ready to validate your knowledge in the post-test?`;
          } else {
            tutorReply = `Excellent insight. In summary: High Variance = Low Bias + overfitting to sample noise. Key remedies: Regularization (L2/dropout), Early Stopping, and expanding dataset size. Proceed to the post-test to evaluate your knowledge gain!`;
          }
          setTurns([...updatedTurns, { role: 'tutor' as const, text: tutorReply }]);
          setIsTutorTyping(false);
        }, 600);
        return;
      }
    } catch {
      setTurns([
        ...updatedTurns,
        {
          role: 'tutor',
          text: `Key takeaway: Overfitting occurs when model capacity is too high relative to sample size. Regularization (L2, dropout) and early stopping stabilize validation performance. Proceed to the post-test!`,
        },
      ]);
    } finally {
      setIsTutorTyping(false);
    }
  };

  // Transition to Post-Test
  const handleAdvanceToPostTest = () => {
    setStage('post_test');
  };

  // Complete session & compute scores
  const handleFinishPilot = async () => {
    if (!isPostTestComplete) return;

    setTimerRunning(false);
    setStage('complete');

    // Calculate Pre-Test Score
    const preQ1Correct = preAnswers.pre_q1.selectedOption === PRE_TEST_QUESTIONS[0].correctOptionId;
    const preQ2Correct = preAnswers.pre_q2.selectedOption === PRE_TEST_QUESTIONS[1].correctOptionId;
    const preScore = Math.round((( (preQ1Correct ? 1 : 0) + (preQ2Correct ? 1 : 0) ) / 2) * 100);

    // Calculate Post-Test Score
    const postQ1Correct = postAnswers.post_q1.selectedOption === POST_TEST_QUESTIONS[0].correctOptionId;
    const postQ2Correct = postAnswers.post_q2.selectedOption === POST_TEST_QUESTIONS[1].correctOptionId;
    const postScore = Math.round((( (postQ1Correct ? 1 : 0) + (postQ2Correct ? 1 : 0) ) / 2) * 100);

    const gain = postScore - preScore;

    if (onComplete) {
      onComplete({
        preScore,
        postScore,
        gain,
        timeSeconds: elapsedSeconds,
      });
    }

    // Call backend finish endpoint if runId exists
    if (runId) {
      try {
        await api.post('/eval/finish', { run_id: runId, post_score: postScore / 100 }).catch(() => null);
      } catch {
        // Ignore offline error
      }
    }
  };

  // Calculate scores for complete view
  const preQ1Correct = preAnswers.pre_q1.selectedOption === PRE_TEST_QUESTIONS[0].correctOptionId;
  const preQ2Correct = preAnswers.pre_q2.selectedOption === PRE_TEST_QUESTIONS[1].correctOptionId;
  const preCorrectCount = (preQ1Correct ? 1 : 0) + (preQ2Correct ? 1 : 0);
  const preScore = Math.round((preCorrectCount / 2) * 100);

  const postQ1Correct = postAnswers.post_q1.selectedOption === POST_TEST_QUESTIONS[0].correctOptionId;
  const postQ2Correct = postAnswers.post_q2.selectedOption === POST_TEST_QUESTIONS[1].correctOptionId;
  const postCorrectCount = (postQ1Correct ? 1 : 0) + (postQ2Correct ? 1 : 0);
  const postScore = Math.round((postCorrectCount / 2) * 100);

  const absoluteGain = postScore - preScore;
  const normalizedGain =
    preScore < 100 ? Math.round(((postScore - preScore) / (100 - preScore)) * 100) : 100;

  return (
    <div
      className="glass-card"
      style={{
        padding: '2rem',
        marginBottom: '2rem',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* Pilot Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Target size={22} color="#f59e0b" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
              Pilot Study Mode <span style={{ color: '#94a3b8', fontWeight: 400 }}>(Pre → Socratic Learn → Post)</span>
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>
              Target Concept: Overfitting & High Variance
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {stage !== 'idle' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: '#0b0f17',
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                color: '#f8fafc',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Clock size={16} color="#f59e0b" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          )}
          <span className="badge badge-gold">Live Evaluation Test</span>
        </div>
      </div>

      {/* Stage Tracker Bar */}
      {stage !== 'idle' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            padding: '0.5rem',
            backgroundColor: '#0b0f17',
            borderRadius: '8px',
            border: '1px solid #1e293b',
          }}
        >
          {[
            { key: 'pre_test', label: '1. Pre-Test (2 MCQs)' },
            { key: 'socratic', label: '2. Socratic Session' },
            { key: 'post_test', label: '3. Post-Test (2 MCQs)' },
            { key: 'complete', label: '4. Knowledge Gain' },
          ].map((st) => {
            const isCurrent = stage === st.key;
            const isDone =
              (st.key === 'pre_test' && ['socratic', 'post_test', 'complete'].includes(stage)) ||
              (st.key === 'socratic' && ['post_test', 'complete'].includes(stage)) ||
              (st.key === 'post_test' && stage === 'complete') ||
              (st.key === 'complete' && stage === 'complete');

            return (
              <div
                key={st.key}
                style={{
                  padding: '0.5rem',
                  borderRadius: '6px',
                  textAlign: 'center',
                  fontSize: '0.78rem',
                  fontWeight: isCurrent ? 700 : 500,
                  backgroundColor: isCurrent
                    ? 'rgba(245, 158, 11, 0.2)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'transparent',
                  color: isCurrent ? '#f59e0b' : isDone ? '#10b981' : '#64748b',
                  border: isCurrent
                    ? '1px solid #f59e0b'
                    : isDone
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                {st.label}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. IDLE STAGE */}
      {stage === 'idle' && (
        <div style={{ backgroundColor: '#0b0f17', padding: '1.75rem', borderRadius: '10px', border: '1px solid #1e293b' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.5rem', color: '#f8fafc' }}>
            Empirical Knowledge Gain Evaluation
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Run an end-to-end controlled pilot study on <strong>Overfitting & High Variance</strong>. You will complete:
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '1.75rem',
            }}
          >
            <div style={{ padding: '1rem', backgroundColor: '#151c28', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>Step 1: Diagnostic Pre-Test</span>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem' }}>
                2 MCQs with confidence calibration (1–5) to measure baseline misconception strength.
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#151c28', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#3b82f6', fontWeight: 700, fontSize: '0.9rem' }}>Step 2: Socratic Practice</span>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem' }}>
                Interactive dialogue with Socratic Tutor (Agent 3) to deconstruct root misconceptions.
              </p>
            </div>
            <div style={{ padding: '1rem', backgroundColor: '#151c28', borderRadius: '8px', border: '1px solid #1e293b' }}>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Step 3: Post-Test & Gain Metric</span>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '0.3rem' }}>
                Validation MCQs calculating normalized knowledge gain % and time-to-mastery.
              </p>
            </div>
          </div>
          <button
            onClick={handleStartSession}
            className="gold-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', padding: '0.75rem 1.5rem' }}
          >
            <Play size={18} /> Start Pilot Study Session
          </button>
        </div>
      )}

      {/* 2. PRE-TEST STAGE */}
      {stage === 'pre_test' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#0b0f17',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>
                Stage: 1. Pre-Test Diagnostic (2 Questions)
              </span>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Select your answer and rate your confidence (1–5) for each question to unlock Socratic Practice.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isPreTestComplete ? '#10b981' : '#f59e0b',
                }}
              >
                {isPreTestComplete
                  ? '✓ Both Answered'
                  : `${(preAnswers.pre_q1.selectedOption && preAnswers.pre_q1.hasInteractedConfidence ? 1 : 0) +
                      (preAnswers.pre_q2.selectedOption && preAnswers.pre_q2.hasInteractedConfidence ? 1 : 0)} / 2 Answered`}
              </span>
            </div>
          </div>

          {/* Render Pre-Test Questions */}
          {PRE_TEST_QUESTIONS.map((q, qIndex) => {
            const state = q.id === 'pre_q1' ? preAnswers.pre_q1 : preAnswers.pre_q2;
            const qKey = q.id as 'pre_q1' | 'pre_q2';

            return (
              <div
                key={q.id}
                style={{
                  backgroundColor: '#0b0f17',
                  borderRadius: '12px',
                  border: state.selectedOption ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #1e293b',
                  padding: '1.5rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      Question {qIndex + 1} of 2
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>• {q.concept}</span>
                  </div>
                  {state.selectedOption && state.hasInteractedConfidence && (
                    <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={16} /> Ready
                    </span>
                  )}
                </div>

                {/* Stem */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {q.stem}
                </h3>

                {/* 4 Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = state.selectedOption === opt.id;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setPreAnswers((prev) => ({
                            ...prev,
                            [qKey]: { ...prev[qKey], selectedOption: opt.id },
                          }));
                        }}
                        style={{
                          padding: '0.9rem 1.15rem',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #f59e0b' : '1px solid #1e293b',
                          backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.12)' : '#151c28',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #f59e0b' : '1px solid #475569',
                            backgroundColor: isSelected ? '#f59e0b' : 'transparent',
                            color: isSelected ? '#0b0f17' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {letter}
                        </div>
                        <span style={{ fontSize: '0.92rem', color: isSelected ? '#fff' : '#cbd5e1', lineHeight: 1.4 }}>
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Confidence Calibration Slider (1-5) */}
                <div
                  style={{
                    backgroundColor: '#151c28',
                    padding: '1.1rem 1.25rem',
                    borderRadius: '8px',
                    border: state.hasInteractedConfidence ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: state.hasInteractedConfidence ? '#f8fafc' : '#f59e0b' }}>
                      {state.hasInteractedConfidence
                        ? 'Confidence Calibration Rating:'
                        : '⚠️ Please set your confidence (1–5) for this answer:'}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
                      {state.hasInteractedConfidence ? `${state.confidence} / 5` : 'Not Set'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={state.confidence}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPreAnswers((prev) => ({
                        ...prev,
                        [qKey]: { ...prev[qKey], confidence: val, hasInteractedConfidence: true },
                      }));
                    }}
                    style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer', marginBottom: '0.5rem' }}
                  />

                  {/* Quick Pill Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const isLvl = state.hasInteractedConfidence && state.confidence === lvl;
                      const label = lvl === 1 ? '1 Unsure' : lvl === 3 ? '3 Medium' : lvl === 5 ? '5 Confident' : `${lvl}`;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setPreAnswers((prev) => ({
                              ...prev,
                              [qKey]: { ...prev[qKey], confidence: lvl, hasInteractedConfidence: true },
                            }));
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: isLvl ? '1px solid #f59e0b' : '1px solid #1e293b',
                            backgroundColor: isLvl ? 'rgba(245, 158, 11, 0.2)' : '#0b0f17',
                            color: isLvl ? '#f59e0b' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: isLvl ? 700 : 500,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0b0f17',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid #1e293b',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {!isPreTestComplete
                ? 'Answer both questions and set confidence ratings above to advance.'
                : 'Both questions answered! Proceed to guided Socratic reflection.'}
            </span>

            <button
              onClick={handleAdvanceToSocratic}
              disabled={!isPreTestComplete}
              className="gold-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                opacity: !isPreTestComplete ? 0.45 : 1,
                cursor: !isPreTestComplete ? 'not-allowed' : 'pointer',
              }}
            >
              Advance to Socratic Practice {isPreTestComplete && <ArrowRight size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* 3. SOCRATIC STAGE */}
      {stage === 'socratic' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#0b0f17',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={18} color="#f59e0b" />
              </div>
              <div>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.95rem' }}>
                  Stage: 2. Socratic Learning Session
                </span>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.1rem 0 0 0' }}>
                  Agent 3: Socratic Dialogue • Target Misconception Resolution
                </p>
              </div>
            </div>
            <button
              onClick={handleAdvanceToPostTest}
              className="gold-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 1.2rem',
                fontSize: '0.9rem',
              }}
            >
              Advance to Post-Test <ArrowRight size={16} />
            </button>
          </div>

          {/* Socratic Chat Window */}
          <div
            style={{
              backgroundColor: '#0b0f17',
              borderRadius: '12px',
              border: '1px solid #1e293b',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '380px',
            }}
          >
            {/* Message List */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                overflowY: 'auto',
                maxHeight: '400px',
                paddingRight: '0.5rem',
                marginBottom: '1.25rem',
              }}
            >
              {turns.map((t, idx) => (
                <div
                  key={idx}
                  style={{
                    alignSelf: t.role === 'learner' ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    padding: '0.9rem 1.2rem',
                    borderRadius: '10px',
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    backgroundColor: t.role === 'learner' ? 'rgba(245, 158, 11, 0.15)' : '#151c28',
                    border: t.role === 'learner' ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid #1e293b',
                    color: t.role === 'learner' ? '#fef08a' : '#e2e8f0',
                    whiteSpace: 'pre-line',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: t.role === 'learner' ? '#f59e0b' : '#38bdf8',
                      marginBottom: '0.3rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {t.role === 'learner' ? 'You (Learner)' : 'Socratic Tutor (Agent 3)'}
                  </div>
                  {t.text}
                </div>
              ))}

              {isTutorTyping && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    backgroundColor: '#151c28',
                    border: '1px solid #1e293b',
                    color: '#94a3b8',
                    fontSize: '0.85rem',
                    fontStyle: 'italic',
                  }}
                >
                  Socratic Tutor is contemplating response...
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Socratic Suggestion Prompts */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.4rem' }}>
                💡 Click a quick reflection prompt to respond:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {[
                  'The model is memorizing empirical sample noise rather than invariant features.',
                  'Excess parameter capacity causes extreme variance on unseen distributions.',
                  'An L2 penalty restricts weight magnitudes, preventing wild oscillations.',
                ].map((promptText, pIdx) => (
                  <button
                    key={pIdx}
                    onClick={() => handleSendSocraticMessage(promptText)}
                    disabled={isTutorTyping}
                    style={{
                      backgroundColor: '#151c28',
                      border: '1px solid #334155',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      cursor: isTutorTyping ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#f59e0b';
                      (e.currentTarget as HTMLElement).style.color = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#334155';
                      (e.currentTarget as HTMLElement).style.color = '#94a3b8';
                    }}
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={learnerInput}
                onChange={(e) => setLearnerInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendSocraticMessage()}
                placeholder="Type your reflection or answer here..."
                disabled={isTutorTyping}
                style={{
                  flex: 1,
                  backgroundColor: '#151c28',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  color: '#f8fafc',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
              <button
                onClick={() => handleSendSocraticMessage()}
                disabled={!learnerInput.trim() || isTutorTyping}
                className="gold-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.75rem 1.25rem',
                  opacity: !learnerInput.trim() || isTutorTyping ? 0.5 : 1,
                  cursor: !learnerInput.trim() || isTutorTyping ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={16} /> Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. POST-TEST STAGE */}
      {stage === 'post_test' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div
            style={{
              padding: '1rem 1.25rem',
              backgroundColor: '#0b0f17',
              borderRadius: '10px',
              border: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.95rem' }}>
                Stage: 3. Post-Test Validation (2 Questions)
              </span>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
                Validate concept mastery after the Socratic session to calculate empirical knowledge gain.
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  color: isPostTestComplete ? '#10b981' : '#f59e0b',
                }}
              >
                {isPostTestComplete
                  ? '✓ Both Answered'
                  : `${(postAnswers.post_q1.selectedOption && postAnswers.post_q1.hasInteractedConfidence ? 1 : 0) +
                      (postAnswers.post_q2.selectedOption && postAnswers.post_q2.hasInteractedConfidence ? 1 : 0)} / 2 Answered`}
              </span>
            </div>
          </div>

          {/* Render Post-Test Questions */}
          {POST_TEST_QUESTIONS.map((q, qIndex) => {
            const state = q.id === 'post_q1' ? postAnswers.post_q1 : postAnswers.post_q2;
            const qKey = q.id as 'post_q1' | 'post_q2';

            return (
              <div
                key={q.id}
                style={{
                  backgroundColor: '#0b0f17',
                  borderRadius: '12px',
                  border: state.selectedOption ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #1e293b',
                  padding: '1.5rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                }}
              >
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: '#10b981',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      Post-Test Question {qIndex + 1} of 2
                    </span>
                    <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>• {q.concept}</span>
                  </div>
                  {state.selectedOption && state.hasInteractedConfidence && (
                    <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={16} /> Ready
                    </span>
                  )}
                </div>

                {/* Stem */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f8fafc', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                  {q.stem}
                </h3>

                {/* 4 Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  {q.options.map((opt, optIdx) => {
                    const isSelected = state.selectedOption === opt.id;
                    const letter = String.fromCharCode(65 + optIdx);

                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setPostAnswers((prev) => ({
                            ...prev,
                            [qKey]: { ...prev[qKey], selectedOption: opt.id },
                          }));
                        }}
                        style={{
                          padding: '0.9rem 1.15rem',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid #10b981' : '1px solid #1e293b',
                          backgroundColor: isSelected ? 'rgba(16, 185, 129, 0.12)' : '#151c28',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid #10b981' : '1px solid #475569',
                            backgroundColor: isSelected ? '#10b981' : 'transparent',
                            color: isSelected ? '#0b0f17' : '#94a3b8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {letter}
                        </div>
                        <span style={{ fontSize: '0.92rem', color: isSelected ? '#fff' : '#cbd5e1', lineHeight: 1.4 }}>
                          {opt.text}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Confidence Calibration Slider (1-5) */}
                <div
                  style={{
                    backgroundColor: '#151c28',
                    padding: '1.1rem 1.25rem',
                    borderRadius: '8px',
                    border: state.hasInteractedConfidence ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #334155',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: state.hasInteractedConfidence ? '#f8fafc' : '#f59e0b' }}>
                      {state.hasInteractedConfidence
                        ? 'Confidence Calibration Rating:'
                        : '⚠️ Please set your confidence (1–5) for this answer:'}
                    </span>
                    <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#10b981' }}>
                      {state.hasInteractedConfidence ? `${state.confidence} / 5` : 'Not Set'}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={state.confidence}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setPostAnswers((prev) => ({
                        ...prev,
                        [qKey]: { ...prev[qKey], confidence: val, hasInteractedConfidence: true },
                      }));
                    }}
                    style={{ width: '100%', accentColor: '#10b981', cursor: 'pointer', marginBottom: '0.5rem' }}
                  />

                  {/* Quick Pill Buttons */}
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {[1, 2, 3, 4, 5].map((lvl) => {
                      const isLvl = state.hasInteractedConfidence && state.confidence === lvl;
                      const label = lvl === 1 ? '1 Unsure' : lvl === 3 ? '3 Medium' : lvl === 5 ? '5 Confident' : `${lvl}`;
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => {
                            setPostAnswers((prev) => ({
                              ...prev,
                              [qKey]: { ...prev[qKey], confidence: lvl, hasInteractedConfidence: true },
                            }));
                          }}
                          style={{
                            flex: 1,
                            padding: '0.35rem',
                            fontSize: '0.75rem',
                            borderRadius: '6px',
                            border: isLvl ? '1px solid #10b981' : '1px solid #1e293b',
                            backgroundColor: isLvl ? 'rgba(16, 185, 129, 0.2)' : '#0b0f17',
                            color: isLvl ? '#10b981' : '#94a3b8',
                            cursor: 'pointer',
                            fontWeight: isLvl ? 700 : 500,
                          }}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#0b0f17',
              padding: '1.25rem',
              borderRadius: '10px',
              border: '1px solid #1e293b',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              {!isPostTestComplete
                ? 'Answer both post-test validation questions to calculate knowledge gain.'
                : 'All questions completed! Submit to view empirical outcomes.'}
            </span>

            <button
              onClick={handleFinishPilot}
              disabled={!isPostTestComplete}
              className="gold-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                fontSize: '0.95rem',
                opacity: !isPostTestComplete ? 0.45 : 1,
                cursor: !isPostTestComplete ? 'not-allowed' : 'pointer',
              }}
            >
              Submit & View Results <CheckCircle2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 5. COMPLETE STAGE (Knowledge Gain & Report) */}
      {stage === 'complete' && (
        <div style={{ backgroundColor: '#0b0f17', padding: '1.75rem', borderRadius: '12px', border: '1px solid rgba(16,185,129,0.4)' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.3rem', margin: 0 }}>
              <CheckCircle2 size={24} /> Pilot Study Completed Successfully!
            </h3>
            <button
              onClick={handleStartSession}
              className="gold-outline-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
            >
              <RotateCcw size={16} /> Run Pilot Again
            </button>
          </div>

          {/* Metric Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            {/* Pre-Score */}
            <div style={{ padding: '1.25rem', backgroundColor: '#151c28', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Diagnostic Pre-Score</span>
              <h4 style={{ fontSize: '2rem', color: preScore >= 75 ? '#10b981' : preScore >= 50 ? '#f59e0b' : '#ef4444', margin: '0.3rem 0' }}>
                {preScore}%
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{preCorrectCount} of 2 Correct</span>
            </div>

            {/* Post-Score */}
            <div style={{ padding: '1.25rem', backgroundColor: '#151c28', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Validation Post-Score</span>
              <h4 style={{ fontSize: '2rem', color: postScore >= 75 ? '#10b981' : '#f59e0b', margin: '0.3rem 0' }}>
                {postScore}%
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{postCorrectCount} of 2 Correct</span>
            </div>

            {/* Knowledge Gain */}
            <div
              style={{
                padding: '1.25rem',
                backgroundColor: '#151c28',
                borderRadius: '10px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.08)',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#f59e0b', fontWeight: 600 }}>Knowledge Gain %</span>
              <h4 style={{ fontSize: '2rem', color: absoluteGain > 0 ? '#10b981' : absoluteGain === 0 ? '#38bdf8' : '#ef4444', margin: '0.3rem 0' }}>
                {absoluteGain >= 0 ? `+${absoluteGain}%` : `${absoluteGain}%`}
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {normalizedGain > 0 ? `Normalized Gain: ${normalizedGain}%` : 'Baseline Mastered'}
              </span>
            </div>

            {/* Time to Mastery */}
            <div style={{ padding: '1.25rem', backgroundColor: '#151c28', borderRadius: '10px', border: '1px solid #1e293b' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Time to Mastery</span>
              <h4 style={{ fontSize: '2rem', color: '#f59e0b', margin: '0.3rem 0' }}>
                {formatTimer(elapsedSeconds)}
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Continuous Session</span>
            </div>
          </div>

          {/* Diagnostic Question Review Breakdown */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid #1e293b', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '1rem' }}>
              Detailed Question Analysis & Misconception Breakdown
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {/* Pre-Test Review */}
              <div style={{ backgroundColor: '#151c28', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b' }}>Pre-Test Diagnostic</span>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Q1: Generalization Divergence</span>
                    <span style={{ color: preQ1Correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {preQ1Correct ? '✓ Correct' : '✗ Misconception'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Q2: Bias-Variance Decomposition</span>
                    <span style={{ color: preQ2Correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {preQ2Correct ? '✓ Correct' : '✗ Misconception'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Post-Test Review */}
              <div style={{ backgroundColor: '#151c28', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981' }}>Post-Test Validation</span>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Q1: Early Stopping & Regularization</span>
                    <span style={{ color: postQ1Correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {postQ1Correct ? '✓ Correct' : '✗ Misconception'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Q2: Data Volume & Variance Reduction</span>
                    <span style={{ color: postQ2Correct ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                      {postQ2Correct ? '✓ Correct' : '✗ Misconception'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
