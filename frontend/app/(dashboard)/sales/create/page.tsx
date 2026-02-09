"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  sellingPrice: number;
  category: string;
  stock?: number;
};

type LineItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export default function CreateSalePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetchProducts();
  }, [router]);

  const fetchProducts = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const response = await fetch(`${API_URL}/products`, {
        credentials: "include",
        cache: "no-store"
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = (product: Product) => {
    const existing = lineItems.find((item) => item.productId === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setLineItems([
        ...lineItems,
        {
          productId: product.id,
          productName: product.name,
          quantity: 1,
          unitPrice: product.sellingPrice,
          subtotal: product.sellingPrice,
        },
      ]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeLineItem(productId);
      return;
    }

    setLineItems(
      lineItems.map((item) =>
        item.productId === productId
          ? { ...item, quantity, subtotal: item.unitPrice * quantity }
          : item
      )
    );
  };

  const removeLineItem = (productId: string) => {
    setLineItems(lineItems.filter((item) => item.productId !== productId));
  };

  const calculateTotal = () => {
    return lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const handleSubmit = async () => {
    if (lineItems.length === 0) {
      setError("Please add at least one product");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({
          items: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          paymentMethod,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create sale");
      }

      // Success - redirect to sales list
      router.push("/sales");
    } catch (err: any) {
      setError(err.message || "Failed to create sale");
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
            onClick={() => router.push("/sales")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sales
          </Button>
          <h1 className="text-3xl font-black text-gradient-gold mb-2">Create Sale</h1>
          <p className="text-text-secondary">Select products and complete the transaction</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Product Selection */}
          <Card variant="elevated">
            <CardHeader className="p-6 pb-4">
              <CardTitle>Select Products</CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {products.map((product) => {
                  const inCart = lineItems.find((item) => item.productId === product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-border-subtle p-4 hover-lift cursor-pointer"
                      onClick={() => addLineItem(product)}
                    >
                      <div>
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-text-secondary">{product.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black currency">
                          {formatCurrency(product.sellingPrice)}
                        </p>
                        {inCart && (
                          <Badge variant="gold" size="sm" className="mt-1">
                            In Cart: {inCart.quantity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cart & Checkout */}
          <div className="space-y-6">
            {/* Line Items */}
            <Card variant="elevated">
              <CardHeader className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Cart</CardTitle>
                  <Badge variant="gold">{lineItems.length} items</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {lineItems.length === 0 ? (
                  <div className="py-8 text-center text-text-secondary">
                    <ShoppingCart className="mx-auto h-12 w-12 opacity-20 mb-2" />
                    <p>No items in cart</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lineItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-3 rounded-lg border border-border-subtle p-4"
                      >
                        <div className="flex-1">
                          <p className="font-semibold">{item.productName}</p>
                          <p className="text-sm text-text-secondary">
                            {formatCurrency(item.unitPrice)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            +
                          </Button>
                        </div>
                        <div className="w-24 text-right">
                          <p className="font-black currency">{formatCurrency(item.subtotal)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4 text-error" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment & Total */}
            <Card variant="elevated">
              <CardHeader className="p-6 pb-4">
                <CardTitle>Payment</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["CASH", "TRANSFER", "CARD"].map((method) => (
                      <Button
                        key={method}
                        variant={paymentMethod === method ? "primary" : "secondary"}
                        size="sm"
                        onClick={() => setPaymentMethod(method)}
                      >
                        {method}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border-subtle pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-3xl font-black currency text-gradient-gold">
                      {formatCurrency(calculateTotal())}
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
                    loadingText="Creating Sale..."
                    onClick={handleSubmit}
                    disabled={lineItems.length === 0}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Complete Sale
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
