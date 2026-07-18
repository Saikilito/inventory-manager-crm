# AGENTS.md

> [!IMPORTANT]
> This is a high-performance **Full-Stack JS/TS Screaming Architecture Project Router**.
> Your mission is to load ONLY the context and skills necessary for the current task. Do not load
> everything at once. We are transitioning this project to **TypeScript, Clean/Screaming Architecture**,
> and high-quality development standards.

---

## 🎯 Project Mission: Inventory CRM

An inventory and customer relationship management (CRM) system for managing products, clients, sellers, and orders.

The core value proposition is the **intelligent fusion** of:

1. **Client & Order Management:** Solid tracking of orders (pedidos) linked to customers (clientes) and sellers (vendedores).
2. **Real-time Inventory control:** Product catalogs with dynamic stock deductions and updates.
3. **Analytics Dashboard:** Graphical summaries of sales, top sellers, and customer activity.

Your goal is to guide the system through its upcoming refactor to **TypeScript, English naming, Screaming Architecture**, and high-quality standards.

---

## 🚀 Quick Commands (Concurrently / Local)

These are the direct commands to manage the client and server.

```bash
# Core Operations (from root folder)
npm run setup                             # Installs dependencies in client and server
npm run dev                               # Starts client (Vite) and server (GraphQL/Node) concurrently
npm run start                             # Starts client and server in production mode

# Focused Work
npm run dev --prefix client               # Start client development server
npm run dev --prefix server               # Start server development server
npm run test --prefix client              # Run client tests (if configured)
```

---

## 🗺️ Project Map & Screaming Architecture

We use a strict **Screaming Architecture (Folder-by-Feature)** layout. The structure must clearly "scream" what the application does (Clients, Orders, Products, Users) rather than just showing technical folders.

We also maintain a **`shared-domain/`** folder at the workspace root containing pure domain entities and value objects shared between frontend and backend.

```
inventory-manager-crm/
├── shared-domain/                       # Common domain shared between Client and Server (Pure TS)
│   └── src/
│       ├── client/                      # Shared Client entity & domain logic
│       ├── order/                       # Shared Order entity & domain logic
│       └── shared/                      # Base monads (Result), value objects, etc.
├── client/                              # React Presentation & GraphQL Clients
│   └── src/
│       ├── modules/                     # Features/Domains (Screaming!)
│       │   ├── client/                  # Client feature
│       │   │   ├── application/         # Client Use Cases
│       │   │   └── infrastructure/      # Apollo queries/mutations & React views
│       │   └── order/                   # Order feature
│       │       ├── application/
│       │       └── infrastructure/
│       └── main.tsx
└── server/                              # Node.js GraphQL API
    └── src/
        ├── modules/                     # Features/Domains (Screaming!)
        │   ├── client/                  # Client feature
        │   │   ├── application/         # Client use cases
        │   │   └── infrastructure/      # GQL Resolvers/schemas, Mongoose Models/Schemas
        │   └── order/                   # Order feature
        │       ├── application/
        │       └── infrastructure/
        └── index.ts
```

---

## 📐 Non-Negotiable Architecture & Refactor Rules

Act as a **World-Class Software Architect**. Protect the code's health at all costs during the refactor.

### 🏛️ 1. Screaming Clean Architecture

- **Layer Purity:** Every module is split into `domain/` (optional if already in `shared-domain/`), `application/` (Use Cases), and `infrastructure/` (Framework adapters like React, Apollo, Mongoose, Express).
- **Inward Dependencies:** Core domain logic must never import any framework or external library.

### 🔄 2. Strict DRY (Don't Repeat Yourself) Policy

- **Verify Before Writing:** Before writing any piece of code (utility, type, interface, class, or helper function), you **MUST** search the codebase (using `grep`, `glob`, or `search`) to see if an equivalent or reusable artifact already exists.
- **Reusability:** Extract common logic to shared modules or to `shared-domain/` instead of duplicating.

### 🏷️ 3. Strict English & Translation

- All code, variable names, database schemas, GraphQL fields, directories, and comments **MUST** be written in English.
- Spanish terms must be migrated during refactoring (e.g., `pedidos` ➡️ `orders`, `clientes` ➡️ `clients`).

### ⚙️ 4. Strict TypeScript & Best Practices

- **No `any`:** Strict typing is mandatory. If a type is truly dynamic, use generics or `unknown`.
- **No Magic Numbers & No Magic Strings:**
  - Never use raw numbers or raw strings inline for business logic.
  - Store configuration, states, or constants in dedicated `constants.ts` or as readonly static properties / frozen objects within domain value objects.
  - **Standard Enum-like Constant Pattern:** Use frozen readonly objects to define runtime constants and derive compile-time union types to avoid magic strings. For example:
    ```typescript
    // 1. Define the frozen runtime constant (Single Source of Truth)
    export const OrderStatus = {
      PENDING: 'PENDING',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
    } as const;

    // 2. Derive the static TypeScript type for compile-time safety
    export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];
    ```
