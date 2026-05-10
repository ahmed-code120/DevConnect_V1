import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle2, Bookmark, Settings, Video as VideoIcon, Image as ImageIcon, PenSquare, MessageCircle, Search, MoreHorizontal, Send, Phone, Video as VideoCallIcon, Info, Mic, Paperclip, Smile, X as CloseIcon, MicOff, VideoOff, Maximize, Minimize, Play, Pause, BellOff, ShieldAlert, Palette, CheckCircle2, Volume2, Vibrate, Music, Smartphone, Moon, Sun, Monitor, Bell, Activity } from 'lucide-react';
import EmojiPicker, { Theme as EmojiTheme } from 'emoji-picker-react';
import Peer, { MediaConnection } from 'peerjs';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';

export default function MessagesScreen() {
  const navigate = useNavigate();
  const { theme, toggleTheme, openSettings, globalMute } = useSettings();
  const [activeTab, setActiveTab] = useState<'Primary' | 'General' | 'Requests'>('Primary');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeChat, setActiveChat] = useState<number | null>(1);
  const [messageInput, setMessageInput] = useState('');
  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  const [activities, setActivities] = useState([
    { id: 1, userId: 2, text: 'has sent a file', time: '2m ago' },
    { id: 2, userId: 3, text: 'started a video call', time: '1h ago' },
  ]);
  
  const [chats, setChats] = useState([
    {
      id: 1,
      name: 'Roger Korsgaard',
      avatar: 'https://i.pravatar.cc/150?u=51',
      online: true,
      lastMessage: 'Let me check on the auth module',
      time: '10:30 AM',
      unread: 0,
      messages: [
        { id: 1, senderId: 1, text: 'Hey, are you working on the updated auth module?', time: '10:15 AM' },
        { id: 2, senderId: 'me', text: 'Yes! It should be ready by tomorrow. Just polishing the neon glassmorphism effects.', time: '10:20 AM' },
        { id: 3, senderId: 1, text: 'Awesome. We need to deploy it quickly.', time: '10:25 AM' },
        { id: 4, senderId: 1, text: 'Let me check on the auth module', time: '10:30 AM' },
      ]
    },
    {
      id: 2,
      name: 'Terry Torff',
      avatar: 'https://i.pravatar.cc/150?u=52',
      online: true,
      lastMessage: 'Check out this new repo I found.',
      time: 'Yesterday',
      unread: 2,
      messages: [
        { id: 1, senderId: 2, text: 'Have you seen the new React Compiler?', time: 'Yesterday' },
        { id: 2, senderId: 2, text: 'Check out this new repo I found.', time: 'Yesterday' },
      ]
    },
    {
      id: 3,
      name: 'Angel Bergson',
      avatar: 'https://i.pravatar.cc/150?u=53',
      online: false,
      lastMessage: 'Will do.',
      time: 'Tue',
      unread: 0,
      messages: [
        { id: 1, senderId: 'me', text: 'Please review my latest PR.', time: 'Mon' },
        { id: 2, senderId: 3, text: 'Will do.', time: 'Tue' },
      ]
    },
    {
      id: 4,
      name: 'Emerson Gouse',
      avatar: 'https://i.pravatar.cc/150?u=54',
      online: true,
      lastMessage: 'When is the meetup?',
      time: 'Mon',
      unread: 0,
      messages: [
        { id: 1, senderId: 4, text: 'When is the meetup?', time: 'Mon' },
      ]
    },
    {
      id: 5,
      name: 'Zain Culhane',
      avatar: 'https://i.pravatar.cc/150?u=55',
      online: true,
      lastMessage: 'Nice job on the design.',
      time: 'Aug 10',
      unread: 0,
      messages: [
        { id: 1, senderId: 5, text: 'Nice job on the design.', time: 'Aug 10' }
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatInput, setNewChatInput] = useState('');
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const [mutedChats, setMutedChats] = useState<Record<number, boolean>>({});
  const [blockedChats, setBlockedChats] = useState<Record<number, boolean>>({});
  const [chatColors, setChatColors] = useState<Record<number, string>>({});
  const [chatSounds, setChatSounds] = useState<Record<number, string>>({});
  const [chatVibrations, setChatVibrations] = useState<Record<number, boolean>>({});
  const [editingMessageId, setEditingMessageId] = useState<{chatId: number, msgId: number} | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<number | null>(null);
  
  const handleToggleMute = () => {
    if (activeChat === null) return;
    setMutedChats(prev => ({ ...prev, [activeChat]: !prev[activeChat] }));
  };

  const handleToggleBlock = () => {
    if (activeChat === null) return;
    setBlockedChats(prev => ({ ...prev, [activeChat]: !prev[activeChat] }));
  };

  const handleChangeColor = (col: string) => {
    if (activeChat === null) return;
    setChatColors(prev => ({ ...prev, [activeChat]: col }));
  };

  const handleChangeSound = (sound: string) => {
    if (activeChat === null) return;
    setChatSounds(prev => ({ ...prev, [activeChat]: sound }));
    if (!globalMute && !mutedChats[activeChat]) {
      // preview sound (mock)
      console.log(`Playing sound: ${sound}`);
    }
  };

  const handleToggleVibration = () => {
    if (activeChat === null) return;
    setChatVibrations(prev => ({ ...prev, [activeChat]: !prev[activeChat] }));
    if (!globalMute && !mutedChats[activeChat] && navigator.vibrate) {
      navigator.vibrate(200);
    }
  };

  const recordingIntervalRef = useRef<any>(null);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<Peer | null>(null);
  const [myPeerId, setMyPeerId] = useState<string>('');
  const callRef = useRef<MediaConnection | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [remotePeerIdInput, setRemotePeerIdInput] = useState('');
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState<MediaConnection | null>(null);

  useEffect(() => {
    peerRef.current = new Peer();
    
    peerRef.current.on('open', (id) => {
      setMyPeerId(id);
    });

    peerRef.current.on('call', (call) => {
      setIncomingCall(call);
      setIsReceivingCall(true);
    });

    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const endCall = () => {
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsVideoCallActive(false);
    setIsVideoMuted(false);
    setIsAudioMuted(false);
  };

  const startCall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!remotePeerIdInput.trim()) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        mediaStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        const call = peerRef.current?.call(remotePeerIdInput.trim(), stream);
        if (call) {
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
               remoteVideoRef.current.srcObject = remoteStream;
            }
          });
          call.on('close', endCall);
          callRef.current = call;
          setIsVideoCallActive(true);
          setIsCallModalOpen(false);
        }
      })
      .catch(err => console.error("Error accessing media devices for call", err));
  };

  const answerCall = () => {
    if (incomingCall) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          
          incomingCall.answer(stream);
          incomingCall.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
          });
          incomingCall.on('close', endCall);
          callRef.current = incomingCall;
          setIsVideoCallActive(true);
          setIsReceivingCall(false);
        })
        .catch(err => console.error("Error accessing media devices to answer", err));
    }
  };

  const rejectCall = () => {
    if (incomingCall) {
      incomingCall.close();
      setIncomingCall(null);
      setIsReceivingCall(false);
    }
  };

  useEffect(() => {
    if (!isVideoCallActive && callRef.current) {
       endCall();
    }
  }, [isVideoCallActive]);

  useEffect(() => {
    if (mediaStreamRef.current) {
       mediaStreamRef.current.getVideoTracks().forEach(track => track.enabled = !isVideoMuted);
    }
  }, [isVideoMuted]);

  useEffect(() => {
    if (mediaStreamRef.current) {
       mediaStreamRef.current.getAudioTracks().forEach(track => track.enabled = !isAudioMuted);
    }
  }, [isAudioMuted]);

  const activeChatMessagesLength = chats.find(c => c.id === activeChat)?.messages.length;

  useEffect(() => {
    if (activeChat !== null) {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChat && chat.unread > 0) {
          return { ...chat, unread: 0 };
        }
        return chat;
      }));
    }
  }, [activeChat, activeChatMessagesLength]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat, chats, typingUsers]);

  const currentChatObj = chats.find(c => c.id === activeChat);

  const onEmojiClick = (emojiData: any) => {
    setMessageInput(prevInput => prevInput + emojiData.emoji);
  };

  const simulateReply = (chatId: number) => {
    setTimeout(() => {
      setTypingUsers(prev => [...prev, chatId]);
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== chatId));
        addMessageToChat(chatId, "That's interesting! Tell me more.", chatId);
      }, 3000);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file && activeChat) {
        addMessageToChat(activeChat, `Sent a file: ${file.name}`, 'me');
        simulateReply(activeChat);
     }
  };

  const toggleRecording = () => {
     if (isRecording) {
        setIsRecording(false);
        clearInterval(recordingIntervalRef.current);
        if (activeChat) {
          addMessageToChat(activeChat, `🎤 Voice Message (${formatTime(recordingTime)})`, 'me');
          simulateReply(activeChat);
        }
        setRecordingTime(0);
     } else {
        setIsRecording(true);
        setRecordingTime(0);
        recordingIntervalRef.current = setInterval(() => {
           setRecordingTime(prev => prev + 1);
        }, 1000);
     }
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const addMessageToChat = (chatId: number, text: string, sender: 'me' | number = 'me') => {
     setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        const newMessage = {
          id: Date.now() + Math.random(),
          senderId: sender,
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        return {
          ...chat,
          lastMessage: newMessage.text,
          time: newMessage.time,
          unread: sender === 'me' ? chat.unread : chat.unread + 1,
          messages: [...chat.messages, newMessage]
        };
      }
      return chat;
    }));
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChat) return;

    if (editingMessageId && editingMessageId.chatId === activeChat) {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChat) {
          return {
            ...chat,
            messages: chat.messages.map(m => m.id === editingMessageId.msgId ? { ...m, text: messageInput.trim(), isEdited: true } : m)
          };
        }
        return chat;
      }));
      setEditingMessageId(null);
      setMessageInput('');
    } else {
      addMessageToChat(activeChat, messageInput.trim(), 'me');
      setMessageInput('');
      simulateReply(activeChat);
    }
  };

  const handleEditMessageClick = (chatId: number, msgId: number, text: string) => {
    setEditingMessageId({ chatId, msgId });
    setMessageInput(text);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessageInput('');
  };

  const handleDeleteMessageClick = (chatId: number, msgId: number) => {
    setChats(prevChats => prevChats.map(chat => {
      if (chat.id === chatId) {
        return {
          ...chat,
          messages: chat.messages.filter(m => m.id !== msgId)
        };
      }
      return chat;
    }));
  };

  const handleCreateNewChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim()) return;

    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      name: newChatInput.trim(),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newChatInput.trim())}&background=random`,
      online: true,
      lastMessage: 'Tap to chat',
      time: 'Just now',
      unread: 0,
      messages: []
    };

    setChats(prev => [newChat, ...prev]);
    setActiveChat(newChatId);
    setIsNewChatModalOpen(false);
    setNewChatInput('');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row h-screen overflow-hidden">
      {/* LEFT SIDEBAR (Standard Navigation) */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 overflow-y-auto`}>
        {/* Brand / Logo */}
        <Link to="/feed" className="flex items-center gap-3 px-2 mb-8">
           <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C] shadow-[0_0_15px_rgba(255,0,60,0.6)]' : 'bg-[#ff2a4b] border border-red-200'}`}>
              <span className={`font-black text-xl italic ${theme === 'dark' ? 'text-black' : 'text-white'}`}>D</span>
           </div>
           <h2 className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>DEV<span className="text-[#FF003C]">CONNECT</span></h2>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-4 mt-2 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Navigation</p>
          <NavItem icon={PenSquare} label="Feed" to="/feed" theme={theme} />
          <NavItem icon={UserCircle2} label="Profile" to="/profile" theme={theme} />
          <NavItem icon={Bookmark} label="Saved" to="/saved" theme={theme} />
          <NavItem icon={MessageCircle} label="Messages" active to="/messages" theme={theme} />
          
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-4 mt-6 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Personal</p>
          <button 
            onClick={openSettings}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium text-sm">App Settings</span>
          </button>
        </nav>
      </aside>

      {/* MESSAGES LIST (Sidebar) */}
      <aside className={`w-full md:w-80 shrink-0 border-r flex flex-col ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]' : 'border-gray-200 bg-gray-50'} ${activeChat !== null ? 'hidden md:flex' : 'flex'}`}>
         <div className={`p-6 border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                   {/* Mobile Back Button */}
                   <button onClick={() => navigate(-1)} className={`md:hidden p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
                     <ArrowLeft className="w-5 h-5" />
                   </button>
                   <h2 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Messages</h2>
                </div>
                <button onClick={() => setIsNewChatModalOpen(true)} className={`transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-[#FF003C]' : 'text-gray-500 hover:text-[#ff2a4b]'}`}>
                   <PenSquare className="w-5 h-5"/>
                </button>
            </div>

            {/* Chat Search */}
            <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-200 shadow-sm'}`}>
                <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search messages..." 
                  className={`bg-transparent border-none focus:outline-none w-full text-sm ${theme === 'dark' ? 'placeholder:text-gray-500 text-[#e0e0e0]' : 'placeholder:text-gray-400 text-gray-900'}`} 
                />
            </div>
         </div>

         {/* Chat Tabs */}
         <div className={`flex px-6 pt-4 text-sm font-medium border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
            <button 
              onClick={() => setActiveTab('Primary')}
              className={`pb-3 px-1 mr-6 transition-colors border-b-2 ${activeTab === 'Primary' ? (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : (theme === 'dark' ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
            >
              Primary
            </button>
            <button 
              onClick={() => setActiveTab('General')}
              className={`pb-3 px-1 mr-auto transition-colors border-b-2 ${activeTab === 'General' ? (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : (theme === 'dark' ? 'border-transparent text-gray-500 hover:text-gray-300' : 'border-transparent text-gray-500 hover:text-gray-700')}`}
            >
              General
            </button>
            <button 
              onClick={() => setActiveTab('Requests')}
              className={`pb-3 px-1 transition-colors border-b-2 ${activeTab === 'Requests' ? (theme === 'dark' ? 'border-[#FF003C] text-[#FF003C]' : 'border-[#ff2a4b] text-[#ff2a4b]') : (theme === 'dark' ? 'border-transparent text-[#FF003C]/70 hover:text-[#FF003C]' : 'border-transparent text-[#ff2a4b]/70 hover:text-[#ff2a4b]')}`}
            >
              Requests(4)
            </button>
         </div>

         {/* Activity Log */}
         <div className={`px-5 py-3 border-b ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center gap-2 mb-2">
               <Activity className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]'}`} />
               <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recent Activity</span>
            </div>
            <div className="space-y-2 flex flex-col">
               {typingUsers.map(id => {
                  const user = chats.find(c => c.id === id);
                  if (!user) return null;
                  return (
                    <div key={`typing-${id}`} className="flex items-center gap-2 text-xs">
                        <img src={user.avatar} className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'border border-[#1f1f1f]' : 'border border-gray-200'}`} alt={user.name} />
                        <span className={`truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><span className="font-semibold">{user.name}</span> is typing...</span>
                        <span className="text-[10px] text-gray-500 ml-auto shrink-0">Just now</span>
                    </div>
                  );
               })}
               {activities.map(act => {
                  const user = chats.find(c => c.id === act.userId);
                  if (!user) return null;
                  return (
                    <div key={act.id} className="flex items-center gap-2 text-xs">
                        <img src={user.avatar} className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'border border-[#1f1f1f]' : 'border border-gray-200'}`} alt={user.name} />
                        <span className={`truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}><span className="font-semibold">{user.name}</span> {act.text}</span>
                        <span className="text-[10px] text-gray-500 ml-auto shrink-0">{act.time}</span>
                    </div>
                  );
               })}
               {typingUsers.length === 0 && activities.length === 0 && (
                 <span className="text-xs text-gray-500">No recent activity</span>
               )}
            </div>
         </div>

         {/* Chat List */}
         <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
            {chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(chat => (
               <button 
                  key={chat.id}
                  onClick={() => setActiveChat(chat.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${activeChat === chat.id ? (theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-white shadow-sm border border-gray-200') : (theme === 'dark' ? 'hover:bg-[#121212]' : 'hover:bg-white text-gray-700')} ${chat.unread > 0 ? (theme === 'dark' ? 'bg-[#FF003C]/5' : 'bg-red-50/50') : ''}`}
               >
                  <div className="relative shrink-0">
                     <img src={chat.avatar} className={`w-12 h-12 rounded-full object-cover transition-all ${!chat.online ? 'grayscale opacity-50' : 'shadow-sm'}`} alt={chat.name} />
                     <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 rounded-full transition-colors ${theme === 'dark' ? 'border-[#050505]' : 'border-white'} ${chat.online ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-500'}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-baseline mb-1">
                         <div className="flex items-center gap-1.5 truncate">
                           <span className={`text-sm font-bold truncate transition-colors ${activeChat === chat.id ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-gray-200' : 'text-gray-800')} ${!chat.online && activeChat !== chat.id ? 'opacity-60' : ''}`}>{chat.name}</span>
                           {mutedChats[chat.id] && <BellOff className={`w-3.5 h-3.5 shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />}
                         </div>
                         <span className={`text-[10px] shrink-0 ml-2 transition-colors ${chat.unread > 0 ? (theme === 'dark' ? 'text-[#FF003C] font-bold' : 'text-[#ff2a4b] font-bold') : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}
                               style={chat.unread > 0 && chatColors[chat.id] ? { color: chatColors[chat.id] } : {}}
                         >{chat.time}</span>
                     </div>
                     <div className="flex justify-between items-center mt-1">
                       <span className={`text-xs truncate transition-colors ${chat.unread > 0 ? (theme === 'dark' ? 'text-gray-200 font-semibold' : 'text-gray-900 font-semibold') : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500')} ${typingUsers.includes(chat.id) ? (theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]') : ''}`}>
                         {typingUsers.includes(chat.id) ? 'Typing...' : chat.lastMessage}
                       </span>
                       {chat.unread > 0 && (
                          <span 
                            className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-extrabold shrink-0 ml-2 shadow-sm animate-pulse ${theme === 'dark' ? 'text-black shadow-[0_0_8px_rgba(255,0,60,0.4)]' : 'text-white shadow-[0_0_8px_rgba(255,42,75,0.4)]'}`}
                            style={{ backgroundColor: chatColors[chat.id] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') }}
                          >
                            {chat.unread}
                          </span>
                       )}
                     </div>
                  </div>
               </button>
            ))}
         </div>
      </aside>

      {/* CHAT WINDOW (Main Content) */}
      <main className={`relative flex-1 flex flex-col ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'} ${activeChat === null ? 'hidden md:flex' : 'flex'}`}>
         {/* New Chat Modal */}
         {isNewChatModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className={`w-full max-w-md rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white shadow-xl'}`}>
               <div className="flex justify-between items-center mb-6">
                 <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>New Message</h2>
                 <button onClick={() => setIsNewChatModalOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                   <CloseIcon className="w-5 h-5" />
                 </button>
               </div>
               
               <form onSubmit={handleCreateNewChat}>
                 <div className="mb-6">
                   <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                     To: Username or Email
                   </label>
                   <input
                     type="text"
                     value={newChatInput}
                     onChange={(e) => setNewChatInput(e.target.value)}
                     placeholder="Type a name, username, or email..."
                     autoFocus
                     className={`w-full px-4 py-3 rounded-xl border focus:outline-none transition-colors ${
                       theme === 'dark' 
                         ? 'bg-[#0a0a0a] border-[#2a2a2a] focus:border-[#FF003C] text-white placeholder:text-gray-600' 
                         : 'bg-gray-50 border-gray-300 focus:border-[#ff2a4b] text-gray-900 placeholder:text-gray-400'
                     }`}
                   />
                 </div>
                 
                 <div className="flex gap-3 justify-end">
                   <button 
                     type="button" 
                     onClick={() => setIsNewChatModalOpen(false)}
                     className={`px-5 py-2.5 rounded-xl font-medium transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                   >
                     Cancel
                   </button>
                   <button 
                     type="submit"
                     disabled={!newChatInput.trim()}
                     className={`px-5 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-[#FF003C] text-black hover:bg-[#cc0030]' : 'bg-[#ff2a4b] text-white hover:bg-red-600'}`}
                   >
                     Start Chat
                   </button>
                 </div>
               </form>
             </div>
           </div>
         )}

         {/* Call Action Modal */}
         {isCallModalOpen && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className={`w-full max-w-sm rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white shadow-xl'}`}>
               <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Start Video Call</h3>
               <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Your Peer ID: <span className="font-mono bg-gray-100 dark:bg-[#1a1a1a] p-1 rounded select-all">{myPeerId}</span></p>
               <form onSubmit={startCall}>
                 <input
                   type="text"
                   value={remotePeerIdInput}
                   onChange={(e) => setRemotePeerIdInput(e.target.value)}
                   placeholder="Enter remote Peer ID"
                   className={`w-full px-4 py-3 mb-4 rounded-xl border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#2a2a2a] focus:border-[#FF003C] text-white placeholder:text-gray-600' : 'bg-gray-50 border-gray-300 focus:border-[#ff2a4b] text-gray-900 placeholder:text-gray-400'}`}
                 />
                 <div className="flex gap-3 justify-end">
                   <button type="button" onClick={() => setIsCallModalOpen(false)} className={`px-4 py-2 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>Cancel</button>
                   <button type="submit" disabled={!remotePeerIdInput.trim()} className={`px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50 ${theme === 'dark' ? 'bg-[#FF003C] text-black hover:bg-[#cc0030]' : 'bg-[#ff2a4b] text-white hover:bg-red-600'}`}>Call</button>
                 </div>
               </form>
             </div>
           </div>
         )}
         
         {/* Incoming Call Modal */}
         {isReceivingCall && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className={`w-full max-w-sm rounded-2xl p-6 text-center ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white shadow-xl'}`}>
               <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                 <VideoCallIcon className="w-8 h-8 text-white" />
               </div>
               <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Incoming Video Call</h3>
               <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Someone is calling you</p>
               <div className="flex gap-4 justify-center">
                 <button onClick={rejectCall} className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg hover:scale-105">
                   <Phone className="w-5 h-5 transform rotate-[135deg]" />
                 </button>
                 <button onClick={answerCall} className="w-12 h-12 flex items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors shadow-lg hover:scale-105">
                   <VideoCallIcon className="w-5 h-5" />
                 </button>
               </div>
             </div>
           </div>
         )}

         {/* Video Call Overlay */}
         {isVideoCallActive && currentChatObj && (
            <div className={`absolute inset-0 z-50 flex flex-col ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-900'} overflow-hidden shadow-2xl`}>
               <div className="relative flex-1 bg-black">
                  {/* Background Blur */}
                  <div className="absolute inset-0">
                     <img src={currentChatObj.avatar} className="w-full h-full object-cover opacity-40 blur-3xl" alt="Background" />
                  </div>
                  
                  {/* Remote User Video */}
                  <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-contain z-10" />
                  
                  {/* Remote User Name & Status */}
                  <div className="absolute top-12 left-0 right-0 z-20 flex flex-col items-center drop-shadow-md">
                     <h2 className="text-white text-3xl font-bold tracking-tight drop-shadow-lg">{currentChatObj.name}</h2>
                     <span className="text-white/80 text-sm mt-1 font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-md">
                        {isAudioMuted && isVideoMuted ? "Connecting..." : "02:14"}
                     </span>
                  </div>

                  {/* Top-right Actions (Add, Switch Camera) */}
                  <div className="absolute top-12 right-6 z-20 flex gap-4">
                     <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md hover:bg-black/40 transition-colors">
                        <UserCircle2 className="w-6 h-6" />
                     </button>
                  </div>

                  {/* Local User Video (PIP) */}
                  <div className="absolute bottom-32 right-6 w-32 h-48 bg-gray-800 rounded-2xl overflow-hidden shadow-2xl z-20 border-2 border-white/10 transition-all hover:scale-105 group">
                     <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`} />
                     {isVideoMuted && (
                       <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800/90 text-gray-400 backdrop-blur-sm">
                          <VideoOff className="w-10 h-10 mb-2" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Muted</span>
                       </div>
                     )}
                  </div>
               </div>

               {/* Floating Controls Bar */}
               <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center gap-6 px-8 py-4 backdrop-blur-xl bg-white/10 border border-white/20 rounded-[2rem] shadow-2xl">
                  {/* Mic Toggle */}
                  <button onClick={() => setIsAudioMuted(!isAudioMuted)} className={`relative flex flex-col items-center justify-center group`}>
                     <div className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 ${isAudioMuted ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black/30 text-white hover:bg-black/50'}`}>
                        {isAudioMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                     </div>
                  </button>

                  {/* End Call (Center & Large) */}
                  <button onClick={() => setIsVideoCallActive(false)} className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 mx-2">
                     <Phone className="w-7 h-7 transform rotate-[135deg]" />
                  </button>

                  {/* Video Toggle */}
                  <button onClick={() => setIsVideoMuted(!isVideoMuted)} className={`relative flex flex-col items-center justify-center group`}>
                     <div className={`w-14 h-14 flex items-center justify-center rounded-full transition-all duration-300 ${isVideoMuted ? 'bg-white text-black scale-105 shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'bg-black/30 text-white hover:bg-black/50'}`}>
                        {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <VideoCallIcon className="w-6 h-6" />}
                     </div>
                  </button>
               </div>
            </div>
         )}

         {activeChat !== null && currentChatObj ? (
            <>
               {/* Chat Header */}
               <header className={`px-6 py-4 border-b flex items-center justify-between shadow-sm z-10 ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
                  <div className="flex items-center gap-4">
                     <button 
                       onClick={() => setActiveChat(null)} 
                       className={`md:hidden p-2 -ml-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                     >
                       <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div className="relative">
                        <img src={currentChatObj.avatar} className="w-10 h-10 rounded-full object-cover" alt={currentChatObj.name} />
                        {currentChatObj.online && <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 rounded-full ${theme === 'dark' ? 'border-[#0a0a0a]' : 'border-white'}`}></div>}
                     </div>
                     <div>
                        <h2 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentChatObj.name}</h2>
                        <p className={`text-[11px] ${theme === 'dark' ? (currentChatObj.online ? 'text-green-500' : 'text-gray-500') : (currentChatObj.online ? 'text-green-600' : 'text-gray-500')}`}>
                          {currentChatObj.online ? 'Active now' : 'Offline'}
                        </p>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-[#ff2a4b]'}`}>
                        <Phone className="w-5 h-5" />
                     </button>
                     <button onClick={() => setIsCallModalOpen(true)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400 hover:text-[#FF003C]' : 'hover:bg-gray-100 text-gray-600 hover:text-[#ff2a4b]'}`}>
                        <VideoCallIcon className="w-5 h-5" />
                     </button>
                     <div className={`w-px h-6 mx-1 ${theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}></div>
                     <button onClick={() => setIsChatSettingsOpen(!isChatSettingsOpen)} className={`p-2 rounded-full transition-colors ${isChatSettingsOpen ? (theme === 'dark' ? 'bg-[#1f1f1f] text-white' : 'bg-gray-100 text-gray-900') : (theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900')}`}>
                        <Info className="w-5 h-5" />
                     </button>
                  </div>
               </header>

               {/* Chat Messages */}
               <div className={`flex-1 overflow-y-auto p-6 space-y-6 relative ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#fafafa]'}`}>
                  {/* Date Divider */}
                  <div className="flex items-center justify-center">
                     <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase ${theme === 'dark' ? 'bg-[#1f1f1f] text-gray-500' : 'bg-gray-200 text-gray-500'}`}>
                        Today
                     </div>
                  </div>

                   {currentChatObj.messages.map((msg, index) => {
                     const isMe = msg.senderId === 'me';
                     const showAvatar = !isMe && (index === 0 || currentChatObj.messages[index - 1].senderId !== msg.senderId);
                     const chatColor = chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b');

                     return (
                       <div 
                           key={msg.id} 
                           className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-4' : 'mt-1'} group`}
                           onMouseEnter={() => setHoveredMessageId(msg.id)}
                           onMouseLeave={() => setHoveredMessageId(null)}
                       >
                          <div className={`flex max-w-[70%] gap-2 relative ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                             {/* Avatar Placeholder for alignment if not shown */}
                             {!isMe && (
                                <div className="w-8 shrink-0">
                                   {showAvatar && (
                                     <img src={currentChatObj.avatar} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                                   )}
                                </div>
                             )}

                             <div className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                                  isMe 
                                    ? (theme === 'dark' ? 'text-black shadow-[0_2px_10px_rgba(255,0,60,0.2)] rounded-tr-sm' : 'text-white shadow-md rounded-tr-sm')
                                    : (theme === 'dark' ? 'bg-[#1f1f1f] text-[#e0e0e0] border border-[#2a2a2a] rounded-tl-sm' : 'bg-white text-gray-800 border border-gray-200 shadow-sm rounded-tl-sm')
                                }`}
                                style={isMe ? { backgroundColor: chatColor, boxShadow: theme === 'dark' ? `0 2px 10px ${chatColor}33` : undefined } : {}}
                                >
                                   {msg.text.startsWith('🎤 Voice Message') ? (
                                     <VoiceMessagePlayer text={msg.text} isMe={isMe} theme={theme} color={chatColor} />
                                   ) : (
                                     msg.text
                                   )}
                                </div>
                                <span className={`text-[10px] mt-1 mx-1 flex items-center gap-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
                                  {msg.time}
                                  {(msg as any).isEdited && <span className="opacity-70">(edited)</span>}
                                </span>
                             </div>

                             {/* Context Menu for Sent Messages */}
                             {isMe && hoveredMessageId === msg.id && (
                                <div className={`absolute top-0 right-full mr-2 hidden group-hover:flex items-center gap-1 p-1 rounded-lg shadow-md border z-10 ${theme === 'dark' ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}`}>
                                   {!msg.text.startsWith('🎤 Voice Message') && (
                                      <button onClick={() => handleEditMessageClick(activeChat, msg.id, msg.text)} className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'}`} title="Edit">
                                         <PenSquare className="w-3.5 h-3.5" />
                                      </button>
                                   )}
                                   <button onClick={() => handleDeleteMessageClick(activeChat, msg.id)} className={`p-1.5 rounded transition-colors ${theme === 'dark' ? 'hover:bg-[#2a2a2a] text-gray-400 hover:text-red-500' : 'hover:bg-gray-100 text-gray-500 hover:text-red-600'}`} title="Delete">
                                      <CloseIcon className="w-3.5 h-3.5" />
                                   </button>
                                </div>
                             )}
                          </div>
                       </div>
                     );
                  })}
                  {typingUsers.includes(activeChat) && (
                     <div className="flex justify-start mt-4">
                        <div className="flex max-w-[70%] gap-2 flex-row">
                           <div className="w-8 shrink-0">
                              <img src={currentChatObj.avatar} className="w-8 h-8 rounded-full object-cover" alt="avatar" />
                           </div>
                           <div className={`flex items-center px-4 py-3 rounded-2xl ${theme === 'dark' ? 'bg-[#1f1f1f] border border-[#2a2a2a] rounded-tl-sm' : 'bg-white border border-gray-200 shadow-sm rounded-tl-sm'}`}>
                             <div className="flex gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: '0ms', backgroundColor: chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') }}></div>
                               <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: '150ms', backgroundColor: chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') }}></div>
                               <div className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ animationDelay: '300ms', backgroundColor: chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') }}></div>
                             </div>
                           </div>
                        </div>
                     </div>
                  )}
                  <div ref={messagesEndRef} />
               </div>

               {/* Chat Input */}
               {blockedChats[activeChat as number] ? (
                  <div className={`p-4 border-t text-center ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
                     <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>You have blocked this user. Unblock to send messages.</p>
                     <button onClick={handleToggleBlock} className={`mt-2 text-sm font-bold transition-colors`} style={{ color: chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') }}>Unblock User</button>
                  </div>
               ) : (
               <div className={`relative p-4 border-t ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'}`}>
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 left-4 z-50">
                      <EmojiPicker 
                        theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                        onEmojiClick={onEmojiClick}
                      />
                    </div>
                  )}
                  <form onSubmit={handleSendMessage} className={`flex items-end gap-2 p-2 rounded-2xl border transition-colors ${theme === 'dark' ? 'bg-[#121212] border-[#2a2a2a] focus-within:border-[#FF003C]' : 'bg-gray-50 border-gray-300 focus-within:border-[#ff2a4b] shadow-sm'}`}>
                     <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`p-2 shrink-0 rounded-full transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>
                        <Smile className="w-5 h-5" />
                     </button>
                     <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                     <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2 shrink-0 rounded-full transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}`}>
                        <Paperclip className="w-5 h-5" />
                     </button>
                     
                     <div className="flex-1 flex flex-col justify-center min-h-[40px]">
                       {editingMessageId && (
                         <div className={`flex items-center justify-between px-2 pb-1 mb-1 text-xs font-semibold ${theme === 'dark' ? 'text-[#FF003C] border-[#1f1f1f] border-b' : 'text-[#ff2a4b] border-gray-100 border-b'}`}>
                           <div className="flex items-center gap-1.5">
                             <PenSquare className="w-3 h-3" />
                             Editing message
                           </div>
                           <button type="button" onClick={handleCancelEdit} className="opacity-70 hover:opacity-100 transition-opacity">Cancel</button>
                         </div>
                       )}
                       {isRecording ? (
                         <div className="flex items-center justify-between px-2">
                           <div className={`flex items-center gap-2 ${theme === 'dark' ? 'text-[#FF003C]' : 'text-red-500'} font-medium text-sm animate-pulse`}>
                              <div className="w-2 h-2 rounded-full bg-current"></div>
                              Recording {formatTime(recordingTime)}
                           </div>
                           <button 
                             type="button" 
                             onClick={() => { setIsRecording(false); clearInterval(recordingIntervalRef.current); setRecordingTime(0); }} 
                             className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-red-500'}`}
                           >
                             Cancel
                           </button>
                         </div>
                       ) : (
                         <textarea 
                           value={messageInput}
                           onChange={(e) => setMessageInput(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               handleSendMessage(e);
                             }
                           }}
                           placeholder="Type a message..."
                           className={`w-full max-h-32 py-1 px-2 bg-transparent border-none focus:outline-none resize-none text-sm ${theme === 'dark' ? 'text-white placeholder:text-gray-600' : 'text-gray-900 placeholder:text-gray-400'}`}
                           rows={1}
                         />
                       )}
                     </div>
                     
                     {messageInput.trim() && !isRecording ? (
                        <button type="submit" className={`p-2 shrink-0 rounded-full transition-colors shadow-sm ${theme === 'dark' ? 'text-black hover:opacity-90' : 'text-white hover:opacity-90'}`} style={{ backgroundColor: chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') }}>
                           <Send className="w-5 h-5 ml-1 mr-[-2px] mt-px mb-[-1px]" />
                        </button>
                     ) : (
                        <button type="button" onClick={toggleRecording} className={`p-2 shrink-0 rounded-full transition-colors ${isRecording ? (theme === 'dark' ? 'text-white shadow-[0_0_10px_rgba(255,0,60,0.5)]' : 'text-white shadow-[0_0_10px_rgba(255,42,75,0.5)]') : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200')}`} style={isRecording ? { backgroundColor: chatColors[activeChat as number] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') } : {}}>
                           {isRecording ? <Send className="w-5 h-5 ml-1 mr-[-2px] mt-px mb-[-1px]" /> : <Mic className="w-5 h-5" />}
                        </button>
                     )}
                  </form>
               </div>
               )}
            </>
         ) : (
            <div className={`flex-1 flex flex-col items-center justify-center p-6 ${theme === 'dark' ? 'bg-[#050505]' : 'bg-[#fafafa]'}`}>
               <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 border-4 ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-gray-100 border-white shadow-xl'}`}>
                  <MessageCircle className={`w-10 h-10 ${theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]'}`} />
               </div>
               <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Your Messages</h3>
               <p className={`text-sm text-center max-w-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                  Select a chat from the sidebar to start messaging or create a new conversation.
               </p>
            </div>
         )}
         
         {/* Chat Details Sidebar */}
         {isChatSettingsOpen && currentChatObj && (
           <aside className={`w-[280px] shrink-0 border-l flex flex-col absolute md:static inset-y-0 right-0 z-30 transition-transform ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]' : 'border-gray-200 bg-white'}`}>
             <div className={`p-6 flex items-center justify-between border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                <h2 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Chat Details</h2>
                <button onClick={() => setIsChatSettingsOpen(false)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                   <CloseIcon className="w-5 h-5" />
                </button>
             </div>
             <div className={`p-6 flex flex-col items-center border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                <img src={currentChatObj.avatar} className="w-24 h-24 rounded-full object-cover mb-4 shadow-md" alt={currentChatObj.name} />
                <h3 className={`text-xl font-bold mb-1 col-span-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentChatObj.name}</h3>
                <p className={`text-sm ${theme === 'dark' ? (currentChatObj.online ? 'text-green-500' : 'text-gray-500') : (currentChatObj.online ? 'text-green-600' : 'text-gray-500')}`}>
                  {currentChatObj.online ? 'Active now' : 'Offline'}
                </p>
             </div>
             <div className="p-4 space-y-5 flex-1 overflow-y-auto">
                {/* Privacy & Support */}
                <div>
                   <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 px-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Privacy & Support</h4>
                   <button onClick={handleToggleMute} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-50'} mb-1`}>
                      <div className="flex items-center gap-3">
                         <BellOff className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                         <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Mute Notifications</span>
                      </div>
                      <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${mutedChats[currentChatObj.id] ? (theme === 'dark' ? 'text-black' : 'text-white') : (theme === 'dark' ? 'bg-[#1f1f1f] border border-gray-700' : 'bg-gray-300')}`} style={mutedChats[currentChatObj.id] ? { backgroundColor: chatColors[currentChatObj.id] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') } : {}}>
                         <div className={`w-4 h-4 rounded-full bg-white transition-transform ${mutedChats[currentChatObj.id] ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`}></div>
                      </div>
                   </button>
                   <button onClick={handleToggleBlock} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-red-500' : 'hover:bg-red-50 text-red-600'}`}>
                      <div className="flex items-center gap-3">
                         <ShieldAlert className="w-5 h-5" />
                         <span className="text-sm font-medium">{blockedChats[currentChatObj.id] ? 'Unblock User' : 'Block User'}</span>
                      </div>
                   </button>
                </div>

                {/* Chat Customization */}
                <div>
                   <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 px-1 mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Customization</h4>
                   <div className={`space-y-2`}>
                     <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3 mb-3">
                           <Palette className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                           <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Theme Color</span>
                        </div>
                        <div className="flex items-center gap-3 px-1">
                           {['#FF003C', '#3b82f6', '#10b981', '#8b5cf6', '#eab308'].map(col => (
                              <button 
                                 key={col} 
                                 onClick={() => handleChangeColor(col)}
                                 className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110`}
                                 style={{ backgroundColor: col }}
                              >
                                 {(chatColors[currentChatObj.id] || '#FF003C') === col && <CheckCircle2 className="w-5 h-5 text-white drop-shadow-md" />}
                              </button>
                           ))}
                        </div>
                     </div>
                     
                     <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-3 mb-3">
                           <Music className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                           <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Message Sound</span>
                        </div>
                        <div className={`flex flex-wrap gap-2`}>
                           {['Default', 'Pop', 'Ding', 'Chime'].map(sound => (
                              <button
                                 key={sound}
                                 onClick={() => handleChangeSound(sound)}
                                 className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  (chatSounds[currentChatObj.id] || 'Default') === sound 
                                    ? (theme === 'dark' ? 'border-[#FF003C] text-[#FF003C] bg-[#FF003C]/10' : 'border-[#ff2a4b] text-[#ff2a4b] bg-red-50')
                                    : (theme === 'dark' ? 'border-[#2a2a2a] text-gray-400 hover:text-gray-200 hover:border-gray-600' : 'border-gray-200 text-gray-600 hover:bg-gray-100')
                                 }`}
                                 style={(chatSounds[currentChatObj.id] || 'Default') === sound ? { borderColor: chatColors[currentChatObj.id] || (theme === 'dark' ? '#FF003C' : '#ff2a4b'), color: chatColors[currentChatObj.id] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') } : {}}
                              >
                                 {sound}
                              </button>
                           ))}
                        </div>
                     </div>

                     <button onClick={handleToggleVibration} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${theme === 'dark' ? 'bg-[#121212] hover:bg-[#1a1a1a]' : 'bg-gray-50 hover:bg-gray-100'} mb-1`}>
                        <div className="flex items-center gap-3">
                           <Vibrate className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                           <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Vibrations</span>
                        </div>
                        <div className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${chatVibrations[currentChatObj.id] ?? true ? (theme === 'dark' ? 'text-black' : 'text-white') : (theme === 'dark' ? 'bg-[#1f1f1f] border border-gray-700' : 'bg-gray-300')}`} style={chatVibrations[currentChatObj.id] ?? true ? { backgroundColor: chatColors[currentChatObj.id] || (theme === 'dark' ? '#FF003C' : '#ff2a4b') } : {}}>
                           <div className={`w-4 h-4 rounded-full bg-white transition-transform ${chatVibrations[currentChatObj.id] ?? true ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`}></div>
                        </div>
                     </button>
                   </div>
                </div>
             </div>
           </aside>
         )}
      </main>
      {activeChat === null && <MobileNav />}
    </div>
  );
}

function NavItem({ icon: Icon, label, active, to, theme }: { icon: any, label: string, active?: boolean, to: string, theme: string }) {
  return (
    <Link to={to} className={`w-full flex items-center gap-3 px-3 py-3 transition-colors ${
      active 
        ? `${theme === 'dark' ? 'bg-[#FF003C]/5 text-[#FF003C] border-r-2 border-[#FF003C] font-semibold rounded' : 'bg-[#1877F2] text-white font-semibold shadow-md rounded-xl' }` 
        : `${theme === 'dark' ? 'text-gray-400 hover:text-white rounded p-2' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl'}`
    }`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

function VoiceMessagePlayer({ text, isMe, theme, color }: { text: string, isMe: boolean, theme: string, color: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const durationMatch = text.match(/\((.*?)\)/);
  const duration = durationMatch ? durationMatch[1] : '0:00';

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1; 
        });
      }, 50);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className={`flex items-center gap-3 min-w-[200px] max-w-[250px] cursor-pointer`} onClick={() => setIsPlaying(!isPlaying)}>
       <button className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${isMe ? 'bg-black/20 text-white' : 'text-white'}`} style={!isMe ? { backgroundColor: color } : {}}>
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 ml-1 fill-current" />}
       </button>
       
       <div className="flex-1 flex flex-col gap-1.5 justify-center">
          <div className="flex justify-between items-center text-[10px] opacity-80 mt-1">
            <span className="font-bold tracking-wide font-mono">{duration}</span>
          </div>

          <div className="relative w-full h-4 flex items-center">
             <div className={`absolute left-0 w-full h-1.5 rounded-full overflow-hidden ${isMe ? 'bg-black/10' : (theme === 'dark' ? 'bg-white/10' : 'bg-gray-200')}`}>
                <div 
                  className={`h-full ${isMe ? 'bg-black' : ''}`} 
                  style={{ width: `${progress}%`, transition: isPlaying ? 'width 50ms linear' : 'none', backgroundColor: isMe ? undefined : color }}
                ></div>
             </div>
             {/* Fake visualizer bars */}
             <div className="absolute inset-x-0 h-full flex items-center justify-between px-1 pointer-events-none opacity-40">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className={`w-0.5 rounded-full ${isMe ? 'bg-black' : (theme === 'dark' ? 'bg-white' : 'bg-gray-600')}`} style={{ height: `${Math.max(20, Math.random() * 100)}%` }}></div>
                ))}
             </div>
          </div>
       </div>
    </div>
  );
}
