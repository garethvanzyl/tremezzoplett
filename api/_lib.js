const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
};

function json(res, statusCode, payload) {
  res.writeHead(statusCode, JSON_HEADERS);
  res.end(JSON.stringify(payload));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        reject(new Error("Request body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded) return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress || "";
}

function sanitizeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function isIsoDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));
}

function dateRangeIsValid(startDate, endDate) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return false;
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  return Number.isFinite(start.valueOf()) && Number.isFinite(end.valueOf()) && start <= end;
}

async function supabaseFetch(path, options = {}) {
  const baseUrl = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = data?.message || data?.hint || response.statusText;
    throw new Error(`Supabase ${response.status}: ${message}`);
  }
  return data;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true, skipped: true };
  if (!token) return { ok: false };

  const params = new URLSearchParams();
  params.set("secret", secret);
  params.set("response", token);
  if (ip) params.set("remoteip", ip);

  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: params,
  });
  const result = await response.json();
  return { ok: Boolean(result.success), result };
}

async function sendEmail({ subject, html, replyTo }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { skipped: true };

  const from = process.env.BOOKING_EMAIL_FROM || "Tremezzo Plett <onboarding@resend.dev>";
  const to = process.env.BOOKING_EMAIL_TO || "lauren@foxstreetcomms.co.za";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: replyTo,
      subject,
      html,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || "Email failed");
  return data;
}

function adminAuthorized(req) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return false;
  return req.headers["x-admin-password"] === password;
}

module.exports = {
  adminAuthorized,
  dateRangeIsValid,
  getClientIp,
  isEmail,
  isIsoDate,
  json,
  readJson,
  sanitizeText,
  sendEmail,
  supabaseFetch,
  verifyTurnstile,
};
