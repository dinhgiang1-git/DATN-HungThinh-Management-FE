import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import adminChatService from '../../services/adminChatService';

const Icons = {
  chat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  ),
};

const starterMessages = [
  'Tình hình hóa đơn tháng này thế nào?',
  'Phân tích chi tiết căn hộ A101',
  'Có phản ánh hoặc bảo trì nào cần ưu tiên không?',
];

export default function AdminAiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Chào admin, bạn muốn xem nhanh vấn đề nào của chung cư?',
    },
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages, loading]);

  const sendMessage = async (messageText = input) => {
    const text = messageText.trim();
    if (!text || loading) return;

    setInput('');
    setLoading(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    try {
      const history = messages
        .slice(-8)
        .filter((item) => item?.content?.trim())
        .map((item) => ({ role: item.role, content: item.content }));
      const res = await adminChatService.ask(text, history);
      const answer = res.data?.data?.answer || 'Mình chưa nhận được phản hồi phù hợp.';
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể kết nối trợ lý AI';
      toast.error(msg);
      setMessages((prev) => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    sendMessage();
  };

  return (
    <div className={`admin-ai-chat ${open ? 'admin-ai-chat--open' : ''}`}>
      {open && (
        <section className="admin-ai-chat__panel" aria-label="Trợ lý AI admin">
          <header className="admin-ai-chat__header">
            <div>
              <strong>Trợ lý chung cư</strong>
              <span>Admin AI</span>
            </div>
            <button className="admin-ai-chat__icon-btn" onClick={() => setOpen(false)} aria-label="Đóng chat">
              {Icons.close}
            </button>
          </header>

          <div className="admin-ai-chat__messages" ref={listRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`admin-ai-chat__message-wrapper admin-ai-chat__message-wrapper--${message.role}`}
              >
                {message.role === 'assistant' && (
                  <div className="admin-ai-chat__avatar">
                    {Icons.chat}
                  </div>
                )}
                <div className={`admin-ai-chat__message admin-ai-chat__message--${message.role}`}>
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="admin-ai-chat__message-wrapper admin-ai-chat__message-wrapper--assistant">
                <div className="admin-ai-chat__avatar">
                  {Icons.chat}
                </div>
                <div className="admin-ai-chat__message admin-ai-chat__message--assistant admin-ai-chat__message--typing">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </div>
              </div>
            )}
          </div>

          <div className="admin-ai-chat__quick">
            {starterMessages.map((item) => (
              <button key={item} onClick={() => sendMessage(item)} disabled={loading}>
                {item}
              </button>
            ))}
          </div>

          <form className="admin-ai-chat__form" onSubmit={handleSubmit}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Hỏi về tình hình chung cư..."
              rows={1}
            />
            <button type="submit" disabled={loading || !input.trim()} aria-label="Gửi câu hỏi">
              {Icons.send}
            </button>
          </form>
        </section>
      )}

      <button className="admin-ai-chat__launcher" onClick={() => setOpen((prev) => !prev)} aria-label="Mở trợ lý AI">
        {Icons.chat}
      </button>
    </div>
  );
}
