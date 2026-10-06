import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  Sparkles, 
  Mail, 
  Lock, 
  User, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register, quickDemoLogin } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('engineer'); // 'admin' | 'engineer' | 'farmer'
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (activeTab === 'login') {
        const res = await login(email, password);
        if (res.success) {
          setSuccessMsg(t('authLoginSuccess'));
          setTimeout(() => {
            onClose();
          }, 800);
        } else {
          setError(res.error || (lang === 'vi' ? 'Sai email hoặc mật khẩu.' : 'Invalid email or password.'));
        }
      } else {
        const res = await register({
          email,
          password,
          full_name: fullName,
          role,
        });
        if (res.success) {
          setSuccessMsg(t('authRegisterSuccess'));
          await login(email, password);
          setTimeout(() => {
            onClose();
          }, 1000);
        } else {
          setError(res.error || (lang === 'vi' ? 'Không thể tạo tài khoản.' : 'Unable to create account.'));
        }
      }
    } catch (err) {
      setError(lang === 'vi' ? 'Đã xảy ra lỗi kết nối. Vui lòng thử lại!' : 'Network error. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = async (demoRole) => {
    setError(null);
    setLoading(true);
    try {
      const res = await quickDemoLogin(demoRole);
      if (res.success) {
        const roleLabel = demoRole === 'admin' 
          ? (lang === 'vi' ? 'Admin' : 'Admin')
          : (demoRole === 'engineer' ? (lang === 'vi' ? 'Kỹ sư Nông học' : 'Agronomy Engineer') : (lang === 'vi' ? 'Nông dân' : 'Farmer'));
        setSuccessMsg(lang === 'vi' ? `Đã đăng nhập vai trò: ${roleLabel}` : `Signed in as: ${roleLabel}`);
        setTimeout(() => onClose(), 800);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError(lang === 'vi' ? 'Lỗi đăng nhập nhanh.' : 'Quick demo login error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 12, 10, 0.8)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: 16
    }}>
      <div 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 20,
          padding: '28px 26px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
          position: 'relative',
          margin: 'auto'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--color-optimal)',
            marginBottom: 10
          }}>
            <ShieldCheck size={26} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', margin: 0 }}>
            {activeTab === 'login' ? t('authModalTitleLogin') : t('authModalTitleRegister')}
          </h2>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            {t('authModalSubtitle')}
          </p>
        </div>

        {/* Tabs Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-surface)',
          borderRadius: 12,
          padding: 4,
          marginBottom: 18
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'login' ? 'var(--color-optimal)' : 'transparent',
              color: activeTab === 'login' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {t('authBtnLogin')}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              borderRadius: 8,
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'register' ? 'var(--color-optimal)' : 'transparent',
              color: activeTab === 'register' ? '#ffffff' : 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
          >
            {t('authBtnRegister')}
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14
          }}>
            <CheckCircle2 size={16} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activeTab === 'register' && (
            <>
              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  {t('authFullNameLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={lang === 'vi' ? 'Nguyễn Văn Nông' : 'John Farmer'}
                    className="input-field"
                    style={{ paddingLeft: 36, width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                  {t('authRoleLabel')}
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  <option value="engineer">{t('roleEngineer')}</option>
                  <option value="farmer">{t('roleFarmer')}</option>
                  <option value="admin">{t('roleAdmin')}</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              {t('authEmailLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@agri-iot.vn"
                className="input-field"
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
              {t('authPasswordLabel')}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                style={{ paddingLeft: 36, width: '100%' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, marginTop: 6, fontWeight: 700 }}
          >
            {loading ? '...' : (activeTab === 'login' ? t('authBtnLogin') : t('authBtnRegister'))}
          </button>
        </form>

        {/* 1-Touch Demo Roles */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-card)' }}>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            ⚡ {t('authDemoTitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              onClick={() => handleDemoClick('admin')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '8px 4px', flexDirection: 'column', gap: 2, borderRadius: 10 }}
            >
              <span style={{ fontSize: '1rem' }}>🛡️</span>
              <span style={{ fontWeight: 700 }}>{t('roleAdmin')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('engineer')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '8px 4px', flexDirection: 'column', gap: 2, borderRadius: 10, borderColor: 'rgba(16, 185, 129, 0.4)' }}
            >
              <span style={{ fontSize: '1rem' }}>⚡</span>
              <span style={{ fontWeight: 700, color: 'var(--color-optimal)' }}>{t('roleEngineer')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoClick('farmer')}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '8px 4px', flexDirection: 'column', gap: 2, borderRadius: 10 }}
            >
              <span style={{ fontSize: '1rem' }}>🌾</span>
              <span style={{ fontWeight: 700 }}>{t('roleFarmer')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
