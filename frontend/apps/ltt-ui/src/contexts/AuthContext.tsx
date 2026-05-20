import { createContext, useContext, useState, ReactNode } from "react";

export interface AuthUser {
  userId: string;
  roles: string[];
  kbnnId: string;
  displayName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isMaker: boolean;
  isChecker: boolean;
  isApprover: boolean;
  isViewer: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Dev mock user stored in localStorage
const DEV_USER_KEY = "kb_dev_user";

function getDevUser(): AuthUser {
  try {
    const stored = localStorage.getItem(DEV_USER_KEY);
    if (stored) return JSON.parse(stored) as AuthUser;
  } catch {
    // ignore parse errors
  }
  return {
    userId: "user-maker-001",
    roles: ["PAY_OUT_MAKER"],
    kbnnId: "HN001",
    displayName: "Nguyễn Văn A (Maker)",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(getDevUser());

  const setUser = (u: AuthUser | null) => {
    setUserState(u);
    if (u) localStorage.setItem(DEV_USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(DEV_USER_KEY);
  };

  const value: AuthContextValue = {
    user,
    setUser,
    isMaker: user?.roles.includes("PAY_OUT_MAKER") ?? false,
    isChecker: user?.roles.includes("PAY_OUT_CHECKER") ?? false,
    isApprover: user?.roles.includes("PAY_OUT_APPROVER") ?? false,
    isViewer: user?.roles.includes("PAY_OUT_VIEWER") ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
