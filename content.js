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
        if (node.dataset.contentType === "list") {
          applyList(node, entry.value);
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
