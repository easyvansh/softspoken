# SoftSpoken UX & Design Guidelines

## Current Design System

SoftSpoken now uses a warm, minimal, native-feeling visual system inspired by
Apple, Linear, Arc Browser, Notion, Raycast and Readwise Reader.

- Canvas: warm off-white.
- Surfaces: white and soft tan.
- Text: charcoal with muted neutral metadata.
- Accent: restrained warm brown for primary action emphasis.
- State colors: reserved for playback, warnings and errors.
- Radius: 12px for controls and state panels.
- Spacing: 4, 8, 12, 16, 24 and 32px rhythm.
- Typography: clean system stack with `Inter` and `Aptos` first.

The UI should feel like a compact listening surface, not a dashboard. Whitespace
creates hierarchy; borders are used sparingly; nested cards are avoided.

## Design Philosophy

SoftSpoken should feel like a native browser experience rather than a traditional browser extension.

The interface should communicate **calmness, clarity and quality**. Every element should have a purpose. The UI should never compete with the content being listened to.

Design inspiration:

- Apple
- Linear
- Arc Browser
- Notion
- Raycast
- Readwise Reader

Avoid:

- Bright gradients
- Glassmorphism
- Excessive shadows
- Flashy animations
- Dashboard-style layouts
- Visual clutter

The overall feeling should be **premium, modern, lightweight and distraction-free.**

---

# Interface Principles

## Minimal First

Every screen should answer only one question:

"What does the user need right now?"

Avoid unnecessary buttons or information.

---

## Strong Visual Hierarchy

Priority order:

1. Current article
2. Playback controls
3. Progress
4. Playback settings
5. Secondary information

Nothing else should compete with playback.

---

## Modular Components

Every UI element should exist as an independent reusable component.

Examples:

- Button
- IconButton
- Card
- Section
- Player
- ProgressBar
- SpeedSelector
- VoiceSelector
- StatusBadge
- EmptyState
- ErrorState
- LoadingState

Components should never know about browser APIs.

Business logic belongs outside React components.

---

## Consistent Layout

Popup width:

360px

Spacing system:

4
8
12
16
24
32

Border radius:

10–14px

Avoid inconsistent spacing.

---

## Typography

Use a clean system font stack.

Hierarchy:

Title

Subtitle

Body

Caption

Metadata

Titles should truncate gracefully.

Never allow overflowing text.

---

## Color System

Prefer neutral colors.

Primary emphasis comes from typography and spacing rather than color.

Use color only for:

- active playback
- errors
- warnings
- success

Avoid decorative colors.

---

## Motion

Motion should communicate state changes.

Examples:

- play → pause
- loading
- progress
- hover
- focus

Animations should be subtle.

150–250ms.

Respect prefers-reduced-motion.

---

# Popup Layout

```
┌──────────────────────────────┐
│ SoftSpoken              ⚙    │
│                              │
│ The Psychology of...         │
│ Medium • 12 min              │
│                              │
│           ▶                  │
│                              │
│ ─────────●──────────          │
│ 03:20          11:42          │
│                              │
│ ◀ Paragraph      Paragraph ▶ │
│                              │
│ Speed     Voice              │
└──────────────────────────────┘
```

No dashboard.

No cards stacked everywhere.

No unnecessary separators.

Whitespace should create hierarchy.

---

# Component Library

## Primary Button

Used only for:

- Listen
- Resume

Large.

High contrast.

One per screen.

---

## Secondary Button

Used for:

- Pause
- Stop
- Restart

Lower emphasis.

---

## Icon Button

Used for:

- Settings
- Previous
- Next
- Close

Consistent sizing.

44x44 minimum.

---

## Cards

Cards should only group related information.

Avoid nesting cards.

Avoid card inside card.

---

## Progress Bar

Thin.

Minimal.

Smooth.

Always visible during playback.

---

## Empty States

Examples:

No article found.

No text selected.

Unsupported page.

Voice unavailable.

Every empty state should explain:

- what happened
- why
- what to do next

---

# States

Every screen should have dedicated UI for:

Loading

Ready

Listening

Paused

Completed

Error

Unsupported Page

No Selection

Extraction Failed

Never mix multiple states.

---

# Accessibility

Keyboard-first.

Visible focus.

44px touch targets.

High contrast compatible.

Reduced motion support.

Proper ARIA labels.

Screen-reader friendly.

---

# Microcopy

Keep copy short.

Good:

Listen

Pause

Resume

Continue

Reading Selection

Reading Article

Unsupported Page

Extraction Failed

No Text Selected

Avoid:

Execute

Process

Launch

Initialize

Powered by AI

---

# Responsive Behavior

Popup should adapt gracefully to:

Short article titles

Very long titles

No metadata

Large fonts

200% zoom

Different browser scaling

---

# Future Scalability

The component system should support future features without redesign.

Future components:

- Queue
- Bookmarks
- Listening History
- Recently Played
- AI Explain
- AI Summary
- Reading Notes

Existing layouts should not require restructuring.

---

# Manual UX Checklist

## Visual

✓ Consistent spacing

✓ Typography hierarchy

✓ No visual clutter

✓ Clean alignment

✓ Premium appearance

✓ Apple/Linear aesthetic

---

## Functional

✓ Popup opens instantly

✓ Current article detected

✓ Selection overrides article

✓ Playback controls obvious

✓ Progress updates correctly

✓ Settings persist

✓ Errors understandable

---

## Accessibility

✓ Keyboard navigation

✓ Screen reader labels

✓ High contrast

✓ Reduced motion

✓ 200% zoom

✓ Focus order

---

## Manual Playback

Confirm in Chrome:

✓ Selected text playback

✓ Full article playback

✓ Pause

✓ Resume

✓ Stop

✓ Previous paragraph

✓ Next paragraph

✓ Playback speed

✓ Voice selection

✓ Background playback

✓ Restore previous session

---

# Definition of Done

A feature is complete only if it:

- looks visually consistent with the design system
- follows modular component architecture
- maintains accessibility
- preserves the minimalist aesthetic
- passes typecheck
- passes tests
- builds successfully
- is documented
- requires no unnecessary user interaction

Every new feature should feel like it has always belonged in SoftSpoken.
