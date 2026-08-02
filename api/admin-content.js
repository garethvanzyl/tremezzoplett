const { adminAuthorized, json, readJson, sanitizeText, supabaseFetch } = require("./_lib");

function cleanBlocks(blocks) {
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((block) => ({
      key: sanitizeText(block.key, 120),
      value: sanitizeText(block.value, 6000),
    }))
    .filter((block) => block.key);
}

module.exports = async function handler(req, res) {
  if (!adminAuthorized(req)) {
    return json(res, 401, { error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const rows = await supabaseFetch(
        "content_blocks?select=key,page,label,kind,value,sort_order&order=sort_order.asc"
      );
      return json(res, 200, { blocks: rows });
    }

    if (req.method === "PUT") {
      const body = await readJson(req);
      const blocks = cleanBlocks(body.blocks);
      if (!blocks.length) return json(res, 400, { error: "No content changes found." });

      const updates = await Promise.all(
        blocks.map((block) =>
          supabaseFetch(`content_blocks?key=eq.${encodeURIComponent(block.key)}`, {
            method: "PATCH",
            headers: { prefer: "return=representation" },
            body: JSON.stringify({ value: block.value, updated_at: new Date().toISOString() }),
          })
        )
      );

      return json(res, 200, { blocks: updates.flat() });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (error) {
    console.error("admin_content_error", error.message);
    const setupRequired = error.message && error.message.startsWith("Missing ");
    return json(res, setupRequired ? 503 : 500, {
      error: setupRequired ? "The content backend is not configured yet." : "Could not update content.",
    });
  }
};
