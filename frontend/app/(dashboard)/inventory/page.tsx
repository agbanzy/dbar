"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Package, Plus, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  costPrice: number;
  reorderLevel: number;
  category: string;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchInventory();
  }, [router]);

  const fetchInventory = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/inventory`, {
        credentials: "include",
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorderLevel;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="xl" />
      </div>
    );
  }

  const lowStockItems = items.filter(isLowStock);
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  return (
    <div className="min-h-screen bg-gradient-radial p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-gradient-gold mb-2">Inventory</h1>
            <p className="text-text-secondary">Track and manage stock levels</p>
          </div>
          <Button variant="primary" onClick={() => router.push("/inventory/stock-in")}>
            <Plus className="h-4 w-4" />
            Stock In
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-sm text-text-secondary mb-2">Total Items</p>
              <p className="text-3xl font-black">{items.length}</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-sm text-text-secondary mb-2">Low Stock Items</p>
              <p className="text-3xl font-black text-error">{lowStockItems.length}</p>
            </CardContent>
          </Card>
          <Card variant="elevated">
            <CardContent className="p-6">
              <p className="text-sm text-text-secondary mb-2">Total Value</p>
              <p className="text-3xl font-black currency text-gradient-gold">
                {formatCurrency(totalValue)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <Card variant="elevated" className="mb-6 border-error/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="h-5 w-5 text-error" />
                <p className="font-bold text-error">
                  {lowStockItems.length} items are running low on stock
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <Badge key={item.id} variant="error">
                    {item.name}: {item.quantity} {item.unit}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Inventory List */}
        <Card variant="elevated">
          <CardHeader className="p-6 pb-4">
            <CardTitle>All Items</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {items.length === 0 ? (
              <div className="py-16 text-center">
                <Package className="mx-auto h-16 w-16 opacity-20 mb-4" />
                <p className="text-text-secondary">No inventory items found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border-subtle">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                        Item
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-secondary">
                        Category
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                        Cost Price
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-text-secondary">
                        Value
                      </th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-text-secondary">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-border-subtle hover:bg-bg-tertiary/50"
                      >
                        <td className="py-4 px-4">
                          <p className="font-semibold">{item.name}</p>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="default" size="sm">
                            {item.category}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <span className={isLowStock(item) ? "text-error font-bold" : "font-semibold"}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right currency">
                          {formatCurrency(item.costPrice)}
                        </td>
                        <td className="py-4 px-4 text-right font-black currency">
                          {formatCurrency(item.quantity * item.costPrice)}
                        </td>
                        <td className="py-4 px-4 text-center">
                          {isLowStock(item) ? (
                            <Badge variant="error" size="sm">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              In Stock
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
