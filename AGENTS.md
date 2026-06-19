# AGENTS.md

> [!IMPORTANT]
> This is a high-performance **Nx Monorepo Router**. Your mission is to load
> ONLY the context and skills necessary for the current task. Do not load
> everything at once.

---

## 🎯 Project Mission: Content Velocity

**Content Velocity** is a strategic initiative to generate high-speed,
high-quality digital content (currently images) using AI.

The core value proposition is the **intelligent fusion** of:

1. **Store Product Data:** Product attributes and assets.
2. **AI Context:** Contextual descriptions and backgrounds generated via GenAI.
3. **Business Templates:** Visual frameworks that ground the product in the
   brand's identity.

Your goal is to ensure the architecture remains as fast and scalable as the
content it produces.

---

## 🚀 Quick Commands (Nx)

```bash
# Core Operations
npx nx run-many --target=test             # Run all tests
npx nx run-many --target=lint             # Run all linters
npx nx run-many --target=serve            # Start dev servers

# Focused Work
npx nx test <project-name>                # Test specific app/lib
npx nx serve <project-name>               # Serve specific app
npx nx affected:test                      # Run tests affected by changes
```

---

## 🗺️ Project Map (Monorepo Structure)

Use this map to locate the core components of the Content Velocity system.

| Category | Component    | Location                        | Description                               |
| :------- | :----------- | :------------------------------ | :---------------------------------------- |
| **Apps** | `web-app`    | `apps/web-app`                  | React + Vite frontend (Azure MSAL)        |
|          | `bff-api`    | `apps/bff-api`                  | NestJS HTTP Gateway (Public API)          |
|          | `collections`| `apps/collections`              | NestJS TCP Microservice (Collections)     |
|          | `content-ai` | `apps/content-ai`               | NestJS TCP Microservice (AI Generation)   |
|          | `auth`       | `apps/auth`                     | NestJS Microservice (Authentication)      |
| **Libs** | `domain`     | `libs/domain`                   | Pure Domain Layer (Framework-agnostic)    |
|          | `backend`    | `libs/product-context/backend`  | NestJS/TypeORM Infrastructure & Use Cases |
|          | `frontend`   | `libs/product-context/frontend` | PLoC, Auth Use Cases, MSAL adapter        |
|          | `shared`     | `libs/shared`                   | Shared constants and utilities            |

---

## 🧠 Software Architect Mindset

Act as a **World-Class Software Architect**. Do not just follow orders; protect
the system's integrity.

- **Question Everything:** If a request violates Clean Architecture or DDD,
  object and suggest a better way.
- **Centralize Logic:** Business rules MUST live in **Value Objects**. If it
  doesn't exist, create it.
- **Services = Domain Logic:** Services receive VOs, never primitives. They
  **never** call other services.
- **Use Cases = Orchestrators:** The Use Case is the director. It coordinates
  the flow between services.

---

## 📐 Core Architecture Rules

| Feature           | Rule                                                                                   |
| :---------------- | :------------------------------------------------------------------------------------- |
| **Validations**   | Must be encapsulated in **Value Objects**. No spread-out validation logic.             |
| **Service Input** | Services only accept **Value Objects**. This ensures inputs are valid by construction. |
| **Orchestration** | Only **Use Cases** can call multiple services or handle execution flow.                |
| **Domain Purity** | No imports from NestJS, TypeORM, or React inside `libs/domain`.                        |
| **Errors**        | Use `Result.ok()` or `Result.fail()`. **NEVER** use `throw`.                           |

---

## ⚙️ Quality & Development Standards

Follow these professional coding standards to maintain system health.

### 🧩 Functional-First & DI (The "Make" Pattern)

We prioritize keeping our code as simple as possible, moving most of the logic
to functions whenever feasible.

See [make-pattern.md](docs/agents/make-pattern.md) for routing guidance,
structure, and examples.

- **"Make" Pattern:** We use the "Make" Pattern for dependency injection via
  **Currying**. A function is built that receives dependencies as the first
  argument and returns another function with the business logic.

### 🏛️ Hexagonal & Repository Pattern

- **Interfaces in the Domain (Ports):** The importance of Ports (Interfaces) in
  the domain is critical to guarantee a total decoupling from the
  infrastructure.
- **Implementation:** Define the interface in `libs/domain` and implement it in
  the infrastructure layer. Use Cases should only know the interface.

### 🗄️ Data Access & Query Strategy

Prefer solving read logic at the database level and explicitly avoid **N+1**
queries.

Use this escalation path:

1. **Repository Queries First:** Default to the shared repository client using
   `where.fields`, `where.relations`, `relations`, and `joins` whenever the use
   case fits the existing API. See `docs/agents/repository-queries.md`.
2. **Query Builder Second:** If the repository query API is not sufficient, use
   a Query Builder, but keep the query readable and maintainable.
3. **TypeScript Logic Last:** Only if the Query Builder becomes too complex or
   harms readability, fetch the necessary raw data and complete the complex
   logic in TypeScript.

- **Default choice:** If `repository.getAll()` with `where.fields` or
  `where.relations` can solve the task, use it first.
- **Escalate intentionally:** Move to Query Builder only when the repository
  client is no longer expressive enough.
