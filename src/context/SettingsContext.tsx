import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

export interface User {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  cover_image: string;
  bio: string;
  location: string;
  website_url: string;
  github_url: string;
  twitter_url: string;
  linkedin_url: string;
  followers: number;
  following: number;
  posts: number;
}

interface PrivacySettings {
  status: boolean;
  read: boolean;
  typing: boolean;
}

interface MediaSettings {
  autoDownload: boolean;
  saveToCameraRoll: boolean;
}

interface NotificationOptions {
  messages: boolean;
  likes: boolean;
  comments: boolean;
  friendRequests: boolean;
  sound: string;
  vibration: boolean;
}

interface SettingsContextType {
  theme: Theme;
  toggleTheme: () => void;
  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;
  globalMute: boolean;
  setGlobalMute: (val: boolean) => void;
  notifications: NotificationOptions;
  updateNotification: (key: keyof NotificationOptions, val: any) => void;
  privacy: PrivacySettings;
  updatePrivacy: (key: keyof PrivacySettings, val: boolean) => void;
  media: MediaSettings;
  updateMedia: (key: keyof MediaSettings, val: boolean) => void;
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isAuthLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [globalMute, setGlobalMute] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [notifications, setNotifications] = useState<NotificationOptions>({
    messages: true,
    likes: true,
    comments: true,
    friendRequests: true,
    sound: 'default',
    vibration: true,
  });
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    status: true,
    read: true,
    typing: true,
  });
  const [media, setMedia] = useState<MediaSettings>({
    autoDownload: false,
    saveToCameraRoll: true,
  });

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const updateNotification = (key: keyof NotificationOptions, val: any) => {
    setNotifications(prev => ({ ...prev, [key]: val }));
  };

  const updatePrivacy = (key: keyof PrivacySettings, val: boolean) => {
    setPrivacy(prev => ({ ...prev, [key]: val }));
  };

  const updateMedia = (key: keyof MediaSettings, val: boolean) => {
    setMedia(prev => ({ ...prev, [key]: val }));
  };

  useEffect(() => {
    fetch('/api/php/me.php', { credentials: 'include' })
      .then(res => res.json())
      .then(result => {
        if (result.status === 'success') {
            setCurrentUser(result.data);
        } else {
            setCurrentUser(null);
        }
      })
      .catch(e => {
        console.error('Session check failed:', e);
        setCurrentUser(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <SettingsContext.Provider value={{
      theme,
      toggleTheme,
      isSettingsOpen,
      openSettings: () => setIsSettingsOpen(true),
      closeSettings: () => setIsSettingsOpen(false),
      globalMute,
      setGlobalMute,
      notifications,
      updateNotification,
      privacy,
      updatePrivacy,
      media,
      updateMedia,
      currentUser,
      setCurrentUser,
      isAuthLoading
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
