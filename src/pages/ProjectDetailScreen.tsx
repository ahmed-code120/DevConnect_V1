import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Github, Calendar, MapPin, Link as LinkIcon, UserCircle2, Bookmark, Settings, Video, Image as ImageIcon, PenSquare, Heart, MessageCircle } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function ProjectDetailScreen() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, openSettings } = useSettings();

  // Fallback project in case it's not passed through state
  const project = location.state?.project || {
    id: Number(id) || 1,
    title: 'Project Details',
    description: 'Detailed description of the project. This area provides comprehensive information about what the project does, the architecture it uses, and some of the key features that make it stand out. It goes more in depth than the profile summary.',
    githubUrl: '#',
    image: null,
    heroText: 'PROJECT',
    tags: ['React', 'TypeScript', 'Node.js'],
    updatedAt: 'Just now'
  };

  const getStoredLikes = () => {
    const stored = localStorage.getItem(`project_likes_${project.id}`);
    if (stored) {
      return JSON.parse(stored);
    }
    return { count: 24, isLiked: false }; // default
  };

  const [likeState, setLikeState] = useState(getStoredLikes);

  const handleLikeToggle = () => {
    setLikeState((prev: { count: number, isLiked: boolean }) => {
      const newState = {
        count: prev.isLiked ? prev.count - 1 : prev.count + 1,
        isLiked: !prev.isLiked
      };
      // Persist to local "database" (localStorage)
      localStorage.setItem(`project_likes_${project.id}`, JSON.stringify(newState));
      return newState;
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* LEFT SIDEBAR - Similar to Feed/Profile */}
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
          <NavItem icon={UserCircle2} label="Profile" active to="/profile" theme={theme} />
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
      <main className="flex-1 max-w-5xl w-full mx-auto pb-12">
        {/* Header / Topbar */}
        <header className={`sticky top-0 z-20 h-16 border-b px-4 md:px-8 flex items-center ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]/80 backdrop-blur-md' : 'border-gray-200 bg-gray-50/80 backdrop-blur-md'}`}>
           <button onClick={() => navigate(-1)} className={`mr-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
             <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
             <h2 className={`font-bold text-lg leading-tight uppercase tracking-wider ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{project.title}</h2>
             <p className={`text-[11px] font-mono ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>PROJECT_ID_0{project.id}</p>
           </div>
        </header>

        <div className="px-4 md:px-12 pt-8">
           {/* Project Hero Image */}
           <div className={`w-full h-64 md:h-96 rounded-2xl relative overflow-hidden flex items-center justify-center mb-8 border ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#1a1a1a]' : 'border-gray-200 bg-gray-100'}`}>
              {project.image ? (
                  <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
              ) : (
                  <div className={`opacity-20 font-mono text-5xl md:text-8xl font-black rotate-[-10deg] ${theme === 'dark' ? 'text-[#FF003C]' : 'text-gray-500'}`}>{project.heroText || 'PROJECT'}</div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${theme === 'dark' ? 'from-[#050505] via-transparent to-transparent' : 'from-gray-50 via-transparent to-transparent'}`}></div>
           </div>

           {/* Project Title and Actions */}
           <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
              <div>
                 <h1 className={`text-4xl font-black mb-4 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{project.title}</h1>
                 <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag: string) => (
                       <span key={tag} className={`px-3 py-1 text-[11px] font-bold uppercase tracking-widest rounded border ${theme === 'dark' ? 'bg-[#FF003C]/10 text-[#FF003C] border-[#FF003C]/30' : 'bg-red-50 text-[#ff2a4b] border-red-200'}`}>{tag}</span>
                    ))}
                 </div>
              </div>
              <div className="flex gap-4 shrink-0">
                 <button
                    onClick={handleLikeToggle}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm border transition-all ${
                      likeState.isLiked 
                        ? (theme === 'dark' ? 'bg-[#FF003C]/20 border-[#FF003C] text-[#FF003C]' : 'bg-red-50 border-[#ff2a4b] text-[#ff2a4b]')
                        : (theme === 'dark' ? 'bg-transparent border-[#1f1f1f] text-gray-400 hover:text-white hover:border-gray-500' : 'bg-transparent border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400')
                    }`}
                 >
                    <Heart className={`w-5 h-5 ${likeState.isLiked ? 'fill-current' : ''}`} /> 
                    {likeState.count} Likes
                 </button>
                 <a 
                   href={project.githubUrl} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm text-black bg-[#FF003C] hover:bg-[#cc0030] shadow-[0_0_15px_rgba(255,0,60,0.3)] transition-all`}
                 >
                   <Github className="w-5 h-5" /> View Original Repo
                 </a>
              </div>
           </div>

           {/* Project Stats */}
           <div className={`flex flex-wrap items-center gap-6 md:gap-12 py-6 mb-8 border-y ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
              <div>
                 <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Last Updated</div>
                 <div className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{project.updatedAt}</div>
              </div>
              <div>
                 <div className={`text-[10px] uppercase font-bold tracking-widest mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Status</div>
                 <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span className={`font-mono text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Active</span>
                 </div>
              </div>
           </div>

           {/* Project Description */}
           <div className="max-w-3xl">
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>About This Project</h3>
              <p className={`text-lg leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                 {project.description}
              </p>
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
        ? `${theme === 'dark' ? 'bg-[#FF003C]/5 text-[#FF003C] border-r-2 border-[#FF003C] font-semibold rounded' : 'bg-[#1877F2] text-white font-semibold shadow-md rounded-xl' }` 
        : `${theme === 'dark' ? 'text-gray-400 hover:text-white rounded p-2' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl'}`
    }`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </Link>
  );
}
