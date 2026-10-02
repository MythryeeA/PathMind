import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Brain, Sparkles, LayoutDashboard, Target, Compass, LogOut, LogIn, Moon, Sun } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        backgroundColor: 'var(--nav-bg, rgba(11, 15, 23, 0.9))',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color, #1e293b)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(245, 158, 11, 0.4)',
          }}
        >
          <Brain size={22} color="#0b0f17" />
        </div>
        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary, #f8fafc)', letterSpacing: '-0.02em' }}>
          Path<span className="gold-gradient-text">Mind</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <Link
          to="/tracks"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          <Compass size={18} /> Tracks
        </Link>
        <Link
          to="/practice"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          <Sparkles size={18} /> Practice
        </Link>
        <Link
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          <LayoutDashboard size={18} /> Mastery Tree
        </Link>
        <Link
          to="/eval"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-secondary, #94a3b8)',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          <Target size={18} /> Eval & Report
        </Link>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark/light mode"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color, #1e293b)',
            color: 'var(--text-secondary, #94a3b8)',
            padding: '0.5rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
              {user.email || 'Learner'}
            </span>
            <button
              onClick={handleSignOut}
              className="gold-outline-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link to="/login" className="gold-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}>
              <LogIn size={16} /> Sign In
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};
