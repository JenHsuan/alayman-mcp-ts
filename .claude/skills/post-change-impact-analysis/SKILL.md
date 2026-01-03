---
name: post-change-impact-analysis
description: Post-implementation impact analysis and testing workflow. Trigger automatically after any code modification is completed. Analyze the impact scope, list affected functionalities, present report to user. Wait for user approval before running actual tests to verify affected functionalities work correctly.
---

# Post-Change Impact Analysis & Testing Workflow

**⛔ CRITICAL: After code changes, ALWAYS perform impact analysis. Do NOT run tests until user explicitly approves.**

## Step 1: Identify Changes Made

After completing code modifications, document:

```bash
# Check what files were modified
git diff --name-only HEAD~1

# View detailed changes
git diff HEAD~1

# If not using git, list recently modified files
find . -name "*.ts" -mmin -10
```

Summarize:
- Files modified
- Functions/methods changed
- New code added
- Code removed

## Step 2: Analyze Impact Scope

Trace dependencies to find affected areas:

```bash
# Find files that import modified modules
grep -r "import.*modifiedModule" --include="*.ts" -l

# Find usages of modified functions
grep -r "modifiedFunction" --include="*.ts" -n

# Check test files related to changes
find . -name "*.test.ts" | xargs grep -l "modifiedModule"
```

Map the impact chain:
1. **Direct Impact**: Files/functions directly modified
2. **Indirect Impact**: Files that depend on modified code
3. **Downstream Impact**: Features that use affected components

## Step 3: Present Impact Report

Use this format:

```markdown
## 📊 Impact Analysis Report

### 🔧 Changes Made
| File | Change Type | Summary |
|------|-------------|---------|
| `path/file1.ts` | Modified | [what changed] |
| `path/file2.ts` | Added | [what added] |

### 🎯 Affected Functionalities

#### Direct Impact
| Functionality | File | Risk Level |
|---------------|------|------------|
| [Feature A] | `file.ts` | High/Med/Low |
| [Feature B] | `file.ts` | High/Med/Low |

#### Indirect Impact
| Functionality | Dependency Chain | Risk Level |
|---------------|------------------|------------|
| [Feature C] | file1 → file2 → file3 | High/Med/Low |

### 🧪 Recommended Tests

| # | Test | Type | Command/Action | Priority |
|---|------|------|----------------|----------|
| 1 | [Test description] | Unit | `npm test file.test.ts` | High |
| 2 | [Test description] | Integration | `npm run test:integration` | High |
| 3 | [Test description] | Manual | [steps to verify] | Medium |

### ⚠️ Potential Issues to Watch
- [Issue 1]: [description]
- [Issue 2]: [description]
```

## Step 4: Wait for Approval

End with:

> "以上是此次修改的影響範圍分析。請問是否可以開始執行測試？"

**⛔ STOP HERE. Do NOT run any tests until user explicitly approves.**

## Step 5: Execute Tests (Only After Approval)

Only when user says "可以", "OK", "proceed", "test it", "go ahead":

### 5.1 Run Automated Tests

```bash
# Run unit tests for affected files
npm test -- --testPathPattern="affectedFile"

# Run related integration tests
npm run test:integration -- --grep "affectedFeature"

# Run full test suite if impact is wide
npm test
```

### 5.2 Manual Verification (If Needed)

For features requiring manual testing:
1. Execute the manual test steps
2. Verify expected behavior
3. Document actual results

### 5.3 Present Test Results

```markdown
## 🧪 Test Results

### Automated Tests
| Test Suite | Passed | Failed | Skipped |
|------------|--------|--------|---------|
| Unit Tests | X | Y | Z |
| Integration | X | Y | Z |

### Manual Verification
| Functionality | Status | Notes |
|---------------|--------|-------|
| [Feature A] | ✅ Pass | [observations] |
| [Feature B] | ❌ Fail | [issue found] |
| [Feature C] | ⚠️ Partial | [details] |

### Summary
- **Overall Status**: ✅ All Pass / ⚠️ Issues Found / ❌ Failures
- **Issues Found**: [list any issues]
- **Recommended Actions**: [next steps if any]
```

## Step 6: Handle Failures

If tests fail:
1. Report failures immediately
2. Analyze failure cause
3. Propose fix (following issue-requirement-proposal workflow if enabled)
4. Wait for approval before implementing fix
