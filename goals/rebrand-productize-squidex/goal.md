# Rebrand & Productize Squidex

Complete the rebrand of the clawdex fork to **Squidex** — clean up all stale "clawdex" references across wire protocols, env vars, file paths, source code, docs, site, and CI/CD — then publish the fork as a standalone product for devs.

**Shared understanding:** `goals/rebrand-productize-squidex/facts.md` (17 accepted facts)

**Execution plan:** `goals/rebrand-productize-squidex/plan.md` (7 phases, priority-ordered)

**Done when:**
1. Wire protocol strings are renamed to `squidex-*` in the Rust bridge, mobile app, and macOS desktop app in sync
2. All `CLAWDEX_*` environment variables are renamed to `SQUIDEX_*`
3. All `.clawdex-*` directory and file path refs are renamed to `.squidex-*`
4. Source code comments, test data, and file names are cleaned up
5. The GitHub repo is forked to `drewsepeczi/squidex-mobile` and the npm package is published
6. Docs, site, and CI workflows reference the new name and repo
7. `grep -ri clawdex` across the active codebase returns only deferred internal storage keys
