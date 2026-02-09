# DigiBar Core API Endpoints

Base URL: `http://localhost:4000/api`

## Auth
- `POST /auth/register` -> { fullName, phone, passcode } (staff)
- `POST /auth/login` -> { phone, passcode } -> { customToken }
- `POST /auth/login` -> { idToken } -> { user }
- `POST /auth/passcode/request` -> { phone } (OTP reset)
- `POST /auth/passcode/confirm` -> { phone, otp, newPasscode }
- `GET /auth/me` -> Bearer token required

## Sales + Approvals
- `GET /sales?status=PENDING|APPROVED|REJECTED`
- `POST /sales` -> { paymentMethod, items: [{ productId, quantity }] }
- `POST /sales/:id/approve`
- `POST /sales/:id/reject` -> { reason? }

## Inventory
- `GET /inventory/items`
- `GET /inventory/low`
- `POST /inventory/items` -> { name, unit, reorderLevel? }
- `POST /inventory/stock-in` -> { inventoryItemId, quantity, unitCost, supplier?, receiptUrl? }
- `POST /inventory/adjustment` -> { inventoryItemId, quantity, reason? }
- `POST /inventory/count` -> { inventoryItemId, countedQty }

## Expenses
- `GET /expenses?status=PENDING|APPROVED|REJECTED`
- `POST /expenses` -> { amount, category, description?, receiptUrl? }
- `POST /expenses/:id/approve`
- `POST /expenses/:id/reject` -> { reason? }

## Products + Recipes
- `GET /products?includeRecipes=true|false`
- `POST /products` -> { name, sku?, price }
- `POST /products/:id/recipes` -> { inventoryItemId, quantityUsed }

## Dashboard
- `GET /dashboard/summary`
