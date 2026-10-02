-- 003_seed.sql – Seed Data for PathMind (~45 Concept Nodes, ~30 Misconceptions, Seed Questions)

-- ============================================================================
-- 1. SEED CONCEPT NODES (~45 Nodes across 4 Tracks)
-- ============================================================================

INSERT INTO concept_nodes (id, track, title, description, prerequisites, sort_order) VALUES
-- Track 1: ML Foundations (12 nodes)
('ml_intro', 'ml_foundations', 'Introduction to Machine Learning', 'Core paradigms: supervised, unsupervised, and reinforcement learning.', '{}', 1),
('sup_vs_unsup', 'ml_foundations', 'Supervised vs Unsupervised Learning', 'Labeled training pairs vs pattern discovery without target labels.', '{"ml_intro"}', 2),
('reg_vs_clf', 'ml_foundations', 'Regression vs Classification', 'Predicting continuous targets versus discrete categorical labels.', '{"sup_vs_unsup"}', 3),
('train_val_test', 'ml_foundations', 'Train, Validation, and Test Splits', 'Proper data partitioning to avoid data leakage and evaluate generalization.', '{"reg_vs_clf"}', 4),
('bias_variance', 'ml_foundations', 'Bias-Variance Tradeoff', 'Balancing underfitting due to assumptions and overfitting due to sensitivity.', '{"train_val_test"}', 5),
('overfitting', 'ml_foundations', 'Overfitting and Underfitting', 'Recognizing high variance vs high bias in performance metrics.', '{"bias_variance"}', 6),
('regularization', 'ml_foundations', 'L1/L2 Regularization', 'Lasso (L1) feature selection and Ridge (L2) weight decay constraints.', '{"overfitting"}', 7),
('loss_functions', 'ml_foundations', 'Loss Functions (MSE & Cross-Entropy)', 'Mathematical optimization targets for regression and classification.', '{"reg_vs_clf"}', 8),
('gradient_descent', 'ml_foundations', 'Gradient Descent & Optimization', 'Iterative parameter updating along negative objective gradients.', '{"loss_functions"}', 9),
('eval_metrics', 'ml_foundations', 'Evaluation Metrics (Precision & Recall)', 'Precision, recall, F1-score, and ROC-AUC for model performance.', '{"train_val_test"}', 10),
('imbalanced_data', 'ml_foundations', 'Imbalanced Datasets', 'SMOTE, class weighting, and focal loss for skewed class distributions.', '{"eval_metrics"}', 11),
('feature_scaling', 'ml_foundations', 'Feature Scaling & Normalization', 'StandardScaler, MinMaxScaler, and impact on gradient-based algorithms.', '{"gradient_descent"}', 12),

-- Track 2: Deep Learning (12 nodes)
('perceptrons', 'deep_learning', 'Single & Multi-Layer Perceptrons', 'Artificial neurons, weight matrices, bias vectors, and linear layers.', '{"gradient_descent"}', 1),
('activation_funcs', 'deep_learning', 'Activation Functions', 'Non-linearities: ReLU, Sigmoid, GELU, and Softmax activation dynamics.', '{"perceptrons"}', 2),
('forward_pass', 'deep_learning', 'Forward Propagation', 'Sequential tensor transformations from inputs to predicted logits.', '{"perceptrons"}', 3),
('backpropagation', 'deep_learning', 'Backpropagation & Chain Rule', 'Computing partial derivatives of loss with respect to all layer weights.', '{"forward_pass","loss_functions"}', 4),
('vanishing_gradients', 'deep_learning', 'Vanishing & Exploding Gradients', 'Gradient degradation in deep architectures and mitigation via residual links.', '{"backpropagation"}', 5),
('optimizers', 'deep_learning', 'Advanced Optimizers (Adam, RMSprop)', 'Adaptive learning rates, momentum acceleration, and weight decay.', '{"gradient_descent","backpropagation"}', 6),
('batch_norm', 'deep_learning', 'Batch & Layer Normalization', 'Stabilizing internal covariate shift across mini-batches during training.', '{"vanishing_gradients"}', 7),
('dropout', 'deep_learning', 'Dropout Regularization', 'Stochastic node deactivation to prevent co-adaptation in deep nets.', '{"overfitting","perceptrons"}', 8),
('cnn_basics', 'deep_learning', 'Convolutional Neural Networks (CNNs)', 'Spatial feature extraction via receptive fields, kernels, and strides.', '{"perceptrons"}', 9),
('pooling_layers', 'deep_learning', 'Pooling & Downsampling', 'Max pooling, average pooling, and spatial invariance reduction.', '{"cnn_basics"}', 10),
('rnns_lstms', 'deep_learning', 'Recurrent Neural Nets & LSTMs', 'Sequential state propagation, hidden gates, and long-range dependencies.', '{"backpropagation"}', 11),
('self_attention', 'deep_learning', 'Self-Attention Mechanism', 'Query-Key-Value routing and scaled dot-product attention computations.', '{"rnns_lstms","activation_funcs"}', 12),

