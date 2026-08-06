# SoftSpoken UX Audit

## Improvements Made

- Clarified that the popup opens the full side-panel player.
- Made Listen copy context-aware for selections, articles and extraction
  loading.
- Added short help text explaining why Listen is disabled.
- Improved extraction, unsupported-page, playback-error and voice-unavailable
  microcopy.
- Made paragraph navigation labels explicit.
- Normalized speed and pitch option labels.
- Added practical 44px touch targets for controls.
- Improved focus rings and forced-colors support.
- Added a reduced-motion guard for future transitions.
- Removed unused starter assets and replaced default extension icons.

## Manual UX Checklist

- Open the popup and confirm it clearly launches the side panel.
- Open a normal article with no selected text and confirm article loading,
  article details and Listen-to-article states are clear.
- Select text and confirm Listen switches to selection wording.
- Test unsupported pages such as `chrome://extensions` and the Chrome Web Store.
- Start playback and confirm Playing, Paused, Stopped, Completed and error
  states are understandable.
- Navigate by keyboard only and confirm focus follows the visual order.
- Test 200% zoom, high contrast and reduced motion.
- Confirm touch targets are easy to activate in the side panel.

## Remaining Manual Playback Confirmation

Automated tests validate speech controller behavior, chunking, messaging and
storage, but audible playback must be confirmed in Chrome with the unpacked
extension loaded because native `speechSynthesis` audio cannot be proven by the
unit test runner.
