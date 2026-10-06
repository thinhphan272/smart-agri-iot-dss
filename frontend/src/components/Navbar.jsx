import React, { useState } from 'react';
import { 
  Leaf, 
  Activity, 
  Database, 
  BookOpen, 
  Smartphone, 
  Globe, 
  Moon, 
  Sun, 
  ShieldCheck, 
  LogOut, 
  LogIn,
  User as UserIcon, 
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AuthModal from './AuthModal';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, role, quickDemoLogin, logout, isAuthenticated } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [isDark, setIsDark] = useState(true);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { id: 'dashboard', label: t('tabDashboard'), icon: Activity },
    { id: 'batch', label: t('tabBatch'), icon: Database },
    { id: 'academic', label: t('tabAcademic'), icon: BookOpen },
    { id: 'mobile_qr', label: t('tabMobile'), icon: Smartphone },
  ];

  const getRoleBadge = (r) => {
    switch (r) {
      case 'admin':
        return <span className="badge badge-critical"><ShieldCheck size={12} /> {t('roleAdmin')}</span>;
      case 'engineer':
        return <span className="badge badge-warning"><ShieldCheck size={12} /> {t('roleEngineer')}</span>;
      case 'farmer':
        return <span className="badge badge-optimal"><Leaf size={12} /> {t('roleFarmer')}</span>;
      default:
        return <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>{t('roleGuest')}</span>;
    }
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'var(--bg-header)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-card)',
      padding: '12px 24px'
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        >
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #10b981 0%, #065f46 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
            border: '1px solid rgba(52, 211, 153, 0.3)'
          }}>
            <Leaf size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                AgriGuard<span style={{ color: 'var(--color-optimal)' }}>-IoT</span>
              </span>
              <span className="pulse-indicator" title="AI Engine Live 24/7"></span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('brandSubtitle')}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor: isActive ? 'var(--border-subtle)' : 'transparent',
                  background: isActive ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                  color: isActive ? 'var(--color-optimal)' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Action Controls & User Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Quick Demo Login Dropdown (Đặc sắc cho thi đồ án) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowDemoMenu(!showDemoMenu)}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '7px 12px', borderRadius: '10px' }}
            >
              <Sparkles size={14} />
              <span>{t('btnDemoLogin')}</span>
              <ChevronDown size={14} />
            </button>

            {showDemoMenu && (
              <div 
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: '115%',
                  right: 0,
                  width: 230,
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  zIndex: 60,
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  {t('demoMenuTitle')}
                </div>
                <button
                  onClick={() => { quickDemoLogin('admin'); setShowDemoMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '8px 10px' }}
                >
                  🛡️ <span>{t('roleAdmin')}</span>
                </button>
                <button
                  onClick={() => { quickDemoLogin('engineer'); setShowDemoMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '8px 10px' }}
                >
                  ⚡ <span>{t('roleEngineer')}</span>
                </button>
                <button
                  onClick={() => { quickDemoLogin('farmer'); setShowDemoMenu(false); }}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'flex-start', fontSize: '0.82rem', padding: '8px 10px' }}
                >
                  🌾 <span>{t('roleFarmer')}</span>
                </button>
                <div style={{ height: 1, background: 'var(--border-card)', margin: '4px 0' }} />
                <button
                  onClick={() => { setShowAuthModal(true); setShowDemoMenu(false); }}
                  className="btn btn-primary"
                  style={{ justifyContent: 'center', fontSize: '0.8rem', padding: '7px 10px' }}
                >
                  <LogIn size={13} />
                  <span>{t('authSignInRegister')}</span>
                </button>
              </div>
            )}
          </div>

          {/* Login Trigger Button (khi chưa đăng nhập) */}
          {!isAuthenticated && (
            <button
              onClick={() => setShowAuthModal(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.82rem', padding: '7px 12px', borderRadius: '10px' }}
            >
              <LogIn size={14} />
              <span>{t('authSignIn')}</span>
            </button>
          )}

          {/* User Profile / Status */}
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: 'var(--bg-surface)', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
              {getRoleBadge(role)}
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name?.includes('Quản trị') ? 'Admin' : (user?.full_name || (role ? role.toUpperCase() : 'User'))}
              </span>
              <button 
                onClick={logout} 
                title={t('btnLogout')} 
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}

          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="btn btn-secondary"
            style={{ padding: '8px 10px', fontSize: '0.8rem', borderRadius: '10px' }}
            title={t('switchLangTitle')}
          >
            <Globe size={14} />
            <span style={{ fontWeight: 700 }}>{lang.toUpperCase()}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '8px 10px', borderRadius: '10px' }}
            title={t('switchThemeTitle')}
          >
            {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#60a5fa" />}
          </button>
        </div>
      </div>

      {/* Auth Modal Popup */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </header>
  );
}
