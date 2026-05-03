const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer'); // ต้องติดตั้งเพิ่ม: npm install multer

const app = express();
const upload = multer({ dest: 'uploads/' }); // โฟลเดอร์พักไฟล์ชั่วคราว

// --- 1. การตั้งค่าพื้นฐาน ---
app.use(express.json()); // รองรับการรับข้อมูลแบบ JSON
const publicPath = path.join(__dirname, 'public');

// --- 2. API สำหรับตรวจสอบสลิป (เพิ่มส่วนนี้) ---
app.post('/verify-slip', upload.single('slip'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "ไม่พบไฟล์ที่อัปโหลด" });
        }

        // TODO: ใส่โค้ดเชื่อมต่อ API SlipOK ตรงนี้
        
        // ตัวอย่างการส่งผลลัพธ์กลับเป็น JSON ที่ถูกต้อง
        res.json({ success: true, message: "ได้รับไฟล์เรียบร้อยแล้ว", fileName: req.file.filename });
    } catch (error) {
        // ส่ง Error กลับเป็น JSON เสมอเพื่อป้องกัน Unexpected token '<'
        res.status(500).json({ success: false, message: error.message });
    } finally {
        // ลบไฟล์ชั่วคราวหลังใช้งาน (ถ้ามี)
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
});

// --- 3. Middleware สำหรับ Static Files ---
app.use(express.static(publicPath));

// --- 4. Route หลัก ---
app.get('/', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("<h1>404 ไม่พบหน้าเว็บ</h1>");
    }
});

// --- 5. การตั้งค่าพอร์ต ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 เซิร์ฟเวอร์ทำงานที่พอร์ต: ${PORT}`);
});
