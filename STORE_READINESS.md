# Chrome Web Store Readiness

## Permission Rationale

- `activeTab`: grants temporary access to the user-selected tab when they invoke
  SoftSpoken.
- `scripting`: injects the runtime page reader only into the active tab.
- `storage`: stores local voice settings and the latest local playback progress.
- `offscreen`: owns local speech playback after the popup closes.

SoftSpoken does not request host permissions and does not send page content to
external services.

## Listing Copy

SoftSpoken is a privacy-first reader for Chrome. Highlight text or open an
article, launch SoftSpoken, and listen while you keep working. Playback uses the
browser's local speech engine, and progress is saved locally on your device.

## Required Store Assets

- Extension icon set: present in `public/icon`.
- Screenshots: capture popup article state, active playback, settings and
  unsupported-page state.
- Privacy disclosure: state that webpage content stays local and no analytics,
  accounts or external text-to-speech APIs are used.

## Pre-Submission Validation

- Run `npm run format:check`, `npm run typecheck`, `npm run test` and
  `npm run build`.
- Inspect `.output/chrome-mv3/manifest.json` and confirm there are no
  `host_permissions`.
- Load `.output/chrome-mv3` as an unpacked extension in Chrome and complete the
  manual playback checklist in `UX_AUDIT.md`.
- Run `npm run zip` only after manual playback and permission checks pass.
