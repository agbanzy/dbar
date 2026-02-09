# DigiBar Code Analysis & Bug Report

**Date:** June 2, 2026  
**Status:** Comprehensive codebase review completed

---

## 🔴 CRITICAL ISSUES

### 1. Duplicate `requireRole` Function Definition
**Location:** `backend/src/middleware/requirePermission.ts` and `backend/src/middleware/requireRole.ts`

**Problem:**
- The `requireRole` function is defined in **TWO separate files**
- `requirePermission.ts` (lines 35-58) exports a `requireRole` function
- `requireRole.ts` (entire file) also exports a `requireRole` function
- Routes import from `requireRole.ts`, but the duplicate in `requirePermission.ts` is unused

**Impact:** Code duplication, maintenance confusion, potential import conflicts

**Solution:** Remove the duplicate `requireRole` function from `requirePermission.ts`

---

### 2. Authentication Token Storage Inconsistency
**Location:** `frontend/middleware.ts` vs Frontend components

**Problem:**
- **Middleware** checks: `request.cookies.get("token")` 
- **Components** use: `localStorage.getItem("token")`
- Login page sets BOTH cookie and localStorage
- But most API calls only check localStorage

**Impact:** 
- Inconsistent authentication state
- Middleware redirects may not work properly on page refresh
- Token expiry handling is inconsistent

**Solution:** Standardize on one approach (preferably cookies for security + localStorage for client-side access)

---

### 3. Missing `.env` File Validation
**Location:** Multiple files reading environment variables

**Problem:**
- Backend only validates `JWT_SECRET` in `auth.ts`
- No validation for `DATABASE_URL` or `PORT`
- Frontend silently falls back to defaults if `NEXT_PUBLIC_API_URL` is missing

**Impact:** Silent failures, hard-to-debug connection issues

**Solution:** Add comprehensive env validation at startup

---

## 🟡 MEDIUM PRIORITY ISSUES

### 4. API Response Type Mismatch
**Location:** `frontend/lib/api.ts` types vs Backend responses

**Problem:**
- Frontend types define amounts as `string` (e.g., `totalAmount: string`)
- Backend sometimes returns numbers via `.toNumber()` conversion
- Inconsistent handling of Prisma Decimal types

**Files affected:**
- `backend/src/routes/sales.ts` - Line 34: converts to number
- `backend/src/routes/dashboard.ts` - Line 73: uses `.toNumber()`
- `backend/src/routes/reports.ts` - Multiple `.toNumber()` calls

**Impact:** Type safety issues, potential runtime errors

**Solution:** Standardize all currency/decimal values to strings in API responses

---

### 5. Unused `unitPrice` Parameter in Sale Creation
**Location:** `frontend/app/(dashboard)/sales/create/page.tsx`

**Problem:**
- Frontend sends `unitPrice` in the request body (line 134)
- Backend ignores this and uses product price from database (sales.ts line 124)
- Unnecessary data transmission

**Impact:** Minor - doesn't cause errors but misleading code

**Solution:** Remove `unitPrice` from frontend request body

---

### 6. Missing Error Details in API Responses
**Location:** Multiple route files

**Problem:**
- Many catch blocks just return generic "Failed to..." messages
- Original error details are only logged to console
- Frontend can't provide specific error guidance to users

**Example:**
```typescript
catch (error) {
  console.error(error);
  return res.status(500).json({ error: "Failed to create sale" });
}
```

**Impact:** Poor user experience, difficult debugging

**Solution:** Return more specific error messages (while avoiding sensitive data leaks)

---

### 7. No Input Validation/Sanitization
**Location:** All POST/PUT/PATCH routes

**Problem:**
- Direct use of request body without validation
- No schema validation (e.g., using Zod)
- Type assertions without runtime checks: `req.body as { field?: type }`

**Impact:** Potential security issues, data integrity problems

**Solution:** Add Zod or similar validation library

---

## 🟢 MINOR ISSUES

### 8. Inconsistent Error Status Codes
**Location:** Various route files

**Issue:** Some routes use 404 for "not found", others use 400 or 500 inconsistently

---

### 9. Missing TypeScript Strict Null Checks
**Location:** `backend/tsconfig.json`

**Problem:**
- `strict: true` is set, but many places use `!` null assertions
- Example: `req.user!.userId` in multiple files

**Impact:** Potential runtime null reference errors

---

### 10. No Rate Limiting or Security Headers
**Location:** `backend/src/app.ts`

**Problem:**
- No rate limiting middleware
- No helmet.js for security headers
- CORS is configured but could be more restrictive

**Impact:** Potential security vulnerabilities

---

### 11. Hardcoded Demo Account Credentials
**Location:** `frontend/app/(auth)/login/page.tsx`

**Problem:**
- Demo emails are hardcoded in the frontend
- Password "password123" is visible in the UI

**Impact:** Security concern if deployed to production

**Solution:** Move to environment variables or separate demo mode

---

### 12. No Database Connection Pooling Configuration
**Location:** `backend/src/lib/prisma.ts`

**Problem:**
- Basic `PrismaClient` instantiation without configuration
- No connection pool settings
- No singleton pattern for development (causes multiple instances)

**Solution:** Add proper Prisma configuration

---

### 13. Missing Audit Log Error Handling
**Location:** `backend/src/lib/audit.ts`

**Problem:**
- Audit log failures are silently caught and logged
- No retry mechanism
- No alerts for audit failures

**Impact:** Lost audit trail without notification

---

## 📋 CODE QUALITY IMPROVEMENTS

### 14. Inconsistent Mapper Functions
- Some routes have `mapUser` and `mapSale` functions
- Others directly return database objects
- Inconsistent field transformations

### 15. Repeated Code Patterns
- Stock movement calculation logic appears in multiple files
- Similar approval/rejection handlers could be abstracted

### 16. No API Documentation
- No OpenAPI/Swagger documentation
- Endpoint documentation only in markdown files

### 17. Missing Unit Tests
- No test files in the codebase
- No test configuration

---

## ✅ POSITIVE FINDINGS

1. **Good separation of concerns** - Routes, middleware, and lib are well organized
2. **Consistent naming conventions** - camelCase for functions, PascalCase for types
3. **Proper use of Prisma** - Good use of transactions and relations
4. **Role-based access control** - Well-implemented permission system
5. **Audit logging** - Good tracking of important actions
6. **TypeScript usage** - Strong typing throughout most of the code

---

## 🎯 IMMEDIATE ACTION ITEMS

1. **Fix duplicate `requireRole` function** (Critical)
2. **Standardize authentication token handling** (Critical)
3. **Add environment variable validation** (High)
4. **Standardize API response types** (High)
5. **Add input validation with Zod** (Medium)
6. **Improve error messages** (Medium)
7. **Add security headers and rate limiting** (Medium)
8. **Configure Prisma properly** (Low)

---

## 📝 TESTING RECOMMENDATIONS

1. Test authentication flow end-to-end
2. Test all role permissions
3. Test Decimal/number conversions
4. Test error scenarios (missing data, invalid IDs, etc.)
5. Test concurrent operations (race conditions)
6. Load test API endpoints

---

## 🔒 SECURITY RECOMMENDATIONS

1. Use httpOnly cookies for auth tokens
2. Implement CSRF protection
3. Add rate limiting
4. Use helmet.js for security headers
5. Validate and sanitize all inputs
6. Remove or protect demo account credentials
7. Use stronger JWT secret in production

---

**Generated by:** DigiBar Code Analysis Tool  
**Next Review:** Schedule after fixes are implemented
