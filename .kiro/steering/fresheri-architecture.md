---
inclusion: always
---

# Fresheri System Architecture & Code Quality Constraints

These rules apply to **every file, route, component, schema, and API service**
generated or refactored in this repository — now and in all future sessions.

---

## Core Mission

Fresheri connects farmers and cooperatives with commercial buyers (hotels,
restaurants) and households via web, mobile app, and USSD. Every design
decision must balance transaction efficiency with strict identity privacy and
dual fulfillment choices (SELF_PICKUP / DELIVERED).

---

## 1. Privacy Governance

### 1.1 Default Public View — Strict Identity Masking

- Public search, listing, and catalogue endpoints **MUST NEVER** return:
  - Farmer full name (`firstName`, `lastName`)
  - Phone number
  - National ID (`nationalIdNumber`)
  - Exact street address or GPS coordinates
  - Email address
  - Profile image URL

- Public listing payloads expose **ONLY**:
  - `id`, `produceName`, `variety`, `categoryName`
  - `sellerDisplayName` (cooperative/farm name, never personal name)
  - `sellerVerified`
  - `region` (district-level only, e.g. "Kayonza District")
  - `harvestDate`, `expiryDate`
  - `totalQuantity`, `availableQuantity`, `unit`, `minimumOrderQty`
  - `unitPrice`, `currency`
  - `deliveryOptions`, `deliveryRadiusKm`
  - `isOrganic`, `status`, `imageUrls`

- All Prisma queries on public endpoints **must use explicit `select` blocks**.
  Never use `findMany({})` or `include` on public routes — always project.

### 1.2 Conditional Disclosure (Fulfillment Rules)

- **SELF_PICKUP**: Exact farm address and farmer phone are disclosed **only**
  to the verified buyer **after** a confirmed order, via
  `GET /orders/:id/pickup-contact`. Three gates must all pass:
  1. Valid authenticated caller (`resolveCallerMiddleware`)
  2. Buyer role (`requireRoles(BUYER_ROLES)`)
  3. Order ownership + `SELF_PICKUP` + `CONFIRMED` status

- **DELIVERED**: Farmer address and contact are routed **exclusively** to the
  assigned logistics agent via `Delivery` record. Buyer receives tracking
  status only. `pickupContact` must be `null` in all buyer-facing responses.

---

## 2. Architecture Layers — Strict Separation

```
HTTP Request
    │
    ▼
Controller Layer   (src/*/controller.ts)
    │  — Parse & validate HTTP input only
    │  — Map domain errors to HTTP status codes
    │  — Never contain business logic or DB calls
    ▼
Service Layer      (src/*/service.ts)
    │  — All business logic lives here
    │  — Privacy rules enforced here, never in controllers
    │  — Calls Data Access Layer only
    │  — Accepts injected dependencies (prisma, smsClient)
    ▼
Data Access Layer  (Prisma — via injected PrismaClient)
    │  — Explicit `select` on every query
    │  — No raw SQL except for SELECT FOR UPDATE row locks
    ▼
Database (PostgreSQL / Neon)
```

**Rules:**
- Never mix DB calls inside controllers, USSD scripts, or frontend handlers.
- Never import `prisma` directly in controllers — controllers call services.
- Services receive `prisma` as a parameter or via a factory (Dependency Injection).

---

## 3. Dependency Injection

- **Database**: Pass `PrismaClient` as a parameter to service functions.
  ```ts
  // ✅ correct
  export async function placeOrder(input: PlaceOrderInput, db: PrismaClient) { }

  // ❌ wrong
  import prisma from "../lib/prisma"; // hardcoded inside service
  ```

- **SMS / External Clients**: Pass client instances as parameters.
  ```ts
  export async function placeOrder(input, db, sms: SmsService) { }
  ```

- **Singleton pattern** is acceptable only in `src/lib/` adapter files
  (e.g., `prisma.ts`, `sms.ts`) that are **injected** into services — never
  imported directly inside business logic.

---

## 4. Centralized Constants

