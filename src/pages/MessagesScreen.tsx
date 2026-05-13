import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import { ArrowLeft, PenSquare, UserCircle2, MessageCircle, Search, Send, Settings, Trash2, X as CloseIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';

export default function MessagesScreen() {
  const location = useLocation();
  const { theme, openSettings, currentUser } = useSettings();
  const requestedChatId = location.state?.activeChatId ? String(location.state.activeChatId) : null;

  // ── State ──
  const [activeChat, setActiveChat] = useState<string | null>(requestedChatId);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatInput, setNewChatInput] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<any>(null);

  // ── Socket Setup ──
  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on('new_message', (data: any) => {
      // If the message is for the current active chat, refresh messages
      if (activeChat && (String(data.sender_id) === String(activeChat) || String(data.receiver_id) === String(activeChat))) {
        fetchMessages(activeChat);
      }
      // Always refresh conversations to update last message/unread status
      fetchConversations();
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [activeChat]);

  // ── Fetch conversations on mount ──
  useEffect(() => {
    fetchConversations();
  }, []);

  // ── Fetch messages when activeChat changes ──
  useEffect(() => {
    if (activeChat) fetchMessages(activeChat);
  }, [activeChat]);

  // ── Auto-scroll to bottom ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Poll for new messages every 3 seconds ──
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChat) fetchMessages(activeChat);
      fetchConversations();
    }, 10000);
    return () => clearInterval(interval);
  }, [activeChat]);

  // ── API: Fetch all conversations ──
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/php/messages.php');
      const result = await res.json();
      if (result.status === 'success') {
        setChats(result.data || []);
      }
    } catch (err) { console.error('fetchConversations error:', err); }
  };

  // ── API: Fetch messages with a user ──
  const fetchMessages = async (withId: string) => {
    try {
      const res = await fetch(`/api/php/messages.php?with_user=${withId}`);
      const result = await res.json();
      if (result.status === 'success') setMessages(result.data || []);
    } catch (err) { console.error('fetchMessages error:', err); }
  };

  // ── API: Send message ──
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;
    try {
      const res = await fetch('/api/php/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: activeChat, text: messageInput.trim() })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setMessageInput('');
        fetchMessages(activeChat);
        fetchConversations();
        // Emit to socket
        if (socketRef.current) {
          socketRef.current.emit('new_message', { 
            sender_id: currentUser?.id, 
            receiver_id: activeChat, 
            text: messageInput.trim() 
          });
        }
      }
    } catch (err) { console.error(err); }
  };

  // ── API: Search users ──
  const searchUsers = async (query: string) => {
    if (!query.trim()) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/php/users.php?search=${query}`);
      const result = await res.json();
      if (result.status === 'success') setSearchResults(result.data || []);
    } catch (err) { console.error(err); }
  };

  // ── API: Start chat with user ──
  const handleStartChatWithUser = async (user: any) => {
    try {
      await fetch('/api/php/messages.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiver_id: user.id, text: '👋 Hi!' })
      });
      setIsNewChatModalOpen(false);
      setNewChatInput('');
      setSearchResults([]);
      setActiveChat(String(user.id));
      fetchConversations();
    } catch (err) { console.error(err); }
  };

  // ── API: Delete conversation ──
  const handleDeleteConversation = async (withId: string) => {
    if (!confirm('Delete this conversation?')) return;
    try {
      const res = await fetch(`/api/php/messages.php?user_id=${withId}`, { method: 'DELETE' });
      if ((await res.json()).status === 'success') {
        setActiveChat(null);
        fetchConversations();
      }
    } catch (err) { console.error(err); }
  };

  // ── Derived ──
  const currentChatObj = chats.find(c => String(c.id) === String(activeChat));
  const filteredChats = chats.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row h-screen overflow-hidden">

      {/* ═══ Left Sidebar – Navigation ═══ */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 overflow-y-auto`}>
        <Link to="/feed" className="flex items-center gap-3 px-2 mb-8">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`}>
            <span className="font-black text-xl italic text-white">D</span>
          </div>
          <h2 className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            DEV<span className="text-[#FF003C]">CONNECT</span>
          </h2>
        </Link>
        <nav className="flex-1 space-y-1">
          <NavItem icon={PenSquare} label="Feed" to="/feed" theme={theme} />
          <NavItem icon={UserCircle2} label="Profile" to="/profile" theme={theme} />
          <NavItem icon={MessageCircle} label="Messages" active to="/messages" theme={theme} />
          <button onClick={openSettings} className="w-full flex items-center gap-3 px-3 py-3 rounded text-gray-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" /><span className="text-sm">Settings</span>
          </button>
        </nav>
      </aside>

      {/* ═══ Chat List Panel ═══ */}
      <aside className={`w-full md:w-80 shrink-0 border-r flex flex-col ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]' : 'border-gray-200 bg-gray-50'} ${activeChat !== null ? 'hidden md:flex' : 'flex'}`}>
        {/* Header */}
        <div className={`p-5 border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
            <button onClick={() => setIsNewChatModalOpen(true)} className="text-[#FF003C] hover:bg-[#FF003C]/10 p-2 rounded-lg transition-colors">
              <PenSquare className="w-5 h-5" />
            </button>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-200'}`}>
            <Search className="w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className={`bg-transparent border-none focus:outline-none w-full text-sm ${theme === 'dark' ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 text-center">
              <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1 opacity-60">Start a new chat to begin messaging</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(String(chat.id))}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  activeChat === String(chat.id)
                    ? theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-gray-200'
                    : theme === 'dark' ? 'hover:bg-[#121212]' : 'hover:bg-gray-100'
                }`}
              >
                <div className="relative shrink-0">
                  {chat.avatar ? (
                    <img src={chat.avatar} className="w-12 h-12 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-[#FF003C] to-[#ff4d6d] text-white">
                      {chat.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 border-2 border-[#050505] bg-green-500 rounded-full" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className={`text-sm font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{chat.name}</span>
                    <span className="text-[10px] text-gray-500 ml-2 shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ═══ Chat Area ═══ */}
      <main className={`relative flex-1 flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} ${activeChat === null ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            {/* Chat Header */}
            <header className={`p-4 border-b flex justify-between items-center backdrop-blur-md ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]/80' : 'border-gray-200 bg-white/80'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {currentChatObj?.avatar ? (
                  <img src={currentChatObj.avatar} className="w-10 h-10 rounded-full" alt="" />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-[#FF003C] to-[#ff4d6d] text-white">
                    {currentChatObj?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className={`font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentChatObj?.name}</h3>
                  <span className="text-[10px] text-green-500">Online</span>
                </div>
              </div>
              <button onClick={() => handleDeleteConversation(activeChat)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-500/10">
                <Trash2 className="w-5 h-5" />
              </button>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <p className="text-sm">No messages yet. Say hello! 👋</p>
                </div>
              )}
              {messages.map((m, i) => {
                const isMine = String(m.sender_id) === String(currentUser?.id);
                return (
                  <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-[#FF003C] text-white rounded-br-md'
                        : theme === 'dark'
                          ? 'bg-[#1f1f1f] text-white rounded-bl-md'
                          : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    }`}>
                      {m.text}
                      {m.created_at && (
                        <div className={`text-[10px] mt-1 ${isMine ? 'text-white/60' : 'text-gray-500'}`}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className={`p-4 border-t flex gap-3 ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
              <input
                type="text"
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className={`flex-1 rounded-full px-5 py-2.5 focus:outline-none transition-colors ${
                  theme === 'dark'
                    ? 'bg-[#121212] border border-[#1f1f1f] text-white focus:border-[#FF003C]'
                    : 'bg-gray-100 border border-gray-200 text-gray-900 focus:border-[#FF003C]'
                }`}
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="w-10 h-10 bg-[#FF003C] text-white rounded-full flex items-center justify-center hover:bg-[#e00035] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="w-20 h-20 rounded-full bg-[#FF003C]/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-[#FF003C] opacity-60" />
            </div>
            <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Welcome to Messages</p>
            <p className="text-sm mt-1">Select a conversation or start a new chat</p>
          </div>
        )}
      </main>

      {/* ═══ New Chat Modal ═══ */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl p-6 shadow-2xl ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>New Message</h2>
              <button onClick={() => { setIsNewChatModalOpen(false); setNewChatInput(''); setSearchResults([]); }}>
                <CloseIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              type="text"
              value={newChatInput}
              onChange={e => { setNewChatInput(e.target.value); searchUsers(e.target.value); }}
              placeholder="Search developers..."
              className={`w-full rounded-xl px-4 py-3 mb-4 outline-none ${
                theme === 'dark'
                  ? 'bg-[#0a0a0a] border border-[#2a2a2a] text-white focus:border-[#FF003C]'
                  : 'bg-gray-50 border border-gray-200 text-gray-900 focus:border-[#FF003C]'
              }`}
            />
            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchResults.map(u => (
                <button
                  key={u.id}
                  onClick={() => handleStartChatWithUser(u)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-100'}`}
                >
                  {u.avatar ? (
                    <img src={u.avatar} className="w-10 h-10 rounded-full" alt="" />
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold bg-gradient-to-br from-[#FF003C] to-[#ff4d6d] text-white">
                      {u.full_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.full_name}</div>
                    <div className="text-xs text-gray-500">@{u.handle}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <MobileNav />
    </div>
  );
}

function NavItem({ icon: Icon, label, active, to, theme }: any) {
  return (
    <Link to={to} className={`w-full flex items-center gap-3 px-3 py-3 transition-colors ${active ? 'bg-[#FF003C]/5 text-[#FF003C] border-r-2 border-[#FF003C] font-semibold' : 'text-gray-400 hover:text-white'}`}>
      <Icon className="w-5 h-5" /><span className="text-sm">{label}</span>
    </Link>
  );
}