- **Pattern Matching with `ts-pattern`:**
  - **Never** use traditional `switch` statements or deep nested `if-else` blocks for business-critical state evaluation.
  - Always use the **`ts-pattern`** library (`match` API) to ensure pattern matching is complete and exhaustive.

### ⚛️ 5. Functional React Components

- Convert all legacy class components to React functional components utilizing hooks.
- Follow performance rules (avoiding unnecessary re-renders or stale closures) using the `vercel-react-best-practices` skill.

### 🚫 6. Avoid Classes at All Costs (Functional-First Paradigm)

- **Prefer Functions Over Classes:** Always, always, always avoid using ES6 classes (`class`) wherever possible. Run away from classes!
- **Data as Plain Objects:** Represent domain models, entities, and value objects using pure TypeScript **Types or Interfaces** rather than classes.
- **Logic as Pure Functions & Closures:** Enforce the Functional-First approach. Implement all domain logic, services, and use cases as plain pure functions or functional factory closures (following the Make Pattern).
- **No Class Instances:** Compose behavior using function composition, currying, and plain objects. Only allow classes if strictly forced by external third-party libraries (such as Mongoose models), but even then, encapsulate them and prevent them from leaking into our core domain or application layer.

### 🛡️ 7. Schema Validation with Zod

- **Always Use Zod:** Prefer and enforce the use of **Zod** schemas (`zod` library) for any type of request, input, form, API, or environment variable validation.
- **Type Inference:** Always infer static TypeScript types directly from Zod schemas using `z.infer<typeof schema>` to maintain a single source of truth and avoid duplicating interfaces.
- **No Manual Validation:** Avoid writing custom regexes, complex manual conditional checks, or manual validator functions when a Zod schema can handle the validation.

### 🛡️ 8. Strict Validation Layering Rule (Prioritized Levels)

All validation rules must be concentrated strictly by prioritizing the architectural levels:
- **Value Objects (First Priority):** Place all basic primitive-level formatting and format validations (e.g., email syntax, non-empty strings, positive/non-negative numbers, UUID formats) directly inside the **Value Object** creation.
- **Domain Entities (Second Priority):** Place entity-level multi-field consistency checks and domain validations (e.g., checking password complexity relative to role, validating total calculations, or verifying dependency fields) directly inside the **Domain Entity/Factory** level.
- **Use Cases (Final Priority):** Place external, contextual, or database-dependent validations (e.g., checking if email is already taken, verifying user session permissions, or checking current database stock levels) strictly inside the **Use Case** level.

### 🛡️ 9. Strict Value Object Signatures for Services and Repositories

All repositories and core services must enforce Value Objects at their type boundaries:
- **Value Objects Over Primitives:** Repositories, query parameters, query builders, and filters (`WhereField`) **MUST** use strongly-typed Value Objects (`Id`, `PositiveNumber`, `NonEmptyString`) rather than raw types (`string`, `number`, `any[]`) in their input signatures.
- **Use Case Responsibility:** It is the sole responsibility of the **Use Case** to act as a validation gate, taking raw primitives from the delivery layer and instantiating/validating them into domain Value Objects before passing them down to the repositories or services.
- **No `as any` Castings:** Bypassing Value Object signatures using `as any` on repository inputs is strictly prohibited. If a repository expects a `PositiveNumber` or `Id`, the Use Case must construct it natively (using `PositiveNumberVO.create` or `IdVO.create`).
- **NIL UUID for System Actor:** When database auditing requires an actor `Id` for background or system-driven operations (such as `createdBy`, `updatedBy`, `deletedBy`), use the NIL UUID via `IdVO.generateNil()` instead of the raw string `'system' as any`.

### 🔒 10. No Git Operations Without Explicit Authorization

- No Git operations (commits, pushes, branch creation, or PR operations) are allowed unless explicitly authorized or requested by the user.

### 🔀 11. Branchless Code Style (Early Return / Fail First)

- Always prefer a "branchless" programming style. Instead of wrapping logic in nested `if-else` blocks or deep conditional trees, search first for negative/failing cases, handle them immediately, and perform an early return. This drastically minimizes indentation, reduces cognitive load, and keeps the code linear.
- Example:
  ```typescript
  if (data.failed) {
    return void 0;
  }
  
  // other code...
  ```

### 🔍 12. Explore Before Coding (Mandatory Pre-Development Step)

Before writing a single line of new code, always explore the codebase to identify existing elements that are reusable and/or easily modifiable to meet the current need. **Never build what can be adapted.**

- Search with `grep`, `glob`, or `search` for existing utilities, components, entities, VOs, or patterns that already solve the problem.
- If something reusable or extensible exists, **use or adapt it** — never duplicate.
- This applies to domain logic, infrastructure code, React components, hooks, and utilities equally.

---

## ⚙️ Quality & Development Standards

### 🧩 Functional-First & DI (The "Make" Pattern)

