"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, CheckCircle, XCircle, Image as ImageIcon, ExternalLink } from "lucide-react";
import { formatCurrency, apiFetch } from "@/lib/utils";

type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  status: string;
  notes?: string;
  receiptImageUrl?: string;
  createdAt: string;
  approvedAt?: string;
  createdBy: {
    fullName: string;
    email: string;
    role: string;
  };
  approvedBy?: {
    fullName: string;
  };
};

export default function ExpenseDetailPage() {
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id as string;

  useEffect(() => {
    fetchExpense();
  }, [expenseId]);

  const fetchExpense = async () => {
    try {
      const data = await apiFetch(`/expenses/${expenseId}`);
      setExpense(data);
    } catch (error) {
      console.error("Failed to fetch expense:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/expenses/${expenseId}/approve`, { method: "PATCH" });
      router.push("/expenses");
    } catch (error) {
      console.error("Failed to approve expense:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await apiFetch(`/expenses/${expenseId}/reject`, { method: "PATCH" });
      router.push("/expenses");
    } catch (error) {
      console.error("Failed to reject expense:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!expense) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Expense not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial p-6">
      <div className="container mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/expenses")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Expenses
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gradient-gold mb-2">Expense Details</h1>
              <p className="text-text-secondary">Expense ID: {expense.id.slice(0, 8)}</p>
            </div>
            <Badge
              variant={
                expense.status === "APPROVED"
                  ? "success"
                  : expense.status === "REJECTED"
                  ? "error"
                  : "warning"
              }
              size="lg"
            >
              {expense.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Amount Card */}
          <Card variant="elevated" className="bg-gradient-gold/5">
            <CardContent className="p-8 text-center">
              <p className="text-sm text-text-secondary mb-2">Total Amount</p>
              <p className="text-5xl font-black currency text-gradient-gold mb-4">
                {formatCurrency(Number(expense.amount))}
              </p>
              <Badge variant="default" size="lg">
                {expense.category}
              </Badge>
            </CardContent>
          </Card>

          {/* Receipt Image */}
          {expense.receiptImageUrl && (
            <Card variant="elevated">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-gold" />
                    Receipt Image
                  </CardTitle>
                  <a
                    href={expense.receiptImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gold hover:underline"
                  >
                    Open full size
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div
                  className="relative rounded-xl overflow-hidden border-2 border-border-subtle bg-bg-secondary cursor-pointer"
                  onClick={() => setImageExpanded(!imageExpanded)}
                >
                  <img
                    src={expense.receiptImageUrl}
                    alt="Receipt"
                    className={`w-full object-contain transition-all ${
                      imageExpanded ? "max-h-[600px]" : "max-h-48"
                    }`}
                  />
                  {!imageExpanded && (
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-secondary to-transparent" />
                  )}
                </div>
                <p className="text-xs text-text-tertiary mt-2 text-center">
                  Click to {imageExpanded ? "collapse" : "expand"}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Expense Info */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-4">
              <div>
                <p className="text-sm text-text-secondary mb-1">Description</p>
                <p className="font-semibold">{expense.description}</p>
              </div>

              {expense.notes && (
                <div>
                  <p className="text-sm text-text-secondary mb-1">Notes</p>
                  <p className="text-text-secondary">{expense.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Created By</p>
                  <p className="font-semibold">{expense.createdBy.fullName}</p>
                  <p className="text-sm text-text-secondary">{expense.createdBy.role}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Created At</p>
                  <p className="font-semibold">{new Date(expense.createdAt).toLocaleString()}</p>
                </div>
              </div>

              {expense.approvedBy && (
                <div className="border-t border-border-subtle pt-4">
                  <p className="text-sm text-text-secondary mb-1">
                    {expense.status === "APPROVED" ? "Approved By" : "Rejected By"}
                  </p>
                  <p className="font-semibold">{expense.approvedBy.fullName}</p>
                  {expense.approvedAt && (
                    <p className="text-sm text-text-secondary">
                      {new Date(expense.approvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          {expense.status === "PENDING" && (
            <Card variant="glass">
              <CardContent className="p-6">
                <p className="text-sm text-text-secondary mb-4">Approval Required</p>
                <div className="flex gap-3">
                  <Button
                    variant="success"
                    fullWidth
                    loading={actionLoading}
                    onClick={handleApprove}
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Expense
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    loading={actionLoading}
                    onClick={handleReject}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
