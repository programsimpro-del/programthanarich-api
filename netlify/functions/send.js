const LINE_TOKEN = process.env.LINE_TOKEN;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  try {
    const { to, text } = JSON.parse(event.body || "{}");
    if (!to || !text) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing to or text" }) };
    }

    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_TOKEN}`
      },
      body: JSON.stringify({ to, messages: [{ type: "text", text }] })
    });

    if (!r.ok) {
      const err = await r.json();
      return { statusCode: 500, headers, body: JSON.stringify({ error: "LINE failed", detail: err }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};
