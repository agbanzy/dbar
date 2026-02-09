# DigiBar Test Plan

## 1) Smoke Tests (manual or script)
- API health returns OK
- Dashboard summary loads
- Auth register/login works
- Create inventory item
- Create product + recipe mapping
- Create sale → approve sale → inventory deducts
- Create expense → approve expense

Script: `backend/scripts/smoke.mjs`

## 2) API Integration Tests
- Auth: register, login, /me
- Sales: create sale, approve/reject, status filtering
- Inventory: stock-in, adjustment, count, low stock
- Expenses: create, approve/reject, status filtering
- Products/Recipes: create, map recipes, include recipes
- Dashboard: summary totals and counts

## 3) UI Smoke Tests
- Dashboard loads with summary
- Pending sales/expenses lists render
- Low stock list renders
- Empty state cards show when no data

## 4) Regression Checklist
- Approving sale creates stock movements
- Inventory on-hand changes correctly
- Expense approvals update status
- Audit logs written for critical actions

## 5) Non-functional
- Performance: dashboard under 1s for small data
- Security: auth-required routes reject without token
