import { getSite, buildCheckUrl, migrateStoredSite } from "./config.js";

const MENU_SELECTION = "bloomscroll-check-selection";
const MENU_PAGE = "bloomscroll-check-page";

function buildMenus() {
  // Rebuilt on every install/update — create() throws on a duplicate id, and
  // an update re-runs this listener against menus that already exist.
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_SELECTION,
      title: 'Check "%s" with Bloomscroll',
      contexts: ["selection"],
    });
    chrome.contextMenus.create({
      id: MENU_PAGE,
      title: "Check this page with Bloomscroll",
      contexts: ["page", "link", "video", "audio", "image", "frame"],
    });
  });
}

chrome.runtime.onInstalled.addListener(async (details) => {
  buildMenus();

  // Correct any origin persisted by an older build before the user can click
  // anything. Runs on "update" too — that's the case that actually matters,
  // since a fresh install has nothing stored.
  await migrateStoredSite();

  const origin = await getSite();

  // First real interaction a new user has with the product. Only on a genuine
  // first install: firing this on every update would reopen the tab on each
  // auto-update, which reads as spam.
  if (details.reason === "install") {
    await chrome.tabs.create({ url: `${origin}/welcome?src=ext` });
  }
});

// Uninstall lands here. Chrome opens this URL after the extension is gone, so
// it has to be a plain page — no extension APIs are available to it.
chrome.runtime.onStartup.addListener(setUninstallUrl);
chrome.runtime.onInstalled.addListener(setUninstallUrl);

async function setUninstallUrl() {
  try {
    const origin = await getSite();
    await chrome.runtime.setUninstallURL(`${origin}/comeback?src=ext`);
  } catch {
    // Non-fatal: worst case we just don't get the exit page.
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const origin = await getSite();
  let query = "";
  if (info.menuItemId === MENU_SELECTION && info.selectionText) {
    query = info.selectionText;
  } else if (info.menuItemId === MENU_PAGE) {
    query = info.linkUrl || info.pageUrl || tab?.url || "";
  }
  const trimmed = query.trim();
  if (!trimmed) return;
  await chrome.tabs.create({ url: buildCheckUrl(origin, trimmed) });
});
