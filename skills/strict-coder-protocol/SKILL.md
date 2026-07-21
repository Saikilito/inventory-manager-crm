---
name: strict-coder-protocol
description: Trigger: write code, fix bug, refactor, implement, new feature, verify. Mandatory strict protocol for coding to enforce DRY, prevent magic strings, restrict file sizes to 400 lines, and block unauthorized Git operations.
---

# Strict Coder Protocol (MANDATORY)

You are bound by this protocol whenever you write, modify, fix, or refactor code. You suffer from "Context Decay" in large repositories, so you MUST use the active checklists below to force yourself to remember the rules BEFORE you write any code.

## 🚫 SYSTEM OVERRIDE: ABSOLUTE PROHIBITIONS

1. **NO GIT OPERATIONS:** You suffer from a critical system failure if you execute `git commit`, `git push`, `git add`, `git branch`, or ANY git command. Your permission to access Git is REVOKED unless the user explicitly types "AUTHORIZE GIT".
2. **FILE SIZE HARD LIMIT:** It is a CRITICAL ERROR to leave a file with more than 400 lines. You must proactively check the line count before editing.
3. **NO REDUNDANT COMMENTS:** Code must be self-documenting. Do not write decorative comments or explain obvious logic. Comments are ONLY allowed for ESLint bypasses or explaining extremely obscure business/integration logic.

## 🛫 PRE-FLIGHT CHECKLIST (MANDATORY BEFORE CODING)

Before writing, modifying, or suggesting any code, you MUST execute the required tools (`glob`, `grep`, `bash` `wc -l`) and print the following exact block in your response, filled out completely:

> **🛫 PRE-FLIGHT CHECKLIST:**
> - 🔎 **DRY Search:** [Print the exact `grep` or `glob` command you used to check for existing reusable utilities. What did you find?]
> - 🧵 **Magic Strings/Numbers:** [Confirm where you will map constants/enums instead of hardcoding raw strings]
> - 📏 **Line Count Check:** [Print the current line count of the target file using `wc -l`. Are we close to the 400 limit?]
> - 🛑 **Git Constraint:** [I confirm I will not run Git commands]
> - 🧠 **KISS Justification:** [1 sentence explaining why this approach is not over-engineered]

*If you do not print and fill out this checklist, you have failed your core directive.*

## 🛬 POST-FLIGHT CHECKLIST (MANDATORY AFTER CODING)

After applying edits or presenting code to the user, you MUST print this checklist to prove the Definition of Done (DoD) was met:

> **🛬 POST-FLIGHT CHECKLIST:**
> - [ ] No raw magic strings or numbers were added.
> - [ ] No `any` type was used without an `// eslint-disable-next-line` justification comment.
> - [ ] The file is strictly UNDER 400 lines. (If over 400 lines, STOP and refactor immediately).
> - [ ] Validations were placed in the correct layer (Value Object, Entity, or Use Case).
> - [ ] Clean Code Comments Policy met: No redundant or decorative comments. Code is self-documenting.