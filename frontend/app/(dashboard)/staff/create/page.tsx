"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, UserPlus } from "lucide-react";
import { apiFetch } from "@/lib/utils";

const ROLES = [
  "Waitress",
  "Supervisor",
  "Inventory Manager",
  "Accountant",
  "Owner",
  "System Admin",
];

export default function CreateStaffPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Waitress");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const isAdmin = role === "System Admin";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (isAdmin) {
      if (!email.trim()) {
        setError("Admin email is required");
        return;
      }
      if (!password || password.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    } else {
      if (!phone.trim()) {
        setError("Phone number is required");
        return;
      }
      if (!passcode || passcode.length < 4) {
        setError("Passcode must be at least 4 characters");
        return;
      }
      if (passcode !== confirmPasscode) {
        setError("Passcodes do not match");
        return;
      }
    }

    setLoading(true);

    try {
      const body: Record<string, string | undefined> = {
        fullName: fullName.trim(),
        username: username.trim() || undefined,
        role,
      };

      if (isAdmin) {
        body.email = email.trim();
        body.password = password;
      } else {
        body.phone = phone.trim();
        body.passcode = passcode;
      }

      await apiFetch("/users", {
        method: "POST",
        body: JSON.stringify(body),
      });

      setSuccess("Staff member created successfully!");
      setTimeout(() => {
        router.push("/staff");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to create staff member");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial p-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/staff")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff
          </Button>
          <h1 className="text-3xl font-black text-gradient-gold mb-2">
            Add Staff Member
          </h1>
          <p className="text-text-secondary">
            Create a new team member account
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Staff Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="e.g., John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Username (Optional)"
                    placeholder="e.g., johndoe"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />

                  {isAdmin ? (
                    <Input
                      type="email"
                      label="Admin Email"
                      placeholder="e.g., agbane6@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  ) : (
                    <Input
                      type="tel"
                      label="Phone Number"
                      placeholder="e.g., +2348012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  )}
                </div>

                {isAdmin ? (
                  <Input
                    type="password"
                    label="Admin Password"
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    error={
                      password.length > 0 && password.length < 6
                        ? "Password must be at least 6 characters"
                        : undefined
                    }
                  />
                ) : (
                  <>
                    <Input
                      type="password"
                      label="Passcode"
                      placeholder="At least 4 characters"
                      value={passcode}
                      onChange={(e) => setPasscode(e.target.value)}
                      required
                      error={
                        passcode.length > 0 && passcode.length < 4
                          ? "Passcode must be at least 4 characters"
                          : undefined
                      }
                    />
                    <Input
                      type="password"
                      label="Confirm Passcode"
                      placeholder="Re-enter passcode"
                      value={confirmPasscode}
                      onChange={(e) => setConfirmPasscode(e.target.value)}
                      required
                      error={
                        confirmPasscode.length > 0 && confirmPasscode !== passcode
                          ? "Passcodes do not match"
                          : undefined
                      }
                    />
                  </>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium text-text-primary">
                    Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-border-subtle bg-bg-secondary px-4 py-2 text-base text-text-primary transition-all duration-200 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Success Message */}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-success/10 border border-success/30 p-3 text-sm text-success"
                  >
                    {success}
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-lg bg-error/10 border border-error/30 p-3 text-sm text-error"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    fullWidth
                    onClick={() => router.push("/staff")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    loading={loading}
                    loadingText="Creating..."
                  >
                    <UserPlus className="h-4 w-4" />
                    Create Staff Member
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
