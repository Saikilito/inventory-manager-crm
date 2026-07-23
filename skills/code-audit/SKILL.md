---
name: code-audit
description: 'Trigger: verify changes, judgment-day, audit code, review code, code-review, post-write check, auditar codigo, verificar archivos. Execute a strict post-coding audit on specific files to ensure compliance with architecture, DRY, magic strings/numbers, dead code, and file size constraints.'
license: MIT
metadata:
  author: Saikilito
  version: '1.3'
---

# Code Audit & Post-Writing Verification

You are the **Lead Quality Assurance Architect**. Your job is to audit code that has just been written or modified to ensure it strictly complies with the project's non-negotiable rules.

When invoked, you MUST use terminal tools (`read`, `bash`, `grep`, `wc -l`) to actively inspect the target files. Do not just guess; verify computationally.

---

## 🕵️‍♂️ Audit Protocol (Execute Sequentially)

For every file you are asked to audit, perform these exact checks in order:

### 1. 📏 The 400-Line Death Limit

```bash
wc -l <file>
```

| Result        | Verdict                          |
| :------------ | :------------------------------- |
| < 300 lines   | ✅ PASS                          |
| 300-400 lines | ⚠️ WARNING - Consider splitting  |
| > 400 lines   | ❌ FAIL - Must split immediately |

---

### 2. 🔎 DRY Violation Check

```bash
# Check for duplicate function names
grep -rn "function [a-zA-Z]" --include="*.ts" | cut -d: -f3 | sort | uniq -d

# Check for similar code patterns
grep -rn "similar-pattern" --include="*.ts"
```

| Check                         | Action                                |
| :---------------------------- | :------------------------------------ |
| Duplicate function names      | Flag for extraction to shared utility |
| Similar logic patterns        | Flag for consolidation                |
| Same utility exists elsewhere | Flag for reuse                        |

**Verdict:** `PASS` / `FAIL - duplicates found at lines X, Y`

---

### 3. 🧵 Magic Strings & Numbers Check

```bash
# Find potential magic strings (excluding imports, exports, types, comments)
grep -rn "'[a-zA-Z0-9_\- ]\{3,\}'" --include="*.ts" | grep -v "import\|export\|const\|enum\|type\|interface\|//"

# Find potential magic numbers (excluding 0, 1, array indices)
grep -rn "[^a-zA-Z_][0-9]\{2,\}[^0-9]" --include="*.ts" | grep -v "const\|enum\|//"
```

| Pattern                              | Flag                      |
| :----------------------------------- | :------------------------ |
| Status codes (`200`, `404`, `500`)   | Should use enum           |
| Environment strings (`'production'`) | Should use enum           |
| Feature flags (`'ENABLE_X'`)         | Should use constant/enum  |
| Thresholds (`100`, `30`)             | Should use named constant |
| URLs hardcoded                       | Should use constant       |
| Error messages inline                | Should use constant       |

**Verdict:** `PASS` / `FAIL - magic strings at lines X, Y` / `FAIL - magic numbers at lines A, B`

---

### 4. 💀 Dead Code Check

```bash
# Unused imports (check IDE/eslint warnings first)
# Unused variables
grep -rn "const [a-zA-Z_]* = " --include="*.ts" | while read line; do
  var=$(echo "$line" | sed 's/.*const \([a-zA-Z_]*\).*/\1/')
  count=$(grep -c "$var" <file>)
  if [ "$count" -le 1 ]; then
    echo "Unused variable: $var"
  fi
done

# Commented code
grep -rn "^[ \t]*//.*[a-zA-Z].*(.*).*{" --include="*.ts"

# Console.logs
grep -rn "console\." --include="*.ts"
```

| Type             | Action                      |
| :--------------- | :-------------------------- |
| Unused imports   | Remove                      |
| Unused variables | Remove or use               |
| Commented code   | Delete (Git has history)    |
| Console.logs     | Remove or use proper logger |

**Verdict:** `PASS` / `FAIL - dead code at lines X, Y`

---

### 5. 💬 Comments Audit (Zero-Tolerance for Noise)

```bash
# Find all comments
grep -n "//" <file>
grep -n "/\*" <file>

# Find potentially redundant comments (NOT eslint/TODO/FIXME)
grep -n "^[ \t]*\/\/" <file> | grep -v "eslint-disable\|TODO\|FIXME\|@ts-ignore\|@ts-expect-error"
```

**Rule:** Comments are a LAST RESORT. Code must be self-documenting.

