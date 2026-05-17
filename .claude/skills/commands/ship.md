---
description: End-to-end fix flow — worktree, investigate, test, pre-push gate, PR, drive to green, unbiased subagent review, auto-merge (or flag for human review if dangerous)
argument-hint: <issue-number | issue-url | free-text description>
---

You are running the `/ship` workflow. Execute the steps below in order. Do NOT skip steps or reorder them. After each step, emit a one-line status update to the user.

**Target for this run:** $ARGUMENTS

If `$ARGUMENTS` is empty, stop immediately and ask the user what to ship. Otherwise proceed.

---

## Step 1 — Isolate in a worktree

Create a git worktree so this work never touches the user's current checkout.

- Pick a short kebab-case slug from the target (issue title if numeric/URL, otherwise the first 3-4 meaningful words).
- Branch name: `ship/<slug>` (or `fix/<slug>` if the target is a bug, `feat/<slug>` if a feature).
- Resolve the main checkout path so the worktree lands inside the repo regardless of where `/ship` is invoked from: `MAIN_REPO=$(git worktree list --porcelain | awk '/^worktree / {print $2; exit}')`.
- Use `git worktree add "$MAIN_REPO/.claude/worktrees/<slug>" -b <branch> origin/main` — `.claude/worktrees/` is gitignored, so the new tree won't pollute the parent directory or show up as untracked files in the main checkout. Starting from `origin/main` (not local HEAD) guarantees the branch is based on the latest main.
- `cd` into the worktree for all subsequent steps.

If a worktree for this slug already exists, stop and ask the user whether to reuse it or pick a new slug.

## Step 2 — Investigate the issue

Understand before you code.

**Classify `$ARGUMENTS`:**
- Matches `#<num>` or a GitHub issue URL → run `gh issue view <ref> --comments` and use that as the source of truth.
- Anything else → treat as **free-text description** from the user. This is the common case.

**For free-text input, before doing anything else:**
1. Restate the problem back to the user in ≤2 sentences so they can correct you if you misread it.
2. If the description is genuinely ambiguous (multiple plausible interpretations, missing repro steps, unclear expected behavior), ask ONE focused clarifying question and wait. Do NOT pepper the user with a questionnaire.
3. If it's clear enough, proceed without asking — don't stall.

**Then investigate:**
- Read the relevant source files. Reproduce the bug mentally (or with a small script) before writing any fix.
- Emit a one-paragraph summary of the root cause before moving on. If you can't find the root cause after a real search, stop and ask the user for pointers — do NOT guess.

## Step 3 — Load domain skills

Before writing any code, load the right skills based on what the fix touches. Classify changed files from the investigation and invoke via the Skill tool:

| Files touched | Skill to load | Purpose |
|---------------|---------------|---------|
| `src/components/`, `src/app/`, any `.tsx`/`.css`/`.scss`, UI layouts | `frontend-design` | Production-grade UI, avoids generic AI aesthetics |
| AI agent code, LLM calls, tool definitions, agent loops, orchestration | `ai-sdk` | Correct AI SDK usage, streaming, tool calling patterns |
| Agent action spaces, observation formatting, tool schemas | `agent-harness-construction` | Higher agent completion rates, better tool design |

**Load multiple if the change spans domains** — e.g. a new AI chat component loads both `frontend-design` and `ai-sdk`.

**If no existing skill covers the domain** (unfamiliar library, novel pattern), invoke `find-skills` to search for an installable skill before proceeding. Don't code blind when a skill might exist.

**Always load `coding-standards`** regardless of domain — it applies to every change.

## Step 4 — Write the fix + tests

- Write a failing test first that captures the bug. Confirm it fails against current `main`.
- Implement the minimal fix guided by the loaded domain skills. Re-run the test — it should now pass.
- Run the full test suite (`npx vitest run`) and make sure nothing else breaks.
- Keep the diff tight — no unrelated cleanup, no speculative abstractions.

## Step 5 — Pre-push gate

Run the same checks CI runs **locally**, before pushing. Catches lint, type, and test failures at shell speed instead of paying a CI cycle.

Scope by the diff to skip irrelevant jobs:

```bash
CHANGED=$(git diff --name-only origin/main...HEAD)

# TypeScript type-check (always run if src/ or server/ touched)
if echo "$CHANGED" | grep -qE '^(src/|server/|tsconfig)'; then
  npx tsc --noEmit
fi

# Lint (ESLint or Next.js lint)
if echo "$CHANGED" | grep -qE '^(src/|server/|components/)'; then
  npx next lint --quiet 2>/dev/null || npx eslint . --quiet
fi

# Tests (Vitest)
if echo "$CHANGED" | grep -qE '^(src/|server/|tests?/|__tests__/)'; then
  npx vitest run --reporter=verbose
fi
```

