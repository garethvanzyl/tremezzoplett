(function () {
  const loginForm = document.querySelector("[data-admin-login]");
  const panel = document.querySelector("[data-admin-panel]");
  const blockForm = document.querySelector("[data-admin-block-form]");
  const list = document.querySelector("[data-blocked-list]");
  const status = document.querySelector("[data-admin-status]");
  if (!loginForm || !panel || !blockForm || !list) return;

  let password = window.sessionStorage.getItem("tremezzoplettAdminPassword") || "";

  function setStatus(message, isError) {
    if (!status) return;
    status.textContent = message || "";
    status.classList.toggle("is-error", Boolean(isError));
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

  async function unlock(value) {
    password = value;
    window.sessionStorage.setItem("tremezzoplettAdminPassword", password);
    panel.hidden = false;
    const diagnostics = await adminFetch("/api/admin-diagnostics");
    const hasSupabaseError = Object.values(diagnostics.checks || {}).some((check) => !check.ok);
    if (hasSupabaseError) {
      list.innerHTML = diagnosticsTemplate(diagnostics);
      setStatus("Password accepted, but the Supabase backend needs attention.", true);
      return;
    }
    await loadBlocks();
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

  if (password) {
    unlock(password).catch(() => {
      panel.hidden = true;
      window.sessionStorage.removeItem("tremezzoplettAdminPassword");
    });
  }
})();
