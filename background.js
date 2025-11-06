// background.js — CleanLink Copy (simple + correct badges)
// ✔ = copied to clipboard
// ↷ = clipboard blocked → textbox shown (you can Cmd/Ctrl+C)
// ! = unexpected error only (never on success)

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id || !tab.url) return;

  // Don't run on internal pages
  if (/^(chrome|edge|opera|brave|about|moz-extension|chrome-extension):/i.test(tab.url)) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setTitle({ tabId: tab.id, title: "Cannot run on internal pages" });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1200);
    return;
  }

  try {
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      world: "MAIN",
      func: () => {
        // ---- helpers inside the page ----
        const TRACKING_KEYS = new Set([
          "gclid","fbclid","msclkid","yclid","igsh","vero_id",
          "mc_cid","mc_eid","spm","ref","_hsmi","_hsenc","sca_esv"
        ]);

        const isAbs = (s) => /^https?:\/\//i.test(s || "");

        const extractNestedAbs = (s) => {
          if (!s) return null;
          if (/%3A%2F%2F/i.test(s) || /https?:%2F%2F/i.test(s)) {
            try {
              const dec = decodeURIComponent(s);
              if (isAbs(dec)) return dec;
              const m = dec.match(/https?:\/\/[^\s"'<>()]+/i);
              if (m) return m[0];
            } catch {}
          }
          const plain = s.match(/https?:\/\/[^\s"'<>()]+/i);
          return plain ? plain[0] : null;
        };

        const normalize = (raw) => {
          if (!raw) return null;
          const s = String(raw).trim();
          if (isAbs(s)) return s;
          const nested = extractNestedAbs(s);
          if (nested) return nested;
          try { return new URL(s, location.href).toString(); } catch { return null; }
        };

        const extractRedirectParam = (s) => {
          try {
            const u = new URL(s, location.href);
            for (const k of ["url","u","target","dest","redirect","redirect_url"]) {
              const v = u.searchParams.get(k);
              if (!v) continue;
              try {
                const dec = decodeURIComponent(v);
                if (isAbs(dec)) return dec;
              } catch {}
            }
          } catch {}
          return null;
        };

        const getCanonicalish = () => {
          const raw = [
            document.querySelector('link[rel="canonical"][href]')?.getAttribute("href"),
            document.querySelector('meta[property="og:url"][content]')?.getAttribute("content"),
            document.querySelector('meta[name="twitter:url"][content]')?.getAttribute("content"),
            location.href
          ].filter(Boolean);

          const norm = raw.map(normalize).filter(Boolean);

          // prefer embedded redirect targets if present
          for (const c of norm) {
            const red = extractRedirectParam(c);
            if (red) return red;
          }

          // choose first candidate (often canonical); then merge non-tracking from actual URL
          const base = norm[0] || location.href;

          // merge non-tracking params when origin+path match (keeps resource_id, hl, etc.)
          try {
            const a = new URL(base);
            const b = new URL(location.href);
            if (a.origin === b.origin && a.pathname === b.pathname) {
              for (const [k,v] of b.searchParams.entries()) {
                if (!v) continue;
                if (k.startsWith("utm_") || TRACKING_KEYS.has(k)) continue;
                if (!a.searchParams.has(k)) a.searchParams.set(k, v);
              }
              return a.toString();
            }
          } catch {}

          return base;
        };

        const stripParams = (raw) => {
          const u = new URL(raw, location.href);

          // remove trackers in query
          for (const k of [...u.searchParams.keys()]) {
            if (k.startsWith("utm_") || TRACKING_KEYS.has(k)) u.searchParams.delete(k);
          }

          // remove trackers in hash query
          if (u.hash && u.hash.includes("?")) {
            try {
              const [hPath, hQuery] = u.hash.slice(1).split("?");
              const h = new URLSearchParams(hQuery || "");
              for (const k of [...h.keys()]) {
                if (k.startsWith("utm_") || TRACKING_KEYS.has(k)) h.delete(k);
              }
              const rebuilt = h.toString();
              u.hash = rebuilt ? `#${hPath}?${rebuilt}` : `#${hPath || ""}`;
            } catch {}
          }

          // fix "/https://example.com/..." tails
          const appended = u.pathname.match(/https?:\/\/[^\s"'<>()]+/i);
          if (appended) {
            try { return new URL(appended[0]).toString(); } catch {}
          }

          return u.toString();
        };

        const cleanUrl = stripParams(getCanonicalish());

        const tryCopy = async (text) => {
          // Try navigator.clipboard first, then execCommand fallback
          try {
            await navigator.clipboard.writeText(text);
            return true;
          } catch {
            try {
              const ta = document.createElement("textarea");
              ta.value = text;
              ta.setAttribute("readonly", "");
              Object.assign(ta.style, { position: "fixed", top: "-1000px" });
              document.body.appendChild(ta);
              ta.select();
              const ok = document.execCommand("copy");
              ta.remove();
              return !!ok;
            } catch {
              return false;
            }
          }
        };

        const showTextbox = (text) => {
          if (document.getElementById("__cleancopy_overlay")) return;
          const wrap = document.createElement("div");
          wrap.id = "__cleancopy_overlay";
          Object.assign(wrap.style, {
            position: "fixed", inset: "0", zIndex: "2147483647",
            background: "rgba(0,0,0,0.25)", display: "flex",
            alignItems: "center", justifyContent: "center", backdropFilter: "blur(1px)"
          });
          const box = document.createElement("div");
          Object.assign(box.style, {
            padding: "12px", background: "white", borderRadius: "10px",
            boxShadow: "0 6px 24px rgba(0,0,0,0.2)", maxWidth: "90vw",
            width: "min(720px, 90vw)", display: "grid", gap: "8px",
            fontFamily: "system-ui, sans-serif"
          });
          const title = document.createElement("div");
          title.textContent = "Clean link (copy manually)";
          Object.assign(title.style, { fontSize: "14px", opacity: "0.8" });
          const input = document.createElement("input");
          input.type = "text"; input.value = text;
          Object.assign(input.style, {
            fontSize: "14px", padding: "10px 12px",
            border: "1px solid #ccd0d5", borderRadius: "8px", width: "100%"
          });
          const hint = document.createElement("div");
          hint.textContent = "Press ⌘/Ctrl+C to copy. Esc or click outside to close.";
          Object.assign(hint.style, { fontSize: "12px", opacity: "0.6" });
          box.append(title, input, hint);
          wrap.appendChild(box);
          document.body.appendChild(wrap);
          input.focus(); input.select();
          const close = () => wrap.remove();
          wrap.addEventListener("click", (e) => { if (e.target === wrap) close(); }, { passive: true });
          document.addEventListener("keydown", function onKey(e) {
            if (e.key === "Escape") { close(); document.removeEventListener("keydown", onKey); }
          });
        };

        return (async () => {
          const ok = await tryCopy(cleanUrl);
          if (ok) return { status: "copied", url: cleanUrl };
          showTextbox(cleanUrl);
          return { status: "textbox", url: cleanUrl };
        })();
      }
    });

    const status = result?.status;
    const url = result?.url || "";

    if (status === "copied") {
      // SUCCESS → ✔
      await chrome.action.setBadgeText({ tabId: tab.id, text: "✔" });
      await chrome.action.setTitle({ tabId: tab.id, title: `Copied: ${url.slice(0, 60)}…` });
      setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1000);
    } else if (status === "textbox") {
      // BLOCKED → ↷
      await chrome.action.setBadgeText({ tabId: tab.id, text: "↷" });
      await chrome.action.setTitle({ tabId: tab.id, title: "Clipboard blocked — copy from textbox" });
      setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1200);
    } else {
      // Unexpected only → !
      await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
      await chrome.action.setTitle({ tabId: tab.id, title: "Unexpected error" });
      setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1200);
    }
  } catch (e) {
    await chrome.action.setBadgeText({ tabId: tab.id, text: "!" });
    await chrome.action.setTitle({ tabId: tab.id, title: "Unexpected error" });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: "" }), 1200);
  }
});
