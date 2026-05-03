const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

// --- 1. ตั้งค่า Path ให้ตรงกับโครงสร้าง GitHub ของคุณ ---
// __dirname จะชี้ไปที่โฟลเดอร์ราก (ที่มี server.js อยู่)
const publicPath = path.join(__dirname, 'public');

// ตรวจสอบใน Logs ของ Render ว่าหาโฟลเดอร์เจอไหม
console.log(`📁 กำลังตรวจสอบโฟลเดอร์สาธารณะที่: ${publicPath}`);
if (fs.existsSync(publicPath)) {
    console.log("✅ พบโฟลเดอร์ 'public' เรียบร้อยแล้ว");
} else {
    console.error("❌ ไม่พบโฟลเดอร์ 'public' กรุณาตรวจสอบการตั้งค่า");
}

// --- 2. Middleware สำหรับ Static Files ---
app.use(express.static(publicPath));

// --- 3. Route หลัก ---
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("<h1>404 ไม่พบหน้าเว็บ</h1><p>เซิร์ฟเวอร์หาไฟล์ index.html ไม่พบในโฟลเดอร์ public</p>");
    }
});

// --- 4. การตั้งค่าพอร์ต ---
// ใช้ 10000 สำหรับ Render หรือ 3000 สำหรับการทดสอบส่วนตัว
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต: ${PORT}`);
});