All ENUMs, error codes, configuration keys, and error messages **must** live in
dedicated constant files:

- `src/constants/errors.ts` — domain error codes and messages
- `src/constants/roles.ts` — role groupings (BUYER_ROLES, SELLER_ROLES, etc.)
- `src/constants/config.ts` — TTL values, fee schedules, limits
- `web/lib/constants.ts` — frontend constants (API base, fee schedules)

**Never** hard-code string literals for error messages, role names, or config
values inline in controllers or services.

---

## 5. TypeScript Strict Mode

- `strict: true` must remain set in all `tsconfig.json` files.
- No `any` types — use `unknown` with narrowing or proper interfaces.
- All function parameters and return types must be explicitly typed.
- Prisma `select` return types must use `Prisma.XxxGetPayload<{ select: typeof SELECT }>`.

---

## 6. Error Handling

- All domain errors extend `Error` with a typed `name` property.
- Controllers use a single `handleServiceError(err, res)` mapper.
- Never return stack traces to clients in production.
- HTTP status code mapping:

  | Situation | Code |
  |---|---|
  | Validation failure | 400 |
  | Unauthenticated | 401 |
  | Forbidden / wrong role | 403 |
  | Resource not found | 404 |
  | Conflict (e.g. insufficient stock) | 409 |
  | Unexpected server error | 500 |

---

## 7. Database Query Rules

- **Always** use explicit `select` — never `findMany({})` without a select.
- **Index required**: all FK columns, status fields, search filter columns
  (`produceName`, `farmLocation`, `status`, `harvestDate`, `availableQuantity`).
- Wrap all multi-step inventory + financial state changes in `prisma.$transaction`.
- Use `SELECT FOR UPDATE` raw query for row-level locking on inventory.
- `DIRECT_URL` for migrations, `DATABASE_URL` (pooler) for runtime.

---

## 8. Atomic Transactions

Every operation that touches more than one table (inventory + order + orderItem)
**must** use `prisma.$transaction(async (tx) => { ... })`.

---

## 9. Performance

- No `SELECT *` — all Prisma queries use explicit field projection.
- Paginate all list endpoints (default 20, max 100).
- SMS notifications fire **after** transaction commit via `Promise.allSettled`.
- Delivery dispatch fires **after** commit, non-blocking (`.catch` logged).

---

## 10. Frontend Rules

- **No raw `fetch` calls in page components or UI event handlers.**
  All API calls go through `web/lib/api-client.ts`.
- `NEXT_PUBLIC_API_URL` is the single source of truth for the backend base URL.
- All shared frontend constants live in `web/lib/constants.ts`.
- Components are single-responsibility — data fetching belongs in the page or
  a custom hook, not inside card/modal components.
- Privacy: never render or log farmer PII fields (phone, name, address) outside
  of the post-order `PickupContactCard` component.

---

## 11. Testing

- Every new service file **must** have a co-located `*.test.ts` file.
- Test file location: same directory as the module under test.
- Framework: **Jest** (backend), **Vitest** (frontend).
- Required test coverage per module:
  - Happy path
  - Invalid input / validation errors
  - Domain error conditions (not found, insufficient stock, wrong role)
  - Privacy: assert sensitive fields are absent from public payloads

---

## 12. File Naming Conventions

```
src/
  <domain>/
    <domain>.service.ts      ← business logic
    <domain>.controller.ts   ← HTTP layer
    <domain>.routes.ts       ← Express router
    <domain>.types.ts        ← domain interfaces
    <domain>.service.test.ts ← Jest tests
  constants/
    errors.ts
    roles.ts
    config.ts
  middleware/
    rbac.ts
  lib/
    prisma.ts   ← singleton adapter (injected into services)
    sms.ts      ← singleton adapter (injected into services)

web/
  lib/
    api-client.ts   ← all fetch calls
    constants.ts    ← shared frontend constants
  components/
    marketplace/    ← UI components (no fetch calls)
  types/
    marketplace.ts  ← shared TypeScript types
```
