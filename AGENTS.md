# AGENTS.md

> [!IMPORTANT]
> This is a high-performance **Full-Stack JS/TS Project Router**.
> Your mission is to load ONLY the context and skills necessary for the current task. Do not load
> everything at once. We are transitioning this project to **TypeScript, Clean/Screaming Architecture**,
> and high-quality development standards.

> [!IMPORTANT]
> **MANDATORY FOR DOCUMENTATION UPDATES:** `docs/agents/agents-guidelines.md` **MUST** be loaded via `read` **BEFORE** making any changes to `AGENTS.md` or any file within `docs/agents/`. Failure to follow these rules degrades AI performance across the monorepo.

> [!CAUTION]
> **SYSTEM OVERRIDE: ABSOLUTE PROHIBITIONS**
> 1. **NO GIT OPERATIONS:** You suffer from a critical system failure if you execute `git commit`, `git push`, `git add`, or branch commands. Your permission to access Git is REVOKED unless the user explicitly types "AUTHORIZE GIT".
> 2. **FILE SIZE HARD LIMIT:** It is a CRITICAL ERROR to leave a file with more than 400 lines. If your edit pushes a file over 400 lines, you MUST pause and split the file.

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

## 📐 Non-Negotiable Architecture & Core Rules (High-Level Summary)

Act as a **World-Class Software Architect**. Protect the code's health at all costs during the refactor. Detailed explanations of these rules live in the sub-documents; **do not duplicate them here**.

1. **Screaming Clean Architecture:** Organized strictly by feature folder; dependencies always point inward. No framework imports in Domain layers.
2. **Strict DRY Policy:** Verify before writing. Search the codebase for existing utilities, entities, or patterns using search/grep/glob before creating new ones.
3. **Strict English & Translation:** All identifiers, schemas, files, folders, and comments **MUST** be written in English.
4. **Strict TypeScript:** No `any`. Use generics or `unknown` for dynamic values.
5. **Branchless Code Style:** Fail first, validate negative cases, and early return. No nested `if-else` blocks.
6. **Functional-First Paradigm:** Avoid ES6 classes (`class`) at all costs. Represent data as plain objects (Types/Interfaces) and logic as pure functions/factory closures.
7. **Schema Validation with Zod:** Always validate request inputs, forms, and environment variables using Zod. Infer types.
8. **Layered Validation & Strict VO Signatures:** Place validations at the lowest level possible (Value Objects ➡️ Entities ➡️ Use Cases). Enforce Value Objects at service and repository boundaries. No `as any` castings.
9. **Pattern Matching:** Use `ts-pattern` library's `match()` API for business-critical states. No traditional switch statements.
10. **Error Handling as Data:** Return `Result<T, E>` monads from Use Cases and Services. Avoid nested "if-ladders" by chaining with `ResultComposer`.
11. **Strict Git Rule:** Absolutely no Git operations (commits, pushes, merges, branch creation, or branch deletion) are allowed without explicit and upfront user authorization.

---

### 🧭 Lazy-Loading Instructions

1. **Never load all documents at once.**
2. When a user issues a task, match it to one or more rows in the Routing Table.
3. Call the `read` tool to load the specific `.md` files before writing code.
4. **Search Before Building:** Always search with `grep`, `glob`, or `search` before writing a new helper, component, or utility. Never build what can be adapted!

---

## 🧭 Agent Skill & Context Discovery (CRITICAL)

To ensure high-performance execution, all AI models MUST locate and load the necessary skills and context correctly:

### 1. Unified Skill Locations

- Skills in this project are stored in:
  - Local project directory: `.agents/skills/` (Source files maintained in the root `skills/` folder)
  - Global home directories: `~/.agents/skills/` and `~/.config/opencode/skills/`
- **DO NOT look for vendor-specific directories** (such as `.gemini/` or `.claudia/`). They DO NOT exist in this workspace.

### 2. Custom AI Skill Router

