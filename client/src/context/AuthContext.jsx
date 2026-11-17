import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api } from '../api/endpoints';
import { isMockMode } from '../api/client';

const AuthContext = createContext(null);
const LANG_STORAGE_KEY = 'scamshield_lang';

function getStoredLang() {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(LANG_STORAGE_KEY) || '';
    }
  } catch (_) {}
  return '';
}

function saveStoredLang(lang) {
  try {
    if (typeof localStorage !== 'undefined' && lang) {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  } catch (_) {}
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem('scamshield_token') : null;
    } catch (_) {
      return null;
    }
  });
  const [language, setLanguage] = useState(() => getStoredLang() || 'en');
  const [loading, setLoading] = useState(true);
  const initRanRef = useRef(false);

  // Initialize user session once (guarded against StrictMode duplicate network calls)
  useEffect(() => {
    if (initRanRef.current) return;
    initRanRef.current = true;

    async function initAuth() {
      try {
        const storedToken = localStorage.getItem('scamshield_token');
        const storedLang = getStoredLang();
        if (storedToken) {
          setToken(storedToken);
          const data = await api.auth.getMe();
          if (data?.user) {
            setUser(data.user);
            const activeLang = storedLang || data.user.preferred_language || 'en';
            setLanguage(activeLang);
            saveStoredLang(activeLang);
          }
        } else if (isMockMode) {
          const data = await api.auth.getMe();
          if (data?.user) {
            setUser(data.user);
            const activeLang = storedLang || data.user.preferred_language || 'en';
            setLanguage(activeLang);
            saveStoredLang(activeLang);
            localStorage.setItem('scamshield_token', 'mock_jwt_token_demo');
            setToken('mock_jwt_token_demo');
          }
        }
      } catch (err) {
        console.warn('Auth initialization error:', err);
        localStorage.removeItem('scamshield_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  // Sync document language attribute & localStorage
  useEffect(() => {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = language;
    }
    saveStoredLang(language);
  }, [language]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await api.auth.login({ email, password });
      if (data?.token && data?.user) {
        localStorage.setItem('scamshield_token', data.token);
        setToken(data.token);
        setUser(data.user);
        if (data.user.preferred_language && !getStoredLang()) {
          setLanguage(data.user.preferred_language);
          saveStoredLang(data.user.preferred_language);
        }
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password, preferred_language = 'en') => {
    setLoading(true);
    try {
      const data = await api.auth.signup({ name, email, password, preferred_language });
      if (data?.token && data?.user) {
        localStorage.setItem('scamshield_token', data.token);
        setToken(data.token);
        setUser(data.user);
        setLanguage(preferred_language);
        saveStoredLang(preferred_language);
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('scamshield_token');
    localStorage.removeItem('scamshield_user');
    setToken(null);
    setUser(null);
  };

  const updateLanguage = async (newLang) => {
    setLanguage(newLang);
    saveStoredLang(newLang);
    if (user) {
      try {
        const data = await api.auth.updateMe({ preferred_language: newLang });
        if (data?.user) {
          setUser(data.user);
        }
      } catch (e) {
        console.warn('Failed to persist language preference on server:', e);
      }
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    language,
    loading,
    login,
    signup,
    logout,
    updateLanguage
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
