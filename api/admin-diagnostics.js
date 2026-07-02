const { adminAuthorized, json, requireEnv, supabaseFetch } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }
  if (!adminAuthorized(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  const env = {
    supabaseUrl: Boolean(process.env.SUPABASE_URL),
    supabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    resendApiKey: Boolean(process.env.RESEND_API_KEY),
    turnstileSecretKey: Boolean(process.env.TURNSTILE_SECRET_KEY),
    turnstileSiteKey: Boolean(process.env.TURNSTILE_SITE_KEY),
    bookingEmailTo: Boolean(process.env.BOOKING_EMAIL_TO),
    bookingEmailFrom: Boolean(process.env.BOOKING_EMAIL_FROM),
    adminPassword: Boolean(process.env.ADMIN_PASSWORD),
  };

  const checks = {};
  try {
    requireEnv("SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const blockedDates = await supabaseFetch("blocked_dates?select=id&limit=1");
    checks.blockedDates = { ok: true, count: blockedDates.length };
  } catch (error) {
    checks.blockedDates = { ok: false, error: error.message };
  }

  try {
    requireEnv("SUPABASE_URL");
    requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    const bookingRequests = await supabaseFetch("booking_requests?select=id&limit=1");
    checks.bookingRequests = { ok: true, count: bookingRequests.length };
  } catch (error) {
    checks.bookingRequests = { ok: false, error: error.message };
  }

  return json(res, 200, { ok: true, env, checks });
};