Every check that ran must pass. If any fail, fix the root cause and re-run — don't push red.

## Step 6 — Commit + push + open PR

- Stage only the files you intentionally changed. Never `git add -A`.
- Commit message: conventional commits format, type matches the branch prefix (`fix:` / `feat:` / `chore:`).
- `git push -u origin <branch>`.
- Open a PR with `gh pr create`. Title ≤ 70 chars. Body has a **Summary** section, a **Root cause** section (1-3 sentences), and a **Test plan** checklist. Link the issue with `Fixes #<num>` if applicable.
- Capture the PR number from the output — you need it for step 7.

## Step 7 — Drive the PR to green

This step does not return until **every required CI check is green AND the PR has no merge conflicts with the base branch**. If something is red or dirty, fix it and try again — don't bail to the user on the first failure.

### 7a — Wait for CI

- Run `gh pr checks <pr-number> --watch --fail-fast` in the foreground. Blocks until checks resolve.
- If green → continue to 7b.
- If red:
  1. `gh run view <run-id> --log-failed` — pull the failing logs.
  2. Diagnose the actual root cause (real test failure, lint, type error, dependency mismatch, flake).
  3. For an obvious flake (network blip, ephemeral infra timeout, no code-related signal), one targeted `gh run rerun <run-id> --failed` is fine — but only once per job, and only when there's nothing to fix.
  4. Otherwise, fix it locally, run the relevant tests, commit (a follow-up commit, not `--amend`), `git push`. Loop back to the top of 7a.
- Cap auto-fix attempts at **3 cycles**. After that, stop and report what you tried — don't spiral.

### 7b — Verify mergeability

GitHub treats CI-green and merge-clean as separate signals. A PR can pass every check and still be unmergeable because `main` moved underneath it.

- Query `gh pr view <pr-number> --json mergeable,mergeStateStatus`.
- If `mergeable=MERGEABLE` and `mergeStateStatus` ∈ {`CLEAN`, `UNSTABLE`, `HAS_HOOKS`} (UNSTABLE just means non-required checks are still pending) → continue to step 8.
- If `mergeStateStatus=DIRTY` (real conflicts with base):
  1. `git fetch origin main && git rebase origin/main`.
  2. Resolve **trivial** conflicts only — version-file bumps, `package-lock.json` churn, whitespace, non-overlapping additions to the same list. For lockfile conflicts, delete `package-lock.json`, run `npm install` to regenerate, and verify. Re-run relevant tests after resolving.
  3. For **non-trivial** conflicts (overlapping logic edits, opposing public-API changes, conflicting `package.json` dependency versions), STOP and ask the user. Don't guess at human intent.
  4. `git push --force-with-lease` (never `--force`, never on a protected branch). Loop back to 7a — the rebase invalidated the previous CI run.
- If `mergeStateStatus=BLOCKED` (waiting on review approval / branch protection): note it in the final summary and continue to step 8. That's a human gate, not something /ship can resolve.
- If `mergeStateStatus=BEHIND` (out of date but no conflicts): rebase as in DIRTY, push with `--force-with-lease`, loop back to 7a.

### When to stop and ask

- After 3 failed CI fix-and-retry cycles.
- When a rebase surfaces conflicts that aren't safe to auto-resolve.
- When the same test keeps failing on CI but passes locally (likely environmental — needs a human eye).

Print what you tried, what's still red or dirty, and let the user pick next moves.

## Step 8 — Unbiased subagent code review

CI is green AND the PR is merge-clean. Before merging, get a second opinion from a fresh agent that hasn't seen any of the reasoning that led to the diff — that's the only way to catch issues you've already rationalized away.

- Spawn ONE `general-purpose` subagent (via the Agent tool) with a self-contained prompt. It must NOT inherit context from this `/ship` run.
- The subagent's job is a rigorous, adversarial code review of the PR — looking for correctness bugs, security holes, regression risk, missing test coverage, hidden behavior changes, performance cliffs, and API/contract breakage.
- Give it ONLY: the PR number, the repo, and the instruction to fetch the diff itself (`gh pr diff <pr-number>`, `gh pr view <pr-number> --json title,body,files,additions,deletions`, plus targeted `Read`s of changed files for surrounding context). Do NOT pre-summarize the change for it — that biases the review.
- Require structured output: a list of findings, each tagged `BLOCKING` (must fix before merge), `NIT` (minor, optional), or `QUESTION` (clarification needed), plus a one-line overall verdict (`approve` / `request-changes` / `human-review-required`).
- Tell the subagent to post its review to the PR as a single PR review comment via `gh pr review <pr-number> --comment --body-file <path>` so the findings are durably attached to the PR (not just in this transcript).
- Wait for the subagent to finish, then read the review comment back from the PR (`gh pr view <pr-number> --comments`) so step 9 operates from the PR's source of truth, not the subagent's in-process reply.

