# Pre-Deployment Implementation Guide

**Status:** Pending Implementation
**Priority:** Critical

This document outlines the specific code changes required to address the "High Priority" technical debt items identified in the audit before production deployment.

---

## 1. Security Hardening

**Objective:** Protect against brute-force attacks and set secure HTTP headers.
**Target File:** `backend/src/app.ts` (or `index.ts`)

### Step 1: Install Dependencies
```bash
npm install helmet express-rate-limit
```

### Step 2: Apply Middleware
```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const app = express();

// 1. Set Security HTTP Headers
app.use(helmet());

// 2. Rate Limiting (Prevent Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to API routes
app.use('/api', limiter);
```

---

## 2. Input Validation (Zod)

**Objective:** Replace manual `if` checks with robust schema validation.
**Target File:** `backend/src/routes/users.ts`

### Step 1: Install Zod
```bash
npm install zod
```

### Step 2: Define Schema & Update Route
```typescript
import { z } from 'zod';

// Define Validation Schema
const createUserSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  roleName: z.string().min(1, "Role name is required"),
  username: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  passcode: z.string().min(4).optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  // Conditional Validation Logic
  if (data.roleName === 'System Admin') {
    if (!data.email) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Email required for Admin", path: ['email'] });
    if (!data.password) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Password required for Admin", path: ['password'] });
  } else {
    if (!data.phone) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Phone required for Staff", path: ['phone'] });
    if (!data.passcode) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Passcode required for Staff", path: ['passcode'] });
  }
});

// Usage in Route
exports.usersRouter.post("/", requireAuth, requirePermission("users.manage"), async (req, res) => {
  try {
    // Validate
    const result = createUserSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Validation Failed", 
        details: result.error.format() 
      });
    }

    const { fullName, email, password, roleName, username, phone, passcode } = result.data;
    // ... proceed with existing logic ...
```

---

## 3. Data Type Standardization

**Objective:** Prevent precision errors by ensuring currency is returned as strings.
**Target File:** `backend/src/lib/prisma.ts`

### Implementation
Add this prototype override to ensure `BigInt` and `Decimal` serialize correctly in JSON responses.

```typescript
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};
```

---

## 4. Token Storage Standardization

**Objective:** Resolve inconsistency between Cookies and LocalStorage.

**Decision:** Enforce **HTTP-Only Cookies** for security.

1. **Backend:** Ensure login route sets `res.cookie('token', ... { httpOnly: true })`.
2. **Frontend:** Remove `localStorage.setItem('token', ...)` calls.
3. **API Client:** Configure axios/fetch with `credentials: 'include'` to automatically send cookies.