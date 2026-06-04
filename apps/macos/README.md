# Squidex Desktop

Native macOS menu-bar app for running the Squidex bridge without asking Mac users to operate the npm CLI directly.

Development:

```sh
swift run --package-path apps/macos SquidexDesktop
```

The app looks for the bridge binary in this order:

1. `SQUIDEX_BRIDGE_BIN`
2. `Squidex.app/Contents/Resources/codex-rust-bridge`
3. `vendor/bridge-binaries/<target>/codex-rust-bridge`
4. `services/rust-bridge/target/release/codex-rust-bridge`
5. `services/rust-bridge/target/debug/codex-rust-bridge`

Packaged app build:

```sh
npm run desktop:mac:bundle
```

That creates `dist/macos/Squidex.app` and bundles the release Rust bridge binary into the app resources.
