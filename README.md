CleanLink Copy — Strip UTM & Tracking

Copy the current page’s **clean URL** with one click. Removes `utm_*`, `gclid`, `fbclid`, and other campaign tags, and prefers the page’s `<link rel="canonical">` when available.

## Why
Sharing cluttered URLs leaks tracking parameters and looks unprofessional. This extension gives you a tidy, privacy-friendly link instantly.

## Features
- Strips common tracking params: `utm_*`, `gclid`, `fbclid`, `msclkid`, `yclid`, `igsh`, `mc_cid`, `mc_eid`, `spm`, `ref`
- Prefers canonical URLs when provided
- Minimal permissions (MV3): `activeTab`, `scripting`
- No host permissions, no persistent content scripts

## Install (Developer Mode)
1. Go to `chrome://extensions/`
2. Toggle **Developer mode**
3. **Load unpacked** → select this folder
4. Pin the extension and click the toolbar icon on any page to copy a clean link

## Packaging
- Chrome Web Store requires at least a 128×128 icon. This repo includes:
  - `icons/icon16.png`, `icons/icon32.png`, `icons/icon48.png`, `icons/icon128.png` (plus 256/512 for future use)

## Permissions
- **activeTab** — Temporarily access the current page **only when** you click the action button to read the canonical URL and copy a cleaned link.
- **scripting** — Inject a tiny function **on demand**. No broad host access and no persistent scripts.

## Submission copy
- **Short:** Copy the current page’s clean URL. Strips UTM & tracking. Prefers canonical. One click.
- **Long:** CleanLink Copy removes junk tracking parameters from URLs before you share them. With one click, it copies a clean link to your clipboard. • Strips `utm_*`, `gclid`, `fbclid`, and more • Prefers `<link rel="canonical">` when available • Minimal permissions, MV3 • Privacy-friendly.

## Dev scripts (optional)
No build tools required. If you want to zip:
