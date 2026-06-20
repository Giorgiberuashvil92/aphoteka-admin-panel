"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loginMobile, registerMobile, fetchCurrentUser } from "@/lib/api/auth";
import {
  clearSession,
  getAccessToken,
  getStoredUser,
  setAccessToken,
  setStoredUser,
} from "@/lib/auth/session";
import type { AuthUser, AuthView, RegisterPayload } from "@/types/auth";
import { AuthModal } from "@/components/auth/AuthModal";

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  isAuthenticated: boolean;
  openAuth: (view?: AuthView) => void;
  closeAuth: () => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [view, setView] = useState<AuthView>("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getAccessToken();
      const cached = getStoredUser();

      if (!token) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }

      const live = await fetchCurrentUser(token);
      if (cancelled) return;

      if (live) {
        setUser(live);
        setStoredUser(live);
      } else if (cached) {
        setUser(cached);
      } else {
        clearSession();
        setUser(null);
      }
      setReady(true);
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const openAuth = useCallback((nextView: AuthView = "login") => {
    setView(nextView);
    setError(null);
    setModalOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setModalOpen(false);
    setError(null);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) return;
    const live = await fetchCurrentUser(token);
    if (live) {
      setUser(live);
      setStoredUser(live);
    }
  }, []);

  const handleLogin = useCallback(
    async (emailOrPhone: string, password: string) => {
      setLoading(true);
      setError(null);
      const result = await loginMobile(emailOrPhone, password);
      setLoading(false);

      if (!result.success || !result.user || !result.accessToken) {
        setError(result.message);
        return;
      }

      setAccessToken(result.accessToken);
      setStoredUser(result.user);
      setUser(result.user);
      closeAuth();
    },
    [closeAuth],
  );

  const handleRegister = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      setError(null);
      const result = await registerMobile(payload);
      setLoading(false);

      if (!result.success || !result.user || !result.accessToken) {
        setError(result.message);
        return;
      }

      setAccessToken(result.accessToken);
      setStoredUser(result.user);
      setUser(result.user);
      closeAuth();
    },
    [closeAuth],
  );

  const value = useMemo(
    () => ({
      user,
      ready,
      isAuthenticated: Boolean(user),
      openAuth,
      closeAuth,
      logout,
      refreshUser,
    }),
    [user, ready, openAuth, closeAuth, logout, refreshUser],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {ready && (
        <AuthModal
          open={modalOpen}
          view={view}
          loading={loading}
          error={error}
          onClose={closeAuth}
          onViewChange={(nextView) => {
            setView(nextView);
            setError(null);
          }}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
