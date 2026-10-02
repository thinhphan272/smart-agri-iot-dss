import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  ShieldCheck, 
  CornerDownLeft, 
  RefreshCcw 
} from 'lucide-react';
import { chatAPI } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function ChatWidget() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let sid = localStorage.getItem('agri_chat_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('agri_chat_session_id', sid);
    }
    setSessionId(sid);

    // Mẫu tin nhắn chào mừng ban đầu
    setMessages([
      {
        id: 'welcome',
        role: 'bot',
        text: t('chatWelcome'),
        ai_provider: 'internal',
        timestamp: new Date()
      }
    ]);
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      text: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await chatAPI.sendMessage(sessionId, text);
      const botMsg = {
        id: res.data.id || Date.now() + 1,
        role: 'bot',
        text: res.data.response,
        ai_provider: res.data.ai_provider,
        is_on_topic: res.data.is_on_topic,
        timestamp: new Date(res.data.timestamp)
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: 'Xin lỗi bạn, kết nối tới dịch vụ AI đang bị gián đoạn. Vui lòng thử lại sau ít giây!',
          ai_provider: 'internal',
          timestamp: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    "Đất chua pH 4.2 thì bón phân gì?",
    "Lá lúa bị vàng và cháy chóp lá",
    "Nhiệt độ 39°C cây bị héo xử lý sao?",
    "Ai vô địch World Cup 2022?" // Test Guardrails lọc chủ đề
  ];

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 90,
            width: 58,
            height: 58,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
            color: '#ffffff',
            border: '2px solid rgba(52, 211, 153, 0.4)',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
          title="Mở Bác Sĩ Cây Trồng AgriBot"
        >
          <Bot size={28} />
          <span style={{
            position: 'absolute',
            top: 2,
            right: 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: '#34d399',
            border: '2px solid #070c0a'
          }} />
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 380,
            height: 540,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 95,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(0, 0, 0, 0.6)',
            border: '1px solid rgba(52, 211, 153, 0.25)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #0e1f18 0%, #081410 100%)',
            borderBottom: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Bot size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  AgriBot AI Doctor
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-optimal)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span className="pulse-indicator" style={{ width: 6, height: 6 }} />
                  <span>Hybrid Engine (Gemini + Tri Thức Nội Bộ)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts Chips */}
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-card)',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            whiteSpace: 'nowrap'
          }}>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Stream */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '85%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isUser 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : 'var(--bg-surface)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    border: isUser ? 'none' : '1px solid var(--border-card)',
                    fontSize: '0.82rem',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-line'
                  }}>
                    {m.text}
                  </div>

                  {!isUser && m.ai_provider && (
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={10} color="var(--color-optimal)" />
                      <span>{m.ai_provider === 'gemini' ? 'Google Gemini API' : 'Tri Thức Nông Học Nội Bộ'}</span>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                <span className="pulse-indicator" />
                <span>AgriBot đang suy luận phác đồ...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            style={{
              padding: '12px',
              borderTop: '1px solid var(--border-card)',
              background: 'var(--bg-secondary)',
              display: 'flex',
              gap: 8
            }}
          >
            <input
              type="text"
              placeholder={t('chatPlaceholder')}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.82rem', padding: '8px 12px' }}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="btn btn-primary"
              style={{ padding: '8px 12px', borderRadius: '8px' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
