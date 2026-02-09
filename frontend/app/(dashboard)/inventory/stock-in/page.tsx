"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ArrowLeft, Package, Plus } from "lucide-react";
import { formatCurrency, apiFetch } from "@/lib/utils";
import ImageUpload from "@/components/ImageUpload";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
};

type StockEntry = {
  itemId: string;
  itemName: string;
  quantity: number;
  costPrice: number;
};

export default function StockInPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [entries, setEntries] = useState<StockEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await apiFetch("/inventory");
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  const addEntry = (item: InventoryItem) => {
    const existing = entries.find((e) => e.itemId === item.id);
    if (!existing) {
      setEntries([
        ...entries,
        {
          itemId: item.id,
          itemName: item.name,
          quantity: 0,
          costPrice: 0,
        },
      ]);
    }
  };

  const updateEntry = (itemId: string, field: "quantity" | "costPrice", value: number) => {
    setEntries(
      entries.map((entry) =>
        entry.itemId === itemId ? { ...entry, [field]: value } : entry
      )
    );
  };

  const removeEntry = (itemId: string) => {
    setEntries(entries.filter((e) => e.itemId !== itemId));
  };

  const getTotalCost = () => {
    return entries.reduce((sum, entry) => sum + entry.quantity * entry.costPrice, 0);
  };

  const handleSubmit = async () => {
    const validEntries = entries.filter((e) => e.quantity > 0 && e.costPrice > 0);

    if (validEntries.length === 0) {
      setError("Please add at least one valid entry");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await apiFetch("/inventory/stock-in", {
        method: "POST",
        body: JSON.stringify({
          items: validEntries.map((e) => ({
            itemId: e.itemId,
            quantity: e.quantity,
            costPrice: e.costPrice,
            receiptUrl: receiptImageUrl || undefined,
          })),
          notes,
          receiptUrl: receiptImageUrl || undefined,
        }),
      });

      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to record stock in");
    } finally {
      setSubmitting(false);
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
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/inventory")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
          <h1 className="text-3xl font-black text-gradient-gold mb-2">Stock In</h1>
          <p className="text-text-secondary">Add stock to inventory items</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Item Selection */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Select Items</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {items.map((item) => {
                  const hasEntry = entries.some((e) => e.itemId === item.id);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-border-subtle p-4 hover-lift cursor-pointer"
                      onClick={() => !hasEntry && addEntry(item)}
                    >
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-text-secondary">
                          Current: {item.quantity} {item.unit}
                        </p>
                      </div>
                      {hasEntry ? (
                        <Button variant="ghost" size="sm" disabled>
                          Added
                        </Button>
                      ) : (
                        <Button variant="secondary" size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Stock Entries */}
          <div className="space-y-6">
            <Card variant="elevated">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Stock Entries</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {entries.length === 0 ? (
                  <div className="py-8 text-center text-text-secondary">
                    <Package className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>No items selected</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <div
                        key={entry.itemId}
                        className="rounded-lg border border-border-subtle p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">{entry.itemName}</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEntry(entry.itemId)}
                          >
                            Remove
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            label="Quantity"
                            placeholder="0"
                            value={entry.quantity || ""}
                            onChange={(e) =>
                              updateEntry(entry.itemId, "quantity", Number(e.target.value))
                            }
                            min="0"
                            step="1"
                          />
                          <Input
                            type="number"
                            label="Cost Price"
                            placeholder="0.00"
                            value={entry.costPrice || ""}
                            onChange={(e) =>
                              updateEntry(entry.itemId, "costPrice", Number(e.target.value))
                            }
                            min="0"
                            step="0.01"
                          />
                        </div>
                        {entry.quantity > 0 && entry.costPrice > 0 && (
                          <div className="text-right">
                            <p className="text-sm text-text-secondary">Subtotal</p>
                            <p className="font-black currency">
                              {formatCurrency(entry.quantity * entry.costPrice)}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Receipt Upload */}
            <Card variant="elevated">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Receipt</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <ImageUpload
                  onUpload={(url) => setReceiptImageUrl(url)}
                  folder="stock-receipts"
                  label="Upload purchase receipt (optional)"
                />
              </CardContent>
            </Card>

            {/* Summary & Submit */}
            <Card variant="elevated">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <Input
                  label="Notes (Optional)"
                  placeholder="Purchase order number, supplier, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <div className="border-t border-border-subtle pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold">Total Cost</span>
                    <span className="text-3xl font-black currency text-gradient-gold">
                      {formatCurrency(getTotalCost())}
                    </span>
                  </div>

                  {error && (
                    <div className="mb-4 rounded-lg bg-error/10 border border-error/30 p-3 text-sm text-error">
                      {error}
                    </div>
                  )}

                  <Button
                    variant="primary"
                    fullWidth
                    loading={submitting}
                    loadingText="Recording Stock In..."
                    onClick={handleSubmit}
                    disabled={entries.length === 0}
                  >
                    <Package className="h-4 w-4" />
                    Record Stock In
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
