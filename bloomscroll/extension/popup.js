import { DEFAULT_SITE, getSite, buildCheckUrl } from "./config.js";

const $ = (id) => document.getElementById(id);

async function openCheck(query) {
  const trimmed = (query ?? "").trim();
  if (!trimmed) {
    setStatus("Paste something first.", true);
    return;
  }
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
  await chrome.storage.sync.set({ site: raw });
  setStatus("Saved.");
});

$("reset-site").addEventListener("click", async () => {
  await chrome.storage.sync.remove("site");
  $("site").value = DEFAULT_SITE;
  setStatus("Reset to default.");
});
