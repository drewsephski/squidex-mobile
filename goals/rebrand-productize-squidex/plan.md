# Execution Plan — Rebrand & Productize Squidex

## Approach

Execute the rebrand in priority order: wire protocol strings (must stay in perfect sync), then env vars → file paths → source references → GitHub/npm → docs/site → CI. Each phase is a standalone batch of changes that can be verified independently. All changes follow the naming convention `clawdex|CLAWDEX|Clawdex` → `squidex|SQUIDEX|Squidex`.

---

## Phase 1: Wire Protocol & Runtime Strings (HIGH-RISK — must atomically sync)

These strings cross component boundaries. Botched renames break pairing, deep links, browser preview, and desktop frame integration. Every occurrence must be renamed in lockstep.

### 1a. Rust bridge — constant strings
**File:** `services/rust-bridge/src/main.rs`
- `clawdex-bridge-pair` → `squidex-bridge-pair` (lines 9848, 16996, 17069)
- `clawdex-bridge-token` → `squidex-bridge-token` (lines 9861, 17034)
- `clawdex_preview` → `squidex_preview` (line 88)
- `clawdex_preview_vp` → `squidex_preview_vp` (line 89)
- `__clawdex_proxy__` → `__squidex_proxy__` (line 90)
- `__clawdex_preview_runtime__.js` → `__squidex_preview_runtime__.js` (line 91)
- `clawdexDesktopFrameState` → `squidexDesktopFrameState` (lines 10506, 10836)
- `__clawdexDesktopFramePatched` → `__squidexDesktopFramePatched` (lines 10615, 10616, 10973, 10974)
- `__clawdexDesktopFrame` → `__squidexDesktopFrame` (lines 10646, 11003)
- `__clawdexPreviewRuntimeInstalled` → `__squidexPreviewRuntimeInstalled` (lines 11151, 11154)
- Test proxy URLs with `__clawdex_proxy__` → `__squidex_proxy__` (lines 15067, 15073, 15084, 15090, 15101, 15107, 15117, 15122)

### 1b. Mobile app — deep link + pairing
**File:** `apps/mobile/src/screens/OnboardingScreen.tsx`
- `clawdex-bridge-pair` → `squidex-bridge-pair` (line 1132)
- `clawdex-bridge-token` → `squidex-bridge-token` (line 1134)
- `clawdex:` → `squidex:` URL scheme (line 1147)

### 1c. Mobile app — browser preview
**File:** `apps/mobile/src/browserPreview.ts`
- `__clawdex_proxy__` → `__squidex_proxy__` (line 2)

**File:** `apps/mobile/src/screens/BrowserScreen.tsx`
- `clawdexDesktopFrameState` → `squidexDesktopFrameState` (line 81, 481, 510)
- `clawdexDesktopFrame` → `squidexDesktopFrame` (line 510)
- `clawdexOverviewMetrics` → `squidexOverviewMetrics` (line 680, 738)
- `__clawdexOverviewMetricsInstalled` → `__squidexOverviewMetricsInstalled` (lines 715, 719)

### 1d. macOS desktop app
**File:** `apps/macos/Sources/SquidexDesktop/BridgeController.swift`
- `clawdex-bridge-pair` → `squidex-bridge-pair` (line 40)

### 1e. Bridge secure launcher
**File:** `scripts/start-bridge-secure.js`
- `clawdex-bridge-pair` → `squidex-bridge-pair` (line 166)
- `clawdex-bridge-token` → `squidex-bridge-token` (line 179)

### 1f. Mobile browser preview tests
**File:** `apps/mobile/src/__tests__/browserPreview.test.ts`
- `__clawdex_proxy__` → `__squidex_proxy__` (line 152)

**Verification:** `cargo test` in `services/rust-bridge`, `npm run -w apps/mobile test`, `npm run -w apps/mobile typecheck`

---

## Phase 2: Environment Variables

Rename all `CLAWDEX_*` env vars to `SQUIDEX_*` in scripts. The sign-macos script is already using `SQUIDEX_CODESIGN_IDENTITY`.

