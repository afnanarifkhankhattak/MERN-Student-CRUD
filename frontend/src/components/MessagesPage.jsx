// frontend/src/components/MessagesPage.jsx

import { useState, useRef, useEffect } from 'react';
import './MessagesPage.css';

// ── Sample data (in-memory) ──────────────────────
// In a real app, this would come from a database.
const INITIAL_CONVERSATIONS = [
  {
    id: 'c1',
    name: 'Dr. Ali Khan',
    role: 'Professor • CS',
    avatar:
      'https://i.pravatar.cc/100?img=12',
    lastSeen: 'Online',
    unread: 2,
    messages: [
      {
        id: 'm1',
        from: 'them',
        text: 'Good morning! Have you submitted the mid-term schedule?',
        time: '09:12 AM',
      },
      {
        id: 'm2',
        from: 'them',
        text: 'The students are asking about the exam dates.',
        time: '09:13 AM',
      },
      {
        id: 'm3',
        from: 'me',
        text: 'Yes, I sent it yesterday. Let me know if anything needs updating.',
        time: '09:20 AM',
      },
    ],
  },
  {
    id: 'c2',
    name: 'Sara Ahmed',
    role: 'Student • CS-3',
    avatar: 'https://i.pravatar.cc/100?img=5',
    lastSeen: 'Last seen 2h ago',
    unread: 0,
    messages: [
      {
        id: 'm4',
        from: 'them',
        text: 'Sir, I have a question about the fee submission deadline.',
        time: 'Yesterday',
      },
      {
        id: 'm5',
        from: 'me',
        text: 'The deadline is on the 25th. You can pay at the accounts office.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: 'c3',
    name: 'Physics Department',
    role: 'Group • 8 members',
    avatar: 'https://i.pravatar.cc/100?img=68',
    lastSeen: 'Last seen 1d ago',
    unread: 0,
    messages: [
      {
        id: 'm6',
        from: 'them',
        text: 'Reminder: Lab session moved to Thursday 2pm.',
        time: '2 days ago',
      },
    ],
  },
  {
    id: 'c4',
    name: 'Accounts Office',
    role: 'Official',
    avatar: 'https://i.pravatar.cc/100?img=15',
    lastSeen: 'Last seen 3d ago',
    unread: 0,
    messages: [
      {
        id: 'm7',
        from: 'me',
        text: 'Please confirm receipt of the last batch of fee payments.',
        time: '3 days ago',
      },
      {
        id: 'm8',
        from: 'them',
        text: 'Received. The receipts will be issued by Friday.',
        time: '3 days ago',
      },
    ],
  },
];

// Current time formatted like "10:45 AM"
const currentTime = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function MessagesPage() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [selectedId, setSelectedId] = useState(INITIAL_CONVERSATIONS[0].id);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  const threadEndRef = useRef(null);

  const selected = conversations.find((c) => c.id === selectedId);

  // ── Auto-scroll to the last message ────────────
  useEffect(() => {
    if (threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selected?.messages?.length]);

  // ── Open a conversation: clear its unread count ─
  const openConversation = (id) => {
    setSelectedId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  // ── Send the current draft ─────────────────────
  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !selected) return;

    const newMessage = {
      id: `m${Date.now()}`,
      from: 'me',
      text,
      time: currentTime(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, newMessage] }
          : c
      )
    );
    setDraft('');
  };

  const handleKeyDown = (e) => {
    // Enter sends, Shift+Enter makes a new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Filter conversations by search ─────────────
  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="msg-wrap">
      {/* ── Left: conversation list ───────────── */}
      <aside className="msg-list">
        <div className="msg-list-header">
          <h3>Messages</h3>
          <span className="msg-badge-total">
            {conversations.reduce((sum, c) => sum + (c.unread || 0), 0)} new
          </span>
        </div>

        <input
          type="text"
          className="msg-search"
          placeholder="🔍 Search conversations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ul className="msg-conv-list">
          {filtered.length === 0 && (
            <li className="msg-empty">No conversations match your search.</li>
          )}

          {filtered.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <li
                key={c.id}
                className={`msg-conv-item ${
                  c.id === selectedId ? 'active' : ''
                }`}
                onClick={() => openConversation(c.id)}
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="msg-avatar"
                  onError={(e) => {
                    e.target.src =
                      'https://via.placeholder.com/40?text=?';
                  }}
                />

                <div className="msg-conv-info">
                  <div className="msg-conv-top">
                    <span className="msg-conv-name">{c.name}</span>
                    <span className="msg-conv-time">
                      {lastMsg?.time || ''}
                    </span>
                  </div>
                  <div className="msg-conv-bottom">
                    <span className="msg-conv-preview">
                      {lastMsg?.from === 'me' ? 'You: ' : ''}
                      {lastMsg?.text || ''}
                    </span>
                    {c.unread > 0 && (
                      <span className="msg-unread">{c.unread}</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* ── Right: conversation thread ────────── */}
      {selected ? (
        <main className="msg-thread">
          <header className="msg-thread-header">
            <img
              src={selected.avatar}
              alt={selected.name}
              className="msg-avatar-lg"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/44?text=?';
              }}
            />
            <div className="msg-thread-user">
              <div className="msg-thread-name">{selected.name}</div>
              <div className="msg-thread-sub">{selected.lastSeen}</div>
            </div>
            <div className="msg-thread-actions">
              <button className="msg-icon-btn" title="Video call">📹</button>
              <button className="msg-icon-btn" title="Voice call">📞</button>
              <button className="msg-icon-btn" title="More">⋯</button>
            </div>
          </header>

          <div className="msg-thread-body">
            {selected.messages.map((m) => (
              <div
                key={m.id}
                className={`msg-bubble-row ${
                  m.from === 'me' ? 'me' : 'them'
                }`}
              >
                <div className={`msg-bubble ${m.from}`}>
                  <div className="msg-bubble-text">{m.text}</div>
                  <div className="msg-bubble-time">{m.time}</div>
                </div>
              </div>
            ))}
            <div ref={threadEndRef} />
          </div>

          <footer className="msg-thread-footer">
            <input
              type="text"
              className="msg-input"
              placeholder="Type a message... (Enter to send)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="msg-send-btn"
              onClick={sendMessage}
              disabled={!draft.trim()}
              style={{
                opacity: draft.trim() ? 1 : 0.5,
                cursor: draft.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              Send ➤
            </button>
          </footer>
        </main>
      ) : (
        <main className="msg-thread msg-thread-empty">
          <p>Select a conversation to start chatting.</p>
        </main>
      )}
    </div>
  );
}

export default MessagesPage;