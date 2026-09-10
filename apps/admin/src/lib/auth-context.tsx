'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { StaffUser } from './api';
import { getAdminAuthEventName } from './api';

// localStorage (not an httpOnly cookie) is a deliberate simplification for
// this internal-only admin tool — revisit if this panel ever becomes
// internet-facing or handles higher-sensitivity data.
const ACCESS_TOKEN_KEY = 'cg_admin_access_token';
const REFRESH_TOKEN_KEY = 'cg_admin_refresh_token';
const USER_KEY = 'cg_admin_user';

interface AuthState {
  user: StaffUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (user: StaffUser, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StaffUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function syncFromStorage(): void {
      const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser) as StaffUser);
          setAccessToken(storedToken);
          return;
        } catch {
          // Corrupted storage — fall through to logged-out state below.
        }
      }

      setUser(null);
      setAccessToken(null);
    }

    // localStorage isn't available during Next.js's server render, so
    // hydrating auth state has to happen post-mount in an effect — the
    // isLoading flag covers the one frame this takes.
    syncFromStorage();

    const authEventName = getAdminAuthEventName();
    window.addEventListener('storage', syncFromStorage);
    window.addEventListener(authEventName, syncFromStorage);
    // Marks the one-frame post-mount hydration (see the comment above) as
    // done — genuinely synchronizing with localStorage, an external system,
    // not a plain derived value.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(false);

    return () => {
      window.removeEventListener('storage', syncFromStorage);
      window.removeEventListener(authEventName, syncFromStorage);
    };
  }, []);

  function login(newUser: StaffUser, newAccessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
    setAccessToken(newAccessToken);
  }

  function logout(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
    setAccessToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
