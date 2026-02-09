"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  ArrowLeft,
  Save,
  Trash2,
  X,
  AlertTriangle,
  Shield,
} from "lucide-react";
import { apiFetch } from "@/lib/utils";

const ROLES = [
  "Waitress",
  "Supervisor",
  "Inventory Manager",
  "Accountant",
  "Owner",
  "System Admin",
];

type StaffMember = {
  id: string;
  fullName: string;
  email?: string | null;
  username?: string;
  phone?: string | null;
  role: string;
  status: string;
  createdAt: string;
};

export default function EditStaffPage() {
  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [newPasscode, setNewPasscode] = useState("");
  const [role, setRole] = useState("Waitress");
  const [status, setStatus] = useState("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passcodeLoading, setPasscodeLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const isAdmin = role === "System Admin";

  useEffect(() => {
    fetchStaff();
  }, [staffId]);

  const fetchStaff = async () => {
    try {
      const users: StaffMember[] = await apiFetch("/users");
      const found = users.find((u) => u.id === staffId);

      if (found) {
        setStaff(found);
        setFullName(found.fullName);
        setEmail(found.email || "");
        setUsername(found.username || "");
        setPhone(found.phone || "");
        setRole(found.role);
        setStatus(found.status);
      } else {
        setError("Staff member not found");
      }
    } catch (err: any) {
      console.error("Failed to fetch staff:", err);
      setError(err.message || "Failed to load staff member");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }

    if (isAdmin && !email.trim()) {
      setError("Admin email is required");
      return;
    }

    if (!isAdmin && !phone.trim()) {
      setError("Phone number is required");
      return;
    }

    setSaving(true);

    try {
      const body: Record<string, string | undefined> = {
        fullName: fullName.trim(),
        username: username.trim() || undefined,
        role,
        status,
      };

      if (isAdmin) {
        body.email = email.trim();
      } else {
        body.phone = phone.trim();
      }

      await apiFetch(`/users/${staffId}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });

      setSuccess("Staff member updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update staff member");
    } finally {
      setSaving(false);
    }
  };

  const handlePasscodeReset = async () => {
    setError("");
    setSuccess("");

    if (!newPasscode || newPasscode.length < 4) {
      setError("Passcode must be at least 4 characters");
      return;
    }

    setPasscodeLoading(true);

    try {
      await apiFetch(`/users/${staffId}/passcode`, {
        method: "POST",
        body: JSON.stringify({ passcode: newPasscode }),
      });
      setSuccess("Passcode updated successfully!");
      setNewPasscode("");
    } catch (err: any) {
      setError(err.message || "Failed to reset passcode");
    } finally {
      setPasscodeLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      await apiFetch(`/users/${staffId}`, { method: "DELETE" });
      router.push("/staff");
    } catch (err: any) {
      console.error("Failed to delete staff:", err);
      setError(err.message || "Failed to delete staff member");
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!staff && !loading) {
    return (
      <div className="min-h-screen bg-gradient-radial p-6">
        <div className="container mx-auto max-w-3xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/staff")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Staff
          </Button>
          <Card variant="elevated">
            <CardContent className="py-16 text-center">
              <Shield className="mx-auto h-16 w-16 opacity-20 mb-4" />
              <p className="text-text-secondary text-lg">
                Staff member not found
              </p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => router.push("/staff")}
              >
                Return to Staff List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gradient-gold mb-2">
                Edit Staff Member
              </h1>
              <p className="text-text-secondary">
                Update details for {staff?.fullName}
              </p>
            </div>
            <Badge
              variant={status === "ACTIVE" ? "success" : "error"}
              size="lg"
              dot
            >
              {status}
            </Badge>
          </div>
        </motion.div>

        <div className="space-y-6">
          {/* Edit Form */}
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

                  {!isAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        type="password"
                        label="Reset Passcode"
                        placeholder="At least 4 characters"
                        value={newPasscode}
                        onChange={(e) => setNewPasscode(e.target.value)}
                        error={
                          newPasscode.length > 0 && newPasscode.length < 4
                            ? "Passcode must be at least 4 characters"
                            : undefined
                        }
                      />
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="secondary"
                          fullWidth
                          onClick={handlePasscodeReset}
                          loading={passcodeLoading}
                          loadingText="Resetting..."
                        >
                          Reset Passcode
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-primary">
                        Status
                      </label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={
                            status === "ACTIVE" ? "success" : "secondary"
                          }
                          fullWidth
                          onClick={() => setStatus("ACTIVE")}
                        >
                          Active
                        </Button>
                        <Button
                          type="button"
                          variant={
                            status === "DISABLED" ? "danger" : "secondary"
                          }
                          fullWidth
                          onClick={() => setStatus("DISABLED")}
                        >
                          Disabled
                        </Button>
                      </div>
                    </div>
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
                      loading={saving}
                      loadingText="Saving..."
                    >
                      <Save className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Danger Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated" className="border-error/20">
              <CardHeader className="p-6 pb-4">
                <CardTitle className="text-error">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <p className="text-text-secondary text-sm mb-4">
                  Permanently delete this staff member account. This action
                  cannot be undone.
                </p>
                <Button
                  variant="danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Staff Member
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !deleteLoading && setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl bg-surface-elevated border border-border-subtle shadow-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error/10">
                    <AlertTriangle className="h-5 w-5 text-error" />
                  </div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Delete Staff Member
                  </h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-text-secondary mb-6">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-text-primary">
                  {staff?.fullName}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleteLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={handleDelete}
                  loading={deleteLoading}
                  loadingText="Deleting..."
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
