import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Hexagon } from 'lucide-react';

const connectionSteps = [
  "Awakening the dev servers...",
  "Loading syntax highlighters...",
  "Syncing community components...",
  "Preparing the feed...",
  "Welcome to DevConnect."
];

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const totalTime = 3000; // 3 seconds total loading time
    const intervalTime = 50;
    const steps = totalTime / intervalTime;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(100, Math.floor((currentStep / steps) * 100));
      setProgress(newProgress);

      const newStepIndex = Math.min(connectionSteps.length - 1, Math.floor((newProgress / 100) * connectionSteps.length));
      setCurrentStepIndex(newStepIndex);

      if (newProgress >= 100) {
        clearInterval(interval);
        setTimeout(() => navigate('/login'), 500);
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-black relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF003C]/10 rounded-full blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="z-10 w-full max-w-md px-6 flex flex-col items-center">
        {/* Logo */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="flex flex-col items-center mb-12"
        >
          <div className="mb-6 w-16 h-16 bg-[#FF003C] rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(255,0,60,0.4)]">
            <Hexagon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tighter text-white uppercase">
            DEV<span className="text-[#FF003C]">CONNECT</span>
          </h1>
        </motion.div>

        {/* Status Text with AnimatePresence */}
        <div className="h-8 flex justify-center text-center w-full mb-6 relative">
          <AnimatePresence mode="wait">
            <motion.p
              key={currentStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-gray-400 text-sm absolute"
            >
              {connectionSteps[currentStepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-[280px]">
          <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-[#FF003C] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
