const { json, supabaseFetch } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const blocks = await supabaseFetch(
      `blocked_dates?select=id,start_date,end_date,note&end_date=gte.${today}&order=start_date.asc`
    );
    return json(res, 200, { blockedDates: blocks });
  } catch (error) {
    const setupRequired = error.message && error.message.startsWith("Missing ");
    return json(res, setupRequired ? 503 : 500, {
      error: setupRequired ? "Availability backend is not configured yet." : "Could not load availability",
    });
  }
};