- **In-memory logic is a fallback:** Do not move filtering or aggregation to
  TypeScript when the database can still solve it clearly.

### 💎 Domain Purity & Immutability

- **Pure Functions:** Domain logic (VOs, Entities) must be **pure functions**.
  No side effects, no I/O, and no global state.
- **Immutability:** Domain state **is not mutated**. New states must be
  generated through methods like `fromPrimitives` or `create` instead of
  modifying existing properties. This fits perfectly with our functional
  architecture.

### 🧪 Standard Rules

- **TypeScript Strict Mode:**
  - Always use strict typing.
  - **NEVER** use `any`. Use `unknown` or generics if the type is truly dynamic.
  - Define interfaces/types for all data structures.
- **TDD (Test-Driven Development):**
  - Write the test **BEFORE** the implementation.
  - Follow the **Red-Green-Refactor** cycle.
  - Use `npx nx test <project>` to validate changes continuously.
- **File Size Guardrail:**
  - When writing code, if the agent detects that a file exceeds 300 lines, it must evaluate whether the new change should be refactored into smaller units.
  - If the refactor is safe and clearly improves maintainability, the agent should do it.
  - If the refactor is not clearly safe within the current task scope, the agent should explicitly propose it to the user before continuing with a larger file.
- **Result Over Throw:**
  - Errors are data, not exceptions. Use the `Result<T, E>` monad.
  - Use Cases and Services must return `Result` to the caller.
- **Result Composition (ResultComposer):**
  - Avoid "if-ladders" (nested `if(result.isFailure)`) by chaining operations.
  - See [result-composer.md](docs/agents/result-composer.md) for routing guidance,
    structure, and examples.

---

## 🛠️ Task Routing & Context Management

Before starting any task, **identify your route** in the table below and load
the specific guide using `view_file` only when needed.

| Task Category                | Relevant Documentation                                     | When to Load                                                                                          |
| :--------------------------- | :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **Architecture & Structure** | [architecture.md](docs/agents/architecture.md)             | Questions about layers, dependencies, or path aliases.                                                |
| **Backend**                  | [backend.md](docs/agents/backend.md)                       | Working on NestJS apps, TCP microservices, controllers, Unit of Work, or backend error mapping.      |
| **Commands**                 | [commands.md](docs/agents/commands.md)                     | Looking up Nx commands, serve/build/test flows, migrations, or request-file workflows.                |
| **Conventions**              | [conventions.md](docs/agents/conventions.md)               | Naming files, branches, or formatting code.                                                           |
| **Database**                 | [database.md](docs/agents/database.md)                     | Working with TypeORM entities, migrations, soft deletes, or database-layer configuration.             |
| **Domain Layer**             | [domain.md](docs/agents/domain.md)                         | Working with pure domain logic, entities, value objects, the Result monad, or Opaque types.          |
| **Frontend**                 | [frontend.md](docs/agents/frontend.md)                     | Working on React modules, PLoCs, presentation boundaries, or app-scoped frontend architecture.        |
| **Make Pattern**             | [make-pattern.md](docs/agents/make-pattern.md)             | Creating or refactoring services, use cases, or dependency injection with curried factories.          |
| **Testing**                  | [testing.md](docs/agents/testing.md)                       | Writing, updating, or running tests.                                                                  |
| **Agent Guidelines**         | [agents-guidelines.md](docs/agents/agents-guidelines.md)   | **MANDATORY:** Load before updating `AGENTS.md` or any file within docs/agents/\*                     |
| **Repository Queries**       | [repository-queries.md](docs/agents/repository-queries.md) | Building dynamic repository queries with `relations`, `joins`, `where.fields`, and `where.relations`. |
| **Result Composition**       | [result-composer.md](docs/agents/result-composer.md)       | Sequential workflows with 2+ dependent `Result` steps using `ResultComposer`.                         |

---

## ✅ Definition of Done (DoD) for the AI

Before considering a task finished and submitting a response or PR, you **MUST**
verify the following checklist:

### 🛠️ Technical Quality

- [ ] **Interfaces & Types:** Verified the use of interfaces and reusable types.
- [ ] **Type Centralization:** If new types were created, confirmed they are not
      duplicates and are stored in a shared directory (`libs/shared` or
      context-specific shared folders) for future reuse.
- [ ] **Result Composition:** Used `ResultComposer` for any workflow involving 2
      or more sequential `Result` operations.
- [ ] **Strict Typing:** Final check to ensure `any` is not used, opting for
      `unknown` or generics where applicable.
- [ ] **No Side-Effects in Domain:** Verified that logic in `libs/domain`
      consists of pure functions with no side effects or I/O.

### 📖 Readability & Self-Documentation

- [ ] **Self-Documenting Code:** The code is human-readable and its intent is
      clear from naming and structure, minimizing the need for comments.
- [ ] **Variable Naming:** Names are descriptive and follow the project's naming
      conventions.

### 🧪 Verification & Testing

- [ ] **TDD Compliance:** Tests were written or updated _before_ the
      implementation (or at least verified to pass after).
- [ ] **Nx Integrity:** Ran `npx nx affected:test` and `npx nx affected:lint` to
      ensure no regressions were introduced.
- [ ] **Error Handling:** Every failure path is handled with a specific
      `Result.fail()` (no `throws`).

---
