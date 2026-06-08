export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const LINE_TOKEN = process.env.LINE_TOKEN;
  const { to, text } = req.body;

  if (!to || !text) return res.status(400).json({ error: "Missing to or text" });

  try {
    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_TOKEN}`
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text }]
      })
    });

    if (!r.ok) {
      const err = await r.json();
      return res.status(500).json({ error: "LINE API failed", detail: err });
    }

    return res.status(200).json({ success: true });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
