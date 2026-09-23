"use client";

/**
 * ApexStrategy Enterprise — Auth Context
 * =====================================================
 * Lightweight client-side authentication. Credentials are
 * stored in localStorage (no server, no DB) — perfect for
 * the zero-setup simulation platform.
 *
 *   - Sign up: create a new user (name + email + password)
 *   - Log in: validate against stored credentials
 *   - Log out: clears the session
 *   - Persist session across reloads
 *
 * NOTE: This is a simulation/educational auth — passwords are
 * hashed with a simple obfuscation (NOT for production use).
 * The whole point is zero-setup: no backend, no email service,
 * no OAuth keys. Just open and play.
 */

import * as React from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  avatarColor: string;
}

interface StoredUser extends User {
  passwordHash: string;
}

interface AuthContextValue {
  user: User | null;
  isLoaded: boolean;
  signUp: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  signIn: (email: string, password: string) => { ok: boolean; error?: string };
  signOut: () => void;
  demoSignIn: () => { ok: boolean; error?: string };
  toast: (msg: string, type?: "default" | "success" | "error" | "warning") => void;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

const USERS_KEY = "apexstrategy:users:v1";
const SESSION_KEY = "apexstrategy:session:v1";

// ── Default demo account credentials (for easy demonstration) ──
export const DEMO_EMAIL = "demo@apexstrategy.com";
export const DEMO_PASSWORD = "demo1234";
export const DEMO_NAME = "Demo Executive";

const AVATAR_COLORS = [
  "#06b6d4", "#10b981", "#f59e0b", "#a855f7",
  "#ec4899", "#ef4444", "#3b82f6", "#14b8a6",
];

// Simple obfuscation (NOT secure — for simulation only)
function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h = h & 0xffffffff;
  }
  return h.toString(16);
}

function loadUsers(): StoredUser[] {
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  try {
    window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (e) {
    console.warn("Failed to save users:", e);
  }
}

function toPublic(u: StoredUser): User {
  const { passwordHash, ...pub } = u;
  void passwordHash;
  return pub;
}

// Ensure the demo account exists in localStorage. Called on mount.
function ensureDemoUser() {
  try {
    const users = loadUsers();
    if (!users.some((u) => u.email === DEMO_EMAIL)) {
      const demoUser: StoredUser = {
        id: "user-demo-apexstrategy",
        name: DEMO_NAME,
        email: DEMO_EMAIL,
        passwordHash: hash(DEMO_PASSWORD),
        createdAt: Date.now(),
        avatarColor: "#06b6d4",
      };
      users.push(demoUser);
      saveUsers(users);
    }
  } catch (e) {
    console.warn("Failed to seed demo user:", e);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Toast helper
  const toast = React.useCallback(
    (msg: string, type: "default" | "success" | "error" | "warning" = "default") => {
      if (typeof window !== "undefined") {
        import("sonner").then((s) => {
          if (type === "success") s.toast.success(msg);
          else if (type === "error") s.toast.error(msg);
          else if (type === "warning") s.toast.warning(msg);
          else s.toast(msg);
        });
      }
    },
    []
  );

  // Load session on mount + seed demo user
  React.useEffect(() => {
    // Seed the demo account so "Demo Login" always works
    ensureDemoUser();
    try {
      const sessionRaw = window.localStorage.getItem(SESSION_KEY);
      if (sessionRaw) {
        const session = JSON.parse(sessionRaw);
        if (session && session.userId) {
          const users = loadUsers();
          const found = users.find((u) => u.id === session.userId);
          if (found) {
            setUser(toPublic(found));
          } else {
            window.localStorage.removeItem(SESSION_KEY);
          }
        }
      }
    } catch (e) {
      console.warn("Session load failed:", e);
    }
    setIsLoaded(true);
  }, []);

  const signUp = React.useCallback(
    (name: string, email: string, password: string): { ok: boolean; error?: string } => {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedName) return { ok: false, error: "Please enter your name" };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        return { ok: false, error: "Please enter a valid email address" };
      }
      if (password.length < 4) {
        return { ok: false, error: "Password must be at least 4 characters" };
      }
      const users = loadUsers();
      if (users.some((u) => u.email === trimmedEmail)) {
        return { ok: false, error: "An account with this email already exists" };
      }
      const newUser: StoredUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: trimmedName,
        email: trimmedEmail,
        passwordHash: hash(password),
        createdAt: Date.now(),
        avatarColor: AVATAR_COLORS[users.length % AVATAR_COLORS.length],
      };
      users.push(newUser);
      saveUsers(users);
      const pub = toPublic(newUser);
      setUser(pub);
      try {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: pub.id }));
      } catch (e) {
        console.warn("Session save failed:", e);
      }
      return { ok: true };
    },
    []
  );

  const signIn = React.useCallback(
    (email: string, password: string): { ok: boolean; error?: string } => {
      const trimmedEmail = email.trim().toLowerCase();
      if (!trimmedEmail || !password) {
        return { ok: false, error: "Please enter email and password" };
      }
      const users = loadUsers();
      const found = users.find((u) => u.email === trimmedEmail);
      if (!found) {
        return { ok: false, error: "No account found with this email" };
      }
      if (found.passwordHash !== hash(password)) {
        return { ok: false, error: "Incorrect password" };
      }
      const pub = toPublic(found);
      setUser(pub);
      try {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: pub.id }));
      } catch (e) {
        console.warn("Session save failed:", e);
      }
      return { ok: true };
    },
    []
  );

  const signOut = React.useCallback(() => {
    setUser(null);
    try {
      window.localStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.warn("Session clear failed:", e);
    }
  }, []);

  // One-click demo login — uses the pre-seeded demo account
  const demoSignIn = React.useCallback((): { ok: boolean; error?: string } => {
    // Make sure the demo user exists
    ensureDemoUser();
    const users = loadUsers();
    const found = users.find((u) => u.email === DEMO_EMAIL);
    if (!found) {
      return { ok: false, error: "Demo account not available" };
    }
    const pub = toPublic(found);
    setUser(pub);
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: pub.id }));
    } catch (e) {
      console.warn("Session save failed:", e);
    }
    return { ok: true };
  }, []);

  const value: AuthContextValue = {
    user,
    isLoaded,
    signUp,
    signIn,
    signOut,
    demoSignIn,
    toast,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
