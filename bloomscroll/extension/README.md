# bloomscroll — Chrome extension

Click the toolbar icon to check the page you're on against real biomedical literature — or right-click anything you scrolled past. No account, no popup nagging, no data collection.

## Install (developer / unpacked)

Until the extension is on the Chrome Web Store, you can sideload it in under a minute:

1. Open **chrome://extensions**.
2. Toggle **Developer mode** on (top-right).
3. Click **Load unpacked**.
4. Select this `extension/` folder.

You'll see the Bloomscroll icon in your toolbar. Pin it (puzzle-piece → pin) so it's always one click away.

Works in Chrome, Edge, Brave, Arc, and any other Chromium-based browser.

## What it does

- **Toolbar popup** — paste a link or a claim and hit **Check**, or press **Check current tab** to run the URL you're on.
- **Right-click a highlighted phrase** → "Check '\"…\"' with Bloomscroll" — opens the check in a new tab.
- **Right-click a page, link, or video** → "Check this page with Bloomscroll".

Every action opens `bloomscroll.…/dashboard?q=<what-you-picked>` in a new tab. The dashboard auto-runs the check on load (you'll be sent through sign-in first if you aren't signed in).

## Point it at a different origin

By default the extension talks to the production site. To use it against a local dev server:

1. Click the extension icon.
2. Click the ⚙ (top-right).
3. Enter e.g. `http://localhost:3000` and **Save**.

Or, permanently: edit `DEFAULT_SITE` in `config.js` and reload the extension at `chrome://extensions`.

## Files

- `manifest.json` — MV3 manifest.
- `background.js` — service worker; registers the context-menu items.
- `popup.html` / `popup.css` / `popup.js` — the toolbar popup UI.
- `config.js` — the origin config + URL builder, shared by the popup and worker.
- `icons/` — toolbar icons (16 / 32 / 48 / 128).

## Publishing to the Chrome Web Store

- One-time $5 developer registration.
- Bundle the `extension/` directory as a zip; upload at [chrome.google.com/webstore/devconsole](https://chrome.google.com/webstore/devconsole).
- Reviewers typically take 1–3 business days.
