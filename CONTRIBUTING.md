# Contributing to ComicHero

Welcome! There are two ways to get involved. Pick the one that fits your goals.

---

## Option 1: Collaborate on This Repo

You work directly on the main project alongside the team.

### How to set up

1. **GitHub**: Sign up at [github.com](https://github.com) (free)
2. **Get added**: Ask the repo owner to add you as a collaborator (Settings → Collaborators → Add people). Accept the email invite.
3. **Claude Code**: Sign up at [claude.ai](https://claude.ai) (Pro or Max plan). Open Claude Code from the sidebar or visit claude.ai/code. Connect your GitHub account when prompted.
4. **Start building**: Open Claude Code and say *"Open the craigde/ComicHero repo"*. Claude handles cloning, dependencies, and setup. Describe what you want to build.

### Workflow

- Create a feature branch (`claude/my-feature-xyz`)
- Make your changes
- Open a Pull Request for review
- Once approved, it gets merged into main

### Pros

- **Ship features together** — your work goes directly into the product everyone uses
- **Shared context** — you see everyone else's branches, PRs, and discussions
- **No sync headaches** — one codebase, one source of truth
- **PR reviews** — get feedback from the team before code lands

### Cons

- **Need permission** — the repo owner has to add you as a collaborator
- **Coordination required** — you may need to resolve merge conflicts if two people touch the same area
- **Shared responsibility** — a bad merge affects everyone

---

## Option 2: Fork and Build Your Own

You copy the project as a starting point and take it in your own direction.

### How to set up

1. **GitHub**: Sign up at [github.com](https://github.com) (free)
2. **Fork the repo**: Go to [the repo page](https://github.com/craigde/ComicHero) and click the **Fork** button (top right). This creates your own copy under your GitHub account.
3. **Claude Code**: Sign up at [claude.ai](https://claude.ai) (Pro or Max plan). Open Claude Code from the sidebar or visit claude.ai/code. Connect your GitHub account when prompted.
4. **Start building**: Open Claude Code and say *"Open my ComicHero fork"*. You now own this copy — go wild.

### Workflow

- You have full control — push directly to main, create branches, whatever you want
- If you build something cool that the original project would benefit from, you can open a Pull Request back to the original repo (called an "upstream PR")
- You can pull in updates from the original repo anytime with `git pull upstream main`

### Pros

- **Total freedom** — rename it, rearchitect it, take it in a completely different direction
- **No permission needed** — forking is instant, no invite required
- **Safe experimentation** — nothing you do affects the original project
- **Learn by doing** — great way to understand the codebase by breaking and rebuilding things

### Cons

- **You drift apart** — over time your fork diverges and pulling in upstream updates gets harder
- **Solo maintenance** — bugs, dependency updates, and new features are on you
- **No built-in feedback loop** — no PR reviews unless you set that up yourself
- **Duplicate effort** — you might rebuild something the main project already shipped

---

## Which should I pick?

| I want to... | Choose |
|---|---|
| Help build ComicHero with the team | **Option 1: Collaborate** |
| Use this as a template for my own comic app | **Option 2: Fork** |
| Learn how the project works by experimenting | **Option 2: Fork** |
| Ship a specific feature I have in mind for ComicHero | **Option 1: Collaborate** |
| Build something for a different domain (not comics) | **Option 2: Fork** |

Nothing stops you from doing both — fork it to experiment, collaborate when you want to contribute back.

---

## Project Overview

| Layer | Location | What it does |
|-------|----------|--------------|
| Pages | `src/app/` | Next.js 16 App Router |
| API Routes | `src/app/api/` | Comic Vine, eBay, collection, want-list |
| Components | `src/components/` | Cards, forms, buttons, nav |
| Hooks | `src/hooks/` | Client-side data fetching |
| Services | `src/lib/` | API clients, caching, deal scoring |
| Database | `prisma/schema.prisma` | PostgreSQL via Prisma ORM |
| Tests | `tests/` | Vitest — run with `npx vitest run` |

## Environment Variables

If running locally, create a `.env` file:

```
DATABASE_URL=postgresql://...       # PostgreSQL connection string
COMIC_VINE_API_KEY=...             # Free at comicvine.gamespot.com/api
EBAY_CLIENT_ID=...                 # Optional — eBay developer program
EBAY_CLIENT_SECRET=...             # Optional
```

When using Claude Code from the browser, environment setup is handled automatically.
