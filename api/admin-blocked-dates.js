const {
  adminAuthorized,
  dateRangeIsValid,
  json,
  readJson,
  sanitizeText,
  supabaseFetch,
} = require("./_lib");

module.exports = async function handler(req, res) {
  if (!adminAuthorized(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const blocks = await supabaseFetch(
        "blocked_dates?select=id,start_date,end_date,note,created_at&order=start_date.asc"
      );
      return json(res, 200, { blockedDates: blocks });
    }

    if (req.method === "POST") {
      const body = await readJson(req);
      const startDate = sanitizeText(body.startDate, 10);
      const endDate = sanitizeText(body.endDate, 10);
      const note = sanitizeText(body.note, 240);
      if (!dateRangeIsValid(startDate, endDate)) {
        return json(res, 400, { error: "Choose valid start and end dates." });
      }
      const inserted = await supabaseFetch("blocked_dates", {
        method: "POST",
        headers: { prefer: "return=representation" },
        body: JSON.stringify({ start_date: startDate, end_date: endDate, note }),
      });
      return json(res, 200, { blockedDate: inserted?.[0] });
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url, `https://${req.headers.host}`);
      const id = sanitizeText(url.searchParams.get("id"), 80);
      if (!id) return json(res, 400, { error: "Missing id." });
      await supabaseFetch(`blocked_dates?id=eq.${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    const setupRequired = error.message && error.message.startsWith("Missing ");
    return json(res, setupRequired ? 503 : 500, {
      error: setupRequired
        ? "The availability backend is not configured yet."
        : "Could not update blocked dates.",
    });
  }
};
