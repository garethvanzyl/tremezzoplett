const { json } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { cleanEnv } = require("./_lib");

  return json(res, 200, {
    turnstileSiteKey: cleanEnv(process.env.TURNSTILE_SITE_KEY),
  });
};
