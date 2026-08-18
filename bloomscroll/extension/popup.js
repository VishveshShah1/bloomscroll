import {
  DEFAULT_SITE,
  getSite,
  buildCheckUrl,
  isStaleOrigin,
  migrateStoredSite,
} from "./config.js";

const $ = (id) => document.getElementById(id);

// Runs on every popup open, not just on install/update. chrome.storage.sync
// replicates across a user's machines, so a stale origin saved on another
// device can arrive here long after install — at which point no install or
// update event will ever fire again to correct it, and every check would keep
// opening a retired deploy whose 404 is Next's default rather than ours.
const migrated = migrateStoredSite();

async function openCheck(query) {
  const trimmed = (query ?? "").trim();
  if (!trimmed) {
    setStatus("Paste something first.", true);
    return;
  }
  await migrated;
  const origin = await getSite();
  await chrome.tabs.create({ url: buildCheckUrl(origin, trimmed) });
  window.close();
}

function setStatus(msg, isError = false) {
  const el = $("status");
  el.textContent = msg;
  el.classList.toggle("error", !!isError);
}

$("check-form").addEventListener("submit", (e) => {
  e.preventDefault();
  openCheck($("claim").value);
});

$("check-tab").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    setStatus("Couldn't read the current tab URL.", true);
    return;
  }
  openCheck(tab.url);
});

const settingsPanel = $("settings");
$("settings-toggle").addEventListener("click", async () => {
  settingsPanel.hidden = !settingsPanel.hidden;
  if (!settingsPanel.hidden) {
    await migrated;
    $("site").value = await getSite();
  }
});

$("save-site").addEventListener("click", async () => {
  const raw = $("site").value.trim();
  if (!raw) {
    setStatus("Enter a URL first.", true);
    return;
  }
  try {
    new URL(raw);
  } catch {
    setStatus("That doesn't look like a URL.", true);
    return;
  }
  // getSite() refuses to navigate to a retired origin, so storing one here
  // would leave this field advertising a URL that checks never actually use.
  // Refuse it at entry and say what to use instead.
  if (isStaleOrigin(raw)) {
    setStatus(`That origin is retired. Use ${DEFAULT_SITE}.`, true);
    return;
  }
  await chrome.storage.sync.set({ site: raw });
  setStatus("Saved.");
});

$("reset-site").addEventListener("click", async () => {
  await chrome.storage.sync.remove("site");
  $("site").value = DEFAULT_SITE;
  setStatus("Reset to default.");
});
