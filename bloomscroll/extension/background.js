import { getSite, buildCheckUrl } from "./config.js";

const MENU_SELECTION = "bloomscroll-check-selection";
const MENU_PAGE = "bloomscroll-check-page";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_SELECTION,
    title: "Check \"%s\" with Bloomscroll",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: MENU_PAGE,
    title: "Check this page with Bloomscroll",
    contexts: ["page", "link", "video", "audio", "image", "frame"],
  });
});

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