-- Track 3: NLP & GenAI (12 nodes)
('tokenization', 'nlp_genai', 'Tokenization & Vocabulary Encoding', 'Byte-Pair Encoding (BPE), WordPiece, and subword segmentation.', '{"ml_intro"}', 1),
('embeddings', 'nlp_genai', 'Vector Embeddings & Semantic Spaces', 'Continuous vector representations, dot products, and semantic similarity.', '{"tokenization"}', 2),
('transformer_arch', 'nlp_genai', 'Transformer Encoder-Decoder Architecture', 'Multi-head attention blocks, feed-forward sublayers, and layer norms.', '{"self_attention","embeddings"}', 3),
('positional_encoding', 'nlp_genai', 'Positional Encodings', 'Sinusoidal and Rotary Positional Embeddings (RoPE) in sequence modeling.', '{"transformer_arch"}', 4),
('causal_lm', 'nlp_genai', 'Causal Language Modeling', 'Autoregressive next-token prediction and masked attention decoding.', '{"transformer_arch"}', 5),
('temperature_topk', 'nlp_genai', 'Sampling Parameters (Temperature, Top-K, Top-P)', 'Stochastic decoding controls, logit scaling, and nucleus sampling.', '{"causal_lm"}', 6),
('prompt_engineering', 'nlp_genai', 'Prompt Engineering & In-Context Learning', 'Zero-shot, few-shot, and Chain-of-Thought (CoT) prompting techniques.', '{"causal_lm"}', 7),
('rag_basics', 'nlp_genai', 'Retrieval-Augmented Generation (RAG)', 'Context retrieval pipelines combining vector search with LLM generation.', '{"embeddings","causal_lm"}', 8),
('vector_databases', 'nlp_genai', 'Vector Databases & Similarity Indexing', 'HNSW indexing, Cosine vs L2 distance, and chunking strategies.', '{"embeddings","rag_basics"}', 9),
('fine_tuning', 'nlp_genai', 'Parameter-Efficient Fine-Tuning (LoRA)', 'Low-Rank Adaptation matrix decomposition for targeted task tuning.', '{"causal_lm"}', 10),
('rag_vs_finetuning', 'nlp_genai', 'RAG vs Fine-Tuning Criteria', 'Decision matrix balancing factual freshness against domain behavioral style.', '{"rag_basics","fine_tuning"}', 11),
('hallucinations', 'nlp_genai', 'LLM Hallucinations & Grounding', 'Factuality verification, ground truth citation, and guardrail filtering.', '{"rag_basics","temperature_topk"}', 12),

-- Track 4: Agentic AI (9 nodes)
('agent_definition', 'agent_ai', 'Agent Architecture & ReAct Loop', 'Reasoning + Acting execution loops with perception and environment state.', '{"prompt_engineering"}', 1),
('tool_calling', 'agent_ai', 'Tool Calling & Function Execution', 'JSON schema tool declarations, argument extraction, and API invocation.', '{"agent_definition"}', 2),
('agent_memory', 'agent_ai', 'Short-term & Long-term Agentic Memory', 'Scratchpad working memory, summary buffers, and vector storage persistence.', '{"agent_definition","vector_databases"}', 3),
('planning_decomposition', 'agent_ai', 'Task Decomposition & Planning', 'Sub-goal breakdown, Tree-of-Thoughts (ToT), and execution graphs.', '{"agent_definition"}', 4),
('reflection_self_correction', 'agent_ai', 'Self-Reflection & Iterative Correction', 'Critique loops, error recovery, and self-evaluation execution turns.', '{"planning_decomposition"}', 5),
('multi_agent', 'agent_ai', 'Multi-Agent Orchestration', 'Manager-worker topologies, message passing protocols, and consensus.', '{"tool_calling","planning_decomposition"}', 6),
('agent_evaluation', 'agent_ai', 'Agent Benchmarking & Trajectory Eval', 'Trajectory accuracy, tool call correctness, and cost metering metrics.', '{"multi_agent"}', 7),
('guardrails_safety', 'agent_ai', 'Safety & Execution Guardrails', 'Prompt injection defenses, tool permission scopes, and sandboxing.', '{"tool_calling"}', 8),
('autonomous_execution', 'agent_ai', 'Human-in-the-Loop Autonomous Execution', 'Approval triggers, safety interrupts, and boundary escalation protocols.', '{"agent_definition","guardrails_safety"}', 9)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    prerequisites = EXCLUDED.prerequisites,
    sort_order = EXCLUDED.sort_order;


