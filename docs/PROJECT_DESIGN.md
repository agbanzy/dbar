# DigiBar Project Design (PM View)

## 1. Vision
Build a simple, high-control bar operations platform that captures sales, approvals, inventory, expenses, and payment reconciliation in one place.

## 2. Goals
- Reduce revenue leakage by requiring supervisor approval on sales and inventory adjustments.
- Track inventory in real time by tying stock usage to approved sales.
- Provide full payment visibility (cash, card, transfer).
- Capture expenses with receipt images and approvals.
- Give owners a real-time profit view.

## 3. Roles
- Waitress: record sales.
- Supervisor: approve/reject sales and adjustments.
- Inventory Manager: stock-in, stock counts, adjustments.
- Accountant: expense entry/approval.
- Owner: dashboards and reports.
- System Admin: user/role management and audit logs.

## 4. Core Modules
1) Sales + Approvals
- Waitress records sale with payment method.
- Supervisor approves/rejects.
- Approved sales reduce inventory and hit revenue.

2) Inventory Management
- Stock-in with cost, supplier, receipt.
- Sales deduct stock by recipe/units.
- Adjustments for breakage/staff drinks.
- Physical stock count with variance report.

3) Expense Management
- Enter expense + receipt image.
- Approval required to post.

4) Payments & Reconciliation
- Cash, card, transfer tracking.
- Daily cash reconciliation vs expected cash.

5) System Admin + Audit Logs
- User lifecycle, roles, permissions.
- Full audit of critical actions.

## 5. Data Model (High Level)
- Users, Roles, Permissions
- Sales, SaleItems, Approvals
- Products, Ingredients, Recipes
- InventoryItems, StockBatches, StockMovements
- Expenses, Receipts
- AuditLogs

## 6. MVP Scope
Must-have:
- Sales entry + approval
- Payment method logging
- Inventory auto-deduction
- Stock-in + adjustments
- Expense with receipt
- Owner dashboard (sales, inventory, expenses)
- Role-based access

Nice later:
- OCR receipt parsing
- Multi-branch
- Supplier management
- Staff performance analytics

## 7. Milestones
- M1: Requirements + user stories
- M2: Database + API design
- M3: Backend scaffold + core endpoints
- M4: Frontend scaffold + core screens
- M5: Integration + smoke tests

## 8. Risks
- Poor data quality (mitigate with approvals)
- Operational friction (mitigate with fast UI)
- Inventory mismatches (mitigate with regular counts)

## 9. Success Metrics
- Percentage of sales approved
- Inventory variance rate
- Cash reconciliation accuracy
- Weekly active users by role

## 10. Tech Assumptions
- Frontend: Next.js (React, TypeScript)
- Backend: Node.js (Express, TypeScript)
- Database: PostgreSQL
- ORM: Prisma
- Storage: S3/Cloudinary for receipts

