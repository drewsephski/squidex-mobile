# Codex Desktop-Style Mobile Redesign

**Date:** 2026-02-20
**Status:** Approved

---

## Goal

Redesign the squidex-mobile app to match the visual design and UX of the Codex desktop app:
- Hidden left drawer for thread/nav navigation
- Dark theme matching Codex desktop exactly
- "Let's build" compose view when no thread is selected
- Full chat view with message bubbles when a thread is selected

---

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `bgMain` | `#0D1117` | Main chat area background |
| `bgSidebar` | `#161B22` | Drawer background |
| `bgItem` | `#21262D` | Thread item selected/hover |
| `border` | `#30363D` | Dividers, borders |
| `textPrimary` | `#E6EDF3` | Main text |
| `textMuted` | `#8B949E` | Timestamps, secondary labels |
| `accent` | `#E5622A` | New Thread button, icons |
| `userBubble` | `#1C2128` | User message background |

---

## Navigation Architecture

Replace the current bottom tab navigator with a **React Navigation Drawer** (`@react-navigation/drawer`).

```
DrawerNavigator
├── DrawerContent (custom component)
│   ├── "New thread" button (accent orange)
│   ├── Terminal nav item
│   ├── Git nav item
│   ├── "Threads" section header
│   ├── FlatList of threads (newest first)
│   └── Settings (pinned to bottom)
└── Screens
    ├── MainScreen (compose + chat, single screen with state)
    ├── TerminalScreen (existing, dark-themed)
    ├── GitScreen (existing, dark-themed)
    └── SettingsScreen (existing, dark-themed)
```

Drawer opens via:
- Swipe right from left edge (default React Navigation gesture)
- Hamburger `≡` icon in the top-left of every screen

---

## Drawer Content Layout

```
┌──────────────────────────┐
│  ≡  Codex               │  safe area padding top
│                         │
│  [ + New thread ]       │  accent orange button
│                         │
│  ⚡ Terminal             │  nav item
│  ⑂ Git                  │  nav item
│                         │
│  ─── Threads ────────── │  section header
│                         │
│  thread title...   1d   │  FlatList items
│  thread title...   2d   │
│  ...                    │
│                         │
│  ⚙ Settings             │  pinned bottom
└──────────────────────────┘
```

- Width: 280px
- Background: `bgSidebar` (#161B22)
- Thread items: truncated title (1 line) + relative timestamp right-aligned
- Selected thread: `bgItem` (#21262D) background + `accent` left border (3px)

---

## Main Screen — Compose State (no thread selected)

Shown when app opens or "New thread" is tapped.

```
┌──────────────────────────┐
│ ≡                        │  hamburger top-left
│                          │
│                          │
│          🤖              │  agent icon (40px)
│       Let's build        │  24px bold white
│       squidex-mobile ▾   │  16px muted, tappable
│                          │
│  [ suggestion card ]     │  2 cards in a row
│  [ suggestion card ]     │
│                          │
│ ┌──────────────────────┐ │
│ │ + Ask Codex anything │ │  input bar
│ │                   ⏎  │ │
│ └──────────────────────┘ │
│  GPT model  Quality  🌿  │  status bar (muted text)
└──────────────────────────┘
```

---

## Main Screen — Chat State (thread selected)

Shown when a thread is tapped in the drawer.

```
┌──────────────────────────┐
│ ≡  thread title     ···  │  header: drawer toggle + title + more
│──────────────────────────│
│                          │
│  YOU                     │  role label (muted, uppercase)
│  ┌────────────────────┐  │
│  │ user message text  │  │  bgItem bubble
│  └────────────────────┘  │
│                          │
│  CODEX                   │  role label
│  assistant response      │  plain text, no bubble
│                          │  streaming supported
├──────────────────────────┤
│ ┌──────────────────────┐ │
│ │ Reply...          ⏎  │ │  input bar
│ └──────────────────────┘ │
└──────────────────────────┘
```

- Messages scroll in a FlatList (inverted) or ScrollView
- User messages: `bgItem` rounded bubble, `textPrimary`
- Assistant messages: no background, `textPrimary`, slightly indented
- Role labels: `textMuted`, 11px uppercase, above each message
- Streaming: assistant message updates in real-time via WebSocket

---

## Theme Refactor

Replace `src/theme.ts` and `src/ui/theme.ts` with a single dark theme:

```ts
// src/theme.ts
export const colors = {
  bgMain: '#0D1117',
  bgSidebar: '#161B22',
  bgItem: '#21262D',
  border: '#30363D',
  textPrimary: '#E6EDF3',
  textMuted: '#8B949E',
  accent: '#E5622A',
  userBubble: '#1C2128',
  // status
  statusRunning: '#3B82F6',
  statusComplete: '#22C55E',
  statusError: '#EF4444',
  statusIdle: '#6B7280',
}
```

---

## Files to Create / Modify

| File | Action |
|---|---|
| `src/theme.ts` | Replace with dark Codex theme |
| `src/navigation/DrawerContent.tsx` | New: custom drawer component |
| `src/screens/MainScreen.tsx` | New: compose + chat combined screen |
| `src/screens/TerminalScreen.tsx` | Update styles to dark theme |
| `src/screens/GitScreen.tsx` | Update styles to dark theme |
| `src/screens/SettingsScreen.tsx` | Update styles to dark theme |
| `src/components/Glass.tsx` | Remove (replaced by dark theme components) |
| `App.tsx` | Switch from tab navigator to drawer navigator |
| `package.json` | Add `@react-navigation/drawer`, `react-native-reanimated` |

---

## Dependencies to Add

- `@react-navigation/drawer` — drawer navigator
- `react-native-reanimated` — required by drawer
- `react-native-gesture-handler` — already installed