-- ============================================================================
-- 2. SEED MISCONCEPTIONS (~30 Misconceptions)
-- ============================================================================

INSERT INTO misconceptions (id, node_id, title, wrong_belief, correct_idea, socratic_seed) VALUES
('m_overfit_size', 'overfitting', 'Small Dataset Overfitting Myth', 'Overfitting only occurs when the dataset is too small.', 'Overfitting occurs when model capacity exceeds dataset complexity, causing it to fit training noise.', 'If a complex model memorizes 10,000 noise samples, how will validation accuracy compare to train accuracy?'),
('m_epoch_iter', 'gradient_descent', 'Epoch vs Iteration Confusion', 'An epoch and an iteration represent the exact same pass.', 'An epoch passes through the entire dataset; an iteration passes through a single mini-batch.', 'If you have 1,000 samples and a batch size of 100, how many iterations equal one epoch?'),
('m_gd_global', 'gradient_descent', 'Global Minimum Assumption', 'Gradient descent always finds the global minimum of any loss surface.', 'Gradient descent can get trapped in local minima or saddle points on non-convex loss surfaces.', 'What happens to the gradient magnitude at a saddle point where the slope is zero?'),
('m_acc_imbalanced', 'imbalanced_data', 'High Accuracy Paradox', 'High classification accuracy guarantees a well-performing model.', 'In imbalanced datasets (e.g. 99% negative), a naive model predicting all negatives achieves 99% accuracy but fails.', 'If 99 out of 100 patients are healthy, what accuracy does a doctor get by predicting everyone is healthy?'),
('m_prec_recall', 'eval_metrics', 'Precision vs Recall Swap', 'Precision and recall are interchangeable metrics measuring the same thing.', 'Precision measures exactness (TP / (TP+FP)); recall measures completeness (TP / (TP+FN)).', 'If a spam filter blocks all legitimate emails, which metric suffers: precision or recall?'),
('m_attention_human', 'self_attention', 'Human Attention Equivalence', 'Transformer self-attention operates identically to human cognitive attention.', 'Self-attention is a mathematical matrix routing operation weighting sequence token representations.', 'Does computing QK^T / sqrt(d_k) involve conscious human-like focus or numerical matrix dot products?'),
('m_temp_knowledge', 'temperature_topk', 'Temperature Modifies Model Knowledge', 'Raising temperature increases the factual knowledge possessed by an LLM.', 'Temperature rescales output logit probability distributions; it changes sampling randomness, not model knowledge.', 'Does adjusting a temperature slider add new facts to a static model weight tensor?'),
('m_rag_ft_same', 'rag_vs_finetuning', 'RAG and Fine-Tuning Equivalence', 'RAG and fine-tuning are interchangeable solutions for domain knowledge.', 'RAG retrieves dynamic external facts at runtime; fine-tuning adapts model style, tone, and format.', 'If your internal knowledge base updates every hour, will retraining model weights keep up with real-time facts?'),
('m_agent_prompt', 'agent_definition', 'Agent Equals Long Prompt', 'An AI agent is merely a long system prompt without dynamic code execution.', 'An agent combines reasoning with an active environment loop, tool execution, and state observation.', 'Can a text prompt execute an external API call without a surrounding program loop?'),
('m_embed_onehot', 'embeddings', 'Vector Embeddings as One-Hot Vectors', 'Vector embeddings are sparse one-hot encoded arrays with single non-zero entries.', 'Embeddings are dense continuous vectors residing in a low-dimensional semantic vector space.', 'How does a dense vector of floating point numbers differ from a sparse vector of zeros and a single one?'),
('m_l1_l2_same', 'regularization', 'L1 vs L2 Weight Shrinkage', 'L1 and L2 regularization shrink weights in identical linear patterns.', 'L1 adds constant absolute penalty driving weights to exact zero (sparsity); L2 adds quadratic penalty shrinking weights proportionally.', 'Why does the diamond shape of L1 constraint contours intersect axes at exact zero coordinates?'),
('m_bias_variance_sum', 'bias_variance', 'Constant Error Sum Myth', 'Bias and variance always sum to a constant total error value.', 'Total expected error equals Bias^2 + Variance + Irreducible Error; they trade off dynamically.', 'Can increasing dataset size reduce variance without increasing bias?'),
('m_relu_linear', 'activation_funcs', 'ReLU Non-linearity Confusion', 'ReLU is a linear function because its segments are straight lines.', 'ReLU is piece-wise non-linear max(0, x), enabling neural networks to learn non-linear decision boundaries.', 'Can a sequence of purely linear operations approximate a curved decision boundary?'),
('m_backprop_forward', 'backpropagation', 'Backprop Execution Phase', 'Backpropagation computes network predictions during the forward pass.', 'Forward pass computes predictions and loss; backpropagation flows backward from loss using the chain rule.', 'Which direction do gradients flow when applying the derivative chain rule from loss to inputs?'),
('m_batchnorm_test', 'batch_norm', 'Batch Normalization at Test Time', 'Batch normalization computes mean and variance from test batches during inference.', 'During inference, batch normalization uses fixed running averages of mean and variance collected during training.', 'What happens if a test batch contains only a single instance?'),
('m_dropout_test', 'dropout', 'Dropout at Inference', 'Dropout randomly turns off neurons during model deployment.', 'Dropout is active only during training; during inference, all neurons are active and scaled appropriately.', 'Would deterministic predictions be possible if neurons randomly shut off during user inference?'),
('m_pooling_params', 'pooling_layers', 'Max Pooling Parameter Weights', 'Max pooling layers contain trainable parameter weights updated via backpropagation.', 'Max pooling is a fixed mathematical max operation across spatial regions with zero trainable weights.', 'Does taking the maximum number in a 2x2 grid require learning a weight parameter?'),
('m_token_words', 'tokenization', 'Token-Word One-to-One Equivalence', 'One token in an LLM always equals exactly one English word.', 'Tokens are subword units (e.g. 1000 tokens ≈ 750 words); complex words are split into multiple tokens.', 'How many tokens does a subword tokenizer use for rare or compound words?'),
('m_vector_keyword', 'vector_databases', 'Vector Search as Keyword Matching', 'Vector databases perform exact string keyword matching like SQL LIKE queries.', 'Vector databases search semantic proximity using geometric metrics like Cosine similarity in vector space.', 'Can two sentences with different words (e.g. "car" and "automobile") have high vector cosine similarity?'),
('m_lora_all', 'fine_tuning', 'LoRA Weight Update Scope', 'LoRA updates all original transformer weight matrices during fine-tuning.', 'LoRA freezes original base weights and trains low-rank decomposition rank matrices A and B.', 'If original weights are frozen, how does LoRA reduce GPU memory during training?'),
('m_hallucination_db', 'hallucinations', 'Hallucination as Corrupted Storage', 'LLM hallucinations occur because the internal database index is corrupted.', 'LLMs are probabilistic token generators, not database engines; hallucinations stem from probability sampling over ungrounded contexts.', 'Does a neural network store explicit database rows or probabilistic weight parameters?'),
('m_fewshot_train', 'prompt_engineering', 'Few-Shot Parameter Retraining', 'Few-shot prompting updates neural network weight parameters on the provided examples.', 'Few-shot prompting passes examples in the context window without altering underlying model weights.', 'Are model weights updated when you type a prompt into a chat interface?'),
('m_tools_internal', 'tool_calling', 'Internal Tool Code Execution', 'Function calling allows LLMs to run code directly inside neural network weights.', 'The LLM outputs structured JSON specifying tool intent; external application code executes the tool.', 'Where does Python execution occur: inside matrix multiplication or on the application server?'),
('m_agent_mem_db', 'agent_memory', 'Agent Memory as SQL Storage', 'Agent working memory is structured identically to relational SQL database tables.', 'Agent short-term memory consists of managed prompt context buffers and scratchpad strings.', 'How is conversation history injected into an LLM call: as SQL queries or context text?'),
('m_multagent_fast', 'multi_agent', 'Multi-Agent Latency Fallacy', 'Adding more agents to a multi-agent system always decreases total task completion time.', 'Multi-agent coordination introduces sequential LLM turn overhead and message passing latency.', 'If Agent A must wait for Agent B to complete before starting, does total latency decrease?'),
('m_cross_entropy', 'loss_functions', 'Cross-Entropy as Euclidean Distance', 'Cross-entropy loss calculates geometric straight-line Euclidean distance between vectors.', 'Cross-entropy measures divergence between predicted probability distributions and true targets.', 'Why do probability distributions sum to 1 while spatial coordinates do not?'),
('m_adam_learningrate', 'optimizers', 'Adam Zero Learning Rate Myth', 'Adam optimizer automatically determines step size without requiring an initial learning rate.', 'Adam adapts per-parameter rates but still relies on an initial learning rate hyperparameter alpha (default 0.001).', 'What scales the step magnitude even after Adam computes momentum and variance vectors?'),
('m_cosine_length', 'vector_databases', 'Cosine Similarity Vector Length Sensitivity', 'Cosine similarity changes when you double the length/magnitude of a vector.', 'Cosine similarity measures angle between vectors (A·B / ||A||||B||), independent of vector magnitude.', 'If two vectors point in the exact same direction, does changing their length change the angle between them?'),
('m_test_split', 'train_val_test', 'Validation Set Hyperparameter Reuse', 'You can tune hyperparameters repeatedly on the validation set without incurring bias.', 'Repeated hyperparameter tuning on validation data leaks information, causing over-optimistic evaluation.', 'If you try 1,000 parameter combinations on a validation set, are you selecting for true generalization or validation noise?'),
('m_feature_scale_tree', 'feature_scaling', 'Decision Tree Scaling Requirement', 'Decision trees require feature scaling (e.g. StandardScaler) to split nodes correctly.', 'Decision tree splits are monotonic step functions invariant to monotonic feature scaling transformations.', 'Does changing measurements from meters to centimeters change the relative ordering of values?')
ON CONFLICT (id) DO UPDATE SET
    node_id = EXCLUDED.node_id,
    title = EXCLUDED.title,
    wrong_belief = EXCLUDED.wrong_belief,
    correct_idea = EXCLUDED.correct_idea,
    socratic_seed = EXCLUDED.socratic_seed;


