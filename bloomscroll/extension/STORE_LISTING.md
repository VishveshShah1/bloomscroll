# bloomscroll — Chrome Web Store listing

Copy these fields verbatim into the Chrome Web Store developer console when submitting.

## Basic

- **Name**: bloomscroll
- **Short description** (max 132 chars): Click the toolbar icon to check the page you're on against real peer-reviewed research, or right-click any selected text.
- **Category**: Productivity (secondary: Accessibility)
- **Language**: English (primary), French (secondary)

## Detailed description (max 16,000 chars — we're using ~700)

Click the bloomscroll icon in your toolbar to check the page you're on. Paste a claim straight into the popup, or hit "Check current tab" to run the article or video already open in front of you.

Prefer the mouse? Right-click works too: highlight any phrase and pick "Check with bloomscroll", or right-click a page, link, or video to send the whole thing. Same result either way.

Whichever you use, it opens bloomscroll, where the actual checkable claims are pulled out of what you sent, searched against Europe PMC's 45 million peer-reviewed biomedical papers, and returned with a graded verdict and real, clickable citations.

Made for anyone who scrolls past "mewing changed my jawline," "this supplement cured my acne," or "seed oils cause everything" and wants to know what the research actually says. Never a bare true or false — five evidence grades, so weak evidence reads as weak. Every citation is validated against the retrieved paper set before it renders, so a fabricated source can't reach your screen.

The extension itself does nothing until you invoke it. No background page reading, no cross-site tracking, no analytics pixels. Full privacy details at bloomscroll.com/privacy.

## Permissions justification

Reviewers ask for a one-line reason per permission. Paste these directly.

- **contextMenus**: Adds the "Check with Bloomscroll" right-click menu items.
- **activeTab**: Reads the current tab's URL when the user clicks the toolbar popup or a right-click menu item. Never reads it in the background.
- **storage**: Stores a single user preference (the Bloomscroll origin URL, for developers running a local copy). Nothing else.
- **host_permissions**: (Not requested — the extension operates purely on the current tab via `activeTab`.)

## Privacy policy URL

Required field. Point to: `https://bloomscroll-maharshi-n-vv.vercel.app/privacy` (swap for the production domain when ready).

## Assets to upload

- **Icon 128x128**: `extension/icons/icon-128.png` — present and valid PNG.
- **Screenshots (1280x800 or 640x400, at least one)**: capture the popup + a Bloomscroll result card. Not yet automated — take these manually with the extension installed.
- **Promotional images** (optional, marquee 1400x560): skip for the initial listing.

## Publishing account

- One-time developer registration fee: **$5 USD**.
- Reviews typically take 1–3 business days. First submission often takes longer.
- Publish to the "public" audience once approved.
