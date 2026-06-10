const LINE_TOKEN = process.env.LINE_TOKEN;
const FB = "https://programthanrich-default-rtdb.asia-southeast1.firebasedatabase.app";

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Line-Signature",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "GET" || event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ status: "ok" }) };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const events = body.events || [];

    for (const ev of events) {
      const userId = ev.source?.userId;
      if (!userId) continue;

      let name = userId, pic = null;
      try {
        const pr = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
          headers: { Authorization: `Bearer ${LINE_TOKEN}` }
        });
        if (pr.ok) { const d = await pr.json(); name = d.displayName; pic = d.pictureUrl; }
      } catch(_) {}

      const ts = new Date(ev.timestamp).toLocaleTimeString("th-TH", {hour:"2-digit",minute:"2-digit"});
      const msgId = "m" + (ev.message?.id || Date.now());
      const lastText = ev.message?.text || ev.type;

      if (ev.type === "message" && ev.message?.type === "text") {
        await fbPut(`${FB}/chats/${userId}/messages/${msgId}.json`, {
          id: msgId, from: "customer", text: ev.message.text, time: ts, ts: ev.timestamp
        });
      }

      await fbPatch(`${FB}/chats/${userId}/info.json`, {
        userId, displayName: name, pictureUrl: pic,
        lastMsg: lastText, lastTime: ts, lastTs: ev.timestamp, unread: true
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch(e) {
    return { statusCode: 200, headers, body: JSON.stringify({ ok: false, error: e.message }) };
  }
};

async function fbPut(url, data) {
  return fetch(url, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
}
async function fbPatch(url, data) {
  return fetch(url, { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify(data) });
}
