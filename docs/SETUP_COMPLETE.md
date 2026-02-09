# DigiBar Setup Complete 🎉

## Overview
Complete authentication, permission system, and database seeded with Nigerian local beers and soft drinks.

## ✅ What Was Implemented

### 1. Authentication System
- **JWT-based authentication** with 12-hour token expiry
- **Login endpoint**: `POST /api/auth/login`
- **Register endpoint**: `POST /api/auth/register`
- **User info endpoint**: `GET /api/auth/me` (requires authentication)

### 2. Permission Middleware
Created role-based access control system:
- `requireAuth` - Validates JWT token
- `requirePermission(key)` - Checks specific permissions
- `requireRole(name)` - Validates user role

**Location**: [backend/src/middleware/requirePermission.ts](../backend/src/middleware/requirePermission.ts)

### 3. Roles & Permissions

#### Roles Created:
1. **Waitress** - Record sales (3 permissions)
   - sales.create, sales.view, products.view

2. **Supervisor** - Approve sales and adjustments (4 permissions)
   - sales.view, sales.approve, inventory.view, expenses.view

3. **Inventory Manager** - Manage stock (5 permissions)
   - inventory.view, inventory.manage, inventory.count, products.view, products.manage

4. **Accountant** - Manage expenses (4 permissions)
   - expenses.create, expenses.view, expenses.approve, dashboard.view

5. **Owner** - View dashboards (5 permissions)
   - sales.view, inventory.view, expenses.view, dashboard.view, products.view

6. **System Admin** - Manage system (6 permissions)
   - users.manage, audit.view, sales.view, inventory.view, expenses.view, products.manage

### 4. Nigerian Beverages Database

#### 🍺 Beers (8 products)
Based on research from [Nigerian Breweries](https://www.nbplc.com/our-brands/) and [Guinness Nigeria](https://guinness-nigeria.com/en/our-brands):

| Beer | Price (₦) | SKU |
|------|----------|-----|
| Guinness Foreign Extra Stout | 800 | BEER-GUINNESS |
| Star Lager | 500 | BEER-STAR |
| Trophy Lager | 450 | BEER-TROPHY |
| Goldberg Lager | 500 | BEER-GOLDBERG |
| Hero Lager | 550 | BEER-HERO |
| Gulder Lager | 600 | BEER-GULDER |
| Harp Lager | 550 | BEER-HARP |
| Life Continental Lager | 500 | BEER-LIFE |

#### 🥤 Malt Drinks (5 products)
Popular malt drinks in Nigeria:

| Malt Drink | Price (₦) | SKU |
|------------|----------|-----|
| Malta Guinness | 400 | MALT-GUINEA |
| Maltina | 350 | MALT-MALTINA |
| Amstel Malta | 350 | MALT-AMSTEL |
| Grand Malt | 300 | MALT-GRAND |
| Beta Malt | 300 | MALT-BETA |

#### 🥤 Soft Drinks (8 products)
Including Nigerian Chapman cocktail:

| Soft Drink | Price (₦) | SKU |
|------------|----------|-----|
| Coca-Cola | 300 | SOFT-COKE |
| Fanta Orange | 300 | SOFT-FANTA |
| Sprite | 300 | SOFT-SPRITE |
| Pepsi | 300 | SOFT-PEPSI |
| 7UP | 300 | SOFT-7UP |
| La Casera | 250 | SOFT-LACASERA |
| Bigi Cola | 200 | SOFT-BIGI |
| Chapman Cocktail | 1,500 | COCKTAIL-CHAPMAN |

**Chapman Cocktail Recipe** (8 ingredients):
- Fanta Bottle (1)
- Sprite Bottle (1)
- Grenadine Syrup (50ml)
- Angostura Bitters (10ml)
- Cucumber (1/4 piece)
- Lemon (1/2 piece)
- Orange (1/2 piece)
- Ice Cubes (200g)

### 5. Inventory System
- **26 inventory items** created with reorder levels
- **Initial stock batches** added for all items
- **Recipe mapping** linking products to ingredients

### 6. Sample Users
6 test users created with different roles:

| Name | Email | Role | Password |
|------|-------|------|----------|
| Ada Okafor | ada@digibar.ng | Waitress | password123 |
| Chidi Nwankwo | chidi@digibar.ng | Supervisor | password123 |
| Ngozi Adeyemi | ngozi@digibar.ng | Inventory Manager | password123 |
| Tunde Ogunleye | tunde@digibar.ng | Accountant | password123 |
| Emeka Eze | emeka@digibar.ng | Owner | password123 |
| Amina Bello | admin@digibar.ng | System Admin | password123 |

## 🚀 Usage

### Running the Application

Both servers are already running:
- **Backend API**: http://localhost:4000
- **Frontend**: http://localhost:3000

### Testing the API

Run the comprehensive test script:
```bash
./backend/scripts/test-api.sh
```

### Manual API Testing

#### 1. Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ada@digibar.ng","password":"password123"}'
```

#### 2. Get User Info
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Get All Products
```bash
curl -X GET http://localhost:4000/api/products
```

#### 4. Get Products with Recipes
```bash
curl -X GET "http://localhost:4000/api/products?includeRecipes=true"
```

#### 5. Get Inventory Items
```bash
curl -X GET http://localhost:4000/api/inventory/items \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Re-seeding the Database

To reset and repopulate the database:
```bash
cd backend
npm run seed
```

## 📚 Research Sources

Nigerian beverage data was researched from:
- [List of beers and breweries in Nigeria - Wikipedia](https://en.wikipedia.org/wiki/List_of_beers_and_breweries_in_Nigeria)
- [Nigerian Breweries PLC - Our Brands](https://www.nbplc.com/our-brands/)
- [Guinness Nigeria - Our Brands](https://guinness-nigeria.com/en/our-brands)
- [Top 5 Most Popular Malt Drinks in Nigeria](https://www.top5.ng/top-5-most-popular-malt-drinks-in-nigeria/)
- [The soft drink market in Nigeria](https://firmusnigeria.com/the-soft-drink-market-in-nigeria/)

## 📁 Key Files Created

1. [backend/src/middleware/requirePermission.ts](../backend/src/middleware/requirePermission.ts) - Permission middleware
2. [backend/src/scripts/seed.ts](../backend/src/scripts/seed.ts) - Database seed script
3. [backend/scripts/test-api.sh](../backend/scripts/test-api.sh) - API test script

## 🔐 Security Notes

- All passwords are hashed using bcrypt with salt rounds of 10
- JWT tokens expire after 12 hours
- Change `JWT_SECRET` in `.env` for production use
- Default password (`password123`) should be changed for all users in production

## 🎯 Next Steps

1. **Frontend Integration**: Connect Next.js frontend to authentication system
2. **Sales Module**: Implement sales creation and approval workflow
3. **Inventory Management**: Add stock-in, adjustments, and counting features
4. **Expense Management**: Create expense entry and approval system
5. **Dashboard**: Build owner dashboard with analytics
6. **Receipt Upload**: Implement image upload for receipts (S3/Cloudinary)

## 💡 Features Ready to Use

✅ User authentication (login/register)
✅ Role-based access control
✅ Permission checking middleware
✅ 21 Nigerian beverage products
✅ 26 inventory items with stock levels
✅ Recipe/ingredient mapping
✅ 6 sample users across all roles
✅ Audit log system (existing)

---

**Status**: ✅ System initialized and ready for development
**Last Updated**: February 5, 2026
