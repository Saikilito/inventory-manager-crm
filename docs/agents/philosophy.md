# Core Philosophy: Data Flow and Responsibilities

> ⚠️ **WARNING**: This document outlines the core philosophy of the application's data flow. Ignoring these principles leads to mixed responsibilities, fragile systems, spaghetti code, and maintenance nightmares.

## 1. The Problem We Solve (The Anti-Pattern)

Historically, systems have suffered from two major anti-patterns:

- **Services Calling Services:** When services call other services, it creates a tangled web of spaghetti code and circular dependencies. It makes isolated testing nearly impossible because instantiating one service requires mocking a deeply nested tree of other services.
- **Services Validating Data:** When individual services validate the data they receive, it leads to massive duplication of validation logic across the codebase and a complete loss of cohesion.

## 2. The Solution: The Use Case as the "Backbone" ("The Brain")

To solve these problems, the **Use Case** serves as the absolute orchestrator ("The Brain") of the operation.

### Translation and Validation

Use Cases are the **ONLY** layer that receives "dirty data" (such as primitives or DTOs from controllers/handlers). Their very first job is to clean this data by transforming it into valid **Domain Entities** and **Value Objects**. Once instantiated, these objects are guaranteed to be valid.

### Orchestration

The Use Case acts as a conductor. Its responsibilities are strictly sequential and orchestrational:

1. It calls Service A.
2. It evaluates the result (utilizing `ResultComposer`).
3. It calls Service B.
4. It finally calls the Database/Model layer to persist the changes.

### Flow of Falsy Values

All logic handling "what happens if a service fails" or "what if a service returns null" lives **exclusively** in the Use Case. Services themselves do not handle orchestration-level fallbacks or routing.

## 3. The Contract of Trust for Services (Strict SRP)

Services must adhere to a strict Single Responsibility Principle (SRP) and a "Contract of Trust":

- **One Thing Well:** A Service does **one thing** and does it exceptionally well.
- **Unbreakable Rule:** A service **NEVER** calls another service. There are no exceptions.
- **Blind Trust:** A service **NEVER** validates input data. If a service receives a `User` or an `Email` Value Object, it mathematically trusts that they are valid because the Use Case has already performed that job.

---

## 🛡️ Validation Layering Rule

All validation rules must be concentrated strictly by prioritizing architectural levels:

1. **Value Objects:** Always place basic primitive-level formatting and validation rules (like email format, UUID format, positive numbers, non-empty strings) directly in the **Value Object** creation level (using Zod or UUID).
2. **Entities:** Place entity-level multi-field consistency validation rules (like checking password strength relative to role) in the **Domain Entity** creation level.
3. **Use Cases:** Place external or contextual validation rules (such as checking if a record exists in the database, validating permissions against session tokens, or checking transaction limits) directly in the **Use Case** level.

---

## 🛡️ Strict Value Object Signatures for Services and Repositories

All repositories and core services must enforce Value Objects at their type boundaries:

- **Value Objects Over Primitives:** Repositories, query parameters, query builders, and filters (`WhereField`) **MUST** use strongly-typed Value Objects (`Id`, `PositiveNumber`, `NonEmptyString`) rather than raw types (`string`, `number`, `any[]`) in their input signatures.
- **Use Case Responsibility:** It is the sole responsibility of the **Use Case** to act as a validation gate, taking raw primitives from the delivery layer and instantiating/validating them into domain Value Objects before passing them down to the repositories or services.
- **No `as any` Castings:** Bypassing Value Object signatures using `as any` on repository inputs is strictly prohibited. If a repository expects a `PositiveNumber` or `Id`, the Use Case must construct it natively (using `PositiveNumberVO.create` or `IdVO.create`).
- **NIL UUID for System Actor:** When database auditing requires an actor `Id` for background or system-driven operations (such as `createdBy`, `updatedBy`, `deletedBy`), use the NIL UUID via `IdVO.generateNil()` instead of the raw string `'system' as any`.

---

## 4. Didactic Guide: Domain Services vs Application Services

Understanding the distinction between service types is critical:

- **Domain Services:**
  - **Definition:** Contain pure business logic.
  - **Dependencies:** No external dependencies (no database, no APIs).
  - **Location:** Lives strictly in the `domain` layer.
  - **Example:** Calculating a discount or applying business rules to a set of entities.

- **Application Services:**
  - **Definition:** Interacts with the outside world and produces side effects.
  - **Dependencies:** Relies on external systems.
  - **Location:** Lives in the `application` layer of the product context (`modules/<feature>/application`).
  - **Example:** Calling an external AI API, dispatching an event, or sending an email.

---

## 5. Data Access Philosophy: Database First (Mongoose & MongoDB)

When reading data, we solve the logic as close to the database as possible.
This is part of the development mindset, not just a repository detail.

Before writing any read logic, every developer must consciously ask:

1. Can this be solved with standard Mongoose queries (`find`, `findOne`, `findById`)?
2. If not, can a Mongoose Aggregation Pipeline (`aggregate`) solve it?
3. If MongoDB aggregation becomes too complex or unreadable, is TypeScript the right fallback?

This philosophy exists to:

- explicitly avoid **N+1** queries;
- reduce unnecessary in-memory filtering or aggregation;
- keep read logic efficient by default;
- use the database for what it does best before moving work into TypeScript.

### The Escalation Path

Always follow this order:

1. **Mongoose Standard Queries first**: use `Model.find()` with population and native filters whenever possible.
2. **Mongoose Aggregations second**: if native find queries are not expressive enough, escalate to Mongoose `aggregate` pipelines (for counts, group-by, lookups, and sums).
3. **TypeScript last**: only fetch raw data and finish the logic in TypeScript when the MongoDB aggregation pipeline becomes too complex, too brittle, or too hard to maintain.

### Level 1: Mongoose Standard Queries

Use standard Mongoose query helpers when the query can be expressed with native filters, limit, offset, and population.

#### Anti-pattern: N+1 in application logic

```typescript
const clients = await ClientModel.find({}).exec();

const clientsWithOrders = await Promise.all(
  clients.map(async (client) => {
    // ❌ WRONG: Performs one extra query per client in a loop
    const orders = await OrderModel.find({ clientId: client._id }).exec();
    return { ...client.toObject(), orders };
  })
);
```

#### Correct: solve it with native filters and population

```typescript
const orders = await OrderModel.find({ clientId: { $in: clientIds } }).exec();
```

### Level 2: Mongoose Aggregations

Use Mongoose `aggregate` only when standard queries are no longer expressive enough.

Typical examples:

- aggregations with `$match`, `$group` (`$sum`, `$avg`);
- `$lookup` (database-level joins) and `$project` stages;
- advanced pipeline reporting.

#### Anti-pattern: doing aggregation in memory

```typescript
// ❌ WRONG: Loads all orders into memory just to calculate sum per client
const orders = await OrderModel.find({ status: 'COMPLETED' }).exec();
const clientTotals: Record<string, number> = {};
orders.forEach(order => {
  clientTotals[order.clientId] = (clientTotals[order.clientId] || 0) + order.total;
});
```

#### Correct: custom aggregation pipeline with `doTryResult`

```typescript
const topClientsResult = await doTryResult(
  async () => {
    return OrderModel.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: '$clientId', total: { $sum: '$total' } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]).exec();
  },
  (err) => createDatabaseError(err.message)
);
```

### Level 3: TypeScript Fallback

Use TypeScript only when the database pipeline approach becomes too hard to read or maintain.
