import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Bookmark, Settings, MoreHorizontal, Heart, MessageCircle, Share2, PenSquare, Image as ImageIcon, Link as LinkIcon, Video, Hash, UserCircle2, Plus, X, ChevronLeft, ChevronRight, Camera, Play, Pause, Volume2, VolumeX, Eye, Trash2, UserPlus, UserMinus, Toast } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';
import { io } from 'socket.io-client';

import { DEFAULT_POSTS } from '../data/posts';

export default function FeedScreen() {
  const { theme, openSettings, currentUser } = useSettings();

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
  };

  const [feedPosts, setFeedPosts] = useState<FeedPostType[]>(DEFAULT_POSTS);
  
  // Custom WebSocket/Toast Notification State
  const [notification, setNotification] = useState<{ message: string; show: boolean } | null>(null);

  // --- Real-time updates ---
  useEffect(() => {
    // Initial fetch
    fetch("/api/posts")
      .then(res => res.json())
      .then(data => {
        if(Array.isArray(data) && data.length > 0) {
            setFeedPosts(data);
        }
      })
      .catch(err => console.error(err));

    // WebSocket connection
    const socket = io();
    
    socket.on("new_post", (post: FeedPostType) => {
      setFeedPosts((prev) => {
         // Prevent duplicate adding if current user created it (id could match)
         if (prev.some(p => p.id === post.id)) return prev;
         return [post, ...prev];
      });
      // Show notification if it's not our own post
      if (currentUser && post.name !== currentUser.name) {
        setNotification({ message: `New post from ${post.name}`, show: true });
        setTimeout(() => setNotification(null), 3000);
      }
    });

    socket.on("post_updated", (data: { id: string; action: string; likes?: number; comments?: number; }) => {
      setFeedPosts((prev) => 
        prev.map(p => {
          if (p.id === data.id) {
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

    return () => {
      socket.disconnect();
    };
  }, []);

  // --- Filtering & Search ---
  const [feedFilter, setFeedFilter] = useState<'Latest' | 'Trending' | 'Following'>('Latest');
  const [followingSort, setFollowingSort] = useState<'Latest' | 'Recent'>('Latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  
  // --- Follow logic ---
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('followingUsers') || '{}');
    } catch {
      return {};
    }
  });

  const toggleFollow = (name: string) => {
    setFollowingMap(prev => {
      const next = { ...prev, [name]: !prev[name] };
      localStorage.setItem('followingUsers', JSON.stringify(next));
      return next;
    });
  };

  // --- Create Post State ---
  const [newPostText, setNewPostText] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const MAX_CHARS = 500;
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [newPostRepo, setNewPostRepo] = useState('');
  const [newPostDemo, setNewPostDemo] = useState('');
  const [newPostTags, setNewPostTags] = useState('');
  const [activePostTool, setActivePostTool] = useState<'image' | 'repo' | 'demo' | 'tags' | null>(null);

  // --- Edit Post State ---
  const [editingPost, setEditingPost] = useState<FeedPostType | null>(null);
  const [editPostText, setEditPostText] = useState('');

  // --- Delete Post State ---
  const [postToDelete, setPostToDelete] = useState<string | null>(null);

  const handleSharePost = async () => {
    if (!newPostText.trim() && newPostImages.length === 0) return;

    let isVideo = false;
    let videoUrl = undefined;
    
    // Simplistic check for demo purposes
    if (newPostImages.length === 1 && newPostImages[0].match(/\.(mp4|webm|ogg)$/i)) {
      isVideo = true;
      videoUrl = newPostImages[0];
    }

    const newPost: Partial<FeedPostType> = {
      id: Date.now().toString(),
      avatar: currentUser?.avatar || "https://i.pravatar.cc/150?u=12", // Your avatar
      name: currentUser?.name || "Jakob Botosh",
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
        const res = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newPost)
        });
        if (res.ok) {
            // Reset form
            setNewPostText('');
            setNewPostImages([]);
            setUploadProgress(0);
            setNewPostRepo('');
            setNewPostDemo('');
            setNewPostTags('');
            setActivePostTool(null);
        }
    } catch (err) {
        console.error("Failed to post details", err);
    }
  };

  const simulateUpload = (files: FileList | File[]) => {
    setUploadProgress(0);
    
    // Add images locally
    const urls = Array.from(files).map(file => URL.createObjectURL(file));
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setNewPostImages(prevImgs => [...prevImgs, ...urls]);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      simulateUpload(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      simulateUpload(e.dataTransfer.files);
    }
  };

  const handleEditPost = (post: FeedPostType) => {
    setEditingPost(post);
    setEditPostText(post.desc);
  };

  const saveEditedPost = () => {
    if (editingPost) {
      setFeedPosts(prev => prev.map(p => 
        p.id === editingPost.id ? { ...p, desc: editPostText } : p
      ));
      setEditingPost(null);
    }
  };

  const confirmDeletePost = () => {
    if (postToDelete) {
      setFeedPosts(prev => prev.filter(p => p.id !== postToDelete));
      setPostToDelete(null);
    }
  };

  // Filter and sort feed based on search, tabs and follow status
  const searchResults = feedPosts.filter(post => {
    if (!searchQuery.trim()) return false;
    const lowerQuery = searchQuery.toLowerCase();
    const matchesName = post.name.toLowerCase().includes(lowerQuery);
    const matchesDesc = post.desc.toLowerCase().includes(lowerQuery);
    const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
    return matchesName || matchesDesc || matchesTags;
  });

  const suggestedUsers = searchResults
    .map(p => ({ name: p.name, avatar: p.avatar }))
    .filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i)
    .slice(0, 4);

  const visiblePosts = feedPosts.filter(post => {
    if (searchQuery.trim() && !showSearchDropdown) {
       const lowerQuery = searchQuery.toLowerCase();
       const matchesName = post.name.toLowerCase().includes(lowerQuery);
       const matchesDesc = post.desc.toLowerCase().includes(lowerQuery);
       const matchesTags = post.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));
       if (!matchesName && !matchesDesc && !matchesTags) {
         return false;
       }
    }
    if (feedFilter === 'Following') {
      return post.isOwn || followingMap[post.name];
    }
    return true;
  }).sort((a, b) => {
    if (feedFilter === 'Trending') {
      return b.likes - a.likes; // sort by likes
    }
    if (feedFilter === 'Following' && followingSort === 'Recent') {
      return (b.comments + b.likes + b.shares) - (a.comments + a.likes + a.shares);
    }
    return 0; // maintain original or 'Latest' order which is chronologically newest first
  });

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      {/* MOBILE HEADER */}
      <header className={`md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b backdrop-blur-lg ${
        theme === 'dark' ? 'bg-[#0a0a0a]/80 border-[#1f1f1f]' : 'bg-white/80 border-gray-200'
      }`}>
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

      {/* LEFT SIDEBAR (Hide on small screens) */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 overflow-y-auto sticky top-0 h-screen`}>
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-2 mb-8">
           <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C] shadow-[0_0_15px_rgba(255,0,60,0.6)]' : 'bg-[#ff2a4b] border border-red-200'}`}>
              <span className={`font-black text-xl italic ${theme === 'dark' ? 'text-black' : 'text-white'}`}>D</span>
           </div>
           <h2 className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>DEV<span className="text-[#FF003C]">CONNECT</span></h2>
        </div>

        {/* Profile Summary Widget */}
        <Link to="/profile" className={`block mb-8 p-4 rounded-xl border transition-colors cursor-pointer ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#121212] hover:border-[#FF003C]/50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}>
           <div className="flex items-center gap-3 mb-4">
              <img src="https://i.pravatar.cc/150?u=12" alt="Avatar" className={`w-12 h-12 rounded-full border-2 ${theme === 'dark' ? 'border-[#FF003C]' : 'border-[#ff2a4b]'}`} />
              <div>
                <h3 className={`font-semibold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{currentUser?.name || 'Loading...'} <span className="text-[#FF003C] ml-1">✓</span></h3>
                <p className={`text-xs ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>@{currentUser?.handle || '...'}</p>
              </div>
           </div>
           <div className="flex justify-between mt-2">
             <div className="text-center">
               <div className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>2.3k</div>
               <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Follower</div>
             </div>
             <div className="text-center">
               <div className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>235</div>
               <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Following</div>
             </div>
             <div className="text-center">
               <div className={`font-bold text-sm ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>80</div>
               <div className={`text-[10px] uppercase ${theme === 'dark' ? 'text-zinc-500' : 'text-gray-500'}`}>Post</div>
             </div>
           </div>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-4 mt-2 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Navigation</p>
          <NavItem icon={PenSquare} label="Feed" active to="/feed" theme={theme} />
          <NavItem icon={UserCircle2} label="Profile" to="/profile" theme={theme} />
          <NavItem icon={Bookmark} label="Saved" to="/saved" theme={theme} />
          <NavItem icon={MessageCircle} label="Messages" to="/messages" theme={theme} />
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

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
        {/* Top Header (Desktop) */}
        <header className="hidden md:flex items-center justify-between mb-8 gap-4">
           {/* Mobile menu stub */}
           <div className="flex items-center gap-3 md:hidden">
            <div className="w-8 h-8 rounded bg-[#ff2a4b] shrink-0"></div>
           </div>

           {/* Search */}
           <div className={`relative flex-1 max-w-xl`}>
             <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] text-gray-300' : 'bg-white border-gray-200 text-gray-900'}`}>
                <Search className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => {
                     setSearchQuery(e.target.value);
                     setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  placeholder="Search for developers or posts..." 
                  className="bg-transparent border-none focus:outline-none w-full text-sm placeholder:text-gray-500" 
                />
             </div>
             
             {/* Search Results Dropdown */}
             <AnimatePresence>
               {showSearchDropdown && searchQuery.trim() && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 10 }}
                   className={`absolute top-full mt-2 left-0 right-0 rounded-2xl border shadow-xl overflow-hidden z-50 flex flex-col max-h-[400px] ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}
                 >
                   <div className="overflow-y-auto overflow-x-hidden hide-scrollbar py-2">
                     {suggestedUsers.length > 0 && (
                        <div className="px-4 py-2">
                           <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Developers</h4>
                           <div className="flex gap-3 overflow-x-auto hide-scrollbar">
                              {suggestedUsers.map((user, idx) => (
                                <Link to="/profile" state={{ viewUser: { name: user.name, avatar: user.avatar } }} key={idx} className="flex flex-col items-center gap-1 min-w-[60px]" onClick={() => setShowSearchDropdown(false)}>
                                  <img src={user.avatar} className="w-12 h-12 rounded-full object-cover border border-gray-200" alt={user.name} />
                                  <span className={`text-[10px] text-center w-full truncate ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{user.name}</span>
                                </Link>
                              ))}
                           </div>
                        </div>
                     )}

                     {searchResults.length > 0 ? (
                        <div className="px-2 mt-2">
                           <h4 className={`text-xs font-bold uppercase tracking-wider px-2 mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Posts</h4>
                           {searchResults.slice(0, 5).map(result => (
                             <div key={result.id} className={`p-2 rounded-xl flex gap-3 cursor-pointer mb-1 ${theme === 'dark' ? 'hover:bg-[#1f1f1f]' : 'hover:bg-gray-50'}`} onClick={() => { setSearchQuery(result.desc); setShowSearchDropdown(false); }}>
                                <img src={result.avatar} className="w-8 h-8 rounded-full" alt={result.name} />
                                <div>
                                   <p className={`text-sm font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{result.name}</p>
                                   <p className={`text-xs line-clamp-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{result.desc}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     ) : (
                        <div className="p-8 text-center text-sm text-gray-500">No matching results</div>
                     )}
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </div>

           {/* Quick Actions */}
           <div className="flex items-center gap-3">
             <button className={`p-2 transition-colors relative ${theme === 'dark' ? 'text-gray-400 hover:text-[#FF003C] rounded' : 'w-10 h-10 border border-gray-200 bg-white hover:bg-gray-50 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900'}`}>
               <Bell className="w-6 h-6" />
               <span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b] border-2 border-white'}`}></span>
             </button>
             <button className={`${theme === 'dark' ? 'bg-[#FF003C] text-black px-4 py-2 rounded text-xs font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,0,60,0.3)]' : 'h-10 px-4 rounded-full border border-gray-200 bg-[#ff2a4b] text-white flex items-center justify-center transition-colors hover:bg-red-600'}`}>
               New Project
             </button>
           </div>
        </header>

        {/* Create Post Field */}
        <div className={`p-5 rounded-xl border mb-6 ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-200 shadow-sm'}`}>
          <div className="flex gap-3 mb-4">
             <Link to="/profile" className="shrink-0">
               <img src="https://i.pravatar.cc/150?u=12" alt="Me" className="w-10 h-10 rounded-full hover:ring-2 hover:ring-[#FF003C] transition-all" />
             </Link>
             <div className={`flex-1 rounded-full px-4 py-2 flex items-center border transition-all ${theme === 'dark' ? 'bg-[#050505] border-[#1f1f1f] focus-within:border-[#FF003C]/50' : 'bg-gray-50 border-gray-200 focus-within:border-[#ff2a4b]/50'}`}>
                <input 
                  type="text" 
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value.substring(0, MAX_CHARS))}
                  placeholder="What's on your mind, developer?" 
                  className={`bg-transparent w-full focus:outline-none text-sm ${theme === 'dark' ? 'placeholder:text-gray-500 text-[#e0e0e0]' : 'placeholder:text-gray-500 text-gray-900'}`} 
                />
             </div>
             <div className="flex items-center gap-3">
                 <span className={`text-[10px] md:text-xs font-bold ${newPostText.length >= MAX_CHARS ? 'text-red-500' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-400')}`}>
                   {newPostText.length} / {MAX_CHARS}
                 </span>
                 <button 
                   onClick={handleSharePost}
                   disabled={!newPostText.trim() && newPostImages.length === 0}
                   className={`px-6 py-2 shrink-0 transition-all ${newPostText.trim() || newPostImages.length > 0 ? (theme === 'dark' ? 'bg-[#FF003C] hover:bg-[#d40031] text-black shadow-[0_0_15px_rgba(255,0,60,0.3)] rounded uppercase tracking-widest text-xs font-black' : 'bg-[#ff2a4b] hover:bg-red-600 text-white rounded-full font-medium text-sm') : (theme === 'dark' ? 'bg-[#1f1f1f] text-gray-600 rounded uppercase tracking-widest text-xs font-black cursor-not-allowed' : 'bg-gray-100 text-gray-400 rounded-full font-medium text-sm cursor-not-allowed')}`}
                 >
                   Share Post
                 </button>
             </div>
          </div>
          
          <AnimatePresence>
            {activePostTool && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={`mb-4 px-3 py-3 rounded-lg border flex items-center gap-3 ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-gray-50 border-gray-200'}`}>
                  {activePostTool === 'image' && (
                     <div className="w-full flex flex-col gap-2">
                       <div className="flex items-center gap-3">
                         <ImageIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-red-500' : 'text-red-500'}`} />
                         <input type="text" value={newPostImages[0] || ''} onChange={e => {setNewPostImages([e.target.value]); setUploadProgress(0);}} placeholder="Paste image/video URL..." className={`bg-transparent w-full focus:outline-none text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                         
                         <div className="mx-2 text-xs font-bold opacity-50 shrink-0">OR</div>
                         <label 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`cursor-pointer shrink-0 rounded-full px-4 py-2 font-bold text-xs transition-colors border-2 ${isDragging ? (theme === 'dark' ? 'border-[#FF003C] bg-[#FF003C]/10 text-white' : 'border-[#ff2a4b] bg-red-50 text-red-600') : (theme === 'dark' ? 'border-transparent bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white' : 'border-transparent bg-gray-200 hover:bg-gray-300 text-gray-900')}`}>
                            {isDragging ? 'Drop Here' : 'Upload Files'}
                            <input 
                              type="file" 
                              multiple
                              accept="image/*,video/*"
                              onChange={handleFileUpload}
                              className="hidden" 
                            />
                         </label>
                       </div>
                       {newPostImages.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                             {newPostImages.map((src, i) => (
                               <div key={i} className="relative w-16 h-16 rounded border overflow-hidden opacity-100">
                                 <img src={src} className="w-full h-full object-cover" />
                               </div>
                             ))}
                          </div>
                       )}
                       {uploadProgress > 0 && uploadProgress < 100 && (
                         <div className="h-1 bg-[#FF003C] transition-all rounded mt-1" style={{ width: `${uploadProgress}%` }}></div>
                       )}
                     </div>
                  )}
                  {activePostTool === 'repo' && (
                    <>
                      <LinkIcon className={`w-4 h-4 ${theme === 'dark' ? 'text-orange-500' : 'text-orange-500'}`} />
                      <input type="text" value={newPostRepo} onChange={e => setNewPostRepo(e.target.value)} placeholder="Paste repository URL (e.g., github.com/...)" className={`bg-transparent w-full focus:outline-none text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                    </>
                  )}
                  {activePostTool === 'demo' && (
                    <>
                      <Video className={`w-4 h-4 ${theme === 'dark' ? 'text-pink-500' : 'text-pink-500'}`} />
                      <input type="text" value={newPostDemo} onChange={e => setNewPostDemo(e.target.value)} placeholder="Paste live demo URL..." className={`bg-transparent w-full focus:outline-none text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                    </>
                  )}
                  {activePostTool === 'tags' && (
                    <>
                      <Hash className={`w-4 h-4 ${theme === 'dark' ? 'text-cyan-500' : 'text-cyan-500'}`} />
                      <input type="text" value={newPostTags} onChange={e => setNewPostTags(e.target.value)} placeholder="Add tags separated by commas..." className={`bg-transparent w-full focus:outline-none text-xs ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
                    </>
                  )}
                  <button onClick={() => setActivePostTool(null)} className={`ml-auto ${theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
                     <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`flex flex-wrap items-center gap-6 pt-3 border-t px-2 ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100'}`}>
             <button onClick={() => setActivePostTool(activePostTool === 'image' ? null : 'image')} className={`flex items-center gap-2 text-xs font-semibold ${activePostTool === 'image' ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}>
               <ImageIcon className="w-4 h-4 text-red-500" />
               Image/Video
             </button>
             <button onClick={() => setActivePostTool(activePostTool === 'repo' ? null : 'repo')} className={`flex items-center gap-2 text-xs font-semibold ${activePostTool === 'repo' ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}>
               <LinkIcon className="w-4 h-4 text-orange-500" />
               Repository
             </button>
             <button onClick={() => setActivePostTool(activePostTool === 'demo' ? null : 'demo')} className={`flex items-center gap-2 text-xs font-semibold ${activePostTool === 'demo' ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}>
               <Video className="w-4 h-4 text-pink-500" />
               Live Demo
             </button>
             <button onClick={() => setActivePostTool(activePostTool === 'tags' ? null : 'tags')} className={`flex items-center gap-2 text-xs font-semibold ${activePostTool === 'tags' ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-zinc-300 hover:text-white' : 'text-gray-600 hover:text-gray-900')}`}>
               <Hash className="w-4 h-4 text-cyan-500" />
               Tags
             </button>
          </div>
        </div>

        {/* Feed Posts */}
        <div className={`flex items-center justify-between mb-6 pb-2 border-b overflow-x-auto scrollbar-hide ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
           <div className="flex items-center gap-4">
               {['Latest', 'Trending', 'Following'].map(filter => (
                  <button 
                     key={filter}
                     onClick={() => setFeedFilter(filter as any)}
                     className={`font-semibold pb-2 border-b-2 whitespace-nowrap transition-colors ${feedFilter === filter ? (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                     {filter}
                  </button>
               ))}
           </div>
           {feedFilter === 'Following' && (
              <div className="flex items-center gap-2 text-xs mb-2">
                 <span className={theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}>Sort by:</span>
                 <select 
                    value={followingSort} 
                    onChange={e => setFollowingSort(e.target.value as any)}
                    className={`bg-transparent font-medium focus:outline-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
                 >
                    <option value="Latest" className={theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}>Latest</option>
                    <option value="Recent" className={theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-white'}>Most Recent Activity</option>
                 </select>
              </div>
           )}
        </div>

        <div className="space-y-6">
          <AnimatePresence>
            {visiblePosts.map(post => (
               <PostCard 
                  key={post.id}
                  id={post.id}
                  theme={theme}
                  avatar={post.avatar}
                  name={post.name}
                  isOwn={post.isOwn}
                   isFollowing={followingMap[post.name]}
                   toggleFollow={() => toggleFollow(post.name)}
                  time={post.time}
                  desc={post.desc}
                  images={post.images}
                  videoUrl={post.videoUrl}
                  likes={post.likes}
                  comments={post.comments}
                  shares={post.shares}
                  repository={post.repository}
                  liveDemo={post.liveDemo}
                  tags={post.tags}
                  onEdit={() => handleEditPost(post)}
                  onDelete={() => setPostToDelete(post.id)}
               />
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* RIGHT SIDEBAR (Chat/Activity) - Hidden on mobile and small tablets */}
      <aside className={`hidden xl:flex flex-col w-80 shrink-0 border-l ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} px-6 py-6 sticky top-0 h-screen overflow-y-auto`}>
         <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold ${theme === 'dark' ? 'text-[#e0e0e0]' : 'text-gray-900'}`}>Messages</h3>
            <button className={`${theme === 'dark' ? 'text-gray-400 hover:text-[#FF003C]' : 'text-gray-500 hover:text-gray-900'}`}><PenSquare className="w-5 h-5"/></button>
         </div>

         {/* Chat Search */}
         <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border mb-6 ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-gray-50 border-gray-200'}`}>
            <Search className={`w-4 h-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
            <input type="text" placeholder="Search..." className={`bg-transparent border-none focus:outline-none w-full text-xs ${theme === 'dark' ? 'placeholder:text-gray-500 text-[#e0e0e0]' : 'placeholder:text-gray-400 text-gray-900'}`} />
         </div>

         {/* Chat Tabs */}
         <div className={`flex gap-4 mb-4 text-sm font-medium border-b pb-2 ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100'}`}>
            <button className={`border-b-2 pb-2 px-1 ${theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900'}`}>Primary</button>
            <button className={`pb-2 px-1 ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>General</button>
            <button className={`pb-2 px-1 ${theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]'} ml-auto`}>Requests(4)</button>
         </div>

         {/* Chat List */}
         <div className="space-y-4 mb-10">
            <ChatUser avatar="https://i.pravatar.cc/150?u=51" name="Roger Korsgaard" online theme={theme} />
            <ChatUser avatar="https://i.pravatar.cc/150?u=52" name="Terry Torff" online theme={theme} />
            <ChatUser avatar="https://i.pravatar.cc/150?u=53" name="Angel Bergson" online={false} theme={theme} />
            <ChatUser avatar="https://i.pravatar.cc/150?u=54" name="Emerson Gouse" online theme={theme} />
            <ChatUser avatar="https://i.pravatar.cc/150?u=55" name="Zain Culhane" online theme={theme} />
         </div>

        {/* Events Widget */}
         <div className="mb-4 flex items-center justify-between">
           <h3 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Events</h3>
           <button className={`${theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}><MoreHorizontal className="w-5 h-5"/></button>
         </div>
         
         <div className="space-y-4">
           <EventItem date="10" title="Events Invites" subtitle="You have 3 pending" theme={theme} />
           <EventItem date="14" title="React Meetup" subtitle="San Francisco, CA" theme={theme} />
         </div>
      </aside>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
             <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col items-center text-center ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-100'}`}
             >
                <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center ${theme === 'dark' ? 'bg-red-500/20 text-red-500' : 'bg-red-100 text-red-600'}`}>
                   <Trash2 className="w-6 h-6" />
                </div>
                <h3 className={`font-bold text-xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Delete Post?</h3>
                <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>This action cannot be undone. The post will be permanently removed.</p>
                <div className="flex gap-3 w-full">
                   <button 
                      onClick={() => setPostToDelete(null)}
                      className={`flex-1 py-2.5 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-[#1f1f1f] hover:bg-[#2a2a2a] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                   >
                      Cancel
                   </button>
                   <button 
                      onClick={confirmDeletePost}
                      className={`flex-1 py-2.5 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-[#FF003C] text-black hover:bg-[#cc0030]' : 'bg-red-600 text-white hover:bg-red-700'}`}
                   >
                      Delete
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Post Modal */}
      <AnimatePresence>
        {editingPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
             <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-100'}`}
             >
                <div className={`p-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100'}`}>
                   <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Edit Post</h3>
                   <button onClick={() => setEditingPost(null)} className={`p-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                      <X className="w-5 h-5" />
                   </button>
                </div>
                
                <div className="p-4">
                   <div className={`w-full mb-4 p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#2a2a2a]' : 'bg-gray-50 border-gray-200'}`}>
                      <textarea 
                        value={editPostText}
                        onChange={(e) => setEditPostText(e.target.value)}
                        placeholder="Update your content..."
                        className={`w-full bg-transparent border-none focus:outline-none resize-none font-medium min-h-[120px] ${theme === 'dark' ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
                      />
                   </div>

                   <button 
                      onClick={saveEditedPost}
                      className={`w-full py-3 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-[#FF003C] text-black shadow-[0_0_15px_rgba(255,0,60,0.3)] hover:bg-[#cc0030]' : 'bg-[#ff2a4b] text-white hover:bg-red-600'}`}
                   >
                      Save Changes
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notification && notification.show && (
           <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-50 border ${theme === 'dark' ? 'bg-[#1f1f1f] border-[#2a2a2a] text-white' : 'bg-white border-gray-200 text-gray-900'}`}
           >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C]/20' : 'bg-[#ff2a4b]/20'}`}>
                <Bell className={`w-4 h-4 ${theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]'}`} />
              </div>
              <span className="font-semibold text-sm">{notification.message}</span>
           </motion.div>
        )}
      </AnimatePresence>
      <MobileNav />
    </div>
  );
}

// Subcomponents

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


function PostCard({ id, avatar, name, isFollowing, toggleFollow, isOwn, time, desc, images, videoUrl, likes, comments, shares, theme, repository, liveDemo, tags, onEdit, onDelete }: any) {
  const { currentUser } = useSettings();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [showOptions, setShowOptions] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postComments, setPostComments] = useState<any[]>([]);
  const [postCommentsCount, setPostCommentsCount] = useState(comments);
  const [loadingComments, setLoadingComments] = useState(false);
  
  useEffect(() => { setLikeCount(likes); }, [likes]);
  useEffect(() => { setPostCommentsCount(comments); }, [comments]);

  const fetchComments = async () => {
     if (showComments && postComments.length === 0 && postCommentsCount > 0) {
        setLoadingComments(true);
        try {
            const res = await fetch(`/api/posts/${id}/comments`);
            const data = await res.json();
            setPostComments(data);
        } catch (e) {
            console.error("Failed to load comments", e);
        } finally {
            setLoadingComments(false);
        }
     }
  };
  
  useEffect(() => {
      fetchComments();
  }, [showComments]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    // Optimistic UI updates
    const tempId = `comment-${Date.now()}`;
    const comment = {
      id: tempId,
      postId: id,
      name: currentUser?.name || 'Jakob Botosh',
      avatar: currentUser?.avatar || 'https://i.pravatar.cc/150?u=12', // Currently logged in user avatar
      text: newComment,
      likes: 0,
      time: "Just now",
      isLiked: false
    };
    
    setPostComments(prev => [comment, ...prev]);
    setPostCommentsCount(prev => prev + 1);
    setNewComment('');
    
    try {
        const res = await fetch(`/api/posts/${id}/comments`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(comment) 
        });
        const data = await res.json();
        // Update temp ID with real ID if necessary, but here our payload was sent as ID
    } catch (e) {
        console.error(e);
        // Maybe revert optimistic update here
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    const commentIndex = postComments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    const comment = postComments[commentIndex];
    const nextLiked = !comment.isLiked;
    
    setPostComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return {
          ...c,
          isLiked: nextLiked,
          likes: nextLiked ? c.likes + 1 : c.likes - 1
        };
      }
      return c;
    }));
    
    try {
        await fetch(`/api/comments/${commentId}/${nextLiked ? 'like' : 'unlike'}`, { method: 'POST' });
    } catch (e) {
        console.error(e);
        // revert optimistic
        setPostComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return {
              ...c,
              isLiked: !nextLiked,
              likes: !nextLiked ? c.likes + 1 : c.likes - 1
            };
          }
          return c;
        }));
    }
  };

  const [isSaved, setIsSaved] = useState(() => {
    const saved = localStorage.getItem('savedPosts');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        return arr.includes(id);
      } catch (e) {}
    }
    return false;
  });

  const toggleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikeCount(prev => nextLiked ? prev + 1 : prev - 1);
    
    try {
        await fetch(`/api/posts/${id}/${nextLiked ? 'like' : 'unlike'}`, { method: 'POST' });
    } catch (e) {
        console.error(e);
        setIsLiked(!nextLiked);
        setLikeCount(prev => nextLiked ? prev - 1 : prev + 1);
    }
  };

  const toggleSave = () => {
    const newState = !isSaved;
    setIsSaved(newState);
    const savedInfo = localStorage.getItem('savedPosts');
    let arr = [];
    if (savedInfo) {
       try { arr = JSON.parse(savedInfo); } catch(e) {}
    }
    if (newState) {
       arr.push(id);
    } else {
       arr = arr.filter((i: string) => i !== id);
    }
    localStorage.setItem('savedPosts', JSON.stringify(arr));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      viewport={{ once: true }}
      className={`overflow-hidden transition-all ${theme === 'dark' ? 'bg-[#0f0f0f] border border-[#1f1f1f] rounded-xl group hover:border-[#FF003C]/30' : 'p-0 md:p-0 rounded-2xl border bg-white border-gray-200 shadow-sm'}`}
    >
       <div className={theme === 'dark' ? 'p-5' : 'p-4'}>
           {/* Header */}
           <div className="flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
               <div className="relative">
                 <Link to="/profile" state={{ viewUser: { name, avatar, isOwn } }}>
                   <img src={avatar} className="w-10 h-10 rounded-full border border-gray-100 dark:border-[#1f1f1f] hover:ring-2 hover:ring-[#FF003C] transition-all" />
                 </Link>
                 <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#0f0f0f] rounded-full"></div>
               </div>
               <div className="flex flex-col">
                 <div className="flex items-center gap-2">
                   <Link to="/profile" state={{ viewUser: { name, avatar, isOwn } }} className={`font-bold text-sm hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-900 group-hover:text-[#ff2a4b] transition-colors'}`}>{name}</Link>
                   {!isOwn && (
                     <>
                      <span className="text-gray-400 text-xs">•</span>
                      <button 
                        onClick={toggleFollow} 
                        className={`text-xs font-bold transition-colors ${isFollowing ? (theme === 'dark' ? 'text-gray-500 hover:text-red-400' : 'text-gray-500 hover:text-red-500') : (theme === 'dark' ? 'text-[#FF003C] hover:text-[#ff4d79]' : 'text-blue-600 hover:text-blue-800')}`}
                      >
                         {isFollowing ? 'Following' : 'Follow'}
                      </button>
                     </>
                   )}
                 </div>
                 <div className="flex items-center gap-1.5">
                   <p className={`text-[10px] uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400 font-bold'}`}>{time}</p>
                   <span className="text-gray-400">•</span>
                   <Eye className="w-3 h-3 text-gray-400" />
                 </div>
               </div>
             </div>
             
             <div className="relative">
               <button 
                 onClick={() => setShowOptions(!showOptions)}
                 className={`${theme === 'dark' ? 'text-gray-500 hover:text-[#FF003C]' : 'text-gray-400 hover:text-gray-800'} p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-all`}
               >
                 <MoreHorizontal className="w-5 h-5"/>
               </button>
               <AnimatePresence>
                 {showOptions && (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.95 }}
                     className={`absolute right-0 mt-2 w-48 rounded-xl shadow-lg border z-20 ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-100'}`}
                   >
                     <div className="p-1">
                       {isOwn && (
                         <>
                           <button 
                             onClick={() => { setShowOptions(false); onEdit?.(); }}
                             className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-[#1f1f1f]' : 'text-gray-800 hover:bg-gray-100'}`}
                           >
                             <PenSquare className="w-4 h-4" /> Edit Post
                           </button>
                           <button 
                             onClick={() => { setShowOptions(false); onDelete?.(); }}
                             className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/10' : 'text-red-600 hover:bg-red-50'}`}
                           >
                             <Trash2 className="w-4 h-4" /> Delete Post
                           </button>
                         </>
                       )}
                       {!isOwn && (
                         <button 
                           onClick={() => { setShowOptions(false); toggleFollow?.(); }}
                           className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-[#1f1f1f]' : 'text-gray-800 hover:bg-gray-100'}`}
                         >
                           {isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                           {isFollowing ? 'Unfollow' : 'Follow'} {name}
                         </button>
                       )}
                       <button className={`w-full text-left px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-2 ${theme === 'dark' ? 'text-white hover:bg-[#1f1f1f]' : 'text-gray-800 hover:bg-gray-100'}`}>
                         Report
                       </button>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           </div>
           
           {/* Content */}
           <p className={`text-sm mb-4 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{desc}</p>
           
           {/* Post Meta Data (Tags, Repo, Demo) */}
           {(tags?.length > 0 || repository || liveDemo) && (
              <div className="flex flex-wrap gap-2 mb-4">
                 {tags?.map((tag: string, i: number) => (
                    <span key={i} className={`text-xs px-2 py-1 rounded-md ${theme === 'dark' ? 'bg-[#1a1a1a] text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                      #{tag}
                    </span>
                 ))}
                 {repository && (
                    <a href={repository.startsWith('http') ? repository : `https://${repository}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] text-orange-400 hover:bg-[#222]' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                      <LinkIcon className="w-3 h-3" /> Repo
                    </a>
                 )}
                 {liveDemo && (
                    <a href={liveDemo.startsWith('http') ? liveDemo : `https://${liveDemo}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1 text-xs px-2 py-1 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] text-pink-400 hover:bg-[#222]' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
                      <Video className="w-3 h-3" /> Live Demo
                    </a>
                 )}
              </div>
           )}

           {/* Video */}
           {videoUrl && (
             <div className={`mb-4 rounded-xl overflow-hidden bg-black flex items-center justify-center`}>
                 <video 
                   src={videoUrl} 
                   controls 
                   className={`w-full h-auto max-h-[70vh] object-contain`} 
                 />
             </div>
           )}

           {/* Images Grid */}
           {images && images.length > 0 && (
             <div className={`grid gap-1 mb-4 rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100 shadow-inner'} ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
               {images.map((img: string, i: number) => (
                 <motion.img 
                   whileHover={{ scale: 1.02 }}
                   key={i} 
                   src={img} 
                   className={`w-full h-56 md:h-80 object-cover cursor-pointer transition-transform duration-500`} 
                 />
               ))}
             </div>
           )}

           {/* Actions */}
           <div className={`flex items-center gap-6 pt-4 border-t text-sm font-medium ${theme === 'dark' ? 'border-[#1f1f1f] text-gray-400' : 'border-gray-50 pt-3 text-gray-500'}`}>
             <button 
                onClick={toggleLike}
                className={`flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${isLiked ? 'text-[#FF003C]' : ''}`}
             >
               <motion.div
                  animate={isLiked ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
               >
                 <Heart className={`w-5 h-5 transition-colors ${isLiked ? 'fill-current text-[#FF003C]' : ''}`} /> 
               </motion.div>
               <span className="tabular-nums font-bold">{likeCount}</span>
             </button>
             <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-blue-600'} ${showComments ? (theme === 'dark' ? 'text-white' : 'text-blue-600') : ''}`}
             >
               <MessageCircle className="w-5 h-5" /> 
               <span className="tabular-nums font-bold">{postCommentsCount}</span>
             </button>
             <div className="relative">
               <button 
                 onClick={() => setShowShareOptions(!showShareOptions)}
                 className={`flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-blue-600'} ${showShareOptions ? (theme === 'dark' ? 'text-white' : 'text-blue-600') : ''}`}
               >
                 <Share2 className="w-5 h-5" />
               </button>
               <AnimatePresence>
                 {showShareOptions && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className={`absolute left-0 bottom-full mb-2 w-48 rounded-xl shadow-lg border z-20 overflow-hidden ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-100'}`}
                   >
                     <ul className="py-2">
                       <li>
                         <button onClick={() => { setShowShareOptions(false); alert('Post shared to Feed!'); }} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                           <PenSquare className="w-4 h-4" /> <span className="text-sm font-medium">Repost to Feed</span>
                         </button>
                       </li>
                       <li>
                         <button onClick={() => { setShowShareOptions(false); alert('Post sent in message!'); }} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                           <MessageCircle className="w-4 h-4" /> <span className="text-sm font-medium">Send in Message</span>
                         </button>
                       </li>
                       <li>
                         <button onClick={() => { navigator.clipboard.writeText(window.location.origin + '/post/' + id); setShowShareOptions(false); alert('Link copied to clipboard!'); }} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                           <LinkIcon className="w-4 h-4" /> <span className="text-sm font-medium">Copy Link</span>
                         </button>
                       </li>
                     </ul>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
             <div className="ml-auto flex items-center gap-2">
               <button 
                 onClick={toggleSave}
                 className={`transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${isSaved ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-500') : (theme === 'dark' ? 'hover:text-[#FF003C]' : 'hover:text-gray-900')}`}>
                 <Bookmark className={`w-5 h-5 transition-colors ${isSaved ? 'fill-current text-blue-500' : ''}`} />
               </button>
               <button 
                 onClick={() => navigate('/post/' + id, { state: { post: { id, avatar, name, isOwn, time, desc, images, videoUrl, likes, comments, shares, repository, liveDemo, tags } } })}
                 className={`transition-all p-2 rounded-lg font-bold text-xs uppercase tracking-wider ${theme === 'dark' ? 'bg-[#FF003C]/10 text-[#FF003C] hover:bg-[#FF003C]/20' : 'bg-red-50 text-[#ff2a4b] hover:bg-red-100'}`}
               >
                 View Post
               </button>
             </div>
           </div>

            {/* Comments Section */}
            {showComments && (
              <motion.div 
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: 'auto' }}
                 exit={{ opacity: 0, height: 0 }}
                 className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100'}`}
              >
                {/* Comment Input */}
                <div className="flex gap-3 mb-6">
                  <img src="https://i.pravatar.cc/150?u=12" alt="Me" className="w-8 h-8 rounded-full shrink-0 border border-gray-200 dark:border-[#1f1f1f]" />
                  <div className={`flex flex-1 rounded-3xl items-center border overflow-hidden ${theme === 'dark' ? 'bg-[#050505] border-[#1f1f1f] focus-within:border-[#FF003C]/50' : 'bg-gray-50 border-gray-200 focus-within:border-[#ff2a4b]/50'}`}>
                    <input 
                       type="text" 
                       value={newComment}
                       onChange={(e) => setNewComment(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                       placeholder="Post a reply..."
                       className={`w-full bg-transparent px-4 py-2 text-sm focus:outline-none ${theme === 'dark' ? 'text-white placeholder-zinc-500' : 'text-gray-900 placeholder-gray-400'}`}
                    />
                    <button 
                       onClick={handleAddComment}
                       className={`px-4 font-semibold text-sm transition-colors ${newComment.trim() ? (theme === 'dark' ? 'text-[#FF003C]' : 'text-[#ff2a4b]') : 'text-gray-400 cursor-not-allowed'}`}
                       disabled={!newComment.trim()}
                    >
                      Reply
                    </button>
                  </div>
                </div>

                {/* Comment List */}
                <div className="space-y-4 pb-2">
                  {postComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Link to="/profile" state={{ viewUser: { name: comment.name, avatar: comment.avatar, isOwn: currentUser && comment.name === currentUser.name } }}>
                        <img src={comment.avatar} alt={comment.name} className="w-8 h-8 rounded-full hover:ring-2 hover:ring-[#FF003C] cursor-pointer border border-gray-200 dark:border-[#1f1f1f]" />
                      </Link>
                      <div className="flex-1">
                        <div className={`p-3 rounded-2xl rounded-tl-sm inline-block ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                          <Link to="/profile" state={{ viewUser: { name: comment.name, avatar: comment.avatar, isOwn: currentUser && comment.name === currentUser.name } }} className={`font-semibold text-xs block mb-0.5 hover:underline ${theme === 'dark' ? 'text-gray-200 group-hover:text-[#FF003C]' : 'text-gray-900 group-hover:text-[#ff2a4b]'}`}>{comment.name}</Link>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{comment.text}</p>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 ml-2">
                          <button 
                             onClick={() => toggleCommentLike(comment.id)}
                             className={`text-xs font-semibold transition-colors hover:underline ${comment.isLiked ? 'text-[#FF003C]' : (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-800')}`}
                          >
                            Like
                          </button>
                          {comment.likes > 0 && (
                            <span className={`text-[11px] flex items-center gap-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                              <Heart className="w-3 h-3 fill-current text-[#FF003C]" /> {comment.likes}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {postComments.length === 0 && (
                    <p className={`text-center text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>No comments yet. Be the first to reply!</p>
                  )}
                </div>
              </motion.div>
            )}
       </div>
    </motion.div>
  );
}

function ChatUser({ avatar, name, online, theme }: { avatar: string, name: string, online: boolean, theme: string }) {
  return (
    <Link to="/messages" className="flex items-center gap-3 cursor-pointer group">
       <div className="relative">
          <img src={avatar} className="w-10 h-10 rounded-full" />
          {online && <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 rounded-full ${theme === 'dark' ? 'border-[#0a0a0a]' : 'border-white'}`}></div>}
       </div>
       <span className={`text-sm font-medium transition-colors ${theme === 'dark' ? 'text-gray-300 group-hover:text-[#FF003C]' : 'text-gray-700 group-hover:text-gray-900'}`}>{name}</span>
    </Link>
  );
}

function EventItem({ date, title, subtitle, theme }: { date: string, title: string, subtitle: string, theme: string }) {
  return (
    <div className={`flex gap-4 p-3 rounded-xl border items-center cursor-pointer transition-colors ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] hover:border-[#FF003C]/50' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}>
      <div className={`flex flex-col items-center justify-center p-2 rounded-lg min-w-[3rem] ${theme === 'dark' ? 'bg-[#050505] text-[#FF003C]' : 'bg-gray-100 text-gray-900'}`}>
         <PenSquare className="w-4 h-4 mb-1" />
      </div>
      <div>
         <h4 className={`text-sm font-bold ${theme === 'dark' ? 'text-[#e0e0e0]' : 'text-gray-900'}`}>{title}</h4>
         <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{subtitle}</p>
      </div>
    </div>
  );
}