-- ============================================================================
-- 3. SEED QUESTIONS
-- ============================================================================

INSERT INTO questions (id, node_id, difficulty, type, stem, options, correct_option_id, rationale, source, reviewed) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'overfitting',
    2,
    'mcq',
    'A model achieves 99% accuracy on the training set but 61% accuracy on the validation set. What is the primary issue?',
    '[
        {"id": "opt_a", "text": "The model is underfitting because validation accuracy is low.", "misconception_id": null},
        {"id": "opt_b", "text": "The model is overfitting because of high variance between training and validation performance.", "misconception_id": "m_overfit_size"},
        {"id": "opt_c", "text": "Overfitting only occurs when the dataset is small; model capacity is unrelated.", "misconception_id": "m_overfit_size"},
        {"id": "opt_d", "text": "The learning rate is too small.", "misconception_id": null}
    ]',
    'opt_b',
    'Overfitting occurs when a high-capacity model fits training data noise, causing high variance and poor validation accuracy.',
    'seed',
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'rag_vs_finetuning',
    3,
    'mcq',
    'When should an engineering team choose Retrieval-Augmented Generation (RAG) over Fine-Tuning for an enterprise chatbot?',
    '[
        {"id": "opt_a", "text": "Fine-tuning is always superior because it updates internal model parameters.", "misconception_id": "m_rag_ft_same"},
        {"id": "opt_b", "text": "RAG is preferred when dynamic, up-to-date document retrieval with verifiable source citation is required.", "misconception_id": null},
        {"id": "opt_c", "text": "RAG and fine-tuning serve identical purposes and can be swapped interchangeably.", "misconception_id": "m_rag_ft_same"},
        {"id": "opt_d", "text": "RAG requires retraining the base transformer model every time new documents arrive.", "misconception_id": null}
    ]',
    'opt_b',
    'RAG injects dynamic external documents at query time without expensive model retraining, providing grounding and explicit citations.',
    'seed',
    true
)
ON CONFLICT (id) DO NOTHING;
