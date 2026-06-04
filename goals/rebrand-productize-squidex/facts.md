# Facts — Rebrand & Productize Squidex

- Wire protocol strings (clawdex-bridge-pair, clawdex-bridge-token, __clawdex_proxy__, __clawdex_preview_runtime__.js, clawdexDesktopFrameState, clawdexDesktopFrame, clawdexOverviewMetrics, __clawdexOverviewMetricsInstalled, __clawdexPreviewRuntimeInstalled, clawdex: URL scheme) are renamed to squidex-* equivalents in both the mobile app and Rust bridge in sync.
- Environment variables (CLAWDEX_WORKSPACE_ROOT, CLAWDEX_BRIDGE_BINARY, CLAWDEX_BRIDGE_FORCE_SOURCE_BUILD, CLAWDEX_SETUP_VERBOSE, CLAWDEX_CODESIGN_IDENTITY) are renamed to SQUIDEX_* equivalents in all scripts.
- Attachments directory (.clawdex-mobile-attachments) is renamed to .squidex-mobile-attachments in both the Rust bridge and mobile app code.
- Push notification registry file (.clawdex-push-registry.json) is renamed to .squidex-push-registry.json.
- Credentials directory (.clawdex/) is renamed to .squidex/ in the Rust bridge.
- Temporary directories (clawdex-preview-*, clawdex-drain-*, clawdex-push-test-*, clawdex-bridge-chatgpt-auth-test-*, clawdex-rollout-thread-media-*) are renamed to squidex-* equivalents in the Rust bridge.
- All source file references to clawdex (in code comments, variable names, test data, file paths) are replaced with squidex, excluding deferred internal storage keys and historical doc/plans.
- Internal AsyncStorage keys (clawdex.bridge-profiles.v1, clawdex-app-settings.json, clawdex-push-settings.json, clawdex-prompt-library.json, clawdex-store-review.json, clawdex-workspace-favorites.json, clawdex-pinned-chats.json) are NOT renamed to preserve existing user state.
- The GitHub repo is forked from Mohit-Patil/clawdex-mobile to drewsepeczi/squidex-mobile, with origin remote updated.
- The squidex-mobile npm package is published under the user's npm account with public access, publishConfig.access set to public.
- README, setup docs, troubleshooting docs, and release notes are updated to reference squidex CLI commands (squidex init, squidex stop), npm package (squidex-mobile), and repo URLs (drewsepeczi/squidex-mobile).
- The static site (site/*.html) is updated with Squidex branding, references to getclawdex.com are replaced with getsquidex.com, and GitHub Pages URL is updated to drewsepeczi/squidex-mobile.
- GitHub Actions workflows (ci.yml) are updated to reference squidex-mobile package names and workspace names instead of clawdex-mobile.
- Brand assets (social poster, screenshots, app icons) are updated to reflect Squidex branding where visible text appears.
- GitHub meta files (CODE_OF_CONDUCT.md, ISSUE_TEMPLATE/config.yml, SECURITY.md, CONTRIBUTING.md) are updated with squidex repo URLs.
- The macOS desktop app source file (ClawdexDesktopApp.swift) is renamed to SquidexDesktopApp.swift.
- GitHub Pages publishing workflow (pages.yml) is updated to deploy from the squidex-mobile repo.
