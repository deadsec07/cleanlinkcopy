chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    const [{ result: copied }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const stripParams = (raw) => {
          const u = new URL(raw, location.href);
          const banned = new Set([
            "gclid","fbclid","msclkid","yclid","igsh","vero_id","mc_cid","mc_eid","spm","ref"
          ]);
          for (const k of [...u.searchParams.keys()]) {
            if (k.startsWith("utm_") || banned.has(k)) u.searchParams.delete(k);
          }
          const s = u.toString();
          return s.endsWith("?") ? s.slice(0, -1) : s;
        };

        const canonical = document.querySelector('link[rel="canonical"]')?.href;
        const candidate = canonical && /^https?:\/\//i.test(canonical) ? canonical : location.href;
        const clean = stripParams(candidate);

        // Clipboard write (user gesture from action click)
        try { navigator.clipboard.writeText(clean); } catch {}
        return clean;
      }
    });

    // Visual feedback
    chrome.action.setBadgeText({ tabId: tab.id, text: "✔" });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1000);

    // Optional: tooltip with copied URL start
    if (copied) chrome.action.setTitle({ tabId: tab.id, title: `Copied: ${copied.slice(0, 60)}…` });
  } catch (e) {
    console.error("CleanLink Copy failed:", e);
    chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1200);
  }
});
