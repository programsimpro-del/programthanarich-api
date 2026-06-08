// Webhook รับข้อความจาก LINE OA → เก็บใน Firebase
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(200).end(); // LINE ส่ง GET verify

  const FB_DB   = "https://programthanrich-default-rtdb.asia-southeast1.firebasedatabase.app";
  const FB_KEY  = process.env.FB_SERVICE_KEY || ""; // ไม่บังคับ (test mode เปิดอยู่)
  const LINE_TOKEN = process.env.LINE_TOKEN;

  try {
    const events = req.body?.events || [];

    for (const ev of events) {
      if (ev.type !== "message" || ev.message?.type !== "text") continue;

      const userId   = ev.source?.userId;
      const text     = ev.message?.text;
      const ts       = new Date(ev.timestamp).toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
      const msgId    = ev.message?.id || Date.now().toString();

      if (!userId || !text) continue;

      // 1. ดึงโปรไฟล์ LINE
      let displayName = userId;
      let pictureUrl  = null;
      try {
        const pr = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
          headers: { Authorization: `Bearer ${LINE_TOKEN}` }
        });
        if (pr.ok) {
          const pd = await pr.json();
          displayName = pd.displayName || userId;
          pictureUrl  = pd.pictureUrl  || null;
        }
      } catch(_) {}

      // 2. บันทึกข้อความใน Firebase /chats/{userId}/messages/{msgId}
      const msgData = {
        id: msgId, from: "customer", text, time: ts,
        timestamp: ev.timestamp
      };
      await fetch(`${FB_DB}/chats/${userId}/messages/${msgId}.json`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgData)
      });

      // 3. อัพเดทข้อมูล user
      await fetch(`${FB_DB}/chats/${userId}/info.json`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId, displayName, pictureUrl,
          lastMessage: text, lastTime: ts,
          lastTimestamp: ev.timestamp, unread: true
        })
      });
    }

    return res.status(200).json({ ok: true });
  } catch(e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