| Old | New | Files |
|---|---|---|
| `CLAWDEX_WORKSPACE_ROOT` | `SQUIDEX_WORKSPACE_ROOT` | `scripts/start-bridge-secure.js:31,624`, `scripts/setup-wizard.sh:6`, `scripts/stop-services.sh:6`, `scripts/setup-secure-dev.sh:6` |
| `CLAWDEX_BRIDGE_BUILD_PROFILE` | `SQUIDEX_BRIDGE_BUILD_PROFILE` | `scripts/start-bridge-secure.js:132` |
| `CLAWDEX_BRIDGE_BINARY` | `SQUIDEX_BRIDGE_BINARY` | `scripts/start-bridge-secure.js:546,549` |
| `CLAWDEX_BRIDGE_FORCE_SOURCE_BUILD` | `SQUIDEX_BRIDGE_FORCE_SOURCE_BUILD` | `scripts/start-bridge-secure.js:584,633` |
| `CLAWDEX_SETUP_VERBOSE` | `SQUIDEX_SETUP_VERBOSE` | `scripts/setup-wizard.sh:57`, `scripts/start-expo.sh:16` |

Also update `bin/squidex.js` if it references any `CLAWDEX_*` env vars.

**Verification:** `grep -r 'CLAWDEX_' scripts/ bin/` should return nothing.

---

## Phase 3: Directory & File Path Refs

| Path string | New | Files |
|---|---|---|
| `.clawdex-mobile-attachments` | `.squidex-mobile-attachments` | `services/rust-bridge/src/main.rs:64`, `apps/mobile/src/api/__tests__/client.test.ts:2207,2224,2248,2258,2279`, `.gitignore:82`, `docs/troubleshooting.md:122` |
| `.clawdex-push-registry.json` | `.squidex-push-registry.json` | `services/rust-bridge/src/main.rs:676`, `docs/push-notifications.md:48` |
| `.clawdex/` (credentials dir) | `.squidex/` | `services/rust-bridge/src/main.rs:100` |
| `clawdex-preview-*` temp dirs | `squidex-preview-*` | `services/rust-bridge/src/main.rs` (multiple test/temp dir refs) |
| `clawdex-drain-*` → `squidex-drain-*` etc. | — | `services/rust-bridge/src/main.rs` temp dir names |

**Verification:** `grep -r '\.clawdex' services/rust-bridge/src/main.rs`

---

## Phase 4: Source Code Reference Cleanup

### 4a. macOS app file rename
- Rename `apps/macos/Sources/SquidexDesktop/ClawdexDesktopApp.swift` → `SquidexDesktopApp.swift`

### 4b. Test data & code comments
- `apps/mobile/src/api/__tests__/chatMapping.test.ts` — `clawdex-mobile` → `squidex-mobile`
- `apps/mobile/src/navigation/__tests__/drawerChats.test.ts` — `clawdex-mobile` → `squidex-mobile`
- `apps/mobile/src/components/__tests__/ChatMessage.test.tsx` — `clawdex-mobile` → `squidex-mobile`
- `apps/mobile/src/components/__tests__/WorkspacePickerModal.test.tsx` — `clawdex-mobile` → `squidex-mobile`
- `apps/mobile/src/components/__tests__/computerUseTrace.test.ts` — `clawdex-local` → `squidex-local`
- `services/cursor-app-server/src/__tests__/appServer.test.ts` — `/workspace/clawdex-mobile` → `/workspace/squidex-mobile`
- `services/cursor-app-server/src/__tests__/sdkDriver.test.ts` — `/workspace/clawdex-mobile` → `/workspace/squidex-mobile`
- `services/rust-bridge/src/main.rs` — test refs at lines 16445, 16448 (verify context)
- `docs/voice-transcription.md` — `~/.clawdex/chatgpt-auth.json` → `~/.squidex/chatgpt-auth.json`

### 4c. Deferred (do NOT touch)
- `clawdex.bridge-profiles.v1` AsyncStorage key
- `clawdex-app-settings.json` etc. — all internal AsyncStorage/local-file keys
- `docs/plans/*` — historical design docs

**Verification:** `grep -r 'clawdex' apps/mobile/src/ --include='*.{ts,tsx}' | grep -v node_modules | grep -v __clawdex` (should only have deferred storage key hits)

---

## Phase 5: GitHub Repo + npm Publish

1. **Create your fork** — Go to `github.com/Mohit-Patil/clawdex-mobile` → Fork → name it `squidex-mobile`
   - Verify `homepage` and `repository` in `package.json` already point to `squidex-mobile` (lines 14, 17) — update if needed
2. **Update origin remote:**
   ```bash
   git remote set-url origin https://github.com/drewsepeczi/squidex-mobile.git
   ```
3. **Push to new repo:**
   ```bash
   git push origin main --follow-tags
   ```
4. **Publish npm package:**
   ```bash
   npm publish
   ```
5. **Verify:** `npm view squidex-mobile` shows the published package

---

## Phase 6: Docs + Site Cleanup

