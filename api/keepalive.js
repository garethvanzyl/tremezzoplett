const { cleanEnv, json, supabaseFetch } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const secret = cleanEnv(process.env.CRON_SECRET);
  const authorization = String(req.headers.authorization || "").trim();
  if (secret && authorization !== `Bearer ${secret}`) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    const rows = await supabaseFetch("blocked_dates?select=id&limit=1");
    const payload = {
      ok: true,
      checkedAt: new Date().toISOString(),
      rowsChecked: Array.isArray(rows) ? rows.length : 0,
    };

    if (req.method === "HEAD") {
      res.writeHead(200);
      return res.end();
    }

    return json(res, 200, payload);
  } catch (error) {
    console.error("keepalive_error", error.message);
    return json(res, 500, { error: "Keepalive failed" });
  }
};
