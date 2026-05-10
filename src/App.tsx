/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoadingScreen from './pages/LoadingScreen';
import LoginScreen from './pages/LoginScreen';
import RegisterScreen from './pages/RegisterScreen';
import FeedScreen from './pages/FeedScreen';
import ProfileScreen from './pages/ProfileScreen';
import ProjectDetailScreen from './pages/ProjectDetailScreen';
import PostDetailScreen from './pages/PostDetailScreen';
import SavedScreen from './pages/SavedScreen';
import MessagesScreen from './pages/MessagesScreen';
import { SettingsProvider } from './context/SettingsContext';
import SettingsModal from './components/SettingsModal';

export default function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <Routes>
           <Route path="/" element={<LoadingScreen />} />
           <Route path="/login" element={<LoginScreen />} />
           <Route path="/register" element={<RegisterScreen />} />
           <Route path="/feed" element={<FeedScreen />} />
           <Route path="/profile" element={<ProfileScreen />} />
           <Route path="/project/:id" element={<ProjectDetailScreen />} />
           <Route path="/post/:id" element={<PostDetailScreen />} />
           <Route path="/saved" element={<SavedScreen />} />
           <Route path="/messages" element={<MessagesScreen />} />
           <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SettingsModal />
      </BrowserRouter>
    </SettingsProvider>
  );
}
