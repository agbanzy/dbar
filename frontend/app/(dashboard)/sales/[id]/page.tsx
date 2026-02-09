"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type SaleItem = {
  id: string;
  product: {
    name: string;
    category: string;
  };
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type Sale = {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
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
  items: SaleItem[];
};

export default function SaleDetailPage() {
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const params = useParams();
  const saleId = params.id as string;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchSale();
  }, [router, saleId]);

  const fetchSale = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/sales/${saleId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setSale(data);
      }
    } catch (error) {
      console.error("Failed to fetch sale:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/sales/${saleId}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        router.push("/sales");
      }
    } catch (error) {
      console.error("Failed to approve sale:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/sales/${saleId}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        router.push("/sales");
      }
    } catch (error) {
      console.error("Failed to reject sale:", error);
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

  if (!sale) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-text-secondary">Sale not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-radial p-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/sales")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black text-gradient-gold mb-2">Sale Details</h1>
              <p className="text-text-secondary">Sale ID: {sale.id.slice(0, 8)}</p>
            </div>
            <Badge
              variant={
                sale.status === "APPROVED"
                  ? "success"
                  : sale.status === "REJECTED"
                  ? "error"
                  : "warning"
              }
              size="lg"
            >
              {sale.status}
            </Badge>
          </div>
        </div>

        <div className="space-y-6">
          {/* Sale Info */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Transaction Information</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary mb-1">Created By</p>
                  <p className="font-semibold">{sale.createdBy.fullName}</p>
                  <p className="text-sm text-text-secondary">{sale.createdBy.role}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Created At</p>
                  <p className="font-semibold">{new Date(sale.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Payment Method</p>
                  <Badge variant="default">{sale.paymentMethod}</Badge>
                </div>
                <div>
                  <p className="text-sm text-text-secondary mb-1">Total Amount</p>
                  <p className="text-2xl font-black currency text-gradient-gold">
                    {formatCurrency(Number(sale.totalAmount))}
                  </p>
                </div>
              </div>
              {sale.approvedBy && (
                <div className="border-t border-border-subtle pt-3 mt-3">
                  <p className="text-sm text-text-secondary mb-1">Approved By</p>
                  <p className="font-semibold">{sale.approvedBy.fullName}</p>
                  {sale.approvedAt && (
                    <p className="text-sm text-text-secondary">
                      {new Date(sale.approvedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Items ({sale.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-3">
                {sale.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-border-subtle p-4"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-text-secondary">{item.product.category}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm text-text-secondary">Qty</p>
                      <p className="font-bold">{item.quantity}</p>
                    </div>
                    <div className="text-center px-4">
                      <p className="text-sm text-text-secondary">Unit Price</p>
                      <p className="font-semibold currency">{formatCurrency(Number(item.unitPrice))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">Subtotal</p>
                      <p className="font-black currency">{formatCurrency(Number(item.subtotal))}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-subtle mt-6 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold">Total</span>
                  <span className="text-3xl font-black currency text-gradient-gold">
                    {formatCurrency(Number(sale.totalAmount))}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          {sale.status === "PENDING" && (
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
                    Approve Sale
                  </Button>
                  <Button
                    variant="danger"
                    fullWidth
                    loading={actionLoading}
                    onClick={handleReject}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject Sale
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
