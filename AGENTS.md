# AGENTS.md

> [!IMPORTANT]
> This is a high-performance **Full-Stack JS/TS Project Router**. Load ONLY the context necessary for the current task.

> [!IMPORTANT]
> **MANDATORY FOR DOCUMENTATION UPDATES:** `docs/agents/agents-guidelines.md` **MUST** be loaded via `read` **BEFORE** making any changes to `AGENTS.md` or any file within `docs/agents/`.

---

## 🚨 Critical Constraints

> [!CAUTION]
> **SYSTEM OVERRIDE: ABSOLUTE PROHIBITIONS**
> 1. **NO GIT OPERATIONS:** No `git commit`, `git push`, `git add`, or branch commands unless user explicitly types "AUTHORIZE GIT".
> 2. **FILE SIZE HARD LIMIT:** 400 lines maximum per file. If approaching 300 lines, pause and split.
> 3. **EXPLORE BEFORE CODING:** Search the codebase (`grep`, `glob`) before writing new utilities, components, or logic.

---

## 🎯 Project Mission

An inventory and customer relationship management (CRM) system for managing products, clients, sellers, and orders. Transitioning to **TypeScript, English naming, Screaming Architecture**, and high-quality standards.

---

## 📐 Quality Standards (High-Level Summary)

| Rule | Enforcement |
|:-----|:------------|
| **Screaming Architecture** | Folder-by-feature; dependencies point inward. |
| **Strict DRY** | Search before writing. No duplicates. |
| **Strict English** | All identifiers, files, folders in English. |
| **Strict TypeScript** | No `any`. Use generics or `unknown`. |
| **Functional-First** | No ES6 classes. Pure functions and factory closures. |
| **Result Monad** | Return `Result<T, E>` from Use Cases. No `throw`. |
| **Pattern Matching** | Use `ts-pattern` `match()`. No `switch`. |
| **Zod Validation** | Validate all inputs. Infer types. |

See [conventions.md](docs/agents/conventions.md) for detailed rules.

---

## 🚀 Quick Commands

See [commands.md](docs/agents/commands.md) for full command reference.

---

## 🧭 Agent Skill & Context Discovery

Skills are stored in:
- Local: `.agents/skills/`
- Global: `~/.agents/skills/` and `~/.config/opencode/skills/`

### Custom AI Skill Router

| Skill Name | Trigger | Purpose |
|:-----------|:--------|:--------|
| `strict-coder-protocol` | Writing, modifying, refactoring, or fixing code | Pre-Flight and Post-Flight checklists (DRY, No Magic Strings, 400 lines limit) |
| `code-audit` | Auditing, reviewing, or verifying a file | QA verification (`wc -l`, `grep` for `any`, `switch`, `class`) |
| `project-testing` | Writing, adding, or reviewing tests | Vitest, Object Mother, Domain purity |

---

## 🛠️ Task Routing (Traffic Controller)

| Task Category | Documentation | When to Load |
|:--------------|:--------------|:-------------|
| **Architecture & Project Setup** | [architecture.md](docs/agents/architecture.md) | Creating modules, structuring shared-domain |
| **Coding Style & Conventions** | [conventions.md](docs/agents/conventions.md) | Writing React components, TypeScript files |
| **Logic & Data Flow** | [philosophy.md](docs/agents/philosophy.md) | Use cases, database queries, validation layers |
| **Dependency Injection** | [make-pattern.md](docs/agents/make-pattern.md) | Services, use cases, repository wiring |
| **Sequential Error Chaining** | [result-composer.md](docs/agents/result-composer.md) | Chaining 2+ `Result` monads |
| **Testing & Verification** | [verification.md](docs/agents/verification.md) | Tests, DoD checklist |
| **Commands** | [commands.md](docs/agents/commands.md) | Dev, test, build commands |
| **Guideline Maintenance** | [agents-guidelines.md](docs/agents/agents-guidelines.md) | Updating `AGENTS.md` or `docs/agents/*` |

---

## ✅ Definition of Done

See [verification.md](docs/agents/verification.md) for the full checklist.
