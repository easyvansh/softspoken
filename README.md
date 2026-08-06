<h1>
  <img src="public/icon/128.png" alt="SoftSpoken logo" width="36" height="36" align="left">
  SoftSpoken
</h1>

SoftSpoken is a privacy-first Chrome extension for listening to articles and
selected webpage text while you work.

Highlight text and press **Listen**, or open a readable article with nothing
selected and let SoftSpoken extract the article locally. Playback uses the
browser's built-in speech engine and is owned by an offscreen document, so audio
can continue after the popup closes.

## What It Does

- Reads selected webpage text aloud.
- Extracts readable articles with Mozilla Readability when no text is selected.
- Falls back to local article extraction for simpler pages.
- Supports pause, resume, stop, previous paragraph and next paragraph.
- Supports local voice selection and playback speed.
- Saves the latest playback progress and speech preferences locally.
- Uses a compact dark popup as the player and controller.

## Privacy Promise

- Webpage content is never sent to a backend or external API.
- Speech uses local browser `speechSynthesis`.
- No accounts, authentication, analytics, recommendations or cloud sync.
- Durable storage is limited to the latest article progress and voice settings.
- No broad host permissions are requested.

## Permissions

SoftSpoken currently requests only:

- `activeTab`: temporary access to the tab after the user opens the extension.
- `scripting`: injects the local page reader into the active tab.
- `storage`: stores local progress and preferences.
- `offscreen`: keeps one local speech owner alive for playback.

## Development

Install dependencies:

```sh
npm install
```

Start WXT development mode:

```sh
npm run dev
```

Build the Chrome MV3 extension:

```sh
npm run build
```

Load the generated extension from:

```text
.output/chrome-mv3
```

## Scripts

- `npm run dev`: start WXT development mode.
- `npm run typecheck`: run TypeScript without emitting files.
- `npm run test`: run unit tests.
- `npm run test:watch`: run Vitest in watch mode.
- `npm run format`: format source files with Prettier.
- `npm run format:check`: check formatting.
- `npm run build`: create a production Chrome MV3 extension build.
- `npm run zip`: create a Chrome Web Store upload package.

## Manual QA

Before packaging, test in Chrome:

- Select text on an HTTPS page, open the popup and press Listen.
- Open an article with no selection and confirm extraction then playback.
- Pause, resume, stop and change playback speed.
- Use previous and next paragraph during article playback.
- Confirm voices load and the selected voice persists.
- Close and reopen the popup during playback.
- Test unsupported pages such as `chrome://extensions`.

## Current Limitations

- Article extraction reads only the top-frame DOM.
- Paywalled, script-only or highly dynamic pages may fail extraction.
- Voice availability depends on the browser and operating system.
- Full audio behavior still requires manual browser verification.
