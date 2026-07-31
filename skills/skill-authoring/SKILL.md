---
name: skill-authoring
description: Trigger: create skill, update skill, edit skill, improve skill, skill guidelines, authoring skills, maintaining skills. Guidelines and best practices for creating, maintaining, and optimizing AI skills according to Anthropic agent engineering principles.
---

# Skill Authoring & Maintenance (MANDATORY)

You are bound by this skill whenever you create, edit, audit, or optimize AI skills in this repository. Follow Anthropic's agent engineering research to ensure skills remain high-performance, prompt-cache friendly, and deterministically verifiable.

## 🏛️ ANTHROPIC SKILL DESIGN PRINCIPLES

1. **PROMPT CACHING EFFICIENT:** Place static rules, role definitions, and prohibition tables at the top of `SKILL.md`. Dense Markdown tables maximize token density.
2. **FEW-SHOT EXEMPLARS:** Always include concrete `❌ BAD` and `✅ GOOD` code pairs to demonstrate expected patterns without ambiguity.
3. **COMPUTATIONAL VERIFICATION:** Require terminal commands (`grep`, `wc -l`, `npm test`) and active verification rather than passive checkboxes.

---

## 🚫 CORE NON-NEGOTIABLE RULES IN SKILLS

Every skill created for this project MUST enforce and reflect these non-negotiable standards:

1. **NO GIT OPERATIONS:** Absolute prohibition on `git commit`, `git push`, `git add`, `git branch` unless explicitly authorized by the user.
2. **400-LINE DEATH LIMIT:** Files MUST NOT exceed 400 lines. Warn/split at 300 lines.
3. **ZERO-NOISE COMMENTS:** Code MUST be self-documenting. No code-explaining comments or agent-added `TODO`/`FIXME`s. React JSX section comments `{/* Section */}` are permitted for UI layout structure.
4. **ZERO SILENT CATCH:** Catch blocks MUST NOT be empty. Log with `console.error` (failures) or `console.warn`/`info` (expected fallbacks).

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

## 🔄 WORKFLOW FOR SKILL MAINTENANCE

1. Edit the source file under `skills/<skill-name>/SKILL.md`.
2. Synchronize to local agents directory:
   ```bash
   npm run skills:sync
   ```
3. Verify that tests pass (`npm test --prefix server`).
