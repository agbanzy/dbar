const API_BASE_URL = process.env.API_BASE_URL || "http://localhost:4000/api";
const EMAIL = process.env.SMOKE_EMAIL || "admin@digibar.local";
const PASSWORD = process.env.SMOKE_PASSWORD || "password123";

const log = (label, value) => {
  console.log(`\n${label}`);
  console.log(JSON.stringify(value, null, 2));
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    // ignore
  }

  return { ok: response.ok, status: response.status, data };
};

const run = async () => {
  const health = await request("/health");
  log("Health", health);

  const summary = await request("/dashboard/summary");
  log("Dashboard summary", summary);

  const register = await request("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: "Smoke Admin",
      email: EMAIL,
      password: PASSWORD,
      roleName: "Owner"
    })
  });
  log("Register", register);

  const login = await request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD })
  });
  log("Login", login);

  const token = login.data?.token;
  if (!token) {
    console.log("No token returned. Skipping authenticated tests.");
    return;
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  const inventoryItem = await request("/inventory/items", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: "Heineken Bottle", unit: "bottle", reorderLevel: 24 })
  });
  log("Create inventory item", inventoryItem);

  const inventoryItemId = inventoryItem.data?.id;
  if (!inventoryItemId) {
    console.log("No inventory item created. Skipping product/recipe tests.");
    return;
  }

  const product = await request("/products", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ name: "Heineken", price: 2500 })
  });
  log("Create product", product);

  const productId = product.data?.id;
  if (productId) {
    const recipe = await request(`/products/${productId}/recipes`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ inventoryItemId, quantityUsed: 1 })
    });
    log("Add recipe", recipe);
  }

  const sale = await request("/sales", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      paymentMethod: "CASH",
      items: [{ productId, quantity: 2 }]
    })
  });
  log("Create sale", sale);

  const saleId = sale.data?.id;
  if (saleId) {
    const approve = await request(`/sales/${saleId}/approve`, {
      method: "POST",
      headers: authHeaders
    });
    log("Approve sale", approve);
  }

  const expense = await request("/expenses", {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({ amount: 45000, category: "Generator Fuel" })
  });
  log("Create expense", expense);
};

run().catch((error) => {
  console.error("Smoke test failed", error);
  process.exit(1);
});
