import React from 'react';
import { PilotStudy } from '../components/PilotStudy';

export const EvalReportPage: React.FC = () => {
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 1.5rem' }}>
      {/* Page Title */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary, #f8fafc)' }}>
          Evaluation Harness & <span className="gold-gradient-text">Pilot Study</span>
        </h1>
        <p style={{ color: 'var(--text-secondary, #94a3b8)', fontSize: '1.05rem' }}>
          Empirical measurements for pre/post knowledge gain, time-to-mastery, and Socratic learning effectiveness.
        </p>
      </div>

      {/* Pilot Study Harness Component */}
      <PilotStudy />
    </div>
  );
};

export default EvalReportPage;
