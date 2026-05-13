import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Heart, MessageCircle, UserPlus, Bookmark, Settings, Search, MoreHorizontal, Activity as ActivityIcon, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../context/SettingsContext';
import MobileNav from '../components/MobileNav';

export default function ActivityScreen() {
  const navigate = useNavigate();
  const { theme, openSettings } = useSettings();
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'likes' | 'comments' | 'follows'>('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/php/activities.php");
      const result = await res.json();
      if (result.status === 'success') {
        setActivities(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch activities", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch("/api/php/activities.php", { method: 'POST' });
      setActivities(prev => prev.map(a => ({ ...a, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredActivities = activities.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'likes') return a.type === 'like';
    if (filter === 'comments') return a.type === 'comment';
    if (filter === 'follows') return a.type === 'follow';
    return true;
  });

  return (
    <div className={`min-h-screen flex flex-col md:flex-row ${theme === 'dark' ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      {/* SIDEBAR */}
      <aside className={`hidden md:flex flex-col w-64 border-r ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#0a0a0a]' : 'border-gray-200 bg-white'} shrink-0 px-4 py-6 sticky top-0 h-screen`}>
        <Link to="/feed" className="flex items-center gap-3 px-2 mb-8">
           <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`}>
              <span className="font-black text-xl italic text-white">D</span>
           </div>
           <h2 className={`font-bold tracking-tighter text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>DEV<span className="text-[#FF003C]">CONNECT</span></h2>
        </Link>
        <nav className="flex-1 space-y-1">
          <NavItem icon={Search} label="Search" to="/feed" theme={theme} />
          <NavItem icon={ActivityIcon} label="Activity" active to="/activity" theme={theme} />
          <NavItem icon={MessageCircle} label="Messages" to="/messages" theme={theme} />
          <NavItem icon={Bookmark} label="Saved" to="/saved" theme={theme} />
          <NavItem icon={Settings} label="Settings" onClick={openSettings} theme={theme} />
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 md:p-8 pb-24">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}>
                <ArrowLeft className="w-5 h-5" />
             </button>
             <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Activity</h1>
          </div>
          <button 
            onClick={markAllRead}
            className={`text-sm font-bold ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#ff4d79]' : 'text-[#ff2a4b] hover:text-red-600'}`}
          >
            Mark all as read
          </button>
        </header>

        {/* Filters */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'likes', 'comments', 'follows'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all whitespace-nowrap ${
                filter === f
                  ? (theme === 'dark' ? 'bg-[#FF003C] text-black' : 'bg-[#ff2a4b] text-white')
                  : (theme === 'dark' ? 'bg-[#121212] text-gray-400 hover:bg-[#1f1f1f]' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Activity List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
               <div className="w-8 h-8 border-2 border-[#FF003C] border-t-transparent rounded-full animate-spin mb-4"></div>
               <p className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Loading activities...</p>
            </div>
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} theme={theme} />
            ))
          ) : (
            <div className={`text-center py-20 rounded-2xl border-2 border-dashed ${theme === 'dark' ? 'border-[#1f1f1f] text-gray-500' : 'border-gray-200 text-gray-400'}`}>
               <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p className="font-medium">No activity to show yet</p>
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}

const ActivityItem: React.FC<{ activity: any, theme: string }> = ({ activity, theme }) => {
  const getIcon = () => {
    switch (activity.type) {
      case 'like': return <Heart className="w-4 h-4 text-[#FF003C] fill-current" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-blue-500 fill-current" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'save': return <Bookmark className="w-4 h-4 text-orange-500 fill-current" />;
      default: return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const getActionText = () => {
    switch (activity.type) {
      case 'like': return "liked your post";
      case 'comment': return `commented: "${activity.content}"`;
      case 'follow': return "started following you";
      case 'message': return "sent you a message";
      case 'save': return "saved your post";
      default: return activity.content || "performed an action";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
        activity.is_read ? '' : (theme === 'dark' ? 'border-[#FF003C]/30 bg-[#FF003C]/5' : 'border-[#ff2a4b]/30 bg-red-50/50')
      } ${theme === 'dark' ? 'bg-[#121212] border-[#1f1f1f]' : 'bg-white border-gray-100 shadow-sm'}`}
    >
      <div className="relative shrink-0">
        <img src={activity.actor_avatar} alt={activity.actor_name} className="w-12 h-12 rounded-full object-cover border-2 border-transparent group-hover:border-[#FF003C] transition-all" />
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#0a0a0a]' : 'bg-white border-white'}`}>
           {getIcon()}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{activity.actor_name}</span> {getActionText()}
        </p>
        <p className="text-[11px] text-gray-500 mt-0.5">{new Date(activity.created_at).toLocaleString()}</p>
      </div>
      {!activity.is_read && (
        <div className={`w-2 h-2 rounded-full ${theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]'}`}></div>
      )}
    </motion.div>
  );
};

function NavItem({ icon: Icon, label, active, to, onClick, theme }: any) {
  const content = (
    <div className={`w-full flex items-center gap-3 px-3 py-3 transition-colors cursor-pointer ${
      active 
        ? (theme === 'dark' ? 'bg-[#FF003C]/10 text-[#FF003C] border-r-2 border-[#FF003C] font-bold' : 'bg-[#ff2a4b] text-white rounded-xl shadow-lg shadow-red-500/20 font-bold') 
        : (theme === 'dark' ? 'text-gray-400 hover:text-white hover:bg-[#1f1f1f] rounded-lg' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-xl')
    }`}>
      <Icon className="w-5 h-5" />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (to) return <Link to={to} className="block no-underline">{content}</Link>;
  return <div onClick={onClick}>{content}</div>;
}
