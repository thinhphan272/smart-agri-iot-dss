import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  ShieldCheck, 
  CornerDownLeft, 
  RefreshCcw,
  Cpu,
  BookOpen,
  KeyRound,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { chatAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

// Helper parse định dạng inline: bold **text**, math, italic
const renderInlineFormatting = (text) => {
  if (!text) return '';
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
};

// Helper phân tích các khối Markdown (tiêu đề, danh sách, đoạn văn)
const formatAiMarkdown = (content) => {
  if (!content) return null;
  const lines = content.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return <div key={lineIdx} style={{ height: 8 }} />;
    }

    // Tiêu đề ###
    if (trimmed.startsWith('### ')) {
      return (
        <div key={lineIdx} style={{ fontWeight: 700, fontSize: '1.05em', color: 'var(--color-optimal)', marginTop: 12, marginBottom: 5 }}>
          {renderInlineFormatting(trimmed.replace(/^###\s*/, ''))}
        </div>
      );
    }

    // Tiêu đề ## hoặc #
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      return (
        <div key={lineIdx} style={{ fontWeight: 800, fontSize: '1.15em', color: 'var(--color-optimal)', marginTop: 14, marginBottom: 6 }}>
          {renderInlineFormatting(trimmed.replace(/^#+\s*/, ''))}
        </div>
      );
    }

    // Danh sách có gạch đầu dòng (* hoặc -)
    if (/^[\*\-]\s+/.test(trimmed)) {
      const itemContent = trimmed.replace(/^[\*\-]\s+/, '');
      return (
        <div key={lineIdx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '4px 0 4px 6px' }}>
          <span style={{ color: 'var(--color-optimal)', fontWeight: 'bold', fontSize: '1.1em', lineHeight: 1.2 }}>•</span>
          <div style={{ flex: 1 }}>{renderInlineFormatting(itemContent)}</div>
        </div>
      );
    }

    // Dòng thông thường
    return (
      <div key={lineIdx} style={{ marginBottom: 4 }}>
        {renderInlineFormatting(line)}
      </div>
    );
  });
};

export default function ChatWidget() {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false); // Phóng to toàn màn hình
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash'); // 'gemini-1.5-flash' | 'internal'
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keySavedMsg, setKeySavedMsg] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem('agri_chat_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('agri_chat_session_id', sid);
    }
    setSessionId(sid);

    const savedKey = localStorage.getItem('agri_gemini_api_key') || '';
    setApiKey(savedKey);

    // Tin nhắn chào mừng ban đầu theo ngôn ngữ hiện tại
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: t('chatWelcome'),
        ai_provider: 'internal',
        timestamp: new Date()
      }
    ]);
  }, [lang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isExpanded]);

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('agri_gemini_api_key', newKey);
    setKeySavedMsg(true);
    setTimeout(() => {
      setKeySavedMsg(false);
      setShowKeyModal(false);
    }, 1200);
  };

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    // Chuẩn bị lịch sử hội thoại cho Multi-turn context
    const currentHistory = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.text
    }));

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(
        sessionId, 
        text, 
        selectedModel, 
        currentHistory, 
        apiKey || null
      );
      const botMsg = {
        id: res.data.id || Date.now() + 1,
        role: 'bot',
        text: res.data.response,
        ai_provider: res.data.ai_provider,
        is_on_topic: res.data.is_on_topic,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: lang === 'vi' 
            ? 'Rất tiếc, đã có lỗi kết nối đến máy chủ AI. Đang tự động chuyển sang Tri thức Nông học Nội bộ để trả lời bạn!'
            : 'Apologies, failed to connect to AI server. Automatically switching to Internal Agronomic Knowledge to assist you!',
          ai_provider: 'internal',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const newSid = 'session_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('agri_chat_session_id', newSid);
    setSessionId(newSid);
    setMessages([
      {
        id: 'welcome_new',
        role: 'bot',
        text: t('chatNewSession'),
        ai_provider: 'internal',
        timestamp: new Date()
      }
    ]);
  };

  const samplePrompts = [
    t('chatPrompt1'),
    t('chatPrompt2'),
    t('chatPrompt3')
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-optimal) 0%, #059669 100%)',
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
          title={t('chatTitle')}
        >
          <Bot size={28} />
        </button>
      )}

      {/* Dimmed Backdrop when Chatbot is Maximize/Expanded */}
      {isOpen && isExpanded && (
        <div 
          onClick={() => setIsExpanded(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(5, 12, 10, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 9999
          }}
        />
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: isExpanded ? '4vh' : 24,
            right: isExpanded ? '4vw' : 24,
            width: isExpanded ? '92vw' : 420,
            maxWidth: isExpanded ? 1120 : 'calc(100vw - 32px)',
            height: isExpanded ? '92vh' : 580,
            maxHeight: isExpanded ? '94vh' : 'calc(100vh - 48px)',
            borderRadius: 20,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: isExpanded ? '0 30px 80px rgba(0, 0, 0, 0.85)' : '0 20px 50px rgba(0, 0, 0, 0.55)',
            zIndex: 10000,
            border: '1px solid var(--border-card)',
            background: 'var(--bg-card)',
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 18px',
            background: 'rgba(16, 185, 129, 0.12)',
            borderBottom: '1px solid var(--border-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--color-optimal)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Bot size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: isExpanded ? '1.05rem' : '0.92rem', color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                    {t('chatTitle')}
                  </h4>
                  <div style={{ fontSize: '0.68rem', color: 'var(--color-optimal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-optimal)' }} />
                    {isExpanded ? t('chatExpandedTip') : t('chatStandardTip')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => setShowKeyModal(!showKeyModal)}
                  title={t('chatApiKeyConfigTitle')}
                  style={{
                    background: apiKey ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 6,
                    color: apiKey ? 'var(--color-optimal)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '5px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.7rem'
                  }}
                >
                  <KeyRound size={13} />
                  <span>{apiKey ? t('chatApiKeySaved') : t('chatApiKeyButton')}</span>
                </button>

                {/* Nút Phóng To / Thu Nhỏ Cửa Sổ Chat */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  title={isExpanded ? t('btnMinimize') : t('btnMaximize')}
                  style={{
                    background: isExpanded ? 'rgba(16, 185, 129, 0.2)' : 'none',
                    border: 'none',
                    color: isExpanded ? 'var(--color-optimal)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 6,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {isExpanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>

                <button
                  onClick={handleClearHistory}
                  title={t('btnRefreshChat')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}
                >
                  <RefreshCcw size={16} />
                </button>

                <button
                  onClick={() => { setIsOpen(false); setIsExpanded(false); }}
                  title={t('btnCloseChat')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            {/* API Key Inline Configuration Modal */}
            {showKeyModal && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-card)',
                borderRadius: 10,
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    🔑 {t('chatApiKeyConfigTitle')}
                  </span>
                  <button
                    onClick={() => setShowKeyModal(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="password"
                    placeholder={lang === 'vi' ? 'Dán Gemini API Key (AQ.Ab8...)' : 'Paste Gemini API Key (AQ.Ab8...)'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="input-field"
                    style={{ flex: 1, fontSize: '0.74rem', padding: '5px 8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveApiKey(apiKey)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.72rem', padding: '5px 12px' }}
                  >
                    {keySavedMsg ? <Check size={12} /> : t('chatApiKeySaveBtn')}
                  </button>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {lang === 'vi' 
                    ? 'Hệ thống đã tự động kết nối qua Backend. Bạn cũng có thể lưu trực tiếp trên trình duyệt này.' 
                    : 'System connects automatically via Backend. You can also persist the key in this browser session.'}
                </div>
              </div>
            )}

            {/* Model Selector Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)', padding: '5px 10px', borderRadius: 8, border: '1px solid var(--border-card)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Cpu size={13} color="var(--color-optimal)" />
                <span>{t('chatModelSelectLabel')}</span>
              </span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="gemini-1.5-flash">🤖 {t('chatModelGemini')}</option>
                <option value="internal">🏛️ {t('chatModelInternal')}</option>
              </select>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{
            flex: 1,
            padding: isExpanded ? '20px 28px' : '14px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            background: 'var(--bg-body)'
          }}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: isUser ? (isExpanded ? '75%' : '85%') : (isExpanded ? '92%' : '88%'),
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    padding: isExpanded ? '14px 22px' : '10px 14px',
                    borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                    background: isUser ? 'var(--color-optimal)' : 'var(--bg-surface)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    fontSize: isExpanded ? '0.94rem' : '0.84rem',
                    lineHeight: isExpanded ? 1.7 : 1.55,
                    border: isUser ? 'none' : '1px solid var(--border-card)',
                    whiteSpace: isUser ? 'pre-wrap' : 'normal',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    {isUser ? m.text : formatAiMarkdown(m.text)}
                  </div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {!isUser && (
                      <span style={{ color: m.ai_provider === 'gemini' ? '#38bdf8' : 'var(--color-optimal)', fontWeight: 600 }}>
                        {m.ai_provider === 'gemini' ? '🤖 Google Gemini Flash' : (lang === 'vi' ? '🏛️ Tri Thức Nông Học Nội Bộ' : '🏛️ Internal Agro-Knowledge')} • 
                      </span>
                    )}
                    <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })}
            {loading && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 16px', background: 'var(--bg-surface)', borderRadius: 12, fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={16} className="animate-spin" color="var(--color-optimal)" />
                <span className="animate-pulse">{t('chatThinking')}</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div style={{ padding: '8px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-card)', display: 'flex', gap: 8, overflowX: 'auto', whiteSpace: 'nowrap' }}>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={loading}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-card)',
                  borderRadius: 14,
                  padding: '5px 10px',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: isExpanded ? '14px 20px' : '10px 14px',
              background: 'var(--bg-card)',
              borderTop: '1px solid var(--border-card)',
              display: 'flex',
              gap: 10,
              alignItems: 'center'
            }}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('chatPlaceholder')}
              className="input-field"
              style={{ flex: 1, fontSize: isExpanded ? '0.9rem' : '0.82rem', padding: isExpanded ? '10px 16px' : '8px 12px' }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="btn btn-primary"
              style={{ padding: isExpanded ? '10px 18px' : '8px 14px', borderRadius: 10 }}
            >
              <Send size={isExpanded ? 18 : 15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
