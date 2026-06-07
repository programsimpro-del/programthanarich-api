// In-memory store (รีเซ็ตเมื่อ cold start แต่ใช้ได้ระหว่าง requests)
// ใช้ Vercel KV หรือ database จริงๆ ถ้าต้องการ persistent
let orders = [];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // POST — บันทึก order ใหม่
  if (req.method === "POST") {
    const order = req.body;
    if (!order || !order.ref) return res.status(400).json({ error: "Missing ref" });
    // ลบ order เก่าที่ ref เดียวกันออกก่อน (ถ้ามี)
    orders = orders.filter(o => o.ref !== order.ref);
    orders.unshift(order);
    // เก็บแค่ 200 รายการล่าสุด
    if (orders.length > 200) orders = orders.slice(0, 200);
    return res.status(200).json({ success: true });
  }

  // GET — ดึง orders ทั้งหมด
  if (req.method === "GET") {
    return res.status(200).json({ orders });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
