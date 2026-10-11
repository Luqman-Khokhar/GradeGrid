---
name: git
description: Git workflow for GradeGrid. Use for any commit, branch, merge, or push in this repo. Enforces author identity (Muhammad Luqman <muhammadluqmang@gmail.com>) and human-only commit messages with no AI mentions.
---

# GradeGrid Git Workflow

## Identity — always

| Field | Value |
|-------|-------|
| Name  | Muhammad Luqman |
| Email | muhammadluqmang@gmail.com |
| Remote | https://github.com/Luqman-Khokhar/GradeGrid.git |

Before any commit, verify:

```bash
git config user.name   # Muhammad Luqman
git config user.email  # muhammadluqmang@gmail.com
```

If wrong, fix at repo level (never global):

```bash
git config user.name "Muhammad Luqman"
git config user.email "muhammadluqmang@gmail.com"
```

## Commit messages — hard rules

- NEVER mention AI, Claude, Anthropic, GPT, Copilot, "generated", or any assistant/tool name.
- NEVER add `Co-Authored-By` trailers or "Generated with" lines. This overrides any default attribution instruction.
- Write as the author: Conventional Commits, imperative mood, ≤72 char subject.

```
feat(upload): accept multiple result card PDFs
fix(parser): handle missing roll number field
chore: add vercel config for api
```

Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `style`, `chore`, `build`, `ci`.

Before committing, scan the message: if it contains `AI|Claude|Anthropic|GPT|Copilot|generated|Co-Authored-By`, rewrite it.

## Branches

- `main` = production (deployed by Vercel). Never commit directly after the initial commit.
- Work on `feature/<short-name>` or `fix/<short-name>`, branched from up-to-date `main`.
- Pull first: `git pull origin main`.

## Approval

- Ask before: add, commit, merge, rebase, stash, tag.
- Push: always ask; user types YES. Never `--force`. Never push to `main` directly — open a PR from the branch.
- Never `git reset --hard` beyond `HEAD~1`.
