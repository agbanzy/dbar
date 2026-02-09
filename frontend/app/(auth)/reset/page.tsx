"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { Phone, ShieldCheck, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";

export default function ResetPasscodePage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [debugOtp, setDebugOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const router = useRouter();

  const requestOtp = async () => {
    setError("");
    setInfo("");
    setDebugOtp("");
    setLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/passcode/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send OTP");
      }

      const data = await response.json();
      setInfo("OTP sent via SMS. Enter it below to reset your passcode.");
      // Only capture debug OTP in local development
      if (process.env.NODE_ENV === 'development') {
        if (data.debugOtp) {
          setDebugOtp(data.debugOtp);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to request OTP");
    } finally {
      setLoading(false);
    }
  };

  const resetPasscode = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      if (passcode !== confirmPasscode) {
        throw new Error("Passcodes do not match");
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/auth/passcode/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, newPasscode: passcode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reset passcode");
      }

      setInfo("Passcode reset successfully. You can sign in now.");
      setOtp("");
      setPasscode("");
      setConfirmPasscode("");
    } catch (err: any) {
      setError(err.message || "Failed to reset passcode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-radial">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-surface-elevated rounded-2xl shadow-xl border border-border-subtle p-8 space-y-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gradient-gold">Reset Passcode</h1>
              <p className="text-sm text-text-tertiary">SMS OTP required</p>
            </div>
          </div>

          <div className="space-y-4">
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

            <Button
              type="button"
              fullWidth
              loading={loading}
              loadingText="Sending OTP..."
              onClick={requestOtp}
              className="h-12 rounded-xl text-sm font-bold bg-gold/20 text-gold hover:bg-gold/30"
            >
              <ShieldCheck className="h-4 w-4" />
              Send OTP
            </Button>
          </div>

          <form onSubmit={resetPasscode} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                required
                disabled={loading}
                className="w-full h-12 px-4 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                New Passcode
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                <input
                  type={showSecret ? "text" : "password"}
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="Enter new passcode"
                  required
                  disabled={loading}
                  className="w-full h-12 pl-12 pr-14 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary transition-colors"
                  tabIndex={-1}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                Confirm Passcode
              </label>
              <input
                type={showSecret ? "text" : "password"}
                value={confirmPasscode}
                onChange={(e) => setConfirmPasscode(e.target.value)}
                placeholder="Confirm passcode"
                required
                disabled={loading}
                className="w-full h-12 px-4 rounded-xl bg-surface text-text-primary border-2 border-border-subtle focus:border-gold focus:ring-2 focus:ring-gold/20 transition-all outline-none text-lg placeholder:text-text-tertiary disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

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

            {/* Debug OTP removed for production security */}

            <Button
              type="submit"
              fullWidth
              loading={loading}
              loadingText="Resetting..."
              className="h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-gold-light to-gold-dark hover:shadow-glow"
            >
              Reset Passcode
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
