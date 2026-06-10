export default async function handler(req, res) {
  // CORS — อนุญาตทุก origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "GET" || req.method === "OPTIONS") {
    return res.status(200).json({ ok: true, service: "send" });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const LINE_TOKEN = process.env.LINE_TOKEN;
  if (!LINE_TOKEN) {
    return res.status(500).json({ error: "LINE_TOKEN not configured" });
  }

  const { to, text, messages } = req.body || {};
  if (!to) return res.status(400).json({ error: "Missing 'to'" });

  // รองรับทั้ง text เดียวและ messages array
  const lineMessages = messages || [{ type: "text", text: text || "" }];
  if (!lineMessages.length) return res.status(400).json({ error: "No messages" });

  try {
    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_TOKEN}`
      },
      body: JSON.stringify({ to, messages: lineMessages })
    });

    const data = await r.json();

    if (!r.ok) {
      console.error("LINE API error:", data);
      return res.status(r.status).json({ error: "LINE API failed", detail: data });
    }

    return res.status(200).json({ success: true });
  } catch(e) {
    console.error("send error:", e);
    return res.status(500).json({ error: e.message });
  }
}
