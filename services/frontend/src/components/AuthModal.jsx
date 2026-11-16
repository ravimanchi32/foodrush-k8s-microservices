import React, { useState } from 'react';
import { X, Lock, Mail, User, Phone, MapPin } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLoginSuccess, onRegisterSuccess }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (isLoginTab) {
        await onLoginSuccess(email, password);
      } else {
        await onRegisterSuccess({
          name,
          email,
          password,
          phone,
          address,
        });
      }
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (type) => {
    if (type === 'admin') {
      setEmail('admin@foodrush.com');
      setPassword('password123');
    } else {
      setEmail('jane@example.com');
      setPassword('password123');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={18} />
        </button>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          <button
            style={{
              flex: 1,
              padding: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              borderBottom: isLoginTab ? '3px solid var(--primary)' : '3px solid transparent',
              color: isLoginTab ? 'var(--primary)' : 'var(--dark-light)',
            }}
            onClick={() => {
              setIsLoginTab(true);
              setErrorMsg('');
            }}
          >
            Sign In
          </button>
          <button
            style={{
              flex: 1,
              padding: '10px',
              fontWeight: 700,
              fontSize: '1rem',
              borderBottom: !isLoginTab ? '3px solid var(--primary)' : '3px solid transparent',
              color: !isLoginTab ? 'var(--primary)' : 'var(--dark-light)',
            }}
            onClick={() => {
              setIsLoginTab(false);
              setErrorMsg('');
            }}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#ffeae6',
              color: '#d63031',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLoginTab && (
            <>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0101"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Default Delivery Address</label>
                <input
                  type="text"
                  placeholder="e.g. 742 Evergreen Terrace"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : isLoginTab ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {isLoginTab && (
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--gray-border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--dark-light)', marginBottom: '8px', textAlign: 'center' }}>
              Quick Test Credentials:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="filter-chip"
                style={{ flex: 1, fontSize: '0.78rem', textAlign: 'center' }}
                onClick={() => setDemoUser('customer')}
              >
                Demo Customer
              </button>
              <button
                type="button"
                className="filter-chip"
                style={{ flex: 1, fontSize: '0.78rem', textAlign: 'center' }}
                onClick={() => setDemoUser('admin')}
              >
                Demo Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

