(function () {
  const calendarEl = document.querySelector("[data-booking-calendar]");
  const statusEl = document.querySelector("[data-calendar-status]");
  const form = document.querySelector("[data-booking-form]");
  if (!calendarEl || !form) return;

  const arrivalInput = form.querySelector("[data-arrival-date]");
  const departureInput = form.querySelector("[data-departure-date]");
  const formStatus = form.querySelector("[data-form-status]");
  const turnstileEl = document.querySelector("[data-turnstile]");
  const monthNames = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" });
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const state = {
    blockedRanges: [],
    blockedDates: new Set(),
    selectedStart: "",
    selectedEnd: "",
    backendReady: true,
    turnstileWidgetId: null,
  };

  function iso(date) {
    return date.toISOString().slice(0, 10);
  }

  function localIso(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function eachDate(start, end, callback) {
    const current = new Date(`${start}T00:00:00Z`);
    const last = new Date(`${end}T00:00:00Z`);
    while (current <= last) {
      callback(iso(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  function buildBlockedSet(ranges) {
    const blocked = new Set();
    ranges.forEach((range) => eachDate(range.start_date, range.end_date, (date) => blocked.add(date)));
    return blocked;
  }

  function isPast(date) {
    return date < iso(new Date());
  }

  function selectionContainsBlocked(start, end) {
    let blocked = false;
    eachDate(start, end, (date) => {
      if (state.blockedDates.has(date)) blocked = true;
    });
    return blocked;
  }

  function setStatus(message, isError) {
    if (!formStatus) return;
    formStatus.textContent = message || "";
    formStatus.classList.toggle("is-error", Boolean(isError));
  }

  function setCalendarStatus(message) {
    if (statusEl) statusEl.textContent = message || "";
  }

  function setFormDisabled(disabled) {
    form.querySelectorAll("input, textarea, button").forEach((field) => {
      if (field.classList.contains("hidden-field")) return;
      field.disabled = disabled;
    });
  }

  function updateInputs() {
    arrivalInput.value = state.selectedStart || "";
    departureInput.value = state.selectedEnd || "";
  }

  function selectDate(date) {
    if (state.blockedDates.has(date) || isPast(date)) return;
    if (!state.selectedStart || state.selectedEnd || date < state.selectedStart) {
      state.selectedStart = date;
      state.selectedEnd = "";
    } else if (date === state.selectedStart) {
      state.selectedEnd = "";
    } else if (selectionContainsBlocked(state.selectedStart, date)) {
      setStatus("That stay crosses unavailable dates. Please choose a different range.", true);
      state.selectedStart = date;
      state.selectedEnd = "";
    } else {
      state.selectedEnd = date;
      setStatus("");
    }
    updateInputs();
    renderCalendar();
  }

  function isSelected(date) {
    if (!state.selectedStart) return false;
    if (!state.selectedEnd) return date === state.selectedStart;
    return date >= state.selectedStart && date <= state.selectedEnd;
  }

  function renderMonth(offset) {
    const today = new Date();
    const display = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    const year = display.getFullYear();
    const month = display.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leading = (firstDay.getDay() + 6) % 7;

    let html = `<article class="calendar-month"><h3>${monthNames.format(display)}</h3><div class="calendar-grid">`;
    dayNames.forEach((day) => {
      html += `<span class="calendar-day-name">${day}</span>`;
    });
    for (let i = 0; i < leading; i += 1) {
      html += '<span class="calendar-empty"></span>';
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = localIso(year, month, day);
      const blocked = state.blockedDates.has(date);
      const disabled = blocked || isPast(date);
      const classes = ["calendar-day"];
      if (blocked) classes.push("is-blocked");
      if (isSelected(date)) classes.push("is-selected");
      if (disabled) classes.push("is-disabled");
      html += `<button type="button" class="${classes.join(" ")}" data-date="${date}" ${disabled ? "disabled" : ""}>${day}</button>`;
    }
    html += "</div></article>";
    return html;
  }

  function renderCalendar() {
    calendarEl.innerHTML = renderMonth(0) + renderMonth(1);
    calendarEl.querySelectorAll("[data-date]").forEach((button) => {
      button.addEventListener("click", () => selectDate(button.dataset.date));
    });
  }

  async function loadAvailability() {
    try {
      const response = await fetch("/api/availability");
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 503) {
          state.backendReady = false;
          setFormDisabled(true);
          setCalendarStatus(
            "Online availability is being configured. Please email bookings@tremezzoplett.co.za for now."
          );
          setStatus("Online requests are being configured. Please email bookings@tremezzoplett.co.za.", true);
          renderCalendar();
          return;
        }
        throw new Error(data.error || "Availability failed");
      }
      state.blockedRanges = data.blockedDates || [];
      state.blockedDates = buildBlockedSet(state.blockedRanges);
      state.backendReady = true;
      setFormDisabled(false);
      setCalendarStatus("Choose your preferred arrival and departure dates.");
    } catch {
      setCalendarStatus("Availability could not be loaded. You can still send a request.");
    }
    renderCalendar();
  }

  async function loadTurnstile() {
    try {
      const response = await fetch("/api/config");
      const data = await response.json();
      if (!data.turnstileSiteKey || !turnstileEl) return;
      const render = () => {
        if (!window.turnstile || state.turnstileWidgetId !== null) return;
        state.turnstileWidgetId = window.turnstile.render(turnstileEl, {
          sitekey: data.turnstileSiteKey,
        });
      };
      if (window.turnstile) render();
      else window.addEventListener("load", render);
    } catch {
      // The server still validates Turnstile when configured.
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.backendReady) return;
    setStatus("Sending your request...");
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.arrivalDate = arrivalInput.value;
    payload.departureDate = departureInput.value;
    payload.turnstileToken =
      window.turnstile && state.turnstileWidgetId !== null
        ? window.turnstile.getResponse(state.turnstileWidgetId)
        : "";

    try {
      const response = await fetch("/api/booking-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not send request.");
      form.reset();
      state.selectedStart = "";
      state.selectedEnd = "";
      updateInputs();
      renderCalendar();
      if (window.turnstile && state.turnstileWidgetId !== null) window.turnstile.reset(state.turnstileWidgetId);
      setStatus(data.message || "Thanks, your request has been sent. The host will respond within 24 hours.");
    } catch (error) {
      setStatus(error.message || "Could not send request. Please try again.", true);
      if (window.turnstile && state.turnstileWidgetId !== null) window.turnstile.reset(state.turnstileWidgetId);
    }
  });

  arrivalInput.addEventListener("change", () => {
    state.selectedStart = arrivalInput.value;
    state.selectedEnd = departureInput.value;
    renderCalendar();
  });

  departureInput.addEventListener("change", () => {
    state.selectedStart = arrivalInput.value;
    state.selectedEnd = departureInput.value;
    renderCalendar();
  });

  loadAvailability();
  loadTurnstile();
})();
