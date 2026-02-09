"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth } from "./firebase";

/** Centralized token storage – keeps cookie and localStorage in sync */
const storeToken = (token: string) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("token", token);
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

const clearToken = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const idToken = await fbUser.getIdToken();
        setToken(idToken);

        // Fetch user profile from backend
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
          const res = await fetch(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const userData = await res.json();
            const userProfile: User = {
              id: userData.id,
              fullName: userData.fullName,
              email: userData.email,
              role: userData.role,
              username: userData.username,
            };
            setUser(userProfile);
            localStorage.setItem("user", JSON.stringify(userProfile));
            storeToken(idToken);
          }
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
        }
      } else {
        setFirebaseUser(null);
        setToken(null);
        setUser(null);
        localStorage.removeItem("user");
        clearToken();
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await credential.user.getIdToken();
    setToken(idToken);

    // Fetch user profile
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Failed to fetch profile");
    }

    const userData = await res.json();
    const userProfile: User = {
      id: userData.id,
      fullName: userData.fullName,
      email: userData.email,
      role: userData.role,
      username: userData.username,
    };
    setUser(userProfile);
    localStorage.setItem("user", JSON.stringify(userProfile));
    storeToken(idToken);
  };

  const logout = async () => {
    await signOut(auth);
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    localStorage.removeItem("user");
    clearToken();
  };

  const getToken = async (): Promise<string | null> => {
    if (firebaseUser) {
      return await firebaseUser.getIdToken();
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, token, login, logout, isLoading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
