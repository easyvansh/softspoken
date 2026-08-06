# SoftSpoken

SoftSpoken is a privacy-first Chrome extension that reads articles and selected
webpage text aloud while the user works.

SoftSpoken runs locally in the browser. It can read selected text first, extract
the current article when no text is selected, and continue playback from the
Chrome side panel while the user changes tabs.

## Privacy

- Webpage text is never sent to a backend or external API.
- Speech uses the browser's local `speechSynthesis` engine.
- Durable storage is limited to the latest article progress and voice settings.
- The extension does not include analytics, accounts, sync, or recommendations.

## Chrome Web Store Notes

- Required permissions: `activeTab`, `scripting`, `storage`, `offscreen`, and
  `sidePanel`.
- No broad host permissions are requested.
- The popup is a launcher; the player opens in Chrome's side panel.
- Some browser, extension, local, paywalled, or highly dynamic pages cannot be
  inspected or extracted.

## Scripts

- `npm run dev`: start WXT development mode
- `npm run typecheck`: run TypeScript without emitting files
- `npm run test`: run unit tests
- `npm run format`: format source files with Prettier
- `npm run build`: create a production Chrome MV3 extension build
- `npm run zip`: create a Chrome Web Store upload package
