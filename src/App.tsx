/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Analytics } from '@vercel/analytics/react';
import LoadingScreen from './pages/LoadingScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import FeedScreen from './pages/FeedScreen';
import ProfileScreen from './pages/ProfileScreen';
import ProjectDetailScreen from './pages/ProjectDetailScreen';
import PostDetailScreen from './pages/PostDetailScreen';
import SavedScreen from './pages/SavedScreen';
import MessagesScreen from './pages/MessagesScreen';
import ActivityScreen from './pages/ActivityScreen';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import SettingsModal from './components/SettingsModal';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { currentUser, isAuthLoading } = useSettings();
  if (isAuthLoading) {
    return <div className="min-h-screen bg-black" />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
           <Route path="/" element={<LoadingScreen />} />
           <Route path="/login" element={<LoginScreen />} />
           <Route path="/register" element={<RegisterScreen />} />
           
           <Route path="/feed" element={<ProtectedRoute><FeedScreen /></ProtectedRoute>} />
           <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
           <Route path="/project/:id" element={<ProtectedRoute><ProjectDetailScreen /></ProtectedRoute>} />
           <Route path="/post/:id" element={<ProtectedRoute><PostDetailScreen /></ProtectedRoute>} />
           <Route path="/saved" element={<ProtectedRoute><SavedScreen /></ProtectedRoute>} />
           <Route path="/messages" element={<ProtectedRoute><MessagesScreen /></ProtectedRoute>} />
           <Route path="/activity" element={<ProtectedRoute><ActivityScreen /></ProtectedRoute>} />
           
           <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SettingsModal />
        <Analytics />
      </BrowserRouter>
    </SettingsProvider>
  );
}