If the subagent returns `human-review-required`, skip step 9 and jump to step 10's "Human Review Required" branch.

## Step 9 — Address review comments

Walk through every `BLOCKING` finding from the review and resolve it. `NIT` is optional — apply if cheap, skip otherwise. `QUESTION` items: either answer in a reply on the PR or address by clarifying code/comments.

For each `BLOCKING` finding:
1. Read the cited code and decide: real issue, or false positive?
2. If real → fix it locally, add or extend a test if the gap is testable, run the relevant test suite.
3. If false positive → reply to the comment on the PR explaining why (`gh pr comment <pr-number> --body ...`), don't just silently ignore it.

Commit fixes as follow-up commits (never `--amend` the original). Push, loop back through step 7 (CI must go green again, PR must stay merge-clean). Do NOT re-run the subagent reviewer for every iteration — one round is the default. Only re-review if the fixes substantially rewrote the diff (>30% of changed lines touched again) or the user explicitly asks for another pass.

Cap fix-and-recheck cycles at **3**. If `BLOCKING` findings still remain after 3 cycles, stop and escalate to the user with the unresolved items.

## Step 10 — Merge or flag for human review

Make the call.

**Auto-merge — the default path.** If all of these hold:
- CI is green and PR is merge-clean (per step 7b).
- The subagent review's overall verdict is `approve` (or `request-changes` that has since been fully addressed).
- No `BLOCKING` findings remain unresolved.
- The diff is not in the "dangerous" category below.

Then merge directly without waiting for a human:

```bash
gh pr merge <pr-number> --squash --delete-branch
```

(Use `--merge` instead of `--squash` if the repo's convention is merge commits — check recent merged PRs.)

After a successful merge, fire the desktop notification and print the final line:

```bash
osascript -e 'display notification "PR #<num> merged" with title "/ship done" sound name "Glass"'
```

```
🟢 /ship done — PR #<num> merged: <pr-url>
```

**Human Review Required — the escape hatch.** Stop and hand off to the user *only* when the change is genuinely dangerous. Use this sparingly — the whole point of the auto-merge path is to avoid bottlenecking on human approval for routine work. Trigger this branch if any of the following are true:

- Touches authentication, authorization, secrets, crypto, or anything that could leak credentials.
- Modifies a data migration, schema change, or anything that mutates existing user data irreversibly.
- Changes a public API (HTTP route signature, CLI flag semantics, exported library function) in a backwards-incompatible way.
- Touches billing, payments, or anything that moves money.
- Disables, weakens, or bypasses a security check, lint rule, or test.
- Adds or modifies code that runs with elevated privileges (sudo, root, system services, gateway daemon entrypoints).
- Subagent review came back `human-review-required` or had unresolved `BLOCKING` items after the 3-cycle cap.
- You (the main agent) feel genuinely uncertain about correctness despite green CI — trust that instinct.

When flagging for human review, do NOT merge. Instead:

```bash
osascript -e 'display notification "PR #<num> needs human review" with title "/ship — Human Review Required" sound name "Sosumi"'
```

Then print a final summary that the user will actually read:

```
🟡 /ship — Human Review Required — PR #<num>: <pr-url>

Why: <one-sentence reason this PR is in the dangerous category>

Pay attention to:
- <specific file:line or behavior #1>
- <specific file:line or behavior #2>
- <specific file:line or behavior #3>
```

Be concrete in the "Pay attention to" list — point at file:line locations or named behaviors, not vague categories. The user is going to skim this; make every bullet earn its place.

---

## Ground rules that apply to every step

- **Always invoke `coding-standards` skill before writing or reviewing any code.** Every change — fix, feature, refactor — must follow project coding conventions for naming, readability, immutability, and quality.
- **Never force-push to main, never `git reset --hard` on shared branches, never `--no-verify`.** If a hook fails, fix the root cause.
- **Ask before destructive actions.** If step 2 reveals the "fix" actually requires deleting files, dropping tables, or changing public APIs, stop and confirm with the user before continuing.
- **One tight commit per `/ship` run** unless the work genuinely needs multiple logical commits. Don't pad history.
- **If any step fails unexpectedly and you've retried twice**, stop and report what you tried. Don't spiral.