| Comment Type                              | Verdict                                 |
| :---------------------------------------- | :-------------------------------------- |
| ESLint bypass with justification          | ✅ PASS                                 |
| `// TODO(ticket):` or `// FIXME(ticket):` | ✅ PASS                                 |
| Obscure business rule explanation         | ✅ PASS                                 |
| Non-obvious integration/API quirk         | ✅ PASS                                 |
| Explains WHAT code does                   | ❌ FAIL - Delete or rename variables    |
| Explains obvious                          | ❌ FAIL - Delete                        |
| Decorative section headers                | ❌ FAIL - Delete                        |
| Type information                          | ❌ FAIL - TypeScript already shows this |
| Commented-out code                        | ❌ FAIL - Delete (Git has history)      |
| Translations to other languages           | ❌ FAIL - Use English names             |

**Redundant comment examples:**

```typescript
// ❌ BAD - Explains what
// Increments the counter by 1
counter++;

// ❌ BAD - Obvious
// User entity
class User {}

// ❌ BAD - Decorative
// ==================== VALIDATION ====================

// ❌ BAD - Type info already in TypeScript
// Returns a string
function getName(): string {}

// ✅ GOOD - Obscure business rule
// Tax rate is 19% for Chile per SII regulation, not LATAM average of 16%
const TAX_RATE = 0.19;

// ✅ GOOD - ESLint bypass
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- 3rd party lib doesn't have types
```

**Verdict:** `PASS` / `FAIL - redundant comments at lines X, Y` / `FAIL - commented code at lines A, B`

---

### 6. 🏷️ Strict TypeScript & `any` Check

```bash
grep -n "any" <file>
```

**Rule:** If `any` is used, the line above MUST have:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- [Justification]
```

| Result                      | Verdict |
| :-------------------------- | :------ |
| No `any` found              | ✅ PASS |
| `any` with justification    | ✅ PASS |
| `any` without justification | ❌ FAIL |

**Verdict:** `PASS` / `FAIL - unjustified any at line X`

---

### 7. 🔀 Branchless & ts-pattern Check

```bash
grep -n "switch" <file>
grep -n "else" <file>
```

| Pattern               | Rule                                                 |
| :-------------------- | :--------------------------------------------------- |
| `switch` statements   | BANNED - use `ts-pattern` `match()`                  |
| Deep nested `if-else` | BANNED - use early returns, guard clauses, ternaries |

**Verdict:** `PASS` / `FAIL - switch at line X` / `FAIL - nested else at line Y`

---

### 8. 🧱 Functional-First & Purity Check

```bash
grep -n "class " <file>
```

**Rule:** ES6 classes are BANNED for:

- Domain Entities
- Value Objects
- Use Cases
- Services

**Exception:** Mongoose models/schemas in infrastructure layer

**For Domain files only:**

```bash
grep -n "import.*from 'react'" <file>
grep -n "import.*from 'mongoose'" <file>
```

**Rule:** Domain must be pure TypeScript, no framework imports

**Verdict:** `PASS` / `FAIL - prohibited class at line X` / `FAIL - framework import in domain`

---

### 9. 🇺🇸 English Translation Check

```bash
# Scan for Spanish words
grep -rn "cliente\|pedido\|crear\|obtener\|eliminar\|actualizar\|usuario\|producto" --include="*.ts"
```

**Rule:** All identifiers, variables, types, files, folders must be in English

**Verdict:** `PASS` / `FAIL - Spanish terms found: X, Y`

---

### 10. 🚫 YAGNI (You Aren't Gonna Need It) Check

```bash
# Find potentially unused exports
grep -rn "export " --include="*.ts" | grep -v "index.ts" | while read line; do
  name=$(echo "$line" | sed 's/.*export [a-z]* \([A-Za-z0-9_]*\).*/\1/')
  count=$(grep -rn "$name" --include="*.ts" | wc -l)
  if [ "$count" -le 1 ]; then
    echo "Unused export: $name"
  fi
done

# Find unused functions
grep -rn "^export const\|^export function" --include="*.ts" | cut -d: -f3 | while read line; do
  func=$(echo "$line" | sed 's/export const \([a-zA-Z_]*\).*/\1/;s/export function \([a-zA-Z_]*\).*/\1/')
  count=$(grep -rn "$func" --include="*.ts" | wc -l)
  if [ "$count" -le 1 ]; then
    echo "Unused function: $func"
  fi
done
```

| Pattern                           | Action                  |
| :-------------------------------- | :---------------------- |
| Exported but never imported       | REMOVE - violates YAGNI |
| Function defined but never called | REMOVE - violates YAGNI |
| "Just in case" code               | REMOVE - violates YAGNI |

**Verdict:** `PASS` / `FAIL - unused exports/functions: X, Y, Z`

---

### 11. ⚖️ Type-Validation Alignment Check (NestJS/class-validator)

```bash
# Check DTOs for type-validator mismatches
grep -rn "@ValidateNested\|@IsOptional\|@IsEnum\|@IsIn" --include="*.dto.ts"

