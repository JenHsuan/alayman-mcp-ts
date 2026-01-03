---
name: issue-requirement-proposal
description: Issue and requirement analysis workflow. Trigger when user mentions "there is an issue", "there's an issue", "this is a new requirement", "new requirement". Do NOT implement any code. Explore codebase first, analyze, then provide proposal with strengths, risks/impacts, and trade-offs. Wait for explicit user approval before any implementation.
---

# Issue & Requirement Proposal Workflow

**⛔ CRITICAL: Do NOT write any implementation code until user explicitly says "可以", "proceed", "go ahead", or similar approval.**

## Step 1: Clarify (If Needed)

For issues: expected vs actual behavior, reproduction steps, severity.
For requirements: business goal, acceptance criteria, constraints.

Skip if context is clear.

## Step 2: Explore Codebase

```bash
# Find related files
grep -r "keyword" --include="*.ts" -n

# Check structure
tree -L 2 src/

# Trace dependencies
grep -r "import.*module" --include="*.ts"
```

Document findings before proposing.

## Step 3: Analyze

- **For Issues**: Identify root cause and contributing factors
- **For Requirements**: Identify scope, dependencies, integration points

## Step 4: Present Proposal

Use this format:

```markdown
## 📋 Proposal: [Title]

### Summary
[Brief description]

### Investigation Findings
- **Related Files**: [list affected files]
- **Root Cause / Impact**: [analysis]
- **Existing Patterns**: [patterns to follow]

### Proposed Solution
1. [Step 1]
2. [Step 2]
3. [Step 3]

| File | Change | Description |
|------|--------|-------------|
| `file.ts` | Modify | [what] |

### Alternatives Considered
| Approach | Why Not Chosen |
|----------|----------------|
| [Alt A] | [reason] |

### ✅ Strengths
| Strength | Description |
|----------|-------------|
| [Strength 1] | [why this is beneficial] |
| [Strength 2] | [why this is beneficial] |

Consider: code consistency, minimal changes, testability, performance, maintainability, reusability, backwards compatibility

### ⚠️ Risks / Impacts
| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [Risk 1] | Low/Med/High | Low/Med/High | [mitigation] |
| [Risk 2] | Low/Med/High | Low/Med/High | [mitigation] |

Consider: breaking changes, performance degradation, security issues, edge cases, external dependencies, technical debt

### ⚖️ Trade-offs
| Decision | Gain | Cost |
|----------|------|------|
| [Decision 1] | [what we gain] | [what we sacrifice] |
| [Decision 2] | [what we gain] | [what we sacrifice] |

Consider: speed vs quality, flexibility vs simplicity, short-term vs long-term, performance vs maintainability

### Estimated Effort
- Complexity: Low / Medium / High
- Files to modify: X
- Testing scope: [scope]
```

## Step 5: Wait for Approval

End with:

> "以上是我的提案。請確認是否可以開始實作？"

**⛔ STOP HERE. Do NOT proceed until user explicitly approves.**

## Step 6: Implement (Only After Approval)

Only when user says "可以", "OK", "proceed", "approved", "go ahead":
1. Follow approved proposal
2. Flag new risks if discovered
