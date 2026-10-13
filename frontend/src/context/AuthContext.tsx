import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signup: (name: string, email: string, password: string) => boolean;
  signin: (email: string, password: string) => boolean;
  signout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = "retain-users";
const SESSION_KEY = "retain-session";

function getSavedUsers(): Array<User & { password: string }> {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
  } catch {
    return [];
  }
}

function getSavedSession(): User | null {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedSession);

  function signup(
    name: string,
    email: string,
    password: string
  ): boolean {
    const users = getSavedUsers();
    const normalizedEmail = email.trim().toLowerCase();

    if (users.some((savedUser) => savedUser.email === normalizedEmail)) {
      return false;
    }

    const newUser: User & { password: string } = {
      id: Date.now(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "user",
    };

    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));

    const sessionUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: "user",
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);

    return true;
  }

  function signin(email: string, password: string): boolean {
    const normalizedEmail = email.trim().toLowerCase();

    const savedUser = getSavedUsers().find(
      (candidate) =>
        candidate.email === normalizedEmail &&
        candidate.password === password
    );

    if (!savedUser) {
      return false;
    }

    const sessionUser: User = {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      role: savedUser.role,
    };

    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);

    return true;
  }

  function signout() {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        signup,
        signin,
        signout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}