# Compare with type declarations
grep -rn "config.*?:\s*|" --include="*.dto.ts"
```

| Issue                                  | Detection                                              |
| :------------------------------------- | :----------------------------------------------------- | -------------------------- |
| Union type with single validator       | `type?: A                                              | B`but only`@Type(() => A)` |
| Optional field without `@IsOptional()` | `field?: string` but `@IsString()` alone               |
| Missing discriminator for union        | Union type without `@ValidateIf` or discriminated DTOs |

**Common pattern to flag:**

```typescript
// ❌ WRONG - type is union, validator is single
config?: TemplateCanvasConfig; // Union of ProductConfig | LabelConfig
@ValidateNested()
@Type(() => CanvasLabelConfigDto) // Only validates LabelConfig!
config?: any;
```

**Correct pattern:**

```typescript
// ✅ CORRECT - discriminated validation
@ValidateIf((o) => o.code === 'PRODUCT')
@Type(() => ProductCanvasConfigDto)
@ValidateNested()
config?: any;

@ValidateIf((o) => o.code !== 'PRODUCT')
@Type(() => LabelCanvasConfigDto)
@ValidateNested()
config?: any;
```

**Verdict:** `PASS` / `FAIL - type-validation mismatch at line X`

---

### 12. 🔢 Function Parameter Count Check

```bash
# Find functions with many parameters
grep -rn "function.*(" --include="*.ts" | grep -E "\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*\)"
grep -rn "const.*=.*(" --include="*.ts" | grep -E "\([^)]*,[^)]*,[^)]*,[^)]*,[^)]*\)"
```

| Parameter Count | Verdict                                   |
| :-------------- | :---------------------------------------- |
| 1-3             | ✅ PASS                                   |
| 4               | ⚠️ WARNING - consider options object      |
| 5+              | ❌ FAIL - MUST refactor to options object |

**Example violation:**

```typescript
// ❌ 9 positional parameters
function constrainBounds(
  handle: string,
  initialX: number,
  initialY: number,
  initialW: number,
  initialH: number,
  dx: number,
  dy: number,
  aspectRatio: string,
  minSize: number,
) { ... }
```

**Verdict:** `PASS` / `WARN - 4 parameters` / `FAIL - X parameters at line Y`

---

## 📄 Output: The Audit Report

After running the computational checks, output your findings using this exact format:

```markdown
### 📋 Code Audit Report for `<filename>`

| Check                    | Result           | Details              |
| :----------------------- | :--------------- | :------------------- |
| 📏 Line Count            | [PASS/WARN/FAIL] | X lines              |
| 🔎 DRY                   | [PASS/FAIL]      | [Details or "Clean"] |
| 🧵 Magic Strings/Numbers | [PASS/FAIL]      | [Details or "Clean"] |
| 💀 Dead Code             | [PASS/FAIL]      | [Details or "Clean"] |
| 💬 Comments              | [PASS/FAIL]      | [Details or "Clean"] |
| 🏷️ Typings (`any`)       | [PASS/FAIL]      | [Details or "Clean"] |
| 🔀 Branchless/Switch     | [PASS/FAIL]      | [Details or "Clean"] |
| 🧱 Functional/Purity     | [PASS/FAIL]      | [Details or "Clean"] |
| 🇺🇸 Language              | [PASS/FAIL]      | [Details or "Clean"] |
| 🚫 YAGNI                 | [PASS/FAIL]      | [Details or "Clean"] |
| ⚖️ Type-Validation       | [PASS/FAIL/N/A]  | [Details or "Clean"] |
| 🔢 Parameter Count       | [PASS/WARN/FAIL] | [Details or "Clean"] |

**Final Verdict:** [APPROVED ✅ / REFACTOR REQUIRED ❌]

---

### 🔧 Required Fixes (if any)

1. [Line X]: [Issue description]
2. [Line Y]: [Issue description]
```

---

## 🎯 When to Update This Skill

If a PR review catches a code quality issue that this audit missed:

1. Run the `review-quality-guard` skill
2. Identify the gap
3. Add a new check to this Audit Protocol
4. Save to Engram with `topic_key: validator-gap/code-audit`

---

## 📎 References

- `skills/strict-coder-protocol/SKILL.md` — Pre/Post-flight checklists for coding
- `skills/review-quality-guard/SKILL.md` — PR feedback evaluation
- `docs/agents/agents-guidelines.md` — Documentation update rules