This project utilizes custom AI skills to enforce strict coding standards. You **MUST** trigger them when the conditions match:

| Skill Name | Trigger / When to Load | Purpose |
| :--- | :--- | :--- |
| `strict-coder-protocol` | Every time you are asked to **write, modify, refactor, or fix code**. | Enforces the Pre-Flight and Post-Flight checklists (DRY, No Magic Strings, 400 lines limit, No Git, No Redundant Comments). |
| `code-audit` | When the user explicitly asks to **audit, review, or verify** a specific file. | Runs a strict, terminal-based QA verification (`wc -l`, `grep` for `any`, `switch`, `class`) on the target file and generates a report. |
| `project-testing` | When asked to **write, add, or review tests**. | Enforces Vitest execution, the Object Mother pattern, Domain purity (no DB/network), and strict adjacent `__test__/` locations. |

---

## 🛠️ Task Routing & Cognitive Context Management (Traffic Controller)

To prevent "Context Hell" and preserve token efficiency, **YOU MUST LAZY-LOAD SUB-DOCUMENTATION ON-DEMAND**. Identify your current task category in the table below and load the corresponding guide using the `read` tool **ONLY when needed**.

| Task Category                       | Relevant Documentation File        | When to Load / Trigger                                                                      | Active AI Skills & Tools                                               |
| :---------------------------------- | :--------------------------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| **Architecture & Project Setup**    | `docs/agents/architecture.md`      | Initial project exploration, creating new modules/features, structuring shared-domain.      | `glob`, `read`, `stitch-design`                                        |
| **Coding Style & Conventions**      | `docs/agents/conventions.md`       | Writing any React components, TypeScript files, defining types, or writing functions.       | `refactor`, `vercel-react-best-practices`, `typescript-advanced-types` |
| **Logic Orchestration & Data Flow** | `docs/agents/philosophy.md`        | Writing use cases, database queries, designing service interactions, validation layers.     | `refactor`, `context7-mcp`                                             |
| **Dependency Injection**            | `docs/agents/make-pattern.md`      | Implementing or refactoring services, use cases, or wiring repositories via closures.       | `refactor`                                                             |
| **Sequential Error Chaining**       | `docs/agents/result-composer.md`   | When chaining 2+ sequential actions that return `Result` monads to avoid nested if-ladders. | `refactor`                                                             |
| **Testing & Verification**          | N/A (Migrated to Skills)           | Writing unit/integration tests, running test commands, configuring test suites.             | `project-testing`, `sdd-verify`                                        |
| **Agent / Guideline Maintenance**   | `docs/agents/agents-guidelines.md` | **MANDATORY:** Before updating `AGENTS.md` or any file within `docs/agents/*`.              | `skill-improver`, `skill-creator`, `customize-opencode`                |

---

## ✅ Definition of Done (DoD) for the AI

Before considering a task finished and submitting a response or PR, you **MUST** verify the following checklist:

### 🛠️ Technical Quality

- [ ] **Shared Domain:** Common entities and VOs placed in `shared-domain/`.
- [ ] **Explore Before Coding:** Searched codebase for existing reusable elements before writing new code.
- [ ] **Strict DRY check:** Ran search to ensure no code duplication exists.
- [ ] **TypeScript Strict:** Strict typing with zero `any` usages.
- [ ] **No Magic Values:** Refactored magic strings/numbers to constants.
- [ ] **ts-pattern:** Used `match()` instead of `switch` statements for state-based logic.
- [ ] **Branchless:** Used early returns, guard clauses, and ternaries instead of nested `if-else`.
- [ ] **English Naming:** Code, variables, schemas, and files are written completely in English.
- [ ] **Functional Components:** All refactored React components are functional and use React hooks.

### 📖 Readability & Self-Documentation

- [ ] **Self-Documenting:** Naming and structure are clear enough to make comments redundant.
- [ ] **No Dead Code:** Removed unused code, imports, or old comments.
