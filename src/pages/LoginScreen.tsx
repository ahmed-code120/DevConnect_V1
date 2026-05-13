import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Hexagon, ArrowRight, Github } from 'lucide-react';
import { motion } from 'motion/react';
import { useSettings } from '../context/SettingsContext';

export default function LoginScreen() {
  const navigate = useNavigate();
  const { theme, setCurrentUser } = useSettings();
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const email = (e.target as any).email.value;
    const password = (e.target as any).password.value;

    try {
      const response = await fetch('/api/php/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setCurrentUser(result.data.user);
        navigate('/feed');
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to connect to backend.');
    } finally {
      setLoading(false);
    }
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
            Connect, share code, and build alongside the best developers in the world.
          </p>
        </div>
        
        {/* Abstract Graphic */}
        <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-[#FF003C]/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className={`absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t ${theme === 'dark' ? 'from-[#050505] to-transparent' : 'from-gray-50 to-transparent'} z-0`} />
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative z-10">
        
        {/* Mobile Header elements */}
        <div className="lg:hidden mb-12 text-center">
          <h1 className={`text-3xl font-bold tracking-tighter uppercase ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            DEV<span className="text-[#FF003C]">CONNECT</span>
          </h1>
          <p className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Welcome back, developer.
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`w-full max-w-md ${theme === 'dark' ? 'bg-[#0a0a0a] border-[#1f1f1f]' : 'bg-white border-gray-200'} border rounded-3xl p-8 sm:p-10 shadow-2xl`}
        >
          <div className="mb-8 text-center lg:text-left">
            <h2 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Sign in</h2>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Enter your details to access your feed.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Email</label>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Mail className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  name="email"
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
              <div className="flex justify-between items-center">
                <label className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Password</label>
                <a href="#" className={`text-xs font-medium hover:underline transition-colors ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#ff3366]' : 'text-[#ff2a4b] hover:text-[#d41533]'}`}>
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  <Lock className="w-5 h-5" />
                </div>
                <input 
                  type="password" 
                  name="password"
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
              {loading ? 'Signing in...' : 'Sign In'}
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
            Continue with GitHub
          </button>

          <p className={`mt-8 text-center text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Don't have an account?{' '}
            <Link to="/register" className={`transition-colors ${theme === 'dark' ? 'text-[#FF003C] hover:text-[#ff3366]' : 'text-[#ff2a4b] hover:text-[#d41533]'}`}>
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