We prioritize keeping our code as simple as possible, moving most of the logic to functions.
We use the "Make" Pattern for dependency injection via **Currying**. A factory function receives dependencies as the first argument group and returns another function with the business logic.

- See [make-pattern.md](docs/agents/make-pattern.md) for routing guidance, structure, and examples.

### 💎 Result Over Throw & Result Composition

- Errors are data, not exceptions. Use the `Result<T, E>` monad. Use Cases and Services must return `Result` to the caller.
- Avoid "if-ladders" (nested `if(result.isFailure)`) by chaining operations.

* See [result-composer.md](docs/agents/result-composer.md) for routing guidance, structure, and examples.

---

## 🛠️ Task Routing & Context Management

Before starting any task, **identify your route** in the table below and load the specific guide using `view_file` only when needed.

| Task Category                | Relevant Documentation                                   | When to Load                                                                      |
| :--------------------------- | :------------------------------------------------------- | :-------------------------------------------------------------------------------- |
| **Architecture & Structure** | [architecture.md](docs/agents/architecture.md)           | Clean/Screaming Architecture rules, feature directories, shared-domain setup.     |
| **Code Verification & Refactoring** | [verification.md](docs/agents/verification.md) | Verifying, fixing, or refactoring existing code. Mandatory pre-commit checklist. |
| **Conventions**              | [conventions.md](docs/agents/conventions.md)             | English naming, TS standards, ts-pattern rules, avoiding magic values.            |
| **Philosophy & Data Flow**   | [philosophy.md](docs/agents/philosophy.md)               | Understanding Use Case orchestration, Single Responsibility, Service contracts of trust, validation layering, and database-first reading with Mongoose. |
| **Make Pattern**             | [make-pattern.md](docs/agents/make-pattern.md)           | Creating or refactoring services or dependency injection.                         |
| **Result Composition**       | [result-composer.md](docs/agents/result-composer.md)     | Chaining multiple operations returning `Result` types.                            |
| **Testing**                  | [testing.md](docs/agents/testing.md)                     | Writing, updating, or running tests.                                              |
| **Agent Guidelines**         | [agents-guidelines.md](docs/agents/agents-guidelines.md) | **MANDATORY:** Load before updating `AGENTS.md` or any file within docs/agents/\* |

---

## 🧭 Agent Skill & Context Discovery (CRITICAL)

To ensure high-performance execution, all AI models MUST locate and load the necessary skills and context correctly:

### 1. Unified Skill Locations
- Skills in this project are stored in:
  - Local project directory: `.agents/skills/`
  - Global home directories: `~/.agents/skills/` and `~/.config/opencode/skills/`
- **DO NOT look for vendor-specific directories** (such as `.gemini/` or `.claudia/`). They DO NOT exist in this workspace.

### 2. Available Skills Source of Truth
- The ultimate **Source of Truth** for which skills are loaded and active is the `<available_skills>` block provided in your system prompt.
- This block contains the exact name, description, and physical file path (with `file://` URI) for each available skill.
- Before executing any task that matches a skill's description, you **MUST** read that skill's markdown file using the exact location path from the system prompt (utilizing the `read` or equivalent tool).

### 3. Context Retrieval Protocol
- If a required skill file cannot be found in your default configured paths, do not assume it is missing. Check the `<available_skills>` block in your system prompt and load it from its explicit URI location.

---

## ✅ Definition of Done (DoD) for the AI

Before considering a task finished and submitting a response or PR, you **MUST** verify the following checklist:

### 🛠️ Technical Quality

- [ ] **Screaming Architecture:** Organized by domain module (folder-by-feature).
- [ ] **Shared Domain:** Common entities and VOs placed in `shared-domain/`.
- [ ] **Explore Before Coding:** Searched codebase for existing reusable elements before writing new code.
- [ ] **Strict DRY check:** Ran search to ensure no code duplication exists.
- [ ] **TypeScript Strict:** Strict typing with zero `any` usages.
- [ ] **No Magic Values:** Refactored magic strings/numbers to constants.
- [ ] **ts-pattern:** Used `match()` instead of `switch` statements for state-based logic.
- [ ] **Clean Architecture:** Domain and Application layers are 100% pure (no framework imports).
- [ ] **English Naming:** Code, variables, schemas, and files are written completely in English.
- [ ] **Functional Components:** All refactored React components are functional and use React hooks.
- [ ] **Make Pattern & Result Composition:** Used where DI or multiple `Result` chainings are present.

### 📖 Readability & Self-Documentation

- [ ] **Self-Documenting:** Naming and structure are clear enough to make comments redundant.
- [ ] **No Dead Code:** Removed unused code, imports, or old comments.

### 🧪 Verification & Testing

- [ ] **Manual/Automatic verification:** Verified that both `client/` and `server/` start up and build cleanly.
- [ ] **No regressions:** Checked that existing features are fully intact or safely migrated.
- [ ] **Error Handling:** Every failure path is handled with a specific `Result.fail()`.
