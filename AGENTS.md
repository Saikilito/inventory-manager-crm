# AGENTS.md

> [!IMPORTANT]
> This is a high-performance **Full-Stack JS/TS Screaming Architecture Project Router**.
> Your mission is to load ONLY the context and skills necessary for the current task. Do not load
> everything at once. We are transitioning this project to **TypeScript, Clean/Screaming Architecture**,
> and high-quality development standards.

> [!WARNING]
> **STRICT GIT PROHIBITION:** You are absolutely FORBIDDEN from executing any Git operations (including `git commit`, `git push`, `git merge`, or creating/deleting branches) without explicit, upfront user authorization. Never run these commands automatically.

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

## 🛠️ Task Routing & Cognitive Context Management (Traffic Controller)

To prevent "Context Hell" and preserve token efficiency, **YOU MUST LAZY-LOAD SUB-DOCUMENTATION ON-DEMAND**. Identify your current task category in the table below and load the corresponding guide using the `read` tool **ONLY when needed**.

| Task Category | Relevant Documentation File | When to Load / Trigger | Active AI Skills & Tools |
| :--- | :--- | :--- | :--- |
| **Architecture & Project Setup** | `docs/agents/architecture.md` | Initial project exploration, creating new modules/features, structuring shared-domain. | `glob`, `read`, `stitch-design` |
| **Coding Style & Conventions** | `docs/agents/conventions.md` | Writing any React components, TypeScript files, defining types, or writing functions. | `refactor`, `vercel-react-best-practices`, `typescript-advanced-types` |
| **Logic Orchestration & Data Flow** | `docs/agents/philosophy.md` | Writing use cases, database queries, designing service interactions, validation layers. | `refactor`, `context7-mcp` |
| **Dependency Injection** | `docs/agents/make-pattern.md` | Implementing or refactoring services, use cases, or wiring repositories via closures. | `make-pattern`, `refactor` |
| **Sequential Error Chaining** | `docs/agents/result-composer.md` | When chaining 2+ sequential actions that return `Result` monads to avoid nested if-ladders. | `result-composer` |
| **Testing & Verification** | `docs/agents/testing.md` | Writing unit/integration tests, running test commands, configuring test suites. | `go-testing`, `sdd-verify` |
| **Code Verification & Fixing** | `docs/agents/verification.md` | Before submitting a pull request, committing code, or fixing existing bugs. | `sdd-verify`, `work-unit-commits` |
| **Agent / Guideline Maintenance** | `docs/agents/agents-guidelines.md` | **MANDATORY:** Before updating `AGENTS.md` or any file within `docs/agents/*`. | `skill-improver`, `skill-creator` |

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
- [ ] **Branchless:** Used early returns, guard clauses, and ternaries instead of nested `if-else`.
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
