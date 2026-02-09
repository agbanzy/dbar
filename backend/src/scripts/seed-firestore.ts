import dotenv from "dotenv";
dotenv.config();

import { adminAuth } from "../lib/firebase-admin";
import {
  db,
  usersCol,
  rolesCol,
  productsCol,
  inventoryItemsCol,
  stockBatchesCol,
  stockMovementsCol,
} from "../lib/firestore";
import { setUserRole } from "../lib/auth";

async function main() {
  console.log("🌱 Starting Firestore seed...\n");

  // ===== ROLES & PERMISSIONS =====
  console.log("📋 Creating roles with permissions...");

  const permissionMap: Record<string, string[]> = {
    Waitress: ["sales.create", "sales.view", "products.view"],
    Supervisor: ["sales.view", "sales.approve", "inventory.view", "expenses.view"],
    "Inventory Manager": [
      "inventory.view", "inventory.manage", "inventory.count",
      "products.view", "products.manage",
    ],
    Accountant: ["expenses.create", "expenses.view", "expenses.approve", "dashboard.view"],
    Owner: [
      "sales.view", "sales.approve", "inventory.view", "expenses.view",
      "expenses.approve", "dashboard.view", "products.view", "users.manage",
    ],
    "System Admin": [
      "users.manage", "audit.view", "sales.view", "sales.approve",
      "inventory.view", "inventory.manage", "expenses.view", "expenses.approve",
      "products.manage", "dashboard.view",
    ],
  };

  for (const [roleName, permissions] of Object.entries(permissionMap)) {
    const roleId = roleName.toLowerCase().replace(/\s+/g, "-");
    await rolesCol.doc(roleId).set({
      name: roleName,
      permissions,
      createdAt: new Date(),
    });
  }
  console.log(`✅ Created ${Object.keys(permissionMap).length} roles\n`);

  // ===== SAMPLE USERS =====
  console.log("👥 Creating sample users in Firebase Auth + Firestore...");

  const users = [
    { fullName: "Ada Okafor", email: "ada@digibar.ng", username: "ada", role: "Waitress" },
    { fullName: "Chidi Nwankwo", email: "chidi@digibar.ng", username: "chidi", role: "Supervisor" },
    { fullName: "Ngozi Adeyemi", email: "ngozi@digibar.ng", username: "ngozi", role: "Inventory Manager" },
    { fullName: "Tunde Ogunleye", email: "tunde@digibar.ng", username: "tunde", role: "Accountant" },
    { fullName: "Emeka Eze", email: "emeka@digibar.ng", username: "emeka", role: "Owner" },
    { fullName: "Amina Bello", email: "admin@digibar.ng", username: "admin", role: "System Admin" },
  ];

  for (const userData of users) {
    try {
      // Check if user already exists in Firebase Auth
      let uid: string;
      try {
        const existing = await adminAuth.getUserByEmail(userData.email);
        uid = existing.uid;
        console.log(`  ℹ️  ${userData.fullName} already exists in Firebase Auth`);
      } catch {
        // Create new Firebase Auth user
        const userRecord = await adminAuth.createUser({
          email: userData.email,
          password: "password123",
          displayName: userData.fullName,
        });
        uid = userRecord.uid;
      }

      // Set role custom claim
      await setUserRole(uid, userData.role);

      // Create/update Firestore user doc
      const now = new Date();
      await usersCol.doc(uid).set({
        fullName: userData.fullName,
        email: userData.email,
        username: userData.username,
        phone: null,
        role: userData.role,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      }, { merge: true });

      console.log(`  ✅ ${userData.fullName} (${userData.role})`);
    } catch (err: any) {
      console.error(`  ❌ Failed to create ${userData.fullName}:`, err.message);
    }
  }

  // ===== PRODUCTS =====
  console.log("\n🍺 Creating products...");

  const products = [
    // Beers
    { id: "guinness", name: "Guinness Foreign Extra Stout", sku: "BEER-GUINNESS", price: 800 },
    { id: "star", name: "Star Lager", sku: "BEER-STAR", price: 500 },
    { id: "trophy", name: "Trophy Lager", sku: "BEER-TROPHY", price: 450 },
    { id: "goldberg", name: "Goldberg Lager", sku: "BEER-GOLDBERG", price: 500 },
    { id: "hero", name: "Hero Lager", sku: "BEER-HERO", price: 550 },
    { id: "gulder", name: "Gulder Lager", sku: "BEER-GULDER", price: 600 },
    { id: "harp", name: "Harp Lager", sku: "BEER-HARP", price: 550 },
    { id: "life", name: "Life Continental Lager", sku: "BEER-LIFE", price: 500 },
    // Malts
    { id: "malta-guinness", name: "Malta Guinness", sku: "MALT-GUINEA", price: 400 },
    { id: "maltina", name: "Maltina", sku: "MALT-MALTINA", price: 350 },
    { id: "amstel-malta", name: "Amstel Malta", sku: "MALT-AMSTEL", price: 350 },
    { id: "grand-malt", name: "Grand Malt", sku: "MALT-GRAND", price: 300 },
    { id: "beta-malt", name: "Beta Malt", sku: "MALT-BETA", price: 300 },
    // Soft drinks
    { id: "coke", name: "Coca-Cola", sku: "SOFT-COKE", price: 300 },
    { id: "fanta", name: "Fanta Orange", sku: "SOFT-FANTA", price: 300 },
    { id: "sprite", name: "Sprite", sku: "SOFT-SPRITE", price: 300 },
    { id: "pepsi", name: "Pepsi", sku: "SOFT-PEPSI", price: 300 },
    { id: "7up", name: "7UP", sku: "SOFT-7UP", price: 300 },
    { id: "lacasera", name: "La Casera", sku: "SOFT-LACASERA", price: 250 },
    { id: "bigi", name: "Bigi Cola", sku: "SOFT-BIGI", price: 200 },
    { id: "chapman", name: "Chapman Cocktail", sku: "COCKTAIL-CHAPMAN", price: 1500 },
  ];

  // Inventory items
  const inventoryItems = [
    { id: "guinness-bottle", name: "Guinness Bottle", unit: "bottle", reorderLevel: 50 },
    { id: "star-bottle", name: "Star Bottle", unit: "bottle", reorderLevel: 100 },
    { id: "trophy-bottle", name: "Trophy Bottle", unit: "bottle", reorderLevel: 80 },
    { id: "goldberg-bottle", name: "Goldberg Bottle", unit: "bottle", reorderLevel: 80 },
    { id: "hero-bottle", name: "Hero Bottle", unit: "bottle", reorderLevel: 60 },
    { id: "gulder-bottle", name: "Gulder Bottle", unit: "bottle", reorderLevel: 70 },
    { id: "harp-bottle", name: "Harp Bottle", unit: "bottle", reorderLevel: 60 },
    { id: "life-bottle", name: "Life Bottle", unit: "bottle", reorderLevel: 60 },
    { id: "malta-guinness-can", name: "Malta Guinness Can", unit: "can", reorderLevel: 100 },
    { id: "maltina-bottle", name: "Maltina Bottle", unit: "bottle", reorderLevel: 100 },
    { id: "amstel-malta-can", name: "Amstel Malta Can", unit: "can", reorderLevel: 80 },
    { id: "grand-malt-bottle", name: "Grand Malt Bottle", unit: "bottle", reorderLevel: 80 },
    { id: "beta-malt-can", name: "Beta Malt Can", unit: "can", reorderLevel: 80 },
    { id: "coca-cola-bottle", name: "Coca-Cola Bottle", unit: "bottle", reorderLevel: 150 },
    { id: "fanta-bottle", name: "Fanta Bottle", unit: "bottle", reorderLevel: 150 },
    { id: "sprite-bottle", name: "Sprite Bottle", unit: "bottle", reorderLevel: 150 },
    { id: "pepsi-bottle", name: "Pepsi Bottle", unit: "bottle", reorderLevel: 100 },
    { id: "7up-bottle", name: "7UP Bottle", unit: "bottle", reorderLevel: 100 },
    { id: "la-casera-bottle", name: "La Casera Bottle", unit: "bottle", reorderLevel: 80 },
    { id: "bigi-cola-bottle", name: "Bigi Cola Bottle", unit: "bottle", reorderLevel: 100 },
    { id: "grenadine-syrup", name: "Grenadine Syrup", unit: "ml", reorderLevel: 2000 },
    { id: "angostura-bitters", name: "Angostura Bitters", unit: "ml", reorderLevel: 500 },
    { id: "cucumber", name: "Cucumber", unit: "piece", reorderLevel: 20 },
    { id: "lemon", name: "Lemon", unit: "piece", reorderLevel: 30 },
    { id: "orange", name: "Orange", unit: "piece", reorderLevel: 30 },
    { id: "ice-cubes", name: "Ice Cubes", unit: "kg", reorderLevel: 50 },
  ];

  // Recipes (product -> inventory mappings)
  const recipes: Record<string, { inventoryItemId: string; quantityUsed: number; inventoryItemName: string }[]> = {
    guinness: [{ inventoryItemId: "guinness-bottle", quantityUsed: 1, inventoryItemName: "Guinness Bottle" }],
    star: [{ inventoryItemId: "star-bottle", quantityUsed: 1, inventoryItemName: "Star Bottle" }],
    trophy: [{ inventoryItemId: "trophy-bottle", quantityUsed: 1, inventoryItemName: "Trophy Bottle" }],
    goldberg: [{ inventoryItemId: "goldberg-bottle", quantityUsed: 1, inventoryItemName: "Goldberg Bottle" }],
    hero: [{ inventoryItemId: "hero-bottle", quantityUsed: 1, inventoryItemName: "Hero Bottle" }],
    gulder: [{ inventoryItemId: "gulder-bottle", quantityUsed: 1, inventoryItemName: "Gulder Bottle" }],
    harp: [{ inventoryItemId: "harp-bottle", quantityUsed: 1, inventoryItemName: "Harp Bottle" }],
    life: [{ inventoryItemId: "life-bottle", quantityUsed: 1, inventoryItemName: "Life Bottle" }],
    "malta-guinness": [{ inventoryItemId: "malta-guinness-can", quantityUsed: 1, inventoryItemName: "Malta Guinness Can" }],
    maltina: [{ inventoryItemId: "maltina-bottle", quantityUsed: 1, inventoryItemName: "Maltina Bottle" }],
    "amstel-malta": [{ inventoryItemId: "amstel-malta-can", quantityUsed: 1, inventoryItemName: "Amstel Malta Can" }],
    "grand-malt": [{ inventoryItemId: "grand-malt-bottle", quantityUsed: 1, inventoryItemName: "Grand Malt Bottle" }],
    "beta-malt": [{ inventoryItemId: "beta-malt-can", quantityUsed: 1, inventoryItemName: "Beta Malt Can" }],
    coke: [{ inventoryItemId: "coca-cola-bottle", quantityUsed: 1, inventoryItemName: "Coca-Cola Bottle" }],
    fanta: [{ inventoryItemId: "fanta-bottle", quantityUsed: 1, inventoryItemName: "Fanta Bottle" }],
    sprite: [{ inventoryItemId: "sprite-bottle", quantityUsed: 1, inventoryItemName: "Sprite Bottle" }],
    pepsi: [{ inventoryItemId: "pepsi-bottle", quantityUsed: 1, inventoryItemName: "Pepsi Bottle" }],
    "7up": [{ inventoryItemId: "7up-bottle", quantityUsed: 1, inventoryItemName: "7UP Bottle" }],
    lacasera: [{ inventoryItemId: "la-casera-bottle", quantityUsed: 1, inventoryItemName: "La Casera Bottle" }],
    bigi: [{ inventoryItemId: "bigi-cola-bottle", quantityUsed: 1, inventoryItemName: "Bigi Cola Bottle" }],
    chapman: [
      { inventoryItemId: "fanta-bottle", quantityUsed: 1, inventoryItemName: "Fanta Bottle" },
      { inventoryItemId: "sprite-bottle", quantityUsed: 1, inventoryItemName: "Sprite Bottle" },
      { inventoryItemId: "grenadine-syrup", quantityUsed: 50, inventoryItemName: "Grenadine Syrup" },
      { inventoryItemId: "angostura-bitters", quantityUsed: 10, inventoryItemName: "Angostura Bitters" },
      { inventoryItemId: "cucumber", quantityUsed: 0.25, inventoryItemName: "Cucumber" },
      { inventoryItemId: "lemon", quantityUsed: 0.5, inventoryItemName: "Lemon" },
      { inventoryItemId: "orange", quantityUsed: 0.5, inventoryItemName: "Orange" },
      { inventoryItemId: "ice-cubes", quantityUsed: 0.2, inventoryItemName: "Ice Cubes" },
    ],
  };

  // Write products
  for (const product of products) {
    await productsCol.doc(product.id).set({
      name: product.name,
      sku: product.sku,
      price: product.price,
      recipes: recipes[product.id] || [],
      createdAt: new Date(),
    });
  }
  console.log(`✅ Created ${products.length} products with recipes`);

  // Write inventory items
  console.log("\n📦 Creating inventory items...");
  for (const item of inventoryItems) {
    await inventoryItemsCol.doc(item.id).set({
      name: item.name,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      createdAt: new Date(),
    });
  }
  console.log(`✅ Created ${inventoryItems.length} inventory items`);

  // ===== INITIAL STOCK =====
  console.log("\n📦 Adding initial stock...");

  const stockItems = [
    { inventoryId: "guinness-bottle", qty: 100, cost: 600 },
    { inventoryId: "star-bottle", qty: 200, cost: 350 },
    { inventoryId: "trophy-bottle", qty: 150, cost: 300 },
    { inventoryId: "goldberg-bottle", qty: 150, cost: 350 },
    { inventoryId: "hero-bottle", qty: 100, cost: 400 },
    { inventoryId: "gulder-bottle", qty: 120, cost: 450 },
    { inventoryId: "harp-bottle", qty: 100, cost: 400 },
    { inventoryId: "life-bottle", qty: 100, cost: 350 },
    { inventoryId: "malta-guinness-can", qty: 150, cost: 250 },
    { inventoryId: "maltina-bottle", qty: 150, cost: 200 },
    { inventoryId: "amstel-malta-can", qty: 120, cost: 200 },
    { inventoryId: "grand-malt-bottle", qty: 120, cost: 180 },
    { inventoryId: "beta-malt-can", qty: 120, cost: 180 },
    { inventoryId: "coca-cola-bottle", qty: 300, cost: 180 },
    { inventoryId: "fanta-bottle", qty: 300, cost: 180 },
    { inventoryId: "sprite-bottle", qty: 300, cost: 180 },
    { inventoryId: "pepsi-bottle", qty: 200, cost: 180 },
    { inventoryId: "7up-bottle", qty: 200, cost: 180 },
    { inventoryId: "la-casera-bottle", qty: 150, cost: 150 },
    { inventoryId: "bigi-cola-bottle", qty: 150, cost: 120 },
    { inventoryId: "grenadine-syrup", qty: 5000, cost: 15 },
    { inventoryId: "angostura-bitters", qty: 1000, cost: 25 },
    { inventoryId: "cucumber", qty: 50, cost: 100 },
    { inventoryId: "lemon", qty: 60, cost: 50 },
    { inventoryId: "orange", qty: 60, cost: 50 },
    { inventoryId: "ice-cubes", qty: 100, cost: 200 },
  ];

  const batch = db.batch();
  for (const stock of stockItems) {
    // Create stock batch
    const batchRef = stockBatchesCol.doc();
    batch.set(batchRef, {
      inventoryItemId: stock.inventoryId,
      quantity: stock.qty,
      unitCost: stock.cost,
      supplier: "Initial Stock",
      receivedAt: new Date(),
    });

    // Create stock movement (IN)
    const movementRef = stockMovementsCol.doc();
    batch.set(movementRef, {
      inventoryItemId: stock.inventoryId,
      type: "IN",
      quantity: stock.qty,
      reason: "Initial stock",
      createdById: "system",
      createdAt: new Date(),
    });
  }
  await batch.commit();
  console.log(`✅ Added initial stock for ${stockItems.length} items`);

  console.log("\n✅ Firestore seed completed successfully!");
  console.log("\n📝 Login credentials (email / password):");
  console.log("- Waitress: ada@digibar.ng / password123");
  console.log("- Supervisor: chidi@digibar.ng / password123");
  console.log("- Inventory Manager: ngozi@digibar.ng / password123");
  console.log("- Accountant: tunde@digibar.ng / password123");
  console.log("- Owner: emeka@digibar.ng / password123");
  console.log("- Admin: admin@digibar.ng / password123");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  });
