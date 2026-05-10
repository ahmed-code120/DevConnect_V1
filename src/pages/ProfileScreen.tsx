import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Settings, PenSquare, UserCircle2, Image as ImageIcon, Video, Bookmark, ArrowLeft, Edit3, Camera, MapPin, Link as LinkIcon, Calendar, Github, Plus, X, UploadCloud, Trash2, MessageCircle, UserPlus, UserMinus } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, openSettings, currentUser, setCurrentUser } = useSettings();

  const viewUser = location.state?.viewUser;
  const isOwnProfile = !viewUser || viewUser.isOwn;

  // User State
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    name: viewUser ? viewUser.name : (currentUser?.name || 'Jakob Botosh'),
    handle: viewUser ? ('@' + viewUser.name.toLowerCase().replace(/\s/g, '')) : (currentUser?.handle || '@jakobbtsh'),
    bio: viewUser ? 'An amazing developer on DevConnect.' : (currentUser?.bio || 'Full-stack developer passionate about React, PHP, and Neon aesthetics.'),
    avatar: viewUser ? viewUser.avatar : (currentUser?.avatar || 'https://i.pravatar.cc/150?u=12'),
    cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2670&auto=format&fit=crop',
    location: 'Paris, France',
    website: 'github.com',
    joined: 'September 2023',
    githubUsername: '',
    projects: [
      {
        id: 1,
        title: 'Personal E-Commerce API',
        description: 'A robust REST API built with custom PHP framework architecture.',
        githubUrl: 'https://github.com/jakobbtsh',
        image: null,
        heroText: 'MVC_FRAMEWORK',
        tags: ['PHP 8.2', 'MySQL'],
        updatedAt: '2d ago'
      },
      {
        id: 2,
        title: 'Smart Home Dashboard',
        description: 'Real-time monitoring using AJAX and WebSocket protocols for the IoT module.',
        githubUrl: 'https://github.com/jakobbtsh',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop',
        heroText: '',
        tags: ['React', 'Tailwind'],
        updatedAt: '5d ago'
      }
    ]
  });

  useEffect(() => {
     if (isOwnProfile && currentUser) {
         setUser(prev => ({
             ...prev,
             name: currentUser.name,
             handle: currentUser.handle,
             bio: currentUser.bio,
             avatar: currentUser.avatar
         }));
         setEditForm(prev => ({
             ...prev,
             name: currentUser.name,
             handle: currentUser.handle,
             bio: currentUser.bio,
             avatar: currentUser.avatar
         }));
     }
  }, [currentUser, isOwnProfile]);

  // Edit Form State
  const [editForm, setEditForm] = useState({ ...user });
  
  // Tab State
  const [activeTab, setActiveTab] = useState<'Projects' | 'Following' | 'GitHub'>('Projects');

  // GitHub State
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [isFetchingGithub, setIsFetchingGithub] = useState(false);
  const [githubError, setGithubError] = useState('');

  useEffect(() => {
    if (activeTab === 'GitHub' && user.githubUsername) {
      setIsFetchingGithub(true);
      setGithubError('');
      fetch(`https://api.github.com/users/${user.githubUsername}/repos?sort=updated&per_page=10`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch repositories. Please check the username.');
          return res.json();
        })
        .then(data => {
          setGithubRepos(data);
          setIsFetchingGithub(false);
        })
        .catch(err => {
          setGithubError(err.message);
          setIsFetchingGithub(false);
        });
    }
  }, [activeTab, user.githubUsername]);

  // Delete project state
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);

  // Follow State
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('followingUsers') || '{}');
    } catch {
      return {};
    }
  });

  const toggleFollow = (username: string) => {
    const newMap = { ...followingMap, [username]: !followingMap[username] };
    setFollowingMap(newMap);
    localStorage.setItem('followingUsers', JSON.stringify(newMap));
  };

  // New Project Form State
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({
    title: '',
    description: '',
    githubUrl: '',
    image: '',
    tags: '',
  });

  const handleImageUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProjectForm(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setUser({ ...editForm });
    setIsEditing(false);
    if(currentUser && isOwnProfile) {
       try {
           const res = await fetch('/api/users/me', {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ name: editForm.name, bio: editForm.bio, handle: editForm.handle })
           });
           const updated = await res.json();
           setCurrentUser(prev => prev ? { ...prev, ...updated } : updated);
       } catch (e) {
           console.error("Failed to update profile", e);
       }
    }
  };

  const handleCancelEdit = () => {
    setEditForm({ ...user });
    setIsEditing(false);
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddNewProject = (e: React.FormEvent) => {
    e.preventDefault();
    const tagsArray = newProjectForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    const newProject = {
      id: Date.now(),
      title: newProjectForm.title,
      description: newProjectForm.description,
      githubUrl: newProjectForm.githubUrl,
      image: newProjectForm.image || null,
      heroText: newProjectForm.image ? '' : newProjectForm.title.substring(0, 15).toUpperCase(),
      tags: tagsArray.length > 0 ? tagsArray : ['New'],
      updatedAt: 'Just now'
    };
    
    setUser(prev => ({
      ...prev,
      projects: [newProject, ...prev.projects]
    }));
    
    setIsNewProjectModalOpen(false);
    setNewProjectForm({ title: '', description: '', githubUrl: '', image: '', tags: '' });
  };

  const confirmDelete = () => {
    if (projectToDelete) {
      setUser(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectToDelete)
      }));
      setProjectToDelete(null);
    }
  };

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
            <h2 className={`font-bold tracking-tighter text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</h2>
         </div>
         <button onClick={() => navigate('/settings')} className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}><Settings className="w-5 h-5" /></button>
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
      <main className="flex-1 max-w-5xl w-full mx-auto pb-24 md:pb-12">
        {/* Header / Topbar */}
        <header className={`sticky top-0 z-20 h-16 border-b px-4 md:px-8 flex items-center ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#050505]/80 backdrop-blur-md' : 'border-gray-200 bg-gray-50/80 backdrop-blur-md'}`}>
           <button onClick={() => navigate(-1)} className={`mr-4 p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`}>
             <ArrowLeft className="w-5 h-5" />
           </button>
           <div>
             <h2 className={`font-bold text-lg leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</h2>
             <p className={`text-[11px] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>80 Projects</p>
           </div>
        </header>

        {/* Profile Banner */}
        <div className="relative h-48 md:h-64 w-full bg-zinc-800 group">
           <img src={user.cover} alt="Cover" className="w-full h-full object-cover transition-all" />
        </div>

        {/* Profile Details Container */}
        <div className="px-4 md:px-8 relative">
           {/* Avatar */}
           <div className="absolute -top-16 md:-top-20">
             <div className={`relative rounded-full border-4 ${theme === 'dark' ? 'border-[#050505] bg-[#050505]' : 'border-gray-50 bg-white'}`}>
                <img src={user.avatar} alt="Avatar" className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover" />
             </div>
           </div>

           {/* Actions Row */}
           <div className="flex justify-end pt-4 pb-4 h-20">
              {isOwnProfile ? (
                   <button 
                     onClick={() => { setEditForm({...user}); setIsEditing(true); }}
                     className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm border transition-all ${theme === 'dark' ? 'border-[#1f1f1f] hover:border-[#FF003C] hover:text-[#FF003C] text-white bg-[#0f0f0f]' : 'border-gray-300 hover:bg-gray-100 text-gray-900 bg-white'}`}
                   >
                     <Edit3 className="w-4 h-4" /> Edit Profile
                   </button>
              ) : (
                 <button 
                   onClick={() => toggleFollow(user.name)}
                   className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-sm transition-all ${followingMap[user.name] ? (theme === 'dark' ? 'bg-[#1f1f1f] text-white hover:bg-[#2a2a2a]' : 'bg-gray-200 text-gray-900 hover:bg-gray-300') : (theme === 'dark' ? 'bg-[#FF003C] text-black shadow-[0_0_15px_rgba(255,0,60,0.3)] hover:bg-[#cc0030]' : 'bg-[#ff2a4b] text-white shadow-lg hover:bg-[#e62643]')}`}
                 >
                   {followingMap[user.name] ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                   {followingMap[user.name] ? 'Unfollow' : 'Follow'}
                 </button>
              )}
           </div>

           {/* User Info */}
           <div className="mt-2 text-left">
               <>
                 <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user.name}</h1>
                 <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{user.handle}</p>
                 <p className={`text-sm mb-4 max-w-2xl leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                   {user.bio}
                 </p>
               </>

             {/* Metadata */}
             <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-xs font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>
                {user.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> {user.location}
                  </div>
                )}
                {user.website && (
                  <div className="flex items-center gap-1">
                    <LinkIcon className="w-4 h-4" /> <a href={`https://${user.website}`} target="_blank" rel="noopener noreferrer" className={`${theme === 'dark' ? 'text-[#FF003C]' : 'text-blue-600'} hover:underline`}>{user.website}</a>
                  </div>
                )}
                {user.githubUsername && (
                  <div className="flex items-center gap-1">
                    <Github className="w-4 h-4" /> <a href={`https://github.com/${user.githubUsername}`} target="_blank" rel="noopener noreferrer" className={`${theme === 'dark' ? 'text-[#FF003C] hover:text-[#cc0030]' : 'text-blue-600 hover:text-blue-800'} hover:underline`}>{user.githubUsername}</a>
                  </div>
                )}
                {user.joined && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Joined {user.joined}
                  </div>
                )}
             </div>

             {/* Stats */}
             <div className="flex items-center gap-6 mt-6">
                <div className="flex items-center gap-1">
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{isOwnProfile ? Object.keys(followingMap).filter(k => followingMap[k]).length : Math.floor(Math.random() * 500) + 50}</span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Following</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{isOwnProfile ? '2.3k' : (Math.floor(Math.random() * 80) + 10) + 'k'}</span>
                  <span className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Followers</span>
                </div>
             </div>
           </div>

           {/* Tabs */}
           <div className={`flex items-center justify-between mt-8 border-b ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('Projects')} className={`pb-4 border-b-4 whitespace-nowrap ${activeTab === 'Projects' ? 'font-bold ' + (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : 'border-transparent font-medium text-sm ' + (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Projects</button>
                <button onClick={() => setActiveTab('GitHub')} className={`pb-4 border-b-4 whitespace-nowrap ${activeTab === 'GitHub' ? 'font-bold ' + (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : 'border-transparent font-medium text-sm ' + (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Open Source</button>
                {isOwnProfile && (
                  <button onClick={() => setActiveTab('Following')} className={`pb-4 border-b-4 whitespace-nowrap ${activeTab === 'Following' ? 'font-bold ' + (theme === 'dark' ? 'border-[#FF003C] text-white' : 'border-[#ff2a4b] text-gray-900') : 'border-transparent font-medium text-sm ' + (theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}>Following {(Object.keys(followingMap).filter(k => followingMap[k]).length > 0) ? `(${Object.keys(followingMap).filter(k => followingMap[k]).length})` : ''}</button>
                )}
                <button className={`pb-4 border-b-4 border-transparent whitespace-nowrap font-medium text-sm ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>Activity</button>
                <button className={`pb-4 border-b-4 border-transparent whitespace-nowrap font-medium text-sm ${theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}>Likes</button>
              </div>
              
              {isOwnProfile && (
                <button 
                   onClick={() => setIsNewProjectModalOpen(true)}
                   className={`flex items-center gap-2 pb-4 font-medium text-sm transition-colors ${theme === 'dark' ? 'text-white hover:text-[#FF003C]' : 'text-gray-900 hover:text-[#ff2a4b]'}`}
                >
                   <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Project</span>
                </button>
              )}
           </div>

           {/* Projects Grid */}
           {activeTab === 'Projects' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mt-8">
                {user.projects.map((project) => (
                  <div 
                     key={project.id} 
                     onClick={() => navigate(`/project/${project.id}`, { state: { project } })}
                     className={`rounded-xl overflow-hidden group transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative ${theme === 'dark' ? 'bg-[#0f0f0f] border border-[#1f1f1f] hover:border-[#FF003C]/50 hover:shadow-[0_0_20px_rgba(255,0,60,0.15)]' : 'bg-white border border-gray-200 shadow-sm hover:border-[#ff2a4b]/50 hover:shadow-[0_0_20px_rgba(255,42,75,0.15)]'}`}
                  >
                    {isOwnProfile && (
                      <button 
                         onClick={(e) => { e.stopPropagation(); setProjectToDelete(project.id); }}
                         className={`absolute top-3 right-3 z-10 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${theme === 'dark' ? 'bg-black/60 hover:bg-black/80 text-gray-300 hover:text-[#FF003C]' : 'bg-white/80 hover:bg-white text-gray-600 hover:text-red-600'} backdrop-blur-sm shadow-sm`}
                         title="Delete project"
                      >
                         <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className={`h-40 relative flex items-center justify-center overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-100'}`}>
                      {project.image ? (
                          <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                      ) : (
                          <div className={`opacity-20 font-mono text-4xl font-black rotate-[-10deg] ${theme === 'dark' ? 'text-[#FF003C]' : 'text-gray-500'}`}>{project.heroText}</div>
                      )}
                      <div className={`absolute inset-0 bg-gradient-to-b ${theme === 'dark' ? 'from-transparent to-black/60' : 'from-transparent to-gray-900/60'}`}></div>
                      <div className="absolute bottom-4 left-4 flex gap-2">
                         {project.tags.map(tag => (
                            <span key={tag} className={`px-2 py-1 text-[9px] rounded border ${theme === 'dark' ? 'bg-black/80 text-[#FF003C] border-[#FF003C]/30' : 'bg-white/90 text-[#ff2a4b] border-gray-300'}`}>{tag}</span>
                         ))}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className={`font-bold text-base ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{project.title}</h3>
                          <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{project.description}</p>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between mt-4 pt-4 border-t ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100'}`}>
                        <div className="flex items-center gap-2">
                          <Github className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Updated {project.updatedAt}</span>
                        </div>
                        <a href={project.githubUrl} onClick={(e) => e.stopPropagation()} target="_blank" rel="noopener noreferrer" className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[10px] uppercase font-bold tracking-widest ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#cc0030]' : 'text-[#ff2a4b] hover:text-red-700'}`}>View Repo →</a>
                      </div>
                    </div>
                  </div>
                ))}
             </div>
           )}

           {/* Following List */}
           {activeTab === 'Following' && (
             <div className="mt-8 space-y-4">
                {Object.keys(followingMap).filter(key => followingMap[key]).length === 0 ? (
                  <p className={`text-center py-10 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{isOwnProfile ? 'You are not following anyone yet.' : `${user.name} is not following anyone yet.`}</p>
                ) : (
                  Object.keys(followingMap).filter(key => followingMap[key]).map((username) => (
                    <div key={username} className={`flex items-center justify-between p-4 rounded-xl border ${theme === 'dark' ? 'bg-[#0f0f0f] border-[#1f1f1f]' : 'bg-white border-gray-200'}`}>
                      <div className="flex items-center gap-3">
                        <img src={`https://i.pravatar.cc/150?u=${btoa(username)}`} alt={username} className="w-12 h-12 rounded-full border border-gray-200 dark:border-[#1f1f1f]" />
                        <div>
                          <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{username}</h4>
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>@{username.toLowerCase().replace(/\s+/g, '')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleFollow(username)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${theme === 'dark' ? 'bg-[#FF003C]/20 text-[#FF003C] hover:bg-[#FF003C] hover:text-white' : 'bg-red-50 text-red-600 hover:bg-[#ff2a4b] hover:text-white'}`}
                      >
                        Unfollow
                      </button>
                    </div>
                  ))
                )}
             </div>
           )}

           {/* GitHub Repositories List */}
           {activeTab === 'GitHub' && (
             <div className="mt-8 space-y-4">
                {!user.githubUsername ? (
                  <div className={`text-center py-16 rounded-xl border border-dashed ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-gray-50'}`}>
                    <Github className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-[#1f1f1f]' : 'text-gray-300'}`} />
                    <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{isOwnProfile ? 'Connect your GitHub account to show your public repositories.' : `${user.name} hasn't connected a GitHub account.`}</p>
                    {isOwnProfile && (
                       <button onClick={() => { setActiveTab('Projects'); setIsEditing(true); }} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${theme === 'dark' ? 'bg-[#FF003C] text-black shadow-[0_0_15px_rgba(255,0,60,0.3)] hover:bg-[#cc0030]' : 'bg-[#ff2a4b] text-white shadow-[0_0_15px_rgba(255,42,75,0.3)] hover:bg-[#e62643]'}`}>Connect GitHub</button>
                    )}
                  </div>
                ) : isFetchingGithub ? (
                  <div className="text-center py-10">
                    <p className={`text-sm animate-pulse ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Fetching repositories from GitHub...</p>
                  </div>
                ) : githubError ? (
                  <div className="text-center py-10">
                    <p className="text-red-500 text-sm">Error: {githubError}</p>
                  </div>
                ) : githubRepos.length === 0 ? (
                  <div className="text-center py-10">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>No public repositories found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {githubRepos.map((repo: any) => (
                      <div key={repo.id} className={`p-5 rounded-xl border flex flex-col transition-colors ${theme === 'dark' ? 'bg-[#0f0f0f] border-[#1f1f1f] hover:border-[#FF003C]/50' : 'bg-white border-gray-200 hover:border-[#ff2a4b]/50'}`}>
                        <div className="flex justify-between items-start mb-2">
                          <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className={`font-bold text-[15px] truncate max-w-[80%] hover:underline ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{repo.name}</a>
                          {repo.stargazers_count > 0 && (
                            <span className={`flex items-center gap-1 text-xs shrink-0 ${theme === 'dark' ? 'text-yellow-500' : 'text-yellow-600'}`}>★ {repo.stargazers_count}</span>
                          )}
                        </div>
                        <p className={`text-[13px] mb-4 flex-1 line-clamp-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{repo.description || 'No description provided.'}</p>
                        <div className={`flex items-center justify-between text-[11px] pt-4 mt-auto border-t ${theme === 'dark' ? 'text-gray-500 border-[#1f1f1f]' : 'text-gray-500 border-gray-100'}`}>
                          <div className="flex items-center gap-3">
                            {repo.language && <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FF003C]"></span>{repo.language}</span>}
                            <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                          </div>
                          <a href={`${repo.html_url}/issues`} target="_blank" rel="noopener noreferrer" className={`font-bold uppercase tracking-wider transition-colors ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#cc0030]' : 'text-[#ff2a4b] hover:text-[#e62643]'}`}>Contribute</a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}

        </div>
      </main>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'} shadow-2xl`}>
             <div className="flex justify-between items-center mb-6">
                <h3 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Add New Project</h3>
                <button 
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className={`p-1 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <form onSubmit={handleAddNewProject} className="space-y-4 text-left">
                <div>
                  <label className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Title</label>
                  <input 
                    type="text" 
                    required
                    value={newProjectForm.title}
                    onChange={(e) => setNewProjectForm({...newProjectForm, title: e.target.value})}
                    className={`w-full rounded-lg px-3 py-2 border text-sm transition-colors ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] text-white focus:border-[#FF003C]' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#ff2a4b]'} focus:outline-none`}
                    placeholder="Project Title"
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={newProjectForm.description}
                    onChange={(e) => setNewProjectForm({...newProjectForm, description: e.target.value})}
                    className={`w-full rounded-lg px-3 py-2 border text-sm transition-colors ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] text-white focus:border-[#FF003C]' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#ff2a4b]'} focus:outline-none resize-none`}
                    placeholder="Brief description of the project"
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>GitHub URL</label>
                  <input 
                    type="url" 
                    required
                    value={newProjectForm.githubUrl}
                    onChange={(e) => setNewProjectForm({...newProjectForm, githubUrl: e.target.value})}
                    className={`w-full rounded-lg px-3 py-2 border text-sm transition-colors ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] text-white focus:border-[#FF003C]' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#ff2a4b]'} focus:outline-none`}
                    placeholder="https://github.com/..."
                  />
                </div>

                <div>
                  <label className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Project Image</label>
                  
                  <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleImageUpload(e.dataTransfer.files[0]);
                      }
                    }}
                    className={`relative w-full h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors cursor-pointer overflow-hidden ${
                      isDragging 
                        ? (theme === 'dark' ? 'border-[#FF003C] bg-[#FF003C]/10' : 'border-[#ff2a4b] bg-red-50') 
                        : (theme === 'dark' ? 'border-[#1f1f1f] bg-[#121212] hover:border-gray-500' : 'border-gray-300 bg-gray-50 hover:border-gray-400')
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleImageUpload(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {newProjectForm.image ? (
                        <div className="w-full h-full relative group">
                          <img src={newProjectForm.image} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <p className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2"><UploadCloud className="w-4 h-4" /> Replace Image</p>
                          </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center pointer-events-none text-center px-4">
                          <UploadCloud className={`w-8 h-8 mb-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                          <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            <span className={`font-bold underline ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Click to upload</span> or drag and drop
                          </p>
                          <p className={`text-[10px] mt-1 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-500'}`}>PNG, JPG, GIF up to 5MB</p>
                        </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className={`block text-[10px] font-bold tracking-widest uppercase mb-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Tags (Comma separated)</label>
                  <input 
                    type="text" 
                    value={newProjectForm.tags}
                    onChange={(e) => setNewProjectForm({...newProjectForm, tags: e.target.value})}
                    className={`w-full rounded-lg px-3 py-2 border text-sm transition-colors ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f] text-white focus:border-[#FF003C]' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-[#ff2a4b]'} focus:outline-none`}
                    placeholder="React, CSS, Node"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsNewProjectModalOpen(false)}
                    className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${theme === 'dark' ? 'border-[#1f1f1f] text-gray-400 hover:text-white hover:border-gray-500' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 rounded-lg font-bold text-sm text-black bg-[#FF003C] hover:bg-[#cc0030] shadow-[0_0_15px_rgba(255,0,60,0.3)] transition-all"
                  >
                    Add Project
                  </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {projectToDelete !== null && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className={`w-full max-w-sm p-6 rounded-xl border ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'} shadow-2xl text-center`}>
               <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-500">
               <Trash2 className="w-6 h-6" />
               </div>
               <h3 className={`font-bold text-xl mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Delete Project</h3>
               <p className={`text-sm mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Are you sure you want to delete this project? This action cannot be undone.</p>
               
               <div className="flex gap-3">
               <button 
                  onClick={() => setProjectToDelete(null)}
                  className={`flex-1 py-2 rounded-lg font-bold text-sm border transition-all ${theme === 'dark' ? 'border-[#1f1f1f] text-gray-400 hover:text-white hover:border-gray-500' : 'border-gray-300 text-gray-600 hover:bg-gray-100 hover:border-gray-400'}`}
               >
                  Cancel
               </button>
               <button 
                  onClick={confirmDelete}
                  className="flex-1 py-2 rounded-lg font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-md transition-all"
               >
                  Delete
               </button>
               </div>
            </div>
         </div>
      )}
      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-100'} max-h-[90vh]`}>
            {/* Header */}
            <div className={`p-4 border-b flex items-center justify-between sticky top-0 bg-inherit z-10 ${theme === 'dark' ? 'border-[#1f1f1f]' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3">
                 <button onClick={handleCancelEdit} className={`p-2 -ml-2 rounded-full transition ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}>
                   <X className="w-5 h-5" />
                 </button>
                 <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Edit Profile</h3>
              </div>
              <button onClick={handleSaveProfile} className={`font-bold text-sm ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#cc0030]' : 'text-blue-600 hover:text-blue-800'}`}>
                Done
              </button>
            </div>
            
            {/* Body */}
            <div className="overflow-y-auto p-4 flex-1 hide-scrollbar">
               {/* Cover Image Upload */}
               <div className="mb-6 relative h-32 rounded-xl bg-zinc-800 overflow-hidden group">
                  <img src={editForm.cover} alt="Cover Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label className="cursor-pointer bg-black/50 p-2 rounded-full hover:bg-black/70 transition backdrop-blur-md border border-white/20">
                       <Camera className="w-5 h-5 text-white" />
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'cover')} />
                    </label>
                  </div>
               </div>

               {/* Avatar Upload */}
               <div className="flex justify-center -mt-16 mb-8">
                  <div className={`relative w-24 h-24 rounded-full border-4 ${theme === 'dark' ? 'border-[#121212] bg-[#1a1a1a]' : 'border-white bg-gray-100'} group overflow-hidden`}>
                     <img src={editForm.avatar} alt="Avatar Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                       <label className="cursor-pointer bg-black/50 p-2 rounded-full hover:bg-black/70 transition backdrop-blur-md pointer-events-auto border border-white/20">
                          <Camera className="w-4 h-4 text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleProfileImageUpload(e, 'avatar')} />
                       </label>
                     </div>
                  </div>
               </div>

               <div className="space-y-5">
                  <div className="space-y-1">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Name</label>
                     <input type="text" value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
                  <div className="space-y-1">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Handle</label>
                     <input type="text" value={editForm.handle} onChange={(e) => setEditForm({...editForm, handle: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
                  <div className="space-y-1">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Bio</label>
                     <textarea rows={3} value={editForm.bio} onChange={(e) => setEditForm({...editForm, bio: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors resize-none ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
                  <div className="space-y-1">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Location</label>
                     <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
                  <div className="space-y-1">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Website</label>
                     <input type="text" value={editForm.website} onChange={(e) => setEditForm({...editForm, website: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
                  <div className="space-y-1">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>GitHub Username</label>
                     <input type="text" value={editForm.githubUsername} onChange={(e) => setEditForm({...editForm, githubUsername: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
                  <div className="space-y-1 pb-4">
                     <label className={`text-xs font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Joined Date</label>
                     <input type="text" value={editForm.joined} onChange={(e) => setEditForm({...editForm, joined: e.target.value})} className={`w-full px-0 py-2 border-b bg-transparent focus:outline-none transition-colors ${theme === 'dark' ? 'border-[#2a2a2a] text-white focus:border-[#FF003C]' : 'border-gray-200 text-gray-900 focus:border-[#ff2a4b]'}`} />
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
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
