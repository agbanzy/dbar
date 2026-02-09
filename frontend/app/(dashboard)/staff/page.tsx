"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  X,
  AlertTriangle,
} from "lucide-react";
import { apiFetch, formatDate, getInitials } from "@/lib/utils";

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

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<StaffMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const data = await apiFetch("/users");
      setStaff(data);
    } catch (err: any) {
      console.error("Failed to fetch staff:", err);
      setError(err.message || "Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      await apiFetch(`/users/${deleteTarget.id}`, { method: "DELETE" });
      setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Failed to delete staff:", err);
      setError(err.message || "Failed to delete staff member");
    } finally {
      setDeleteLoading(false);
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "Owner":
      case "System Admin":
        return "gold" as const;
      case "Supervisor":
        return "info" as const;
      case "Accountant":
        return "warning" as const;
      case "Inventory Manager":
        return "default" as const;
      case "Waitress":
        return "success" as const;
      default:
        return "default" as const;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-gradient-gold mb-2">
              Staff Management
            </h1>
            <p className="text-text-secondary">
              Manage your team members and their roles
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push("/staff/create")}
          >
            <Plus className="h-4 w-4" />
            Add Staff
          </Button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg bg-error/10 border border-error/30 p-3 text-sm text-error"
          >
            {error}
          </motion.div>
        )}

        {/* Staff List */}
        {staff.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="py-16 text-center">
              <Users className="mx-auto h-16 w-16 opacity-20 mb-4" />
              <p className="text-text-secondary text-lg mb-2">
                No staff members found
              </p>
              <p className="text-text-tertiary text-sm mb-6">
                Add your first team member to get started
              </p>
              <Button
                variant="primary"
                onClick={() => router.push("/staff/create")}
              >
                <Plus className="h-4 w-4" />
                Add Staff Member
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hidden md:block"
            >
              <Card variant="elevated" padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border-subtle">
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-text-secondary">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-text-secondary">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((member, index) => (
                        <motion.tr
                          key={member.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border-subtle last:border-0 hover:bg-bg-tertiary/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold font-bold text-sm">
                                {getInitials(member.fullName)}
                              </div>
                              <span className="font-semibold text-text-primary">
                                {member.fullName}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {member.email || member.phone || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={getRoleBadgeVariant(member.role)}>
                              {member.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              variant={
                                member.status === "ACTIVE" ? "success" : "error"
                              }
                              dot
                            >
                              {member.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-text-secondary text-sm">
                            {formatDate(member.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  router.push(`/staff/${member.id}`)
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDeleteTarget(member)}
                                className="text-error hover:text-error hover:bg-error/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Mobile Cards */}
            <div className="md:hidden grid gap-4">
              {staff.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card variant="elevated">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 text-gold font-bold text-sm">
                            {getInitials(member.fullName)}
                          </div>
                          <div>
                            <p className="font-semibold text-text-primary">
                              {member.fullName}
                            </p>
                            <p className="text-sm text-text-secondary">
                              {member.email || member.phone || "—"}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            member.status === "ACTIVE" ? "success" : "error"
                          }
                          dot
                        >
                          {member.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadgeVariant(member.role)}>
                            {member.role}
                          </Badge>
                          <span className="text-xs text-text-tertiary">
                            {formatDate(member.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/staff/${member.id}`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(member)}
                            className="text-error hover:text-error hover:bg-error/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !deleteLoading && setDeleteTarget(null)}
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
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleteLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-text-secondary mb-6">
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-text-primary">
                  {deleteTarget.fullName}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setDeleteTarget(null)}
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
