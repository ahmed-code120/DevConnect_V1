import React, { useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, UserCircle2, Bookmark, Settings, Video, Image as ImageIcon, PenSquare, Heart, MessageCircle, Share2, MoreHorizontal, Link as LinkIcon } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { DEFAULT_POSTS } from '../data/posts';
import { motion, AnimatePresence } from 'framer-motion';

export default function PostDetailScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, openSettings } = useSettings();

  // Try to find the post from DEFAULT_POSTS if not passed in location.state
  const post = location.state?.post || DEFAULT_POSTS.find(p => p.id === id) || {
    id: id || "1",
    avatar: "https://i.pravatar.cc/150?u=0",
    name: "Unknown User",
    time: "Just now",
    desc: "Post not found.",
    likes: 0,
    comments: 0,
    shares: 0
  };

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [isSaved, setIsSaved] = useState(() => {
    const saved = localStorage.getItem('savedPosts');
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        return arr.includes(post.id);
      } catch (e) {}
    }
    return false;
  });

  const toggleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? Math.max(0, likeCount - 1) : likeCount + 1);
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
       if (!arr.includes(post.id)) arr.push(post.id);
    } else {
       arr = arr.filter((i: string) => i !== post.id);
    }
    localStorage.setItem('savedPosts', JSON.stringify(arr));
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* LEFT SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 overflow-y-auto sticky top-0 h-screen`}>
        <Link to="/feed" className="flex items-center gap-3 px-2 mb-8">
           <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C] shadow-[0_0_15px_rgba(255,0,60,0.6)]' : 'bg-[#ff2a4b] border border-red-200'}`}>
              <span className={`font-black text-xl italic ${theme === 'dark' ? 'text-black' : 'text-white'}`}>D</span>
           </div>
           <h2 className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>DEV<span className="text-[#FF003C]">CONNECT</span></h2>
        </Link>
        <nav className="flex-1 space-y-1">
          <p className={`text-[10px] uppercase tracking-[0.2em] mb-4 mt-2 px-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Navigation</p>
          <NavItem icon={PenSquare} label="Feed" to="/feed" theme={theme} />
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
      <main className="flex-1 max-w-3xl w-full mx-auto md:mx-12 lg:mx-20 xl:mx-auto pb-12">
        <header className={`sticky top-0 z-20 h-16 border-b px-4 flex items-center ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]/80 backdrop-blur-md' : 'border-gray-200 bg-gray-50/80 backdrop-blur-md'}`}>
           <button onClick={() => navigate(-1)} className={`mr-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
             <ArrowLeft className="w-5 h-5" />
           </button>
           <h2 className={`font-bold text-lg leading-tight uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Post Detail</h2>
        </header>

        <div className="px-4 py-8">
            <div className={`p-6 md:p-8 rounded-2xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-100 shadow-sm'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <img src={post.avatar} className="w-12 h-12 rounded-full border border-gray-100 dark:border-[#1f1f1f] hover:ring-2 hover:ring-[#FF003C] transition-all" />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{post.name}</h3>
                    <p className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400 font-bold'}`}>{post.time}</p>
                  </div>
                </div>
              </div>
              
              <div className={`text-base md:text-lg mb-8 leading-relaxed whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                 {post.desc}
              </div>
              
              {/* Meta Tags */}
              <div className="flex flex-wrap gap-3 mb-8">
                  {post.tags?.map((tag: string, i: number) => (
                     <span key={i} className={`text-sm px-3 py-1.5 rounded-md font-medium ${theme === 'dark' ? 'bg-[#1a1a1a] text-cyan-400' : 'bg-cyan-50 text-cyan-600'}`}>
                       #{tag}
                     </span>
                  ))}
                  {post.repository && (
                     <a href={post.repository.startsWith('http') ? post.repository : `https://${post.repository}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] text-orange-400 hover:bg-[#222]' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}>
                       <LinkIcon className="w-4 h-4" /> Repository
                     </a>
                  )}
                  {post.liveDemo && (
                     <a href={post.liveDemo.startsWith('http') ? post.liveDemo : `https://${post.liveDemo}`} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-md font-medium transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a] text-pink-400 hover:bg-[#222]' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}>
                       <Video className="w-4 h-4" /> Live Demo
                     </a>
                  )}
              </div>

              {/* Media */}
              {post.videoUrl && (
                <div className="mb-8 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                    <video 
                      src={post.videoUrl} 
                      controls 
                      className="w-full max-h-[80vh] object-contain"
                    />
                </div>
              )}

              {post.images && post.images.length > 0 && (
                <div className={`grid gap-2 mb-8 rounded-xl overflow-hidden ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  {post.images.map((img: string, i: number) => (
                    <img key={i} src={img} className="w-full object-cover rounded-xl border border-gray-100 dark:border-[#1f1f1f]" alt="Post attachment" />
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className={`flex items-center gap-6 pt-6 border-t font-medium ${theme === 'dark' ? 'border-[#1f1f1f] text-gray-400' : 'border-gray-100 text-gray-500'}`}>
                <button 
                   onClick={toggleLike}
                   className={`flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${isLiked ? 'text-[#FF003C]' : ''}`}
                >
                  <motion.div animate={isLiked ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0] } : { scale: 1 }} transition={{ duration: 0.4 }}>
                    <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'fill-current text-[#FF003C]' : ''}`} /> 
                  </motion.div>
                  <span className="tabular-nums font-bold text-lg">{likeCount}</span>
                </button>
                <button className={`flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-blue-600'}`}>
                  <MessageCircle className="w-6 h-6" /> 
                  <span className="tabular-nums font-bold text-lg">{post.comments}</span>
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setShowShareOptions(!showShareOptions)}
                    className={`flex items-center gap-2 transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${theme === 'dark' ? 'hover:text-white' : 'hover:text-blue-600'} ${showShareOptions ? (theme === 'dark' ? 'text-white' : 'text-blue-600') : ''}`}
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                  <AnimatePresence>
                    {showShareOptions && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className={`absolute left-0 top-full mt-2 w-48 rounded-xl shadow-lg border z-20 overflow-hidden ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-100'}`}
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
                            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setShowShareOptions(false); alert('Link copied to clipboard!'); }} className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              <LinkIcon className="w-4 h-4" /> <span className="text-sm font-medium">Copy Link</span>
                            </button>
                          </li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button 
                  onClick={toggleSave}
                  className={`ml-auto transition-all p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] ${isSaved ? (theme === 'dark' ? 'text-blue-400' : 'text-blue-500') : (theme === 'dark' ? 'hover:text-[#FF003C]' : 'hover:text-gray-900')}`}>
                  <Bookmark className={`w-6 h-6 transition-colors ${isSaved ? 'fill-current text-blue-500' : ''}`} />
                </button>
              </div>
            </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active, to, theme }: { icon: any, label: string, active?: boolean, to: string, theme: string }) {
  return (
    <Link to={to} className={`w-full flex items-center gap-3 px-3 py-3 transition-colors ${
      active 
        ? (theme === 'dark' ? 'bg-[#FF003C]/5 text-[#FF003C] border-r-2 border-[#FF003C] font-semibold rounded' : 'bg-[#1877F2] text-white font-semibold shadow-md rounded-xl')
        : (theme === 'dark' ? 'text-gray-400 hover:text-white rounded p-2' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl')
    }`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
