import React from 'react';
import { Monitor, X as CloseIcon, Sun, Moon, BellOff, Bell, Settings } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

export default function SettingsModal() {
  const { 
    theme, toggleTheme, isSettingsOpen, closeSettings, 
    globalMute, setGlobalMute, notifications, updateNotification, privacy, updatePrivacy, media, updateMedia 
  } = useSettings();

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md max-h-[85vh] rounded-2xl flex flex-col shadow-2xl overflow-hidden ${theme === 'dark' ? 'bg-[#121212] border border-[#1f1f1f]' : 'bg-white border border-gray-100'}`}>
         <div className={`p-4 border-b flex justify-between items-center z-10 ${theme === 'dark' ? 'border-[#1f1f1f] bg-[#121212]' : 'border-gray-100 bg-white'}`}>
            <h3 className={`font-bold text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
               <Settings className="w-5 h-5" />
               DevConnect Settings
            </h3>
            <button onClick={closeSettings} className={`p-1.5 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-[#1f1f1f] text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
               <CloseIcon className="w-5 h-5" />
            </button>
         </div>
         
         <div className="p-6 space-y-8 flex-1 overflow-y-auto">
            
            {/* Profile Section (Mock) */}
            <div className="flex items-center gap-4">
               <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold bg-gradient-to-tr ${theme === 'dark' ? 'from-[#FF003C] to-orange-500 text-white' : 'from-[#ff2a4b] to-pink-500 text-white'}`}>
                  M
               </div>
               <div>
                  <h4 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>My Profile</h4>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Frontend Developer</p>
               </div>
               <button className={`ml-auto px-4 py-2 rounded-lg text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-[#1f1f1f] text-white hover:bg-[#2a2a2a]' : 'bg-gray-100 text-gray-900 hover:bg-gray-200'}`}>Edit</button>
            </div>

            {/* Appearance Options */}
            <div>
               <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Appearance</h4>
               
               <div className={`p-1 rounded-xl flex items-center gap-1 mb-4 ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-100'}`}>
                  <button 
                    onClick={() => { if(theme !== 'light') toggleTheme(); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                     <Sun className="w-4 h-4" /> Light Mode
                  </button>
                  <button 
                    onClick={() => { if(theme !== 'dark') toggleTheme(); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${theme === 'dark' ? 'bg-[#1f1f1f] text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                     <Moon className="w-4 h-4" /> Dark Mode
                  </button>
               </div>
            </div>

            {/* Notification Options */}
            <div>
               <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Notifications</h4>
               <button onClick={() => setGlobalMute(!globalMute)} className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors mb-3 ${theme === 'dark' ? 'bg-[#1a1a1a] hover:bg-[#222]' : 'bg-gray-50 hover:bg-gray-100'}`}>
                  <div className="flex items-center gap-3">
                     {globalMute ? <BellOff className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-500'}`} /> : <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />}
                     <div className="text-left">
                       <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Mute All Notifications</div>
                       <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>Pause alerts for all activities</div>
                     </div>
                  </div>
                  <div className={`w-10 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${globalMute ? (theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]') : (theme === 'dark' ? 'bg-[#0a0a0a] border border-gray-700' : 'bg-gray-300')}`}>
                     <div className={`w-4 h-4 rounded-full bg-white transition-transform ${globalMute ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`}></div>
                  </div>
               </button>

               {!globalMute && (
                  <div className={`space-y-1 rounded-xl overflow-hidden mb-3 ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                     {[
                        { title: 'New Messages', id: 'messages', active: notifications.messages },
                        { title: 'Likes', id: 'likes', active: notifications.likes },
                        { title: 'Comments', id: 'comments', active: notifications.comments },
                        { title: 'Friend Requests', id: 'friendRequests', active: notifications.friendRequests },
                        { title: 'Vibration', id: 'vibration', active: notifications.vibration },
                     ].map((item, idx) => (
                        <button key={item.id} onClick={() => updateNotification(item.id as any, !item.active)} className={`w-full flex items-center justify-between p-3 transition-colors ${idx !== 0 ? (theme === 'dark' ? 'border-t border-[#2a2a2a]' : 'border-t border-gray-200') : ''} ${theme === 'dark' ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}>
                           <div className="text-left">
                              <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{item.title}</div>
                           </div>
                           <div className={`w-10 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${item.active ? (theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]') : (theme === 'dark' ? 'bg-[#0a0a0a] border border-gray-700' : 'bg-gray-300')}`}>
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`}></div>
                           </div>
                        </button>
                     ))}
                  </div>
               )}

               {!globalMute && (
                 <div className={`p-3 rounded-xl flex items-center justify-between transition-colors ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                   <div className="text-left">
                     <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Notification Sound</div>
                   </div>
                   <select 
                     value={notifications.sound} 
                     onChange={(e) => updateNotification('sound', e.target.value)} 
                     className={`text-sm bg-transparent font-medium focus:outline-none ${theme === 'dark' ? 'text-gray-300 [&>option]:bg-[#1a1a1a]' : 'text-gray-600 [&>option]:bg-white'}`}
                   >
                     <option value="default">Default</option>
                     <option value="chime">Chime</option>
                     <option value="pop">Pop</option>
                     <option value="none">None</option>
                   </select>
                 </div>
               )}
            </div>
            
            {/* Privacy Options */}
            <div>
               <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Privacy & Activity</h4>
               <div className={`space-y-1 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  {[
                     { title: 'Activity Status', desc: 'Show when you\'re active', id: 'status', active: privacy.status },
                     { title: 'Read Receipts', desc: 'Let others know you read their messages', id: 'read', active: privacy.read },
                     { title: 'Typing Indicator', desc: 'Show when you are typing', id: 'typing', active: privacy.typing },
                  ].map((item, idx) => (
                     <button key={item.id} onClick={() => updatePrivacy(item.id as keyof typeof privacy, !item.active)} className={`w-full flex items-center justify-between p-3 transition-colors ${idx !== 0 ? (theme === 'dark' ? 'border-t border-[#2a2a2a]' : 'border-t border-gray-200') : ''} ${theme === 'dark' ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}>
                        <div className="text-left">
                           <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{item.title}</div>
                           <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</div>
                        </div>
                        <div className={`w-10 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${item.active ? (theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]') : (theme === 'dark' ? 'bg-[#0a0a0a] border border-gray-700' : 'bg-gray-300')}`}>
                           <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`}></div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>
            
            {/* Media & Data */}
            <div>
               <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Media & Data</h4>
               <div className={`space-y-1 rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
                  {[
                     { title: 'Auto-Download Media', desc: 'Download photos and videos automatically on Wi-Fi', id: 'autoDownload', active: media.autoDownload },
                     { title: 'Save to Camera Roll', desc: 'Save received photos to your device', id: 'saveToCameraRoll', active: media.saveToCameraRoll },
                  ].map((item, idx) => (
                     <button key={item.id} onClick={() => updateMedia(item.id as keyof typeof media, !item.active)} className={`w-full flex items-center justify-between p-3 transition-colors ${idx !== 0 ? (theme === 'dark' ? 'border-t border-[#2a2a2a]' : 'border-t border-gray-200') : ''} ${theme === 'dark' ? 'hover:bg-[#222]' : 'hover:bg-gray-100'}`}>
                        <div className="text-left">
                           <div className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{item.title}</div>
                           <div className={`text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{item.desc}</div>
                        </div>
                        <div className={`w-10 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${item.active ? (theme === 'dark' ? 'bg-[#FF003C]' : 'bg-[#ff2a4b]') : (theme === 'dark' ? 'bg-[#0a0a0a] border border-gray-700' : 'bg-gray-300')}`}>
                           <div className={`w-4 h-4 rounded-full bg-white transition-transform ${item.active ? 'translate-x-4 shadow-sm' : 'translate-x-0'}`}></div>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <button className={`w-full py-3 rounded-xl font-bold transition-colors ${theme === 'dark' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
               Log Out
            </button>
         </div>
      </div>
    </div>
  );
}
