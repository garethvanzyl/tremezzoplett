const {
  dateRangeIsValid,
  getClientIp,
  isEmail,
  json,
  readJson,
  sanitizeText,
  sendEmail,
  supabaseFetch,
  verifyTurnstile,
} = require("./_lib");

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const body = await readJson(req);
    if (body.company) {
      return json(res, 200, { ok: true, message: "Thanks. The host will respond within 24 hours." });
    }

    const arrivalDate = sanitizeText(body.arrivalDate, 10);
    const departureDate = sanitizeText(body.departureDate, 10);
    const name = sanitizeText(body.name, 120);
    const phone = sanitizeText(body.phone, 60);
    const email = sanitizeText(body.email, 180).toLowerCase();
    const guests = Number.parseInt(body.guests, 10);
    const message = sanitizeText(body.message, 2000);

    if (!dateRangeIsValid(arrivalDate, departureDate)) {
      return json(res, 400, { error: "Please choose valid arrival and departure dates." });
    }
    if (!name || !phone || !isEmail(email) || !Number.isInteger(guests) || guests < 1 || guests > 10) {
      return json(res, 400, { error: "Please complete your name, phone, email and number of guests." });
    }

    const ip = getClientIp(req);
    const turnstile = await verifyTurnstile(body.turnstileToken, ip);
    if (!turnstile.ok) {
      return json(res, 400, { error: "Please complete the anti-spam check and try again." });
    }

    const overlaps = await supabaseFetch(
      `blocked_dates?select=id&start_date=lte.${departureDate}&end_date=gte.${arrivalDate}&limit=1`
    );
    if (overlaps.length) {
      return json(res, 409, { error: "Those dates are already unavailable. Please choose another stay." });
    }

    const inserted = await supabaseFetch("booking_requests", {
      method: "POST",
      headers: { prefer: "return=representation" },
      body: JSON.stringify({
        arrival_date: arrivalDate,
        departure_date: departureDate,
        name,
        phone,
        email,
        guests,
        message,
        user_agent: sanitizeText(req.headers["user-agent"], 500),
        source: "website",
      }),
    });

    const subject = `Tremezzo booking request: ${arrivalDate} to ${departureDate}`;
    const html = `
      <h2>New Tremezzo Plett booking request</h2>
      <p><strong>Dates:</strong> ${escapeHtml(arrivalDate)} to ${escapeHtml(departureDate)}</p>
      <p><strong>Name:</strong> ${escapeHtml(name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(email)}</p>
      <p><strong>Phone:</strong> ${escapeHtml(phone)}</p>
      <p><strong>Guests:</strong> ${escapeHtml(guests)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message || "No message provided.").replaceAll("\n", "<br>")}</p>
    `;
    await sendEmail({ subject, html, replyTo: email });

    return json(res, 200, {
      ok: true,
      requestId: inserted?.[0]?.id,
      message: "Thanks, your request has been sent. The host will respond within 24 hours.",
    });
  } catch (error) {
    const setupRequired = error.message && error.message.startsWith("Missing ");
    return json(res, setupRequired ? 503 : 500, {
      error: setupRequired
        ? "The booking backend is not configured yet. Please contact the host directly."
        : "Could not send the booking request. Please try again shortly.",
    });
  }
};
