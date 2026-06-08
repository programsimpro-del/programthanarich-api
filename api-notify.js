export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const LINE_TOKEN    = process.env.LINE_TOKEN;
    const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
    const ADMIN_URL     = process.env.ADMIN_URL;
    const { refNo, orderNo, simPhone, pkgName, platform, lineDisplayName } = req.body;
    if (!refNo || !orderNo) return res.status(400).json({ error: "Missing fields" });

    const PLTS = { shopee:"🛍️ Shopee", lazada:"🛒 Lazada", tiktok:"🎵 TikTok Shop" };
    const adminLink = `${ADMIN_URL}?ref=${refNo}`;

    const flex = {
      type: "flex",
      altText: `📦 คำสั่งซื้อใหม่! ${orderNo}`,
      contents: {
        type: "bubble", size: "mega",
        header: {
          type: "box", layout: "vertical", backgroundColor: "#FF5722", paddingAll: "14px",
          contents: [
            { type:"text", text:"📦 มีคำสั่งซื้อใหม่!", weight:"bold", size:"lg", color:"#fff" },
            { type:"text", text:`เลขอ้างอิง: ${refNo}`, size:"sm", color:"rgba(255,255,255,.85)", margin:"sm" }
          ]
        },
        body: {
          type:"box", layout:"vertical", paddingAll:"14px", spacing:"sm",
          contents: [
            { type:"box", layout:"horizontal", contents:[{type:"text",text:"🛍️ แพลตฟอร์ม",size:"sm",color:"#9E9E9E",flex:2},{type:"text",text:PLTS[platform]||platform||"-",size:"sm",weight:"bold",flex:3,wrap:true}]},
            { type:"box", layout:"horizontal", contents:[{type:"text",text:"📦 เลขพัสดุ",size:"sm",color:"#9E9E9E",flex:2},{type:"text",text:orderNo,size:"sm",weight:"bold",color:"#E53935",flex:3,wrap:true}]},
            { type:"box", layout:"horizontal", contents:[{type:"text",text:"📱 เบอร์ซิม",size:"sm",color:"#9E9E9E",flex:2},{type:"text",text:simPhone||"-",size:"sm",weight:"bold",flex:3}]},
            { type:"box", layout:"horizontal", contents:[{type:"text",text:"🎁 แพ็คเกจ",size:"sm",color:"#9E9E9E",flex:2},{type:"text",text:pkgName||"-",size:"sm",weight:"bold",flex:3,wrap:true}]},
            { type:"box", layout:"horizontal", contents:[{type:"text",text:"👤 ชื่อ LINE",size:"sm",color:"#9E9E9E",flex:2},{type:"text",text:lineDisplayName||"-",size:"sm",weight:"bold",flex:3}]},
            { type:"separator", margin:"md" },
            { type:"text", text:"⏳ รอการตรวจสอบจาก Admin", size:"xs", color:"#E65100", margin:"md", weight:"bold" }
          ]
        },
        footer: {
          type:"box", layout:"vertical", paddingAll:"12px", spacing:"sm",
          contents: [
            { type:"button", style:"primary", color:"#1565C0", height:"sm", action:{type:"uri",label:"🔍 ตรวจสอบคำสั่งซื้อ",uri:adminLink}},
            { type:"button", style:"secondary", height:"sm", action:{type:"clipboard",label:"📋 คัดลอกเลขพัสดุ",clipboardText:orderNo}}
          ]
        }
      }
    };

    // บันทึก order ไว้ใน orders endpoint
    try {
      const ordersUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/orders`;
      await fetch(ordersUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(req.body)
      });
    } catch(e) { console.warn("save order failed", e); }

    const r = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { "Content-Type":"application/json", "Authorization":`Bearer ${LINE_TOKEN}` },
      body: JSON.stringify({ to: ADMIN_USER_ID, messages: [flex] })
    });

    if (!r.ok) {
      const err = await r.json();
      return res.status(500).json({ error: "LINE API failed", detail: err });
    }

    return res.status(200).json({ success: true, refNo });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
