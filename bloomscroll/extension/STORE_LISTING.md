# Bloomscroll — Chrome Web Store listing

Copy these fields verbatim into the Chrome Web Store developer console when submitting.

## Basic

- **Name**: Bloomscroll — keep scrolling, start growing
- **Short description** (max 132 chars): Right-click any health or wellness claim to check it against real peer-reviewed research on Bloomscroll.
- **Category**: Productivity (secondary: Accessibility)
- **Language**: English (primary), French (secondary)

## Detailed description (max 16,000 chars — we're using ~500)

Bloomscroll fact-checks the health and appearance claims in your feed against real scientific literature. Right-click any highlighted phrase, video, or article and pick "Check with Bloomscroll" to send it to bloomscroll.com, where the actual checkable claims are pulled out, searched against Europe PMC's 45 million peer-reviewed biomedical papers, and returned with a graded verdict and real, clickable citations.

Made for anyone who scrolls past "mewing changed my jawline," "this supplement cured my acne," or "seed oils cause everything" and wants to know what the research actually says. Never a bare true or false. Every citation is validated against the retrieved paper set before it renders, so a fabricated source can't reach your screen.

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