### 6a. GitHub meta files
- `README.md` — update `clawdex init` → `squidex init`, `npm install -g clawdex-mobile@latest` → `npm install -g squidex-mobile@latest`, all URLs from `clawdex-mobile` → `squidex-mobile`
- `docs/setup-and-operations.md` — same pattern
- `docs/troubleshooting.md` — same + `.clawdex-mobile-attachments` → `.squidex-mobile-attachments`
- `docs/push-notifications.md` — `.clawdex-push-registry.json` → `.squidex-push-registry.json`
- `docs/release-notes/5.2.0.md` — clawdex → squidex
- `docs/release-notes/5.2.3-store-submission.md` — Clawdex → Squidex
- `docs/terms-of-service.md` — clawdex-mobile → squidex-mobile
- `docs/privacy-policy.md` — clawdex-mobile → squidex-mobile
- `.github/CODE_OF_CONDUCT.md` — clawdex-mobile → squidex-mobile
- `.github/ISSUE_TEMPLATE/config.yml` — clawdex-mobile → squidex-mobile
- `AGENTS.md` — `bin/clawdex.js` → `bin/squidex.js`, `clawdex init` → `squidex init` etc.

### 6b. Static site
- `site/index.html` — Clawdex Mobile → Squidex, update all references
- `site/support/index.html` — same
- `site/terms/index.html` — same
- Update `CNAME` or GitHub Pages settings to point to `getsquidex.com`

### 6c. Brand assets (visual inspection needed)
- `apps/mobile/assets/brand/*.png` — verify logos/icons don't say "clawdex"
- Screenshots/social poster — update if they contain old branding

**Verification:** Manual review of changed docs + `grep -ri 'clawdex' docs/ site/` to confirm nothing missed

---

## Phase 7: CI/CD Cleanup

### 7a. CI workspace names
**File:** `.github/workflows/ci.yml`
- `@clawdex/cursor-app-server` → `@squidex/cursor-app-server` (line 29)
- `clawdex-mobile` → `squidex-mobile` (line 30)

### 7b. Pages workflow
**File:** `.github/workflows/pages.yml` — verify it deploys from correct repo

### 7c. NPM release workflow
**File:** `.github/workflows/npm-release.yml` — already clean per earlier scan

**Verification:** `grep -r 'clawdex' .github/` should return nothing

---

## Verification Summary

| Fact ID | Verification |
|---|---|
| fact-wire-protocol | `cargo test` in `services/rust-bridge`, `npm run -w apps/mobile test && typecheck` |
| fact-env-vars | `grep -r 'CLAWDEX_' scripts/ bin/` returns empty |
| fact-attachments-dir | `grep '\.clawdex-mobile-attachments' services/rust-bridge/` returns empty |
| fact-push-registry | Manual check `docs/push-notifications.md` |
| fact-credentials-dir | `grep '\.clawdex/' services/rust-bridge/src/main.rs` returns empty |
| fact-temp-dirs | `grep 'clawdex-preview-' services/rust-bridge/src/main.rs` returns empty |
| fact-file-code-refs | `grep -r 'clawdex' apps/mobile/src/ --include='*.{ts,tsx}'` only hits deferred storage keys |
| fact-github-repo | `git remote -v` shows `drewsepeczi/squidex-mobile` |
| fact-npm-publish | `npm view squidex-mobile` succeeds |
| fact-docs-readme | `grep -ri 'clawdex' docs/` only hits historical plans and deferred items |
| fact-site-domain | `grep -ri 'clawdex' site/` returns empty |
| fact-ci-cd | `grep -r 'clawdex' .github/` returns empty |
| fact-macos-app | `ls apps/macos/Sources/SquidexDesktop/` shows `SquidexDesktopApp.swift` |

---

## Risks & Notes

- **Wire protocol backward compat:** Anyone with an existing paired app will need to regenerate QR codes after the `clawdex:` → `squidex:` URL scheme change. The bridge token from `.env.secure` survives.
- **Storage keys deferred:** Users won't lose settings/prefs during rebrand. Migration path can be added later.
- **Firebase project:** `clawdex-mobile-push` Firebase project is not in our control as a fork. Push notifications may not work until you create your own Firebase project and update `google-services.json`. This is a post-rebrand concern.
- **EAS project ID:** The EAS project (`07937be8-e2f7-4731-8ea4-cefae952df79`) is Mohit-Patil's. You'll need your own EAS project for mobile builds. This is a post-rebrand concern.
- **getsquidex.com:** If you own this domain, set up DNS. If not, switch to GitHub Pages URL. Verify ownership before Phase 6.
