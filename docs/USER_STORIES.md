# DigiBar User Stories

## Waitress (Sales Entry)
- As a waitress, I want to log a sale with items and quantities so that every order is captured.
- As a waitress, I want to select the payment method (cash/card/transfer) so the owner can reconcile payments.
- As a waitress, I want to see a "pending approval" status so I know the sale is not yet final.

## Supervisor (Approvals)
- As a supervisor, I want to review pending sales so I can approve or reject them.
- As a supervisor, I want to see itemized details (items, quantities, payment method, total) so I can validate accuracy.
- As a supervisor, I want to approve inventory adjustments so stock changes are controlled.

## Inventory Manager (Stock Control)
- As an inventory manager, I want to record stock-in with cost and supplier so inventory values are accurate.
- As an inventory manager, I want to log stock adjustments (breakage/staff use) so stock levels remain correct.
- As an inventory manager, I want to perform physical stock counts so I can identify variance.

## Accountant (Expenses)
- As an accountant, I want to record expenses with receipt images so claims are verifiable.
- As an accountant, I want expenses to require approval so only valid costs are posted.

## Owner (Dashboards)
- As an owner, I want to view sales by payment method so I can reconcile cash and card totals.
- As an owner, I want to see inventory valuation and variance so I can detect shrinkage.
- As an owner, I want to see daily profit (sales - COGS - expenses) so I know performance.

## System Admin (Access + Audit)
- As a system admin, I want to create, disable, and reset users so I can manage access.
- As a system admin, I want to assign roles and permissions so each user only sees what they need.
- As a system admin, I want an audit log of critical actions so I can track who did what.

## Functional Stories (By Module)

### Sales + Payments
- As a waitress, I can add line items to a sale so totals are accurate.
- As a supervisor, I can approve or reject sales so only valid sales hit revenue.
- As an owner, I can view totals split by cash/card/transfer so reconciliation is easy.

### Inventory
- As an inventory manager, I can map recipes to products so inventory deducts correctly.
- As a supervisor, I can approve stock adjustments so stock changes are controlled.
- As an owner, I can see low stock alerts so I can reorder.

### Expenses
- As an accountant, I can upload a receipt image so expense claims are verifiable.
- As a supervisor, I can approve expenses so only valid expenses are posted.

### Admin + Audit
- As a system admin, I can manage roles so access is controlled.
- As an owner, I can review audit logs so accountability is enforced.

