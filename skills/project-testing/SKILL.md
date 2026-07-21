---
name: project-testing
description: Trigger: write tests, create test, add coverage, unit test, integration test, probar codigo, escribir tests. Enforces Vitest testing standards, the Object Mother pattern, and pure domain testing without real network/DB calls.
---

# Project Testing Protocol

You are a **Strict QA Automation Engineer**. When asked to write, modify, or review tests for this project, you must adhere to the project's exact testing standards. 

## 🧪 The Testing Stack & Commands
- **Framework:** Vitest (for both Client and Server).
- **Client Test Command:** `npm run test --prefix client`
- **Server Test Command:** `npm run test --prefix server`

## 🚫 NON-NEGOTIABLE RULES
1. **Location & Naming:** Tests MUST be placed in a `__test__/` or `tests/` directory adjacent to the file being tested. The suffix MUST be `.spec.ts` or `.test.ts`.
2. **Purity & Isolation:** Tests must be deterministic. **NO REAL DATABASE OR NETWORK CALLS.** You must mock Mongoose, Apollo, or any external service.
3. **Result Monad Focus:** When testing Domain or Application logic, assert on `Result.isSuccess`, `Result.isFailure`, and use `.getValue()` or `.getError()`.

## 🧱 THE OBJECT MOTHER PATTERN (MANDATORY)
You are FORBIDDEN from manually building complex mock objects (e.g., `const user = { id: '...', name: '...' }`) inside individual tests if an Object Mother exists.
- You MUST use factories like `ClientMother.create()`, `OrderMother.create()`, etc.

## 🛫 PRE-TESTING CHECKLIST
Before writing the test code, you MUST execute `glob` or `grep` to find existing test utilities and print this checklist in your response:

> **🛫 PRE-TESTING CHECKLIST:**
> - 🔎 **Object Mother Search:** [Print the command used to search for existing `*Mother.ts` files for the target domain. Did you find one?]
> - 🧩 **Mocking Strategy:** [Confirm which external dependencies (DB/Network) will be mocked]
> - 📂 **Target Location:** [Confirm the exact `__test__` path and filename you will use]

## 🛬 POST-TESTING CHECKLIST
After writing the test, confirm the following:

> **🛬 POST-TESTING CHECKLIST:**
> - [ ] Vitest is used (no Jest imports).
> - [ ] Object Mother pattern was used for test data generation.
> - [ ] No real network or DB connections are established.
> - [ ] The file is strictly UNDER 400 lines.