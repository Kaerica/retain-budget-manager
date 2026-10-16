
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import api from "../services/api";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthResponse {
  message: string;
  user: {
    id: number;
    username: string;
    name?: string;
    email: string;
  };
  token: string;
}

interface ProfileResponse {
  message?: string;
  user?: {
    id: number;
    username: string;
    name?: string;
    email: string;
  };
  id?: number;
  username?: string;
  name?: string;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  signin: (email: string, password: string) => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  signout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "retain-session";
const TOKEN_KEY = "retain-token";

function getSavedSession(): User | null {
  try {
    const saved = localStorage.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getSavedSession);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setUser(null);
      localStorage.removeItem(SESSION_KEY);
    }

    setLoading(false);
  }, []);

  function saveUser(sessionUser: User) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }

  function saveSession(response: AuthResponse) {
    const sessionUser: User = {
      id: response.user.id,
      name: response.user.name || response.user.username,
      email: response.user.email,
      role: "user",
    };

    localStorage.setItem(TOKEN_KEY, response.token);
    saveUser(sessionUser);
  }

  async function signup(
    name: string,
    email: string,
    password: string
  ): Promise<void> {
    const response = await api.post<AuthResponse>("signup/", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    saveSession(response.data);
  }

  async function signin(
    email: string,
    password: string
  ): Promise<void> {
    const response = await api.post<AuthResponse>("signin/", {
      email: email.trim().toLowerCase(),
      password,
    });

    saveSession(response.data);
  }

  async function updateProfile(
    name: string,
    email: string
  ): Promise<void> {
    const response = await api.patch<ProfileResponse>("profile/", {
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    const profile = response.data.user ?? response.data;

    if (
      typeof profile.id !== "number" ||
      typeof profile.email !== "string"
    ) {
      throw new Error("The server returned an invalid profile.");
    }

    const updatedUser: User = {
      id: profile.id,
      name: profile.name || profile.username || name.trim(),
      email: profile.email,
      role: user?.role ?? "user",
    };

    saveUser(updatedUser);
  }

  function signout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        loading,
        signup,
        signin,
        updateProfile,
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
