import { PrismaClient } from "@prisma/client";
import { hashPasscode } from "../lib/auth";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // ===== ROLES & PERMISSIONS =====
  console.log("\n📋 Creating roles and permissions...");

  const permissions = await Promise.all([
    // Sales permissions
    prisma.permission.upsert({
      where: { key: "sales.create" },
      update: {},
      create: { key: "sales.create", description: "Create new sales" }
    }),
    prisma.permission.upsert({
      where: { key: "sales.view" },
      update: {},
      create: { key: "sales.view", description: "View sales" }
    }),
    prisma.permission.upsert({
      where: { key: "sales.approve" },
      update: {},
      create: { key: "sales.approve", description: "Approve or reject sales" }
    }),
    // Inventory permissions
    prisma.permission.upsert({
      where: { key: "inventory.view" },
      update: {},
      create: { key: "inventory.view", description: "View inventory" }
    }),
    prisma.permission.upsert({
      where: { key: "inventory.manage" },
      update: {},
      create: { key: "inventory.manage", description: "Manage inventory (stock-in, adjustments)" }
    }),
    prisma.permission.upsert({
      where: { key: "inventory.count" },
      update: {},
      create: { key: "inventory.count", description: "Perform stock counts" }
    }),
    // Expense permissions
    prisma.permission.upsert({
      where: { key: "expenses.create" },
      update: {},
      create: { key: "expenses.create", description: "Create expenses" }
    }),
    prisma.permission.upsert({
      where: { key: "expenses.view" },
      update: {},
      create: { key: "expenses.view", description: "View expenses" }
    }),
    prisma.permission.upsert({
      where: { key: "expenses.approve" },
      update: {},
      create: { key: "expenses.approve", description: "Approve or reject expenses" }
    }),
    // Product permissions
    prisma.permission.upsert({
      where: { key: "products.view" },
      update: {},
      create: { key: "products.view", description: "View products" }
    }),
    prisma.permission.upsert({
      where: { key: "products.manage" },
      update: {},
      create: { key: "products.manage", description: "Create and manage products" }
    }),
    // Dashboard permissions
    prisma.permission.upsert({
      where: { key: "dashboard.view" },
      update: {},
      create: { key: "dashboard.view", description: "View dashboard and reports" }
    }),
    // Admin permissions
    prisma.permission.upsert({
      where: { key: "users.manage" },
      update: {},
      create: { key: "users.manage", description: "Manage users and roles" }
    }),
    prisma.permission.upsert({
      where: { key: "audit.view" },
      update: {},
      create: { key: "audit.view", description: "View audit logs" }
    })
  ]);

  console.log(`✅ Created ${permissions.length} permissions`);

  // Create roles
  const roles = {
    waitress: await prisma.role.upsert({
      where: { name: "Waitress" },
      update: {},
      create: { name: "Waitress" }
    }),
    supervisor: await prisma.role.upsert({
      where: { name: "Supervisor" },
      update: {},
      create: { name: "Supervisor" }
    }),
    inventoryManager: await prisma.role.upsert({
      where: { name: "Inventory Manager" },
      update: {},
      create: { name: "Inventory Manager" }
    }),
    accountant: await prisma.role.upsert({
      where: { name: "Accountant" },
      update: {},
      create: { name: "Accountant" }
    }),
    owner: await prisma.role.upsert({
      where: { name: "Owner" },
      update: {},
      create: { name: "Owner" }
    }),
    admin: await prisma.role.upsert({
      where: { name: "System Admin" },
      update: {},
      create: { name: "System Admin" }
    })
  };

  console.log(`✅ Created ${Object.keys(roles).length} roles`);

  // Assign permissions to roles
  console.log("\n🔐 Assigning permissions to roles...");

  const permissionMap: Record<string, string[]> = {
    Waitress: ["sales.create", "sales.view", "products.view"],
    Supervisor: [
      "sales.view",
      "sales.approve",
      "inventory.view",
      "expenses.view"
    ],
    "Inventory Manager": [
      "inventory.view",
      "inventory.manage",
      "inventory.count",
      "products.view",
      "products.manage"
    ],
    Accountant: [
      "expenses.create",
      "expenses.view",
      "expenses.approve",
      "dashboard.view"
    ],
    Owner: [
      "sales.view",
      "inventory.view",
      "expenses.view",
      "dashboard.view",
      "products.view"
    ],
    "System Admin": [
      "users.manage",
      "audit.view",
      "sales.view",
      "inventory.view",
      "expenses.view",
      "products.manage"
    ]
  };

  for (const [roleName, permKeys] of Object.entries(permissionMap)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const permKey of permKeys) {
      const permission = permissions.find((p) => p.key === permKey);
      if (!permission) continue;

      await prisma.rolePermission.upsert({
        where: {
          id: `${role.id}-${permission.id}`
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
    console.log(`✅ Assigned ${permKeys.length} permissions to ${roleName}`);
  }

  // ===== SAMPLE USERS =====
  console.log("\n👥 Creating sample users...");

  const password = await hashPasscode("password123");

  const users = [
    {
      username: "ada",
      fullName: "Ada Okafor",
      email: "ada@digibar.ng",
      role: "Waitress"
    },
    {
      username: "chidi",
      fullName: "Chidi Nwankwo",
      email: "chidi@digibar.ng",
      role: "Supervisor"
    },
    {
      username: "ngozi",
      fullName: "Ngozi Adeyemi",
      email: "ngozi@digibar.ng",
      role: "Inventory Manager"
    },
    {
      username: "tunde",
      fullName: "Tunde Ogunleye",
      email: "tunde@digibar.ng",
      role: "Accountant"
    },
    {
      username: "emeka",
      fullName: "Emeka Eze",
      email: "emeka@digibar.ng",
      role: "Owner"
    },
    {
      username: "admin",
      fullName: "Amina Bello",
      email: "admin@digibar.ng",
      role: "System Admin"
    }
  ];

  for (const userData of users) {
    const role = await prisma.role.findUnique({
      where: { name: userData.role }
    });
    if (!role) continue;

    await prisma.user.upsert({
      where: { email: userData.email },
      update: { username: userData.username, passwordHash: password },
      create: {
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        passwordHash: password,
        roleId: role.id
      }
    });
  }

  console.log(`✅ Created ${users.length} sample users (password: password123)`);

  // ===== NIGERIAN BEERS =====
  console.log("\n🍺 Creating Nigerian beers...");

  const beers = [
    {
      name: "Guinness Foreign Extra Stout",
      sku: "BEER-GUINNESS",
      price: 800
    },
    { name: "Star Lager", sku: "BEER-STAR", price: 500 },
    { name: "Trophy Lager", sku: "BEER-TROPHY", price: 450 },
    { name: "Goldberg Lager", sku: "BEER-GOLDBERG", price: 500 },
    { name: "Hero Lager", sku: "BEER-HERO", price: 550 },
    { name: "Gulder Lager", sku: "BEER-GULDER", price: 600 },
    { name: "Harp Lager", sku: "BEER-HARP", price: 550 },
    { name: "Life Continental Lager", sku: "BEER-LIFE", price: 500 }
  ];

  for (const beer of beers) {
    await prisma.product.upsert({
      where: { sku: beer.sku },
      update: { price: beer.price },
      create: beer
    });
  }

  console.log(`✅ Created ${beers.length} Nigerian beers`);

  // ===== MALT DRINKS =====
  console.log("\n🥤 Creating malt drinks...");

  const malts = [
    { name: "Malta Guinness", sku: "MALT-GUINEA", price: 400 },
    { name: "Maltina", sku: "MALT-MALTINA", price: 350 },
    { name: "Amstel Malta", sku: "MALT-AMSTEL", price: 350 },
    { name: "Grand Malt", sku: "MALT-GRAND", price: 300 },
    { name: "Beta Malt", sku: "MALT-BETA", price: 300 }
  ];

  for (const malt of malts) {
    await prisma.product.upsert({
      where: { sku: malt.sku },
      update: { price: malt.price },
      create: malt
    });
  }

  console.log(`✅ Created ${malts.length} malt drinks`);

  // ===== SOFT DRINKS =====
  console.log("\n🥤 Creating soft drinks...");

  const softDrinks = [
    { name: "Coca-Cola", sku: "SOFT-COKE", price: 300 },
    { name: "Fanta Orange", sku: "SOFT-FANTA", price: 300 },
    { name: "Sprite", sku: "SOFT-SPRITE", price: 300 },
    { name: "Pepsi", sku: "SOFT-PEPSI", price: 300 },
    { name: "7UP", sku: "SOFT-7UP", price: 300 },
    { name: "La Casera", sku: "SOFT-LACASERA", price: 250 },
    { name: "Bigi Cola", sku: "SOFT-BIGI", price: 200 },
    { name: "Chapman Cocktail", sku: "COCKTAIL-CHAPMAN", price: 1500 }
  ];

  for (const drink of softDrinks) {
    await prisma.product.upsert({
      where: { sku: drink.sku },
      update: { price: drink.price },
      create: drink
    });
  }

  console.log(`✅ Created ${softDrinks.length} soft drinks`);

  // ===== INVENTORY ITEMS (INGREDIENTS) =====
  console.log("\n📦 Creating inventory items...");

  const inventoryItems = [
    { name: "Guinness Bottle", unit: "bottle", reorderLevel: 50 },
    { name: "Star Bottle", unit: "bottle", reorderLevel: 100 },
    { name: "Trophy Bottle", unit: "bottle", reorderLevel: 80 },
    { name: "Goldberg Bottle", unit: "bottle", reorderLevel: 80 },
    { name: "Hero Bottle", unit: "bottle", reorderLevel: 60 },
    { name: "Gulder Bottle", unit: "bottle", reorderLevel: 70 },
    { name: "Harp Bottle", unit: "bottle", reorderLevel: 60 },
    { name: "Life Bottle", unit: "bottle", reorderLevel: 60 },
    { name: "Malta Guinness Can", unit: "can", reorderLevel: 100 },
    { name: "Maltina Bottle", unit: "bottle", reorderLevel: 100 },
    { name: "Amstel Malta Can", unit: "can", reorderLevel: 80 },
    { name: "Grand Malt Bottle", unit: "bottle", reorderLevel: 80 },
    { name: "Beta Malt Can", unit: "can", reorderLevel: 80 },
    { name: "Coca-Cola Bottle", unit: "bottle", reorderLevel: 150 },
    { name: "Fanta Bottle", unit: "bottle", reorderLevel: 150 },
    { name: "Sprite Bottle", unit: "bottle", reorderLevel: 150 },
    { name: "Pepsi Bottle", unit: "bottle", reorderLevel: 100 },
    { name: "7UP Bottle", unit: "bottle", reorderLevel: 100 },
    { name: "La Casera Bottle", unit: "bottle", reorderLevel: 80 },
    { name: "Bigi Cola Bottle", unit: "bottle", reorderLevel: 100 },
    // Chapman cocktail ingredients
    { name: "Grenadine Syrup", unit: "ml", reorderLevel: 2000 },
    { name: "Angostura Bitters", unit: "ml", reorderLevel: 500 },
    { name: "Cucumber", unit: "piece", reorderLevel: 20 },
    { name: "Lemon", unit: "piece", reorderLevel: 30 },
    { name: "Orange", unit: "piece", reorderLevel: 30 },
    { name: "Ice Cubes", unit: "kg", reorderLevel: 50 }
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: item.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: item.name.toLowerCase().replace(/\s+/g, "-"),
        ...item
      }
    });
  }

  console.log(`✅ Created ${inventoryItems.length} inventory items`);

  // ===== RECIPES (Product to Inventory Mapping) =====
  console.log("\n🧪 Creating recipes...");

  const recipes = [
    // Beers (1:1 mapping)
    { productSku: "BEER-GUINNESS", inventoryId: "guinness-bottle", qty: 1 },
    { productSku: "BEER-STAR", inventoryId: "star-bottle", qty: 1 },
    { productSku: "BEER-TROPHY", inventoryId: "trophy-bottle", qty: 1 },
    { productSku: "BEER-GOLDBERG", inventoryId: "goldberg-bottle", qty: 1 },
    { productSku: "BEER-HERO", inventoryId: "hero-bottle", qty: 1 },
    { productSku: "BEER-GULDER", inventoryId: "gulder-bottle", qty: 1 },
    { productSku: "BEER-HARP", inventoryId: "harp-bottle", qty: 1 },
    { productSku: "BEER-LIFE", inventoryId: "life-bottle", qty: 1 },
    // Malts
    { productSku: "MALT-GUINEA", inventoryId: "malta-guinness-can", qty: 1 },
    { productSku: "MALT-MALTINA", inventoryId: "maltina-bottle", qty: 1 },
    { productSku: "MALT-AMSTEL", inventoryId: "amstel-malta-can", qty: 1 },
    { productSku: "MALT-GRAND", inventoryId: "grand-malt-bottle", qty: 1 },
    { productSku: "MALT-BETA", inventoryId: "beta-malt-can", qty: 1 },
    // Soft Drinks
    { productSku: "SOFT-COKE", inventoryId: "coca-cola-bottle", qty: 1 },
    { productSku: "SOFT-FANTA", inventoryId: "fanta-bottle", qty: 1 },
    { productSku: "SOFT-SPRITE", inventoryId: "sprite-bottle", qty: 1 },
    { productSku: "SOFT-PEPSI", inventoryId: "pepsi-bottle", qty: 1 },
    { productSku: "SOFT-7UP", inventoryId: "7up-bottle", qty: 1 },
    { productSku: "SOFT-LACASERA", inventoryId: "la-casera-bottle", qty: 1 },
    { productSku: "SOFT-BIGI", inventoryId: "bigi-cola-bottle", qty: 1 },
    // Chapman cocktail (complex recipe)
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "fanta-bottle", qty: 1 },
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "sprite-bottle", qty: 1 },
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "grenadine-syrup", qty: 50 },
    {
      productSku: "COCKTAIL-CHAPMAN",
      inventoryId: "angostura-bitters",
      qty: 10
    },
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "cucumber", qty: 0.25 },
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "lemon", qty: 0.5 },
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "orange", qty: 0.5 },
    { productSku: "COCKTAIL-CHAPMAN", inventoryId: "ice-cubes", qty: 0.2 }
  ];

  for (const recipe of recipes) {
    const product = await prisma.product.findUnique({
      where: { sku: recipe.productSku }
    });
    const inventory = await prisma.inventoryItem.findUnique({
      where: { id: recipe.inventoryId }
    });

    if (product && inventory) {
      await prisma.recipeItem.create({
        data: {
          productId: product.id,
          inventoryItemId: inventory.id,
          quantityUsed: recipe.qty
        }
      });
    }
  }

  console.log(`✅ Created ${recipes.length} recipe items`);

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
    { inventoryId: "ice-cubes", qty: 100, cost: 200 }
  ];

  for (const stock of stockItems) {
    await prisma.stockBatch.create({
      data: {
        inventoryItemId: stock.inventoryId,
        quantity: stock.qty,
        unitCost: stock.cost,
        supplier: "Initial Stock"
      }
    });
  }

  console.log(`✅ Added initial stock for ${stockItems.length} items`);

  console.log("\n✅ Seed completed successfully!");
  console.log("\n📝 Sample login credentials (email / password):");
  console.log("- Waitress: ada@digibar.ng / password123");
  console.log("- Supervisor: chidi@digibar.ng / password123");
  console.log("- Inventory Manager: ngozi@digibar.ng / password123");
  console.log("- Accountant: tunde@digibar.ng / password123");
  console.log("- Owner: emeka@digibar.ng / password123");
  console.log("- Admin: admin@digibar.ng / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
