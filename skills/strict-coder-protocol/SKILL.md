---
name: strict-coder-protocol
description: Trigger: write code, fix bug, refactor, implement, new feature, verify. Mandatory strict protocol for coding to enforce DRY, prevent magic strings, restrict file sizes to 400 lines, block unauthorized Git operations, prevent redundant comments, and enforce zero silent catch.
---

# Strict Coder Protocol (MANDATORY)

You are bound by this protocol whenever you write, modify, fix, or refactor code. You suffer from "Context Decay" in large repositories, so you MUST use the active checklists below to force yourself to remember the rules BEFORE you write any code.

## 🚫 SYSTEM OVERRIDE: ABSOLUTE PROHIBITIONS MATRIX

| Rule ID | Prohibition | Corrective Action |
| :--- | :--- | :--- |
| **NO-GIT** | `git commit`, `git push`, `git add`, `git branch` | REVOKED unless user types "AUTHORIZE GIT" |
| **SIZE-400** | Leaving files over 400 lines | Must proactively check `wc -l` and split |
| **NO-NOISE-COMMENTS** | Comments explaining WHAT/HOW code works or agent-added TODO/FIXMEs | Refactor variable/function names or improve types |
| **ZERO-SILENT-CATCH** | Empty `catch {}` or swallowing errors silently | Log with `console.error` (failures) or `console.warn`/`info` (fallbacks) |

---

## 💡 FEW-SHOT CODE EXEMPLARS

### 💬 Commenting Policy
```typescript
// ❌ BAD - Explains what obvious code does
// Reset state for next use
setStep('form');

// ❌ BAD - Agent-added TODO
// TODO: implement caching later

// ✅ GOOD - React JSX section comment for visual structure
{/* Header Filters Bar */}

// ✅ GOOD - ESLint bypass with justification
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 3rd party API lacks types
```

### 🛡️ Error Catching Policy
```typescript
// ❌ BAD - Silent catch / error swallowing
try {
  savedOrder = JSON.parse(savedOrderJson);
} catch {}

// ✅ GOOD - Logged fallback
try {
  savedOrder = JSON.parse(savedOrderJson);
} catch (err) {
  console.warn('[Storage] Failed to parse saved item order:', err);
}
```

---

## 🛫 PRE-FLIGHT CHECKLIST (MANDATORY BEFORE CODING)

Before writing, modifying, or suggesting any code, you MUST execute the required tools (`glob`, `grep`, `bash` `wc -l`) and print the following exact block in your response, filled out completely:

> **🛫 PRE-FLIGHT CHECKLIST:**
>
> - 🔎 **DRY Search:** [Print the exact `grep` or `glob` command you used to check for existing reusable utilities. What did you find?]
> - 🧵 **Magic Strings/Numbers:** [Confirm where you will map constants/enums instead of hardcoding raw strings]
> - 📏 **Line Count Check:** [Print the current line count of the target file using `wc -l`. Are we close to the 400 limit?]
> - 💬 **Zero-Noise Comment Commitment:** [I confirm I will not add code-explaining comments or TODO/FIXMEs. Code will be self-documenting.]
> - 🛡️ **Error Logging Commitment:** [I confirm every try-catch block will log caught errors and never leave empty catch blocks.]
> - 🛑 **Git Constraint:** [I confirm I will not run Git commands]
> - 🧠 **KISS Justification:** [1 sentence explaining why this approach is not over-engineered]

_If you do not print and fill out this checklist, you have failed your core directive._

## 🛬 POST-FLIGHT CHECKLIST (MANDATORY AFTER CODING)

After applying edits or presenting code to the user, you MUST print this checklist to prove the Definition of Done (DoD) was met:

> **🛬 POST-FLIGHT CHECKLIST:**
>
> - [ ] No raw magic strings or numbers were added.
> - [ ] No `any` type was used without an `// eslint-disable-next-line` justification comment.
> - [ ] The file is strictly UNDER 400 lines. (If over 400 lines, STOP and refactor immediately).
> - [ ] Validations were placed in the correct layer (Value Object, Entity, or Use Case).
> - [ ] Clean Code Comments Policy met: Verified with `grep -n "//"`.
> - [ ] Zero Silent Catch Policy met: Verified with `grep -n -A 2 "catch"`.