"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { LogIn, Wine, Eye, EyeOff, Mail, Lock, Phone } from "lucide-react";
import {
  signInWithCustomToken,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@digibar.app";

type LoginMode = "staff" | "admin";

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>("staff");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const router = useRouter();

  const fetchProfile = async (idToken: string) => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${idToken}` },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to fetch profile");
    }

    const user = await response.json();

    localStorage.setItem("token", idToken);
    localStorage.setItem("user", JSON.stringify(user));

    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 12);
    document.cookie = `token=${idToken}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;

    router.push("/dashboard");
  };

  const loginWithPhone = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, passcode }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Login failed");
    }

    const data = await response.json();
    if (!data.customToken) {
      throw new Error("Missing login token");
    }

    const credential = await signInWithCustomToken(auth, data.customToken);
    const idToken = await credential.user.getIdToken();
    await fetchProfile(idToken);
  };

  const loginWithAdmin = async () => {
    const adminEmail = email.trim().toLowerCase();
    if (adminEmail !== ADMIN_EMAIL) {
      throw new Error("Only the admin email is allowed");
    }

    const credential = await signInWithEmailAndPassword(auth, adminEmail, password);
    const idToken = await credential.user.getIdToken();
    await fetchProfile(idToken);
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (mode === "admin") {
        await loginWithAdmin();
      } else {
        await loginWithPhone();
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminReset = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const targetEmail = (email || ADMIN_EMAIL).trim().toLowerCase();
      if (targetEmail !== ADMIN_EMAIL) {
        throw new Error("Only the admin email can be reset here");
      }
      await sendPasswordResetEmail(auth, targetEmail);
      setInfo("Password reset email sent to the admin inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError("");
    setInfo("");
    setShowSecret(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-radial">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-light to-gold-dark shadow-glow mb-4">
            <Wine className="h-8 w-8 text-black" />
          </div>
          <h1 className="text-4xl font-black text-gradient-gold mb-2">DigiBar</h1>
          <p className="text-text-secondary">Welcome back!</p>
        </div>

        {/* Login Card */}
        <div className="bg-surface-elevated rounded-2xl shadow-xl border border-border-subtle p-8 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => switchMode("staff")}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                mode === "staff"
                  ? "bg-gold/10 text-gold border-gold/30"
                  : "text-text-secondary border-border-subtle hover:text-text-primary"
              }`}
            >
              Staff Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("admin")}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                mode === "admin"
                  ? "bg-info/10 text-info border-info/30"
                  : "text-text-secondary border-border-subtle hover:text-text-primary"
              }`}
            >
              Admin Login
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {mode === "staff" ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter phone number"
                      required
                      autoComplete="tel"
                      disabled={loading}
                      className="w-full h-14 pl-12 pr-4 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Passcode
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                    <input
                      type={showSecret ? "text" : "password"}
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      placeholder="Enter passcode"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full h-14 pl-12 pr-14 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                      tabIndex={-1}
                    >
                      {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => router.push("/reset")}
                      className="text-xs text-text-tertiary hover:text-gold transition-colors"
                      disabled={loading}
                    >
                      Forgot passcode?
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={ADMIN_EMAIL}
                      required
                      autoComplete="email"
                      disabled={loading}
                      className="w-full h-14 pl-12 pr-4 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-info focus:ring-2 focus:ring-info/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                    <input
                      type={showSecret ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                      className="w-full h-14 pl-12 pr-14 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-info focus:ring-2 focus:ring-info/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret(!showSecret)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                      tabIndex={-1}
                    >
                      {showSecret ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={handleAdminReset}
                      className="text-xs text-text-tertiary hover:text-info transition-colors"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-error/10 border border-error/30 p-4 text-sm text-error text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Info Message */}
            {info && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-success/10 border border-success/30 p-4 text-sm text-success text-center"
              >
                {info}
              </motion.div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              fullWidth
              loading={loading}
              loadingText="Signing in..."
              className="h-14 rounded-xl text-lg font-bold bg-gradient-to-r from-gold-light to-gold-dark hover:shadow-glow"
            >
              <LogIn className="h-5 w-5" />
              {mode === "admin" ? "Sign In as Admin" : "Sign In"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-tertiary mt-6">
          DigiBar Luxury Management &copy; 2026
        </p>
      </motion.div>
    </div>
  );
}
