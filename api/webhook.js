export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Line-Signature");

  // LINE ส่ง GET มา verify
  if (req.method === "GET" || req.method === "OPTIONS") {
    return res.status(200).json({ status: "ok" });
  }
  if (req.method !== "POST") return res.status(200).end();

  const FB  = "https://programthanrich-default-rtdb.asia-southeast1.firebasedatabase.app";
  const TOK = process.env.LINE_TOKEN;

  try {
    const events = req.body?.events || [];

    for (const ev of events) {
      const userId = ev.source?.userId;
      if (!userId) continue;

      // ดึงโปรไฟล์
      let name = userId, pic = null;
      try {
        const pr = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
          headers: { Authorization: `Bearer ${TOK}` }
        });
        if (pr.ok) { const d = await pr.json(); name = d.displayName; pic = d.pictureUrl; }
      } catch(_) {}

      const ts = new Date(ev.timestamp).toLocaleTimeString("th-TH", {hour:"2-digit",minute:"2-digit"});
      const msgId = "m" + (ev.message?.id || Date.now());

      // ข้อความ text
      if (ev.type === "message" && ev.message?.type === "text") {
        await fbPut(`${FB}/chats/${userId}/messages/${msgId}.json`, {
          id: msgId, from: "customer", text: ev.message.text, time: ts, ts: ev.timestamp
        });
      }
      // follow event
      else if (ev.type === "follow") {
        await fbPut(`${FB}/chats/${userId}/messages/${msgId}.json`, {
          id: msgId, from: "customer", text: "เพิ่มเพื่อนแล้ว", time: ts, ts: ev.timestamp
        });
      }

      // อัพเดท info
      const lastText = ev.message?.text || (ev.type === "follow" ? "เพิ่มเพื่อนแล้ว" : ev.type);
      await fbPatch(`${FB}/chats/${userId}/info.json`, {
        userId, displayName: name, pictureUrl: pic,
        lastMsg: lastText, lastTime: ts, lastTs: ev.timestamp, unread: true
      });
    }

    return res.status(200).json({ ok: true });
  } catch(e) {
    console.error(e);
    return res.status(200).json({ ok: false, error: e.message });
  }
}

async function fbPut(url, data) {
  return fetch(url, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
}
async function fbPatch(url, data) {
  return fetch(url, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
}
