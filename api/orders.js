// Simple in-memory orders store
const orders = global._orders || (global._orders = []);

export default function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method === "POST") {
    const order = req.body;
    if (!order || !order.ref) {
      return res.status(400).json({ error: "Missing ref" });
    }
    // ลบซ้ำ
    const idx = orders.findIndex(o => o.ref === order.ref);
    if (idx >= 0) orders.splice(idx, 1);
    orders.unshift(order);
    // เก็บแค่ 500 รายการ
    if (orders.length > 500) orders.length = 500;
    return res.status(200).json({ success: true, total: orders.length });
  }

  if (req.method === "GET") {
    return res.status(200).json({ orders, total: orders.length });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
