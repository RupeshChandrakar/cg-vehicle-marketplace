'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { CustomerUser } from './api';

// localStorage, not an httpOnly cookie — same deliberate simplification the
// admin app uses (see apps/admin/src/lib/auth-context.tsx).
const ACCESS_TOKEN_KEY = 'cg_customer_access_token';
const REFRESH_TOKEN_KEY = 'cg_customer_refresh_token';
const USER_KEY = 'cg_customer_user';

interface CustomerAuthState {
  user: CustomerUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (user: CustomerUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: CustomerUser) => void;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthState | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // localStorage isn't available during SSR — hydrate post-mount, same
    // pattern as admin/auth-context.tsx.
    const storedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setUser(JSON.parse(storedUser) as CustomerUser);
        setAccessToken(storedToken);
      } catch {
        // Corrupted storage — treat as logged out.
      }
    }
    setIsLoading(false);
  }, []);

  function login(newUser: CustomerUser, newAccessToken: string, refreshToken: string): void {
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

  // Refreshes the cached user (e.g. after PATCH /users/me) without touching
  // tokens — a plain profile edit shouldn't rotate the session.
  function updateUser(newUser: CustomerUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }

  return (
    <CustomerAuthContext.Provider
      value={{ user, accessToken, isLoading, login, updateUser, logout }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthState {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
