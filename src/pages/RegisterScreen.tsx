import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Hexagon, ArrowRight, Github, User } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

export default function RegisterScreen() {
  const navigate = useNavigate();
  const { theme } = useSettings();
  const [loading, setLoading] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate auth delay
    setTimeout(() => {
      navigate('/feed');
    }, 1500);
  };

  return (
    <div className={`min-h-screen flex ${theme === 'dark' ? 'bg-[#050505]' : 'bg-gray-50'}`}>
      
      {/* Left Decoration - Desktop Only */}
      <div className={`hidden lg:flex flex-1 relative flex-col justify-between p-12 overflow-hidden ${
        theme === 'dark' ? 'bg-black' : 'bg-[#fff0f3]'
      }`}>
        <div className="relative z-10">
          <h1 className={`text-4xl font-bold tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            DEV<span className="text-[#FF003C]">CONNECT</span>
          </h1>
          <p className={`mt-4 text-lg font-medium max-w-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Start your journey. Share your code, learn from others, and accelerate your career.
          </p>
        </div>
        
        {/* Abstract Graphic */}
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-[#FF003C]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${theme === 'dark' ? 'from-[#050505] to-transparent' : 'from-gray-50 to-transparent'} z-0`} />
      </div>

      {/* Right Register Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative z-10">
        
        {/* Mobile Header elements */}
        <div className="lg:hidden mb-12 text-center">
          <h1 className={`text-3xl font-bold tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            DEV<span className="text-[#FF003C]">CONNECT</span>
          </h1>
          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Create your account.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'} border rounded-3xl p-8 sm:p-10 shadow-2xl`}
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sign up</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Create your account to join the community.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>First Name</label>
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                    <User className="w-5 h-5" />
                  </div>
                  <input 
                    type="text" 
                    placeholder="John"
                    className={`w-full py-3.5 pl-11 pr-4 rounded-xl border focus:outline-none transition-all ${
                      theme === 'dark' 
                        ? 'bg-[#141414] border-[#222] text-white placeholder:text-gray-600 focus:border-[#FF003C]' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:bg-white focus:ring-4 focus:ring-[#ff2a4b]/10'
                    }`}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe"
                  className={`w-full py-3.5 px-4 rounded-xl border focus:outline-none transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#141414] border-[#222] text-white placeholder:text-gray-600 focus:border-[#FF003C]' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:bg-white focus:ring-4 focus:ring-[#ff2a4b]/10'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Email</label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  placeholder="dev@example.com"
                  className={`w-full py-3.5 pl-11 pr-4 rounded-xl border focus:outline-none transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#141414] border-[#222] text-white placeholder:text-gray-600 focus:border-[#FF003C]' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:bg-white focus:ring-4 focus:ring-[#ff2a4b]/10'
                  }`}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Password</label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className={`w-full py-3.5 pl-11 pr-4 rounded-xl border focus:outline-none transition-all ${
                    theme === 'dark' 
                      ? 'bg-[#141414] border-[#222] text-white placeholder:text-gray-600 focus:border-[#FF003C]' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#ff2a4b] focus:bg-white focus:ring-4 focus:ring-[#ff2a4b]/10'
                  }`}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group shadow-lg ${
                theme === 'dark'
                  ? 'bg-[#FF003C] hover:bg-[#d40031] text-white shadow-[0_0_20px_rgba(255,0,60,0.3)] disabled:opacity-70'
                  : 'bg-[#ff2a4b] hover:bg-[#e62241] text-white shadow-[0_4px_14px_0_rgba(255,42,75,0.39)] hover:shadow-[0_6px_20px_rgba(255,42,75,0.23)] hover:-translate-y-0.5 disabled:opacity-70'
              }`}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center space-x-4">
            <span className={`h-px w-full ${theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}></span>
            <span className={`text-xs uppercase tracking-wider font-semibold ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Or</span>
            <span className={`h-px w-full ${theme === 'dark' ? 'bg-[#1f1f1f]' : 'bg-gray-200'}`}></span>
          </div>

          <button 
            type="button"
            className={`w-full mt-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-3 transition-all border ${
              theme === 'dark'
                ? 'bg-[#111] hover:bg-[#1a1a1a] border-[#222] text-white'
                : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-900 shadow-sm'
            }`}
          >
            <Github className="w-5 h-5" />
            Sign up with GitHub
          </button>

          <p className={`mt-8 text-center text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Already have an account?{' '}
            <Link to="/login" className={`transition-colors ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#ff3366]' : 'text-[#ff2a4b] hover:text-[#d41533]'}`}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
