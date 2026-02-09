"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import ImageUpload from "@/components/ImageUpload";
import { ArrowLeft, Receipt } from "lucide-react";
import { apiFetch, formatCurrency } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Rent",
  "Supplies",
  "Staff",
  "Maintenance",
  "Marketing",
  "Transportation",
  "Other",
];

export default function CreateExpensePage() {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Supplies");
  const [notes, setNotes] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description || !amount) {
      setError("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({
          description,
          amount: amountNum,
          category,
          notes: notes || undefined,
          receiptImageUrl: receiptImageUrl || undefined,
        }),
      });

      // Success - redirect to expenses list
      router.push("/expenses");
    } catch (err: any) {
      setError(err.message || "Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-black text-gradient-gold mb-2">Add Expense</h1>
          <p className="text-text-secondary">Record a new business expense</p>
        </div>

        <Card variant="elevated">
          <CardHeader className="p-6 pb-4">
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Description"
                placeholder="e.g., Monthly electricity bill"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />

              <Input
                type="number"
                label="Amount"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0"
                step="0.01"
                required
              />

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      type="button"
                      variant={category === cat ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setCategory(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <Input
                label="Notes (Optional)"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              <ImageUpload
                onUpload={(url) => setReceiptImageUrl(url)}
                onOcrResult={(amount) => {
                  // Auto-fill the amount field
                  setAmount(amount.toString());
                }}
                label="Receipt Image (optional)"
              />

              {amount && parseFloat(amount) > 0 && (
                <div className="rounded-lg bg-gold/5 border border-gold/20 p-4">
                  <p className="text-sm text-text-secondary mb-1">Total Amount</p>
                  <p className="text-3xl font-black currency text-gradient-gold">
                    {formatCurrency(parseFloat(amount))}
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-error/10 border border-error/30 p-3 text-sm text-error">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  fullWidth
                  onClick={() => router.push("/expenses")}
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
                  <Receipt className="h-4 w-4" />
                  Create Expense
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
