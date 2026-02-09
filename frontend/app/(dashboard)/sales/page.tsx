"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Receipt, Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Sale = {
  id: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  createdBy: {
    fullName: string;
    role: string;
  };
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchSales();
  }, [filter, router]);

  const fetchSales = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const url = filter === "ALL"
        ? `${API_URL}/sales`
        : `${API_URL}/sales?status=${filter}`;

      const response = await fetch(url, {
        credentials: "include",
        cache: "no-store"
      });

      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error("Failed to fetch sales:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="warning"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "APPROVED":
        return <Badge variant="success"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "REJECTED":
        return <Badge variant="error"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gradient-gold mb-2">Sales</h1>
            <p className="text-text-secondary">Manage and track all sales transactions</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/sales/create")}>
            <Plus className="h-4 w-4" />
            Create Sale
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-3">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <Button
              key={status}
              variant={filter === status ? "primary" : "ghost"}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Sales List */}
        {sales.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="py-16 text-center">
              <Receipt className="mx-auto h-16 w-16 opacity-20 mb-4" />
              <p className="text-text-secondary">No sales found</p>
              <Button
                variant="primary"
                className="mt-4"
                onClick={() => router.push("/sales/create")}
              >
                <Plus className="h-4 w-4" />
                Create Your First Sale
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {sales.map((sale) => (
              <Card
                key={sale.id}
                variant="elevated"
                className="hover-lift cursor-pointer"
                onClick={() => router.push(`/sales/${sale.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold">{sale.createdBy.fullName}</h3>
                        <Badge variant="default" size="sm">{sale.createdBy.role}</Badge>
                        {getStatusBadge(sale.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-text-secondary">
                        <span>{sale.paymentMethod}</span>
                        <span>•</span>
                        <span>{new Date(sale.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black currency">
                        {formatCurrency(Number(sale.totalAmount))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
