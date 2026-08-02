const { json, sanitizeText, supabaseFetch } = require("./_lib");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const url = new URL(req.url, `https://${req.headers.host}`);
    const page = sanitizeText(url.searchParams.get("page"), 80);
    const filter = page ? `&page=eq.${encodeURIComponent(page)}` : "";
    const rows = await supabaseFetch(
      `content_blocks?select=key,value,kind${filter}&order=sort_order.asc`
    );
    const content = {};
    rows.forEach((row) => {
      content[row.key] = {
        kind: row.kind,
        value: row.value || "",
      };
    });
    return json(res, 200, { content });
  } catch (error) {
    console.error("content_error", error.message);
    return json(res, 200, { content: {}, fallback: true });
  }
};
