import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle2, Bookmark, Settings, Video as VideoIcon, Image as ImageIcon, PenSquare, Heart, MessageCircle, Play } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';

import { DEFAULT_POSTS } from '../data/posts';

export default function SavedScreen() {
  const navigate = useNavigate();
  const { theme, openSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('All');
  
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSavedPosts();
  }, []);

  const fetchSavedPosts = async () => {
    try {
      const res = await fetch("/api/php/saved_posts.php");
      const result = await res.json();
      if (result.status === 'success') {
        const mapped = result.data.map((post: any) => ({
          id: post.id,
          type: post.video_url ? 'video' : (post.images && post.images.length > 0 ? 'photo' : 'post'),
          title: post.desc.substring(0, 50) + (post.desc.length > 50 ? '...' : ''),
          author: post.name,
          date: post.time || post.created_at,
          excerpt: post.desc,
          likes: post.likes_count,
          comments: post.comments_count,
          url: post.images ? post.images[0] : undefined,
          caption: post.desc,
          category: post.tags && post.tags.length > 0 ? post.tags[0] : 'General',
          thumbnail: post.video_url ? 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop' : undefined,
          views: post.shares_count * 100 + ' views'
        }));
        setSavedItems(mapped);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = activeTab === 'All' ? savedItems : savedItems.filter(item => {
      if (activeTab === 'Posts') return item.type === 'post';
      if (activeTab === 'Photos') return item.type === 'photo';
      if (activeTab === 'Videos') return item.type === 'video';
      return true;
  });

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#050505]' : 'bg-white'}`}>
      {/* MOBILE HEADER */}
      <header className={`md:hidden sticky top-0 z-40 flex items-center justify-between px-4 h-14 border-b backdrop-blur-lg ${
        theme === 'dark' ? 'bg-[#0a0a0a]/80 border-[#1f1f1f]' : 'bg-white/80 border-gray-200'
      }`}>
         <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className={`mr-2 p-1 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className={`font-bold tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Saved</h2>
         </div>
         <div className="w-10"></div> {/* Spacer for symmetry if needed */}
      </header>

      {/* LEFT SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 overflow-y-auto sticky top-0 h-screen`}>
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
          <NavItem icon={Bookmark} label="Saved" active to="/saved" theme={theme} />
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
      <main className="flex-1 max-w-4xl w-full mx-auto pb-24 md:pb-12">
        {/* Header / Topbar (Desktop) */}
        <header className={`hidden md:flex sticky top-0 z-20 h-16 border-b px-4 md:px-8 items-center justify-between ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]/80 backdrop-blur-md' : 'border-gray-200 bg-gray-50/80 backdrop-blur-md'}`}>
           <div className="flex items-center">
             <button onClick={() => navigate(-1)} className={`mr-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
               <ArrowLeft className="w-5 h-5" />
             </button>
             <div>
               <h2 className={`font-bold text-lg leading-tight uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  <Bookmark className="w-5 h-5" /> Saved Items
               </h2>
             </div>
           </div>
        </header>

        <div className="px-4 md:px-8 pt-8">
           {/* Filters */}
           <div className={`flex items-center gap-4 mb-8 pb-4 border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'} overflow-x-auto scrollbar-hide`}>
              {['All', 'Posts', 'Photos', 'Videos'].map(tab => (
                 <button 
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${
                     activeTab === tab 
                       ? (theme === 'dark' ? 'bg-white text-black' : 'bg-gray-900 text-white')
                       : (theme === 'dark' ? 'bg-[#121212] text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-600 hover:text-gray-900')
                   }`}
                 >
                   {tab}
                 </button>
              ))}
           </div>
           
           {/* Saved Items List */}
           <div className="space-y-6">
              {filteredItems.map((item) => (
                 <div key={item.id} className={`p-5 rounded-2xl border transition-colors cursor-pointer ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f] hover:border-[#333]' : 'bg-white border-gray-200 hover:border-gray-300'} shadow-sm`}>
                    
                    {item.type === 'post' && (
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}>
                                    <UserCircle2 className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.author}</p>
                                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>{item.date}</p>
                                </div>
                                <div className="ml-auto">
                                   <Bookmark className={`w-5 h-5 ${theme === 'dark' ? 'text-white fill-current' : 'text-gray-900 fill-current'}`} />
                                </div>
                            </div>
                            <h3 className={`font-bold text-lg mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                            <p className={`text-sm mb-4 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.excerpt}</p>
                            <div className={`flex items-center gap-4 text-xs font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                <span className="flex items-center gap-1.5 hover:text-[#FF003C] transition-colors"><Heart className="w-4 h-4" /> {item.likes}</span>
                                <span className="flex items-center gap-1.5 hover:text-[#FF003C] transition-colors"><MessageCircle className="w-4 h-4" /> {item.comments}</span>
                            </div>
                        </div>
                    )}

                    {item.type === 'photo' && (
                        <div className="flex flex-col sm:flex-row gap-5">
                            <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 relative">
                                <img src={item.url} alt={item.caption} className="w-full h-full object-cover" />
                                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                                   <ImageIcon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.caption}</h3>
                                        <Bookmark className={`w-5 h-5 shrink-0 ${theme === 'dark' ? 'text-white fill-current' : 'text-gray-900 fill-current'}`} />
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-widest inline-block mb-3 ${theme === 'dark' ? 'bg-[#1f1f1f] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                        {item.category}
                                    </span>
                                </div>
                                <div className={`flex items-center gap-4 text-xs font-bold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                                    <span className="flex items-center gap-1.5 hover:text-[#FF003C] transition-colors"><Heart className="w-4 h-4 text-[#FF003C] fill-current" /> {item.likes}</span>
                                    <span className="flex items-center gap-1.5 hover:text-[#FF003C] transition-colors"><MessageCircle className="w-4 h-4" /> {item.comments}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {item.type === 'video' && (
                        <div className="flex flex-col sm:flex-row gap-5">
                            <div className="w-full sm:w-48 h-32 rounded-xl overflow-hidden shrink-0 relative bg-black flex items-center justify-center">
                                <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover opacity-70" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-black/50 backdrop-blur-sm text-white">
                                        <Play className="w-5 h-5 ml-1" />
                                    </div>
                                </div>
                                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                                   <VideoIcon className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-bold text-lg line-clamp-2 pr-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                                        <Bookmark className={`w-5 h-5 shrink-0 mt-1 ${theme === 'dark' ? 'text-white fill-current' : 'text-gray-900 fill-current'}`} />
                                    </div>
                                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{item.author}</p>
                                </div>
                                <div className={`text-xs mt-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                    {item.views} views • {item.date}
                                </div>
                            </div>
                        </div>
                    )}

                 </div>
              ))}
           </div>
           
           {filteredItems.length === 0 && (
             <div className="py-20 text-center flex flex-col items-center">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-gray-100'}`}>
                  <Bookmark className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`} />
               </div>
               <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>No saved items found.</p>
               <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Click the bookmark icon on posts, photos, or videos to save them here.</p>
             </div>
           )}
        </div>
      </main>
      <MobileNav />
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
