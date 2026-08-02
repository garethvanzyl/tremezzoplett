(function () {
  const loginForm = document.querySelector("[data-admin-login]");
  const panel = document.querySelector("[data-admin-panel]");
  const blockForm = document.querySelector("[data-admin-block-form]");
  const list = document.querySelector("[data-blocked-list]");
  const status = document.querySelector("[data-admin-status]");
  const contentEditor = document.querySelector("[data-content-editor]");
  const tabs = document.querySelectorAll("[data-admin-tab]");
  const tools = document.querySelectorAll("[data-admin-tool]");
  if (!loginForm || !panel || !blockForm || !list) return;

  let password = "";
  let contentStatus;

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", Boolean(isError));
  }

  function setContentStatus(message, isError) {
    if (!contentStatus) return;
    contentStatus.textContent = message || "";
    contentStatus.classList.toggle("is-error", Boolean(isError));
  }

  function rowTemplate(item) {
    return `
      <article class="blocked-item">
        <div>
          <strong>${item.start_date} to ${item.end_date}</strong>
          <span>${item.note || "Blocked"}</span>
        </div>
        <button class="button button-outline button-small" type="button" data-delete="${item.id}">Remove</button>
      </article>
    `;
  }

  function diagnosticsTemplate(data) {
    const env = data.env || {};
    const checks = data.checks || {};
    const envRows = Object.entries(env)
      .map(([key, value]) => `<li><strong>${key}</strong>: ${value ? "set" : "missing"}</li>`)
      .join("");
    const checkRows = Object.entries(checks)
      .map(([key, value]) => {
        const detail = value.ok ? "ok" : value.error || "failed";
        return `<li><strong>${key}</strong>: ${detail}</li>`;
      })
      .join("");
    return `
      <details class="diagnostics" open>
        <summary>Backend diagnostics</summary>
        <ul>${envRows}</ul>
        <ul>${checkRows}</ul>
      </details>
    `;
  }

  function pageLabel(page) {
    const labels = {
      contact: "Contact",
      gallery: "Gallery",
      home: "Homepage",
      rates: "Rates & bookings",
    };
    return labels[page] || page;
  }

  function editorFieldTemplate(block) {
    const tag = block.kind === "textarea" || block.kind === "list" ? "textarea" : "input";
    const hint = block.kind === "list" ? '<small>One list item per line.</small>' : "";
    if (tag === "textarea") {
      return `
        <label>
          ${block.label}
          <textarea name="${block.key}" rows="${block.kind === "list" ? 7 : 4}">${escapeHtml(block.value || "")}</textarea>
          ${hint}
        </label>
      `;
    }
    return `
      <label>
        ${block.label}
        <input name="${block.key}" type="text" value="${escapeHtml(block.value || "")}" />
      </label>
    `;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function adminFetch(url, options = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        "content-type": "application/json",
        "x-admin-password": password,
        ...(options.headers || {}),
      },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Admin request failed.");
    return data;
  }

  async function loadBlocks() {
    const data = await adminFetch("/api/admin-blocked-dates");
    const blocks = data.blockedDates || [];
    list.innerHTML = blocks.length
      ? blocks.map(rowTemplate).join("")
      : '<p class="empty-state">No blocked dates yet.</p>';
    list.querySelectorAll("[data-delete]").forEach((button) => {
      button.addEventListener("click", async () => {
        setStatus("Removing dates...");
        try {
          await adminFetch(`/api/admin-blocked-dates?id=${encodeURIComponent(button.dataset.delete)}`, {
            method: "DELETE",
          });
          setStatus("Blocked dates removed.");
          await loadBlocks();
        } catch (error) {
          setStatus(error.message, true);
        }
      });
    });
  }

  async function loadContent() {
    if (!contentEditor) return;
    const data = await adminFetch("/api/admin-content");
    const blocks = data.blocks || [];
    const groups = blocks.reduce((acc, block) => {
      const page = block.page || "other";
      acc[page] = acc[page] || [];
      acc[page].push(block);
      return acc;
    }, {});

    contentEditor.innerHTML = Object.entries(groups)
      .map(
        ([page, pageBlocks]) => `
          <fieldset class="content-group">
            <legend>${pageLabel(page)}</legend>
            ${pageBlocks.map(editorFieldTemplate).join("")}
          </fieldset>
        `
      )
      .join("");

    const saveBar = document.createElement("div");
    saveBar.className = "content-save-bar";
    const submit = document.createElement("button");
    submit.className = "button button-gold";
    submit.type = "submit";
    submit.textContent = "Save page text";
    contentStatus = document.createElement("p");
    contentStatus.className = "form-status content-status";
    contentStatus.setAttribute("role", "status");
    saveBar.appendChild(submit);
    saveBar.appendChild(contentStatus);
    contentEditor.appendChild(saveBar);
  }

  async function unlock(value) {
    password = value;
    const diagnostics = await adminFetch("/api/admin-diagnostics");
    panel.hidden = false;
    const hasSupabaseError = Object.values(diagnostics.checks || {}).some((check) => !check.ok);
    if (hasSupabaseError) {
      list.innerHTML = diagnosticsTemplate(diagnostics);
      setStatus("Password accepted, but the Supabase backend needs attention.", true);
      return;
    }
    await loadBlocks();
    await loadContent();
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Checking password...");
    try {
      await unlock(new FormData(loginForm).get("password"));
      setStatus("");
    } catch (error) {
      panel.hidden = true;
      setStatus(error.message, true);
    }
  });

  blockForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(blockForm).entries());
    setStatus("Adding blocked dates...");
    try {
      await adminFetch("/api/admin-blocked-dates", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      blockForm.reset();
      setStatus("Blocked dates added.");
      await loadBlocks();
    } catch (error) {
      setStatus(error.message, true);
    }
  });

  if (contentEditor) {
    contentEditor.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(contentEditor);
      const blocks = Array.from(formData.entries()).map(([key, value]) => ({ key, value }));
      setStatus("Saving page text...");
      setContentStatus("Saving...");
      const submit = contentEditor.querySelector('button[type="submit"]');
      if (submit) submit.disabled = true;
      try {
        await adminFetch("/api/admin-content", {
          method: "PUT",
          body: JSON.stringify({ blocks }),
        });
        const savedAt = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setStatus("Page text saved.");
        setContentStatus(`Saved at ${savedAt}. Refresh the public page to see the update.`);
      } catch (error) {
        setStatus(error.message, true);
        setContentStatus(error.message, true);
      } finally {
        if (submit) submit.disabled = false;
      }
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.adminTab;
      tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
      tools.forEach((tool) => tool.classList.toggle("is-active", tool.dataset.adminTool === target));
      setStatus("");
    });
  });

})();
