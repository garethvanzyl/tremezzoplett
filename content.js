(function () {
  const editableNodes = document.querySelectorAll("[data-content]");
  if (!editableNodes.length) return;

  function applyText(node, value) {
    node.textContent = value;
  }

  function applyList(node, value) {
    const items = String(value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (!items.length) return;
    node.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  }

  function applyMultiline(node, value) {
    const lines = String(value || "")
      .split(/\r?\n/)
      .map((line) => escapeHtml(line.trim()))
      .filter(Boolean);
    if (!lines.length) return;
    node.innerHTML = lines.join("<br />");
  }

  function applyAttribute(node, value) {
    const attribute = node.dataset.contentAttr;
    if (!attribute) return false;
    node.setAttribute(attribute, value);
    return true;
  }

  function applyHref(node, value) {
    const hrefType = node.dataset.contentHref;
    if (hrefType === "tel") {
      node.setAttribute("href", `tel:${String(value).replace(/[^\d+]/g, "")}`);
    }
    if (hrefType === "mailto") {
      node.setAttribute("href", `mailto:${String(value).trim()}`);
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function loadContent() {
    try {
      const response = await fetch("/api/content", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const content = data.content || {};
      editableNodes.forEach((node) => {
        const key = node.dataset.content;
        const entry = content[key];
        if (!entry || !entry.value) return;
        if (applyAttribute(node, entry.value)) {
          return;
        }
        applyHref(node, entry.value);
        if (node.dataset.contentType === "list") {
          applyList(node, entry.value);
        } else if (node.dataset.contentType === "multiline") {
          applyMultiline(node, entry.value);
        } else {
          applyText(node, entry.value);
        }
      });
    } catch {
      // Static page text remains the fallback if the CMS request fails.
    }
  }

  loadContent();
})();
