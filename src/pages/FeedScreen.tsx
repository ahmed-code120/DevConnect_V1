import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Bookmark, Settings, MoreHorizontal, Heart, MessageCircle, Share2, PenSquare, Image as ImageIcon, Link as LinkIcon, Video, Hash, UserCircle2, Plus, X, ChevronLeft, ChevronRight, Camera, Play, Pause, Volume2, VolumeX, Eye, Trash2, UserPlus, UserMinus, Github, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';
import { io } from 'socket.io-client';

export default function FeedScreen() {
  const { theme, openSettings, currentUser, setCurrentUser } = useSettings();
  const navigate = useNavigate();

  // --- Feed Posts State ---
  type FeedPostType = {
    id: string;
    avatar: string;
    name: string;
    isOwn?: boolean;
    time: string;
    desc: string;
    images?: string[];
    videoUrl?: string;
    likes: number;
    comments: number;
    shares: number;
    repository?: string;
    liveDemo?: string;
    tags?: string[];
    isLiked?: boolean;
    isSaved?: boolean;
  };

  const [feedPosts, setFeedPosts] = useState<FeedPostType[]>([]);
  const [sidebarChats, setSidebarChats] = useState<any[]>([]);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  
  const [notification, setNotification] = useState<{ message: string; show: boolean } | null>(null);
  const [notificationCenter, setNotificationCenter] = useState<any[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  useEffect(() => {
    fetch("/api/php/posts.php")
      .then(res => res.json())
      .then(result => {
        if(result.status === 'success' && Array.isArray(result.data)) {
            setFeedPosts(result.data);
        }
      })
      .catch(err => console.error('Fetch error:', err));

    const socket = io();

    const addNotification = (type: string, user: string, message: string, icon?: string) => {
      const newNotif = {
        id: Date.now(),
        type,
        user,
        message,
        icon,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false
      };
      setNotificationCenter(prev => [newNotif, ...prev]);
      setNotification({ message, show: true });
      setTimeout(() => setNotification(null), 3000);
    };
    
    socket.on("new_post", (post: FeedPostType) => {
      setFeedPosts((prev) => {
         if (prev.some(p => p.id === post.id)) return prev;
         return [post, ...prev];
      });
      if (currentUser && post.name !== currentUser.name) {
        addNotification('post', post.name, `New post from ${post.name}`, '📝');
      }
    });

    socket.on("post_liked", (data: { post_id: string; user_name: string; likes: number }) => {
      if (currentUser && data.user_name !== currentUser.name) {
        addNotification('like', data.user_name, `${data.user_name} liked your post`, '❤️');
      }
      setFeedPosts((prev) =>
        prev.map(p => p.id === data.post_id ? { ...p, likes: data.likes } : p)
      );
    });

    socket.on("post_commented", (data: { post_id: string; user_name: string; comment: string; comments: number }) => {
      if (currentUser && data.user_name !== currentUser.name) {
        addNotification('comment', data.user_name, `${data.user_name} commented on your post`, '💬');
      }
      setFeedPosts((prev) =>
        prev.map(p => p.id === data.post_id ? { ...p, comments: data.comments } : p)
      );
    });

    socket.on("user_followed", (data: { follower_name: string; followers_count: number }) => {
      if (currentUser && data.follower_name !== currentUser.name) {
        addNotification('follow', data.follower_name, `${data.follower_name} started following you`, '👥');
      }
      if (currentUser) {
        setCurrentUser({ ...currentUser, followers: data.followers_count });
      }
    });

    socket.on("new_message", (data: { from_user: string; message: string }) => {
      addNotification('message', data.from_user, `New message from ${data.from_user}`, '💌');
    });

    socket.on("post_shared", (data: { post_id: string; user_name: string; shares: number }) => {
      if (currentUser && data.user_name !== currentUser.name) {
        addNotification('share', data.user_name, `${data.user_name} shared your post`, '🔄');
      }
      setFeedPosts((prev) =>
        prev.map(p => p.id === data.post_id ? { ...p, shares: data.shares } : p)
      );
    });

    socket.on("post_updated", (data: { id: string; action: string; likes?: number; comments?: number; post?: FeedPostType; }) => {
      setFeedPosts((prev) => 
        prev.map(p => {
          if (p.id === data.id) {
             if (data.post) return { ...p, ...data.post };
             return {
                 ...p, 
                 likes: data.likes !== undefined ? data.likes : p.likes,
                 comments: data.comments !== undefined ? data.comments : p.comments
             };
          }
          return p;
        })
      );
    });

    socket.on("post_deleted", (data: { id: string }) => {
       setFeedPosts(prev => prev.filter(p => p.id !== data.id));
    });

    return () => { socket.disconnect(); };
  }, []);

  useEffect(() => {
    fetch("/api/php/messages.php")
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success' && Array.isArray(result.data)) {
          setSidebarChats(result.data);
        }
      })
      .catch(err => console.error('Conversation fetch error:', err));
  }, []);

  const [feedFilter, setFeedFilter] = useState<'Latest' | 'Trending' | 'Following'>('Latest');
  const [followingSort, setFollowingSort] = useState<'Latest' | 'Recent'>('Latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [userSearchResults, setUserSearchResults] = useState<any[]>([]);

  useEffect(() => {
    const filterParam = feedFilter === 'Following' ? 'following' : feedFilter.toLowerCase();
    fetch(`/api/php/posts.php?filter=${filterParam}`)
      .then(res => res.json())
      .then(result => {
        if(result.status === 'success' && Array.isArray(result.data)) {
            setFeedPosts(result.data);
        }
      })
      .catch(err => console.error('Fetch error:', err));
  }, [feedFilter]);

  const handleUserSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 0) {
      try {
        const res = await fetch(`/api/php/users.php?search=${query}`);
        const result = await res.json();
        if (result.status === 'success') {
          setUserSearchResults(result.data);
        }
      } catch (err) { console.error(err); }
    } else {
      setUserSearchResults([]);
    }
  };

  const handleToggleFollow = async (userId: number) => {
    try {
      const res = await fetch("/api/php/follows.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: userId })
      });
      const result = await res.json();
      if (result.status === 'success') {
        setUserSearchResults(prev => prev.map(u => 
          u.id === userId ? { ...u, is_following: result.data.is_following } : u
        ));
        
        if (currentUser) {
            setCurrentUser({ ...currentUser, following: result.data.my_following });
        }
        
        setFeedPosts(prev => prev.map(p => p.user_id === userId ? { ...p, is_following: result.data.is_following } : p));
      }
    } catch (err) { console.error(err); }
  };

  const [newPostText, setNewPostText] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const MAX_CHARS = 500;
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [newPostRepo, setNewPostRepo] = useState('');
  const [newPostDemo, setNewPostDemo] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [activePostTool, setActivePostTool] = useState<'image' | 'repo' | 'demo' | 'tags' | null>(null);

  const [editingPost, setEditingPost] = useState<FeedPostType | null>(null);
  const [editPostText, setEditPostText] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectGithubUrl, setProjectGithubUrl] = useState('');
  const [projectImage, setProjectImage] = useState<string | null>(null);
  const [projectTags, setProjectTags] = useState('');

  const handleSharePost = async () => {
    if (!newPostText.trim() && newPostImages.length === 0) return;
    let isVideo = false;
    let videoUrl = undefined;
    if (newPostImages.length === 1 && isVideoSource(newPostImages[0])) {
      isVideo = true;
      videoUrl = newPostImages[0];
    }
    const newPost: Partial<FeedPostType> = {
      id: Date.now().toString(),
      avatar: currentUser?.avatar || "",
      name: currentUser?.name || "Anonymous",
      isOwn: true,
      time: "Just now",
      desc: newPostText,
      images: !isVideo ? newPostImages : [],
      videoUrl: isVideo ? videoUrl : undefined,
      repository: newPostRepo.trim(),
      liveDemo: newPostDemo.trim(),
      tags: newPostTags.split(',').map(t => t.trim()).filter(Boolean)
    };
    try {
        const res = await fetch("/api/php/posts.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPost)
        });
        const result = await res.json();
        if (result.status === 'success') {
            const updatedRes = await fetch("/api/php/posts.php");
            const updatedResult = await updatedRes.json();
            if (updatedResult.status === 'success') setFeedPosts(updatedResult.data);
            setNewPostText(''); setNewPostImages([]); setUploadProgress(0); setNewPostRepo(''); setNewPostDemo(''); setNewPostTags(''); setActivePostTool(null);
        } else { alert(result.message); }
    } catch (err) { console.error(err); }
  };

  const simulateUpload = (files: FileList | File[]) => {
    setUploadProgress(0);
    const fileList = Array.from(files);
    const readers = fileList.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    }));
    let progress = 0;
    const interval = window.setInterval(() => {
      progress = Math.min(progress + 20, 90);
      setUploadProgress(progress);
    }, 120);
    Promise.all(readers).then(urls => {
        window.clearInterval(interval); setUploadProgress(100); setNewPostImages(prevImgs => [...prevImgs, ...urls]);
    }).catch(err => {
        window.clearInterval(interval); setUploadProgress(0); console.error(err);
    });
  };

  const isVideoSource = (src: string) => src.startsWith('data:video/') || /\.(mp4|webm|ogg)$/i.test(src);
  const previewMedia = (src: string) => isVideoSource(src) ? <video src={src} className="w-full h-full object-cover" muted /> : <img src={src} className="w-full h-full object-cover" alt="" />;
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) simulateUpload(e.target.files); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) simulateUpload(e.dataTransfer.files); };
  const handleEditPost = (post: FeedPostType) => { setEditingPost(post); setEditPostText(post.desc); };

  const saveEditedPost = async () => {
    if (editingPost) {
      try {
        const res = await fetch(`/api/php/posts.php?id=${editingPost.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ desc: editPostText }) });
        const result = await res.json();
        if (result.status === 'success') {
          setFeedPosts(prev => prev.map(p => p.id === editingPost.id ? { ...p, ...result.data } : p));
          setEditingPost(null);
        } else { alert(result.message); }
      } catch (err) { console.error(err); }
    }
  };

  const confirmDeletePost = async () => {
    if (postToDelete) {
      try {
        const res = await fetch(`/api/php/posts.php?id=${postToDelete}`, { method: 'DELETE' });
        const result = await res.json();
        if (result.status === 'success') {
          setFeedPosts(prev => prev.filter(p => p.id !== postToDelete)); setPostToDelete(null);
        } else { alert(result.message); }
      } catch (err) { console.error(err); }
    }
  };

  const filteredSidebarChats = sidebarChats.filter(chat => chat.name?.toLowerCase().includes(chatSearchQuery.toLowerCase())).slice(0, 5);
  const postSearchResults = feedPosts.filter(post => {
    if (!searchQuery.trim()) return false;
    const lowerQuery = searchQuery.toLowerCase();
    return post.name.toLowerCase().includes(lowerQuery) || post.desc.toLowerCase().includes(lowerQuery) || post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
  });

  const visiblePosts = feedPosts.filter(post => {
    if (searchQuery.trim() && !showSearchDropdown) {
       const lowerQuery = searchQuery.toLowerCase();
       if (!post.name.toLowerCase().includes(lowerQuery) && !post.desc.toLowerCase().includes(lowerQuery) && !post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) return false;
    }
    return true;
  }).sort((a, b) => {
    if (feedFilter === 'Trending') return b.likes - a.likes;
    if (feedFilter === 'Following' && followingSort === 'Recent') return (b.comments + b.likes + b.shares) - (a.comments + a.likes + a.shares);
    return 0;
  });

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      <header className={`md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b backdrop-blur-lg ${theme === 'dark' ? 'bg-[#0a0a0a]/80 border-[#1f1f1f]' : 'bg-white/80 border-gray-200'}`}>
         <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C] shadow-[0_0_10px_rgba(255,0,60,0.4)]' : 'bg-[#ff2a4b]'}`}>
               <span className={`font-black text-sm italic ${theme === 'dark' ? 'text-black' : 'text-white'}`}>D</span>
            </div>
            <h2 className={`font-bold tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>DEV<span className="text-[#FF003C]">CONNECT</span></h2>
         </div>
         <div className="flex items-center gap-4">
            <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}><Search className="w-5 h-5" /></button>
            <button className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} relative`}>
              <Bell className="w-5 h-5" />
              <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`}></span>
            </button>
         </div>
      </header>

      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 overflow-y-auto sticky top-0 h-screen`}>
        <div className="flex items-center gap-3 px-2 mb-8">
           <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C] shadow-[0_0_15px_rgba(255,0,60,0.6)]' : 'bg-[#ff2a4b] border border-red-200'}`}>
              <span className={`font-black text-xl italic ${theme === 'dark' ? 'text-black' : 'text-white'}`}>D</span>
           </div>
           <h2 className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>DEV<span className="text-[#FF003C]">CONNECT</span></h2>
        </div>

        <Link to="/profile" className={`block mb-8 p-4 rounded-xl border transition-colors cursor-pointer ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#121212] hover:border-[#FF003C]/50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
           <div className="flex items-center gap-3 mb-4">
               {currentUser?.avatar ? (
                 <img src={currentUser.avatar} alt="Avatar" className={`w-12 h-12 rounded-full border-2 ${theme === 'dark' ? 'border-[#FF003C]' : 'border-[#ff2a4b]'}`} />
               ) : (
                 <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold border-2 ${theme === 'dark' ? 'border-[#FF003C] bg-[#1a1a1a] text-[#FF003C]' : 'border-[#ff2a4b] bg-gray-100 text-gray-400'}`}>
                   {currentUser?.name?.charAt(0).toUpperCase() || '?'}
                 </div>
               )}
              <div>
                <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentUser?.name || 'Loading...'} <span className="text-[#FF003C] ml-1">✓</span></h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>{currentUser?.handle ? (currentUser.handle.startsWith('@') ? currentUser.handle : '@' + currentUser.handle) : '@...'}</p>
              </div>
           </div>
           <div className="flex justify-between mt-2">
             <div className="text-center">
               <div className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{currentUser?.followers ?? 0}</div>
               <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Follower</div>
             </div>
             <div className="text-center">
               <div className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{currentUser?.following ?? 0}</div>
               <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Following</div>
             </div>
             <div className="text-center">
               <div className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>{currentUser?.posts ?? 0}</div>
               <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Post</div>
             </div>
           </div>
        </Link>

        <nav className="flex-1 space-y-1">
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-4 mt-2 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Navigation</p>
          <NavItem icon={PenSquare} label="Feed" active to="/feed" theme={theme} />
          <NavItem icon={UserCircle2} label="Profile" to="/profile" theme={theme} />
          <NavItem icon={Bookmark} label="Saved" to="/saved" theme={theme} />
          <NavItem icon={MessageCircle} label="Messages" to="/messages" theme={theme} />
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-4 mt-6 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Personal</p>
          <button onClick={openSettings} className={`w-full flex items-center gap-3 px-3 py-3 rounded transition-colors ${theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#1f1f1f]' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
            <Settings className="w-5 h-5" /><span className="font-medium text-sm">App Settings</span>
          </button>
        </nav>
      </aside>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        <header className="hidden md:flex items-center justify-between mb-8 gap-4">
           <div className={`relative flex-1 max-w-xl`}>
             <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}>
                <Search className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="text" value={searchQuery} onChange={(e) => {handleUserSearch(e.target.value); setShowSearchDropdown(true);}} onFocus={() => setShowSearchDropdown(true)} onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)} placeholder="Search for developers or posts..." className="bg-transparent border-none focus:outline-none w-full text-sm placeholder:text-gray-500" />
             </div>
             <AnimatePresence>
               {showSearchDropdown && searchQuery.trim() && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className={`absolute top-full mt-2 left-0 right-0 rounded-2xl border shadow-xl overflow-hidden z-50 flex flex-col max-h-[400px] ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
                   <div className="overflow-y-auto overflow-x-hidden hide-scrollbar py-2">
                     {userSearchResults.length > 0 && (
                        <div className="px-4 py-2">
                           <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Developers</h4>
                           <div className="space-y-3">
                              {userSearchResults.map((u) => (
                                <div key={u.id} className="flex items-center justify-between">
                                  <Link to="/profile" state={{ viewUser: { id: u.id, name: u.full_name, avatar: u.avatar } }} className="flex items-center gap-3" onClick={() => setShowSearchDropdown(false)}>
                                    {u.avatar ? <img src={u.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-200" alt="" /> : <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold">{u.full_name.charAt(0)}</div>}
                                    <div>
                                      <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{u.full_name}</p>
                                      <p className="text-[10px] text-gray-500">@{u.handle}</p>
                                    </div>
                                  </Link>
                                  <button 
                                    onClick={(e) => { e.preventDefault(); handleToggleFollow(u.id); }}
                                    className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${u.is_following ? (theme === 'dark' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600') : (theme === 'dark' ? 'bg-[#FF003C] text-black border-[#FF003C]' : 'bg-[#ff2a4b] text-white border-[#ff2a4b]')}`}
                                  >
                                    {u.is_following ? 'Following' : 'Follow'}
                                  </button>
                                </div>
                              ))}
                           </div>
                        </div>
                     )}
                     {postSearchResults.length > 0 && (
                        <div className="px-2 mt-2">
                           <h4 className={`text-xs font-bold uppercase tracking-wider px-2 mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Posts</h4>
                           {postSearchResults.slice(0, 5).map(result => (
                             <div key={result.id} className={`p-2 rounded-xl flex gap-3 cursor-pointer mb-1 ${theme === 'dark' ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-50'}`} onClick={() => { setSearchQuery(result.desc); setShowSearchDropdown(false); }}>
                                {result.avatar ? <img src={result.avatar} className="w-8 h-8 rounded-full" alt="" /> : <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 text-xs">{result.name.charAt(0)}</div>}
                                <div>
                                   <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{result.name}</p>
                                   <p className={`text-xs line-clamp-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{result.desc}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     )}
                     {userSearchResults.length === 0 && postSearchResults.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No matching results</div>}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
             
             <AnimatePresence>
               {showNotificationCenter && (
                 <motion.div initial={{ opacity: 0, y: 10, x: -20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: 10, x: -20 }} onBlur={() => setTimeout(() => setShowNotificationCenter(false), 100)} className={`absolute top-full mt-2 right-0 w-80 rounded-2xl border shadow-xl overflow-hidden z-50 flex flex-col max-h-[500px] ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
                   <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
                     <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                     {notificationCenter.filter(n => !n.read).length > 0 && (
                       <button onClick={() => {
                         setNotificationCenter(prev => prev.map(n => ({ ...n, read: true })));
                       }} className={`text-xs font-semibold ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#FF003C]/80' : 'text-[#ff2a4b] hover:text-[#ff2a4b]/80'}`}>
                         Mark all read
                       </button>
                     )}
                   </div>
                   <div className="overflow-y-auto overflow-x-hidden hide-scrollbar flex-1">
                     {notificationCenter.length === 0 ? (
                       <div className="p-8 text-center">
                         <Bell className={`w-8 h-8 mx-auto mb-2 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}`} />
                         <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>No notifications yet</p>
                       </div>
                     ) : (
                       <div className="divide-y" style={{ borderColor: theme === 'dark' ? '#1f1f1f' : '#e5e7eb' }}>
                         {notificationCenter.map((notif) => (
                           <div key={notif.id} onClick={() => setNotificationCenter(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))} className={`p-4 cursor-pointer transition-colors ${notif.read ? (theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50') : (theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-blue-50')}`}>
                             <div className="flex items-start gap-3">
                               <div className="text-lg mt-0.5">{notif.icon}</div>
                               <div className="flex-1 min-w-0">
                                 <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{notif.user}</p>
                                 <p className={`text-xs line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{notif.message}</p>
                                 <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>{notif.timestamp}</p>
                               </div>
                               {!notif.read && <div className="w-2 h-2 rounded-full bg-[#FF003C] shrink-0 mt-2"></div>}
                             </div>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>
           <div className="flex items-center gap-3">
             <button onClick={() => setShowNotificationCenter(!showNotificationCenter)} className={`p-2 transition-colors relative ${theme === 'dark' ? 'text-gray-400 hover:text-[#FF003C]' : 'w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900'}`}>
               <Bell className="w-6 h-6" />
               {notificationCenter.filter(n => !n.read).length > 0 && (
                 <span className={`absolute top-1 right-1 w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`}>
                   {notificationCenter.filter(n => !n.read).length}
                 </span>
               )}
             </button>
           </div>
        </header>

        <div className={`p-5 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex gap-3 mb-4">
             <Link to="/profile" className="shrink-0">
               {currentUser?.avatar ? <img src={currentUser.avatar} alt="Me" className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#FF003C]" /> : <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${theme === 'dark' ? 'bg-[#1a1a1a] text-[#FF003C]' : 'bg-gray-100 text-gray-400'}`}>{currentUser?.name?.charAt(0).toUpperCase() || '?'}</div>}
             </Link>
             <div className={`flex-1 rounded-full px-4 py-2 flex items-center border transition-all ${theme === 'dark' ? 'bg-[#050505] border-[#1f1f1f] focus-within:border-[#FF003C]/50' : 'bg-gray-50 border-gray-200 focus-within:border-[#ff2a4b]/50'}`}>
                <input type="text" value={newPostText} onChange={(e) => setNewPostText(e.target.value.substring(0, MAX_CHARS))} placeholder="What's on your mind, developer?" className={`bg-transparent w-full focus:outline-none text-sm ${theme === 'dark' ? 'placeholder:text-gray-500 text-[#e0e0e0]' : 'placeholder:text-gray-500 text-gray-900'}`} />
             </div>
             <div className="flex items-center gap-3">
                 <span className={`text-[10px] md:text-xs font-bold ${newPostText.length >= MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}>{newPostText.length} / {MAX_CHARS}</span>
                 <button onClick={handleSharePost} disabled={!newPostText.trim() && newPostImages.length === 0} className={`px-6 py-2 transition-all ${newPostText.trim() || newPostImages.length > 0 ? (theme === 'dark' ? 'bg-[#FF003C] text-black rounded' : 'bg-[#ff2a4b] text-white rounded-full') : (theme === 'dark' ? 'bg-[#1f1f1f] text-gray-600 rounded' : 'bg-gray-100 text-gray-400 rounded-full')}`}>Share</button>
             </div>
          </div>
          <AnimatePresence>
            {activePostTool && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className={`mb-4 px-3 py-3 rounded-lg border flex items-center gap-3 ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-gray-50 border-gray-200'}`}>
                  {activePostTool === 'image' && (
                     <div className="w-full flex flex-col gap-2">
                       <div className="flex items-center gap-3">
                         <ImageIcon className="w-4 h-4 text-red-500" />
                         <input type="text" value={newPostImages[0] || ''} onChange={e => {setNewPostImages([e.target.value]);}} placeholder="Paste URL..." className="bg-transparent w-full focus:outline-none text-xs" />
                         <label onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} className="cursor-pointer bg-[#1f1f1f] text-white px-4 py-2 rounded-full text-xs">Upload<input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} className="hidden" /></label>
                       </div>
                       {newPostImages.length > 0 && <div className="flex flex-wrap gap-2 mt-2">{newPostImages.map((src, i) => <div key={i} className="relative w-16 h-16 rounded border overflow-hidden">{previewMedia(src)}</div>)}</div>}
                     </div>
                  )}
                  {activePostTool === 'repo' && <><LinkIcon className="w-4 h-4 text-orange-500" /><input type="text" value={newPostRepo} onChange={e => setNewPostRepo(e.target.value)} placeholder="Repo URL..." className="bg-transparent w-full focus:outline-none text-xs" /></>}
                  {activePostTool === 'demo' && <><Video className="w-4 h-4 text-pink-500" /><input type="text" value={newPostDemo} onChange={e => setNewPostDemo(e.target.value)} placeholder="Demo URL..." className="bg-transparent w-full focus:outline-none text-xs" /></>}
                  {activePostTool === 'tags' && <><Hash className="w-4 h-4 text-cyan-500" /><input type="text" value={newPostTags} onChange={e => setNewPostTags(e.target.value)} placeholder="Tags..." className="bg-transparent w-full focus:outline-none text-xs" /></>}
                  <button onClick={() => setActivePostTool(null)} className="ml-auto text-gray-500"><X className="w-4 h-4" /></button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap items-center gap-6 pt-3 border-t px-2 border-gray-100 dark:border-[#1f1f1f]">
             <button onClick={() => setActivePostTool('image')} className="flex items-center gap-2 text-xs font-semibold"><ImageIcon className="w-4 h-4 text-red-500" />Image/Video</button>
             <button onClick={() => setActivePostTool('repo')} className="flex items-center gap-2 text-xs font-semibold"><LinkIcon className="w-4 h-4 text-orange-500" />Repository</button>
             <button onClick={() => setActivePostTool('demo')} className="flex items-center gap-2 text-xs font-semibold"><Video className="w-4 h-4 text-pink-500" />Live Demo</button>
             <button onClick={() => setActivePostTool('tags')} className="flex items-center gap-2 text-xs font-semibold"><Hash className="w-4 h-4 text-cyan-500" />Tags</button>
          </div>
        </div>

        <div className={`flex items-center justify-between mb-6 pb-2 border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
           <div className="flex items-center gap-4">
               {['Latest', 'Trending', 'Following'].map(filter => <button key={filter} onClick={() => setFeedFilter(filter as any)} className={`font-semibold pb-2 border-b-2 ${feedFilter === filter ? (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : 'border-transparent text-gray-500'}`}>{filter}</button>)}
           </div>
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {visiblePosts.map(post => (
              <PostCard 
                key={post.id} 
                {...post} 
                theme={theme} 
                isFollowing={post.is_following} 
                toggleFollow={() => handleToggleFollow(post.user_id)} 
                onEdit={() => handleEditPost(post)} 
                onDelete={() => setPostToDelete(post.id)} 
              />
            ))}
          </AnimatePresence>
        </div>
      </main>

      <aside className={`hidden xl:flex flex-col w-80 shrink-0 border-l ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} px-6 py-6 sticky top-0 h-screen overflow-y-auto`}>
         <Link to="/messages" className={`font-bold mb-6 flex items-center gap-2 hover:text-[#FF003C] transition-colors ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
           Messages <MessageCircle className="w-4 h-4" />
         </Link>
         <div className="space-y-4 mb-10">
            {filteredSidebarChats.map((chat) => (
              <Link to="/messages" key={chat.id}>
                <ChatUser id={String(chat.id)} avatar={chat.avatar} name={chat.name} online={chat.online !== false} theme={theme} />
              </Link>
            ))}
         </div>
      </aside>

      <AnimatePresence>
        {postToDelete && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className={`w-full max-w-sm rounded-2xl p-6 text-center ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white shadow-xl'}`}><Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" /><h3 className="font-bold text-xl mb-6">Delete Post?</h3><div className="flex gap-3"><button onClick={() => setPostToDelete(null)} className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-900">Cancel</button><button onClick={confirmDeletePost} className="flex-1 py-2 rounded-xl bg-red-600 text-white">Delete</button></div></div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {editingPost && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"><div className={`w-full max-w-lg rounded-2xl p-6 ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white'}`}><h3 className="font-bold text-lg mb-4">Edit Post</h3><textarea value={editPostText} onChange={e => setEditPostText(e.target.value)} className="w-full bg-transparent border rounded p-3 mb-4" rows={5} /><div className="flex gap-3 justify-end"><button onClick={() => setEditingPost(null)} className="px-4 py-2">Cancel</button><button onClick={saveEditedPost} className="px-4 py-2 bg-[#FF003C] text-black rounded">Save</button></div></div></motion.div>}
      </AnimatePresence>

      <AnimatePresence>
        {showNewProjectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: 'spring', damping: 20, stiffness: 300 }} className={`w-full max-w-2xl rounded-2xl p-8 ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-200'} shadow-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add New Project</h2>
                <button onClick={() => setShowNewProjectModal(false)} className={`p-1 rounded transition-colors ${theme === 'dark' ? 'text-gray-500 hover:text-white hover:bg-[#1f1f1f]' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'}`}><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-5 mb-8 max-h-[calc(90vh-200px)] overflow-y-auto pr-2">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Title</label>
                  <input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} placeholder="Project Title" className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#FF003C] focus:ring-1 focus:ring-[#FF003C]/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:ring-1 focus:ring-[#ff2a4b]/30'}`} />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Description</label>
                  <textarea value={projectDescription} onChange={(e) => setProjectDescription(e.target.value)} placeholder="Brief description of the project" rows={4} className={`w-full px-4 py-3 rounded-lg border focus:outline-none resize-none transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#FF003C] focus:ring-1 focus:ring-[#FF003C]/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:ring-1 focus:ring-[#ff2a4b]/30'}`} />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>GitHub URL</label>
                  <input type="url" value={projectGithubUrl} onChange={(e) => setProjectGithubUrl(e.target.value)} placeholder="https://github.com/..." className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#FF003C] focus:ring-1 focus:ring-[#FF003C]/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:ring-1 focus:ring-[#ff2a4b]/30'}`} />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Project Image</label>
                  <label className={`flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-all ${projectImage ? (theme === 'dark' ? 'border-[#FF003C]/50 bg-[#FF003C]/5' : 'border-[#ff2a4b]/50 bg-[#ff2a4b]/5') : (theme === 'dark' ? 'border-[#1f1f1f] hover:border-[#FF003C]/50 bg-[#0a0a0a] hover:bg-[#0a0a0a]' : 'border-gray-300 hover:border-[#ff2a4b]/50 bg-gray-50 hover:bg-gray-100')}`}>
                    {projectImage ? (
                      <img src={projectImage} alt="Project" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="flex flex-col items-center justify-center">
                        <Github className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Click to upload or drag and drop</span>
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (event) => setProjectImage(event.target?.result as string);
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }} className="hidden" />
                  </label>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tags (comma separated)</label>
                  <input type="text" value={projectTags} onChange={(e) => setProjectTags(e.target.value)} placeholder="React, CSS, Node" className={`w-full px-4 py-3 rounded-lg border focus:outline-none transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f] text-white placeholder:text-gray-600 focus:border-[#FF003C] focus:ring-1 focus:ring-[#FF003C]/30' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:ring-1 focus:ring-[#ff2a4b]/30'}`} />
                </div>
              </div>

              <div className="flex gap-3 justify-end border-t pt-6" style={{ borderColor: theme === 'dark' ? '#1f1f1f' : '#e5e7eb' }}>
                <button onClick={() => setShowNewProjectModal(false)} className={`px-6 py-2 rounded-lg font-bold transition-colors ${theme === 'dark' ? 'border border-[#1f1f1f] text-gray-400 hover:text-white hover:bg-[#1f1f1f]' : 'border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>Cancel</button>
                <button onClick={() => {
                  // TODO: Send project data to backend
                  setShowNewProjectModal(false);
                  setProjectTitle('');
                  setProjectDescription('');
                  setProjectGithubUrl('');
                  setProjectImage(null);
                  setProjectTags('');
                }} className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${theme === 'dark' ? 'bg-[#FF003C] text-black hover:shadow-lg hover:shadow-[#FF003C]/50' : 'bg-[#ff2a4b] hover:shadow-lg hover:shadow-[#ff2a4b]/50'}`}>Add Project</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && notification.show && (
          <motion.div initial={{ opacity: 0, y: -20, x: -20 }} animate={{ opacity: 1, y: 0, x: 0 }} exit={{ opacity: 0, y: -20, x: -20 }} className={`fixed bottom-24 md:bottom-8 left-4 md:right-4 md:left-auto z-50 px-4 py-3 rounded-xl flex items-center gap-3 ${theme === 'dark' ? 'bg-[#121212] border border-[#FF003C] shadow-lg shadow-[#FF003C]/20' : 'bg-white border border-[#ff2a4b] shadow-lg shadow-[#ff2a4b]/20'}`}>
            <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`}></div>
            <span className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <MobileNav />
    </div>
  );
}

function PostCard({ id, user_id, avatar, name, time, desc, images, videoUrl, likes, comments, shares, repository, liveDemo, tags, isLiked, isSaved, theme, onEdit, onDelete, isOwn, isFollowing, toggleFollow }: any) {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(likes);
  const navigate = useNavigate();

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`p-5 rounded-2xl border transition-all ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] hover:border-[#FF003C]/30' : 'bg-white border-gray-100 shadow-sm hover:shadow-md'}`}>
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <Link to="/profile" state={{ viewUser: { id: user_id, name, avatar, isOwn } }} className="relative">
                {avatar ? <img src={avatar} alt="" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{name.charAt(0)}</div>}
             </Link>
             <div>
                <div className="flex items-center gap-2">
                   <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{name}</h4>
                   {!isOwn && <button onClick={toggleFollow} className="text-[10px] font-bold text-[#FF003C] uppercase tracking-widest hover:underline">{isFollowing ? 'Following' : '+ Follow'}</button>}
                </div>
                <p className="text-[10px] text-gray-500">{time}</p>
             </div>
          </div>
          <div className="flex items-center gap-2">
             {isOwn && <><button onClick={onEdit} className="p-2 text-gray-500 hover:text-white"><Edit3 className="w-4 h-4" /></button><button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></>}
          </div>
       </div>
       <p className={`text-sm mb-4 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{desc}</p>
       {images && images.length > 0 && <div className="rounded-xl overflow-hidden mb-4 border border-gray-100 dark:border-[#1f1f1f]"><img src={images[0]} alt="" className="w-full h-auto" /></div>}
       <div className="flex items-center gap-6">
          <button onClick={handleLike} className={`flex items-center gap-2 text-xs font-bold ${liked ? 'text-[#FF003C]' : 'text-gray-500'}`}><Heart className={`w-4 h-4 ${liked ? 'fill-[#FF003C]' : ''}`} /> {likeCount}</button>
          <button className="flex items-center gap-2 text-xs font-bold text-gray-500"><MessageCircle className="w-4 h-4" /> {comments}</button>
          {repository && <a href={repository} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-[#FF003C] ml-auto"><Github className="w-4 h-4" /> Repo</a>}
       </div>
    </motion.div>
  );
}

function NavItem({ icon: Icon, label, active, to, theme }: any) {
  return (
    <Link to={to} className={`w-full flex items-center gap-3 px-3 py-3 transition-colors ${active ? (theme === 'dark' ? 'bg-[#FF003C]/5 text-[#FF003C] border-r-2 border-[#FF003C] font-semibold rounded' : 'bg-[#1877F2] text-white font-semibold rounded-xl') : (theme === 'dark' ? 'text-gray-400 hover:text-white rounded' : 'text-gray-600 hover:bg-gray-100 rounded-xl')}`}>
      <Icon className="w-5 h-5" /><span className="text-sm">{label}</span>
    </Link>
  );
}

function ChatUser({ avatar, name, online, theme }: any) {
  return (
    <div className="flex items-center gap-3 group cursor-pointer">
       <div className="relative">
          {avatar ? <img src={avatar} alt="" className="w-10 h-10 rounded-full" /> : <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{name.charAt(0)}</div>}
          {online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-black rounded-full"></div>}
       </div>
       <div>
          <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-white group-hover:text-[#FF003C]' : 'text-gray-900 group-hover:text-[#ff2a4b]'} transition-colors`}>{name}</h4>
          <p className="text-[10px] text-gray-500">Active now</p>
       </div>
    </div>
  );
}

function EventItem({ date, title, subtitle, theme }: any) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] hover:bg-[#1a1a1a]' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}>
       <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-bold ${theme === 'dark' ? 'bg-[#FF003C] text-black' : 'bg-[#ff2a4b] text-white'}`}><span className="text-xs leading-none">MAY</span><span className="text-lg leading-none">{date}</span></div>
       <div><h4 className={`text-xs font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{title}</h4><p className="text-[10px] text-gray-500">{subtitle}</p></div>
    </div>
  );
}